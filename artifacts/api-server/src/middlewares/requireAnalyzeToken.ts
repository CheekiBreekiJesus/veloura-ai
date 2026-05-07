import type { Request, Response, NextFunction } from "express";
import { validateToken } from "../lib/token";

/**
 * Middleware that validates the short-lived analyze token issued by
 * GET /api/auth/token. Rejects requests that are missing, expired, or
 * tampered with, preventing the analyze endpoint from being used as
 * an unauthenticated proxy to the billable OpenAI vision API.
 */
export function requireAnalyzeToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Missing authorization token. Call GET /api/auth/token first.",
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const result = validateToken(token);

  if (!result.valid) {
    req.log.warn({ reason: result.reason }, "Analyze token rejected");
    res.status(401).json({
      error: `Invalid or expired token (${result.reason}). Call GET /api/auth/token to get a new one.`,
    });
    return;
  }

  next();
}
