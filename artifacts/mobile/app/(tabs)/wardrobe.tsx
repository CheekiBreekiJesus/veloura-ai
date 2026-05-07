import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import {
  useWardrobe,
  type ClothingCategory,
  type FeedbackValue,
  type WardrobeItem,
} from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const ITEM_GAP = 12;
const ITEM_WIDTH = (width - 40 - ITEM_GAP) / 2;
const ITEM_HEIGHT = ITEM_WIDTH * 1.3;

const OUTFIT_GRADIENTS: [string, string][] = [
  ["#FDECD3", "#F5D5B0"],
  ["#F0E4F5", "#DFC8EF"],
  ["#D9EEF5", "#B8DCEA"],
  ["#D9F5E4", "#B8EAD0"],
  ["#F5F0D9", "#EADCB8"],
];

const OUTFIT_TEXT = "#2D1F14";
const OUTFIT_TEXT_DIM = "#6B4C35";

type StyleCategory = "Casual" | "Formal" | "Evening" | "Weekend";
type SortOption = "recent" | "score";

const FILTER_KEYWORDS: Record<StyleCategory, string[]> = {
  Casual: ["casual", "everyday", "relaxed", "street", "jeans", "denim", "comfortable", "comfy", "basics", "simple", "effortless"],
  Formal: ["formal", "business", "professional", "suit", "blazer", "work", "office", "structured", "tailored", "corporate", "polished"],
  Evening: ["evening", "night", "cocktail", "party", "gown", "dinner", "elegant", "soirée", "occasion", "date", "glamour", "glam"],
  Weekend: ["weekend", "leisure", "activewear", "sport", "athletic", "outdoor", "brunch", "holiday", "travel", "adventure"],
};

const CLOTHING_CATEGORIES: ClothingCategory[] = [
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories",
];

function classifyRec(text: string): StyleCategory[] {
  const lower = text.toLowerCase();
  const matched: StyleCategory[] = [];
  for (const [cat, keywords] of Object.entries(FILTER_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) matched.push(cat as StyleCategory);
  }
  return matched.length > 0 ? matched : ["Casual"];
}

function scoreColor(score: number): string {
  if (score >= 85) return "#4CAF50";
  if (score >= 70) return "#8BC34A";
  if (score >= 55) return "#FF9800";
  if (score >= 40) return "#FF5722";
  return "#F44336";
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Good Match";
  if (score >= 55) return "Moderate Match";
  if (score >= 40) return "Weak Match";
  return "Poor Match";
}

function categoryIcon(cat: ClothingCategory): React.ComponentProps<typeof Ionicons>["name"] {
  switch (cat) {
    case "Tops": return "shirt-outline";
    case "Bottoms": return "file-tray-outline";
    case "Dresses": return "sparkles-outline";
    case "Outerwear": return "cloudy-outline";
    case "Shoes": return "footsteps-outline";
    case "Accessories": return "watch-outline";
  }
}

export default function WardrobeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const { wardrobeItems, feedback, setFeedback, removeItem } = useWardrobe();

  const [section, setSection] = useState<"closet" | "picks">("closet");
  const [activeFilter, setActiveFilter] = useState("All");
  const [closetFilter, setClosetFilter] = useState<ClothingCategory | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const filters = ["All", "Casual", "Formal", "Evening", "Weekend"];

  const filteredRecs = analysis
    ? analysis.fashion_recommendations.filter((rec) => {
        if (activeFilter === "All") return true;
        return classifyRec(rec).includes(activeFilter as StyleCategory);
      })
    : [];

  const displayedItems = useMemo(() => {
    let items = [...wardrobeItems];
    if (closetFilter !== "All") {
      items = items.filter((i) => i.category === closetFilter);
    }
    if (sortBy === "score") {
      items.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    }
    return items;
  }, [wardrobeItems, closetFilter, sortBy]);

  const avgScore = useMemo(() => {
    if (wardrobeItems.length === 0) return null;
    return Math.round(
      wardrobeItems.reduce((s, i) => s + i.compatibilityScore, 0) / wardrobeItems.length
    );
  }, [wardrobeItems]);

  const wardrobeColors = useMemo(() => {
    const unique = [...new Set(wardrobeItems.map((i) => i.dominantColor).filter(Boolean))];
    return unique.slice(0, 8);
  }, [wardrobeItems]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ClothingCategory, number>> = {};
    for (const item of wardrobeItems) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [wardrobeItems]);

  const handleRemoveItem = (item: WardrobeItem) => {
    Alert.alert(
      "Remove Item",
      `Remove "${item.name}" from your closet?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await removeItem(item.id);
          },
        },
      ]
    );
  };

  const handleFeedback = async (key: string, value: FeedbackValue) => {
    await Haptics.selectionAsync();
    if (feedback[key] === value) {
      await setFeedback(key, null);
    } else {
      await setFeedback(key, value);
    }
  };

  const handleFindSimilar = async (item: WardrobeItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = encodeURIComponent(`${item.name} ${item.category}`);
    await WebBrowser.openBrowserAsync(`https://www.amazon.com/s?k=${q}`, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: "#FAF8F5",
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Wardrobe
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {section === "closet" ? "Your uploaded clothing" : "AI style guide for your profile"}
          </Text>
        </View>

        {/* Section toggle */}
        <View style={styles.sectionToggle}>
          {(["closet", "picks"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={async () => {
                await Haptics.selectionAsync();
                setSection(s);
              }}
              style={[
                styles.sectionBtn,
                {
                  backgroundColor: section === s ? colors.primary : colors.secondary,
                  borderColor: section === s ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={s === "closet" ? "shirt-outline" : "sparkles-outline"}
                size={15}
                color={section === s ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.sectionBtnText,
                  { color: section === s ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {s === "closet" ? "My Closet" : "AI Picks"}
              </Text>
              {s === "closet" && wardrobeItems.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: section === "closet" ? "rgba(255,255,255,0.25)" : colors.primary + "22" }]}>
                  <Text style={[styles.countText, { color: section === "closet" ? colors.primaryForeground : colors.primary }]}>
                    {wardrobeItems.length}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* ── MY CLOSET ── */}
        {section === "closet" && (
          <View style={styles.sectionPad}>
            {/* Closet header row */}
            <View style={styles.closetHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  My Closet
                </Text>
                {wardrobeItems.length > 0 && (
                  <Text style={[styles.closetSubtitle, { color: colors.mutedForeground }]}>
                    {wardrobeItems.length} item{wardrobeItems.length !== 1 ? "s" : ""}
                    {avgScore !== null ? ` · avg score ${avgScore}` : ""}
                  </Text>
                )}
              </View>
              <View style={styles.closetHeaderRight}>
                {wardrobeItems.length > 1 && (
                  <Pressable
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      setSortBy((prev) => prev === "recent" ? "score" : "recent");
                    }}
                    style={[styles.sortBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Ionicons
                      name={sortBy === "score" ? "star-outline" : "time-outline"}
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={[styles.sortBtnText, { color: colors.primary }]}>
                      {sortBy === "score" ? "By Score" : "Recent"}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/add-item");
                  }}
                  style={({ pressed }) => [
                    styles.addBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="add" size={18} color={colors.primaryForeground} />
                  <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
                    Add
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Wardrobe stats panel */}
            {wardrobeItems.length > 0 && (
              <StatsPanel
                avgScore={avgScore}
                wardrobeColors={wardrobeColors}
                categoryCounts={categoryCounts}
                total={wardrobeItems.length}
                colors={colors}
              />
            )}

            {wardrobeItems.length === 0 ? (
              <View style={[styles.closetEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.closetEmptyIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="shirt-outline" size={36} color={colors.primary} />
                </View>
                <Text style={[styles.closetEmptyTitle, { color: colors.foreground }]}>
                  Your closet is empty
                </Text>
                <Text style={[styles.closetEmptyDesc, { color: colors.mutedForeground }]}>
                  Upload photos of your clothes and get AI-powered compatibility scores based on your style profile.
                </Text>
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/add-item");
                  }}
                  style={({ pressed }) => [
                    styles.closetEmptyBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.closetEmptyBtnText}>Add Your First Item</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Category filter */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {(["All", ...CLOTHING_CATEGORIES] as const).map((cat) => {
                    const count = cat === "All" ? wardrobeItems.length : (categoryCounts[cat] ?? 0);
                    const active = closetFilter === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={async () => {
                          await Haptics.selectionAsync();
                          setClosetFilter(cat);
                        }}
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: active ? colors.primary : colors.secondary,
                            borderColor: active ? colors.primary : colors.border,
                            opacity: count === 0 ? 0.45 : 1,
                          },
                        ]}
                      >
                        {cat !== "All" && (
                          <Ionicons
                            name={categoryIcon(cat as ClothingCategory)}
                            size={12}
                            color={active ? colors.primaryForeground : colors.mutedForeground}
                          />
                        )}
                        <Text style={[styles.categoryPillText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                          {cat}
                        </Text>
                        {count > 0 && (
                          <View style={[styles.categoryCount, { backgroundColor: active ? "rgba(255,255,255,0.28)" : colors.primary + "20" }]}>
                            <Text style={[styles.categoryCountText, { color: active ? colors.primaryForeground : colors.primary }]}>
                              {count}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {displayedItems.length === 0 ? (
                  <View style={[styles.noResults, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Ionicons name="shirt-outline" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.noResultsTitle, { color: colors.foreground }]}>
                      No {closetFilter} items yet
                    </Text>
                    <Pressable
                      onPress={() => setClosetFilter("All")}
                      style={[styles.noResultsBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.noResultsBtnText, { color: colors.primaryForeground }]}>Show All</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.itemGrid}>
                    {displayedItems.map((item) => (
                      <ClosetItemCard
                        key={item.id}
                        item={item}
                        colors={colors}
                        onPress={() => setSelectedItem(item)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── AI PICKS ── */}
        {section === "picks" && (
          <>
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
                    <Text style={styles.archetypeValue}>{analysis.style_archetype}</Text>
                  </View>
                  <Ionicons name="sparkles" size={32} color="rgba(255,255,255,0.5)" />
                </LinearGradient>
              </View>
            )}

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
                      backgroundColor: activeFilter === f ? colors.primary : colors.secondary,
                      borderColor: activeFilter === f ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.filterText, { color: activeFilter === f ? colors.primaryForeground : colors.foreground }]}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {analysis ? (
              <View style={styles.sectionPad}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {activeFilter === "All" ? "Fashion Recommendations" : `${activeFilter} Style`}
                  </Text>
                  {activeFilter !== "All" && filteredRecs.length > 0 && (
                    <View style={[styles.filterBadge, { backgroundColor: colors.primary + "18" }]}>
                      <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
                        {filteredRecs.length}
                      </Text>
                    </View>
                  )}
                </View>

                {filteredRecs.length === 0 ? (
                  <View style={[styles.noResults, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Ionicons name="shirt-outline" size={32} color={colors.mutedForeground} />
                    <Text style={[styles.noResultsTitle, { color: colors.foreground }]}>
                      No {activeFilter} recommendations
                    </Text>
                    <Pressable onPress={() => setActiveFilter("All")} style={[styles.noResultsBtn, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.noResultsBtnText, { color: colors.primaryForeground }]}>Show All</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredRecs.map((rec, i) => {
                    const cats = classifyRec(rec);
                    const fb = feedback[rec];
                    return (
                      <OutfitCard
                        key={i}
                        index={i}
                        text={rec}
                        categories={cats}
                        gradient={OUTFIT_GRADIENTS[i % OUTFIT_GRADIENTS.length]}
                        colors={colors}
                        activeFilter={activeFilter}
                        currentFeedback={fb}
                        onFeedback={(val) => handleFeedback(rec, val)}
                      />
                    );
                  })
                )}

                {activeFilter === "All" && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 12 }]}>
                      Color Palette for Outfits
                    </Text>
                    <View style={[styles.paletteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.paletteSwatches}>
                        {analysis.color_palette.map((hex, i) => (
                          <View key={i} style={styles.swatchItem}>
                            <View style={[styles.swatch, { backgroundColor: hex }]} />
                            <Text style={[styles.swatchHex, { color: colors.mutedForeground }]}>{hex}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={[styles.paletteHint, { color: colors.mutedForeground }]}>
                        Wear these colors to complement your {analysis.undertone.toLowerCase()} undertone
                      </Text>
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 12 }]}>
                      Glasses Suggestions
                    </Text>
                    {analysis.glasses_suggestions.map((g, i) => (
                      <View key={i} style={[styles.simpleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="glasses-outline" size={20} color={colors.primary} />
                        <Text style={[styles.simpleText, { color: colors.foreground }]}>{g}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            ) : (
              <EmptyState colors={colors} />
            )}
          </>
        )}
      </ScrollView>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        colors={colors}
        onClose={() => setSelectedItem(null)}
        onRemove={(item) => {
          setSelectedItem(null);
          handleRemoveItem(item);
        }}
        onFindSimilar={(item) => {
          void handleFindSimilar(item);
        }}
      />
    </View>
  );
}

function StatsPanel({
  avgScore,
  wardrobeColors,
  categoryCounts,
  total,
  colors,
}: {
  avgScore: number | null;
  wardrobeColors: string[];
  categoryCounts: Partial<Record<ClothingCategory, number>>;
  total: number;
  colors: ReturnType<typeof useColors>;
}) {
  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 3);

  return (
    <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.statsRow}>
        {/* Total items */}
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{total}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Items</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

        {/* Avg score */}
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: avgScore !== null ? scoreColor(avgScore) : colors.foreground }]}>
            {avgScore ?? "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Score</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

        {/* Color story */}
        <View style={styles.statItem}>
          <View style={styles.colorDots}>
            {wardrobeColors.slice(0, 5).map((c, i) => (
              <View
                key={i}
                style={[
                  styles.colorDot,
                  { backgroundColor: c, marginLeft: i > 0 ? -6 : 0, zIndex: 5 - i },
                ]}
              />
            ))}
            {wardrobeColors.length === 0 && (
              <Text style={[styles.statNum, { color: colors.mutedForeground }]}>—</Text>
            )}
          </View>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Palette</Text>
        </View>
      </View>

      {/* Category breakdown */}
      {topCategories.length > 0 && (
        <View style={[styles.categoryBreakdown, { borderTopColor: colors.border }]}>
          {topCategories.map(([cat, count]) => (
            <View key={cat} style={styles.breakdownItem}>
              <Ionicons
                name={categoryIcon(cat as ClothingCategory)}
                size={13}
                color={colors.primary}
              />
              <Text style={[styles.breakdownCat, { color: colors.foreground }]}>{cat}</Text>
              <Text style={[styles.breakdownCount, { color: colors.mutedForeground }]}>
                {count}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ItemDetailModal({
  item,
  colors,
  onClose,
  onRemove,
  onFindSimilar,
}: {
  item: WardrobeItem | null;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
  onRemove: (item: WardrobeItem) => void;
  onFindSimilar: (item: WardrobeItem) => void;
}) {
  const insets = useSafeAreaInsets();
  if (!item) return null;

  const sc = item.compatibilityScore;
  const sColor = scoreColor(sc);
  const sLabel = scoreLabel(sc);

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        {/* Photo hero */}
        <View style={styles.modalHero}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.modalImage} contentFit="cover" />
          ) : (
            <View style={[styles.modalImage, styles.modalImagePlaceholder, { backgroundColor: colors.secondary }]}>
              <Ionicons name="shirt-outline" size={56} color={colors.mutedForeground} />
            </View>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent"]}
            style={styles.modalImageTop}
          >
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.modalCloseBtn,
                { backgroundColor: "rgba(0,0,0,0.45)", opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </LinearGradient>

          {/* Score badge on photo */}
          <View style={[styles.modalScoreBadge, { backgroundColor: sColor + "ee" }]}>
            <Text style={styles.modalScoreBadgeText}>{sc}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Name + category + color */}
          <View style={styles.modalNameRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalName, { color: colors.foreground }]} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.modalMetaRow}>
                <View style={[styles.modalCatChip, { backgroundColor: colors.secondary }]}>
                  <Ionicons name={categoryIcon(item.category)} size={11} color={colors.primary} />
                  <Text style={[styles.modalCatText, { color: colors.primary }]}>
                    {item.category}
                  </Text>
                </View>
                {item.dominantColor && (
                  <View style={styles.modalColorRow}>
                    <View style={[styles.modalColorSwatch, { backgroundColor: item.dominantColor }]} />
                    <Text style={[styles.modalColorHex, { color: colors.mutedForeground }]}>
                      {item.dominantColor}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Compatibility score bar */}
          <View style={[styles.modalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalScoreHeader}>
              <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                Compatibility
              </Text>
              <Text style={[styles.modalScoreNum, { color: sColor }]}>{sc}/100</Text>
            </View>
            <View style={[styles.scoreTrack, { backgroundColor: colors.secondary }]}>
              <View
                style={[styles.scoreBar, { width: `${sc}%`, backgroundColor: sColor }]}
              />
            </View>
            <View style={styles.modalScoreLabelRow}>
              <View style={[styles.modalScoreLabelChip, { backgroundColor: sColor + "20" }]}>
                <Text style={[styles.modalScoreLabelText, { color: sColor }]}>{sLabel}</Text>
              </View>
              <Text style={[styles.modalScoreHint, { color: colors.mutedForeground }]}>
                with your style profile
              </Text>
            </View>
          </View>

          {/* AI notes */}
          {item.compatibilityNotes.length > 0 && (
            <View style={[styles.modalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalNotesHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                  Aura's Assessment
                </Text>
              </View>
              <Text style={[styles.modalNotes, { color: colors.foreground }]}>
                {item.compatibilityNotes}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.modalActions}>
            <Pressable
              onPress={() => onFindSimilar(item)}
              style={({ pressed }) => [
                styles.modalActionBtn,
                { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="search-outline" size={18} color={colors.primary} />
              <Text style={[styles.modalActionText, { color: colors.foreground }]}>
                Find Similar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove(item)}
              style={({ pressed }) => [
                styles.modalActionBtn,
                { backgroundColor: "#FFF0F0", borderColor: "#FFCDD2", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
              <Text style={[styles.modalActionText, { color: "#F44336" }]}>
                Remove
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ClosetItemCard({
  item,
  colors,
  onPress,
}: {
  item: WardrobeItem;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const score = item.compatibilityScore;
  const sColor = scoreColor(score);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.itemImage} contentFit="cover" />
      ) : (
        <View style={[styles.itemImage, styles.itemImagePlaceholder, { backgroundColor: colors.secondary }]}>
          <Ionicons name="shirt-outline" size={32} color={colors.mutedForeground} />
        </View>
      )}

      {/* Score badge top-right */}
      <View style={[styles.scoreBadge, { backgroundColor: sColor + "ee" }]}>
        <Text style={styles.scoreBadgeText}>{score}</Text>
      </View>

      {/* Bottom overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        style={styles.itemOverlay}
      >
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.itemFooter}>
          <View style={[styles.catChip, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.catChipText}>{item.category}</Text>
          </View>
          <View style={styles.tapHint}>
            <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function OutfitCard({
  index,
  text,
  categories,
  gradient,
  colors,
  activeFilter,
  currentFeedback,
  onFeedback,
}: {
  index: number;
  text: string;
  categories: StyleCategory[];
  gradient: [string, string];
  colors: ReturnType<typeof useColors>;
  activeFilter: string;
  currentFeedback: FeedbackValue | undefined;
  onFeedback: (val: FeedbackValue) => void;
}) {
  const OUTFIT_ICONS = [
    "shirt-outline",
    "bag-outline",
    "watch-outline",
    "umbrella-outline",
    "glasses-outline",
  ] as const;
  const icon = OUTFIT_ICONS[index % OUTFIT_ICONS.length];

  return (
    <LinearGradient
      colors={gradient}
      style={styles.outfitCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.outfitContent}>
        <View style={[styles.outfitNum, { backgroundColor: "rgba(255,255,255,0.75)" }]}>
          <Text style={[styles.outfitNumText, { color: OUTFIT_TEXT_DIM }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.outfitText, { color: OUTFIT_TEXT }]}>{text}</Text>
          {activeFilter === "All" && (
            <View style={styles.catTags}>
              {categories.map((cat) => (
                <View key={cat} style={[styles.catTag, { backgroundColor: "rgba(255,255,255,0.65)" }]}>
                  <Text style={[styles.catTagText, { color: colors.primary }]}>{cat}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      <View style={[styles.outfitIcon, { backgroundColor: "rgba(255,255,255,0.65)" }]}>
        <Ionicons name={icon} size={22} color={OUTFIT_TEXT_DIM} />
      </View>

      {/* Feedback row */}
      <View style={styles.feedbackRow}>
        <Pressable
          onPress={() => onFeedback("liked")}
          style={[
            styles.feedbackBtn,
            {
              backgroundColor: currentFeedback === "liked" ? "#4CAF5033" : "rgba(255,255,255,0.55)",
              borderColor: currentFeedback === "liked" ? "#4CAF50" : "transparent",
            },
          ]}
        >
          <Ionicons
            name={currentFeedback === "liked" ? "thumbs-up" : "thumbs-up-outline"}
            size={14}
            color={currentFeedback === "liked" ? "#4CAF50" : OUTFIT_TEXT_DIM}
          />
          <Text style={[styles.feedbackLabel, { color: currentFeedback === "liked" ? "#4CAF50" : OUTFIT_TEXT_DIM }]}>
            Like
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onFeedback("disliked")}
          style={[
            styles.feedbackBtn,
            {
              backgroundColor: currentFeedback === "disliked" ? "#F4433633" : "rgba(255,255,255,0.55)",
              borderColor: currentFeedback === "disliked" ? "#F44336" : "transparent",
            },
          ]}
        >
          <Ionicons
            name={currentFeedback === "disliked" ? "thumbs-down" : "thumbs-down-outline"}
            size={14}
            color={currentFeedback === "disliked" ? "#F44336" : OUTFIT_TEXT_DIM}
          />
          <Text style={[styles.feedbackLabel, { color: currentFeedback === "disliked" ? "#F44336" : OUTFIT_TEXT_DIM }]}>
            Not me
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function EmptyState({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="shirt-outline" size={56} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No style profile yet</Text>
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
        <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Start Analysis</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },

  sectionToggle: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  sectionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  sectionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  countBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  countText: { fontSize: 11, fontFamily: "Inter_700Bold" },

  sectionPad: { paddingHorizontal: 20 },
  closetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  closetSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  closetHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },

  sortBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth,
  },
  sortBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  statsCard: {
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16, overflow: "hidden",
  },
  statsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statDivider: { width: StyleSheet.hairlineWidth, height: 36 },
  colorDots: { flexDirection: "row", alignItems: "center", height: 26 },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#fff" },

  categoryBreakdown: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 16,
  },
  breakdownItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  breakdownCat: { fontSize: 12, fontFamily: "Inter_500Medium" },
  breakdownCount: { fontSize: 12, fontFamily: "Inter_400Regular" },

  categoryScroll: { gap: 8, paddingBottom: 14 },
  categoryPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  categoryPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  categoryCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  categoryCountText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  closetEmpty: {
    alignItems: "center", padding: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, gap: 12, marginBottom: 16,
  },
  closetEmptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  closetEmptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  closetEmptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  closetEmptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  closetEmptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },

  itemGrid: { flexDirection: "row", flexWrap: "wrap", gap: ITEM_GAP, marginBottom: 16 },
  itemCard: { width: ITEM_WIDTH, height: ITEM_HEIGHT, borderRadius: 18, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  itemImage: { width: "100%", height: "100%", position: "absolute" },
  itemImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  scoreBadge: { position: "absolute", top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  scoreBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  itemOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 12, paddingTop: 24, paddingBottom: 12 },
  itemName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff", marginBottom: 6 },
  itemFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.9)" },
  tapHint: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },

  archetypeBanner: { borderRadius: 18, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  archetypeLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  archetypeValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },

  filterScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  filterBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  filterBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  noResults: { alignItems: "center", padding: 24, borderRadius: 18, borderWidth: 1, gap: 10, marginBottom: 16 },
  noResultsTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  noResultsBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  noResultsBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  outfitCard: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12 },
  outfitContent: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  outfitNum: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  outfitNumText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  outfitText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 6 },
  catTags: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  outfitIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },

  feedbackRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  feedbackBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  feedbackLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },

  paletteCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  paletteSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  swatchItem: { alignItems: "center", gap: 4 },
  swatch: { width: 38, height: 38, borderRadius: 19 },
  swatchHex: { fontSize: 9, fontFamily: "Inter_400Regular" },
  paletteHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  simpleCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  simpleText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },

  emptyState: { alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  modalRoot: { flex: 1 },
  modalHero: { height: 320, position: "relative" },
  modalImage: { width: "100%", height: "100%" },
  modalImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  modalImageTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 100,
    paddingTop: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "flex-start",
  },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalScoreBadge: { position: "absolute", top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  modalScoreBadgeText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  modalNameRow: { marginBottom: 20 },
  modalName: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30, marginBottom: 10 },
  modalMetaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalCatChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  modalCatText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalColorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  modalColorSwatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  modalColorHex: { fontSize: 12, fontFamily: "Inter_400Regular" },

  modalSection: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 14, gap: 10 },
  modalSectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },

  modalScoreHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalScoreNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  scoreTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  scoreBar: { height: "100%", borderRadius: 4 },
  modalScoreLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalScoreLabelChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalScoreLabelText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalScoreHint: { fontSize: 12, fontFamily: "Inter_400Regular" },

  modalNotesHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalNotes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 23 },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  modalActionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
