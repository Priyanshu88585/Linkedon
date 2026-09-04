import { AuditAction } from "./enums";

export interface AuditLog {
  _id: string;
  workspaceId?: string;
  userId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
