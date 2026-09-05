import { ProviderResult } from "@linkedon/types";

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK PROVIDER — for local development only
// All data is clearly labeled as mock/demo data
// NEVER use in production to return real contact information
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_PROFILES: Record<string, Partial<ProviderResult["data"]>> = {
  default: {
    firstName: "Demo",
    lastName: "User",
    fullName: "Demo User",
    jobTitle: "Software Engineer",
    company: "Demo Company",
    companyDomain: "demo-company.example.com",
    location: "San Francisco, CA",
    emails: [
      {
        value: "demo@example.com",
        confidence: 0.94,
        status: "verified",
      },
    ],
    phones: [],
    socialProfiles: [
      {
        platform: "linkedin",
        url: "https://linkedin.com/in/demo-user",
      },
    ],
  },
};

import { BaseProvider, EnrichmentParams } from "./base.provider";

export class MockProvider extends BaseProvider {
  getName(): string {
    return "mock-provider";
  }

  supports(_params: EnrichmentParams): boolean {
    return true; // Supports everything in dev mode
  }

  async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number }> {
    return { isHealthy: true, latencyMs: 0 };
  }

  async enrich(params: EnrichmentParams): Promise<ProviderResult> {
    const start = Date.now();

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

    // Extract domain or name from input for matching
    const mockKey = "default";
    const mockData = MOCK_PROFILES[mockKey];

    return {
      provider: "mock-provider",
      success: true,
      data: {
        ...mockData,
        // Add input-derived hint for demo purposes
        fullName: mockData?.fullName,
      },
      confidence: 0.94,
      latencyMs: Date.now() - start,
      isMocked: true, // ← Always flag mock data
    };
  }
}
