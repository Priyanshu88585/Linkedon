import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

// Attach a unique request ID to every request for traceability
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers["x-request-id"] as string) ?? uuidv4();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    if (res.statusCode >= 400) {
      console.error("[REQUEST]", JSON.stringify(log));
    } else if (process.env.NODE_ENV === "development") {
      console.log("[REQUEST]", JSON.stringify(log));
    }
  });

  next();
}
