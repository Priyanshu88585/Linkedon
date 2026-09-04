// ============================================================
// ENUMS — Shared across all apps
// ============================================================

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  USER = "user",
}

export enum UserStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
}

export enum WorkspaceMemberRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
  VIEWER = "viewer",
}

export enum PlanName {
  FREE = "free",
  STARTER = "starter",
  PRO = "pro",
  BUSINESS = "business",
  ENTERPRISE = "enterprise",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  TRIALING = "trialing",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  INCOMPLETE = "incomplete",
  PAUSED = "paused",
}

export enum EnrichmentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  PARTIALLY_COMPLETED = "partially_completed",
  FAILED = "failed",
  NO_RESULT = "no_result",
  RATE_LIMITED = "rate_limited",
  INSUFFICIENT_CREDITS = "insufficient_credits",
}

export enum EnrichmentInputType {
  LINKEDIN_URL = "linkedin_url",
  GITHUB_URL = "github_url",
  TWITTER_URL = "twitter_url",
  EMAIL = "email",
  NAME_COMPANY = "name_company",
  PROFILE_URL = "profile_url",
}

export enum ContactVerificationStatus {
  UNVERIFIED = "unverified",
  VERIFIED = "verified",
  BOUNCED = "bounced",
  RISKY = "risky",
  UNKNOWN = "unknown",
}

export enum CreditTransactionType {
  DEBIT = "debit",
  CREDIT = "credit",
  REFUND = "refund",
  PURCHASE = "purchase",
  MONTHLY_GRANT = "monthly_grant",
  ADMIN_ADJUSTMENT = "admin_adjustment",
}

export enum ApiKeyStatus {
  ACTIVE = "active",
  REVOKED = "revoked",
}

export enum NotificationType {
  ENRICHMENT_COMPLETE = "enrichment_complete",
  CSV_COMPLETE = "csv_complete",
  LOW_CREDITS = "low_credits",
  PAYMENT_SUCCESS = "payment_success",
  PAYMENT_FAILED = "payment_failed",
  TEAM_INVITATION = "team_invitation",
  SECURITY_EVENT = "security_event",
  PLAN_UPGRADED = "plan_upgraded",
  PLAN_DOWNGRADED = "plan_downgraded",
}

export enum AuditAction {
  USER_LOGIN = "user.login",
  USER_LOGOUT = "user.logout",
  USER_REGISTER = "user.register",
  USER_DELETED = "user.deleted",
  ENRICHMENT_CREATED = "enrichment.created",
  ENRICHMENT_COMPLETED = "enrichment.completed",
  CONTACT_CREATED = "contact.created",
  CONTACT_DELETED = "contact.deleted",
  LIST_CREATED = "list.created",
  LIST_DELETED = "list.deleted",
  API_KEY_CREATED = "api_key.created",
  API_KEY_REVOKED = "api_key.revoked",
  MEMBER_INVITED = "member.invited",
  MEMBER_REMOVED = "member.removed",
  BILLING_CHECKOUT = "billing.checkout",
  PLAN_CHANGED = "billing.plan_changed",
  CSV_IMPORTED = "csv.imported",
  CSV_EXPORTED = "csv.exported",
  PASSWORD_CHANGED = "user.password_changed",
  TWO_FA_ENABLED = "user.2fa_enabled",
}

export enum WebhookEvent {
  ENRICHMENT_COMPLETED = "enrichment.completed",
  ENRICHMENT_FAILED = "enrichment.failed",
  CREDITS_LOW = "credits.low",
  CONTACT_CREATED = "contact.created",
}

export enum ExtensionState {
  INITIAL = "initial",
  DETECTING = "detecting",
  READY = "ready",
  AUTH_REQUIRED = "auth_required",
  ENRICHING = "enriching",
  SUCCESS = "success",
  PARTIAL_SUCCESS = "partial_success",
  NO_RESULT = "no_result",
  INSUFFICIENT_CREDITS = "insufficient_credits",
  RATE_LIMITED = "rate_limited",
  PROVIDER_ERROR = "provider_error",
  NETWORK_ERROR = "network_error",
  UNSUPPORTED_PAGE = "unsupported_page",
  SESSION_EXPIRED = "session_expired",
}
