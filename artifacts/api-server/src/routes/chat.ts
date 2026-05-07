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
  feedback?: Record<string, string>
): string {
  const name = userName ? userName : "the user";
  const archetypes =
    Array.isArray(profile.aesthetic_archetypes) && profile.aesthetic_archetypes.length
      ? (profile.aesthetic_archetypes as string[]).join(", ")
      : typeof profile.style_archetype === "string"
      ? profile.style_archetype
      : "undefined";
  const season = typeof profile.color_season === "string" ? profile.color_season : null;
  const faceShape = typeof profile.face_shape === "string" ? profile.face_shape : null;
  const undertone = typeof profile.undertone === "string" ? profile.undertone : null;
  const skinTone = typeof profile.skin_tone === "string" ? profile.skin_tone : null;
  const eyeShape = typeof profile.eye_shape === "string" ? profile.eye_shape : null;
  const hairType = typeof profile.hair_type === "string" ? profile.hair_type : null;
  const makeupDir = typeof profile.makeup_direction === "string" ? profile.makeup_direction : null;
  const fashionDir = typeof profile.fashion_direction === "string" ? profile.fashion_direction : null;
  const skinConcerns =
    profile.skin_concerns && typeof profile.skin_concerns === "object"
      ? Object.entries(profile.skin_concerns as Record<string, string>)
          .filter(([, v]) => v !== "none")
          .map(([k, v]) => `${v} ${k}`)
          .join(", ") || "none"
      : "unknown";
  const colorPalette = Array.isArray(profile.color_palette)
    ? (profile.color_palette as string[]).slice(0, 6).join(", ")
    : "";
  const keywords = Array.isArray(profile.shopping_keywords)
    ? (profile.shopping_keywords as string[]).slice(0, 8).join(", ")
    : "";
  const skincareF = Array.isArray(profile.skincare_focus)
    ? (profile.skincare_focus as string[]).join(", ")
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
      ? `\nUser preferences from feedback:${likedItems.length ? `\n- Liked: ${likedItems.join("; ")}` : ""}${dislikedItems.length ? `\n- Disliked: ${dislikedItems.join("; ")}` : ""}`
      : "";

  return `You are Aura — ${name}'s personal AI stylist. Be warm, smart, and very concise.

Use a little emoji naturally. Keep most replies to 1-2 short sentences. Max 1 short paragraph unless the user asks for more.

Profile:
- Style archetypes: ${archetypes}
- Color season: ${season ?? "not determined"}
- Fashion direction: ${fashionDir ?? "not specified"}
- Makeup direction: ${makeupDir ?? "not specified"}
- Face shape: ${faceShape ?? "unknown"}
- Eye shape: ${eyeShape ?? "unknown"}
- Undertone: ${undertone ?? "unknown"}
- Skin tone: ${skinTone ?? "unknown"}
- Hair type: ${hairType ?? "unknown"}
- Personal color palette: ${colorPalette}
- Active skin concerns: ${skinConcerns}
- Skincare priorities: ${skincareF}
- Style keywords: ${keywords}${feedbackSection}

Give direct, helpful advice. Don't repeat the whole profile. End with a short emoji when it fits. Avoid long explanations unless asked.`;
}

router.post("/chat", chatLimiter, async (req, res): Promise<void> => {
  const { messages, profile, userName, feedback } = req.body as {
    messages?: unknown;
    profile?: unknown;
    userName?: unknown;
    feedback?: unknown;
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

  const systemPrompt = buildSystemPrompt(safeProfile, safeUserName, safeFeedback);

  const chatMessages = (messages as Array<{ role: string; content: string }>).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 120,
      temperature: 0.7,
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
