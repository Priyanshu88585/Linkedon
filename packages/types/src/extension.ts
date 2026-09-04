import { ExtensionState } from "./enums";

export interface ExtensionSession {
  _id: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ExtensionAuthInput {
  authorizationToken: string; // short-lived token from web app
}

export interface ExtensionAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  credits: number;
}

export interface ExtensionPageContext {
  url: string;
  domain: string;
  profileData: {
    name?: string;
    title?: string;
    company?: string;
    profileUrl?: string;
    avatarUrl?: string;
  };
  supportedSite: SupportedSite | null;
}

export interface SupportedSite {
  domain: string;
  displayName: string;
  extractionStrategy: string;
  enabled: boolean;
}

export interface ExtensionUIState {
  state: ExtensionState;
  user?: {
    name: string;
    email: string;
    credits: number;
  };
  pageContext?: ExtensionPageContext;
  enrichmentResult?: {
    emails: { value: string; confidence: number; verified: boolean }[];
    phones: { value: string; confidence: number }[];
    confidence: number;
    source: string;
  };
  error?: string;
}

// Storage schema for chrome.storage
export interface ExtensionStorage {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  credits?: number;
  settings?: ExtensionSettings;
  _version?: number;
}

export interface ExtensionSettings {
  autoDetect: boolean;
  showOnLoad: boolean;
  theme: "dark";
}
