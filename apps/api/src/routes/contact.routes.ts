import { Router } from "express";
import { z } from "zod";
import { ContactModel } from "@linkedon/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";

export const contactRouter = Router();
contactRouter.use(authenticate);

// GET /contacts
contactRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const workspaceId = req.workspaceId;
  if (!workspaceId) throw HttpErrors.badRequest("Workspace required");

  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { workspaceId };
  if (req.query.q) {
    query.$text = { $search: String(req.query.q) };
  }
  if (req.query.company) query.company = new RegExp(String(req.query.company), "i");
  if (req.query.listId) query.listIds = req.query.listId;

  const [contacts, total] = await Promise.all([
    ContactModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactModel.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: contacts,
    meta: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
});

// GET /contacts/:id
contactRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const contact = await ContactModel.findOne({
    _id: req.params.id,
    workspaceId: req.workspaceId,
  });
  if (!contact) throw HttpErrors.notFound("Contact not found");
  res.json({ success: true, data: contact });
});

// POST /contacts
contactRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    fullName: z.string().trim().optional(),
    jobTitle: z.string().trim().optional(),
    company: z.string().trim().optional(),
    companyDomain: z.string().trim().optional(),
    location: z.string().trim().optional(),
    emails: z.array(z.object({
      value: z.string().email(),
      source: z.string(),
      isPrimary: z.boolean().default(false),
      confidence: z.number().min(0).max(1).default(0),
    })).default([]),
    phones: z.array(z.object({
      value: z.string(),
      source: z.string(),
      isPrimary: z.boolean().default(false),
      confidence: z.number().min(0).max(1).default(0),
    })).default([]),
    tags: z.array(z.string()).default([]),
    notes: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());

  const contact = await ContactModel.create({
    ...parsed.data,
    workspaceId: req.workspaceId,
    createdBy: req.user!._id,
    sources: [],
    socialProfiles: [],
    listIds: [],
    enrichmentIds: [],
  });

  res.status(201).json({ success: true, data: contact });
});

// PATCH /contacts/:id
contactRouter.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const contact = await ContactModel.findOneAndUpdate(
    { _id: req.params.id, workspaceId: req.workspaceId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!contact) throw HttpErrors.notFound("Contact not found");
  res.json({ success: true, data: contact });
});

// DELETE /contacts/:id
contactRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const contact = await ContactModel.findOneAndDelete({
    _id: req.params.id,
    workspaceId: req.workspaceId,
  });
  if (!contact) throw HttpErrors.notFound("Contact not found");
  res.json({ success: true, data: { message: "Contact deleted" } });
});
