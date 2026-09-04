import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "@linkedon/database";
import { ApiKeyModel } from "@linkedon/database";
import { UserRole } from "@linkedon/types";
import { config } from "../config";
import { HttpErrors } from "./error.middleware";
import crypto from "crypto";

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: UserRole;
    workspaceId?: string;
  };
  workspaceId?: string;
}

// ─── JWT Authentication ───────────────────────────────────────────────────────

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers["x-api-key"] as string;

  // Try API key auth first
  if (apiKey) {
    await authenticateApiKey(req, apiKey, next);
    return;
  }

  // Fall back to JWT auth
  if (!authHeader?.startsWith("Bearer ")) {
    return next(HttpErrors.unauthorized("No authentication token provided"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      email: string;
      role: UserRole;
      workspaceId?: string;
    };

    req.user = {
      _id: payload.sub,
      email: payload.email,
      role: payload.role,
      workspaceId: payload.workspaceId,
    };
    req.workspaceId = payload.workspaceId;

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(HttpErrors.unauthorized("Token expired"));
    }
    return next(HttpErrors.unauthorized("Invalid token"));
  }
}

// ─── API Key Authentication ───────────────────────────────────────────────────

async function authenticateApiKey(
  req: AuthenticatedRequest,
  rawKey: string,
  next: NextFunction
): Promise<void> {
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await ApiKeyModel.findOne({
    keyHash,
    status: "active",
  }).select("+keyHash");

  if (!apiKey) {
    return next(HttpErrors.unauthorized("Invalid API key"));
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return next(HttpErrors.unauthorized("API key expired"));
  }

  // Update last used
  ApiKeyModel.findByIdAndUpdate(apiKey._id, {
    lastUsedAt: new Date(),
    $inc: { requestCount: 1 },
  }).exec();

  const user = await UserModel.findById(apiKey.userId);
  if (!user) return next(HttpErrors.unauthorized("User not found"));

  req.user = {
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    workspaceId: apiKey.workspaceId.toString(),
  };
  req.workspaceId = apiKey.workspaceId.toString();

  next();
}

// ─── Role Guards ──────────────────────────────────────────────────────────────

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(HttpErrors.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(HttpErrors.forbidden("Insufficient permissions"));
    }
    next();
  };
}

export const requireAdmin = requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);
