import { ProviderResult } from "@linkedon/types";
import { BaseProvider, EnrichmentParams } from "../providers/base.provider";
import { ApolloProvider } from "../providers/apollo.provider";
import { ClearbitProvider } from "../providers/clearbit.provider";
import { HunterProvider } from "../providers/hunter.provider";
import { MockProvider } from "../providers/mock.provider";
import { config } from "../config";

export class ProviderManager {
  private providers: BaseProvider[] = [];
  
  constructor() {
    this.registerProviders();
  }

  private registerProviders() {
    if (config.enableRealProviders) {
      // Order defines priority/waterfall sequence
      this.providers.push(new ApolloProvider());
      this.providers.push(new ClearbitProvider());
      this.providers.push(new HunterProvider());
    } else {
      console.log("🛠️  Running in DEV mode with MockProvider.");
      this.providers.push(new MockProvider());
    }
  }

  /**
   * Executes the enrichment waterfall.
   * Tries each provider in sequence until one succeeds and returns data.
   */
  async enrichPerson(params: EnrichmentParams): Promise<ProviderResult> {
    const errors: Array<{ provider: string; error: string }> = [];

    for (const provider of this.providers) {
      if (!provider.supports(params)) {
        continue;
      }

      try {
        console.log(`[ProviderManager] Attempting enrichment via ${provider.getName()}...`);
        const result = await provider.enrich(params);
        
        if (result.success && result.data) {
          console.log(`[ProviderManager] 🟢 ${provider.getName()} succeeded.`);
          return result;
        }
        
        console.log(`[ProviderManager] 🟡 ${provider.getName()} returned no data, falling back...`);
      } catch (err: any) {
        console.error(`[ProviderManager] 🔴 ${provider.getName()} error:`, err.message);
        errors.push({ provider: provider.getName(), error: err.message });
        // Fall through to next provider
      }
    }

    // If we get here, all providers failed or didn't support the params
    return {
      provider: "system",
      success: false,
      latencyMs: 0,
      isMocked: false,
      error: errors.length > 0 ? "All providers failed." : "No supporting provider found.",
    };
  }

  async healthCheck(): Promise<Record<string, any>> {
    const statuses: Record<string, any> = {};
    for (const provider of this.providers) {
      statuses[provider.getName()] = await provider.healthCheck();
    }
    return statuses;
  }
}

// Export singleton instance
export const providerManager = new ProviderManager();
