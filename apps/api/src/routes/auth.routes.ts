import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserModel, WorkspaceModel, CreditBalanceModel, SubscriptionModel, PlanModel } from "@linkedon/database";
import { UserRole, UserStatus, SubscriptionStatus, PlanName } from "@linkedon/types";
import { config } from "../config";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";
import { HttpErrors } from "../middleware/error.middleware";

export const authRouter = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and a number"
  ),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

// ─── Token Helpers ────────────────────────────────────────────────────────────

function generateTokens(userId: string, email: string, role: UserRole, workspaceId?: string) {
  const payload = { sub: userId, email, role, workspaceId };
  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry as any,
  });
  const refreshToken = jwt.sign(
    { sub: userId, type: "refresh" },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiry as any }
  );
  return { accessToken, refreshToken, expiresIn: 15 * 60 };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

authRouter.post("/register", authRateLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());
  }
  const { name, email, password } = parsed.data;

  // Check duplicate
  const existing = await UserModel.findOne({ email });
  if (existing) throw HttpErrors.conflict("An account with this email already exists");

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  // Create user
  const user = await UserModel.create({
    name,
    email,
    passwordHash,
    emailVerificationToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: UserStatus.PENDING_VERIFICATION,
    emailVerified: false,
  });

  // Create workspace
  let slug = slugify(name);
  const existingSlug = await WorkspaceModel.findOne({ slug });
  if (existingSlug) slug = `${slug}-${Date.now()}`;

  const freePlan = await PlanModel.findOne({ name: PlanName.FREE });
  if (!freePlan) throw HttpErrors.internal("Plan configuration error");

  const workspace = await WorkspaceModel.create({
    name: `${name}'s Workspace`,
    slug,
    ownerId: user._id,
    planId: freePlan._id,
    settings: {
      allowMemberInvites: true,
      defaultCreditPolicy: "charge_on_success",
      dataRetentionDays: 365,
      timezone: "UTC",
    },
  });

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { workspaceIds: workspace._id },
    currentWorkspaceId: workspace._id,
  });

  // Free plan credits
  await CreditBalanceModel.create({
    workspaceId: workspace._id,
    balance: freePlan.monthlyCredits,
    lifetimeUsed: 0,
  });

  await SubscriptionModel.create({
    workspaceId: workspace._id,
    planId: freePlan._id,
    stripeCustomerId: `cus_pending_${user._id}`,
    status: SubscriptionStatus.ACTIVE,
    interval: "monthly",
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
  });

  const tokens = generateTokens(user._id.toString(), email, user.role, workspace._id.toString());

  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        onboardingCompleted: false,
      },
      workspace: {
        _id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
      },
      tokens,
    },
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

authRouter.post("/login", authRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());

  const { email, password } = parsed.data;

  const user = await UserModel.findOne({ email }).select("+passwordHash");
  if (!user) throw HttpErrors.unauthorized("Invalid email or password");
  if (user.status === UserStatus.SUSPENDED) throw HttpErrors.forbidden("Account suspended");

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw HttpErrors.unauthorized("Invalid email or password");

  // Update last login
  await UserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  const workspaceId = user.currentWorkspaceId?.toString();
  const tokens = generateTokens(user._id.toString(), email, user.role, workspaceId);

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified,
        onboardingCompleted: user.onboardingCompleted,
        currentWorkspaceId: user.currentWorkspaceId,
      },
      tokens,
    },
  });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw HttpErrors.badRequest("Refresh token required");

  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as {
      sub: string;
      type: string;
    };

    if (payload.type !== "refresh") throw new Error("Invalid token type");

    const user = await UserModel.findById(payload.sub);
    if (!user || user.status === UserStatus.SUSPENDED) {
      throw HttpErrors.unauthorized();
    }

    const tokens = generateTokens(
      user._id.toString(),
      user.email,
      user.role,
      user.currentWorkspaceId?.toString()
    );

    res.json({ success: true, data: { tokens } });
  } catch {
    throw HttpErrors.unauthorized("Invalid or expired refresh token");
  }
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

authRouter.post("/forgot-password", authRateLimiter, async (req, res) => {
  const schema = z.object({ email: z.string().email().toLowerCase() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Valid email required");

  const user = await UserModel.findOne({ email: parsed.data.email });

  // Always return success to prevent email enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await UserModel.findByIdAndUpdate(user._id, {
      passwordResetToken: crypto.createHash("sha256").update(token).digest("hex"),
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
    // TODO: Send email with reset link: ${config.appUrl}/reset-password?token=${token}
    console.log(`[DEV] Password reset token for ${user.email}: ${token}`);
  }

  res.json({
    success: true,
    data: { message: "If that email exists, a reset link has been sent." },
  });
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────

authRouter.post("/reset-password", async (req, res) => {
  const schema = z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());

  const hashedToken = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) throw HttpErrors.badRequest("Invalid or expired reset token");

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await UserModel.findByIdAndUpdate(user._id, {
    passwordHash,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
    status: UserStatus.ACTIVE,
  });

  res.json({ success: true, data: { message: "Password updated successfully" } });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

authRouter.get("/me", authenticate, async (req: AuthenticatedRequest, res) => {
  const user = await UserModel.findById(req.user!._id);
  if (!user) throw HttpErrors.notFound("User not found");

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
      currentWorkspaceId: user.currentWorkspaceId,
      workspaceIds: user.workspaceIds,
    },
  });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

authRouter.post("/logout", authenticate, async (_req, res) => {
  // JWT is stateless — client deletes the token
  // For refresh token revocation, add to a Redis blocklist here
  res.json({ success: true, data: { message: "Logged out successfully" } });
});
