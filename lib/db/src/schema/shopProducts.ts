import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopProductsTable = pgTable("shop_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  retailer: text("retailer").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price_tier: text("price_tier").notNull(),
  color_hex: text("color_hex").array().notNull().default([]),
  undertones: text("undertones").array().notNull().default([]),
  color_seasons: text("color_seasons").array().notNull().default([]),
  style_archetypes: text("style_archetypes").array().notNull().default([]),
  categories_calendar: text("categories_calendar").array().notNull().default([]),
  affiliate_urls: jsonb("affiliate_urls").notNull().default({}),
  generated_count: integer("generated_count").notNull().default(1),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShopProductSchema = createInsertSchema(shopProductsTable).omit({ id: true, created_at: true });
export type InsertShopProduct = z.infer<typeof insertShopProductSchema>;
export type ShopProduct = typeof shopProductsTable.$inferSelect;
