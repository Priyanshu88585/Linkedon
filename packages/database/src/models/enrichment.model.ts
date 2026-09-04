import mongoose, { Schema, Document, Model } from "mongoose";
import { EnrichmentStatus, EnrichmentInputType } from "@linkedon/types";

const EnrichmentResultSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["email", "phone", "name", "job_title", "company", "company_domain", "location", "social"],
      required: true,
    },
    value: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    source: { type: String, required: true },
    verified: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

export interface EnrichmentDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  input: string;
  inputType: EnrichmentInputType;
  status: EnrichmentStatus;
  providers: string[];
  results: (typeof EnrichmentResultSchema)[];
  savedContactId?: mongoose.Types.ObjectId;
  creditsUsed: number;
  durationMs?: number;
  error?: string;
  idempotencyKey?: string;
  jobId?: string;
  createdAt: Date;
  completedAt?: Date;
}

const EnrichmentSchema = new Schema<EnrichmentDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    input: {
      type: String,
      required: true,
    },
    inputType: {
      type: String,
      enum: Object.values(EnrichmentInputType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EnrichmentStatus),
      default: EnrichmentStatus.PENDING,
      index: true,
    },
    providers: [{ type: String }],
    results: [EnrichmentResultSchema],
    savedContactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
    },
    creditsUsed: { type: Number, default: 0 },
    durationMs: { type: Number },
    error: { type: String },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
    jobId: { type: String },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

EnrichmentSchema.index({ workspaceId: 1, createdAt: -1 });
EnrichmentSchema.index({ workspaceId: 1, status: 1 });
EnrichmentSchema.index({ userId: 1, createdAt: -1 });

export const EnrichmentModel: Model<EnrichmentDocument> =
  mongoose.models.Enrichment ||
  mongoose.model<EnrichmentDocument>("Enrichment", EnrichmentSchema);
