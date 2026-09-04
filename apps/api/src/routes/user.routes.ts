import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { UserModel } from "@linkedon/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";

export const userRouter = Router();
userRouter.use(authenticate);

// GET /users/me
userRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const user = await UserModel.findById(req.user!._id);
  if (!user) throw HttpErrors.notFound("User not found");
  res.json({ success: true, data: user });
});

// PATCH /users/me
userRouter.patch("/me", async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    avatar: z.string().url().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());

  const user = await UserModel.findByIdAndUpdate(req.user!._id, parsed.data, { new: true });
  res.json({ success: true, data: user });
});

// PATCH /users/me/password
userRouter.patch("/me/password", async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());

  const user = await UserModel.findById(req.user!._id).select("+passwordHash");
  if (!user) throw HttpErrors.notFound();

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) throw HttpErrors.badRequest("Current password is incorrect");

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await UserModel.findByIdAndUpdate(req.user!._id, { passwordHash });

  res.json({ success: true, data: { message: "Password updated" } });
});

// PATCH /users/me/onboarding
userRouter.patch("/me/onboarding", async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    step: z.number().int().min(0).max(5),
    completed: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed");

  const update: Record<string, unknown> = { onboardingStep: parsed.data.step };
  if (parsed.data.completed) update.onboardingCompleted = true;

  await UserModel.findByIdAndUpdate(req.user!._id, update);
  res.json({ success: true, data: { message: "Onboarding updated" } });
});
