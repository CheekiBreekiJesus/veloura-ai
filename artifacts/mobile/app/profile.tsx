import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ShareModal from "@/components/ShareModal";

import { useAnalysis } from "@/context/AnalysisContext";
import { getColorSeason, getSeasonProfile } from "@/constants/seasons";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

type Field = {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  gradient: [string, string];
};

function buildFields(
  analysis: NonNullable<ReturnType<typeof useAnalysis>["analysis"]>
): Field[] {
  const base: Field[] = [
    { label: "Face Shape", value: analysis.face_shape, icon: "scan-outline", gradient: ["#FDECD3", "#F5D5B0"] },
    { label: "Skin Tone", value: analysis.skin_tone, icon: "sunny-outline", gradient: ["#F5EDE3", "#EDE3D9"] },
    { label: "Undertone", value: analysis.undertone, icon: "color-filter-outline", gradient: ["#F0E4F5", "#DFC8EF"] },
    { label: "Eye Shape", value: analysis.eye_shape, icon: "eye-outline", gradient: ["#D9EEF5", "#B8DCEA"] },
    { label: "Lip Shape", value: analysis.lip_shape, icon: "happy-outline", gradient: ["#FDECD3", "#F5D5B0"] },
    { label: "Hair Type", value: analysis.hair_type, icon: "cut-outline", gradient: ["#D9F5E4", "#B8EAD0"] },
  ];
  if (analysis.jawline_definition) {
    base.push({ label: "Jawline", value: analysis.jawline_definition, icon: "ellipse-outline", gradient: ["#F5EDE3", "#EDE3D9"] });
  }
  if (analysis.cheekbone_prominence) {
    base.push({ label: "Cheekbones", value: analysis.cheekbone_prominence, icon: "triangle-outline", gradient: ["#FDF3E3", "#F5E0C0"] });
  }
  return base;
}

type Section = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  items: string[];
};

function buildSections(
  analysis: NonNullable<ReturnType<typeof useAnalysis>["analysis"]>
): Section[] {
  return [
    { title: "Beauty Recommendations", icon: "sparkles-outline", items: analysis.beauty_recommendations },
    { title: "Fashion Recommendations", icon: "shirt-outline", items: analysis.fashion_recommendations },
    { title: "Hairstyle Suggestions", icon: "cut-outline", items: analysis.hairstyle_suggestions },
    { title: "Glasses Suggestions", icon: "glasses-outline", items: analysis.glasses_suggestions },
  ];
}

function SkinBar({ level, colors }: { level: "none" | "mild" | "moderate" | "severe"; colors: ReturnType<typeof useColors> }) {
  const levels = ["none", "mild", "moderate", "severe"];
  const idx = levels.indexOf(level);
  const fills = [0, 1, 2, 3].map(i => i <= idx);
  const barColor = idx === 0 ? "#4CAF50" : idx === 1 ? "#FFC107" : idx === 2 ? "#FF9800" : "#F44336";
  return (
    <View style={{ flexDirection: "row", gap: 3, marginTop: 4 }}>
      {fills.map((filled, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 3,
            backgroundColor: filled ? barColor : colors.border,
          }}
        />
      ))}
    </View>
  );
}

function SymmetryRing({ score, colors }: { score: number; colors: ReturnType<typeof useColors> }) {
  const pct = Math.round(score * 100);
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View style={[styles.symmetryRing, { borderColor: colors.primary }]}>
        <Text style={[styles.symmetryPct, { color: colors.primary }]}>{pct}%</Text>
        <Text style={[styles.symmetryLabel, { color: colors.mutedForeground }]}>sym</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri, userName, clearAnalysis } = useAnalysis();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [shareVisible, setShareVisible] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const PHOTO_H = Math.min(width * 0.75, 300);

  const headerOpacity = scrollY.interpolate({
    inputRange: [PHOTO_H - 80, PHOTO_H - 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const photoScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  });

  const photoOpacity = scrollY.interpolate({
    inputRange: [0, PHOTO_H * 0.6],
    outputRange: [1, 0.5],
    extrapolate: "clamp",
  });

  if (!analysis) {
    return (
      <View style={[styles.emptyRoot, { backgroundColor: colors.background, paddingTop: topPad + 24 }]}>
        <Ionicons name="person-circle-outline" size={64} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No analysis yet</Text>
        <Pressable
          onPress={() => router.push("/upload")}
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Start Analysis</Text>
        </Pressable>
      </View>
    );
  }

  const fields = buildFields(analysis);
  const sections = buildSections(analysis);
  const season = getColorSeason(analysis.undertone, analysis.skin_tone);
  const seasonProfile = getSeasonProfile(season);

  const handleReset = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await clearAnalysis();
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Floating header */}
      <Animated.View
        style={[styles.floatingHeader, {
          paddingTop: topPad + 10,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          opacity: headerOpacity,
        }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.floatingTitle, { color: colors.foreground }]} numberOfLines={1}>
          {analysis.style_archetype}
        </Text>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/upload");
          }}
          style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.foreground} />
        </Pressable>
      </Animated.View>

      {/* Always-visible back button */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.absoluteBack, { top: topPad + 10, backgroundColor: "rgba(255,255,255,0.9)" }]}
      >
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
      </Pressable>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad }}
      >
        {/* Hero photo */}
        <Animated.View style={[styles.heroContainer, { height: PHOTO_H, transform: [{ scale: photoScale }], opacity: photoOpacity }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.heroPhoto} contentFit="cover" />
          ) : (
            <LinearGradient colors={["#F5EDE3", "#EDE3D9"]} style={styles.heroPhoto}>
              <Ionicons name="person" size={80} color={colors.mutedForeground} />
            </LinearGradient>
          )}
          <LinearGradient
            colors={["transparent", colors.background]}
            style={styles.heroOverlay}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.heroBottom}>
            <Text style={[styles.heroName, { color: colors.foreground }]}>
              {userName ? userName : "Your Profile"}
            </Text>
            <View style={[styles.archetypePill, { backgroundColor: colors.primary }]}>
              <Ionicons name="sparkles" size={13} color="#fff" />
              <Text style={styles.archetypePillText}>{analysis.style_archetype}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Aesthetic Archetypes ─────────────────────────────────────────── */}
        {analysis.aesthetic_archetypes && analysis.aesthetic_archetypes.length > 0 && (
          <View style={[styles.section, { marginTop: 4 }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="diamond-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Aesthetic Identity</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.pillWrap}>
                {analysis.aesthetic_archetypes.map((arch, i) => (
                  <View key={i} style={[styles.archPill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                    <Text style={[styles.archPillText, { color: colors.primary }]}>{arch}</Text>
                  </View>
                ))}
              </View>
              {analysis.makeup_direction && (
                <View style={[styles.dirRow, { borderTopColor: colors.border }]}>
                  <View style={[styles.dirItem, { borderRightColor: colors.border }]}>
                    <Text style={[styles.dirLabel, { color: colors.mutedForeground }]}>MAKEUP</Text>
                    <Text style={[styles.dirValue, { color: colors.foreground }]}>{analysis.makeup_direction}</Text>
                  </View>
                  {analysis.fashion_direction && (
                    <View style={styles.dirItem}>
                      <Text style={[styles.dirLabel, { color: colors.mutedForeground }]}>FASHION</Text>
                      <Text style={[styles.dirValue, { color: colors.foreground }]}>{analysis.fashion_direction}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Color Story ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Color Story</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 14 }]}>
            <View style={styles.swatchRow}>
              {analysis.color_palette.map((hex, i) => (
                <View key={i} style={styles.swatchItem}>
                  <View style={[styles.swatch, { backgroundColor: hex }]} />
                  <Text style={[styles.swatchHex, { color: colors.mutedForeground }]}>{hex.toUpperCase()}</Text>
                </View>
              ))}
            </View>
            {analysis.color_families && analysis.color_families.length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View>
                  <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>BEST COLOR FAMILIES</Text>
                  <View style={[styles.pillWrap, { marginTop: 8 }]}>
                    {analysis.color_families.map((fam, i) => (
                      <View key={i} style={[styles.tagPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <Text style={[styles.tagPillText, { color: colors.foreground }]}>{fam}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
            {analysis.contrast_level && (
              <View style={[styles.contrastRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>CONTRAST</Text>
                <View style={styles.contrastDots}>
                  {["low", "medium", "high"].map((lvl) => (
                    <View
                      key={lvl}
                      style={[
                        styles.contrastDot,
                        {
                          backgroundColor:
                            analysis.contrast_level === lvl ||
                            (lvl === "medium" && analysis.contrast_level === "high") ||
                            (lvl === "low" && (analysis.contrast_level === "medium" || analysis.contrast_level === "high"))
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                  <Text style={[styles.contrastText, { color: colors.foreground }]}>
                    {analysis.contrast_level.charAt(0).toUpperCase() + analysis.contrast_level.slice(1)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Color Season ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Color Season</Text>
          </View>
          <LinearGradient
            colors={seasonProfile.gradient}
            style={[styles.seasonCard, { borderColor: colors.border }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.seasonTop}>
              <Text style={styles.seasonEmoji}>{seasonProfile.emoji}</Text>
              <View style={styles.seasonMeta}>
                <Text style={[styles.seasonName, { color: colors.foreground }]}>{seasonProfile.season}</Text>
                <Text style={[styles.seasonSubtitle, { color: colors.mutedForeground }]}>{seasonProfile.subtitle}</Text>
              </View>
            </View>
            <Text style={[styles.seasonDesc, { color: colors.mutedForeground }]}>{seasonProfile.description}</Text>
            <View style={styles.seasonSwatches}>
              {seasonProfile.palette.map((hex, i) => (
                <View key={i} style={[styles.seasonSwatch, { backgroundColor: hex }]} />
              ))}
            </View>
            <View style={styles.seasonLists}>
              <View style={styles.seasonListCol}>
                <Text style={[styles.seasonListLabel, { color: colors.primary }]}>Wear</Text>
                {seasonProfile.bestColors.slice(0, 3).map((c, i) => (
                  <Text key={i} style={[styles.seasonListItem, { color: colors.foreground }]}>✓ {c}</Text>
                ))}
              </View>
              <View style={[styles.seasonDivider, { backgroundColor: colors.border }]} />
              <View style={styles.seasonListCol}>
                <Text style={[styles.seasonListLabel, { color: colors.mutedForeground }]}>Avoid</Text>
                {seasonProfile.avoidColors.slice(0, 3).map((c, i) => (
                  <Text key={i} style={[styles.seasonListItem, { color: colors.mutedForeground }]}>✗ {c}</Text>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Feature Analysis ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="scan-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Feature Analysis</Text>
          </View>
          <View style={styles.grid}>
            {fields.map((field, i) => (
              <LinearGradient
                key={i}
                colors={field.gradient}
                style={[styles.featureCard, { borderColor: colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={field.icon} size={20} color={colors.primary} />
                <Text style={[styles.featureLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                <Text style={[styles.featureValue, { color: colors.foreground }]}>{field.value}</Text>
              </LinearGradient>
            ))}
          </View>
          {/* Symmetry score */}
          {analysis.facial_symmetry_score !== undefined && (
            <View style={[styles.symmetryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SymmetryRing score={analysis.facial_symmetry_score} colors={colors} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureValue, { color: colors.foreground }]}>Facial Symmetry</Text>
                <Text style={[styles.featureLabel, { color: colors.mutedForeground }]}>
                  Estimated visual balance score
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Skin Health ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="water-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Health</Text>
            <Pressable
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/skin-analysis");
              }}
              style={({ pressed }) => [
                { marginLeft: "auto", opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: colors.primary + "15", borderWidth: 1, borderColor: colors.primary + "30" }]}>
                <Text style={[{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primary }]}>Full Report</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </View>
            </Pressable>
          </View>
          {analysis.skin_concerns && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 14 }]}>
              {analysis.skin_evenness && (
                <View style={styles.skinEvenRow}>
                  <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>SKIN EVENNESS</Text>
                  <View style={[styles.evenBadge, {
                    backgroundColor:
                      analysis.skin_evenness === "high" ? "#E8F5E9" :
                      analysis.skin_evenness === "medium" ? "#FFF8E1" : "#FBE9E7",
                  }]}>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: "Inter_600SemiBold",
                      color:
                        analysis.skin_evenness === "high" ? "#2E7D32" :
                        analysis.skin_evenness === "medium" ? "#F57F17" : "#BF360C",
                    }}>
                      {analysis.skin_evenness.charAt(0).toUpperCase() + analysis.skin_evenness.slice(1)}
                    </Text>
                  </View>
                </View>
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              {(["acne", "redness", "dryness"] as const).map((concern) => (
                <View key={concern} style={styles.skinConcernRow}>
                  <Text style={[styles.skinConcernLabel, { color: colors.foreground }]}>
                    {concern.charAt(0).toUpperCase() + concern.slice(1)}
                  </Text>
                  <View style={styles.skinConcernRight}>
                    <Text style={[styles.skinConcernVal, { color: colors.mutedForeground }]}>
                      {analysis.skin_concerns![concern]}
                    </Text>
                    <View style={{ width: 80 }}>
                      <SkinBar level={analysis.skin_concerns![concern]} colors={colors} />
                    </View>
                  </View>
                </View>
              ))}
              {analysis.skincare_focus && analysis.skincare_focus.length > 0 && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View>
                    <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>SKINCARE FOCUS AREAS</Text>
                    <View style={[styles.pillWrap, { marginTop: 8 }]}>
                      {analysis.skincare_focus.map((focus, i) => (
                        <View key={i} style={[styles.tagPill, { backgroundColor: "#E8F5FE", borderColor: "#BFD9F2" }]}>
                          <Text style={[styles.tagPillText, { color: "#1565C0" }]}>{focus}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── Accessories Guide ────────────────────────────────────────────── */}
        {(analysis.earring_styles || analysis.necklace_lengths) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="diamond-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Accessories Guide</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 14 }]}>
              {analysis.earring_styles && analysis.earring_styles.length > 0 && (
                <View>
                  <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>EARRING STYLES</Text>
                  <View style={[styles.pillWrap, { marginTop: 8 }]}>
                    {analysis.earring_styles.map((s, i) => (
                      <View key={i} style={[styles.tagPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <Text style={[styles.tagPillText, { color: colors.foreground }]}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {analysis.necklace_lengths && analysis.necklace_lengths.length > 0 && (
                <>
                  {analysis.earring_styles && analysis.earring_styles.length > 0 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                  <View>
                    <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>NECKLACE LENGTHS</Text>
                    <View style={[styles.pillWrap, { marginTop: 8 }]}>
                      {analysis.necklace_lengths.map((l, i) => (
                        <View key={i} style={[styles.tagPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                          <Text style={[styles.tagPillText, { color: colors.foreground }]}>{l}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* ── Recommendations ──────────────────────────────────────────────── */}
        {sections.map((sec, si) => (
          <View key={si} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={sec.icon} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{sec.title}</Text>
            </View>
            {sec.items.map((item, ii) => (
              <View key={ii} style={[styles.recRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.recIndex, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.recIndexText, { color: colors.primary }]}>{ii + 1}</Text>
                </View>
                <Text style={[styles.recText, { color: colors.foreground }]}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* ── Shopping Keywords ────────────────────────────────────────────── */}
        {analysis.shopping_keywords && analysis.shopping_keywords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shopping Keywords</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.keywordsHint, { color: colors.mutedForeground }]}>
                Use these tags when shopping online to find your perfect matches:
              </Text>
              <View style={[styles.pillWrap, { marginTop: 12 }]}>
                {analysis.shopping_keywords.map((kw, i) => (
                  <View key={i} style={[styles.kwPill, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
                    <Ionicons name="search-outline" size={11} color={colors.primary} />
                    <Text style={[styles.kwPillText, { color: colors.primary }]}>{kw}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <View style={[styles.section, { gap: 12 }]}>
          {/* Share button */}
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShareVisible(true);
            }}
            style={({ pressed }) => [
              styles.shareBtn,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="share-outline" size={20} color={colors.primary} />
            <Text style={[styles.shareBtnText, { color: colors.primary }]}>Share Style Profile</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/upload");
            }}
            style={({ pressed }) => [styles.analyzeBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primaryForeground} />
            <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>Re-analyze</Text>
          </Pressable>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [styles.resetBtn, { borderColor: colors.destructive, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.resetBtnText, { color: colors.destructive }]}>Clear profile & start over</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>

      {/* Share modal */}
      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        analysis={analysis}
        userName={userName}
        imageUri={imageUri}
      />
    </View>
  );
}

const GRID_GAP = 12;
const CARD_W = (width - 40 - GRID_GAP) / 2;

const styles = StyleSheet.create({
  root: { flex: 1 },
  floatingHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  floatingTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  absoluteBack: {
    position: "absolute", top: 60, left: 16, zIndex: 20,
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  heroContainer: { overflow: "hidden" },
  heroPhoto: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
  heroBottom: { position: "absolute", bottom: 16, left: 20, right: 20, gap: 8 },
  heroName: { fontSize: 26, fontFamily: "Inter_700Bold" },
  archetypePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  archetypePillText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  card: { borderRadius: 18, padding: 18, borderWidth: 1 },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  archPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  archPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dirRow: { flexDirection: "row", borderTopWidth: 1, marginTop: 4, paddingTop: 14, gap: 0 },
  dirItem: { flex: 1, paddingRight: 12, borderRightWidth: 1, gap: 3 },
  dirLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  dirValue: { fontSize: 14, fontFamily: "Inter_700Bold", textTransform: "capitalize" },
  divider: { height: 1 },
  miniLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  tagPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  tagPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  contrastRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 14 },
  contrastDots: { flexDirection: "row", alignItems: "center", gap: 6 },
  contrastDot: { width: 12, height: 12, borderRadius: 6 },
  contrastText: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginLeft: 4 },
  paletteCard: { borderRadius: 18, padding: 18, borderWidth: 1 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  swatchItem: { alignItems: "center", gap: 5 },
  swatch: { width: 42, height: 42, borderRadius: 21 },
  swatchHex: { fontSize: 9, fontFamily: "Inter_500Medium" },
  seasonCard: { borderRadius: 20, padding: 18, borderWidth: 1, gap: 14 },
  seasonTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  seasonEmoji: { fontSize: 32 },
  seasonMeta: { flex: 1 },
  seasonName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  seasonSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  seasonDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21 },
  seasonSwatches: { flexDirection: "row", gap: 8 },
  seasonSwatch: { flex: 1, height: 28, borderRadius: 8 },
  seasonLists: { flexDirection: "row", gap: 16 },
  seasonListCol: { flex: 1, gap: 6 },
  seasonDivider: { width: 1 },
  seasonListLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, marginBottom: 2 },
  seasonListItem: { fontSize: 13, fontFamily: "Inter_400Regular" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  featureCard: { width: CARD_W, padding: 16, borderRadius: 18, borderWidth: 1, gap: 6 },
  featureLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 4 },
  featureValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  symmetryRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginTop: 12, padding: 14, borderRadius: 18, borderWidth: 1,
  },
  symmetryRing: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 3,
    alignItems: "center", justifyContent: "center",
  },
  symmetryPct: { fontSize: 14, fontFamily: "Inter_700Bold" },
  symmetryLabel: { fontSize: 9, fontFamily: "Inter_500Medium" },
  skinEvenRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  evenBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  skinConcernRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skinConcernLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  skinConcernRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  skinConcernVal: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  keywordsHint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  kwPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  kwPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  recRow: {
    flexDirection: "row", alignItems: "flex-start", padding: 14,
    borderRadius: 14, borderWidth: 1, marginBottom: 8, gap: 12,
  },
  recIndex: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 1 },
  recIndexText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  recText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 18, borderWidth: 1,
  },
  shareBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  analyzeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 17, borderRadius: 18,
  },
  analyzeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  resetBtn: { paddingVertical: 14, alignItems: "center", borderRadius: 14, borderWidth: 1 },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyRoot: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
