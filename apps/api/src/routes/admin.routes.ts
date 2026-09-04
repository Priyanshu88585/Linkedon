import { Router } from "express";
import { UserModel, WorkspaceModel, EnrichmentModel, CreditBalanceModel, AuditLogModel } from "@linkedon/database";
import { authenticate, requireAdmin, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";
import { UserStatus } from "@linkedon/types";

export const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

// GET /admin/stats
adminRouter.get("/stats", async (_req, res) => {
  const [totalUsers, activeUsers, totalEnrichments, successfulEnrichments] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ status: UserStatus.ACTIVE }),
    EnrichmentModel.countDocuments(),
    EnrichmentModel.countDocuments({ status: "completed" }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      totalEnrichments,
      successfulEnrichments,
      successRate: totalEnrichments > 0 ? successfulEnrichments / totalEnrichments : 0,
    },
  });
});

// GET /admin/users
adminRouter.get("/users", async (req, res) => {
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserModel.countDocuments(),
  ]);

  res.json({ success: true, data: users, meta: { page, limit, total } });
});

// PATCH /admin/users/:id/suspend
adminRouter.patch("/users/:id/suspend", async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(
    req.params.id,
    { status: UserStatus.SUSPENDED },
    { new: true }
  );
  if (!user) throw HttpErrors.notFound("User not found");
  res.json({ success: true, data: user });
});

// GET /admin/audit-logs
adminRouter.get("/audit-logs", async (req, res) => {
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLogModel.find().sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLogModel.countDocuments(),
  ]);

  res.json({ success: true, data: logs, meta: { page, limit, total } });
});
