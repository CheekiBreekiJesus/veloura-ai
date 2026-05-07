import app from "./app";
import { logger } from "./lib/logger";

// ── Startup secret validation ───────────────────────────────────────────────
// SESSION_SECRET is required for signing analyze/chat tokens. An empty or
// missing secret means all tokens can be trivially forged. Fail hard in
// production so a misconfigured deploy can never silently accept forged tokens.
const isProduction = process.env["NODE_ENV"] === "production";
if (!process.env["SESSION_SECRET"]) {
  if (isProduction) {
    logger.error(
      "SESSION_SECRET environment variable is required in production. Set it in Replit Secrets before deploying."
    );
    process.exit(1);
  } else {
    logger.warn(
      "SESSION_SECRET is not set — token signing uses an empty secret and is insecure. Set it before deploying."
    );
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
