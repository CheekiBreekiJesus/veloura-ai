import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAnalyzeToken } from "../middlewares/requireAnalyzeToken";

const router = Router();

const removeBgLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many background-removal requests — please try again later." },
});

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_BASE64_CHARS = 6 * 1024 * 1024;
const MAX_CONCURRENT = 2;
let activeRequests = 0;

router.post(
  "/remove-background",
  requireAnalyzeToken,
  removeBgLimiter,
  async (req, res): Promise<void> => {
    const { imageBase64, mimeType } = req.body as {
      imageBase64?: unknown;
      mimeType?: unknown;
    };

    if (typeof imageBase64 !== "string" || !imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }
    if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.has(mimeType)) {
      res.status(400).json({ error: "Unsupported image type. Use jpeg, png, or webp." });
      return;
    }
    if (imageBase64.length > MAX_BASE64_CHARS) {
      res.status(400).json({ error: "Image too large (max 6 MB)" });
      return;
    }
    if (activeRequests >= MAX_CONCURRENT) {
      res.status(429).json({ error: "Server is busy — please try again in a moment" });
      return;
    }

    activeRequests++;
    try {
      const { removeBackground } = await import("@imgly/background-removal-node");

      const imgBuf = Buffer.from(imageBase64, "base64");
      const blob = await removeBackground(imgBuf, {
        output: { format: "image/png", quality: 0.9 },
      });

      const arrayBuf = await blob.arrayBuffer();
      const resultBuf = Buffer.from(arrayBuf);
      const resultBase64 = resultBuf.toString("base64");

      res.json({ imageBase64: resultBase64, mimeType: "image/png" });
    } catch (err) {
      req.log.error({ err }, "Background removal failed");
      res.status(500).json({ error: "Background removal failed — please try again" });
    } finally {
      activeRequests--;
    }
  }
);

export default router;
