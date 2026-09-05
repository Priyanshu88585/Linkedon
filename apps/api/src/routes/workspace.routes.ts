import { Router } from "express";
import { z } from "zod";
import { WorkspaceModel, WorkspaceMemberModel, UserModel } from "@linkedon/database";
import { WorkspaceMemberRole } from "@linkedon/types";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";

export const workspaceRouter = Router();
workspaceRouter.use(authenticate);

// ─── GET /workspaces/me ────────────────────────────────────────────────────────
// Get all workspaces the user belongs to
workspaceRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const user = await UserModel.findById(req.user!._id);
  if (!user) throw HttpErrors.notFound("User not found");

  const workspaces = await WorkspaceModel.find({
    _id: { $in: user.workspaceIds }
  });
  res.json({ success: true, data: workspaces });
});

// ─── GET /workspaces/:id ───────────────────────────────────────────────────────
// Get a specific workspace
workspaceRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  
  const user = await UserModel.findById(req.user!._id);
  if (!user) throw HttpErrors.notFound("User not found");

  // Verify user is in this workspace
  if (!user.workspaceIds.some((wId: any) => wId.toString() === id)) {
    throw HttpErrors.forbidden("You do not have access to this workspace");
  }

  const workspace = await WorkspaceModel.findById(id);
  if (!workspace) throw HttpErrors.notFound("Workspace not found");

  res.json({ success: true, data: workspace });
});

// ─── PATCH /workspaces/:id ─────────────────────────────────────────────────────
// Update workspace settings (Owner only)
workspaceRouter.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  // Verify ownership
  const workspace = await WorkspaceModel.findById(id);
  if (!workspace) throw HttpErrors.notFound("Workspace not found");
  
  if (workspace.ownerId.toString() !== req.user!._id.toString()) {
    throw HttpErrors.forbidden("Only the workspace owner can update settings");
  }

  const schema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    settings: z.object({
      allowMemberInvites: z.boolean().optional(),
      defaultCreditPolicy: z.enum(["charge_on_success", "charge_on_attempt"]).optional(),
      dataRetentionDays: z.number().int().min(1).max(3650).optional(),
      timezone: z.string().optional()
    }).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());

  // Deep merge settings
  const updateData: any = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  
  if (parsed.data.settings) {
    updateData.settings = { ...workspace.settings, ...parsed.data.settings };
  }

  const updatedWorkspace = await WorkspaceModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );

  res.json({ success: true, data: updatedWorkspace });
});

// ─── GET /workspaces/:id/members ───────────────────────────────────────────────
// List all members in the workspace
workspaceRouter.get("/:id/members", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const user = await UserModel.findById(req.user!._id);
  if (!user) throw HttpErrors.notFound("User not found");

  if (!user.workspaceIds.some((wId: any) => wId.toString() === id)) {
    throw HttpErrors.forbidden("You do not have access to this workspace");
  }

  // Fetch the members, including pending invites (they might not have users yet if we invited by email, 
  // but since we don't have a separate Invite model, we assume the user must be created first or we mock it)
  // For this mock implementation, we'll return users in the workspace.
  const users = await UserModel.find({ workspaceIds: id }).select("name email avatar role status");
  
  const members = await WorkspaceMemberModel.find({ workspaceId: id });

  res.json({ success: true, data: { users, members } });
});

// ─── POST /workspaces/:id/invites ──────────────────────────────────────────────
// Invite a new member
workspaceRouter.post("/:id/invites", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const workspace = await WorkspaceModel.findById(id);
  if (!workspace) throw HttpErrors.notFound("Workspace not found");

  if (workspace.ownerId.toString() !== req.user!._id.toString() && !workspace.settings.allowMemberInvites) {
    throw HttpErrors.forbidden("Only the workspace owner can invite members");
  }

  const schema = z.object({
    email: z.string().email().toLowerCase().trim(),
    role: z.enum([WorkspaceMemberRole.MEMBER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.OWNER]).default(WorkspaceMemberRole.MEMBER)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());

  const { email, role } = parsed.data;

  // Since we are mocking email sending, let's check if user exists.
  // If not, we just mock that an email was sent.
  let user = await UserModel.findOne({ email });
  
  if (user) {
    // If user exists, add them to the workspace directly for this MVP
    const isAlreadyMember = await WorkspaceMemberModel.findOne({ workspaceId: id, userId: user._id });
    if (isAlreadyMember) {
      throw HttpErrors.conflict("User is already in this workspace");
    }

    await WorkspaceMemberModel.create({
      workspaceId: id,
      userId: user._id,
      role: role,
      invitedBy: req.user!._id,
      acceptedAt: new Date()
    });

    await UserModel.findByIdAndUpdate(user._id, {
      $push: { workspaceIds: id }
    });

    console.log(`[DEV] User ${email} added to workspace ${workspace.name}`);
  } else {
    // Mock invite logic
    console.log(`[DEV] Mock email sent to ${email} to join workspace ${workspace.name}`);
  }

  res.status(201).json({ 
    success: true, 
    data: { 
      message: `Invite sent to ${email}.`,
      mockLink: `http://localhost:3000/register?invite=${id}` 
    } 
  });
});

// ─── DELETE /workspaces/:id/members/:userId ────────────────────────────────────
// Remove a member
workspaceRouter.delete("/:id/members/:userId", async (req: AuthenticatedRequest, res) => {
  const { id, userId } = req.params;

  const workspace = await WorkspaceModel.findById(id);
  if (!workspace) throw HttpErrors.notFound("Workspace not found");

  // Only owner can remove others
  if (workspace.ownerId.toString() !== req.user!._id.toString() && req.user!._id.toString() !== userId) {
    throw HttpErrors.forbidden("Only the workspace owner can remove members");
  }

  if (workspace.ownerId.toString() === userId) {
    throw HttpErrors.badRequest("Cannot remove the workspace owner");
  }

  await WorkspaceMemberModel.findOneAndDelete({ workspaceId: id, userId });
  await UserModel.findByIdAndUpdate(userId, {
    $pull: { workspaceIds: id }
  });

  res.json({ success: true, data: { message: "Member removed successfully" } });
});
