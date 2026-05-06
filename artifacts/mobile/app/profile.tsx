import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
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

import { useAnalysis } from "@/context/AnalysisContext";
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
  return [
    {
      label: "Face Shape",
      value: analysis.face_shape,
      icon: "scan-outline",
      gradient: ["#FDECD3", "#F5D5B0"],
    },
    {
      label: "Skin Tone",
      value: analysis.skin_tone,
      icon: "sunny-outline",
      gradient: ["#F5EDE3", "#EDE3D9"],
    },
    {
      label: "Undertone",
      value: analysis.undertone,
      icon: "color-filter-outline",
      gradient: ["#F0E4F5", "#DFC8EF"],
    },
    {
      label: "Eye Shape",
      value: analysis.eye_shape,
      icon: "eye-outline",
      gradient: ["#D9EEF5", "#B8DCEA"],
    },
    {
      label: "Lip Shape",
      value: analysis.lip_shape,
      icon: "happy-outline",
      gradient: ["#FDECD3", "#F5D5B0"],
    },
    {
      label: "Hair Type",
      value: analysis.hair_type,
      icon: "cut-outline",
      gradient: ["#D9F5E4", "#B8EAD0"],
    },
  ];
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
    {
      title: "Beauty Recommendations",
      icon: "sparkles-outline",
      items: analysis.beauty_recommendations,
    },
    {
      title: "Fashion Recommendations",
      icon: "shirt-outline",
      items: analysis.fashion_recommendations,
    },
    {
      title: "Hairstyle Suggestions",
      icon: "cut-outline",
      items: analysis.hairstyle_suggestions,
    },
    {
      title: "Glasses Suggestions",
      icon: "glasses-outline",
      items: analysis.glasses_suggestions,
    },
  ];
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri, userName, clearAnalysis } = useAnalysis();
  const scrollY = useRef(new Animated.Value(0)).current;

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
      <View
        style={[
          styles.emptyRoot,
          { backgroundColor: colors.background, paddingTop: topPad + 24 },
        ]}
      >
        <Ionicons name="person-circle-outline" size={64} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No analysis yet
        </Text>
        <Pressable
          onPress={() => router.push("/upload")}
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
            Start Analysis
          </Text>
        </Pressable>
      </View>
    );
  }

  const fields = buildFields(analysis);
  const sections = buildSections(analysis);

  const handleReset = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await clearAnalysis();
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Floating header that fades in on scroll */}
      <Animated.View
        style={[
          styles.floatingHeader,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            opacity: headerOpacity,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text
          style={[styles.floatingTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {analysis.style_archetype}
        </Text>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/upload");
          }}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.foreground} />
        </Pressable>
      </Animated.View>

      {/* Always-visible back button */}
      <Pressable
        onPress={() => router.back()}
        style={[
          styles.absoluteBack,
          { top: topPad + 10, backgroundColor: "rgba(255,255,255,0.9)" },
        ]}
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
        <Animated.View
          style={[
            styles.heroContainer,
            { height: PHOTO_H, transform: [{ scale: photoScale }], opacity: photoOpacity },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.heroPhoto}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={["#F5EDE3", "#EDE3D9"]}
              style={styles.heroPhoto}
            >
              <Ionicons name="person" size={80} color={colors.mutedForeground} />
            </LinearGradient>
          )}
          {/* Gradient overlay */}
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
            <View
              style={[
                styles.archetypePill,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="sparkles" size={13} color="#fff" />
              <Text style={styles.archetypePillText}>
                {analysis.style_archetype}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Color palette */}
        <View style={[styles.section, { marginTop: 4 }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Your Color Story
            </Text>
          </View>
          <View
            style={[
              styles.paletteCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.swatchRow}>
              {analysis.color_palette.map((hex, i) => (
                <View key={i} style={styles.swatchItem}>
                  <View style={[styles.swatch, { backgroundColor: hex }]} />
                  <Text style={[styles.swatchHex, { color: colors.mutedForeground }]}>
                    {hex.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Feature grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="scan-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Feature Analysis
            </Text>
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
                <Text style={[styles.featureLabel, { color: colors.mutedForeground }]}>
                  {field.label}
                </Text>
                <Text style={[styles.featureValue, { color: colors.foreground }]}>
                  {field.value}
                </Text>
              </LinearGradient>
            ))}
          </View>
        </View>

        {/* Recommendations sections */}
        {sections.map((sec, si) => (
          <View key={si} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={sec.icon} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {sec.title}
              </Text>
            </View>
            {sec.items.map((item, ii) => (
              <View
                key={ii}
                style={[
                  styles.recRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.recIndex,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text style={[styles.recIndexText, { color: colors.primary }]}>
                    {ii + 1}
                  </Text>
                </View>
                <Text
                  style={[styles.recText, { color: colors.foreground }]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Re-analyze + Reset */}
        <View style={[styles.section, { gap: 12 }]}>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/upload");
            }}
            style={({ pressed }) => [
              styles.analyzeBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primaryForeground} />
            <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>
              Re-analyze
            </Text>
          </Pressable>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.resetBtn,
              { borderColor: colors.destructive, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.resetBtnText, { color: colors.destructive }]}>
              Clear profile & start over
            </Text>
          </Pressable>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const GRID_GAP = 12;
const CARD_W = (width - 40 - GRID_GAP) / 2;

const styles = StyleSheet.create({
  root: { flex: 1 },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  floatingTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  absoluteBack: {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContainer: { overflow: "hidden" },
  heroPhoto: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroBottom: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    gap: 8,
  },
  heroName: { fontSize: 26, fontFamily: "Inter_700Bold" },
  archetypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  archetypePillText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  paletteCard: { borderRadius: 18, padding: 18, borderWidth: 1 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  swatchItem: { alignItems: "center", gap: 5 },
  swatch: { width: 42, height: 42, borderRadius: 21 },
  swatchHex: { fontSize: 9, fontFamily: "Inter_500Medium" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  featureCard: {
    width: CARD_W,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  featureLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 4 },
  featureValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  recRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  recIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  recIndexText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  recText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 18,
  },
  analyzeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  resetBtn: { paddingVertical: 14, alignItems: "center", borderRadius: 14, borderWidth: 1 },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyRoot: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
