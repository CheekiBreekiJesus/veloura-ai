import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are a professional aesthetic analysis engine used in a premium AI styling app.
Analyze facial features from the image and output ONLY valid JSON following the required schema.
Do not include explanations. Do not include markdown. Only return JSON.

Return exactly this structure:
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
  "glasses_suggestions": []
}

For color_palette, return 5-8 hex color codes (e.g. "#F5E6D3") that suit the person's complexion and style archetype.
For beauty_recommendations, fashion_recommendations, hairstyle_suggestions, and glasses_suggestions, return 3-5 specific, actionable items each.`;

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
    max_completion_tokens: 2048,
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
            text: "Analyze this person's facial features and provide a complete aesthetic profile in the required JSON format.",
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
