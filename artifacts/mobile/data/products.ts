import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type PriceTier = "budget" | "mid" | "luxury";

export type LocaleEntry = { url: string; retailer: string };

export type Product = {
  id: string;
  name: string;
  category: string;
  reason: string;
  price: string;
  priceNumeric: number;
  priceTier: PriceTier;
  icon: ComponentProps<typeof Ionicons>["name"];
  gradient: [string, string];
  featured?: boolean;
  isNew?: boolean;
  description: string;
  highlights: string[];
  affiliateUrls: Record<string, LocaleEntry>;
  defaultLocale: string;
  imageUrl?: string;
};

export function getProductUrl(product: Product, country: string): LocaleEntry {
  return (
    product.affiliateUrls[country] ??
    product.affiliateUrls[product.defaultLocale]
  );
}

// ── URL helper functions ───────────────────────────────────────────────────
function kw(s: string): string {
  return s.replace(/\s+/g, "+");
}

function sephora(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.sephora.com/search?keyword=${k}`, retailer: "Sephora" },
    GB: { url: `https://www.sephora.co.uk/search?q=${k}`, retailer: "Sephora" },
    AU: { url: `https://www.mecca.com.au/search?q=${k}`, retailer: "Mecca" },
    CA: { url: `https://www.sephora.ca/en/search?keyword=${k}`, retailer: "Sephora" },
    FR: { url: `https://www.sephora.fr/search?keyword=${k}`, retailer: "Sephora" },
    DE: { url: `https://www.douglas.de/search?searchTerm=${k}`, retailer: "Douglas" },
    INT: { url: `https://www.lookfantastic.com/search?q=${k}`, retailer: "LookFantastic" },
  };
}

function ulta(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.ulta.com/search?search=${k}`, retailer: "Ulta" },
    GB: { url: `https://www.lookfantastic.com/search?q=${k}`, retailer: "LookFantastic" },
    AU: { url: `https://www.mecca.com.au/search?q=${k}`, retailer: "Mecca" },
    CA: { url: `https://www.sephora.ca/en/search?keyword=${k}`, retailer: "Sephora" },
    FR: { url: `https://www.nocibe.fr/recherche?q=${k}`, retailer: "Nocibé" },
    DE: { url: `https://www.douglas.de/search?searchTerm=${k}`, retailer: "Douglas" },
    INT: { url: `https://www.lookfantastic.com/search?q=${k}`, retailer: "LookFantastic" },
  };
}

function paulasChoice(path: string): Record<string, LocaleEntry> {
  return {
    US: { url: `https://www.paulaschoice.com/${path}`, retailer: "Paula's Choice" },
    GB: { url: `https://www.paulaschoice.co.uk/${path}`, retailer: "Paula's Choice" },
    AU: { url: `https://www.paulaschoice.com.au/${path}`, retailer: "Paula's Choice" },
    CA: { url: `https://www.paulaschoice.ca/${path}`, retailer: "Paula's Choice" },
    FR: { url: `https://www.paulaschoice.fr/${path}`, retailer: "Paula's Choice" },
    DE: { url: `https://www.paulaschoice.de/${path}`, retailer: "Paula's Choice" },
    INT: { url: `https://www.paulaschoice.com/${path}`, retailer: "Paula's Choice" },
  };
}

function amazon(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.amazon.com/s?k=${k}`, retailer: "Amazon" },
    GB: { url: `https://www.amazon.co.uk/s?k=${k}`, retailer: "Amazon" },
    AU: { url: `https://www.amazon.com.au/s?k=${k}`, retailer: "Amazon" },
    CA: { url: `https://www.amazon.ca/s?k=${k}`, retailer: "Amazon" },
    FR: { url: `https://www.amazon.fr/s?k=${k}`, retailer: "Amazon" },
    DE: { url: `https://www.amazon.de/s?k=${k}`, retailer: "Amazon" },
    INT: { url: `https://www.lookfantastic.com/search?q=${k}`, retailer: "LookFantastic" },
  };
}

function beautyAmazon(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.amazon.com/s?k=${k}`, retailer: "Amazon" },
    GB: { url: `https://www.lookfantastic.com/search?q=${k}`, retailer: "LookFantastic" },
    AU: { url: `https://www.adorebeauty.com.au/search?q=${k}`, retailer: "Adore Beauty" },
    CA: { url: `https://www.lookfantastic.ca/search?q=${k}`, retailer: "LookFantastic" },
    FR: { url: `https://www.sephora.fr/search?keyword=${k}`, retailer: "Sephora" },
    DE: { url: `https://www.flaconi.de/search/?suche=${k}`, retailer: "Flaconi" },
    INT: { url: `https://www.lookfantastic.com/search?q=${k}`, retailer: "LookFantastic" },
  };
}

function sunglassesRetailer(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.amazon.com/s?k=${k}`, retailer: "Amazon" },
    GB: { url: `https://www.sunglasshut.com/uk/search?q=${k}`, retailer: "Sunglass Hut" },
    AU: { url: `https://www.sunglasshut.com/au/search?q=${k}`, retailer: "Sunglass Hut" },
    CA: { url: `https://www.clearly.ca/sunglasses`, retailer: "Clearly" },
    FR: { url: `https://www.apollo.de/sonnenbrillen/damensonnenbrillen`, retailer: "Apollo Optik" },
    DE: { url: `https://www.apollo.de/sonnenbrillen/damensonnenbrillen`, retailer: "Apollo Optik" },
    INT: { url: `https://www.sunglasshut.com/search?q=${k}`, retailer: "Sunglass Hut" },
  };
}

function amazonJewelry(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.amazon.com/s?k=${k}`, retailer: "Amazon" },
    GB: { url: `https://www.wolfandbadger.com/uk/search/?q=${k}`, retailer: "Wolf & Badger" },
    AU: { url: `https://www.wolfandbadger.com/global/search/?q=${k}`, retailer: "Wolf & Badger" },
    CA: { url: `https://www.etsy.com/search?q=${k}`, retailer: "Etsy" },
    FR: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
    DE: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
    INT: { url: `https://www.wolfandbadger.com/global/search/?q=${k}`, retailer: "Wolf & Badger" },
  };
}

function amazonWatch(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.amazon.com/s?k=${k}`, retailer: "Amazon" },
    GB: { url: `https://www.watchshop.com/search?q=${k}`, retailer: "Watch Shop" },
    AU: { url: `https://www.chrono24.com/search/index.htm?query=${k}`, retailer: "Chrono24" },
    CA: { url: `https://www.amazon.ca/s?k=${k}`, retailer: "Amazon" },
    FR: { url: `https://www.chrono24.fr/search/index.htm?query=${k}`, retailer: "Chrono24" },
    DE: { url: `https://www.chrono24.de/search/index.htm?query=${k}`, retailer: "Chrono24" },
    INT: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
  };
}

function zara(term: string): Record<string, LocaleEntry> {
  const t = kw(term);
  return {
    US: { url: `https://www.zara.com/us/en/search?searchTerm=${t}`, retailer: "Zara" },
    GB: { url: `https://www.zara.com/gb/en/search?searchTerm=${t}`, retailer: "Zara" },
    AU: { url: `https://www.zara.com/au/en/search?searchTerm=${t}`, retailer: "Zara" },
    CA: { url: `https://www.zara.com/ca/en/search?searchTerm=${t}`, retailer: "Zara" },
    FR: { url: `https://www.zara.com/fr/fr/search?searchTerm=${t}`, retailer: "Zara" },
    DE: { url: `https://www.zara.com/de/de/search?searchTerm=${t}`, retailer: "Zara" },
    INT: { url: `https://www.zara.com/gb/en/search?searchTerm=${t}`, retailer: "Zara" },
  };
}

function hm(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www2.hm.com/en_us/search-results.html?q=${k}`, retailer: "H&M" },
    GB: { url: `https://www2.hm.com/en_gb/search-results.html?q=${k}`, retailer: "H&M" },
    AU: { url: `https://www2.hm.com/en_au/search-results.html?q=${k}`, retailer: "H&M" },
    CA: { url: `https://www2.hm.com/en_ca/search-results.html?q=${k}`, retailer: "H&M" },
    FR: { url: `https://www2.hm.com/fr_fr/search-results.html?q=${k}`, retailer: "H&M" },
    DE: { url: `https://www2.hm.com/de_de/search-results.html?q=${k}`, retailer: "H&M" },
    INT: { url: `https://www2.hm.com/en_gb/search-results.html?q=${k}`, retailer: "H&M" },
  };
}

function asos(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.asos.com/search/?q=${k}`, retailer: "ASOS" },
    GB: { url: `https://www.asos.com/search/?q=${k}`, retailer: "ASOS" },
    AU: { url: `https://www.asos.com/search/?q=${k}`, retailer: "ASOS" },
    CA: { url: `https://www.asos.com/search/?q=${k}`, retailer: "ASOS" },
    FR: { url: `https://www.asos.com/fr/search/?q=${k}`, retailer: "ASOS" },
    DE: { url: `https://www.asos.com/de/search/?q=${k}`, retailer: "ASOS" },
    INT: { url: `https://www.asos.com/search/?q=${k}`, retailer: "ASOS" },
  };
}

function revolve(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.revolve.com/search/?q=${k}`, retailer: "Revolve" },
    GB: { url: `https://www.revolve.com/search/?q=${k}`, retailer: "Revolve" },
    AU: { url: `https://www.revolve.com/search/?q=${k}`, retailer: "Revolve" },
    CA: { url: `https://www.revolve.com/search/?q=${k}`, retailer: "Revolve" },
    FR: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
    DE: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
    INT: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
  };
}

function anthropologie(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.anthropologie.com/search?q=${k}`, retailer: "Anthropologie" },
    GB: { url: `https://www.anthropologie.com/en-gb/search?q=${k}`, retailer: "Anthropologie" },
    AU: { url: `https://www.net-a-porter.com/en-au/search?q=${k}`, retailer: "Net-a-Porter" },
    CA: { url: `https://www.anthropologie.com/en-ca/search?q=${k}`, retailer: "Anthropologie" },
    FR: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
    DE: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
    INT: { url: `https://www.farfetch.com/shopping/women/search/?q=${k}`, retailer: "Farfetch" },
  };
}

function anthropologieJewelry(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.anthropologie.com/search?q=${k}`, retailer: "Anthropologie" },
    GB: { url: `https://www.wolfandbadger.com/uk/search/?q=${k}`, retailer: "Wolf & Badger" },
    AU: { url: `https://www.wolfandbadger.com/global/search/?q=${k}`, retailer: "Wolf & Badger" },
    CA: { url: `https://www.anthropologie.com/en-ca/search?q=${k}`, retailer: "Anthropologie" },
    FR: { url: `https://www.wolfandbadger.com/global/search/?q=${k}`, retailer: "Wolf & Badger" },
    DE: { url: `https://www.wolfandbadger.com/global/search/?q=${k}`, retailer: "Wolf & Badger" },
    INT: { url: `https://www.wolfandbadger.com/global/search/?q=${k}`, retailer: "Wolf & Badger" },
  };
}

function warbyParker(path: string): Record<string, LocaleEntry> {
  return {
    US: { url: `https://www.warbyparker.com/${path}`, retailer: "Warby Parker" },
    GB: { url: `https://www.specsavers.co.uk/glasses/womens-glasses`, retailer: "Specsavers" },
    AU: { url: `https://www.specsavers.com.au/glasses/womens-glasses`, retailer: "Specsavers" },
    CA: { url: `https://www.warbyparker.com/${path}`, retailer: "Warby Parker" },
    FR: { url: `https://www.grandoptical.fr/lunettes-de-vue/femme`, retailer: "GrandOptical" },
    DE: { url: `https://www.apollo.de/brillen/damenbrillen`, retailer: "Apollo Optik" },
    INT: { url: `https://www.clearly.ca/glasses/women`, retailer: "Clearly" },
  };
}

function nordstrom(keyword: string): Record<string, LocaleEntry> {
  const k = kw(keyword);
  return {
    US: { url: `https://www.nordstrom.com/sr?keyword=${k}`, retailer: "Nordstrom" },
    GB: { url: `https://www.net-a-porter.com/en-gb/search?q=${k}`, retailer: "Net-a-Porter" },
    AU: { url: `https://www.net-a-porter.com/en-au/search?q=${k}`, retailer: "Net-a-Porter" },
    CA: { url: `https://www.nordstrom.com/sr?keyword=${k}`, retailer: "Nordstrom" },
    FR: { url: `https://www.net-a-porter.com/en-fr/search?q=${k}`, retailer: "Net-a-Porter" },
    DE: { url: `https://www.net-a-porter.com/en-de/search?q=${k}`, retailer: "Net-a-Porter" },
    INT: { url: `https://www.net-a-porter.com/search?q=${k}`, retailer: "Net-a-Porter" },
  };
}

function mejuri(path: string): Record<string, LocaleEntry> {
  const url = `https://mejuri.com/${path}`;
  return {
    US: { url, retailer: "Mejuri" },
    GB: { url, retailer: "Mejuri" },
    AU: { url, retailer: "Mejuri" },
    CA: { url, retailer: "Mejuri" },
    FR: { url, retailer: "Mejuri" },
    DE: { url, retailer: "Mejuri" },
    INT: { url, retailer: "Mejuri" },
  };
}

// ── Products ──────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  // ─── Skincare ──────────────────────────────────────────────────────────
  {
    id: "sk-1",
    name: "Hydrating Vitamin C Serum",
    category: "Skincare",
    reason: "Boosts radiance for warm skin tones",
    description:
      "A lightweight hyaluronic serum that deeply hydrates while enhancing your natural glow. Formulated with niacinamide and 15% vitamin C to even skin tone and reduce dullness — ideal for warm, dewy skin looks.",
    highlights: ["15% Vitamin C", "Hyaluronic acid", "Fragrance-free"],
    price: "$28+",
    priceNumeric: 28,
    priceTier: "budget",
    icon: "water-outline",
    gradient: ["#FDECD3", "#F5D5B0"],
    featured: true,
    affiliateUrls: sephora("vitamin c hydrating serum"),
    defaultLocale: "US",
  },
  {
    id: "sk-2",
    name: "Niacinamide Pore Serum",
    category: "Skincare",
    reason: "Minimizes pores and balances skin",
    description:
      "The Ordinary's cult-favorite 10% niacinamide + 1% zinc formula visibly reduces the appearance of blemishes and congestion in just two weeks. A budget staple that works.",
    highlights: ["10% Niacinamide", "1% Zinc", "Vegan formula"],
    price: "$7+",
    priceNumeric: 7,
    priceTier: "budget",
    icon: "flask-outline",
    gradient: ["#E8F5E9", "#C8E6C9"],
    affiliateUrls: sephora("niacinamide pore serum"),
    defaultLocale: "US",
  },
  {
    id: "sk-3",
    name: "SPF 50 Tinted Moisturizer",
    category: "Skincare",
    reason: "Sun protection with a natural tint",
    description:
      "A sheer tinted formula that offers broad-spectrum SPF 50 protection while evening out your complexion. Non-greasy, reef-safe, and perfect as a light makeup base for your skin tone.",
    highlights: ["SPF 50 PA++++", "8 shades", "Reef-safe mineral"],
    price: "$36+",
    priceNumeric: 36,
    priceTier: "mid",
    icon: "sunny-outline",
    gradient: ["#FFF9C4", "#FFF176"],
    featured: true,
    isNew: true,
    affiliateUrls: ulta("tinted spf moisturizer"),
    defaultLocale: "US",
  },
  {
    id: "sk-4",
    name: "Overnight Retinol Cream",
    category: "Skincare",
    reason: "Resurfaces and refines skin texture",
    description:
      "Paula's Choice clinical 1% retinol cream works overnight to diminish fine lines, smooth uneven texture, and stimulate collagen. Ideal for all skin types; pairs with a rich moisturizer.",
    highlights: ["1% Retinol", "Clinical strength", "Peptide complex"],
    price: "$52+",
    priceNumeric: 52,
    priceTier: "mid",
    icon: "moon-outline",
    gradient: ["#EDE7F6", "#D1C4E9"],
    affiliateUrls: paulasChoice(""),
    defaultLocale: "US",
  },
  {
    id: "sk-5",
    name: "Rosehip Face Oil",
    category: "Skincare",
    reason: "Deeply nourishes and evens skin tone",
    description:
      "Cold-pressed rosehip seed oil rich in vitamin A and omega fatty acids. Absorbs quickly without clogging pores, leaving skin luminous and soft — a natural complement for warm undertones.",
    highlights: ["Cold-pressed", "Vitamin A & C", "Non-comedogenic"],
    price: "$22+",
    priceNumeric: 22,
    priceTier: "budget",
    icon: "leaf-outline",
    gradient: ["#FCE4EC", "#F8BBD0"],
    affiliateUrls: beautyAmazon("rosehip face oil"),
    defaultLocale: "US",
  },
  {
    id: "sk-6",
    name: "Gentle Foaming Cleanser",
    category: "Skincare",
    reason: "Cleans without stripping your skin barrier",
    description:
      "CeraVe's dermatologist-developed cleanser with ceramides, niacinamide, and hyaluronic acid. Removes makeup and impurities while reinforcing the skin barrier — suitable for all skin types.",
    highlights: ["3 Ceramides", "Hyaluronic acid", "Fragrance-free"],
    price: "$16+",
    priceNumeric: 16,
    priceTier: "budget",
    icon: "sparkles-outline",
    gradient: ["#E3F2FD", "#BBDEFB"],
    affiliateUrls: ulta("cerave foaming cleanser"),
    defaultLocale: "US",
  },

  // ─── Makeup ────────────────────────────────────────────────────────────
  {
    id: "mk-1",
    name: "Soft Glow Foundation",
    category: "Makeup",
    reason: "Matches warm undertones perfectly",
    description:
      "A buildable, skin-like foundation with a soft satin finish. Its undertone-adaptive formula means warm undertones get that golden, lit-from-within look without looking flat or orange.",
    highlights: ["40 shades", "Buildable coverage", "12-hour wear"],
    price: "$34+",
    priceNumeric: 34,
    priceTier: "mid",
    icon: "color-fill-outline",
    gradient: ["#F5EDE3", "#EDE3D9"],
    affiliateUrls: sephora("soft glow foundation warm undertone"),
    defaultLocale: "US",
  },
  {
    id: "mk-2",
    name: "Terracotta Eyeshadow Palette",
    category: "Makeup",
    reason: "Sculpts and defines your eye shape",
    description:
      "10 curated shades from champagne to deep rust, engineered to sculpt and define any eye shape. Perfect for creating depth that enhances almond, hooded, or upturned eyes with professional ease.",
    highlights: ["10 pigment-rich shades", "Buildable pigment", "Long-wear formula"],
    price: "$42+",
    priceNumeric: 42,
    priceTier: "mid",
    icon: "layers-outline",
    gradient: ["#F0E4F5", "#DFC8EF"],
    featured: true,
    affiliateUrls: sephora("terracotta eyeshadow palette"),
    defaultLocale: "US",
  },
  {
    id: "mk-3",
    name: "Tinted Lip Balm",
    category: "Makeup",
    reason: "Enhances your natural lip shape",
    description:
      "A sheer, buildable tint that gives lips a perfect wash of color while keeping them moisturized. Available in terracotta, rose, and berry — all flattering for warm and neutral undertones.",
    highlights: ["Buildable color", "Jojoba + Shea", "6 shades"],
    price: "$14+",
    priceNumeric: 14,
    priceTier: "budget",
    icon: "heart-outline",
    gradient: ["#FDECD3", "#F5D5B0"],
    affiliateUrls: sephora("tinted lip balm warm"),
    defaultLocale: "US",
  },
  {
    id: "mk-4",
    name: "Blush & Highlight Duo",
    category: "Makeup",
    reason: "Complements your natural warmth",
    description:
      "Fenty Beauty's iconic cheek palette combines a buildable rosy blush with a luminous champagne highlight. Designed for all skin tones with Rihanna's commitment to inclusivity.",
    highlights: ["Dual-ended brush", "All skin tones", "Buildable finish"],
    price: "$38+",
    priceNumeric: 38,
    priceTier: "mid",
    icon: "flower-outline",
    gradient: ["#FCE4EC", "#F48FB1"],
    featured: true,
    isNew: true,
    affiliateUrls: sephora("fenty blush highlight duo"),
    defaultLocale: "US",
  },
  {
    id: "mk-5",
    name: "Longwear Brow Pencil",
    category: "Makeup",
    reason: "Defines brows to frame your face",
    description:
      "Charlotte Tilbury's award-winning brow pencil with a micro-precision tip. The waxy formula mimics natural hair strokes for a defined yet effortless arch that lasts all day.",
    highlights: ["Micro-precision tip", "12-hour wear", "6 shades"],
    price: "$29+",
    priceNumeric: 29,
    priceTier: "budget",
    icon: "brush-outline",
    gradient: ["#EFEBE9", "#D7CCC8"],
    affiliateUrls: sephora("charlotte tilbury brow pencil"),
    defaultLocale: "US",
  },
  {
    id: "mk-6",
    name: "Cream Contour Stick",
    category: "Makeup",
    reason: "Sculpts your face shape with ease",
    description:
      "NARS' creamy contour stick blends effortlessly to define cheekbones, slim the nose, and add dimension. The buildable formula works on all skin tones with a natural matte finish.",
    highlights: ["Crease-resistant", "Blendable", "Matte finish"],
    price: "$36+",
    priceNumeric: 36,
    priceTier: "mid",
    icon: "pencil-outline",
    gradient: ["#F3E5F5", "#CE93D8"],
    isNew: true,
    affiliateUrls: sephora("NARS cream contour stick"),
    defaultLocale: "US",
  },

  // ─── Fashion ───────────────────────────────────────────────────────────
  {
    id: "fa-1",
    name: "Silk Slip Dress",
    category: "Fashion",
    reason: "Flatters your face shape & archetype",
    description:
      "A luxurious slip dress cut on the bias for a fluid, flattering silhouette. Clean lines balance structured faces while the silky drape adds elegance — a wardrobe essential for the Modern Romantic.",
    highlights: ["Bias-cut silhouette", "TENCEL™ fabric", "Midi length"],
    price: "$60+",
    priceNumeric: 60,
    priceTier: "mid",
    icon: "shirt-outline",
    gradient: ["#D9EEF5", "#B8DCEA"],
    affiliateUrls: asos("silk slip dress"),
    defaultLocale: "US",
  },
  {
    id: "fa-2",
    name: "Linen Blazer",
    category: "Fashion",
    reason: "Versatile piece for your wardrobe",
    description:
      "A perfectly cut linen blazer that works from brunch to boardroom. The relaxed, unstructured silhouette suits most body types while projecting effortless polished style.",
    highlights: ["100% Linen", "Relaxed fit", "5 neutral colors"],
    price: "$55+",
    priceNumeric: 55,
    priceTier: "mid",
    icon: "shirt-outline",
    gradient: ["#D9EEF5", "#B8DCEA"],
    affiliateUrls: asos("linen blazer women"),
    defaultLocale: "US",
  },
  {
    id: "fa-3",
    name: "High-Waist Tailored Trousers",
    category: "Fashion",
    reason: "Elongates and balances your proportions",
    description:
      "Sleek high-waisted trousers with a wide-leg cut that elongate the silhouette. The structured fabric holds shape all day while the neutral palette makes them endlessly versatile.",
    highlights: ["High-waist cut", "Wide leg", "Stretch blend"],
    price: "$50+",
    priceNumeric: 50,
    priceTier: "mid",
    icon: "apps-outline",
    gradient: ["#F5F0D9", "#EADCB8"],
    featured: true,
    affiliateUrls: zara("tailored high waist trousers"),
    defaultLocale: "US",
  },
  {
    id: "fa-4",
    name: "Ribbed Cashmere Turtleneck",
    category: "Fashion",
    reason: "Elegant layering piece for your palette",
    description:
      "A fine-gauge cashmere turtleneck in a ribbed knit that layers beautifully and flatters every neckline. Available in ivory, camel, and oatmeal — all harmonious with warm undertone palettes.",
    highlights: ["100% Cashmere", "Ribbed knit", "Capsule wardrobe essential"],
    price: "$45+",
    priceNumeric: 45,
    priceTier: "mid",
    icon: "shirt-outline",
    gradient: ["#FFF8E1", "#FFECB3"],
    isNew: true,
    affiliateUrls: hm("cashmere turtleneck women"),
    defaultLocale: "US",
  },
  {
    id: "fa-5",
    name: "Wrap Midi Dress",
    category: "Fashion",
    reason: "Defines the waist for your archetype",
    description:
      "A wrap dress in fluid georgette that cinches at the waist and flows to mid-calf. The adjustable tie allows a perfect fit while the wrap neckline flatters most bust shapes.",
    highlights: ["Adjustable wrap", "Midi length", "Georgette fabric"],
    price: "$98+",
    priceNumeric: 98,
    priceTier: "luxury",
    icon: "shirt-outline",
    gradient: ["#E8EAF6", "#C5CAE9"],
    featured: true,
    affiliateUrls: revolve("wrap midi dress"),
    defaultLocale: "US",
  },
  {
    id: "fa-6",
    name: "Straight-Leg Cropped Jeans",
    category: "Fashion",
    reason: "Classic denim that suits your build",
    description:
      "A modern straight-leg silhouette cropped just above the ankle to show off your shoes. High-rise fit with a slight stretch makes these the most flattering everyday jeans in your rotation.",
    highlights: ["High-rise fit", "2% stretch", "Raw hem"],
    price: "$88+",
    priceNumeric: 88,
    priceTier: "luxury",
    icon: "apps-outline",
    gradient: ["#E3F2FD", "#90CAF9"],
    affiliateUrls: anthropologie("straight leg cropped jeans"),
    defaultLocale: "US",
  },

  // ─── Haircare ──────────────────────────────────────────────────────────
  {
    id: "hc-1",
    name: "Argan Oil Hair Mask",
    category: "Haircare",
    reason: "Nourishes and defines your hair type",
    description:
      "A rich weekly treatment infused with pure argan oil and keratin proteins. Reduces frizz, enhances natural wave pattern, and adds long-lasting shine — perfect for fine wavy to thick curly hair types.",
    highlights: ["Pure argan oil", "Keratin proteins", "Anti-frizz formula"],
    price: "$18+",
    priceNumeric: 18,
    priceTier: "budget",
    icon: "cut-outline",
    gradient: ["#D9F5E4", "#B8EAD0"],
    affiliateUrls: beautyAmazon("argan oil hair mask"),
    defaultLocale: "US",
  },
  {
    id: "hc-2",
    name: "Glossing Hair Serum",
    category: "Haircare",
    reason: "Adds mirror-like shine to your hair type",
    description:
      "A weightless finishing serum that wraps each strand in a reflective, frizz-free gloss. A few drops tamed through damp or dry hair delivers salon-grade shine that lasts all day.",
    highlights: ["Weightless formula", "Frizz-free", "Heat protectant"],
    price: "$28+",
    priceNumeric: 28,
    priceTier: "budget",
    icon: "sparkles-outline",
    gradient: ["#F0F4C3", "#E6EE9C"],
    featured: true,
    affiliateUrls: sephora("glossing hair serum"),
    defaultLocale: "US",
  },
  {
    id: "hc-3",
    name: "Scalp Detox Shampoo",
    category: "Haircare",
    reason: "Rebalances scalp for healthier growth",
    description:
      "A deep-cleansing, low-lather shampoo with salicylic acid and peppermint to remove buildup and refresh the scalp. Stimulates circulation while leaving hair light and clean — not stripped.",
    highlights: ["Salicylic acid", "Peppermint oil", "Sulfate-free"],
    price: "$22+",
    priceNumeric: 22,
    priceTier: "budget",
    icon: "water-outline",
    gradient: ["#E0F2F1", "#B2DFDB"],
    affiliateUrls: ulta("scalp detox shampoo"),
    defaultLocale: "US",
  },
  {
    id: "hc-4",
    name: "Curl Defining Cream",
    category: "Haircare",
    reason: "Defines and moisturizes your curl pattern",
    description:
      "A rich defining cream that enhances natural curl and wave patterns without crunch. Coconut oil and aloe vera deeply moisturize each coil from root to tip for 48 hours of defined, frizz-free texture.",
    highlights: ["Coconut oil", "Aloe vera", "No crunch"],
    price: "$16+",
    priceNumeric: 16,
    priceTier: "budget",
    icon: "flower-outline",
    gradient: ["#FFF3E0", "#FFE0B2"],
    affiliateUrls: beautyAmazon("curl defining cream"),
    defaultLocale: "US",
  },

  // ─── Eyewear ───────────────────────────────────────────────────────────
  {
    id: "ey-1",
    name: "Gold Oval Frames",
    category: "Eyewear",
    reason: "Balances and enhances your face shape",
    description:
      "Timeless oval frames in warm gold-tone metal. The soft curves complement angular jawlines while the gold tone harmonizes with warm undertones for a polished, editorial look.",
    highlights: ["Titanium frame", "Spring hinges", "UV400 lenses"],
    price: "$95+",
    priceNumeric: 95,
    priceTier: "luxury",
    icon: "glasses-outline",
    gradient: ["#F5F0D9", "#EADCB8"],
    featured: true,
    affiliateUrls: warbyParker("eyeglasses/women/oval"),
    defaultLocale: "US",
  },
  {
    id: "ey-2",
    name: "Tortoise Cat-Eye Sunglasses",
    category: "Eyewear",
    reason: "Adds drama and lift to your eye shape",
    description:
      "A classic cat-eye silhouette in a warm tortoiseshell acetate. The upswept corners create an instant lift while the oversized lens offers generous UV protection — both stylish and functional.",
    highlights: ["100% UV protection", "Polarized lenses", "Acetate frame"],
    price: "$45+",
    priceNumeric: 45,
    priceTier: "mid",
    icon: "glasses-outline",
    gradient: ["#FBE9E7", "#FFCCBC"],
    isNew: true,
    affiliateUrls: sunglassesRetailer("tortoise cat eye sunglasses women"),
    defaultLocale: "US",
  },
  {
    id: "ey-3",
    name: "Round Metal Frames",
    category: "Eyewear",
    reason: "Softens angular features with curves",
    description:
      "Delicate round frames in brushed gold metal that soften strong jawlines and square faces. The thin wire construction keeps the look light, intellectual, and effortlessly chic.",
    highlights: ["Adjustable nose pads", "Lightweight titanium", "Blue-light option"],
    price: "$115+",
    priceNumeric: 115,
    priceTier: "luxury",
    icon: "glasses-outline",
    gradient: ["#F3E5F5", "#E1BEE7"],
    affiliateUrls: warbyParker("eyeglasses/women/round"),
    defaultLocale: "US",
  },

  // ─── Jewelry ───────────────────────────────────────────────────────────
  {
    id: "jw-1",
    name: "Pearl Drop Earrings",
    category: "Jewelry",
    reason: "Soft luminosity that echoes your natural glow",
    description:
      "Freshwater pearl drops set in 14k gold-plated sterling silver. The soft luster of natural pearl plays beautifully against warm and neutral skin tones, adding understated elegance to any neckline.",
    highlights: ["Freshwater pearls", "14k gold-plated", "Hypoallergenic posts"],
    price: "$24+",
    priceNumeric: 24,
    priceTier: "budget",
    icon: "ellipse-outline",
    gradient: ["#FAF8F5", "#EDE3D9"],
    featured: true,
    affiliateUrls: amazonJewelry("freshwater pearl drop earrings gold"),
    defaultLocale: "US",
  },
  {
    id: "jw-2",
    name: "Gold Stacking Ring Set",
    category: "Jewelry",
    reason: "Layers effortlessly to frame your hands",
    description:
      "A set of five dainty 18k gold-plated rings — a plain band, twisted rope, hammered disc, star signet, and bezel-set CZ — designed to mix and stack on any finger combination for a curated editorial look.",
    highlights: ["Set of 5 rings", "18k gold-plated", "Adjustable sizing"],
    price: "$22+",
    priceNumeric: 22,
    priceTier: "budget",
    icon: "ellipse-outline",
    gradient: ["#FFF9C4", "#FFF176"],
    isNew: true,
    affiliateUrls: amazonJewelry("gold stacking ring set women"),
    defaultLocale: "US",
  },
  {
    id: "jw-3",
    name: "Solid Gold Hoop Earrings",
    category: "Jewelry",
    reason: "Classic proportion that flatters your face shape",
    description:
      "Mejuri's bestselling 14k solid gold hoops in a 15mm diameter. The perfect size to define your jaw and cheekbones without overpowering — a forever piece that improves with age.",
    highlights: ["14k solid gold", "15mm diameter", "Lifetime guarantee"],
    price: "$98+",
    priceNumeric: 98,
    priceTier: "luxury",
    icon: "ellipse-outline",
    gradient: ["#FFFDE7", "#FFF9C4"],
    affiliateUrls: mejuri("shop/products/yellow-gold-medium-bold-hoops"),
    defaultLocale: "US",
  },
  {
    id: "jw-4",
    name: "Statement Tassel Earrings",
    category: "Jewelry",
    reason: "Adds movement and drama for your archetype",
    description:
      "Long silk tassel earrings on a gold vermeil post. Available in terracotta, sage, and blush — each shade aligned to warm and soft seasonal palettes — they add dramatic length and a bohemian editorial touch.",
    highlights: ["Silk tassels", "Gold vermeil post", "3 palette shades"],
    price: "$48+",
    priceNumeric: 48,
    priceTier: "mid",
    icon: "star-outline",
    gradient: ["#F3E5F5", "#CE93D8"],
    featured: true,
    affiliateUrls: anthropologieJewelry("tassel earrings"),
    defaultLocale: "US",
  },
  {
    id: "jw-5",
    name: "Crystal Tennis Bracelet",
    category: "Jewelry",
    reason: "Refined sparkle that complements your palette",
    description:
      "A row of hand-set CZ crystals in a secure prong setting on an adjustable gold-plated chain. The continuous shimmer catches light subtly, elevating both casual and formal outfits without competing for attention.",
    highlights: ["Hand-set CZ crystals", "Safety clasp", "Adjustable 6.5–7.5\""],
    price: "$55+",
    priceNumeric: 55,
    priceTier: "mid",
    icon: "ellipse-outline",
    gradient: ["#E8EAF6", "#C5CAE9"],
    isNew: true,
    affiliateUrls: amazonJewelry("crystal tennis bracelet gold women"),
    defaultLocale: "US",
  },
  {
    id: "jw-6",
    name: "Chunky Gold Chain Bracelet",
    category: "Jewelry",
    reason: "Bold texture that anchors a minimal look",
    description:
      "A wide-link Cuban chain bracelet in gold-tone brass. The weight and substance of each link adds confident energy to a bare wrist — wear solo for maximum impact or layered with finer pieces.",
    highlights: ["Brass base", "Lobster clasp", "Tarnish-resistant plating"],
    price: "$30+",
    priceNumeric: 30,
    priceTier: "budget",
    icon: "ellipse-outline",
    gradient: ["#FFF8E1", "#FFECB3"],
    affiliateUrls: asos("chunky gold chain bracelet"),
    defaultLocale: "US",
  },
  {
    id: "jw-7",
    name: "Layered Pendant Necklace Set",
    category: "Jewelry",
    reason: "Frames your décolletage with intention",
    description:
      "Three coordinating necklaces — a choker, collarbone-length chain with a moon pendant, and a longer coin drop — designed to be worn together as a curated layer stack or individually for each occasion.",
    highlights: ["Set of 3", "18k gold-plated", "Adjustable lengths"],
    price: "$58+",
    priceNumeric: 58,
    priceTier: "mid",
    icon: "ellipse-outline",
    gradient: ["#FCE4EC", "#F8BBD0"],
    affiliateUrls: revolve("layered pendant necklace set"),
    defaultLocale: "US",
  },
  {
    id: "jw-8",
    name: "Crystal Cocktail Ring",
    category: "Jewelry",
    reason: "Signature piece for your bold archetype",
    description:
      "A large oval emerald-cut CZ set in 18k gold-plated brass with pavé shoulders. The generous stone size reads as fine jewelry at a fraction of the cost — your conversation-starting statement piece.",
    highlights: ["Emerald-cut CZ", "Pavé shoulders", "Rhodium-plated option"],
    price: "$125+",
    priceNumeric: 125,
    priceTier: "luxury",
    icon: "star-outline",
    gradient: ["#E8F5E9", "#C8E6C9"],
    featured: true,
    isNew: true,
    affiliateUrls: nordstrom("crystal cocktail ring gold"),
    defaultLocale: "US",
  },
  {
    id: "jw-9",
    name: "Pearl Strand Necklace",
    category: "Jewelry",
    reason: "Luminous classic that flatters every neckline",
    description:
      "A 16-inch strand of hand-knotted freshwater pearls with a gold-plated barrel clasp. The soft, milky luminosity of each pearl amplifies light around the face — a timeless finishing piece that elevates everything from open-collar shirts to evening décolletage.",
    highlights: ["Freshwater pearls", "Hand-knotted strand", "Gold-plated clasp"],
    price: "$38+",
    priceNumeric: 38,
    priceTier: "budget",
    icon: "ellipse-outline",
    gradient: ["#FAF8F5", "#EDE3D9"],
    isNew: true,
    affiliateUrls: amazonJewelry("freshwater pearl strand necklace gold clasp"),
    defaultLocale: "US",
  },
  {
    id: "jw-10",
    name: "Layered Charm Bracelet Stack",
    category: "Jewelry",
    reason: "Curated wrist stack that tells your style story",
    description:
      "A set of three coordinating bracelets — a Figaro chain, a beaded turquoise strand, and a hammered disc charm — designed to be worn together or separated. The trio layers naturally without tangling and pairs with any outfit from casual to cocktail.",
    highlights: ["Set of 3", "Brass + turquoise beads", "Adjustable sizing"],
    price: "$34+",
    priceNumeric: 34,
    priceTier: "budget",
    icon: "ellipse-outline",
    gradient: ["#E0F7FA", "#B2EBF2"],
    affiliateUrls: asos("layered charm bracelet stack set"),
    defaultLocale: "US",
  },
  {
    id: "jw-11",
    name: "Bold Statement Cuff",
    category: "Jewelry",
    reason: "Strong, sculptural accent for bold archetypes",
    description:
      "A wide hammered brass cuff finished in 18k gold plating. The single bold piece says more than a handful of delicate rings — wear it alone on a bare wrist for maximum architectural impact, or stack over a watch for an editorial layered effect.",
    highlights: ["Hammered brass", "18k gold-plated", "Adjustable opening"],
    price: "$42+",
    priceNumeric: 42,
    priceTier: "mid",
    icon: "ellipse-outline",
    gradient: ["#FFF8E1", "#FFECB3"],
    featured: true,
    affiliateUrls: anthropologieJewelry("statement cuff bracelet gold"),
    defaultLocale: "US",
  },

  // ─── Watches ───────────────────────────────────────────────────────────
  {
    id: "wa-1",
    name: "Minimalist Leather Strap Watch",
    category: "Watches",
    reason: "Clean, refined finishing piece for your wrist",
    description:
      "A 36mm brushed gold-tone case on a genuine tan leather strap. The clean, uncluttered dial with minimalist indices reads sophisticated without effort — pairs with everything from blazers to silk blouses.",
    highlights: ["36mm case", "Genuine leather", "Japanese quartz movement"],
    price: "$75+",
    priceNumeric: 75,
    priceTier: "mid",
    icon: "time-outline",
    gradient: ["#EFEBE9", "#D7CCC8"],
    featured: true,
    affiliateUrls: amazonWatch("minimalist leather strap watch women gold"),
    defaultLocale: "US",
  },
  {
    id: "wa-2",
    name: "Gold Mesh Bracelet Watch",
    category: "Watches",
    reason: "Jewelry-forward timepiece for your warm palette",
    description:
      "A 28mm sunray-dial watch on an integrated gold-tone stainless mesh bracelet. The seamless silhouette sits flush on the wrist like fine jewelry — a forever piece that transitions from desk to dinner.",
    highlights: ["28mm sunray dial", "Mesh bracelet", "Scratch-resistant crystal"],
    price: "$195+",
    priceNumeric: 195,
    priceTier: "luxury",
    icon: "time-outline",
    gradient: ["#FFF9C4", "#FFF59D"],
    featured: true,
    affiliateUrls: nordstrom("gold mesh bracelet watch women"),
    defaultLocale: "US",
  },
  {
    id: "wa-3",
    name: "Rose Gold Marble-Dial Watch",
    category: "Watches",
    reason: "Feminine detail that flatters soft archetypes",
    description:
      "A 32mm rose gold case housing a genuine marble dial — no two are identical. The soft peach-pink tones harmonize with warm and soft seasonal palettes, making this a deeply personal statement piece.",
    highlights: ["32mm marble dial", "Rose gold plating", "Genuine marble face"],
    price: "$62+",
    priceNumeric: 62,
    priceTier: "mid",
    icon: "time-outline",
    gradient: ["#FCE4EC", "#F8BBD0"],
    isNew: true,
    affiliateUrls: amazonWatch("rose gold marble dial watch women"),
    defaultLocale: "US",
  },
  {
    id: "wa-4",
    name: "Tortoiseshell Strap Watch",
    category: "Watches",
    reason: "Warm tones that echo your undertone perfectly",
    description:
      "A 34mm gold case on a rich tortoiseshell acetate strap. The warm caramel tones of the band mirror the depth of warm undertone palettes, making this one of the most flattering watches for your coloring.",
    highlights: ["34mm case", "Acetate strap", "3ATM water resistant"],
    price: "$68+",
    priceNumeric: 68,
    priceTier: "mid",
    icon: "time-outline",
    gradient: ["#FBE9E7", "#FFCCBC"],
    affiliateUrls: asos("tortoiseshell strap watch gold"),
    defaultLocale: "US",
  },
  {
    id: "wa-5",
    name: "Mother-of-Pearl Dress Watch",
    category: "Watches",
    reason: "Luminous elegance for evening looks",
    description:
      "A 30mm diamond-bezel watch with a genuine mother-of-pearl dial on a satin-finished bracelet. The iridescent face catches light like a pearl necklace — the definitive dressing-up timepiece.",
    highlights: ["MOP dial", "Diamond bezel", "Satin bracelet"],
    price: "$220+",
    priceNumeric: 220,
    priceTier: "luxury",
    icon: "time-outline",
    gradient: ["#E3F2FD", "#BBDEFB"],
    isNew: true,
    affiliateUrls: nordstrom("mother of pearl dress watch women"),
    defaultLocale: "US",
  },
  {
    id: "wa-6",
    name: "Bold Oversized Sport-Chic Watch",
    category: "Watches",
    reason: "Strong, structured contrast for bold archetypes",
    description:
      "A 40mm oversized case in brushed two-tone steel on a silicone sport strap. The commanding proportion pairs unexpectedly well with feminine silhouettes, creating the high-low tension that defines modern style.",
    highlights: ["40mm case", "Two-tone steel", "100m water resistant"],
    price: "$55+",
    priceNumeric: 55,
    priceTier: "mid",
    icon: "time-outline",
    gradient: ["#E0F7FA", "#B2EBF2"],
    affiliateUrls: amazonWatch("oversized two tone women watch sport chic"),
    defaultLocale: "US",
  },
  {
    id: "wa-7",
    name: "Minimalist Canvas Field Watch",
    category: "Watches",
    reason: "Rugged-refined contrast for casual archetypes",
    description:
      "A 38mm matte case on a khaki NATO canvas strap — the definitive minimalist field watch. Originally inspired by military utility, this modern interpretation is scrubbed clean with a simple three-hand dial, making it the most versatile and understated watch in any collection.",
    highlights: ["38mm matte case", "NATO canvas strap", "100m water resistant"],
    price: "$48+",
    priceNumeric: 48,
    priceTier: "mid",
    icon: "time-outline",
    gradient: ["#D9EEF5", "#B8DCEA"],
    affiliateUrls: amazonWatch("minimalist field watch women NATO strap"),
    defaultLocale: "US",
  },
  {
    id: "wa-8",
    name: "Hybrid Fashion Smartwatch",
    category: "Watches",
    reason: "Smart functionality in a jewelry-forward silhouette",
    description:
      "A 36mm rose-gold case on a blush leather strap that hides smart features — step tracking, heart rate, and subtle vibration notifications — behind a traditional analog face. You get the look of a dress watch and the practicality of a fitness tracker with zero compromise on style.",
    highlights: ["Analog + smart hybrid", "7-day battery", "Heart rate + steps"],
    price: "$95+",
    priceNumeric: 95,
    priceTier: "luxury",
    icon: "time-outline",
    gradient: ["#F3E5F5", "#E1BEE7"],
    isNew: true,
    affiliateUrls: amazonWatch("hybrid fashion smartwatch rose gold women"),
    defaultLocale: "US",
  },

  // ─── Accessories ───────────────────────────────────────────────────────
  {
    id: "ac-1",
    name: "Minimalist Gold Chain Necklace",
    category: "Accessories",
    reason: "Complements warm skin tones beautifully",
    description:
      "A dainty 18k gold-plated chain necklace that sits at the collarbone. The delicate link design layers perfectly and transitions from daytime to evening with zero effort.",
    highlights: ["18k gold plated", "Waterproof", "Adjustable 16-18\""],
    price: "$24+",
    priceNumeric: 24,
    priceTier: "budget",
    icon: "ellipse-outline",
    gradient: ["#FFF9C4", "#FFF59D"],
    isNew: true,
    affiliateUrls: amazonJewelry("minimalist gold chain necklace"),
    defaultLocale: "US",
  },
  {
    id: "ac-2",
    name: "Woven Leather Belt",
    category: "Accessories",
    reason: "Defines your waist and adds texture",
    description:
      "A hand-woven leather belt with a minimal gold buckle. The braided texture adds dimension to any outfit while the cognac shade complements warm undertone palettes perfectly.",
    highlights: ["Genuine leather", "Cognac & black", "Adjustable fit"],
    price: "$30+",
    priceNumeric: 30,
    priceTier: "budget",
    icon: "apps-outline",
    gradient: ["#EFEBE9", "#BCAAA4"],
    affiliateUrls: zara("woven leather belt"),
    defaultLocale: "US",
  },
  {
    id: "ac-3",
    name: "Structured Tote Bag",
    category: "Accessories",
    reason: "Polished everyday carry for your style",
    description:
      "A clean-lined structured tote in vegan leather that holds everything without losing its shape. The minimalist design complements both casual and formal outfits — a true wardrobe anchor.",
    highlights: ["Vegan leather", "Laptop sleeve", "Magnetic closure"],
    price: "$65+",
    priceNumeric: 65,
    priceTier: "mid",
    icon: "bag-outline",
    gradient: ["#ECEFF1", "#CFD8DC"],
    featured: true,
    affiliateUrls: {
      US: { url: "https://www.amazon.com/s?k=structured+tote+bag+women+vegan+leather", retailer: "Amazon" },
      GB: { url: "https://www.wolfandbadger.com/uk/search/?q=structured+tote+bag", retailer: "Wolf & Badger" },
      AU: { url: "https://www.amazon.com.au/s?k=structured+tote+bag+women+vegan+leather", retailer: "Amazon" },
      CA: { url: "https://www.amazon.ca/s?k=structured+tote+bag+women+vegan+leather", retailer: "Amazon" },
      FR: { url: "https://www.farfetch.com/shopping/women/search/?q=structured+tote+bag", retailer: "Farfetch" },
      DE: { url: "https://www.farfetch.com/shopping/women/search/?q=structured+tote+bag", retailer: "Farfetch" },
      INT: { url: "https://www.farfetch.com/shopping/women/search/?q=structured+tote+bag", retailer: "Farfetch" },
    },
    defaultLocale: "US",
  },
];

export const CATEGORIES = [
  "All",
  "Skincare",
  "Makeup",
  "Fashion",
  "Haircare",
  "Eyewear",
  "Accessories",
  "Jewelry",
  "Watches",
];

export const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  budget: "Budget",
  mid: "Mid-Range",
  luxury: "Luxury",
};

export const PRICE_TIER_COLORS: Record<PriceTier, string> = {
  budget: "#4CAF50",
  mid: "#FF9800",
  luxury: "#9C27B0",
};

export const RETAILER_ICONS: Record<
  string,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  Sephora: "flower-outline",
  Amazon: "cart-outline",
  ASOS: "bag-outline",
  "Warby Parker": "glasses-outline",
  Ulta: "sparkles-outline",
  Zara: "shirt-outline",
  "H&M": "shirt-outline",
  Revolve: "heart-outline",
  Anthropologie: "leaf-outline",
  "Paula's Choice": "flask-outline",
  Mejuri: "ellipse-outline",
  Nordstrom: "bag-handle-outline",
  Mecca: "sparkles-outline",
  LookFantastic: "flask-outline",
  Douglas: "sparkles-outline",
  "Nocibé": "flower-outline",
  "Net-a-Porter": "bag-handle-outline",
  Farfetch: "globe-outline",
  "Wolf & Badger": "leaf-outline",
  Specsavers: "glasses-outline",
  GrandOptical: "glasses-outline",
  "Apollo Optik": "glasses-outline",
  Clearly: "glasses-outline",
  "Sunglass Hut": "glasses-outline",
  "Adore Beauty": "flower-outline",
  Flaconi: "flask-outline",
  "Watch Shop": "time-outline",
  Chrono24: "time-outline",
  Etsy: "bag-outline",
};
