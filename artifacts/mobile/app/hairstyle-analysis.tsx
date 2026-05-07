import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis, type AnalysisResult } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const ND = Platform.OS !== "web";

const GOLD = "#C4956A";

function useFadeSlideIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: ND,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: ND,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return { opacity, transform: [{ translateY }] };
}

function HairContourOverlay({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const cy = h / 2;
  return (
    <Svg
      width={w}
      height={h}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Ellipse
        cx={cx}
        cy={cy * 1.08}
        rx={w * 0.29}
        ry={h * 0.40}
        stroke={`rgba(196,149,106,0.22)`}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="6 4"
      />
      <Path
        d={`M ${cx - w * 0.29} ${cy * 0.68} Q ${cx} ${cy * 0.14} ${cx + w * 0.29} ${cy * 0.68}`}
        stroke={`rgba(196,149,106,0.30)`}
        strokeWidth={1.5}
        fill="none"
      />
      <Path
        d={`M ${cx - w * 0.18} ${cy * 0.50} Q ${cx - w * 0.30} ${cy * 0.38} ${cx - w * 0.28} ${cy * 0.68}`}
        stroke={`rgba(255,255,255,0.15)`}
        strokeWidth={1}
        fill="none"
      />
      <Path
        d={`M ${cx + w * 0.18} ${cy * 0.50} Q ${cx + w * 0.30} ${cy * 0.38} ${cx + w * 0.28} ${cy * 0.68}`}
        stroke={`rgba(255,255,255,0.15)`}
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
}

const HAIRSTYLE_CARDS: {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  keywords: string[];
}[] = [
  { id: "long-layered", label: "Long Layered", icon: "cut-outline", keywords: ["long", "layers", "layered"] },
  { id: "soft-waves", label: "Soft Waves", icon: "water-outline", keywords: ["wave", "wavy", "soft wave"] },
  { id: "curtain-bangs", label: "Curtain Bangs", icon: "reorder-two-outline", keywords: ["bang", "curtain", "fringe"] },
  { id: "sleek-straight", label: "Sleek Straight", icon: "remove-outline", keywords: ["straight", "sleek", "smooth"] },
  { id: "textured-bob", label: "Textured Bob", icon: "ellipse-outline", keywords: ["bob", "textured bob", "lob"] },
  { id: "voluminous-curls", label: "Voluminous Curls", icon: "sync-outline", keywords: ["curl", "curly", "voluminous"] },
  { id: "tied-back", label: "Tied Back", icon: "infinite-outline", keywords: ["updo", "tied", "bun", "ponytail"] },
  { id: "shoulder-length", label: "Shoulder Length", icon: "resize-outline", keywords: ["shoulder", "medium length", "collarbone"] },
];

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

function computeStyleCompatibility(
  card: (typeof HAIRSTYLE_CARDS)[0],
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

function isBestMatch(score: number): boolean {
  return score >= 0.82;
}

function HairstyleCard({
  card,
  score,
  colors,
}: {
  card: (typeof HAIRSTYLE_CARDS)[0];
  score: number;
  colors: ReturnType<typeof useColors>;
}) {
  const best = isBestMatch(score);
  return (
    <View
      style={[
        styles.hairstyleCard,
        {
          backgroundColor: colors.card,
          borderColor: best ? GOLD + "60" : colors.border,
          shadowColor: best ? GOLD : "#000",
          shadowOpacity: best ? 0.18 : 0.04,
          shadowRadius: best ? 14 : 4,
          shadowOffset: { width: 0, height: 4 },
          elevation: best ? 6 : 2,
        },
      ]}
    >
      {best && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 18,
              backgroundColor: GOLD + "08",
            },
          ]}
          pointerEvents="none"
        />
      )}
      <View
        style={[
          styles.hairstyleIconWrap,
          { backgroundColor: best ? GOLD + "18" : colors.secondary },
        ]}
      >
        <Ionicons name={card.icon} size={22} color={GOLD} />
      </View>
      <Text
        style={[styles.hairstyleLabel, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {card.label}
      </Text>
      <View style={styles.compatBarWrap}>
        <View style={[styles.compatBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.compatBarFill,
              { width: `${Math.round(score * 100)}%`, backgroundColor: best ? GOLD : colors.mutedForeground },
            ]}
          />
        </View>
        <Text style={[styles.compatPct, { color: best ? GOLD : colors.mutedForeground }]}>
          {Math.round(score * 100)}%
        </Text>
      </View>
      {best && (
        <View style={[styles.bestBadge, { backgroundColor: GOLD }]}>
          <Ionicons name="sparkles" size={9} color="#fff" />
          <Text style={styles.bestBadgeText}>Best Match</Text>
        </View>
      )}
    </View>
  );
}

const COMPAT_TILES: {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  getValue: (a: AnalysisResult) => number;
  getNote: (a: AnalysisResult) => string;
}[] = [
  {
    id: "volume",
    icon: "layers-outline",
    label: "Volume Balance",
    getValue: (a) => {
      const h = (a.hair_type ?? "").toLowerCase();
      if (h.includes("fine") || h.includes("thin")) return 0.65;
      if (h.includes("thick") || h.includes("coarse")) return 0.78;
      return 0.82;
    },
    getNote: (a) => {
      const h = (a.hair_type ?? "").toLowerCase();
      if (h.includes("fine")) return "Fine texture — prioritize volume";
      if (h.includes("thick")) return "Thick texture — control is key";
      return "Well-balanced texture";
    },
  },
  {
    id: "framing",
    icon: "scan-outline",
    label: "Face Framing",
    getValue: (a) => {
      const fs = (a.face_shape ?? "").toLowerCase();
      if (fs.includes("oval")) return 0.92;
      if (fs.includes("round")) return 0.76;
      if (fs.includes("square")) return 0.80;
      if (fs.includes("heart")) return 0.84;
      return 0.74;
    },
    getNote: (a) => {
      const fs = (a.face_shape ?? "").toLowerCase();
      if (fs.includes("oval")) return "Most styles flatter you";
      if (fs.includes("round")) return "Elongating cuts enhance shape";
      if (fs.includes("square")) return "Soft layers soften angles";
      if (fs.includes("heart")) return "Balance forehead with volume below";
      return "Layers add definition";
    },
  },
  {
    id: "symmetry",
    icon: "infinite-outline",
    label: "Symmetry Enhancement",
    getValue: (a) => {
      const s = a.facial_symmetry_score ?? 0.75;
      return 0.55 + s * 0.45;
    },
    getNote: (a) => {
      const s = a.facial_symmetry_score ?? 0.75;
      if (s >= 0.85) return "High symmetry — any part works";
      if (s >= 0.7) return "Centre or soft side parts flatter";
      return "Side parts balance features";
    },
  },
  {
    id: "softness",
    icon: "git-merge-outline",
    label: "Softness vs Structure",
    getValue: (a) => {
      const jaw = (a.jawline_definition ?? "").toLowerCase();
      const cheek = (a.cheekbone_prominence ?? "").toLowerCase();
      const strong = ["strong", "defined", "sharp", "prominent", "high"].some(
        (w) => jaw.includes(w) || cheek.includes(w)
      );
      return strong ? 0.88 : 0.70;
    },
    getNote: (a) => {
      const jaw = (a.jawline_definition ?? "").toLowerCase();
      const strong = ["strong", "defined", "sharp"].some((w) => jaw.includes(w));
      return strong ? "Soft waves balance structure" : "Both soft & structured styles suit you";
    },
  },
  {
    id: "maintenance",
    icon: "time-outline",
    label: "Maintenance Level",
    getValue: (a) => {
      const h = (a.hair_type ?? "").toLowerCase();
      if (h.includes("curly") || h.includes("coily")) return 0.60;
      if (h.includes("wavy")) return 0.78;
      if (h.includes("straight")) return 0.90;
      return 0.75;
    },
    getNote: (a) => {
      const h = (a.hair_type ?? "").toLowerCase();
      if (h.includes("curly") || h.includes("coily")) return "Curl-friendly low-maintenance cuts";
      if (h.includes("wavy")) return "Moderate styling effort";
      if (h.includes("straight")) return "Low maintenance — easy to style";
      return "Moderate effort styles";
    },
  },
];

function CompatibilityTile({
  tile,
  analysis,
  colors,
}: {
  tile: (typeof COMPAT_TILES)[0];
  analysis: AnalysisResult;
  colors: ReturnType<typeof useColors>;
}) {
  const score = tile.getValue(analysis);
  const note = tile.getNote(analysis);
  const pct = Math.round(score * 100);
  const isHigh = score >= 0.80;
  return (
    <View
      style={[
        styles.compatTile,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.compatTileIcon,
          { backgroundColor: isHigh ? GOLD + "18" : colors.secondary },
        ]}
      >
        <Ionicons name={tile.icon} size={18} color={GOLD} />
      </View>
      <Text style={[styles.compatTileLabel, { color: colors.foreground }]}>
        {tile.label}
      </Text>
      <Text
        style={[styles.compatTileNote, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {note}
      </Text>
      <View style={styles.compatTileBarRow}>
        <View style={[styles.compatBarBg, { backgroundColor: colors.border, flex: 1 }]}>
          <View
            style={[
              styles.compatBarFill,
              { width: `${pct}%`, backgroundColor: GOLD },
            ]}
          />
        </View>
        <Text style={[styles.compatPct, { color: GOLD }]}>{pct}%</Text>
      </View>
    </View>
  );
}

const HAIR_COLOR_SWATCHES: {
  label: string;
  hex: string;
  undertones: string[];
  contrast: string[];
}[] = [
  { label: "Warm Brunette", hex: "#6B3A2A", undertones: ["warm"], contrast: ["medium", "high"] },
  { label: "Soft Black", hex: "#1C1212", undertones: ["cool", "neutral"], contrast: ["high"] },
  { label: "Caramel Highlights", hex: "#C48B4A", undertones: ["warm", "neutral"], contrast: ["medium", "low"] },
  { label: "Ash Brown", hex: "#7A6A62", undertones: ["cool", "neutral"], contrast: ["medium"] },
  { label: "Copper Tones", hex: "#B5502B", undertones: ["warm"], contrast: ["medium", "high"] },
  { label: "Espresso", hex: "#3B1F10", undertones: ["warm", "neutral"], contrast: ["high"] },
];

function hexToWarmScore(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r - b) / 255;
}

function paletteUndertoneHint(palette: string[]): "warm" | "cool" | "neutral" {
  if (!palette.length) return "neutral";
  const avg = palette.reduce((sum, hex) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return sum;
    return sum + hexToWarmScore(hex);
  }, 0) / palette.length;
  if (avg > 0.06) return "warm";
  if (avg < -0.06) return "cool";
  return "neutral";
}

function isColorCompatible(
  swatch: (typeof HAIR_COLOR_SWATCHES)[0],
  analysis: AnalysisResult
): "best" | "good" | "neutral" {
  const undertone = (analysis.undertone ?? "").toLowerCase();
  const contrast = (analysis.contrast_level ?? "").toLowerCase();
  const matchesUndertone = swatch.undertones.some((u) =>
    undertone.includes(u)
  );
  const matchesContrast = swatch.contrast.some((c) => contrast.includes(c));

  const paletteHint = paletteUndertoneHint(analysis.color_palette ?? []);
  const paletteMatches =
    swatch.undertones.includes(paletteHint) || paletteHint === "neutral";

  if (matchesUndertone && matchesContrast) return "best";
  if ((matchesUndertone && paletteMatches) || (matchesContrast && paletteMatches)) return "best";
  if (matchesUndertone || matchesContrast || paletteMatches) return "good";
  return "neutral";
}

function ColorSwatchChip({
  swatch,
  compat,
  colors,
}: {
  swatch: (typeof HAIR_COLOR_SWATCHES)[0];
  compat: "best" | "good" | "neutral";
  colors: ReturnType<typeof useColors>;
}) {
  const isBest = compat === "best";
  return (
    <View style={[styles.swatchChip, { opacity: compat === "neutral" ? 0.6 : 1 }]}>
      <View
        style={[
          styles.swatchCircle,
          { backgroundColor: swatch.hex },
          isBest && {
            borderWidth: 2.5,
            borderColor: GOLD,
            shadowColor: GOLD,
            shadowOpacity: 0.35,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {isBest && (
          <View style={styles.swatchCheck}>
            <Ionicons name="checkmark" size={11} color="#fff" />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.swatchLabel,
          { color: isBest ? colors.foreground : colors.mutedForeground },
        ]}
        numberOfLines={2}
      >
        {swatch.label}
      </Text>
    </View>
  );
}

const STYLE_TAGS: { label: string; keywords: string[] }[] = [
  { label: "Effortless Chic", keywords: ["chic", "effortless", "casual", "relaxed"] },
  { label: "Soft Romantic", keywords: ["romantic", "soft", "feminine", "delicate"] },
  { label: "Clean Girl", keywords: ["clean", "minimal", "natural", "dewy"] },
  { label: "Modern Classic", keywords: ["classic", "timeless", "modern", "polished"] },
  { label: "Bold Volume", keywords: ["bold", "volume", "dramatic", "statement"] },
  { label: "Minimalist Sleek", keywords: ["minimalist", "sleek", "structured", "simple"] },
  { label: "Natural Elegance", keywords: ["natural", "elegant", "understated", "organic"] },
];

function deriveMatchingTags(analysis: AnalysisResult): Set<string> {
  const corpus = [
    ...(analysis.aesthetic_archetypes ?? []),
    analysis.style_archetype ?? "",
    analysis.makeup_direction ?? "",
    analysis.fashion_direction ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const matched = new Set<string>();
  for (const tag of STYLE_TAGS) {
    if (tag.keywords.some((kw) => corpus.includes(kw))) {
      matched.add(tag.label);
    }
  }
  return matched;
}

export default function HairstyleAnalysisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri } = useAnalysis();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const HERO_H = Math.min(width * 0.88, 360);

  const heroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!analysis) {
      router.replace("/upload");
      return;
    }
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.quad),
      useNativeDriver: ND,
    }).start();
  }, [analysis]);

  const sec1Anim = useFadeSlideIn(100);
  const sec2Anim = useFadeSlideIn(200);
  const sec3Anim = useFadeSlideIn(300);
  const sec4Anim = useFadeSlideIn(400);
  const sec5Anim = useFadeSlideIn(500);

  if (!analysis) {
    return null;
  }

  const cardScores = HAIRSTYLE_CARDS.map((card) => ({
    card,
    score: computeStyleCompatibility(card, analysis),
  }));

  const matchingTags = deriveMatchingTags(analysis);

  const attributePills = [
    { label: analysis.face_shape, icon: "scan-outline" as const },
    { label: analysis.hair_type, icon: "cut-outline" as const },
    {
      label: (() => {
        const h = (analysis.hair_type ?? "").toLowerCase();
        if (h.includes("fine") || h.includes("thin")) return "Low Volume";
        if (h.includes("thick") || h.includes("coarse")) return "High Volume";
        if (h.includes("curly") || h.includes("wavy")) return "Natural Volume";
        return "Medium Volume";
      })(),
      icon: "layers-outline" as const,
    },
    {
      label: analysis.recommended_style_direction ?? analysis.style_archetype,
      icon: "sparkles-outline" as const,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [
            styles.backPill,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Hairstyle Analysis
        </Text>
        <View style={styles.backPill} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad }}
      >
        {/* ── Section 1: Hero ──────────────────────────────────────────────── */}
        <Animated.View
          style={[
            { opacity: heroAnim, transform: [{ scale: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] },
          ]}
        >
          <View
            style={[
              styles.heroWrapper,
              { height: HERO_H, backgroundColor: colors.secondary },
            ]}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={["#F5EDE3", "#EDE3D9"]}
                style={StyleSheet.absoluteFill}
              >
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="person" size={80} color={GOLD} />
                </View>
              </LinearGradient>
            )}
            <HairContourOverlay w={width} h={HERO_H} />
            <LinearGradient
              colors={["transparent", colors.background + "E0"]}
              style={styles.heroGradient}
              start={{ x: 0, y: 0.4 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.heroPills}>
              <View style={styles.heroSectionLabel}>
                <Ionicons name="cut-outline" size={11} color={GOLD} />
                <Text style={[styles.sectionLabelText, { color: colors.mutedForeground }]}>
                  HAIRSTYLE PROFILE
                </Text>
              </View>
              <View style={styles.pillRow}>
                {attributePills.map((pill, i) => (
                  <View
                    key={i}
                    style={[
                      styles.attrPill,
                      { backgroundColor: colors.card + "EE", borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name={pill.icon} size={11} color={GOLD} />
                    <Text
                      style={[styles.attrPillText, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {pill.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Section 2: Hairstyle Comparison Cards ────────────────────────── */}
        <Animated.View style={[styles.section, sec1Anim]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={16} color={GOLD} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Hairstyle Comparison
            </Text>
          </View>
          <View style={styles.hairstyleGrid}>
            {cardScores.map(({ card, score }) => (
              <HairstyleCard key={card.id} card={card} score={score} colors={colors} />
            ))}
          </View>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* ── Section 3: Style Compatibility ───────────────────────────────── */}
        <Animated.View style={[styles.section, sec2Anim]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={16} color={GOLD} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Style Compatibility
            </Text>
          </View>
          <View style={styles.compatTileList}>
            {COMPAT_TILES.map((tile) => (
              <CompatibilityTile
                key={tile.id}
                tile={tile}
                analysis={analysis}
                colors={colors}
              />
            ))}
          </View>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* ── Section 4: Hair Color Direction ──────────────────────────────── */}
        <Animated.View style={[styles.section, sec3Anim]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={16} color={GOLD} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Hair Color Direction
            </Text>
          </View>
          <View
            style={[
              styles.colorCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionLabelRow}>
              <Ionicons name="sunny-outline" size={11} color={GOLD} />
              <Text style={[styles.sectionLabelText, { color: colors.mutedForeground }]}>
                BASED ON YOUR UNDERTONE & CONTRAST
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />
            <View style={styles.swatchRow}>
              {HAIR_COLOR_SWATCHES.map((swatch) => {
                const compat = isColorCompatible(swatch, analysis);
                return (
                  <ColorSwatchChip
                    key={swatch.label}
                    swatch={swatch}
                    compat={compat}
                    colors={colors}
                  />
                );
              })}
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 16, marginBottom: 12 }]} />
            <View style={styles.undertoneRow}>
              <Text style={[styles.undertoneLabel, { color: colors.mutedForeground }]}>
                YOUR UNDERTONE
              </Text>
              <View
                style={[
                  styles.undertonePill,
                  { backgroundColor: GOLD + "18", borderColor: GOLD + "35" },
                ]}
              >
                <Text style={[styles.undertonePillText, { color: GOLD }]}>
                  {analysis.undertone}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* ── Section 5: Aesthetic Style Tags ──────────────────────────────── */}
        <Animated.View style={[styles.section, sec4Anim]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={16} color={GOLD} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Aesthetic Style Tags
            </Text>
          </View>
          <View
            style={[
              styles.tagsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.tagsWrap}>
              {STYLE_TAGS.slice(0, 7).map((tag) => {
                const isMatch = matchingTags.has(tag.label);
                return (
                  <View
                    key={tag.label}
                    style={[
                      styles.styleTag,
                      isMatch
                        ? { backgroundColor: GOLD, borderColor: GOLD }
                        : {
                            backgroundColor: "transparent",
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    {isMatch && (
                      <Ionicons name="sparkles" size={10} color="#fff" />
                    )}
                    <Text
                      style={[
                        styles.styleTagText,
                        { color: isMatch ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* ── Chat CTA ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, sec5Anim]}>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/chat");
            }}
            style={({ pressed }) => [
              styles.chatCta,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={["#F5EDE3", "#E8C4A0"]}
              style={styles.chatCtaIcon}
            >
              <Ionicons name="sparkles" size={18} color={GOLD} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatCtaTitle, { color: colors.foreground }]}>
                Ask Aura for hair advice
              </Text>
              <Text
                style={[styles.chatCtaSub, { color: colors.mutedForeground }]}
              >
                Your AI stylist knows your full profile
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const GRID_GAP = 10;
const CARD_COL_W = (width - 40 - GRID_GAP) / 2;

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  backPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  heroWrapper: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  heroPills: {
    position: "absolute",
    bottom: 18,
    left: 20,
    right: 20,
    gap: 10,
  },
  heroSectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  attrPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  attrPillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sectionLabelText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  hairstyleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  hairstyleCard: {
    width: CARD_COL_W,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    overflow: "hidden",
  },
  hairstyleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  hairstyleLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
  },
  compatBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compatBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  compatBarFill: {
    height: 4,
    borderRadius: 2,
  },
  compatPct: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    minWidth: 28,
    textAlign: "right",
  },
  bestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
  },
  bestBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  divider: { height: 1, marginHorizontal: 20 },
  compatTileList: { gap: 10 },
  compatTile: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  compatTileIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  compatTileLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  compatTileNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  compatTileBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  colorCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "space-between",
  },
  swatchChip: {
    alignItems: "center",
    gap: 7,
    width: (width - 40 - 18 * 4) / 3,
    minWidth: 64,
  },
  swatchCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  swatchCheck: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 14,
  },
  undertoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  undertoneLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  undertonePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  undertonePillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  tagsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  styleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  styleTagText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  chatCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  chatCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chatCtaTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  chatCtaSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
