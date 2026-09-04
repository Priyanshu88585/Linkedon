import { Router } from "express";
import Stripe from "stripe";
import { SubscriptionModel, PlanModel, CreditBalanceModel } from "@linkedon/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";
import { config } from "../config";

export const billingRouter = Router();
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

billingRouter.use(authenticate);

billingRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const [subscription, balance] = await Promise.all([
    SubscriptionModel.findOne({ workspaceId: req.workspaceId }).populate("planId"),
    CreditBalanceModel.findOne({ workspaceId: req.workspaceId }),
  ]);
  res.json({ success: true, data: { subscription, balance } });
});

billingRouter.post("/checkout", async (req: AuthenticatedRequest, res) => {
  if (!stripe) throw HttpErrors.internal("Billing not configured");
  const { planId, interval, successUrl, cancelUrl } = req.body;
  const plan = await PlanModel.findById(planId);
  if (!plan) throw HttpErrors.notFound("Plan not found");
  const priceId = interval === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
  if (!priceId) throw HttpErrors.badRequest("Plan not available for purchase");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { workspaceId: req.workspaceId! },
  });

  res.json({ success: true, data: { url: session.url } });
});

billingRouter.post("/portal", async (req: AuthenticatedRequest, res) => {
  if (!stripe) throw HttpErrors.internal("Billing not configured");
  const subscription = await SubscriptionModel.findOne({ workspaceId: req.workspaceId });
  if (!subscription?.stripeCustomerId) throw HttpErrors.badRequest("No billing account found");

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: req.body.returnUrl ?? config.appUrl + "/billing",
  });

  res.json({ success: true, data: { url: session.url } });
});
