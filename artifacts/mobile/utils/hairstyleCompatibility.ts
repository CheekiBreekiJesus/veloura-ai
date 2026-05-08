import type { AnalysisResult } from "@/context/AnalysisContext";

type StyleCard = { id: string; keywords: string[] };

const FALLBACK_SCORES: Record<string, number> = {
  "long-layered": 0.48,
  "soft-waves": 0.52,
  "curtain-bangs": 0.44,
  "sleek-straight": 0.46,
  "textured-bob": 0.50,
  "voluminous-curls": 0.42,
  "tied-back": 0.54,
  "shoulder-length": 0.56,
};

export function computeStyleCompatibility(
  card: StyleCard,
  analysis: AnalysisResult
): number {
  const suggestions = [
    ...(analysis.hairstyle_suggestions ?? []),
    ...(analysis.hair_lengths ?? []),
  ]
    .join(" ")
    .toLowerCase();
  const matched = card.keywords.filter((kw) =>
    suggestions.includes(kw.toLowerCase())
  );
  if (matched.length > 0) return Math.min(0.96, 0.82 + matched.length * 0.06);
  const dir = (analysis.recommended_style_direction ?? "").toLowerCase();
  if (card.keywords.some((k) => dir.includes(k))) return 0.72;
  return FALLBACK_SCORES[card.id] ?? 0.45;
}
