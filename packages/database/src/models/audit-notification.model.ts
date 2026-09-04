import mongoose, { Schema, Document, Model } from "mongoose";
import { AuditAction, NotificationType } from "@linkedon/types";

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLogDocument extends Document {
  workspaceId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
    },
    resource: { type: String },
    resourceId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

AuditLogSchema.index({ workspaceId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
// Auto-delete audit logs after 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// ─── Notification ─────────────────────────────────────────────────────────────

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  workspaceId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    actionUrl: { type: String },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const AuditLogModel: Model<AuditLogDocument> =
  mongoose.models.AuditLog ||
  mongoose.model<AuditLogDocument>("AuditLog", AuditLogSchema);

export const NotificationModel: Model<NotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);
