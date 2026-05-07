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

type ToneMatch = {
  base: ClothingToneCompatibility;
  overlay: number;
  label: string;
  glow: boolean;
};

function normalize(hex: string) {
  const v = hex.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
  return "#C4956A";
}

function has(pattern: RegExp, value?: string) {
  return pattern.test(value ?? "");
}

function isWarm(undertone: string) {
  return /warm|golden|yellow|peach|olive|amber/i.test(undertone);
}

function isCool(undertone: string) {
  return /cool|pink|rose|blue|ash|silver/i.test(undertone);
}

function isHighContrast(contrastLevel?: string) {
  return has(/high|strong|sharp|dramatic/i, contrastLevel);
}

function isLowContrast(contrastLevel?: string) {
  return has(/low|soft|subtle|gentle/i, contrastLevel);
}

export function deriveSeasonLabel(undertone: string, contrastLevel?: string) {
  const warm = isWarm(undertone);
  const cool = isCool(undertone);
  const high = isHighContrast(contrastLevel);
  const low = isLowContrast(contrastLevel);

  if (warm && low) return "Soft Autumn";
  if (warm && high) return "Deep Autumn";
  if (warm) return "True Autumn";
  if (cool && low) return "Soft Summer";
  if (cool && high) return "Deep Winter";
  if (cool) return "True Summer";
  if (high) return "Bright Winter";
  if (low) return "Light Spring";
  return "Neutral Autumn";
}

export function deriveColorSwatches(
  analysis: Pick<AnalysisResult, "color_palette" | "undertone">
): SwatchGroup[] {
  const palette = (analysis.color_palette?.length ? analysis.color_palette : FALLBACK_PALETTE).map(normalize);
  const warm = isWarm(analysis.undertone);
  const pick = (index: number, fallback: string) => palette[index] ?? fallback;
  return [
    {
      title: "Best Neutrals",
      swatches: [
        { label: warm ? "Ivory" : "Pearl", hex: pick(1, "#F5EDE3") },
        { label: warm ? "Camel" : "Taupe", hex: pick(3, "#B8DCEA") },
      ],
    },
    {
      title: "Accent Colors",
      swatches: [
        { label: "Glow", hex: pick(0, "#C4956A") },
        { label: "Lift", hex: pick(1, "#F5EDE3") },
      ],
    },
    {
      title: "Statement Colors",
      swatches: [
        { label: "Hero", hex: pick(2, "#E8C4A0") },
        { label: "Pop", hex: pick(3, "#B8DCEA") },
      ],
    },
    {
      title: "Soft Tones",
      swatches: [
        { label: "Mist", hex: pick(4, "#8B5E3C") },
        { label: "Air", hex: pick(1, "#F5EDE3") },
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
  const warm = isWarm(analysis.undertone);
  const cool = isCool(analysis.undertone);
  const high = isHighContrast(analysis.contrast_level);
  const low = isLowContrast(analysis.contrast_level);
  const families = (analysis.color_families ?? []).join(" ").toLowerCase();
  const likesEarth = /earth|autumn|warm|terracotta|olive/.test(families);
  const likesSoft = /soft|muted|dusty|pastel/.test(families);
  const matches: ToneMatch[] = [
    { label: "Ivory", base: "neutral", overlay: 0.24, glow: false },
    { label: "Charcoal", base: high ? "best" : "neutral", overlay: 0.28, glow: high },
    { label: "Dusty Rose", base: cool || likesSoft ? "best" : "neutral", overlay: 0.2, glow: cool || likesSoft },
    { label: "Emerald", base: high || cool ? "best" : "neutral", overlay: 0.24, glow: high },
    { label: "Warm Beige", base: warm || likesEarth ? "best" : "neutral", overlay: 0.22, glow: warm || likesEarth },
    { label: "Cool Grey", base: cool || likesSoft ? "best" : "neutral", overlay: 0.22, glow: cool || likesSoft },
    { label: "Terracotta", base: warm ? "best" : low ? "neutral" : "avoid", overlay: 0.18, glow: warm },
    { label: "Navy", base: high || cool ? "best" : "neutral", overlay: 0.26, glow: high || cool },
    { label: "Icy Lilac", base: cool ? "best" : "avoid", overlay: 0.16, glow: cool },
    { label: "Mustard", base: warm ? "best" : "avoid", overlay: 0.18, glow: warm },
  ];

  return matches.map((tone, index) => ({
    label: tone.label,
    hex: [
      "#F5EDE3",
      "#3A3431",
      "#CFA3AE",
      "#2E8B57",
      "#D8B58A",
      "#B9C0C8",
      "#C56B4C",
      "#2E5A7A",
      "#DCD7F5",
      "#C8A14A",
    ][index],
    compatibility: tone.base,
  }));
}
