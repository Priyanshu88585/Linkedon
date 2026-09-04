import { ApiKeyStatus } from "./enums";

export interface ApiKey {
  _id: string;
  workspaceId: string;
  userId: string;
  name: string;
  prefix: string;           // first 8 chars shown to user (e.g. "lnk_abc1")
  keyHash: string;          // SHA-256 hash — never store plaintext
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  lastUsedAt?: Date;
  requestCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

export type ApiKeyScope =
  | "enrichment:create"
  | "enrichment:read"
  | "contacts:read"
  | "contacts:write"
  | "contacts:delete"
  | "lists:read"
  | "lists:write"
  | "usage:read"
  | "webhooks:write";

export interface CreateApiKeyInput {
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: Date;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  rawKey: string;            // shown ONCE, then discarded
}
