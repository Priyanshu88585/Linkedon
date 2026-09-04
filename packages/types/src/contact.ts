import { ContactVerificationStatus } from "./enums";

export interface ContactEmail {
  value: string;
  status: ContactVerificationStatus;
  isPrimary: boolean;
  source: string;
  confidence: number;
  verifiedAt?: Date;
}

export interface ContactPhone {
  value: string;         // E.164 format
  formatted?: string;
  type?: "mobile" | "direct" | "work" | "unknown";
  status: ContactVerificationStatus;
  isPrimary: boolean;
  source: string;
  confidence: number;
}

export interface ContactSocialProfile {
  platform: "linkedin" | "github" | "twitter" | "facebook" | "instagram" | "other";
  url: string;
  username?: string;
}

export interface ContactSource {
  provider: string;
  retrievedAt: Date;
  inputUrl?: string;
  rawData?: Record<string, unknown>;
}

export interface Contact {
  _id: string;
  workspaceId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  company?: string;
  companyDomain?: string;
  location?: string;
  country?: string;
  city?: string;
  emails: ContactEmail[];
  phones: ContactPhone[];
  socialProfiles: ContactSocialProfile[];
  sources: ContactSource[];
  tags: string[];
  confidence: number;
  verificationStatus: ContactVerificationStatus;
  listIds: string[];
  enrichmentIds: string[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  company?: string;
  companyDomain?: string;
  location?: string;
  emails?: Omit<ContactEmail, "verifiedAt">[];
  phones?: Omit<ContactPhone, "">[];
  socialProfiles?: ContactSocialProfile[];
  notes?: string;
  tags?: string[];
}

export interface UpdateContactInput extends Partial<CreateContactInput> {}

export interface ContactSearchParams {
  query?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "fullName" | "company";
  sortOrder?: "asc" | "desc";
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
