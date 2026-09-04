import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function createError(
  message: string,
  statusCode: number = 500,
  code: string = "INTERNAL_ERROR",
  details?: unknown
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  err.details = details;
  return err;
}

export const HttpErrors = {
  badRequest: (message: string, details?: unknown) =>
    createError(message, 400, "BAD_REQUEST", details),
  unauthorized: (message = "Unauthorized") =>
    createError(message, 401, "UNAUTHORIZED"),
  forbidden: (message = "Forbidden") =>
    createError(message, 403, "FORBIDDEN"),
  notFound: (message = "Not found") =>
    createError(message, 404, "NOT_FOUND"),
  conflict: (message: string) =>
    createError(message, 409, "CONFLICT"),
  tooManyRequests: (message = "Too many requests") =>
    createError(message, 429, "RATE_LIMITED"),
  paymentRequired: (message = "Insufficient credits") =>
    createError(message, 402, "INSUFFICIENT_CREDITS"),
  internal: (message = "Internal server error") =>
    createError(message, 500, "INTERNAL_ERROR"),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isDev = process.env.NODE_ENV === "development";

  // Never log or expose stack traces in production
  if (isDev) {
    console.error(`[ERROR] ${req.method} ${req.path}`, err);
  } else {
    console.error(`[ERROR] ${err.code ?? "INTERNAL"}: ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code ?? "INTERNAL_ERROR",
      message: statusCode >= 500 && !isDev ? "Internal server error" : err.message,
      ...(err.details && isDev ? { details: err.details } : {}),
      requestId: req.headers["x-request-id"],
    },
  });
}
