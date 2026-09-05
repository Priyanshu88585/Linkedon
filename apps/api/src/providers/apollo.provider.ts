import { ProviderResult } from "@linkedon/types";
import { BaseProvider, EnrichmentParams } from "./base.provider";
import { config } from "../config";

export class ApolloProvider extends BaseProvider {
  private readonly apiKey = config.providers.apollo;
  private readonly baseUrl = "https://api.apollo.io/v1";

  getName(): string {
    return "apollo";
  }

  supports(params: EnrichmentParams): boolean {
    // Apollo is very flexible. Email alone, or Name + Company works well.
    return !!(
      params.email ||
      (params.firstName && params.lastName && params.companyName) ||
      params.linkedinUrl
    );
  }

  async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    if (!this.apiKey) {
      return { isHealthy: false, latencyMs: 0, error: "Missing API key" };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/auth/health`, {
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
      });
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
      throw new Error("Apollo provider does not support the provided parameters.");
    }
    if (!this.apiKey) {
      throw new Error("Apollo API key is not configured.");
    }

    const start = Date.now();

    const payload: Record<string, string> = {
      api_key: this.apiKey,
    };

    if (params.email) payload.email = params.email;
    if (params.firstName) payload.first_name = params.firstName;
    if (params.lastName) payload.last_name = params.lastName;
    if (params.companyName) payload.organization_name = params.companyName;
    
    // Some implementations use linkedin_url in payload for people/match or similar.
    // Assuming a generic match payload based on their docs.

    try {
      const res = await fetch(`${this.baseUrl}/people/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        throw new Error("Rate limit exceeded for Apollo API.");
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error("Invalid Apollo API key or Unauthorized.");
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
      const person = body.person;

      if (!person) {
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
          firstName: person.first_name || params.firstName,
          lastName: person.last_name || params.lastName,
          fullName: person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim(),
          jobTitle: person.title || undefined,
          company: person.organization?.name || params.companyName,
          companyDomain: person.organization?.primary_domain || params.companyDomain,
          location: person.city ? `${person.city}${person.state ? `, ${person.state}` : ''}` : undefined,
          emails: person.email ? [
            {
              value: person.email,
              confidence: 0.9,
              status: "verified",
            }
          ] : [],
          phones: person.phone_numbers ? person.phone_numbers.map((p: any) => ({
            value: p.sanitized_number || p.raw_number
          })) : [],
          socialProfiles: person.linkedin_url ? [
            { platform: "linkedin", url: person.linkedin_url }
          ] : [],
        },
        confidence: 0.9,
        latencyMs: Date.now() - start,
        isMocked: false,
      };

    } catch (err: any) {
      throw err;
    }
  }
}
