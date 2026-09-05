import { ProviderResult } from "@linkedon/types";
import { BaseProvider, EnrichmentParams } from "./base.provider";
import { config } from "../config";

export class ClearbitProvider extends BaseProvider {
  private readonly apiKey = config.providers.clearbit;
  private readonly baseUrl = "https://person.clearbit.com/v2";

  getName(): string {
    return "clearbit";
  }

  supports(params: EnrichmentParams): boolean {
    // Clearbit's Person API requires an email address.
    return !!params.email;
  }

  async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    if (!this.apiKey) {
      return { isHealthy: false, latencyMs: 0, error: "Missing API key" };
    }
    const start = Date.now();
    try {
      // Just testing authentication via a dummy request or streaming endpoint if available,
      // Here we just test an invalid email to see if auth works instead of 401.
      const res = await fetch(`${this.baseUrl}/people/find?email=healthcheck@example.com`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      if (res.status === 401) {
        return { isHealthy: false, latencyMs: Date.now() - start, error: `HTTP ${res.status} Unauthorized` };
      }
      return { isHealthy: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { isHealthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  async enrich(params: EnrichmentParams): Promise<ProviderResult> {
    if (!this.supports(params)) {
      throw new Error("Clearbit provider does not support the provided parameters.");
    }
    if (!this.apiKey) {
      throw new Error("Clearbit API key is not configured.");
    }

    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/people/find?email=${encodeURIComponent(params.email!)}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (res.status === 429) {
        throw new Error("Rate limit exceeded for Clearbit API.");
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error("Invalid Clearbit API key.");
      }
      if (res.status === 404 || res.status === 202) {
        // 202 means async lookup started, but we want sync data for now, so treat as not immediately found.
        return {
          provider: this.getName(),
          success: false,
          latencyMs: Date.now() - start,
          isMocked: false,
        };
      }

      if (!res.ok) {
        return {
          provider: this.getName(),
          success: false,
          latencyMs: Date.now() - start,
          isMocked: false,
        };
      }

      const person = await res.json();

      return {
        provider: this.getName(),
        success: true,
        data: {
          firstName: person.name?.givenName || params.firstName,
          lastName: person.name?.familyName || params.lastName,
          fullName: person.name?.fullName || undefined,
          jobTitle: person.employment?.title || undefined,
          company: person.employment?.name || params.companyName,
          companyDomain: person.employment?.domain || params.companyDomain,
          location: person.location || undefined,
          emails: [
            {
              value: params.email!,
              confidence: 1.0,
              status: "verified",
            }
          ],
          phones: [],
          socialProfiles: [
            ...(person.linkedin?.handle ? [{ platform: "linkedin" as const, url: `https://linkedin.com/${person.linkedin.handle}` }] : []),
            ...(person.twitter?.handle ? [{ platform: "twitter" as const, url: `https://twitter.com/${person.twitter.handle}` }] : []),
            ...(person.github?.handle ? [{ platform: "github" as const, url: `https://github.com/${person.github.handle}` }] : []),
          ],
        },
        confidence: 0.95, // Clearbit usually highly accurate for returned records
        latencyMs: Date.now() - start,
        isMocked: false,
      };

    } catch (err: any) {
      throw err;
    }
  }
}
