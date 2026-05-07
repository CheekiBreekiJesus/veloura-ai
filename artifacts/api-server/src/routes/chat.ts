import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { rateLimit } from "express-rate-limit";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many chat requests — please wait a few minutes and try again." },
});

const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 2000;

function buildSystemPrompt(
  profile: Record<string, unknown>,
  userName: string | null,
  feedback?: Record<string, string>,
  healthConcerns?: string[]
): string {
  const name = userName ?? "you";

  const companionName =
    typeof profile.companion_name === "string" && profile.companion_name.trim()
      ? profile.companion_name.trim()
      : "Aura";

  const archetypes =
    Array.isArray(profile.aesthetic_archetypes) && profile.aesthetic_archetypes.length
      ? (profile.aesthetic_archetypes as string[]).join(", ")
      : typeof profile.style_archetype === "string"
      ? profile.style_archetype
      : "undefined";

  const season = typeof profile.color_season === "string" ? profile.color_season : null;
  const undertone = typeof profile.undertone === "string" ? profile.undertone : null;
  const faceShape = typeof profile.face_shape === "string" ? profile.face_shape : null;
  const skinTone = typeof profile.skin_tone === "string" ? profile.skin_tone : null;
  const eyeShape = typeof profile.eye_shape === "string" ? profile.eye_shape : null;
  const hairType = typeof profile.hair_type === "string" ? profile.hair_type : null;
  const makeupDir = typeof profile.makeup_direction === "string" ? profile.makeup_direction : null;
  const fashionDir = typeof profile.fashion_direction === "string" ? profile.fashion_direction : null;
  const lipShape = typeof profile.lip_shape === "string" ? profile.lip_shape : null;

  const skinConcerns =
    profile.skin_concerns && typeof profile.skin_concerns === "object"
      ? Object.entries(profile.skin_concerns as Record<string, string>)
          .filter(([, v]) => v !== "none")
          .map(([k, v]) => `${v} ${k}`)
          .join(", ") || "none"
      : "none";

  const skincareF = Array.isArray(profile.skincare_focus)
    ? (profile.skincare_focus as string[]).join(", ")
    : "";

  const colorPalette = Array.isArray(profile.color_palette)
    ? (profile.color_palette as string[]).slice(0, 5).join(", ")
    : "";
  const keywords = Array.isArray(profile.shopping_keywords)
    ? (profile.shopping_keywords as string[]).slice(0, 6).join(", ")
    : "";

  const likedItems = feedback
    ? Object.entries(feedback)
        .filter(([, v]) => v === "liked")
        .map(([k]) => k.slice(0, 80))
        .slice(0, 5)
    : [];
  const dislikedItems = feedback
    ? Object.entries(feedback)
        .filter(([, v]) => v === "disliked")
        .map(([k]) => k.slice(0, 80))
        .slice(0, 5)
    : [];

  const feedbackSection =
    likedItems.length || dislikedItems.length
      ? `\nUser style preferences — liked: ${likedItems.join("; ") || "none"}; disliked: ${dislikedItems.join("; ") || "none"}.`
      : "";

  const healthSection =
    healthConcerns && healthConcerns.length > 0
      ? `\nHealth & allergy constraints (hard limits — never recommend anything that conflicts): ${healthConcerns.join(", ")}.`
      : "";

  const measurementsText =
    typeof profile.measurements === "string" && profile.measurements.trim()
      ? profile.measurements.trim()
      : null;
  const measurementsSection = measurementsText
    ? `\nBody measurements: ${measurementsText} — factor into any sizing or fit advice.`
    : "";

  return `You are ${companionName} — ${name}'s personal AI stylist. You're warm, playful, and genuinely passionate about fashion, beauty, and skincare. You know ${name} deeply and weave that knowledge naturally into every reply — never as a clinical list, always as a knowledgeable friend who truly gets them.

Your scope: style & outfits, makeup & beauty, skincare (routines, ingredients, lifestyle tips), hair, jewelry & accessories, wellness habits that affect appearance, and shopping tied to their palette.

${name}'s profile:
- Archetypes: ${archetypes}
- Undertone: ${undertone ?? "unknown"} | Face: ${faceShape ?? "unknown"} | Eyes: ${eyeShape ?? "unknown"} | Lips: ${lipShape ?? "unknown"}
- Skin tone: ${skinTone ?? "unknown"} | Skin concerns: ${skinConcerns} | Skincare focus: ${skincareF || "general"}
- Hair: ${hairType ?? "unknown"}
- Color season: ${season ?? "not determined"} | Personal palette: ${colorPalette}
- Fashion direction: ${fashionDir ?? "not specified"} | Makeup direction: ${makeupDir ?? "not specified"}
- Style keywords: ${keywords}${measurementsSection}${feedbackSection}${healthSection}

Reply rules:
- Keep it to 1–3 short sentences unless the user asks for more.
- Use emoji naturally — a little warmth goes a long way 💛
- Reference ${name}'s specific features conversationally, not as a list.
- End every reply with a gentle follow-up question or hook to keep the conversation flowing.
- Never recite the whole profile back — weave it in as you talk.`;
}

router.post("/chat", chatLimiter, async (req, res): Promise<void> => {
  const { messages, profile, userName, feedback, healthConcerns } = req.body as {
    messages?: unknown;
    profile?: unknown;
    userName?: unknown;
    feedback?: unknown;
    healthConcerns?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }
  if (messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: `Too many messages (max ${MAX_MESSAGES})` });
    return;
  }

  for (const m of messages) {
    if (
      typeof m !== "object" ||
      m === null ||
      !["user", "assistant"].includes((m as { role?: string }).role ?? "") ||
      typeof (m as { content?: string }).content !== "string"
    ) {
      res
        .status(400)
        .json({ error: "Each message must have role (user|assistant) and content (string)" });
      return;
    }
    if ((m as { content: string }).content.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: `Message content too long (max ${MAX_MESSAGE_LENGTH} chars)` });
      return;
    }
  }

  const safeProfile =
    profile && typeof profile === "object" ? (profile as Record<string, unknown>) : {};
  const safeUserName =
    typeof userName === "string" && userName.trim() ? userName.trim() : null;
  const safeFeedback =
    feedback && typeof feedback === "object" && !Array.isArray(feedback)
      ? (feedback as Record<string, string>)
      : undefined;

  const safeHealthConcerns =
    Array.isArray(healthConcerns) && healthConcerns.every((c) => typeof c === "string")
      ? (healthConcerns as string[]).slice(0, 20)
      : undefined;

  const systemPrompt = buildSystemPrompt(safeProfile, safeUserName, safeFeedback, safeHealthConcerns);

  const chatMessages = (messages as Array<{ role: string; content: string }>).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 160,
      temperature: 0.85,
      messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      req.log.error("OpenAI returned empty chat response");
      res.status(500).json({ error: "AI stylist did not respond — please try again" });
      return;
    }

    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Chat OpenAI call failed");
    res.status(500).json({ error: "AI stylist is temporarily unavailable — please try again" });
  }
});

export default router;
