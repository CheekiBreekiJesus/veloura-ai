import { rateLimit } from "express-rate-limit";

/**
 * Strict rate limiter for the POST /api/analyze endpoint.
 *
 * Limits each IP to 10 requests per 15-minute window.
 * This prevents quota exhaustion of the upstream OpenAI vision API
 * while still allowing real users to re-analyze several times per session.
 *
 * Returns a standard JSON error body (not an HTML page) so mobile clients
 * can handle the 429 gracefully.
 */
export const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a few minutes and try again." },
  skipSuccessfulRequests: false,
});
