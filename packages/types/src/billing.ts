import { SubscriptionStatus, PlanName } from "./enums";

export interface Subscription {
  _id: string;
  workspaceId: string;
  planId: string;
  planName: PlanName;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status: SubscriptionStatus;
  interval: "monthly" | "yearly";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  amount: number;            // cents
  currency: string;
  status: "paid" | "open" | "void" | "uncollectible";
  invoiceUrl?: string;
  pdfUrl?: string;
  date: Date;
  period: { start: Date; end: Date };
}

export interface CreateCheckoutSessionInput {
  planId: string;
  interval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}

export interface BillingPortalInput {
  returnUrl: string;
}
