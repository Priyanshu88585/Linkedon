import { connectDatabase } from "../connection";
import { PlanModel, WorkspaceModel, UserModel, CreditBalanceModel, SubscriptionModel } from "../models";
import { PlanName, UserRole, UserStatus, WorkspaceMemberRole, SubscriptionStatus } from "@linkedon/types";
import bcrypt from "bcrypt";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/linkedon";

async function seed() {
  console.log("🌱 Starting database seed...");
  await connectDatabase(MONGODB_URI);

  // ─── Plans ─────────────────────────────────────────────────────────────────
  console.log("📦 Seeding plans...");
  const planDefs = [
    {
      name: PlanName.FREE,
      displayName: "Free",
      description: "Get started — no credit card required",
      monthlyCredits: 5,
      price: 0,
      yearlyPrice: 0,
      limits: {
        dailyEnrichments: 2,
        monthlyEnrichments: 5,
        teamMembers: 1,
        csvImportRows: 10,
        apiRequestsPerDay: 0,
        lists: 1,
        contacts: 25,
      },
      features: ["5 credits/month", "Email enrichment", "Chrome Extension", "1 list", "25 contacts"],
    },
    {
      name: PlanName.STARTER,
      displayName: "Starter",
      description: "For individuals and small teams",
      monthlyCredits: 100,
      price: 2900,        // $29.00
      yearlyPrice: 27900, // $279.00 (~20% off)
      limits: {
        dailyEnrichments: 20,
        monthlyEnrichments: 100,
        teamMembers: 3,
        csvImportRows: 500,
        apiRequestsPerDay: 100,
        lists: 10,
        contacts: 500,
      },
      features: [
        "100 credits/month",
        "Email + phone enrichment",
        "CSV import/export",
        "Team (3 members)",
        "API access",
        "10 lists",
      ],
    },
    {
      name: PlanName.PRO,
      displayName: "Pro",
      description: "For growing teams and recruiters",
      monthlyCredits: 500,
      price: 7900,        // $79.00
      yearlyPrice: 75900, // $759.00
      limits: {
        dailyEnrichments: 100,
        monthlyEnrichments: 500,
        teamMembers: 10,
        csvImportRows: 5000,
        apiRequestsPerDay: 1000,
        lists: 50,
        contacts: 5000,
      },
      features: [
        "500 credits/month",
        "Email + phone enrichment",
        "Bulk CSV enrichment",
        "Team (10 members)",
        "Full API access",
        "Webhooks",
        "50 lists",
        "Priority support",
      ],
    },
    {
      name: PlanName.BUSINESS,
      displayName: "Business",
      description: "For sales teams and agencies",
      monthlyCredits: 2000,
      price: 19900,         // $199.00
      yearlyPrice: 190900,
      limits: {
        dailyEnrichments: 500,
        monthlyEnrichments: 2000,
        teamMembers: 50,
        csvImportRows: 50000,
        apiRequestsPerDay: 10000,
        lists: -1, // unlimited
        contacts: 50000,
      },
      features: [
        "2,000 credits/month",
        "All enrichment types",
        "Unlimited lists",
        "Team (50 members)",
        "Advanced API",
        "Audit logs",
        "Dedicated support",
      ],
    },
    {
      name: PlanName.ENTERPRISE,
      displayName: "Enterprise",
      description: "Custom pricing for large organizations",
      monthlyCredits: 999999,
      price: 0,
      yearlyPrice: 0,
      limits: {
        dailyEnrichments: -1,
        monthlyEnrichments: -1,
        teamMembers: -1,
        csvImportRows: -1,
        apiRequestsPerDay: -1,
        lists: -1,
        contacts: -1,
      },
      features: [
        "Custom credits",
        "Unlimited everything",
        "Custom data retention",
        "SSO / SAML",
        "SLA guarantee",
        "Custom provider integration",
        "Dedicated account manager",
      ],
    },
  ];

  for (const plan of planDefs) {
    await PlanModel.findOneAndUpdate({ name: plan.name }, plan, { upsert: true, new: true });
  }
  console.log("✅ Plans seeded");

  const freePlan = await PlanModel.findOne({ name: PlanName.FREE });
  if (!freePlan) throw new Error("Free plan not found after seed");

  // ─── Admin User ─────────────────────────────────────────────────────────────
  console.log("👤 Seeding admin user...");
  const adminEmail = "admin@linkedon.io";
  const demoEmail = "demo@linkedon.io";

  let adminUser = await UserModel.findOne({ email: adminEmail });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash("Admin123!@#", 12);
    adminUser = await UserModel.create({
      name: "Admin User",
      email: adminEmail,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      status: UserStatus.ACTIVE,
      onboardingCompleted: true,
    });
    console.log(`✅ Admin created: ${adminEmail} / Admin123!@#`);
  }

  // ─── Demo User ──────────────────────────────────────────────────────────────
  let demoUser = await UserModel.findOne({ email: demoEmail });
  if (!demoUser) {
    const passwordHash = await bcrypt.hash("Demo123!@#", 12);
    demoUser = await UserModel.create({
      name: "Demo User",
      email: demoEmail,
      passwordHash,
      role: UserRole.USER,
      emailVerified: true,
      status: UserStatus.ACTIVE,
      onboardingCompleted: true,
    });
    console.log(`✅ Demo user created: ${demoEmail} / Demo123!@#`);
  }

  // ─── Demo Workspace ─────────────────────────────────────────────────────────
  let demoWorkspace = await WorkspaceModel.findOne({ slug: "demo-workspace" });
  if (!demoWorkspace) {
    demoWorkspace = await WorkspaceModel.create({
      name: "Demo Workspace",
      slug: "demo-workspace",
      ownerId: demoUser._id,
      planId: freePlan._id,
      settings: {
        allowMemberInvites: true,
        defaultCreditPolicy: "charge_on_success",
        dataRetentionDays: 365,
        timezone: "UTC",
      },
    });

    await UserModel.findByIdAndUpdate(demoUser._id, {
      $addToSet: { workspaceIds: demoWorkspace._id },
      currentWorkspaceId: demoWorkspace._id,
    });

    await CreditBalanceModel.create({
      workspaceId: demoWorkspace._id,
      balance: 5,
      lifetimeUsed: 0,
    });

    await SubscriptionModel.create({
      workspaceId: demoWorkspace._id,
      planId: freePlan._id,
      stripeCustomerId: "cus_demo_fake",
      status: SubscriptionStatus.ACTIVE,
      interval: "monthly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    });

    console.log("✅ Demo workspace created with 5 free credits");
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin:  admin@linkedon.io  / Admin123!@#");
  console.log("  Demo:   demo@linkedon.io   / Demo123!@#");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
