import { ProviderResult } from "@linkedon/types";

export interface EnrichmentParams {
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyDomain?: string;
  linkedinUrl?: string;
}

export abstract class BaseProvider {
  /**
   * The unique name of the provider (e.g., 'hunter', 'apollo').
   */
  abstract getName(): string;

  /**
   * Returns true if the provider can handle the given parameters.
   * e.g. Hunter might require an email, or first_name + last_name + domain.
   */
  abstract supports(params: EnrichmentParams): boolean;

  /**
   * Performs the enrichment request and returns a normalized result.
   * If the provider throws an error (e.g. rate limit), this should let the error bubble up
   * so the ProviderManager can handle it.
   * If no data is found, it should return a ProviderResult with success: false.
   */
  abstract enrich(params: EnrichmentParams): Promise<ProviderResult>;

  /**
   * Quick health check to see if API keys are valid and the service is reachable.
   */
  abstract healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }>;
}
