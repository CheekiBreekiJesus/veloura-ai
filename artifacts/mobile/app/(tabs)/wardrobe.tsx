import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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

const OUTFIT_GRADIENTS: [string, string][] = [
  ["#FDECD3", "#F5D5B0"],
  ["#F0E4F5", "#DFC8EF"],
  ["#D9EEF5", "#B8DCEA"],
  ["#D9F5E4", "#B8EAD0"],
  ["#F5F0D9", "#EADCB8"],
];

export default function WardrobeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const [activeFilter, setActiveFilter] = useState("All");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const filters = ["All", "Casual", "Formal", "Evening", "Weekend"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Your Wardrobe
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Style guide based on your profile
          </Text>
        </View>

        {/* Style archetype banner */}
        {analysis && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <LinearGradient
              colors={["#C4956A", "#E8C4A0"]}
              style={styles.archetypeBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View>
                <Text style={styles.archetypeLabel}>Your Style Archetype</Text>
                <Text style={styles.archetypeValue}>
                  {analysis.style_archetype}
                </Text>
              </View>
              <Ionicons name="sparkles" size={32} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </View>
        )}

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((f) => (
            <Pressable
              key={f}
              onPress={async () => {
                await Haptics.selectionAsync();
                setActiveFilter(f);
              }}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeFilter === f ? colors.primary : colors.secondary,
                  borderColor:
                    activeFilter === f ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === f
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Fashion Recommendations */}
        {analysis ? (
          <View style={styles.sectionPad}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Fashion Recommendations
            </Text>
            {analysis.fashion_recommendations.map((rec, i) => (
              <OutfitCard
                key={i}
                index={i}
                text={rec}
                gradient={OUTFIT_GRADIENTS[i % OUTFIT_GRADIENTS.length]}
                colors={colors}
              />
            ))}

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, marginTop: 12 },
              ]}
            >
              Color Palette for Outfits
            </Text>
            <View
              style={[
                styles.paletteCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.paletteSwatches}>
                {analysis.color_palette.map((hex, i) => (
                  <View key={i} style={styles.swatchItem}>
                    <View
                      style={[styles.swatch, { backgroundColor: hex }]}
                    />
                    <Text
                      style={[styles.swatchHex, { color: colors.mutedForeground }]}
                    >
                      {hex}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.paletteHint, { color: colors.mutedForeground }]}>
                Wear these colors to complement your{" "}
                {analysis.undertone.toLowerCase()} undertone
              </Text>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, marginTop: 12 },
              ]}
            >
              Glasses Suggestions
            </Text>
            {analysis.glasses_suggestions.map((g, i) => (
              <View
                key={i}
                style={[
                  styles.simpleCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons name="glasses-outline" size={20} color={colors.primary} />
                <Text style={[styles.simpleText, { color: colors.foreground }]}>
                  {g}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState colors={colors} />
        )}
      </ScrollView>
    </View>
  );
}

function OutfitCard({
  index,
  text,
  gradient,
  colors,
}: {
  index: number;
  text: string;
  gradient: [string, string];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <LinearGradient
      colors={gradient}
      style={[styles.outfitCard, { borderColor: colors.border }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.outfitContent}>
        <View
          style={[
            styles.outfitNum,
            { backgroundColor: "rgba(255,255,255,0.7)" },
          ]}
        >
          <Text style={[styles.outfitNumText, { color: colors.primary }]}>
            {index + 1}
          </Text>
        </View>
        <Text style={[styles.outfitText, { color: colors.foreground }]}>
          {text}
        </Text>
      </View>
      <View
        style={[
          styles.outfitIcon,
          { backgroundColor: "rgba(255,255,255,0.6)" },
        ]}
      >
        <Ionicons name="shirt-outline" size={22} color={colors.primary} />
      </View>
    </LinearGradient>
  );
}

function EmptyState({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="shirt-outline" size={56} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No style profile yet
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
        Upload a selfie to get personalized fashion recommendations
      </Text>
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/upload");
        }}
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
          Start Analysis
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  archetypeBanner: {
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  archetypeLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  archetypeValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  filterScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionPad: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  outfitCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  outfitContent: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  outfitNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  outfitNumText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  outfitText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  outfitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  paletteCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  paletteSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  swatchItem: { alignItems: "center", gap: 4 },
  swatch: { width: 38, height: 38, borderRadius: 19 },
  swatchHex: { fontSize: 9, fontFamily: "Inter_400Regular" },
  paletteHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  simpleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  simpleText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  emptyState: { alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
