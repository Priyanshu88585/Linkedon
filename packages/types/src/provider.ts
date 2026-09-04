export interface Provider {
  _id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  priority: number;
  rateLimits: ProviderRateLimits;
  stats: ProviderStats;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderRateLimits {
  requestsPerSecond: number;
  requestsPerDay: number;
  requestsPerMonth: number;
}

export interface ProviderStats {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  lastUsedAt?: Date;
  lastHealthCheckAt?: Date;
  isHealthy: boolean;
}

export interface ProviderResult {
  provider: string;
  success: boolean;
  data?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    jobTitle?: string;
    company?: string;
    companyDomain?: string;
    location?: string;
    emails?: { value: string; confidence: number; status: string }[];
    phones?: { value: string; confidence: number; type?: string }[];
    socialProfiles?: { platform: string; url: string }[];
  };
  confidence?: number;
  latencyMs: number;
  error?: string;
  isMocked?: boolean;
}

export interface HealthStatus {
  provider: string;
  isHealthy: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: Date;
}
