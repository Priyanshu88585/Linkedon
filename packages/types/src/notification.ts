import { NotificationType } from "./enums";

export interface Notification {
  _id: string;
  userId: string;
  workspaceId?: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
