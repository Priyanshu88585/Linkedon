import { ProviderResult } from "@linkedon/types";
import { BaseProvider, EnrichmentParams } from "./base.provider";
import { config } from "../config";

export class HunterProvider extends BaseProvider {
  private readonly apiKey = config.providers.hunter;
  private readonly baseUrl = "https://api.hunter.io/v2";

  getName(): string {
    return "hunter";
  }

  supports(params: EnrichmentParams): boolean {
    // Hunter's Email Finder requires a domain/company and a name.
    return !!(
      (params.companyDomain || params.companyName) &&
      params.firstName &&
      params.lastName
    );
  }

  async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    if (!this.apiKey) {
      return { isHealthy: false, latencyMs: 0, error: "Missing API key" };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/account?api_key=${this.apiKey}`);
      if (!res.ok) {
        return { isHealthy: false, latencyMs: Date.now() - start, error: `HTTP ${res.status}` };
      }
      return { isHealthy: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { isHealthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  async enrich(params: EnrichmentParams): Promise<ProviderResult> {
    if (!this.supports(params)) {
      throw new Error("Hunter provider does not support the provided parameters.");
    }
    if (!this.apiKey) {
      throw new Error("Hunter API key is not configured.");
    }

    const start = Date.now();

    const query = new URLSearchParams({
      api_key: this.apiKey,
      first_name: params.firstName!,
      last_name: params.lastName!,
    });

    if (params.companyDomain) {
      query.append("domain", params.companyDomain);
    } else if (params.companyName) {
      query.append("company", params.companyName);
    }

    try {
      const res = await fetch(`${this.baseUrl}/email-finder?${query.toString()}`);
      
      // Handle rate limits and auth errors to bubble up to the Manager
      if (res.status === 429) {
        throw new Error("Rate limit exceeded for Hunter API.");
      }
      if (res.status === 401) {
        throw new Error("Invalid Hunter API key.");
      }

      if (!res.ok) {
        return {
          provider: this.getName(),
          success: false,
          latencyMs: Date.now() - start,
          isMocked: false,
        };
      }

      const body = await res.json();
      const data = body.data;

      if (!data || !data.email) {
        return {
          provider: this.getName(),
          success: false,
          latencyMs: Date.now() - start,
          isMocked: false,
        };
      }

      return {
        provider: this.getName(),
        success: true,
        data: {
          firstName: data.first_name || params.firstName,
          lastName: data.last_name || params.lastName,
          fullName: `${data.first_name || params.firstName} ${data.last_name || params.lastName}`.trim(),
          jobTitle: data.position || undefined,
          company: data.company || params.companyName,
          companyDomain: data.domain || params.companyDomain,
          location: undefined,
          emails: [
            {
              value: data.email,
              confidence: (data.score || 0) / 100,
              status: "verified", // Assume finder returns valid/verified formats
            }
          ],
          phones: data.phone_number ? [{ value: data.phone_number }] : [],
          socialProfiles: [
            ...(data.linkedin ? [{ platform: "linkedin" as const, url: data.linkedin }] : []),
            ...(data.twitter ? [{ platform: "twitter" as const, url: data.twitter }] : []),
          ],
        },
        confidence: (data.score || 0) / 100,
        latencyMs: Date.now() - start,
        isMocked: false,
      };

    } catch (err: any) {
      throw err; // Let ProviderManager handle network errors
    }
  }
}
