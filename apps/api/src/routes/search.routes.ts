import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { ContactModel, SearchHistoryModel } from "@linkedon/database";
import { HttpErrors } from "../middleware/error.middleware";

export const searchRouter = Router();
searchRouter.use(authenticate);

searchRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const { query, filters = {}, page = 1, limit: rawLimit = 20 } = req.body;
  const limit = Math.min(rawLimit, 100);
  const skip = (page - 1) * limit;
  const workspaceId = req.workspaceId!;

  const mongoQuery: Record<string, unknown> = { workspaceId };
  if (query) mongoQuery.$text = { $search: query };
  if (filters.company) mongoQuery.company = new RegExp(filters.company, "i");
  if (filters.hasEmail) mongoQuery["emails.0"] = { $exists: true };
  if (filters.hasPhone) mongoQuery["phones.0"] = { $exists: true };
  if (filters.listId) mongoQuery.listIds = filters.listId;

  const [contacts, total] = await Promise.all([
    ContactModel.find(mongoQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactModel.countDocuments(mongoQuery),
  ]);

  if (query) {
    SearchHistoryModel.create({
      userId: req.user!._id,
      workspaceId,
      query,
      filters,
      resultCount: total,
    }).catch(() => {});
  }

  res.json({
    success: true,
    data: contacts,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

searchRouter.get("/history", async (req: AuthenticatedRequest, res) => {
  const history = await SearchHistoryModel.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ success: true, data: history });
});
