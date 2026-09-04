import { CreditTransactionType, PlanName } from "./enums";

export interface Plan {
  _id: string;
  name: PlanName;
  displayName: string;
  description: string;
  monthlyCredits: number;
  price: number;             // cents/month
  yearlyPrice: number;       // cents/year
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  limits: PlanLimits;
  features: string[];
  isActive: boolean;
}

export interface PlanLimits {
  dailyEnrichments: number;
  monthlyEnrichments: number;
  teamMembers: number;
  csvImportRows: number;
  apiRequestsPerDay: number;
  lists: number;
  contacts: number;
}

export interface CreditBalance {
  _id: string;
  workspaceId: string;
  balance: number;
  lifetimeUsed: number;
  updatedAt: Date;
}

export interface CreditTransaction {
  _id: string;
  workspaceId: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;            // positive = added, negative = used
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;        // enrichment ID, stripe payment ID, etc.
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface UsageSummary {
  workspaceId: string;
  period: string;            // YYYY-MM
  enrichments: number;
  successfulEnrichments: number;
  creditsUsed: number;
  apiRequests: number;
  csvImports: number;
}
