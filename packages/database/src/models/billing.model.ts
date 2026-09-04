import mongoose, { Schema, Document, Model } from "mongoose";
import { PlanName, SubscriptionStatus, CreditTransactionType } from "@linkedon/types";

// ─── Plan Model ───────────────────────────────────────────────────────────────

export interface PlanDocument extends Document {
  name: PlanName;
  displayName: string;
  description: string;
  monthlyCredits: number;
  price: number;
  yearlyPrice: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  limits: {
    dailyEnrichments: number;
    monthlyEnrichments: number;
    teamMembers: number;
    csvImportRows: number;
    apiRequestsPerDay: number;
    lists: number;
    contacts: number;
  };
  features: string[];
  isActive: boolean;
}

const PlanSchema = new Schema<PlanDocument>(
  {
    name: {
      type: String,
      enum: Object.values(PlanName),
      required: true,
      unique: true,
    },
    displayName: { type: String, required: true },
    description: { type: String, default: "" },
    monthlyCredits: { type: Number, required: true },
    price: { type: Number, required: true },       // cents per month
    yearlyPrice: { type: Number, required: true },  // cents per year
    stripePriceIdMonthly: { type: String },
    stripePriceIdYearly: { type: String },
    limits: {
      dailyEnrichments: { type: Number, default: -1 },
      monthlyEnrichments: { type: Number, default: -1 },
      teamMembers: { type: Number, default: 1 },
      csvImportRows: { type: Number, default: 100 },
      apiRequestsPerDay: { type: Number, default: 0 },
      lists: { type: Number, default: 3 },
      contacts: { type: Number, default: 100 },
    },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// ─── Subscription Model ───────────────────────────────────────────────────────

export interface SubscriptionDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
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
}

const SubscriptionSchema = new Schema<SubscriptionDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    stripeCustomerId: { type: String, required: true, index: true },
    stripeSubscriptionId: { type: String, sparse: true },
    stripePriceId: { type: String },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    interval: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },
    trialEnd: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

// ─── Credit Balance Model ─────────────────────────────────────────────────────

export interface CreditBalanceDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  balance: number;
  lifetimeUsed: number;
  updatedAt: Date;
}

const CreditBalanceSchema = new Schema<CreditBalanceDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
      index: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    lifetimeUsed: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

// ─── Credit Transaction Model ─────────────────────────────────────────────────

export interface CreditTransactionDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: CreditTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const CreditTransactionSchema = new Schema<CreditTransactionDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(CreditTransactionType),
      required: true,
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reference: { type: String },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false }
);

CreditTransactionSchema.index({ workspaceId: 1, createdAt: -1 });

export const PlanModel: Model<PlanDocument> =
  mongoose.models.Plan || mongoose.model<PlanDocument>("Plan", PlanSchema);

export const SubscriptionModel: Model<SubscriptionDocument> =
  mongoose.models.Subscription ||
  mongoose.model<SubscriptionDocument>("Subscription", SubscriptionSchema);

export const CreditBalanceModel: Model<CreditBalanceDocument> =
  mongoose.models.CreditBalance ||
  mongoose.model<CreditBalanceDocument>("CreditBalance", CreditBalanceSchema);

export const CreditTransactionModel: Model<CreditTransactionDocument> =
  mongoose.models.CreditTransaction ||
  mongoose.model<CreditTransactionDocument>("CreditTransaction", CreditTransactionSchema);
