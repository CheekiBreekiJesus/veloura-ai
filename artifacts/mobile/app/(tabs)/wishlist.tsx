import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

type WishItem = {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  saved: boolean;
};

function buildWishlistFromAnalysis(
  analysis: NonNullable<ReturnType<typeof useAnalysis>["analysis"]>
): WishItem[] {
  const items: WishItem[] = [];
  analysis.beauty_recommendations.slice(0, 2).forEach((r, i) => {
    items.push({
      id: `beauty-${i}`,
      title: r,
      category: "Beauty",
      icon: "sparkles-outline",
      saved: true,
    });
  });
  analysis.hairstyle_suggestions.slice(0, 1).forEach((r, i) => {
    items.push({
      id: `hair-${i}`,
      title: r,
      category: "Hairstyle",
      icon: "cut-outline",
      saved: true,
    });
  });
  analysis.fashion_recommendations.slice(0, 2).forEach((r, i) => {
    items.push({
      id: `fashion-${i}`,
      title: r,
      category: "Fashion",
      icon: "shirt-outline",
      saved: true,
    });
  });
  analysis.glasses_suggestions.slice(0, 1).forEach((r, i) => {
    items.push({
      id: `glasses-${i}`,
      title: r,
      category: "Eyewear",
      icon: "glasses-outline",
      saved: true,
    });
  });
  return items;
}

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const baseItems = analysis ? buildWishlistFromAnalysis(analysis) : [];

  const toggleSave = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isSaved = (id: string) => !savedIds.has(id);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Wishlist
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {baseItems.filter((i) => isSaved(i.id)).length} saved items
          </Text>
        </View>

        {analysis ? (
          <View style={styles.content}>
            {/* Style Summary card */}
            <View style={styles.sectionPad}>
              <LinearGradient
                colors={["#F5EDE3", "#EDE3D9"]}
                style={[styles.summaryCard, { borderColor: colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                      Your Archetype
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                      {analysis.style_archetype}
                    </Text>
                  </View>
                  <View style={styles.miniPalette}>
                    {analysis.color_palette.slice(0, 4).map((hex, i) => (
                      <View
                        key={i}
                        style={[styles.miniDot, { backgroundColor: hex }]}
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.summaryHint, { color: colors.mutedForeground }]}>
                  {analysis.face_shape} face · {analysis.undertone} undertone
                </Text>
              </LinearGradient>
            </View>

            {/* Saved items */}
            <View style={styles.sectionPad}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Saved Recommendations
              </Text>
              {baseItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.wishItem,
                    {
                      backgroundColor: isSaved(item.id)
                        ? colors.card
                        : colors.muted + "40",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[styles.wishIcon, { backgroundColor: colors.secondary }]}
                  >
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.wishInfo}>
                    <View
                      style={[
                        styles.catBadge,
                        { backgroundColor: colors.primary + "18" },
                      ]}
                    >
                      <Text
                        style={[styles.catBadgeText, { color: colors.primary }]}
                      >
                        {item.category}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.wishTitle,
                        {
                          color: isSaved(item.id)
                            ? colors.foreground
                            : colors.mutedForeground,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => toggleSave(item.id)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Ionicons
                      name={isSaved(item.id) ? "heart" : "heart-outline"}
                      size={22}
                      color={isSaved(item.id) ? "#D45F5F" : colors.mutedForeground}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your wishlist is empty
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Complete a style analysis to get personalized recommendations to save
            </Text>
            <Pressable
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/upload");
              }}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.emptyBtnText, { color: colors.primaryForeground }]}
              >
                Start Analysis
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  content: {},
  sectionPad: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  summaryCard: { borderRadius: 20, padding: 18, borderWidth: 1 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  summaryValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  miniPalette: { flexDirection: "row", gap: 6 },
  miniDot: { width: 24, height: 24, borderRadius: 12 },
  summaryHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  wishItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  wishIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  wishInfo: { flex: 1, gap: 4 },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  wishTitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  emptyState: { alignItems: "center", padding: 48, gap: 14 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
