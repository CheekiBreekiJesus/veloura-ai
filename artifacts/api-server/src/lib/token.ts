import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { logger } from "./logger";

const TOKEN_SECRET = process.env.SESSION_SECRET ?? "";
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

if (!TOKEN_SECRET) {
  logger.warn("SESSION_SECRET is not set — analyze tokens will use an empty secret and are insecure");
}

interface TokenPayload {
  /** Issued-at timestamp (ms) */
  iat: number;
  /** Expiry timestamp (ms) */
  exp: number;
  /** Random nonce to prevent replay of identical payloads */
  nonce: string;
}

/**
 * Issues a short-lived (10-minute) HMAC-SHA256 signed token.
 * Format: `<base64url-payload>.<hex-signature>`
 */
export function issueToken(): string {
  const now = Date.now();
  const payload: TokenPayload = {
    iat: now,
    exp: now + TOKEN_TTL_MS,
    nonce: randomBytes(16).toString("hex"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", TOKEN_SECRET).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

export type TokenValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Validates a token issued by `issueToken`.
 * Uses timing-safe comparison to prevent signature oracle attacks.
 */
export function validateToken(token: string): TokenValidationResult {
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx === -1) {
    return { valid: false, reason: "malformed token" };
  }

  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  const expectedSig = createHmac("sha256", TOKEN_SECRET).update(encoded).digest("hex");

  const sigBuf = Buffer.from(sig.padEnd(expectedSig.length, "0"), "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, reason: "invalid signature" };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    return { valid: false, reason: "malformed payload" };
  }

  if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
    return { valid: false, reason: "token expired" };
  }

  return { valid: true };
}
