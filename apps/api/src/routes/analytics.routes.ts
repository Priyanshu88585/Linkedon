import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { EnrichmentModel } from "@linkedon/database";

export const analyticsRouter = Router();

// Ensure user is authenticated for all analytics routes
analyticsRouter.use(authenticate);

/**
 * GET /api/v1/analytics/overview
 * Returns top-level KPIs: Total Enriched, Credits Spent, Overall Hit Rate
 */
analyticsRouter.get("/overview", async (req: AuthenticatedRequest, res) => {
  // Aggregate total enrichments and successful hits
  const stats = await EnrichmentModel.aggregate([
    { $match: { workspaceId: req.workspaceId } },
    {
      $group: {
        _id: null,
        totalEnriched: { $sum: 1 },
        totalCost: { $sum: "$cost" },
        successfulHits: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
        },
      },
    },
  ]);

  const overview = stats.length > 0 ? stats[0] : { totalEnriched: 0, totalCost: 0, successfulHits: 0 };
  const hitRate = overview.totalEnriched > 0 
    ? Math.round((overview.successfulHits / overview.totalEnriched) * 100) 
    : 0;

  res.json({
    success: true,
    data: {
      totalEnriched: overview.totalEnriched,
      creditsSpent: overview.totalCost,
      hitRate,
    },
  });
});

/**
 * GET /api/v1/analytics/usage-trend
 * Returns a daily breakdown of enrichments for a line chart (Last 30 days)
 */
analyticsRouter.get("/usage-trend", async (req: AuthenticatedRequest, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trend = await EnrichmentModel.aggregate([
    {
      $match: {
        workspaceId: req.workspaceId,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: trend,
  });
});

/**
 * GET /api/v1/analytics/providers
 * Returns usage grouped by provider
 */
analyticsRouter.get("/providers", async (req: AuthenticatedRequest, res) => {
  const providerStats = await EnrichmentModel.aggregate([
    { $match: { workspaceId: req.workspaceId } },
    {
      $group: {
        _id: "$provider", // "APOLLO", "CLEARBIT", "HUNTER"
        count: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
        },
      },
    },
  ]);

  res.json({
    success: true,
    data: providerStats,
  });
});
