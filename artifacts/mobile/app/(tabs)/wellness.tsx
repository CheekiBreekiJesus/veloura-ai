import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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
import {
  WELLNESS_ARTICLES,
  WELLNESS_CATEGORIES,
  type WellnessArticle,
  type WellnessCategory,
} from "@/data/wellness-content";

const ARCHETYPE_TAGS = ["romantic", "athletic", "bohemian", "minimalist", "classic"] as const;

function isRecommended(
  article: WellnessArticle,
  analysis: NonNullable<ReturnType<typeof useAnalysis>["analysis"]>
): boolean {
  const tags = article.skinConcernTags;

  if (analysis.skin_concerns?.acne !== "none" && tags.includes("acne")) return true;
  if (analysis.skin_concerns?.redness !== "none" && tags.includes("redness")) return true;
  if (analysis.skin_concerns?.dryness !== "none" && tags.includes("dryness")) return true;

  const ut = (analysis.undertone ?? "").toLowerCase();
  if (ut.includes("warm") && tags.includes("warm")) return true;
  if (ut.includes("cool") && tags.includes("cool")) return true;
  if (ut.includes("neutral") && tags.includes("neutral")) return true;

  const archetypeStr = (analysis.style_archetype ?? "").toLowerCase();
  const archetypeArr = (analysis.aesthetic_archetypes ?? []).map((a: string) => a.toLowerCase());
  const allArchetypes = [archetypeStr, ...archetypeArr];
  if (
    ARCHETYPE_TAGS.some(
      (tag) => tags.includes(tag) && allArchetypes.some((a) => a.includes(tag))
    )
  ) return true;

  return false;
}

const CATEGORY_ICONS: Record<WellnessCategory | "All", React.ComponentProps<typeof Ionicons>["name"]> = {
  All: "apps-outline",
  Skin: "water-outline",
  Nutrition: "nutrition-outline",
  Fitness: "body-outline",
  Mind: "moon-outline",
};

function ArticleCard({
  article,
  colors,
  onPress,
}: {
  article: WellnessArticle;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.articleCard, { opacity: pressed ? 0.9 : 1 }]}
    >
      <LinearGradient
        colors={article.gradientColors}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.catChip, { backgroundColor: "rgba(255,255,255,0.65)" }]}>
            <Ionicons
              name={CATEGORY_ICONS[article.category]}
              size={11}
              color="#6B4C35"
            />
            <Text style={styles.catChipText}>{article.category}</Text>
          </View>
          <View style={[styles.timeBadge, { backgroundColor: "rgba(255,255,255,0.65)" }]}>
            <Ionicons name="time-outline" size={11} color="#6B4C35" />
            <Text style={styles.timeText}>{article.readingMins} min read</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.cardIconWrap, { backgroundColor: "rgba(255,255,255,0.55)" }]}>
            <Ionicons
              name={article.icon as React.ComponentProps<typeof Ionicons>["name"]}
              size={28}
              color="#C4956A"
            />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {article.title}
            </Text>
            <Text style={styles.cardTeaser} numberOfLines={2}>
              {article.teaser}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.readMore}>Read article</Text>
          <Ionicons name="arrow-forward" size={14} color="#6B4C35" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function ArticleCardCompact({
  article,
  colors,
  onPress,
}: {
  article: WellnessArticle;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <LinearGradient
        colors={article.gradientColors}
        style={styles.compactIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons
          name={article.icon as React.ComponentProps<typeof Ionicons>["name"]}
          size={20}
          color="#C4956A"
        />
      </LinearGradient>
      <View style={styles.compactText}>
        <Text style={[styles.compactTitle, { color: colors.foreground }]} numberOfLines={2}>
          {article.title}
        </Text>
        <View style={styles.compactMeta}>
          <View style={[styles.compactCat, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.compactCatText, { color: colors.primary }]}>
              {article.category}
            </Text>
          </View>
          <Text style={[styles.compactTime, { color: colors.mutedForeground }]}>
            {article.readingMins} min
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function WellnessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();

  const [activeFilter, setActiveFilter] = useState<"All" | WellnessCategory>("All");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const recommendedArticles = useMemo(() => {
    if (!analysis) return [];
    return WELLNESS_ARTICLES.filter((a) => isRecommended(a, analysis)).slice(0, 6);
  }, [analysis]);

  const filteredArticles = useMemo(() => {
    if (activeFilter === "All") return WELLNESS_ARTICLES;
    return WELLNESS_ARTICLES.filter((a) => a.category === activeFilter);
  }, [activeFilter]);

  const featuredArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  const openArticle = async (article: WellnessArticle) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/article", params: { articleId: article.id } });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Index 0 — Header (scrolls away) */}
        <LinearGradient
          colors={["#D9EEF5", colors.background]}
          style={[styles.headerGrad, { paddingTop: topPad + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Wellness</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Beauty from within
          </Text>
        </LinearGradient>

        {/* Index 1 — Category Filter (STICKY) */}
        <View style={[styles.filterSticky, { backgroundColor: colors.background }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {(["All", ...WELLNESS_CATEGORIES] as const).map((cat) => (
              <Pressable
                key={cat}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setActiveFilter(cat);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: activeFilter === cat ? colors.primary : colors.secondary,
                    borderColor: activeFilter === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={CATEGORY_ICONS[cat]}
                size={13}
                color={activeFilter === cat ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.filterText,
                  { color: activeFilter === cat ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
          </ScrollView>
        </View>

        {/* Index 2 — Recommended for You (scrolls with content) */}
        {analysis && recommendedArticles.length > 0 && activeFilter === "All" && (
          <View style={styles.section}>
            <View style={[styles.recBanner, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "28" }]}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.recBannerText, { color: colors.primary }]}>
                Picked for you based on your style & skin profile
              </Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recommended for You
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recScroll}
            >
              {recommendedArticles.map((article) => (
                <Pressable
                  key={article.id}
                  onPress={() => openArticle(article)}
                  style={({ pressed }) => [
                    styles.recCard,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <LinearGradient
                    colors={article.gradientColors}
                    style={styles.recCardTop}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name={article.icon as React.ComponentProps<typeof Ionicons>["name"]}
                      size={28}
                      color="#C4956A"
                    />
                  </LinearGradient>
                  <View style={styles.recCardBody}>
                    <View style={[styles.recCatChip, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.recCatText, { color: colors.primary }]}>
                        {article.category}
                      </Text>
                    </View>
                    <Text style={[styles.recCardTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {article.title}
                    </Text>
                    <Text style={[styles.recCardTime, { color: colors.mutedForeground }]}>
                      {article.readingMins} min read
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured article */}
        {featuredArticle && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {activeFilter === "All" ? "Editor's Pick" : `${activeFilter} Spotlight`}
            </Text>
            <ArticleCard article={featuredArticle} colors={colors} onPress={() => openArticle(featuredArticle)} />
          </View>
        )}

        {/* Rest of articles */}
        {restArticles.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {activeFilter === "All" ? "All Articles" : `More ${activeFilter}`}
            </Text>
            {restArticles.map((article) => (
              <ArticleCardCompact
                key={article.id}
                article={article}
                colors={colors}
                onPress={() => openArticle(article)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },

  recBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  recBannerText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },

  recScroll: { gap: 12 },
  recCard: {
    width: 160,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  recCardTop: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  recCardBody: { padding: 12, gap: 6 },
  recCatChip: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  recCatText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  recCardTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  recCardTime: { fontSize: 11, fontFamily: "Inter_400Regular" },

  filterSticky: { paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "transparent" },
  filterScroll: { paddingHorizontal: 20, gap: 8, paddingVertical: 10 },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  articleCard: { borderRadius: 20, overflow: "hidden" },
  cardGradient: { padding: 20, gap: 16 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  catChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#6B4C35" },
  timeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  timeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#6B4C35" },
  cardBody: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  cardIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardText: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#2D1F14", lineHeight: 24 },
  cardTeaser: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B4C35", lineHeight: 20 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  readMore: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#6B4C35" },

  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  compactIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  compactText: { flex: 1, gap: 6 },
  compactTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  compactMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  compactCat: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  compactCatText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  compactTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
