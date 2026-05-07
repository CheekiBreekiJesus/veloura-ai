import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { type AnalysisResult } from "@/context/AnalysisContext";
import { getColorSeason, getSeasonProfile } from "@/constants/seasons";

const CARD_W = 360;
const CARD_H = 560;

const PRIMARY = "#C4956A";
const BG = "#FAF8F5";
const DARK = "#2D1F14";
const MUTED = "#9B8B7E";
const BORDER = "#E5D9CF";

type Props = {
  analysis: AnalysisResult;
  userName: string | null;
};

const ShareProfileCard = forwardRef<View, Props>(({ analysis, userName }, ref) => {
  const season = getColorSeason(analysis.undertone, analysis.skin_tone);
  const seasonProfile = getSeasonProfile(season);

  const traits = [
    { label: "Face", value: analysis.face_shape },
    { label: "Undertone", value: analysis.undertone },
    { label: "Skin", value: analysis.skin_tone },
  ];

  const palette = analysis.color_palette.slice(0, 6);

  const displayName = userName?.trim() || "Style Profile";
  const archetypes = analysis.aesthetic_archetypes?.slice(0, 3) ?? [];

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      {/* Season gradient banner */}
      <LinearGradient
        colors={seasonProfile.gradient}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.bannerEmoji}>{seasonProfile.emoji}</Text>
        <View style={styles.bannerText}>
          <Text style={styles.bannerSeason}>{seasonProfile.season}</Text>
          <Text style={styles.bannerSubtitle}>{seasonProfile.subtitle}</Text>
        </View>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>VELOURA</Text>
        </View>
      </LinearGradient>

      {/* Main content area */}
      <View style={styles.body}>
        {/* Name + archetype */}
        <View style={styles.identityBlock}>
          <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
          <View style={styles.archetypePill}>
            <Text style={styles.archetypeText}>{analysis.style_archetype}</Text>
          </View>
        </View>

        {/* Aesthetic archetypes */}
        {archetypes.length > 0 && (
          <View style={styles.archRow}>
            {archetypes.map((a, i) => (
              <View key={i} style={styles.archTag}>
                <Text style={styles.archTagText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Palette */}
        <View style={styles.paletteSection}>
          <Text style={styles.sectionLabel}>COLOR PALETTE</Text>
          <View style={styles.swatches}>
            {palette.map((hex, i) => (
              <View key={i} style={styles.swatchWrap}>
                <View style={[styles.swatch, { backgroundColor: hex }]} />
                <Text style={styles.swatchHex}>{hex.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Key traits */}
        <Text style={styles.sectionLabel}>KEY TRAITS</Text>
        <View style={styles.traitsGrid}>
          {traits.map((t, i) => (
            <View key={i} style={styles.traitCard}>
              <Text style={styles.traitLabel}>{t.label.toUpperCase()}</Text>
              <Text style={styles.traitValue} numberOfLines={2}>{t.value}</Text>
            </View>
          ))}
        </View>

        {/* Season palette strip */}
        <View style={styles.seasonStrip}>
          {seasonProfile.palette.slice(0, 5).map((hex, i) => (
            <View key={i} style={[styles.seasonSwatch, { backgroundColor: hex }]} />
          ))}
        </View>

        {/* Description quote */}
        <Text style={styles.description} numberOfLines={3}>
          {seasonProfile.description}
        </Text>
      </View>

      {/* Footer */}
      <LinearGradient
        colors={[BG, "#F0E8DF"]}
        style={styles.footer}
      >
        <Text style={styles.footerBrand}>✦ Veloura</Text>
        <Text style={styles.footerSub}>AI Identity Stylist</Text>
      </LinearGradient>
    </View>
  );
});

ShareProfileCard.displayName = "ShareProfileCard";

export default ShareProfileCard;

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: BG,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  banner: {
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  bannerEmoji: { fontSize: 40 },
  bannerText: { flex: 1 },
  bannerSeason: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: DARK,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    marginTop: 2,
  },
  brandBadge: {
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  brandText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: PRIMARY,
    letterSpacing: 1.5,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 0,
    gap: 14,
  },
  identityBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  nameText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: DARK,
    flexShrink: 1,
  },
  archetypePill: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  archetypeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 0.2,
  },
  archRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: -4,
  },
  archTag: {
    backgroundColor: PRIMARY + "18",
    borderWidth: 1,
    borderColor: PRIMARY + "35",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  archTagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: PRIMARY,
  },
  paletteSection: { gap: 10 },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: MUTED,
    letterSpacing: 1.5,
  },
  swatches: {
    flexDirection: "row",
    gap: 8,
  },
  swatchWrap: { alignItems: "center", gap: 4 },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
  },
  swatchHex: {
    fontSize: 7,
    fontFamily: "Inter_500Medium",
    color: MUTED,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 0,
  },
  traitsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  traitCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 4,
  },
  traitLabel: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: MUTED,
    letterSpacing: 1,
  },
  traitValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: DARK,
    lineHeight: 18,
  },
  seasonStrip: {
    flexDirection: "row",
    gap: 6,
    marginTop: -2,
  },
  seasonSwatch: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  description: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    lineHeight: 18,
    flexShrink: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerBrand: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: PRIMARY,
    letterSpacing: 0.5,
  },
  footerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: MUTED,
  },
});
