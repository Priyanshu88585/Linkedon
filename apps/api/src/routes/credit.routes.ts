import { Router } from "express";
import { CreditBalanceModel, CreditTransactionModel } from "@linkedon/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";

export const creditRouter = Router();
creditRouter.use(authenticate);

creditRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const balance = await CreditBalanceModel.findOne({ workspaceId: req.workspaceId });
  if (!balance) throw HttpErrors.notFound("Credit balance not found");
  res.json({ success: true, data: balance });
});

creditRouter.get("/history", async (req: AuthenticatedRequest, res) => {
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    CreditTransactionModel.find({ workspaceId: req.workspaceId })
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    CreditTransactionModel.countDocuments({ workspaceId: req.workspaceId }),
  ]);
  res.json({ success: true, data: transactions, meta: { page, limit, total } });
});
