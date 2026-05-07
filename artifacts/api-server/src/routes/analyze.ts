import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

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

router.post("/analyze", async (req, res) => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64: string;
    mimeType: string;
  };

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "imageBase64 and mimeType are required" });
    return;
  }

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

  const analysisResult = JSON.parse(cleaned) as unknown;
  res.json(analysisResult);
});

export default router;
