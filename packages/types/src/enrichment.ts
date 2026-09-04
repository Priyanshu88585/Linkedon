import { EnrichmentStatus, EnrichmentInputType } from "./enums";
import { Contact } from "./contact";

export interface EnrichmentResult {
  category: "email" | "phone" | "name" | "job_title" | "company" | "company_domain" | "location" | "social";
  value: string;
  confidence: number;
  source: string;
  verified: boolean;
  metadata?: Record<string, unknown>;
}

export interface Enrichment {
  _id: string;
  workspaceId: string;
  userId: string;
  input: string;
  inputType: EnrichmentInputType;
  status: EnrichmentStatus;
  providers: string[];
  results: EnrichmentResult[];
  savedContactId?: string;
  creditsUsed: number;
  durationMs?: number;
  error?: string;
  idempotencyKey?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateEnrichmentInput {
  input: string;
  inputType: EnrichmentInputType;
  saveContact?: boolean;
  idempotencyKey?: string;
}

export interface EnrichmentResponse {
  enrichment: Enrichment;
  contact?: Partial<Contact>;
}

export interface BulkEnrichmentInput {
  items: CreateEnrichmentInput[];
  listId?: string;
}

export interface BulkEnrichmentJob {
  _id: string;
  workspaceId: string;
  userId: string;
  totalItems: number;
  processedItems: number;
  successCount: number;
  failureCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
}
