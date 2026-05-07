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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const ND = Platform.OS !== "web";

type SeverityLevel = "none" | "mild" | "moderate" | "severe";

const SEVERITY_COLOR: Record<SeverityLevel, string> = {
  none: "#4CAF50",
  mild: "#FFC107",
  moderate: "#FF9800",
  severe: "#F44336",
};

const SEVERITY_BG: Record<SeverityLevel, string> = {
  none: "#E8F5E9",
  mild: "#FFF8E1",
  moderate: "#FFF3E0",
  severe: "#FFEBEE",
};

const SEVERITY_FILL: Record<SeverityLevel, number> = {
  none: 0.08,
  mild: 0.35,
  moderate: 0.65,
  severe: 0.9,
};

function useFadeSlideIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: ND,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: ND,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return { opacity, transform: [{ translateY }] };
}

function SkinZoneOverlay({ colors }: { colors: ReturnType<typeof useColors> }) {
  const zones: { label: string; top: `${number}%`; left: `${number}%`; color: string }[] = [
    { label: "T-Zone", top: "18%", left: "50%", color: "#C4956A" },
    { label: "Cheeks", top: "42%", left: "20%", color: "#8BA5C4" },
    { label: "Cheeks", top: "42%", left: "80%", color: "#8BA5C4" },
    { label: "Chin", top: "72%", left: "50%", color: "#A8C4A0" },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {zones.map((z, i) => (
        <View
          key={i}
          style={[
            szStyles.zoneLabel,
            {
              top: z.top,
              left: z.left,
              backgroundColor: z.color + "22",
              borderColor: z.color + "55",
              transform: [{ translateX: -32 }, { translateY: -12 }],
            },
          ]}
        >
          <View style={[szStyles.zoneDot, { backgroundColor: z.color }]} />
          <Text style={[szStyles.zoneLabelText, { color: z.color }]}>
            {z.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const szStyles = StyleSheet.create({
  zoneLabel: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  zoneDot: { width: 5, height: 5, borderRadius: 3 },
  zoneLabelText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
});

function ConcernCircle({
  label,
  level,
  icon,
  colors,
}: {
  label: string;
  level: SeverityLevel;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  colors: ReturnType<typeof useColors>;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  const fill = SEVERITY_FILL[level];
  const ringColor = SEVERITY_COLOR[level];
  const bgColor = SEVERITY_BG[level];
  const CIRCLE = 62;
  const BORDER = 4;

  return (
    <View style={ccStyles.wrap}>
      <View
        style={[
          ccStyles.circle,
          {
            width: CIRCLE,
            height: CIRCLE,
            borderRadius: CIRCLE / 2,
            backgroundColor: bgColor,
            borderWidth: BORDER,
            borderColor: colors.border,
          },
        ]}
      >
        <Animated.View
          style={[
            ccStyles.fillRing,
            {
              width: CIRCLE - BORDER * 2,
              height: CIRCLE - BORDER * 2,
              borderRadius: (CIRCLE - BORDER * 2) / 2,
              borderWidth: BORDER,
              borderColor: anim.interpolate({
                inputRange: [0, fill, 1],
                outputRange: [colors.border, ringColor, ringColor],
              }),
            },
          ]}
        />
        <Ionicons name={icon} size={18} color={ringColor} style={ccStyles.icon} />
      </View>
      <Text style={[ccStyles.label, { color: colors.foreground }]}>{label}</Text>
      <Text style={[ccStyles.level, { color: SEVERITY_COLOR[level] }]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Text>
    </View>
  );
}

const ccStyles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 6, width: 72 },
  circle: { alignItems: "center", justifyContent: "center", position: "relative" },
  fillRing: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  icon: { zIndex: 1 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  level: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center", textTransform: "capitalize" },
});

function UndertoneBar({
  undertone,
  colors,
}: {
  undertone: string;
  colors: ReturnType<typeof useColors>;
}) {
  const markerAnim = useRef(new Animated.Value(0)).current;

  const positionMap: Record<string, number> = {
    cool: 0.1,
    neutral: 0.5,
    warm: 0.9,
  };
  const targetPos = positionMap[undertone.toLowerCase()] ?? 0.5;
  const BAR_W = width - 80;

  useEffect(() => {
    Animated.timing(markerAnim, {
      toValue: targetPos,
      duration: 900,
      delay: 300,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: false,
    }).start();
  }, []);

  const markerLeft = markerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_W - 20],
  });

  return (
    <View style={ubStyles.wrap}>
      <View style={[ubStyles.bar, { width: BAR_W }]}>
        <LinearGradient
          colors={["#8BA5C4", "#B8C8B0", "#C4956A"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={ubStyles.gradient}
        />
        <Animated.View
          style={[
            ubStyles.marker,
            {
              left: markerLeft,
              borderColor: colors.card,
              backgroundColor: colors.foreground,
            },
          ]}
        />
      </View>
      <View style={ubStyles.labels}>
        <Text style={[ubStyles.labelText, { color: colors.mutedForeground }]}>Cool</Text>
        <Text style={[ubStyles.labelText, { color: colors.mutedForeground }]}>Neutral</Text>
        <Text style={[ubStyles.labelText, { color: colors.mutedForeground }]}>Warm</Text>
      </View>
      <View
        style={[
          ubStyles.badge,
          { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" },
        ]}
      >
        <Text style={[ubStyles.badgeText, { color: colors.primary }]}>
          {undertone.charAt(0).toUpperCase() + undertone.slice(1)} Undertone
        </Text>
      </View>
    </View>
  );
}

const ubStyles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12 },
  bar: { height: 14, borderRadius: 7, overflow: "visible", position: "relative" },
  gradient: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, borderRadius: 7 },
  marker: {
    position: "absolute",
    top: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  labels: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 4 },
  labelText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

const SKIN_TYPE_DATA: Record<
  string,
  { characteristics: [string, string]; gradient: [string, string]; accent: string }
> = {
  oily: {
    characteristics: ["Enlarged pores", "Shiny appearance"],
    gradient: ["#FFF8E1", "#FFFDE7"],
    accent: "#F9A825",
  },
  combination: {
    characteristics: ["Oily T-zone", "Normal or dry cheeks"],
    gradient: ["#E8F5E9", "#F1F8E9"],
    accent: "#66BB6A",
  },
  normal: {
    characteristics: ["Balanced moisture", "Fine pores"],
    gradient: ["#E3F2FD", "#E8EAF6"],
    accent: "#42A5F5",
  },
  dry: {
    characteristics: ["Tight feeling", "Flaky patches"],
    gradient: ["#FBE9E7", "#FFF3E0"],
    accent: "#FF7043",
  },
  sensitive: {
    characteristics: ["Easily irritated", "Prone to redness"],
    gradient: ["#FCE4EC", "#F3E5F5"],
    accent: "#EC407A",
  },
};

const SKIN_TYPES = ["oily", "combination", "normal", "dry", "sensitive"] as const;

function SkinTypeCard({
  type,
  isMatch,
  colors,
}: {
  type: string;
  isMatch: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const data = SKIN_TYPE_DATA[type] ?? {
    characteristics: ["—", "—"] as [string, string],
    gradient: [colors.card, colors.card] as [string, string],
    accent: colors.primary,
  };

  return (
    <LinearGradient
      colors={isMatch ? data.gradient : [colors.card, colors.card]}
      style={[
        stcStyles.card,
        {
          borderColor: isMatch ? data.accent : colors.border,
          borderWidth: isMatch ? 2 : 1,
        },
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[stcStyles.iconWrap, { backgroundColor: data.accent + "20" }]}>
        <Ionicons name="water-outline" size={18} color={data.accent} />
      </View>
      <Text style={[stcStyles.typeName, { color: colors.foreground }]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
      <Text style={[stcStyles.char, { color: colors.mutedForeground }]}>
        {data.characteristics[0]}
      </Text>
      <Text style={[stcStyles.char, { color: colors.mutedForeground }]}>
        {data.characteristics[1]}
      </Text>
      {isMatch && (
        <View style={[stcStyles.matchBadge, { backgroundColor: data.accent }]}>
          <Ionicons name="checkmark" size={10} color="#fff" />
          <Text style={stcStyles.matchText}>Best Match</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const stcStyles = StyleSheet.create({
  card: {
    width: 110,
    borderRadius: 16,
    padding: 12,
    gap: 5,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  typeName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  char: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 14 },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  matchText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

function RoutineStrip({
  skincareFocus,
  colors,
}: {
  skincareFocus: string[];
  colors: ReturnType<typeof useColors>;
}) {
  const FOCUS_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
    hydration: "water-outline",
    glow: "sunny-outline",
    texture: "layers-outline",
    "oil control": "flask-outline",
    brightening: "sparkles-outline",
    anti_aging: "time-outline",
    exfoliation: "refresh-outline",
    soothing: "leaf-outline",
    spf: "shield-outline",
    pores: "ellipse-outline",
  };

  const BASE_ROUTINE = [
    { label: "Cleanser", icon: "water-outline" as const, key: "cleanser" },
    { label: "Serum", icon: "flask-outline" as const, key: "serum" },
    { label: "Moisturiser", icon: "leaf-outline" as const, key: "moisturiser" },
    { label: "SPF", icon: "shield-outline" as const, key: "spf" },
  ];

  const focusSteps = skincareFocus.slice(0, 3).map((f) => ({
    label: f.charAt(0).toUpperCase() + f.slice(1),
    icon: FOCUS_ICONS[f.toLowerCase()] ?? ("sparkles-outline" as const),
    key: f,
  }));

  const allSteps = [...BASE_ROUTINE, ...focusSteps];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={rsStyles.scroll}
    >
      {allSteps.map((step, i) => (
        <React.Fragment key={step.key}>
          <View style={rsStyles.step}>
            <View style={[rsStyles.iconWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Ionicons name={step.icon} size={20} color={colors.primary} />
            </View>
            <Text style={[rsStyles.label, { color: colors.foreground }]}>{step.label}</Text>
          </View>
          {i < allSteps.length - 1 && (
            <View style={[rsStyles.arrow]}>
              <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
            </View>
          )}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const rsStyles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 4, alignItems: "center", paddingVertical: 4 },
  step: { alignItems: "center", gap: 6 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  label: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  arrow: { alignSelf: "center", paddingBottom: 14 },
});

export default function SkinAnalysisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri } = useAnalysis();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  const heroAnim = useFadeSlideIn(0);
  const concernAnim = useFadeSlideIn(120);
  const undertoneAnim = useFadeSlideIn(220);
  const typeAnim = useFadeSlideIn(320);
  const routineAnim = useFadeSlideIn(420);

  if (!analysis) {
    return (
      <View style={[emptyStyles.root, { backgroundColor: colors.background, paddingTop: topPad + 24 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[emptyStyles.backBtn, { backgroundColor: colors.secondary, top: topPad + 10, left: 20 }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Ionicons name="water-outline" size={64} color={colors.mutedForeground} />
        <Text style={[emptyStyles.title, { color: colors.foreground }]}>No analysis yet</Text>
        <Text style={[emptyStyles.sub, { color: colors.mutedForeground }]}>
          Complete your analysis first to unlock your skin report.
        </Text>
        <Pressable
          onPress={() => router.push("/upload")}
          style={[emptyStyles.btn, { backgroundColor: colors.primary }]}
        >
          <Text style={[emptyStyles.btnText, { color: colors.primaryForeground }]}>Start Analysis</Text>
        </Pressable>
      </View>
    );
  }

  const sc = analysis.skin_concerns;

  function evennessToSeverity(evenness?: string): SeverityLevel {
    if (evenness === "high") return "none";
    if (evenness === "medium") return "mild";
    if (evenness === "low") return "moderate";
    return "none";
  }

  const CONCERN_ROWS: {
    label: string;
    level: SeverityLevel;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }[] = [
    { label: "Redness", level: (sc?.redness ?? "none") as SeverityLevel, icon: "alert-circle-outline" },
    { label: "Pores", level: (sc?.pores ?? "none") as SeverityLevel, icon: "ellipse-outline" },
    { label: "Uneven Tone", level: evennessToSeverity(analysis.skin_evenness), icon: "color-filter-outline" },
    { label: "Texture", level: (sc?.texture ?? "none") as SeverityLevel, icon: "layers-outline" },
    { label: "Blemishes", level: (sc?.acne ?? "none") as SeverityLevel, icon: "medical-outline" },
    { label: "Dryness", level: (sc?.dryness ?? "none") as SeverityLevel, icon: "water-outline" },
  ];

  const PHOTO_H = Math.min(width * 0.8, 340);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        style={[styles.backBtn, { top: topPad + 10, backgroundColor: "rgba(255,255,255,0.92)" }]}
      >
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad }}
      >
        {/* ── Section 1: Hero Panel ─────────────────────────────────────────── */}
        <Animated.View style={heroAnim}>
          <View style={[styles.heroWrap, { height: PHOTO_H }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.heroPhoto} contentFit="cover" />
            ) : (
              <LinearGradient colors={["#F5EDE3", "#EDE3D9"]} style={styles.heroPhoto}>
                <Ionicons name="person" size={80} color={colors.mutedForeground} />
              </LinearGradient>
            )}
            <LinearGradient
              colors={["transparent", colors.background]}
              style={styles.heroGrad}
              start={{ x: 0, y: 0.4 }}
              end={{ x: 0, y: 1 }}
            />
            <SkinZoneOverlay colors={colors} />
            <View style={styles.heroTop}>
              <Text style={[styles.heroHeading, { color: colors.foreground }]}>Skin Analysis</Text>
            </View>
            <View style={styles.heroBottom}>
              {analysis.skin_type && (
                <View style={[styles.skinTypeBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "40" }]}>
                  <Ionicons name="water-outline" size={12} color={colors.primary} />
                  <Text style={[styles.skinTypeBadgeText, { color: colors.primary }]}>
                    {analysis.skin_type.charAt(0).toUpperCase() + analysis.skin_type.slice(1)} Skin
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Section 2: Skin Concerns ──────────────────────────────────────── */}
        {sc && (
          <Animated.View style={[styles.section, concernAnim]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Concerns</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.concernGrid}>
                {CONCERN_ROWS.map((row, i) => (
                  <ConcernCircle
                    key={i}
                    label={row.label}
                    level={row.level}
                    icon={row.icon}
                    colors={colors}
                  />
                ))}
              </View>
              {analysis.skin_evenness && (
                <View style={[styles.evenRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>SKIN EVENNESS</Text>
                  <View
                    style={[
                      styles.evenBadge,
                      {
                        backgroundColor:
                          analysis.skin_evenness === "high"
                            ? "#E8F5E9"
                            : analysis.skin_evenness === "medium"
                            ? "#FFF8E1"
                            : "#FBE9E7",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.evenBadgeText,
                        {
                          color:
                            analysis.skin_evenness === "high"
                              ? "#2E7D32"
                              : analysis.skin_evenness === "medium"
                              ? "#F57F17"
                              : "#BF360C",
                        },
                      ]}
                    >
                      {analysis.skin_evenness.charAt(0).toUpperCase() + analysis.skin_evenness.slice(1)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Section 3: Undertone Scale ────────────────────────────────────── */}
        <Animated.View style={[styles.section, undertoneAnim]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-filter-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Undertone Scale</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <UndertoneBar undertone={analysis.undertone} colors={colors} />
          </View>
        </Animated.View>

        {/* ── Section 4: Skin Type Comparison ──────────────────────────────── */}
        <Animated.View style={[styles.section, typeAnim]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Type Match</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeScroll}
          >
            {SKIN_TYPES.map((t) => (
              <SkinTypeCard
                key={t}
                type={t}
                isMatch={analysis.skin_type === t}
                colors={colors}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Section 5: Routine Strip ──────────────────────────────────────── */}
        {analysis.skincare_focus && analysis.skincare_focus.length > 0 && (
          <Animated.View style={[styles.section, routineAnim]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Routine</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingHorizontal: 0 }]}>
              <RoutineStrip skincareFocus={analysis.skincare_focus} colors={colors} />
              <View style={[styles.focusWrap, { borderTopColor: colors.border }]}>
                <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>FOCUS AREAS</Text>
                <View style={styles.focusPills}>
                  {analysis.skincare_focus.map((f, i) => (
                    <View key={i} style={[styles.focusPill, { backgroundColor: "#E8F5FE", borderColor: "#BFD9F2" }]}>
                      <Text style={[styles.focusPillText, { color: "#1565C0" }]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 32 },
  backBtn: { position: "absolute", width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  btn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: {
    position: "absolute",
    zIndex: 20,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heroWrap: { position: "relative", overflow: "hidden" },
  heroPhoto: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  heroGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 140 },
  heroTop: { position: "absolute", top: 60, left: 20, right: 20 },
  heroHeading: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  heroBottom: { position: "absolute", bottom: 20, left: 20 },
  skinTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  skinTypeBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  card: { borderRadius: 18, padding: 18, borderWidth: 1, gap: 14 },
  concernGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "space-around",
  },
  evenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 14,
  },
  miniLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  evenBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  evenBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  typeScroll: { paddingHorizontal: 20, gap: 10 },
  focusWrap: { borderTopWidth: 1, paddingTop: 14, paddingHorizontal: 18, paddingBottom: 4, gap: 8 },
  focusPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  focusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  focusPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
