import mongoose, { Schema, Document } from "mongoose";

export interface BulkJob extends Document {
  workspaceId: string;
  userId: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BulkJobSchema = new Schema<BulkJob>(
  {
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    fileName: { type: String, required: true },
    totalRows: { type: Number, default: 0 },
    processedRows: { type: Number, default: 0 },
    successfulRows: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    error: { type: String },
  },
  { timestamps: true }
);

export const BulkJobModel =
  mongoose.models.BulkJob || mongoose.model<BulkJob>("BulkJob", BulkJobSchema);
