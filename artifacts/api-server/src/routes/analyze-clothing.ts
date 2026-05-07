import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { rateLimit } from "express-rate-limit";
import { requireAnalyzeToken } from "../middlewares/requireAnalyzeToken";

const router = Router();

const clothingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many clothing analysis requests — please try again later." },
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

function buildClothingPrompt(profile: Record<string, unknown>): string {
  const season =
    typeof profile.color_season === "string" ? profile.color_season : null;
  const undertone =
    typeof profile.undertone === "string" ? profile.undertone : null;
  const archetypes =
    Array.isArray(profile.aesthetic_archetypes) && profile.aesthetic_archetypes.length
      ? (profile.aesthetic_archetypes as string[]).join(", ")
      : typeof profile.style_archetype === "string"
      ? profile.style_archetype
      : null;
  const colorPalette = Array.isArray(profile.color_palette)
    ? (profile.color_palette as string[]).slice(0, 6).join(", ")
    : "";
  const fashionDir =
    typeof profile.fashion_direction === "string" ? profile.fashion_direction : null;
  const contrastLevel =
    typeof profile.contrast_level === "string" ? profile.contrast_level : null;

  return `You are a precision fashion analyst for a premium AI styling app.

Analyze the clothing item in the image and return ONLY valid JSON with this exact structure:
{
  "name": "short descriptive name (e.g. 'Cream Linen Blazer', 'Floral Midi Dress')",
  "category": "Tops|Bottoms|Dresses|Outerwear|Shoes|Accessories",
  "dominantColor": "#hexcode of the primary color",
  "compatibilityScore": 0,
  "compatibilityNotes": "1-2 sentences: what specifically works or doesn't work with this profile"
}

User's style profile to match against:
- Style archetypes: ${archetypes ?? "not set"}
- Color season: ${season ?? "not set"}
- Skin undertone: ${undertone ?? "not set"}
- Personal color palette: ${colorPalette || "not set"}
- Fashion direction: ${fashionDir ?? "not set"}
- Contrast level: ${contrastLevel ?? "not set"}

compatibilityScore rules (integer 0-100):
- 85-100: excellent — color, silhouette, and style archetype all align strongly
- 70-84: good — most elements align; minor style or color divergence
- 55-69: moderate — one significant mismatch (e.g. wrong season color, wrong silhouette for face)
- 40-54: weak — multiple mismatches but could work styled carefully
- 0-39: poor — clashes with undertone, season palette, or opposes the archetype

Be precise and honest. Consider undertone-color harmony deeply. Return ONLY the JSON object, no markdown.`;
}

router.post(
  "/analyze-clothing",
  requireAnalyzeToken,
  clothingLimiter,
  async (req, res): Promise<void> => {
    const { imageBase64, mimeType, profile } = req.body as {
      imageBase64?: unknown;
      mimeType?: unknown;
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
    if (activeRequests >= MAX_CONCURRENT) {
      res
        .status(429)
        .json({ error: "Server is busy — please try again in a moment" });
      return;
    }

    const safeProfile =
      profile && typeof profile === "object"
        ? (profile as Record<string, unknown>)
        : {};
    const systemPrompt = buildClothingPrompt(safeProfile);

    activeRequests++;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 350,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "low",
                },
              },
              {
                type: "text",
                text: "Analyze this clothing item against my style profile.",
              },
            ],
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        req.log.error({ raw }, "No JSON in clothing analysis response");
        res.status(500).json({ error: "Analysis failed — please try again" });
        return;
      }

      const result = JSON.parse(jsonMatch[0]) as {
        name: string;
        category: string;
        dominantColor: string;
        compatibilityScore: number;
        compatibilityNotes: string;
      };

      res.json(result);
    } catch (err) {
      req.log.error({ err }, "Clothing analysis OpenAI call failed");
      res.status(500).json({ error: "Analysis failed — please try again" });
    } finally {
      activeRequests--;
    }
  }
);

export default router;
