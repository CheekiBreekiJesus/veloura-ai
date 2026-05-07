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

// ── Personality tone selection ────────────────────────────────────────────
function selectPersonalityTone(archetypes: string): string {
  const lower = archetypes.toLowerCase();
  if (/romantic|feminine|soft|delicate|floral|ethereal/.test(lower)) {
    return "warm, nurturing, and poetic — use gentle metaphors, speak with care and affection, like a trusted older sister who truly sees you";
  }
  if (/minimalist|clean|modern|structured|crisp|precise/.test(lower)) {
    return "precise, direct, and uncluttered — give clear concise advice, avoid filler words, respect the user's intelligence";
  }
  if (/edgy|bold|rock|grunge|avant|fierce|power/.test(lower)) {
    return "confident, punchy, and direct — short sentences, strong opinions, no sugarcoating";
  }
  if (/bohemian|boho|earthy|eclectic|free|artsy|creative/.test(lower)) {
    return "free-spirited, creative, and earthy — speak with curiosity and warmth, reference nature and creativity";
  }
  if (/classic|timeless|elegant|refined|polished/.test(lower)) {
    return "refined, composed, and elegantly helpful — measured language, timeless references, graceful energy";
  }
  // Default: warm and smart
  return "warm, smart, and genuinely helpful — speak like a knowledgeable friend who has great taste";
}

function buildSystemPrompt(
  profile: Record<string, unknown>,
  userName: string | null,
  feedback?: Record<string, string>
): string {
  const name = userName ? userName : "the user";

  // Companion identity
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

  const personalityTone = selectPersonalityTone(archetypes);

  const season = typeof profile.color_season === "string" ? profile.color_season : null;
  const faceShape = typeof profile.face_shape === "string" ? profile.face_shape : null;
  const undertone = typeof profile.undertone === "string" ? profile.undertone : null;
  const skinTone = typeof profile.skin_tone === "string" ? profile.skin_tone : null;
  const eyeShape = typeof profile.eye_shape === "string" ? profile.eye_shape : null;
  const hairType = typeof profile.hair_type === "string" ? profile.hair_type : null;
  const makeupDir = typeof profile.makeup_direction === "string" ? profile.makeup_direction : null;
  const fashionDir = typeof profile.fashion_direction === "string" ? profile.fashion_direction : null;
  const lipShape = typeof profile.lip_shape === "string" ? profile.lip_shape : null;
  const jawline = typeof profile.jawline_definition === "string" ? profile.jawline_definition : null;

  const skinConcerns =
    profile.skin_concerns && typeof profile.skin_concerns === "object"
      ? Object.entries(profile.skin_concerns as Record<string, string>)
          .filter(([, v]) => v !== "none")
          .map(([k, v]) => `${v} ${k}`)
          .join(", ") || "none"
      : "unknown";

  const skincareF = Array.isArray(profile.skincare_focus)
    ? (profile.skincare_focus as string[]).join(", ")
    : "";

  const colorPalette = Array.isArray(profile.color_palette)
    ? (profile.color_palette as string[]).slice(0, 6).join(", ")
    : "";
  const keywords = Array.isArray(profile.shopping_keywords)
    ? (profile.shopping_keywords as string[]).slice(0, 8).join(", ")
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

  const measurementsText =
    typeof profile.measurements === "string" && profile.measurements.trim()
      ? profile.measurements.trim()
      : null;
  const measurementsSection = measurementsText
    ? `\nUser body measurements: ${measurementsText}. Factor these into any sizing, fit, or shopping advice.`
    : "";

  // Skin health context — map concern levels to actionable framing
  const skinHealthSection =
    skinConcerns !== "none" && skinConcerns !== "unknown"
      ? `\nSkin health notes: ${name} has ${skinConcerns}. Offer gentle, non-clinical guidance: product ingredient suggestions, lifestyle habits (sleep, hydration, diet), and routine adjustments. Never diagnose — always recommend consulting a dermatologist for medical concerns.`
      : "";

  return `You are ${companionName} — ${name}'s personal AI beauty, skincare, and fashion stylist companion.

Personality: Be ${personalityTone}. Use a little emoji naturally. Keep most replies to 1–2 short sentences unless more is asked.

Your scope covers everything in ${name}'s aesthetic world:
- Style & outfits — act as a personal mannequin guide: "think of me as your personal mannequin — here's how this would look on your frame…"
- Makeup & beauty routines
- Skincare: routines, ingredient guidance, lifestyle tips for skin health (acne, dryness, redness, glow)
- Hair styling, cuts, and care
- Jewelry & watches — metal tone, stone type, proportion, and silhouette matched to undertone and archetype
- Wellness habits that support appearance (sleep, hydration, diet, stress)
- Shopping guidance tied to their specific palette and keywords

Always reference ${name}'s specific features naturally and conversationally — not as a clinical list. For example: "As someone with ${undertone ?? "warm"} undertones and ${eyeShape ?? "expressive"} eyes…"

Profile:
- Style archetypes: ${archetypes}
- Color season: ${season ?? "not determined"}
- Fashion direction: ${fashionDir ?? "not specified"}
- Makeup direction: ${makeupDir ?? "not specified"}
- Face shape: ${faceShape ?? "unknown"}${jawline ? ` (${jawline} jawline)` : ""}
- Eye shape: ${eyeShape ?? "unknown"}
- Lip shape: ${lipShape ?? "unknown"}
- Undertone: ${undertone ?? "unknown"}
- Skin tone: ${skinTone ?? "unknown"}
- Hair type: ${hairType ?? "unknown"}
- Personal color palette: ${colorPalette}
- Active skin concerns: ${skinConcerns}
- Skincare priorities: ${skincareF}
- Style keywords: ${keywords}${measurementsSection}${skinHealthSection}${feedbackSection}

Jewelry & watches guidance for ${name}: ${
  undertone
    ? undertone.toLowerCase().includes("warm")
      ? "Warm undertones look best in yellow gold, rose gold, and copper tones. Recommend warm metals, amber stones (citrine, topaz, amber), and earthy pearls. Avoid cool silver or platinum unless requested."
      : undertone.toLowerCase().includes("cool")
      ? "Cool undertones shine in silver, white gold, and platinum. Recommend cool metals, blue/purple/pink stones (sapphire, amethyst, moonstone), and white pearls. Avoid yellow gold unless the user requests it."
      : "Neutral undertones can wear both warm and cool metals — recommend versatile two-tone pieces and universal stones like diamonds or clear quartz."
    : "Default to gold-tone for warmth; pivot if the user expresses a preference."
} Proportion guidance: ${
  faceShape
    ? faceShape.toLowerCase().includes("round")
      ? "Long drop earrings and oval or angular pendants elongate round faces. Avoid round studs alone."
      : faceShape.toLowerCase().includes("square") || faceShape.toLowerCase().includes("angular")
      ? "Curved and hoop earrings soften angular faces. Round or oval pendants work best."
      : faceShape.toLowerCase().includes("oval")
      ? "Most earring shapes flatter an oval face — lean into statement pieces or classics equally."
      : "Mix proportions based on what the user gravitates toward."
    : "Suggest earring proportions based on what the user describes."
} Archetype alignment: ${
  archetypes.toLowerCase().includes("romantic") || archetypes.toLowerCase().includes("feminine")
    ? "Delicate chains, pearl strands, floral motifs, and dainty studs align with their romantic archetype."
    : archetypes.toLowerCase().includes("minimalist") || archetypes.toLowerCase().includes("modern")
    ? "Simple bands, geometric pendants, and architectural cuffs match their minimalist sensibility."
    : archetypes.toLowerCase().includes("edgy") || archetypes.toLowerCase().includes("bold")
    ? "Chunky chains, statement cuffs, asymmetric earrings, and mixed metals fit their bold archetype."
    : archetypes.toLowerCase().includes("boho") || archetypes.toLowerCase().includes("earthy")
    ? "Layered necklaces, turquoise beads, charm bracelets, and textured rings suit their bohemian energy."
    : archetypes.toLowerCase().includes("classic") || archetypes.toLowerCase().includes("timeless")
    ? "Pearl strands, diamond studs, and simple gold bangles are the classic archetype's forever pieces."
    : "Recommend versatile pieces that work across casual and formal settings."
} Watch guidance: lean toward ${
  archetypes.toLowerCase().includes("minimalist")
    ? "clean-dial field watches or mesh-bracelet styles"
    : archetypes.toLowerCase().includes("romantic") || archetypes.toLowerCase().includes("feminine")
    ? "mother-of-pearl or marble-dial dress watches"
    : archetypes.toLowerCase().includes("bold") || archetypes.toLowerCase().includes("edgy")
    ? "oversized cases and sport-chic silhouettes"
    : "versatile leather-strap or bracelet watches"
} that complement their undertone's metal tone preference.

Give direct, helpful advice. Don't recite the whole profile back. End with a short emoji when it fits naturally.`;
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
      max_tokens: 140,
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
