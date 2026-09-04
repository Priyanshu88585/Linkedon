import { Router, Request, Response } from "express";
import { mongoose } from "@linkedon/database";
import Redis from "ioredis";
import { config } from "../config";

export const healthRouter = Router();

let redis: Redis | null = null;
try {
  redis = new Redis(config.redisUrl, { lazyConnect: true, enableOfflineQueue: false });
} catch {}

healthRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "linkedon-api",
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
  });
});

healthRouter.get("/db", async (_req: Request, res: Response) => {
  const state = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const isHealthy = state === 1;
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: states[state] ?? "unknown",
      latencyMs: isHealthy ? await pingMongo() : null,
    },
  });
});

healthRouter.get("/redis", async (_req: Request, res: Response) => {
  if (!redis) {
    return res.status(503).json({ success: false, data: { status: "not configured" } });
  }
  try {
    const start = Date.now();
    await redis.ping();
    const latencyMs = Date.now() - start;
    res.json({ success: true, data: { status: "connected", latencyMs } });
  } catch (err) {
    res.status(503).json({ success: false, data: { status: "error", error: String(err) } });
  }
});

async function pingMongo(): Promise<number | null> {
  try {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    return Date.now() - start;
  } catch {
    return null;
  }
}
