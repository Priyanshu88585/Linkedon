import { WorkspaceMemberRole } from "./enums";

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  planId: string;
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSettings {
  allowMemberInvites: boolean;
  defaultCreditPolicy: "charge_on_success" | "charge_on_attempt";
  dataRetentionDays: number;
  webhookUrl?: string;
  timezone: string;
}

export interface WorkspaceMember {
  _id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface WorkspaceInvitation {
  _id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceMemberRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface CreateWorkspaceInput {
  name: string;
}

export interface InviteMemberInput {
  email: string;
  role: WorkspaceMemberRole;
}
