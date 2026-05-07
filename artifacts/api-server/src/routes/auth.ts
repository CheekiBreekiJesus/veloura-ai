import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { issueToken } from "../lib/token";

const router = Router();

/**
 * Strict rate limiter for the token endpoint — tighter than the analyze
 * limiter so an attacker cannot mass-generate tokens to work around per-IP
 * analysis limits.
 */
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many token requests — please wait and try again." },
});

/**
 * GET /api/auth/token
 *
 * Issues a short-lived (10-minute) signed token that authorizes exactly
 * one call to POST /api/analyze within the token's lifetime. Callers
 * must present this token as `Authorization: Bearer <token>` when calling
 * the analyze endpoint.
 *
 * This creates a meaningful identity boundary: automated abuse scripts
 * must successfully complete this two-step flow for every analysis, and
 * mass token generation is itself rate-limited per IP.
 */
router.get("/auth/token", tokenLimiter, (_req, res): void => {
  const token = issueToken();
  res.json({ token, expiresIn: 600 });
});

export default router;
