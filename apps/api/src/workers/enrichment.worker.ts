import { Worker } from "bullmq";
import {
  EnrichmentModel,
  ContactModel,
  CreditBalanceModel,
  CreditTransactionModel,
} from "@linkedon/database";
import { EnrichmentStatus, CreditTransactionType, ContactVerificationStatus } from "@linkedon/types";
import { MockProvider } from "../providers/mock.provider";
import { config } from "../config";

const connection = {
  host: new URL(config.redisUrl).hostname,
  port: parseInt(new URL(config.redisUrl).port ?? "6379", 10),
};

const mockProvider = new MockProvider();

export const enrichmentWorker = new Worker(
  "enrichment",
  async (job) => {
    const { enrichmentId, workspaceId, userId, input, inputType, saveContact } = job.data;
    const startTime = Date.now();

    // Mark as processing
    await EnrichmentModel.findByIdAndUpdate(enrichmentId, {
      status: EnrichmentStatus.PROCESSING,
    });

    try {
      // Use mock provider in dev, real providers in prod
      const provider = mockProvider; // In Phase 4 we add ProviderManager here
      const result = await provider.enrich(input);

      if (!result.success || !result.data) {
        await EnrichmentModel.findByIdAndUpdate(enrichmentId, {
          status: EnrichmentStatus.NO_RESULT,
          durationMs: Date.now() - startTime,
          completedAt: new Date(),
        });
        return;
      }

      // Normalize results into EnrichmentResult format
      const enrichmentResults = [
        ...(result.data.emails ?? []).map((e) => ({
          category: "email" as const,
          value: e.value,
          confidence: e.confidence,
          source: result.provider,
          verified: e.status === "verified",
        })),
        ...(result.data.phones ?? []).map((p) => ({
          category: "phone" as const,
          value: p.value,
          confidence: p.confidence,
          source: result.provider,
          verified: false,
        })),
      ];

      // Deduct 1 credit (atomic with transaction record)
      const balance = await CreditBalanceModel.findOne({ workspaceId });
      if (balance && balance.balance >= 1) {
        await CreditBalanceModel.findByIdAndUpdate(balance._id, {
          $inc: { balance: -1, lifetimeUsed: 1 },
        });
        await CreditTransactionModel.create({
          workspaceId,
          userId,
          type: CreditTransactionType.DEBIT,
          amount: -1,
          balanceBefore: balance.balance,
          balanceAfter: balance.balance - 1,
          reference: enrichmentId,
          description: `Enrichment: ${input}`,
        });
      }

      // Optionally save as contact
      let savedContactId: string | undefined;
      if (saveContact && result.data) {
        const contact = await ContactModel.create({
          workspaceId,
          createdBy: userId,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          fullName: result.data.fullName,
          jobTitle: result.data.jobTitle,
          company: result.data.company,
          companyDomain: result.data.companyDomain,
          location: result.data.location,
          emails: (result.data.emails ?? []).map((e) => ({
            value: e.value,
            status: e.status === "verified"
              ? ContactVerificationStatus.VERIFIED
              : ContactVerificationStatus.UNVERIFIED,
            isPrimary: true,
            source: result.provider,
            confidence: e.confidence,
          })),
          phones: [],
          socialProfiles: result.data.socialProfiles ?? [],
          sources: [{ provider: result.provider, retrievedAt: new Date() }],
          confidence: result.confidence ?? 0,
          verificationStatus: ContactVerificationStatus.UNVERIFIED,
          listIds: [],
          enrichmentIds: [enrichmentId],
        });
        savedContactId = contact._id.toString();
      }

      await EnrichmentModel.findByIdAndUpdate(enrichmentId, {
        status: EnrichmentStatus.COMPLETED,
        providers: [result.provider],
        results: enrichmentResults,
        savedContactId,
        creditsUsed: 1,
        durationMs: Date.now() - startTime,
        completedAt: new Date(),
      });

      console.log(`✅ Enrichment ${enrichmentId} completed in ${Date.now() - startTime}ms`);
    } catch (err) {
      console.error(`❌ Enrichment ${enrichmentId} failed:`, err);
      await EnrichmentModel.findByIdAndUpdate(enrichmentId, {
        status: EnrichmentStatus.FAILED,
        error: err instanceof Error ? err.message : "Unknown error",
        durationMs: Date.now() - startTime,
        completedAt: new Date(),
      });
      throw err; // BullMQ will retry
    }
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

enrichmentWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

enrichmentWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});
