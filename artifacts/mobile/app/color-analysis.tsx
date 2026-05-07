import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import BackButton from "@/components/BackButton";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";
import {
  deriveClothingTones,
  deriveColorSwatches,
  deriveSeasonLabel,
} from "@/utils/colorAnalysis";

function ToneRow({
  tones,
  colors,
  imageUri,
}: {
  tones: ReturnType<typeof deriveClothingTones>;
  colors: ReturnType<typeof useColors>;
  imageUri: string | null;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toneScroll}>
      {tones.map((tone) => (
        <View
          key={tone.label}
          style={[
            styles.toneCard,
            {
              borderColor: colors.border,
              opacity: tone.compatibility === "avoid" ? 0.68 : 1,
              shadowColor: tone.compatibility === "best" ? tone.hex : "#000",
              shadowOpacity: tone.compatibility === "best" ? 0.2 : 0,
              shadowRadius: tone.compatibility === "best" ? 18 : 0,
              shadowOffset: { width: 0, height: 8 },
              elevation: tone.compatibility === "best" ? 6 : 0,
            },
          ]}
        >
          <View style={[styles.tonePreview, { backgroundColor: colors.card }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.tonePortrait} contentFit="cover" />
            ) : (
              <View style={[styles.tonePortrait, { backgroundColor: colors.secondary }]} />
            )}
            <View style={[styles.toneOverlay, { backgroundColor: tone.hex, opacity: tone.compatibility === "best" ? 0.34 : tone.compatibility === "neutral" ? 0.24 : 0.16 }]} />
            <View style={[styles.toneOverlay, { backgroundColor: tone.compatibility === "best" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.04)" }]} />
            <View
              style={[
                styles.toneOutline,
                tone.compatibility === "best" && { borderColor: tone.hex, shadowColor: tone.hex, shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
              ]}
            />
            {tone.compatibility === "best" && (
              <View style={styles.bestBadge}>
                <Ionicons name="sparkles" size={11} color="#fff" />
                <Text style={styles.bestBadgeText}>Best Match</Text>
              </View>
            )}
          </View>
          <Text style={[styles.toneLabel, { color: colors.foreground }]}>{tone.label}</Text>
          <Text style={[styles.toneMeta, { color: colors.mutedForeground }]}>{tone.compatibility}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function ColorAnalysisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri } = useAnalysis();
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;

  const topPad = Math.max(insets.top, 16);
  const bottomPad = Math.max(insets.bottom, 20);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  if (!analysis) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={styles.lockedState}>
          <Ionicons name="color-palette-outline" size={54} color={colors.mutedForeground} />
          <Text style={[styles.lockedTitle, { color: colors.foreground }]}>Personal Color Analysis</Text>
          <Text style={[styles.lockedBody, { color: colors.mutedForeground }]}>Run a selfie analysis first to unlock your full color identity report.</Text>
          <Pressable onPress={() => router.push("/upload")} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Start Analysis</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const season = deriveSeasonLabel(analysis.undertone, analysis.contrast_level);
  const swatches = deriveColorSwatches(analysis);
  const tones = deriveClothingTones(analysis);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad + 24 }} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <BackButton />
        <Text style={[styles.topTitle, { color: colors.foreground }]}>Personal Color Analysis</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fade, transform: [{ translateY: lift }] }]}>
        <View style={styles.heroImageWrap}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.heroImage} contentFit="cover" /> : <View style={[styles.heroImage, { backgroundColor: colors.secondary }]} />}
          <LinearGradient colors={["transparent", "rgba(250,248,245,0.96)"]} style={styles.heroFade} />
        </View>
        <View style={styles.heroMeta}>
          <View style={[styles.seasonBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.seasonBadgeText}>{season}</Text>
          </View>
          <View style={styles.pillRow}>
            <View style={[styles.infoPill, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.infoPillText, { color: colors.foreground }]}>Undertone · {analysis.undertone}</Text>
            </View>
            <View style={[styles.infoPill, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.infoPillText, { color: colors.foreground }]}>Contrast · {analysis.contrast_level ?? "medium"}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Best Color Palette</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchScroll}>
          {swatches.map((group) => (
            <View key={group.title} style={[styles.swatchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.swatchTitle, { color: colors.foreground }]}>{group.title}</Text>
              <View style={styles.swatchRow}>
                {group.swatches.map((swatch) => (
                  <View key={swatch.label} style={styles.swatchItem}>
                    <View style={[styles.swatchDot, { backgroundColor: swatch.hex }]} />
                    <Text style={[styles.swatchLabel, { color: colors.mutedForeground }]}>{swatch.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Clothing Color Comparison</Text>
        <ToneRow tones={tones} colors={colors} imageUri={imageUri} />
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Color Harmony Insights</Text>
        <View style={styles.insightGrid}>
          {[
            { icon: "water-outline", title: "Skin Harmony", value: analysis.skin_evenness ?? "Balanced" },
            { icon: "eye-outline", title: "Eye Enhancement", value: analysis.eye_shape },
            { icon: "contrast-outline", title: "Contrast Balance", value: analysis.contrast_level ?? "Medium" },
            { icon: "color-filter-outline", title: "Undertone Compatibility", value: analysis.undertone },
          ].map((item) => (
            <View key={item.title} style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={item.icon as React.ComponentProps<typeof Ionicons>["name"]} size={18} color={colors.primary} />
              <Text style={[styles.insightTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.insightValue, { color: colors.mutedForeground }]} numberOfLines={2}>{item.value}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Style Direction</Text>
        <View style={styles.tagWrap}>
          {[
            ...(analysis.color_families ?? []),
            ...(analysis.aesthetic_archetypes ?? []),
            analysis.makeup_direction,
            analysis.fashion_direction,
          ]
            .filter((v): v is string => Boolean(v))
            .slice(0, 10)
            .map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[styles.tagText, { color: colors.foreground }]}>{tag}</Text>
              </View>
            ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, marginBottom: 18 },
  topTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center", flex: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroCard: { marginHorizontal: 18, borderRadius: 28, borderWidth: 1, overflow: "hidden" },
  heroImageWrap: { height: 300 },
  heroImage: { width: "100%", height: "100%" },
  heroFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 140 },
  heroMeta: { padding: 18, gap: 12 },
  seasonBadge: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  seasonBadgeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  infoPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginHorizontal: 18, marginBottom: 12 },
  swatchScroll: { paddingHorizontal: 18, gap: 12 },
  swatchCard: { width: 188, borderRadius: 22, borderWidth: 1, padding: 14 },
  swatchTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 12 },
  swatchRow: { gap: 12 },
  swatchItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  swatchDot: { width: 28, height: 28, borderRadius: 14 },
  swatchLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  toneScroll: { paddingHorizontal: 18, gap: 12 },
  toneCard: { width: 132, borderRadius: 22, borderWidth: 1, padding: 12, backgroundColor: "#fff" },
  tonePreview: { height: 150, borderRadius: 18, overflow: "hidden", justifyContent: "flex-start", padding: 10 },
  tonePortrait: { ...StyleSheet.absoluteFillObject },
  toneOverlay: { ...StyleSheet.absoluteFillObject },
  toneOutline: { ...StyleSheet.absoluteFillObject, borderRadius: 18, borderWidth: 1.5 },
  bestBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: "rgba(196,149,106,0.95)", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
  bestBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  toneLabel: { marginTop: 10, fontSize: 13, fontFamily: "Inter_700Bold" },
  toneMeta: { marginTop: 2, fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  insightGrid: { marginHorizontal: 18, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  insightCard: { width: "48%", borderRadius: 20, borderWidth: 1, padding: 14, gap: 6 },
  insightTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  insightValue: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  tagWrap: { marginHorizontal: 18, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  lockedState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 },
  lockedTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  lockedBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  primaryBtn: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});