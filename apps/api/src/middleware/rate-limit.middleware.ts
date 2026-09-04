import rateLimit from "express-rate-limit";
import { config } from "../config";

// Global rate limiter — applies to all routes
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimits.global.windowMs,
  max: config.rateLimits.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please slow down.",
    },
  },
  skip: (req) => req.path.startsWith("/health"),
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimits.auth.windowMs,
  max: config.rateLimits.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts. Please try again in 15 minutes.",
    },
  },
});

// Enrichment rate limiter
export const enrichmentRateLimiter = rateLimit({
  windowMs: config.rateLimits.enrichment.windowMs,
  max: config.rateLimits.enrichment.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many enrichment requests. Please slow down.",
    },
  },
});
