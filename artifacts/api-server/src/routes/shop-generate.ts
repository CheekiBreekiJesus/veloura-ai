import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAnalyzeToken } from "../middlewares/requireAnalyzeToken";
import { buildAffiliateUrls } from "../lib/affiliateUrls";
import { db, shopProductsTable } from "@workspace/db";

const router = Router();

const shopGenerateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many shop generation requests — please try again later." },
});

const ALLOWED_RETAILERS = [
  "Amazon",
  "Sephora",
  "Zara",
  "H&M",
  "ASOS",
  "LookFantastic",
  "Ulta",
  "Nordstrom",
] as const;

const GPTProductSchema = z.object({
  brand: z.string(),
  name: z.string(),
  retailer: z.enum(ALLOWED_RETAILERS),
  category: z.enum(["Skincare", "Makeup", "Fashion", "Accessories", "Fragrance", "Haircare"]),
  description: z.string(),
  price_tier: z.enum(["budget", "mid", "luxury"]),
  color_hex: z.array(z.string()),
  undertones: z.array(z.string()),
  color_seasons: z.array(z.string()),
  style_archetypes: z.array(z.string()),
  calendar_seasons: z.array(z.string()),
});

const GPTResponseSchema = z.object({
  products: z.array(GPTProductSchema).min(1).max(20),
});

function getColorSeason(undertone: string, skinTone?: string): string {
  const isWarm = /warm|golden|yellow|peach|olive|amber/i.test(undertone);
  const isCool = /cool|pink|rose|blue|ash|silver/i.test(undertone);
  const isLight = /light|fair|ivory|porcelain|pale|cream/i.test(skinTone ?? "");
  const isMedium = /medium|olive|beige|tan|caramel/i.test(skinTone ?? "");

  if (isWarm || !isCool) return isLight ? "Spring" : "Autumn";
  return isLight || isMedium ? "Summer" : "Winter";
}

function buildPrompt(profile: {
  undertone: string;
  color_season: string;
  style_archetype?: string;
  aesthetic_archetypes?: string[];
  skin_type?: string;
  shopping_keywords?: string[];
  color_palette?: string[];
  fashion_direction?: string;
  makeup_direction?: string;
}): string {
  const archetypes = profile.aesthetic_archetypes?.join(", ") || profile.style_archetype || "not specified";
  const keywords = profile.shopping_keywords?.join(", ") || "not specified";
  const palette = profile.color_palette?.slice(0, 6).join(", ") || "not specified";

  return `You are a luxury fashion and beauty buyer curating a personalized shop for a specific user.

User's style profile:
- Skin undertone: ${profile.undertone}
- Color season: ${profile.color_season}
- Style archetypes: ${archetypes}
- Skin type: ${profile.skin_type ?? "not specified"}
- Fashion direction: ${profile.fashion_direction ?? "not specified"}
- Makeup direction: ${profile.makeup_direction ?? "not specified"}
- Shopping keywords: ${keywords}
- Personal color palette (hex): ${palette}

Generate exactly 12 product recommendations tailored to this specific profile. Mix categories (Skincare, Makeup, Fashion, Accessories, Fragrance, Haircare) and price tiers (budget, mid, luxury).

You MUST choose retailers ONLY from this list: Amazon, Sephora, Zara, H&M, ASOS, LookFantastic, Ulta, Nordstrom.

Return ONLY valid JSON in this exact format:
{
  "products": [
    {
      "brand": "Brand Name",
      "name": "Product Name",
      "retailer": "Amazon",
      "category": "Skincare",
      "description": "~40 word explanation of why this product specifically suits this user's undertone, season, and archetype",
      "price_tier": "budget",
      "color_hex": ["#C4956A"],
      "undertones": ["warm"],
      "color_seasons": ["Autumn", "Spring"],
      "style_archetypes": ["romantic", "minimalist"],
      "calendar_seasons": ["autumn", "winter"]
    }
  ]
}

Rules:
- description must be specific to THIS user's profile (mention their undertone, season, or archetype)
- color_hex: dominant product colors as hex strings
- undertones: which undertones this suits (warm/cool/neutral)
- color_seasons: which color seasons this suits (Spring/Summer/Autumn/Winter)
- style_archetypes: which style archetypes this suits
- calendar_seasons: which calendar seasons this item is appropriate for (spring/summer/autumn/winter)
- Vary retailers across the 12 products
- Return ONLY the JSON object, no markdown`;
}

router.post(
  "/shop/generate",
  requireAnalyzeToken,
  shopGenerateLimiter,
  async (req, res): Promise<void> => {
    const body = req.body as {
      undertone?: unknown;
      color_season?: unknown;
      style_archetype?: unknown;
      aesthetic_archetypes?: unknown;
      skin_type?: unknown;
      shopping_keywords?: unknown;
      color_palette?: unknown;
      fashion_direction?: unknown;
      makeup_direction?: unknown;
      skin_tone_category?: unknown;
    };

    const undertone = typeof body.undertone === "string" ? body.undertone : null;
    if (!undertone) {
      res.status(400).json({ error: "undertone is required" });
      return;
    }

    const color_season =
      typeof body.color_season === "string"
        ? body.color_season
        : getColorSeason(undertone, typeof body.skin_tone_category === "string" ? body.skin_tone_category : undefined);

    const profile = {
      undertone,
      color_season,
      style_archetype: typeof body.style_archetype === "string" ? body.style_archetype : undefined,
      aesthetic_archetypes: Array.isArray(body.aesthetic_archetypes)
        ? (body.aesthetic_archetypes as string[]).filter((x) => typeof x === "string")
        : undefined,
      skin_type: typeof body.skin_type === "string" ? body.skin_type : undefined,
      shopping_keywords: Array.isArray(body.shopping_keywords)
        ? (body.shopping_keywords as string[]).filter((x) => typeof x === "string")
        : undefined,
      color_palette: Array.isArray(body.color_palette)
        ? (body.color_palette as string[]).filter((x) => typeof x === "string")
        : undefined,
      fashion_direction: typeof body.fashion_direction === "string" ? body.fashion_direction : undefined,
      makeup_direction: typeof body.makeup_direction === "string" ? body.makeup_direction : undefined,
    };

    let gptProducts: z.infer<typeof GPTProductSchema>[];
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        max_completion_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: "user", content: buildPrompt(profile) }],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        res.status(500).json({ error: "AI returned no content" });
        return;
      }

      const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const validated = GPTResponseSchema.parse(JSON.parse(cleaned) as unknown);
      gptProducts = validated.products;
    } catch (err) {
      req.log.error({ err }, "Shop generate: AI or validation error");
      res.status(500).json({ error: "Failed to generate product recommendations" });
      return;
    }

    const results: typeof shopProductsTable.$inferSelect[] = [];

    for (const p of gptProducts) {
      const affiliateUrls = buildAffiliateUrls(`${p.brand} ${p.name}`, p.retailer);
      const [row] = await db
        .insert(shopProductsTable)
        .values({
          name: p.name,
          brand: p.brand,
          retailer: p.retailer,
          category: p.category,
          description: p.description,
          price_tier: p.price_tier,
          color_hex: p.color_hex,
          undertones: p.undertones,
          color_seasons: p.color_seasons,
          style_archetypes: p.style_archetypes,
          categories_calendar: p.calendar_seasons,
          affiliate_urls: affiliateUrls,
          generated_count: 1,
        })
        .onConflictDoUpdate({
          target: [shopProductsTable.brand, shopProductsTable.name],
          set: {
            generated_count: sql`${shopProductsTable.generated_count} + 1`,
            color_seasons: sql`(SELECT ARRAY(SELECT DISTINCT unnest(${shopProductsTable.color_seasons} || EXCLUDED.color_seasons)))`,
            style_archetypes: sql`(SELECT ARRAY(SELECT DISTINCT unnest(${shopProductsTable.style_archetypes} || EXCLUDED.style_archetypes)))`,
            undertones: sql`(SELECT ARRAY(SELECT DISTINCT unnest(${shopProductsTable.undertones} || EXCLUDED.undertones)))`,
            affiliate_urls: sql`EXCLUDED.affiliate_urls`,
          },
        })
        .returning();

      if (row) results.push(row);
    }

    res.json(results);
  }
);

export default router;
