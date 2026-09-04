import mongoose, { Schema, Document, Model } from "mongoose";
import { WorkspaceMemberRole } from "@linkedon/types";

export interface WorkspaceDocument extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  settings: {
    allowMemberInvites: boolean;
    defaultCreditPolicy: "charge_on_success" | "charge_on_attempt";
    dataRetentionDays: number;
    webhookUrl?: string;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: WorkspaceMemberRole;
  invitedBy: mongoose.Types.ObjectId;
  invitedAt: Date;
  acceptedAt?: Date;
}

const WorkspaceSchema = new Schema<WorkspaceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    settings: {
      allowMemberInvites: { type: Boolean, default: true },
      defaultCreditPolicy: {
        type: String,
        enum: ["charge_on_success", "charge_on_attempt"],
        default: "charge_on_success",
      },
      dataRetentionDays: { type: Number, default: 365 },
      webhookUrl: { type: String },
      timezone: { type: String, default: "UTC" },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const WorkspaceMemberSchema = new Schema<WorkspaceMemberDocument>(
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
    role: {
      type: String,
      enum: Object.values(WorkspaceMemberRole),
      default: WorkspaceMemberRole.MEMBER,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index — user can only be in a workspace once
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceModel: Model<WorkspaceDocument> =
  mongoose.models.Workspace ||
  mongoose.model<WorkspaceDocument>("Workspace", WorkspaceSchema);

export const WorkspaceMemberModel: Model<WorkspaceMemberDocument> =
  mongoose.models.WorkspaceMember ||
  mongoose.model<WorkspaceMemberDocument>("WorkspaceMember", WorkspaceMemberSchema);
