import mongoose, { Schema, Document, Model } from "mongoose";
import { ApiKeyStatus } from "@linkedon/types";

export interface ApiKeyDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  prefix: string;
  keyHash: string;
  scopes: string[];
  status: ApiKeyStatus;
  lastUsedAt?: Date;
  requestCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

const ApiKeySchema = new Schema<ApiKeyDocument>(
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
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    prefix: { type: String, required: true },     // "lnk_" + first 8 chars
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,                              // never returned by default
    },
    scopes: [{ type: String }],
    status: {
      type: String,
      enum: Object.values(ApiKeyStatus),
      default: ApiKeyStatus.ACTIVE,
    },
    lastUsedAt: { type: Date },
    requestCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

ApiKeySchema.index({ workspaceId: 1, status: 1 });
ApiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const ApiKeyModel: Model<ApiKeyDocument> =
  mongoose.models.ApiKey ||
  mongoose.model<ApiKeyDocument>("ApiKey", ApiKeySchema);
