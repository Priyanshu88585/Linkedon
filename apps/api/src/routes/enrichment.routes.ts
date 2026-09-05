import { Router } from "express";
import { z } from "zod";
import { EnrichmentModel, CreditBalanceModel, ContactModel } from "@linkedon/database";
import { EnrichmentInputType, EnrichmentStatus } from "@linkedon/types";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { enrichmentRateLimiter } from "../middleware/rate-limit.middleware";
import { HttpErrors } from "../middleware/error.middleware";
import { enrichmentQueue } from "../queues/enrichment.queue";
import { providerManager } from "../services/provider-manager.service";

export const enrichmentRouter = Router();
enrichmentRouter.use(authenticate);

const enrichmentSchema = z.object({
  input: z.string().min(1).max(2000),
  inputType: z.nativeEnum(EnrichmentInputType),
  saveContact: z.boolean().default(true),
  idempotencyKey: z.string().max(128).optional(),
});

// POST /enrichment/person
enrichmentRouter.post("/person", async (req: AuthenticatedRequest, res) => {
  const { email, firstName, lastName, companyName, companyDomain, linkedinUrl } = req.body;

  if (!email && !(firstName && lastName && companyName) && !linkedinUrl) {
    throw HttpErrors.badRequest("Insufficient parameters for enrichment. Need email, linkedinUrl, or Name + Company.");
  }

  // Orchestrated enrichment waterfall
  const result = await providerManager.enrichPerson({
    email,
    firstName,
    lastName,
    companyName,
    companyDomain,
    linkedinUrl,
  });

  // Log the attempt for billing & analytics
  await EnrichmentModel.create({
    workspaceId: req.workspaceId,
    userId: req.user!._id,
    targetType: "person",
    targetIdentifier: email || linkedinUrl || `${firstName} ${lastName}`,
    provider: result.provider,
    status: result.success ? EnrichmentStatus.COMPLETED : EnrichmentStatus.FAILED,
    creditsCost: result.success ? 1 : 0, // Deduct 1 credit if successful
    metadata: { latencyMs: result.latencyMs },
  });

  if (!result.success || !result.data) {
    return res.status(404).json(result);
  }

  // Save enriched contact to DB automatically
  const contact = await ContactModel.create({
    workspaceId: req.workspaceId,
    ...result.data,
    enrichedAt: new Date(),
    enrichedBy: req.user!._id,
    enrichmentProvider: result.provider,
  });

  res.json({
    success: true,
    data: {
      contact,
      providerMetadata: {
        provider: result.provider,
        confidence: result.confidence,
        latencyMs: result.latencyMs,
        isMocked: result.isMocked,
      }
    }
  });
});

// POST /enrichment
enrichmentRouter.post("/", enrichmentRateLimiter, async (req: AuthenticatedRequest, res) => {
  const parsed = enrichmentSchema.safeParse(req.body);
  if (!parsed.success) throw HttpErrors.badRequest("Validation failed", parsed.error.flatten());

  const workspaceId = req.workspaceId!;

  // Check idempotency
  if (parsed.data.idempotencyKey) {
    const existing = await EnrichmentModel.findOne({ idempotencyKey: parsed.data.idempotencyKey });
    if (existing) return res.json({ success: true, data: existing });
  }

  // Check credits
  const creditBalance = await CreditBalanceModel.findOne({ workspaceId });
  if (!creditBalance || creditBalance.balance < 1) {
    throw HttpErrors.paymentRequired("Insufficient credits. Please upgrade your plan.");
  }

  // Create enrichment record
  const enrichment = await EnrichmentModel.create({
    workspaceId,
    userId: req.user!._id,
    input: parsed.data.input,
    inputType: parsed.data.inputType,
    status: EnrichmentStatus.PENDING,
    providers: [],
    results: [],
    creditsUsed: 0,
    idempotencyKey: parsed.data.idempotencyKey,
  });

  // Queue the job
  await enrichmentQueue.add(
    "enrich",
    {
      enrichmentId: enrichment._id.toString(),
      workspaceId,
      userId: req.user!._id,
      input: parsed.data.input,
      inputType: parsed.data.inputType,
      saveContact: parsed.data.saveContact,
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  res.status(202).json({
    success: true,
    data: {
      enrichmentId: enrichment._id,
      status: enrichment.status,
      message: "Enrichment queued. Poll /enrichment/:id for results.",
    },
  });
});

// GET /enrichment/:id
enrichmentRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const enrichment = await EnrichmentModel.findOne({
    _id: req.params.id,
    workspaceId: req.workspaceId,
  });
  if (!enrichment) throw HttpErrors.notFound("Enrichment not found");
  res.json({ success: true, data: enrichment });
});

// GET /enrichment/history
enrichmentRouter.get("/history", async (req: AuthenticatedRequest, res) => {
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
  const skip = (page - 1) * limit;

  const [enrichments, total] = await Promise.all([
    EnrichmentModel.find({ workspaceId: req.workspaceId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EnrichmentModel.countDocuments({ workspaceId: req.workspaceId }),
  ]);

  res.json({
    success: true,
    data: enrichments,
    meta: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
});
