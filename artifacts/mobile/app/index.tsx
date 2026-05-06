import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
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

const FEATURES = [
  {
    icon: "scan-outline" as const,
    label: "Face Shape",
    desc: "Oval, round, square & more",
  },
  {
    icon: "color-palette-outline" as const,
    label: "Color Palette",
    desc: "Your perfect color story",
  },
  {
    icon: "sparkles-outline" as const,
    label: "Style Archetype",
    desc: "Your unique aesthetic identity",
  },
  {
    icon: "shirt-outline" as const,
    label: "Fashion Guide",
    desc: "Outfits curated for you",
  },
];

export default function LandingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/upload");
  };

  const handleViewResults = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/dashboard");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 24, paddingBottom: botPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Ionicons name="sparkles" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.mutedForeground }]}>
            AI IDENTITY STYLIST
          </Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Discover what{"\n"}truly suits you.
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            Upload a selfie and get a personalized beauty and fashion profile
            crafted by AI.
          </Text>
        </View>

        <LinearGradient
          colors={["#F5EDE3", "#FAF2EA"]}
          style={[styles.previewCard, { borderColor: colors.border }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.previewRow}>
            {["#C4956A", "#E8C4A0", "#F5EDE3", "#9B8B7E", "#4A3728"].map(
              (color, i) => (
                <View
                  key={i}
                  style={[styles.colorDot, { backgroundColor: color }]}
                />
              )
            )}
          </View>
          <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
            Sample color palette
          </Text>
          <View style={styles.archetypeRow}>
            <View
              style={[
                styles.archetypeTag,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.archetypeText, { color: colors.primary }]}>
                Warm Undertone
              </Text>
            </View>
            <View
              style={[
                styles.archetypeTag,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.archetypeText, { color: colors.primary }]}>
                Oval Face
              </Text>
            </View>
            <View
              style={[
                styles.archetypeTag,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.archetypeText, { color: colors.primary }]}>
                Soft Classic
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={[
                styles.featureItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Ionicons name={f.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text
                  style={[styles.featureLabel, { color: colors.foreground }]}
                >
                  {f.label}
                </Text>
                <Text
                  style={[styles.featureDesc, { color: colors.mutedForeground }]}
                >
                  {f.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
            Start Style Analysis
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={colors.primaryForeground}
          />
        </Pressable>

        {analysis && (
          <Pressable
            onPress={handleViewResults}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.secondaryText, { color: colors.primary }]}>
              View My Profile
            </Text>
          </Pressable>
        )}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Your photo is analyzed securely and never stored.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  appName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2.5,
  },
  heroSection: { marginBottom: 28 },
  heroTitle: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    lineHeight: 44,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  previewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
  },
  previewRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  previewLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  archetypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  archetypeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  archetypeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  features: { gap: 12, marginBottom: 32 },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1 },
  featureLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  featureDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 18,
    gap: 10,
    marginBottom: 14,
  },
  ctaText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 24,
  },
  secondaryText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  disclaimer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
