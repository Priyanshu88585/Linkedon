import { Router } from "express";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { ApiKeyModel } from "@linkedon/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";

export const apiKeyRouter = Router();
apiKeyRouter.use(authenticate);

apiKeyRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const keys = await ApiKeyModel.find({ workspaceId: req.workspaceId, status: "active" });
  res.json({ success: true, data: keys });
});

apiKeyRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const { name, scopes = [], expiresAt } = req.body;
  if (!name) throw HttpErrors.badRequest("API key name required");

  // Generate key: lnk_ prefix + 40 random chars
  const rawKey = `lnk_${nanoid(40)}`;
  const prefix = rawKey.slice(0, 12);  // "lnk_" + 8 chars
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await ApiKeyModel.create({
    workspaceId: req.workspaceId,
    userId: req.user!._id,
    name,
    prefix,
    keyHash,
    scopes,
    status: "active",
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  res.status(201).json({
    success: true,
    data: {
      apiKey: { ...apiKey.toObject(), keyHash: undefined },
      rawKey, // Shown ONCE — store it securely
    },
  });
});

apiKeyRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const key = await ApiKeyModel.findOneAndUpdate(
    { _id: req.params.id, workspaceId: req.workspaceId },
    { status: "revoked" },
    { new: true }
  );
  if (!key) throw HttpErrors.notFound("API key not found");
  res.json({ success: true, data: { message: "API key revoked" } });
});
