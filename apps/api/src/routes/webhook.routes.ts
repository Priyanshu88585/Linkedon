import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { SubscriptionModel, CreditBalanceModel, PlanModel } from "@linkedon/database";
import { SubscriptionStatus } from "@linkedon/types";
import { config } from "../config";

export const webhookRouter = Router();
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

// POST /webhooks/stripe
// Note: This route receives raw body (registered before express.json() in app)
webhookRouter.post("/stripe", async (req: Request, res: Response) => {
  if (!stripe || !config.stripeWebhookSecret) {
    return res.status(400).json({ error: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
  } catch {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const workspaceId = (event.data.object as any).metadata?.workspaceId;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const plan = await PlanModel.findOne({ stripePriceIdMonthly: sub.items.data[0]?.price.id });
      if (workspaceId && plan) {
        await SubscriptionModel.findOneAndUpdate(
          { workspaceId },
          {
            planId: plan._id,
            stripeSubscriptionId: sub.id,
            status: sub.status as SubscriptionStatus,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          { upsert: true }
        );
        // Grant monthly credits
        await CreditBalanceModel.findOneAndUpdate(
          { workspaceId },
          { $inc: { balance: plan.monthlyCredits } },
          { upsert: true }
        );
      }
      break;
    }
    case "customer.subscription.deleted": {
      const freePlan = await PlanModel.findOne({ name: "free" });
      if (workspaceId && freePlan) {
        await SubscriptionModel.findOneAndUpdate(
          { workspaceId },
          { status: SubscriptionStatus.CANCELED, planId: freePlan._id }
        );
      }
      break;
    }
    case "invoice.payment_failed": {
      if (workspaceId) {
        await SubscriptionModel.findOneAndUpdate({ workspaceId }, { status: SubscriptionStatus.PAST_DUE });
      }
      break;
    }
  }

  res.json({ received: true });
});
