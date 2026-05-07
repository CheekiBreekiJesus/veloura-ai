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

async function describeFace(
  imageBase64: string,
  mimeType: string,
  profile: Record<string, unknown>
): Promise<string> {
  const undertone = typeof profile.undertone === "string" ? profile.undertone : "neutral";
  const skinTone = typeof profile.skin_tone === "string" ? profile.skin_tone : "medium";
  const eyeShape = typeof profile.eye_shape === "string" ? profile.eye_shape : "";
  const faceShape = typeof profile.face_shape === "string" ? profile.face_shape : "";
  const lipShape = typeof profile.lip_shape === "string" ? profile.lip_shape : "";
  const hairType = typeof profile.hair_type === "string" ? profile.hair_type : "";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 400,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `You are a professional portrait artist describing a face for image generation. 
Profile context: skin_tone=${skinTone}, undertone=${undertone}, eye_shape=${eyeShape}, face_shape=${faceShape}, lip_shape=${lipShape}, hair_type=${hairType}.
Describe the person's exact appearance in 3–4 concise sentences: skin color and tone, eye color and shape, hair color and length, distinctive facial features. 
Be precise and neutral — no compliments. Output ONLY the description.`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: "high",
            },
          },
          { type: "text", text: "Describe this person's facial features and coloring." },
        ],
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? `A person with ${skinTone} skin and ${undertone} undertones.`;
}

function buildDallePrompt(faceDescription: string, lookName: string, lookPromptFragment: string): string {
  return `Photorealistic editorial beauty portrait of a real person. ${faceDescription} The subject is wearing ${lookPromptFragment}. Studio lighting, soft bokeh background, professional photography, 4K ultra-detailed skin texture, no text, no watermark. The makeup is the focal point — perfectly blended, high-fashion quality.`;
}

router.post(
  "/makeup-try-on",
  requireAnalyzeToken,
  makeupLimiter,
  async (req, res): Promise<void> => {
    const { imageBase64, mimeType, lookName, lookPromptFragment, profile } = req.body as {
      imageBase64?: unknown;
      mimeType?: unknown;
      lookName?: unknown;
      lookPromptFragment?: unknown;
      profile?: unknown;
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
    if (typeof lookName !== "string" || !lookName.trim()) {
      res.status(400).json({ error: "lookName is required" });
      return;
    }
    if (typeof lookPromptFragment !== "string" || !lookPromptFragment.trim()) {
      res.status(400).json({ error: "lookPromptFragment is required" });
      return;
    }

    if (activeRequests >= MAX_CONCURRENT) {
      res.status(429).json({ error: "Server is busy — please try again in a moment" });
      return;
    }

    const safeProfile =
      profile && typeof profile === "object" ? (profile as Record<string, unknown>) : {};

    activeRequests++;
    try {
      const faceDescription = await describeFace(imageBase64, mimeType, safeProfile);
      const dallePrompt = buildDallePrompt(faceDescription, lookName.trim(), lookPromptFragment.trim());

      req.log.info({ lookName }, "Generating makeup try-on preview");

      const imageResponse = await openai.images.generate({
        model: "gpt-image-1",
        prompt: dallePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const b64 = imageResponse.data?.[0]?.b64_json;
      if (!b64) {
        req.log.error("No image data returned from gpt-image-1");
        res.status(500).json({ error: "Preview generation failed — please try again" });
        return;
      }

      res.json({ imageBase64: b64, mimeType: "image/png" });
    } catch (err) {
      req.log.error({ err }, "Makeup try-on generation failed");
      res.status(500).json({ error: "Preview generation failed — please try again" });
    } finally {
      activeRequests--;
    }
  }
);

export default router;
