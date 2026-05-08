import { Router } from "express";
import { desc } from "drizzle-orm";
import { db, shopProductsTable } from "@workspace/db";

const router = Router();

router.get("/shop/products", async (req, res): Promise<void> => {
  const { undertone, color_season, calendar_season, category, limit: limitRaw } = req.query as Record<string, string | undefined>;
  const limit = Math.min(parseInt(limitRaw ?? "40", 10) || 40, 100);

  try {
    const allProducts = await db
      .select()
      .from(shopProductsTable)
      .orderBy(desc(shopProductsTable.generated_count), desc(shopProductsTable.created_at))
      .limit(200);

    const scored = allProducts.map((p) => {
      let score = 0;
      if (undertone) {
        const ut = undertone.toLowerCase();
        if (p.undertones.some((u) => u.toLowerCase().includes(ut) || ut.includes(u.toLowerCase()))) score++;
      }
      if (color_season) {
        const cs = color_season.toLowerCase();
        if (p.color_seasons.some((s) => s.toLowerCase() === cs)) score++;
      }
      if (calendar_season) {
        const cal = calendar_season.toLowerCase();
        if (p.categories_calendar.some((s) => s.toLowerCase() === cal)) score++;
      }
      return { ...p, match_score: score };
    });

    let filtered = scored;
    if (category) {
      const cat = category.toLowerCase();
      const catFiltered = filtered.filter((p) => p.category.toLowerCase() === cat);
      if (catFiltered.length > 0) filtered = catFiltered;
    }

    if (allProducts.length < 20) {
      res.json(filtered.slice(0, limit));
      return;
    }

    filtered.sort((a, b) => b.match_score - a.match_score || b.generated_count - a.generated_count);
    res.json(filtered.slice(0, limit));
  } catch (err) {
    req.log.error({ err }, "Shop products: fetch failed");
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export default router;
