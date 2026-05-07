import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { analyzeLimiter } from "../middlewares/rateLimiter";
import { requireAnalyzeToken } from "../middlewares/requireAnalyzeToken";

const router = Router();

// ── Concurrency cap ────────────────────────────────────────────────────────
// Limits simultaneous in-flight OpenAI vision calls to prevent runaway costs
// when many requests arrive at the same time (e.g. a botnet burst).
const MAX_CONCURRENT = 3;
let activeRequests = 0;

// ── MIME type allowlist ────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

// ── Base64 payload cap ─────────────────────────────────────────────────────
// A 6 MB base64 string encodes ~4.5 MB of binary data — sufficient for any
// reasonable selfie. Payloads above this are rejected before touching OpenAI.
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
  "skin_tone_category": "",
  "skin_evenness": "",
  "skin_concerns": {
    "acne": "",
    "redness": "",
    "dryness": ""
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

skin_tone_category: one of very_light, light, medium, tan, deep
skin_evenness: one of low, medium, high
skin_concerns.acne / redness / dryness: one of none, mild, moderate, severe

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

// ── Companion name generation ─────────────────────────────────────────────
const COMPANION_NAME_SYSTEM = `You are naming a personal AI beauty and fashion companion assistant.
Given a user's style profile, suggest ONE perfect name for their AI companion.

Rules:
- 4–8 letters, first name only
- Feminine or gender-neutral
- Match the aesthetic vibe:
  romantic / feminine / soft → poetic names (e.g. Celeste, Luna, Elara, Lyra, Seraphine trimmed to ≤8)
  minimalist / clean / modern → crisp names (e.g. Lena, Cleo, Noa, Mara, Zoe)
  edgy / bold / structured → sharp names (e.g. Zara, Reva, Nova, Kira, Vera)
  bohemian / earthy / eclectic → free-spirited names (e.g. Iris, Faye, Sage, Wren, Blythe)
  classic / timeless / elegant → timeless names (e.g. Ava, Lea, Rose, Nina, Cara)
- Return ONLY the name. No punctuation, no explanation.`;

// ── Companion avatar prompt builder ──────────────────────────────────────
function buildAvatarPrompt(profile: Record<string, unknown>): string {
  const skinTone = typeof profile.skin_tone === "string" ? profile.skin_tone : "medium";
  const hairType = typeof profile.hair_type === "string" ? profile.hair_type : "wavy";
  const faceShape = typeof profile.face_shape === "string" ? profile.face_shape : "oval";
  const archetypes = Array.isArray(profile.aesthetic_archetypes)
    ? (profile.aesthetic_archetypes as string[]).slice(0, 3).join(", ")
    : typeof profile.style_archetype === "string"
    ? profile.style_archetype
    : "modern elegant";
  const palette = Array.isArray(profile.color_palette)
    ? (profile.color_palette as string[]).slice(0, 2).join(" and ")
    : "#C4956A";

  return `A stylized illustrated portrait of a personal AI beauty and fashion companion. She is a fictional stylized character — not a real person, not photorealistic. Illustrated editorial art style.

Physical reference: skin tone ${skinTone}, ${hairType} hair, ${faceShape} face shape. Dominant accent colors from her palette: ${palette}. Aesthetic identity: ${archetypes}.

Art direction: magazine editorial illustration, clean confident lines, modern luxury fashion aesthetic, centered square composition, close-up portrait with soft illustrated style similar to a premium fashion magazine character illustration. Smooth painterly texture, soft bokeh background with a subtle gradient. Stylish, aspirational, warm and approachable expression. No text, no words, no labels, no watermarks.`;
}

// ── Generate companion identity (name + avatar) in parallel ──────────────
async function generateCompanionIdentity(
  profile: Record<string, unknown>,
  log: { warn: (obj: object, msg: string) => void }
): Promise<{ companion_name: string | null; companion_avatar_url: string | null }> {
  const archetypes = Array.isArray(profile.aesthetic_archetypes)
    ? (profile.aesthetic_archetypes as string[]).join(", ")
    : typeof profile.style_archetype === "string"
    ? profile.style_archetype
    : "";
  const fashionDir =
    typeof profile.fashion_direction === "string" ? profile.fashion_direction : "";
  const undertone = typeof profile.undertone === "string" ? profile.undertone : "";

  const [nameResult, avatarResult] = await Promise.allSettled([
    openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_completion_tokens: 12,
      temperature: 0.2,
      messages: [
        { role: "system", content: COMPANION_NAME_SYSTEM },
        {
          role: "user",
          content: `Style archetypes: ${archetypes}\nFashion direction: ${fashionDir}\nUndertone: ${undertone}`,
        },
      ],
    }),
    openai.images.generate({
      model: "dall-e-3",
      prompt: buildAvatarPrompt(profile),
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
      n: 1,
    }),
  ]);

  let companion_name: string | null = null;
  if (nameResult.status === "fulfilled") {
    const raw = nameResult.value.choices[0]?.message?.content?.trim() ?? "";
    // Spec: 4–8 letters, first name only
    companion_name = /^[A-Za-z]{4,8}$/.test(raw) ? raw : null;
  } else {
    log.warn({ err: nameResult.reason }, "Companion name generation failed");
  }

  let companion_avatar_url: string | null = null;
  if (avatarResult.status === "fulfilled") {
    const b64 = avatarResult.value.data?.[0]?.b64_json ?? null;
    if (b64) companion_avatar_url = `data:image/png;base64,${b64}`;
  } else {
    log.warn({ err: avatarResult.reason }, "Companion avatar generation failed");
  }

  return { companion_name, companion_avatar_url };
}

router.post("/analyze", analyzeLimiter, requireAnalyzeToken, async (req, res): Promise<void> => {
  // ── Input validation ─────────────────────────────────────────────────────
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

  // Basic base64 format check — reject obviously non-image payloads.
  if (!/^[A-Za-z0-9+/]+=*$/.test(imageBase64.slice(0, 100))) {
    res.status(400).json({ error: "imageBase64 must be a valid base64-encoded image." });
    return;
  }

  // ── Concurrency cap ──────────────────────────────────────────────────────
  if (activeRequests >= MAX_CONCURRENT) {
    req.log.warn({ activeRequests }, "Analyze concurrency cap reached");
    res.status(503).json({ error: "Server is busy — please try again in a moment." });
    return;
  }

  activeRequests++;
  req.log.info({ activeRequests, ip: req.ip }, "Analyze request started");

  try {
    // ── Main vision analysis ───────────────────────────────────────────────
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
                detail: "high",
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

    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const analysisResult = JSON.parse(cleaned) as Record<string, unknown>;

    // ── Companion identity generation (name + avatar, parallel) ───────────
    const { companion_name, companion_avatar_url } = await generateCompanionIdentity(
      analysisResult,
      req.log
    );

    if (companion_name) analysisResult.companion_name = companion_name;
    if (companion_avatar_url) analysisResult.companion_avatar_url = companion_avatar_url;

    res.json(analysisResult);
  } finally {
    activeRequests--;
    req.log.info({ activeRequests }, "Analyze request finished");
  }
});

export default router;
