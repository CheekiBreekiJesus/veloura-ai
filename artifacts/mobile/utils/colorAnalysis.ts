import type { AnalysisResult } from "@/context/AnalysisContext";

export type ClothingToneCompatibility = "best" | "neutral" | "avoid";

export type SwatchGroup = {
  title: string;
  swatches: { label: string; hex: string }[];
};

export type ClothingTone = {
  label: string;
  hex: string;
  compatibility: ClothingToneCompatibility;
};

const FALLBACK_PALETTE = ["#C4956A", "#F5EDE3", "#E8C4A0", "#B8DCEA", "#8B5E3C"];

function normalize(hex: string) {
  const v = hex.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
  return "#C4956A";
}

export function deriveSeasonLabel(undertone: string, contrastLevel?: string) {
  const warm = /warm|golden|yellow|peach|olive|amber/i.test(undertone);
  const cool = /cool|pink|rose|blue|ash|silver/i.test(undertone);
  const high = /high/i.test(contrastLevel ?? "");
  const low = /low/i.test(contrastLevel ?? "");
  if (warm && low) return "Soft Spring";
  if (warm && high) return "Deep Autumn";
  if (cool && low) return "Soft Summer";
  if (cool && high) return "Deep Winter";
  if (warm) return "True Spring";
  if (cool) return "True Summer";
  return high ? "Deep Neutral" : "Soft Neutral";
}

export function deriveColorSwatches(
  analysis: Pick<AnalysisResult, "color_palette" | "undertone">
): SwatchGroup[] {
  const palette = (analysis.color_palette?.length ? analysis.color_palette : FALLBACK_PALETTE).map(normalize);
  const [a, b, c, d, e] = palette;
  const warm = /warm|golden|yellow|peach|olive|amber/i.test(analysis.undertone);
  return [
    {
      title: "Best Neutrals",
      swatches: [
        { label: warm ? "Ivory" : "Pearl", hex: palette[1] ?? "#F5EDE3" },
        { label: warm ? "Camel" : "Taupe", hex: palette[3] ?? "#B8DCEA" },
      ],
    },
    {
      title: "Accent Colors",
      swatches: [
        { label: "Glow", hex: a },
        { label: "Lift", hex: b },
      ],
    },
    {
      title: "Statement Colors",
      swatches: [
        { label: "Hero", hex: c },
        { label: "Pop", hex: d },
      ],
    },
    {
      title: "Soft Tones",
      swatches: [
        { label: "Mist", hex: e },
        { label: "Air", hex: palette[1] ?? "#F5EDE3" },
      ],
    },
    {
      title: "Dark Tones",
      swatches: [
        { label: warm ? "Cocoa" : "Ink", hex: warm ? "#6B4226" : "#1A1A2E" },
        { label: warm ? "Espresso" : "Navy", hex: warm ? "#4A3728" : "#2E5A7A" },
      ],
    },
  ];
}

export function deriveClothingTones(
  analysis: Pick<AnalysisResult, "undertone" | "contrast_level" | "color_families">
): ClothingTone[] {
  const warm = /warm|golden|yellow|peach|olive|amber/i.test(analysis.undertone);
  const cool = /cool|pink|rose|blue|ash|silver/i.test(analysis.undertone);
  const high = /high/i.test(analysis.contrast_level ?? "");
  const low = /low/i.test(analysis.contrast_level ?? "");
  const families = (analysis.color_families ?? []).join(" ").toLowerCase();
  const likesEarth = /earth|autumn|warm|terracotta|olive/.test(families);
  const likesSoft = /soft|muted|dusty|pastel/.test(families);

  return [
    { label: "Ivory", hex: "#F5EDE3", compatibility: warm ? "best" : "neutral" },
    { label: "Charcoal", hex: "#3A3431", compatibility: high ? "best" : "neutral" },
    { label: "Dusty Rose", hex: "#CFA3AE", compatibility: cool || likesSoft ? "best" : "neutral" },
    { label: "Emerald", hex: "#2E8B57", compatibility: high ? "best" : "neutral" },
    { label: "Warm Beige", hex: "#D8B58A", compatibility: warm || likesEarth ? "best" : "neutral" },
    { label: "Cool Grey", hex: "#B9C0C8", compatibility: cool || likesSoft ? "best" : "neutral" },
    { label: "Terracotta", hex: "#C56B4C", compatibility: warm ? "best" : low ? "neutral" : "avoid" },
    { label: "Navy", hex: "#2E5A7A", compatibility: high || cool ? "best" : "neutral" },
    { label: "Icy Lilac", hex: "#DCD7F5", compatibility: cool ? "best" : "avoid" },
    { label: "Mustard", hex: "#C8A14A", compatibility: warm ? "best" : "avoid" },
  ];
}
