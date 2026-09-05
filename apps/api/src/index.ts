import "express-async-errors";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { connectDatabase } from "@linkedon/database";
import { config } from "./config";
import { errorHandler } from "./middleware/error.middleware";
import { requestLogger } from "./middleware/request-logger.middleware";
import { globalRateLimiter } from "./middleware/rate-limit.middleware";

// Route imports
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { workspaceRouter } from "./routes/workspace.routes";
import { contactRouter } from "./routes/contact.routes";
import { enrichmentRouter } from "./routes/enrichment.routes";
import { searchRouter } from "./routes/search.routes";
import { listRouter } from "./routes/list.routes";
import { creditRouter } from "./routes/credit.routes";
import { billingRouter } from "./routes/billing.routes";
import { apiKeyRouter } from "./routes/api-key.routes";
import { extensionRouter } from "./routes/extension.routes";
import { webhookRouter } from "./routes/webhook.routes";
import { adminRouter } from "./routes/admin.routes";
import { healthRouter } from "./routes/health.routes";
import { bulkRouter } from "./routes/bulk.routes";
import { analyticsRouter } from "./routes/analytics.routes";

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-Id", "X-Idempotency-Key"],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Stripe webhooks need raw body — must come BEFORE express.json()
app.use("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());

// ─── Logging & Rate Limiting ──────────────────────────────────────────────────
if (config.nodeEnv !== "test") {
  app.use(morgan("combined"));
}
app.use(requestLogger);
app.use(globalRateLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/contacts", contactRouter);
app.use("/api/v1/enrichment", enrichmentRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/lists", listRouter);
app.use("/api/v1/credits", creditRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/bulk", bulkRouter);
app.use("/api/v1/api-keys", apiKeyRouter);
app.use("/api/v1/extension", extensionRouter);
app.use("/api/v1/webhooks", webhookRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/health", healthRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server Bootstrap ─────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDatabase(config.mongoUri);
  app.listen(config.port, () => {
    console.log(`\n🚀 Linkedon API running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   API Prefix:  /api/v1\n`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

export { app };
