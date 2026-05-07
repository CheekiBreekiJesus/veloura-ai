import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAnalyzeToken } from "../middlewares/requireAnalyzeToken";

const router = Router();

const makeupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many makeup preview requests — please try again later." },
});

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const MAX_BASE64_CHARS = 6 * 1024 * 1024;
const MAX_CONCURRENT = 2;
let activeRequests = 0;

function buildEditPrompt(productName: string, productDescription: string): string {
  return (
    `Apply ${productName} makeup to this person's face. ` +
    `${productDescription} ` +
    `Keep the person's face shape, skin tone, hair, and background identical — ` +
    `only change the makeup application. ` +
    `The result should look like a high-quality editorial portrait photograph with ` +
    `the described makeup perfectly and professionally applied.`
  );
}

router.post(
  "/makeup-try-on",
  requireAnalyzeToken,
  makeupLimiter,
  async (req, res): Promise<void> => {
    const { imageBase64, mimeType, productName, productCategory, productDescription } = req.body as {
      imageBase64?: unknown;
      mimeType?: unknown;
      productName?: unknown;
      productCategory?: unknown;
      productDescription?: unknown;
    };

    if (typeof imageBase64 !== "string" || !imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }
    if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.has(mimeType)) {
      res.status(400).json({ error: "Unsupported image type" });
      return;
    }
    if (imageBase64.length > MAX_BASE64_CHARS) {
      res.status(400).json({ error: "Image too large (max 6 MB)" });
      return;
    }
    if (typeof productName !== "string" || !productName.trim()) {
      res.status(400).json({ error: "productName is required" });
      return;
    }
    if (typeof productCategory !== "string" || !productCategory.trim()) {
      res.status(400).json({ error: "productCategory is required" });
      return;
    }
    if (typeof productDescription !== "string" || !productDescription.trim()) {
      res.status(400).json({ error: "productDescription is required" });
      return;
    }

    if (activeRequests >= MAX_CONCURRENT) {
      res.status(429).json({ error: "Server is busy — please try again in a moment" });
      return;
    }

    activeRequests++;
    try {
      const editPrompt = buildEditPrompt(productName.trim(), productDescription.trim());
      req.log.info({ productName }, "Generating makeup try-on preview via image edit");

      const imgBuffer = Buffer.from(imageBase64, "base64");
      const imgFile = new File([imgBuffer], "selfie.png", { type: mimeType });

      const imageResponse = await openai.images.edit({
        model: "gpt-image-1",
        image: imgFile,
        prompt: editPrompt,
        n: 1,
        size: "1024x1024",
      });

      const b64 = imageResponse.data?.[0]?.b64_json;
      if (!b64) {
        req.log.error("No image data returned from gpt-image-1 edit");
        res.status(500).json({ error: "Preview generation failed — please try again" });
        return;
      }

      res.json({ resultImageBase64: b64, mimeType: "image/png" });
    } catch (err) {
      req.log.error({ err }, "Makeup try-on generation failed");
      res.status(500).json({ error: "Preview generation failed — please try again" });
    } finally {
      activeRequests--;
    }
  }
);

export default router;
