// ─── Application Configuration ────────────────────────────────────────────────
// All config comes from environment variables — never hardcode secrets

function required(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  nodeEnv: optional("NODE_ENV", "development") as "development" | "production" | "test",
  port: parseInt(optional("PORT", "3001"), 10),

  // Database
  mongoUri: optional("MONGODB_URI", "mongodb://localhost:27017/linkedon"),
  redisUrl: optional("REDIS_URL", "redis://localhost:6379"),

  // Auth
  jwtSecret: optional("JWT_SECRET", "dev-jwt-secret-change-in-production"),
  jwtRefreshSecret: optional("JWT_REFRESH_SECRET", "dev-refresh-secret-change-in-production"),
  jwtAccessExpiry: optional("JWT_ACCESS_EXPIRY", "15m"),
  jwtRefreshExpiry: optional("JWT_REFRESH_EXPIRY", "7d"),

  // Encryption
  encryptionKey: optional("ENCRYPTION_KEY", "dev-32-char-enc-key-change-prod!!"),

  // CORS
  get corsOrigins(): string[] {
    const origins = optional(
      "CORS_ORIGINS",
      "http://localhost:3000,http://localhost:3001"
    );
    return origins.split(",").map((o) => o.trim());
  },

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  // Email
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: optional("EMAIL_FROM", "noreply@linkedon.io"),

  // URLs
  appUrl: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  apiUrl: optional("NEXT_PUBLIC_API_URL", "http://localhost:3001"),

  // Feature flags
  enableRealProviders: optional("ENABLE_REAL_PROVIDERS", "false") === "true",

  // S3
  s3: {
    bucket: optional("S3_BUCKET", "linkedon-uploads"),
    region: optional("S3_REGION", "us-east-1"),
    accessKey: process.env.S3_ACCESS_KEY ?? "",
    secretKey: process.env.S3_SECRET_KEY ?? "",
    endpoint: process.env.S3_ENDPOINT,
  },

  // Rate limits
  rateLimits: {
    global: {
      windowMs: 60 * 1000,   // 1 minute
      max: 200,
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
    },
    enrichment: {
      windowMs: 60 * 1000,
      max: 20,
    },
  },

  get isDevelopment() {
    return this.nodeEnv === "development";
  },
  get isProduction() {
    return this.nodeEnv === "production";
  },
};
