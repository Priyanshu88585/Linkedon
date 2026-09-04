import { Router } from "express";
import { z } from "zod";
import { ListModel, ListMemberModel, ContactModel } from "@linkedon/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";

export const listRouter = Router();
listRouter.use(authenticate);

listRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const lists = await ListModel.find({ workspaceId: req.workspaceId }).sort({ createdAt: -1 });
  res.json({ success: true, data: lists });
});

listRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed");
  const list = await ListModel.create({ ...parsed.data, workspaceId: req.workspaceId, createdBy: req.user!._id });
  res.status(201).json({ success: true, data: list });
});

listRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const list = await ListModel.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
  if (!list) throw HttpErrors.notFound("List not found");
  const contacts = await ListMemberModel.find({ listId: list._id }).populate("contactId");
  res.json({ success: true, data: { ...list.toObject(), contacts } });
});

listRouter.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const list = await ListModel.findOneAndUpdate(
    { _id: req.params.id, workspaceId: req.workspaceId },
    { $set: req.body },
    { new: true }
  );
  if (!list) throw HttpErrors.notFound("List not found");
  res.json({ success: true, data: list });
});

listRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const list = await ListModel.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspaceId });
  if (!list) throw HttpErrors.notFound("List not found");
  await ListMemberModel.deleteMany({ listId: list._id });
  res.json({ success: true, data: { message: "List deleted" } });
});

listRouter.post("/:id/contacts", async (req: AuthenticatedRequest, res) => {
  const { contactId } = req.body;
  if (!contactId) throw HttpErrors.badRequest("contactId required");
  const list = await ListModel.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
  if (!list) throw HttpErrors.notFound("List not found");
  const contact = await ContactModel.findOne({ _id: contactId, workspaceId: req.workspaceId });
  if (!contact) throw HttpErrors.notFound("Contact not found");
  await ListMemberModel.findOneAndUpdate(
    { listId: list._id, contactId },
    { listId: list._id, contactId, addedBy: req.user!._id, addedAt: new Date() },
    { upsert: true }
  );
  await ListModel.findByIdAndUpdate(list._id, { $inc: { contactCount: 1 } });
  res.json({ success: true, data: { message: "Contact added to list" } });
});
