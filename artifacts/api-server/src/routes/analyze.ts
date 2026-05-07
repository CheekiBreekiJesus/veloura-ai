import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { analyzeLimiter } from "../middlewares/rateLimiter";
import { requireAnalyzeToken } from "../middlewares/requireAnalyzeToken";

const router = Router();

const MAX_CONCURRENT = 3;
let activeRequests = 0;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const MAX_BASE64_CHARS = 6 * 1024 * 1024;

const SYSTEM_PROMPT = `You are a professional aesthetic analysis engine for a premium AI styling app.
Analyze the face in the image and return ONLY valid JSON — no markdown, no explanations.

Return exactly this structure (all fields required):
{
  "face_shape": "",
  "skin_tone": "",
  "undertone": "",
  "eye_shape": "",
  "lip_shape": "",
  "hair_type": "",
  "style_archetype": "",
  "color_palette": [],
  "beauty_recommendations": [],
  "fashion_recommendations": [],
  "hairstyle_suggestions": [],
  "glasses_suggestions": [],
  "jawline_definition": "",
  "cheekbone_prominence": "",
  "facial_symmetry_score": 0.0,
  "eyebrow_shape": "",
  "nose_shape": "",
  "skin_tone_category": "",
  "skin_evenness": "",
  "skin_type": "",
  "skin_concerns": {
    "acne": "",
    "redness": "",
    "dryness": "",
    "pores": "",
    "texture": ""
  },
  "contrast_level": "",
  "color_families": [],
  "hair_lengths": [],
  "recommended_style_direction": "",
  "earring_styles": [],
  "necklace_lengths": [],
  "aesthetic_archetypes": [],
  "skincare_focus": [],
  "makeup_direction": "",
  "fashion_direction": "",
  "shopping_keywords": []
}

Field-by-field rules:

face_shape: one of oval, round, square, heart, diamond, oblong, unknown
skin_tone: human-readable (e.g. "Light Ivory with warm undertones")
undertone: one of warm, cool, neutral
eye_shape: describe specifically (e.g. "Almond", "Hooded", "Monolid", "Upturned")
lip_shape: describe specifically (e.g. "Full lips", "Thin upper lip", "Bow-shaped")
hair_type: describe texture and structure (e.g. "Fine wavy", "Thick curly", "Straight coarse")
style_archetype: single concise label (e.g. "Romantic Classic", "Modern Minimalist")

color_palette: 5–8 hex codes that complement the person's complexion and archetype
beauty_recommendations: 3–5 specific, actionable beauty tips
fashion_recommendations: 3–5 specific outfit and styling tips
hairstyle_suggestions: 3–5 specific haircut/style suggestions
glasses_suggestions: 3–5 frame styles that suit the face shape

jawline_definition: one of soft, medium, sharp
cheekbone_prominence: one of low, medium, high
facial_symmetry_score: float 0.0–1.0 (visual estimate)
eyebrow_shape: describe specifically (e.g. "Straight", "Arched", "Feathered", "Rounded", "Angled", "Softly Arched")
nose_shape: describe specifically (e.g. "Soft Button", "Refined Straight", "Gently Rounded", "Aquiline", "Broad", "Narrow Bridge")

skin_type: one of oily, combination, normal, dry, sensitive — default "normal" if uncertain
skin_tone_category: one of very_light, light, medium, tan, deep
skin_evenness: one of low, medium, high
skin_concerns.acne / redness / dryness / pores / texture: one of none, mild, moderate, severe — default "none" if uncertain

contrast_level: one of low, medium, high (overall light/dark contrast of features vs skin)
color_families: 3–6 labels e.g. "earth tones", "pastels", "jewel tones", "neutrals", "warm neutrals", "cool jewels"

hair_lengths: array of recommended lengths — e.g. ["short", "medium", "layered"]
recommended_style_direction: one of soft, structured, voluminous, minimalist, edgy, classic

earring_styles: 3–5 earring styles that suit the face shape and archetype
necklace_lengths: 2–4 recommended necklace lengths from: short, medium, long, layered

aesthetic_archetypes: 2–4 aesthetic identities e.g. ["soft natural", "minimalist clean", "classic elegant"]

skincare_focus: 2–4 focus areas e.g. ["hydration", "glow", "texture", "oil control"]
makeup_direction: one of natural, soft glam, glam, bold, editorial
fashion_direction: concise label e.g. "minimalist luxury", "romantic casual", "polished classic"
shopping_keywords: 6–10 SEO-style search tags for product recommendations`;


function parseAnalysisJson(content: string): Record<string, unknown> | null {
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

router.post("/analyze", analyzeLimiter, requireAnalyzeToken, async (req, res): Promise<void> => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64: unknown;
    mimeType: unknown;
  };

  if (typeof imageBase64 !== "string" || typeof mimeType !== "string") {
    res.status(400).json({ error: "imageBase64 and mimeType are required strings" });
    return;
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    res.status(400).json({
      error: `Unsupported image type. Allowed: ${[...ALLOWED_MIME_TYPES].join(", ")}`,
    });
    return;
  }

  if (imageBase64.length > MAX_BASE64_CHARS) {
    res.status(400).json({ error: "Image payload too large. Please use a smaller photo." });
    return;
  }

  if (!/^[A-Za-z0-9+/]+=*$/.test(imageBase64.slice(0, 100))) {
    res.status(400).json({ error: "imageBase64 must be a valid base64-encoded image." });
    return;
  }

  if (activeRequests >= MAX_CONCURRENT) {
    req.log.warn({ activeRequests }, "Analyze concurrency cap reached");
    res.status(503).json({ error: "Server is busy — please try again in a moment." });
    return;
  }

  activeRequests++;
  req.log.info({ activeRequests, ip: req.ip }, "Analyze request started");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 3000,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
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
              text: "Analyze this person's facial features and produce a complete Aesthetic Identity Profile in the required JSON format.",
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from AI model" });
      return;
    }

    const analysisResult = parseAnalysisJson(content);
    if (!analysisResult) {
      req.log.error({ contentPreview: content.slice(0, 200) }, "Analyze model returned invalid JSON");
      res.status(500).json({ error: "AI returned malformed analysis JSON" });
      return;
    }

    res.json(analysisResult);
  } finally {
    activeRequests--;
    req.log.info({ activeRequests }, "Analyze request finished");
  }
});

export default router;
