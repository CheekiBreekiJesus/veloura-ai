import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAnalysis } from "@/context/AnalysisContext";
import {
  buildMeasurementsText,
  useBodyProfile,
  type BodyProfile,
} from "@/context/BodyProfileContext";
import { buildStylePrefsText, useStylePrefs } from "@/context/StylePrefsContext";
import { useUnits } from "@/context/UnitsContext";
import {
  SEASON_COLORS,
  SEASON_ICONS,
  getNextSeasons,
  useSeason,
  type Season,
} from "@/context/SeasonContext";
import {
  useWardrobe,
  type ClothingCategory,
  type FeedbackValue,
  type WardrobeItem,
} from "@/context/WardrobeContext";
import colorTokens from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

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

type StyleCategory = "Casual" | "Formal" | "Weekend" | "Beach" | "Nightlife" | "Sportswear" | "Sleepwear" | "Workwear";
type SortOption = "recent" | "score";
type WardrobeSection = "closet" | "picks" | "seasons";

const ALL_SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

const FILTER_KEYWORDS: Record<StyleCategory, string[]> = {
  Casual: ["casual", "everyday", "relaxed", "street", "jeans", "denim", "comfortable", "comfy", "basics", "simple", "effortless"],
  Formal: ["formal", "black tie", "suit", "structured", "tailored", "polished", "gala", "ceremony"],
  Weekend: ["weekend", "leisure", "outdoor", "brunch", "holiday", "travel", "adventure", "picnic"],
  Beach: ["beach", "swimwear", "bikini", "swimsuit", "resort", "tropical", "sarong", "cover-up", "coverup", "poolside", "surf", "boardshort", "swim"],
  Nightlife: ["nightlife", "club", "bar", "going out", "sequin", "bodycon", "glitter", "metallic", "mini dress", "night out", "evening", "night", "cocktail", "party", "gown", "dinner", "elegant", "soirée", "occasion", "date", "glamour", "glam"],
  Sportswear: ["gym", "workout", "yoga", "running", "leggings", "training", "cycling", "performance", "moisture", "compression", "athletic", "activewear", "sport", "fitness"],
  Sleepwear: ["pajama", "pyjama", "lounge", "sleep", "nightwear", "robe", "cozy", "satin slip", "nightgown", "pj"],
  Workwear: ["workwear", "office", "work outfit", "business casual", "desk", "smart casual", "trousers", "pencil skirt", "corporate", "professional"],
};

const CLOTHING_CATEGORIES: ClothingCategory[] = [
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Sleepwear",
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
    case "Sleepwear": return "moon-outline";
  }
}

function SeasonPill({
  season,
  active,
  onPress,
  colors,
}: {
  season: Season;
  active: boolean;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const bg = SEASON_COLORS[season];
  return (
    <Pressable
      onPress={onPress}
      style={[
        seStyles.pill,
        {
          backgroundColor: active ? bg : colors.secondary,
          borderColor: active ? bg : colors.border,
          opacity: onPress ? 1 : 0.95,
        },
      ]}
    >
      <Text style={seStyles.pillEmoji}>{SEASON_ICONS[season]}</Text>
      <Text style={[seStyles.pillText, { color: active ? "#2D1F14" : colors.mutedForeground }]}>
        {SEASON_LABELS[season]}
      </Text>
    </Pressable>
  );
}

function SeasonReadinessCard({
  wardrobeItems,
  currentSeason,
  gapNote,
  colors,
}: {
  wardrobeItems: WardrobeItem[];
  currentSeason: Season;
  gapNote: string | null;
  colors: ReturnType<typeof useColors>;
}) {
  // Readiness = in-season non-stored / total non-stored
  const nonStored = wardrobeItems.filter((i) => !i.stored);
  const inSeasonNonStored = nonStored.filter((i) => i.seasons?.includes(currentSeason));
  const readinessPct = nonStored.length > 0 ? Math.round((inSeasonNonStored.length / nonStored.length) * 100) : 0;
  const bgColor = SEASON_COLORS[currentSeason];

  return (
    <View style={[seStyles.readinessCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[seStyles.readinessHeader, { backgroundColor: bgColor + "30" }]}>
        <Text style={seStyles.readinessSeason}>{SEASON_ICONS[currentSeason]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[seStyles.readinessLabel, { color: colors.mutedForeground }]}>Current season</Text>
          <Text style={[seStyles.readinessTitle, { color: colors.foreground }]}>{SEASON_LABELS[currentSeason]}</Text>
        </View>
        <View style={[seStyles.readinessBadge, { backgroundColor: bgColor }]}>
          <Text style={seStyles.readinessBadgeText}>{inSeasonNonStored.length} items</Text>
        </View>
      </View>
      {nonStored.length > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingTop: 10, gap: 8 }}>
          <View style={[seStyles.readinessTrackBg, { backgroundColor: colors.secondary }]}>
            <View style={[seStyles.readinessTrackFill, { width: `${readinessPct}%` as `${number}%`, backgroundColor: bgColor }]} />
          </View>
          <Text style={[seStyles.readinessHint, { color: colors.mutedForeground }]}>
            {readinessPct}% ready for {SEASON_LABELS[currentSeason]} — {inSeasonNonStored.length} of {nonStored.length} active items
          </Text>
          {gapNote && (
            <View style={[seStyles.gapNote, { backgroundColor: bgColor + "18", borderColor: bgColor + "40" }]}>
              <Ionicons name="sparkles" size={13} color={colors.primary} style={{ marginTop: 1 }} />
              <Text style={[seStyles.gapNoteText, { color: colors.foreground }]}>{gapNote}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={{ padding: 14 }}>
          <Text style={[seStyles.readinessHint, { color: colors.mutedForeground }]}>
            Add items to your closet to see your season readiness score.
          </Text>
        </View>
      )}
    </View>
  );
}

function AutoTagBanner({
  untaggedCount,
  tagging,
  onAutoTag,
  onDismiss,
  colors,
}: {
  untaggedCount: number;
  tagging: boolean;
  onAutoTag: () => void;
  onDismiss: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[seStyles.autoTagBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}>
      <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[seStyles.autoTagTitle, { color: colors.foreground }]}>
          {untaggedCount} item{untaggedCount !== 1 ? "s" : ""} not yet tagged
        </Text>
        <Text style={[seStyles.autoTagHint, { color: colors.mutedForeground }]}>
          Auto-tag them with seasons using AI
        </Text>
      </View>
      <View style={{ gap: 6 }}>
        <Pressable
          onPress={onAutoTag}
          disabled={tagging}
          style={({ pressed }) => [
            seStyles.autoTagBtn,
            { backgroundColor: colors.primary, opacity: tagging ? 0.6 : pressed ? 0.85 : 1 },
          ]}
        >
          {tagging ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={seStyles.autoTagBtnText}>Auto-tag</Text>
          )}
        </Pressable>
        {!tagging && (
          <Pressable onPress={onDismiss} style={{ alignItems: "center" }}>
            <Text style={[seStyles.autoTagDismiss, { color: colors.mutedForeground }]}>Dismiss</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SeasonPlannerCard({
  season,
  count,
  suggestion,
  matchingItems,
  colors,
}: {
  season: Season;
  count: number;
  suggestion?: string;
  matchingItems: WardrobeItem[];
  colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState(false);
  const bg = SEASON_COLORS[season];
  return (
    <View style={[seStyles.plannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        onPress={async () => {
          if (count === 0) return;
          await Haptics.selectionAsync();
          setExpanded((v) => !v);
        }}
        style={{ overflow: "hidden", borderRadius: 14 }}
      >
        <View style={[seStyles.plannerColorBar, { backgroundColor: bg + "60" }]}>
          <Text style={seStyles.plannerEmoji}>{SEASON_ICONS[season]}</Text>
        </View>
        <View style={seStyles.plannerBody}>
          <Text style={[seStyles.plannerSeason, { color: colors.foreground }]}>{SEASON_LABELS[season]}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={[seStyles.plannerCount, { color: count > 0 ? colors.primary : colors.mutedForeground }]}>
              {count > 0 ? `${count} item${count !== 1 ? "s" : ""}` : "No items yet"}
            </Text>
            {count > 0 && (
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={11}
                color={colors.mutedForeground}
              />
            )}
          </View>
          {suggestion ? (
            <Text style={[seStyles.plannerSuggestion, { color: colors.mutedForeground }]} numberOfLines={3}>
              {suggestion}
            </Text>
          ) : (
            <View style={[seStyles.plannerSuggestionSkeleton, { backgroundColor: colors.secondary }]} />
          )}
        </View>
      </Pressable>
      {expanded && matchingItems.length > 0 && (
        <View style={[seStyles.plannerExpanded, { borderTopColor: colors.border }]}>
          {matchingItems.slice(0, 5).map((item) => (
            <View key={item.id} style={seStyles.plannerExpandedItem}>
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={seStyles.plannerExpandedThumb}
                  contentFit={item.backgroundRemoved ? "contain" : "cover"}
                />
              ) : (
                <View style={[seStyles.plannerExpandedThumb, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="shirt-outline" size={14} color={colors.mutedForeground} />
                </View>
              )}
              <Text style={[seStyles.plannerExpandedName, { color: colors.foreground }]} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
          ))}
          {matchingItems.length > 5 && (
            <Text style={[seStyles.plannerExpandedMore, { color: colors.mutedForeground }]}>
              +{matchingItems.length - 5} more
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function OffSeasonItemRow({
  item,
  colors,
  onStore,
  onSell,
}: {
  item: WardrobeItem;
  colors: ReturnType<typeof useColors>;
  onStore: () => void;
  onSell: () => void;
}) {
  const sc = item.compatibilityScore;
  const sColor = scoreColor(sc);
  return (
    <View style={[seStyles.offSeasonRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {item.imageUri ? (
        item.backgroundRemoved ? (
          <View style={[seStyles.offSeasonThumb, { backgroundColor: colorTokens.wardrobeNeutralBg }]}>
            <Image source={{ uri: item.imageUri }} style={seStyles.offSeasonThumbImg} contentFit="contain" />
          </View>
        ) : (
          <Image source={{ uri: item.imageUri }} style={seStyles.offSeasonThumb} contentFit="cover" />
        )
      ) : (
        <View style={[seStyles.offSeasonThumb, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="shirt-outline" size={22} color={colors.mutedForeground} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[seStyles.offSeasonName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[seStyles.offSeasonCat, { color: colors.mutedForeground }]}>{item.category}</Text>
          <View style={[seStyles.offSeasonScorePip, { backgroundColor: sColor + "22" }]}>
            <Text style={[seStyles.offSeasonScore, { color: sColor }]}>{sc}</Text>
          </View>
        </View>
        {item.stored && (
          <View style={[seStyles.storedBadge, { backgroundColor: "#4CAF5018" }]}>
            <Ionicons name="cube-outline" size={11} color="#4CAF50" />
            <Text style={[seStyles.storedBadgeText, { color: "#4CAF50" }]}>Stored away</Text>
          </View>
        )}
      </View>
      <View style={seStyles.offSeasonActions}>
        <Pressable
          onPress={onStore}
          style={({ pressed }) => [
            seStyles.offSeasonBtn,
            {
              backgroundColor: item.stored ? "#4CAF5020" : colors.secondary,
              borderColor: item.stored ? "#4CAF5060" : colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name={item.stored ? "cube" : "cube-outline"} size={14} color={item.stored ? "#4CAF50" : colors.primary} />
          <Text style={[seStyles.offSeasonBtnText, { color: item.stored ? "#4CAF50" : colors.primary }]}>
            {item.stored ? "Stored" : "Store"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onSell}
          style={({ pressed }) => [
            seStyles.offSeasonBtn,
            { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
          <Text style={[seStyles.offSeasonBtnText, { color: colors.primary }]}>Sell</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StoredOffSeasonGroup({
  items,
  colors,
  onUnstore,
  onSell,
}: {
  items: WardrobeItem[];
  colors: ReturnType<typeof useColors>;
  onUnstore: (id: string) => void;
  onSell: (item: WardrobeItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ marginTop: 16 }}>
      <Pressable
        onPress={async () => {
          await Haptics.selectionAsync();
          setExpanded((v) => !v);
        }}
        style={[seStyles.storedGroupHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Ionicons name="cube-outline" size={16} color="#4CAF50" />
        <Text style={[seStyles.storedGroupTitle, { color: colors.foreground }]}>
          Stored Away ({items.length})
        </Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
      </Pressable>
      {expanded && (
        <View style={{ gap: 8, marginTop: 8 }}>
          {items.map((item) => (
            <OffSeasonItemRow
              key={item.id}
              item={item}
              colors={colors}
              onStore={() => onUnstore(item.id)}
              onSell={() => onSell(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

type MeasureField = { key: keyof BodyProfile; label: string; placeholder: string; unit?: string };

function getMeasureFields(units: "metric" | "imperial"): MeasureField[] {
  const isMetric = units === "metric";
  return [
    { key: "height", label: "Height", placeholder: isMetric ? "e.g. 165" : "e.g. 5'5\"", unit: isMetric ? "cm" : "ft + in" },
    { key: "weight", label: "Weight", placeholder: isMetric ? "e.g. 60" : "e.g. 130", unit: isMetric ? "kg" : "lbs" },
    { key: "bust", label: "Bust / Chest", placeholder: isMetric ? "e.g. 86" : "e.g. 34", unit: isMetric ? "cm" : "in" },
    { key: "cupSize", label: "Cup Size", placeholder: "e.g. B" },
    { key: "waist", label: "Waist", placeholder: isMetric ? "e.g. 68" : "e.g. 27", unit: isMetric ? "cm" : "in" },
    { key: "hips", label: "Hips", placeholder: isMetric ? "e.g. 90" : "e.g. 38", unit: isMetric ? "cm" : "in" },
    { key: "inseam", label: "Inseam", placeholder: isMetric ? "e.g. 76" : "e.g. 30", unit: isMetric ? "cm" : "in" },
  ];
}

function MeasurementsCard({
  colors,
}: {
  colors: ReturnType<typeof useColors>;
}) {
  const { bodyProfile, setBodyProfile } = useBodyProfile();
  const { unitsPreference } = useUnits();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<BodyProfile>(bodyProfile);
  const [saved, setSaved] = useState(false);

  const measureFields = getMeasureFields(unitsPreference);
  const summaryText = buildMeasurementsText(bodyProfile, unitsPreference);

  const handleSave = async () => {
    Keyboard.dismiss();
    await setBodyProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    setExpanded(false);
  };

  const handleToggle = async () => {
    await Haptics.selectionAsync();
    if (!expanded) setDraft(bodyProfile);
    setExpanded((v) => !v);
  };

  return (
    <View style={[mStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={handleToggle} style={mStyles.cardHeader}>
        <View style={[mStyles.cardIconWrap, { backgroundColor: colors.primary + "18" }]}>
          <Ionicons name="body-outline" size={18} color={colors.primary} />
        </View>
        <View style={mStyles.cardTitleCol}>
          <Text style={[mStyles.cardTitle, { color: colors.foreground }]}>My Measurements</Text>
          {summaryText ? (
            <Text style={[mStyles.cardSummary, { color: colors.mutedForeground }]} numberOfLines={1}>
              {summaryText}
            </Text>
          ) : (
            <Text style={[mStyles.cardHint, { color: colors.mutedForeground }]}>
              Add your measurements to improve Aura's sizing advice
            </Text>
          )}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </Pressable>

      {expanded && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={mStyles.expandedContent}>
            <View style={mStyles.fieldsGrid}>
              {measureFields.map((f) => (
                <View key={f.key} style={mStyles.fieldItem}>
                  <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground }]}>
                    {f.label}
                    {f.unit ? <Text style={{ color: colors.primary + "99" }}> ({f.unit})</Text> : null}
                  </Text>
                  <View style={[mStyles.fieldInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <TextInput
                      value={draft[f.key]}
                      onChangeText={(v) => setDraft((prev) => ({ ...prev, [f.key]: v }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.mutedForeground}
                      style={[mStyles.fieldInputText, { color: colors.foreground }]}
                      returnKeyType="done"
                      keyboardType={f.key === "cupSize" ? "default" : "decimal-pad"}
                      maxLength={10}
                    />
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                mStyles.saveBtn,
                { backgroundColor: saved ? "#4CAF50" : colors.primary, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <Ionicons name={saved ? "checkmark" : "checkmark-circle-outline"} size={18} color="#fff" />
              <Text style={mStyles.saveBtnText}>{saved ? "Saved!" : "Save Measurements"}</Text>
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

export default function WardrobeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, setPendingChatInput } = useAnalysis();
  const { wardrobeItems, feedback, setFeedback, removeItem, updateItemSeasons, toggleStored } = useWardrobe();
  const { currentSeason } = useSeason();
  const { stylePrefs } = useStylePrefs();

  const [section, setSection] = useState<WardrobeSection>("closet");
  const [autoTagging, setAutoTagging] = useState(false);
  const [autoTagBannerDismissed, setAutoTagBannerDismissed] = useState<boolean | null>(null);
  const [gapNote, setGapNote] = useState<string | null>(null);
  const [plannerSuggestions, setPlannerSuggestions] = useState<Partial<Record<Season, string>>>({});
  const seasonInsightsFetched = useRef(false);

  // Load + persist auto-tag banner dismissal across sessions
  useEffect(() => {
    void AsyncStorage.getItem("veloura_autotag_dismissed").then((v) => {
      setAutoTagBannerDismissed(v === "1");
    });
  }, []);

  const [activeFilter, setActiveFilter] = useState("All");
  const [closetFilter, setClosetFilter] = useState<ClothingCategory | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  // Outfit Builder
  const [outfitMode, setOutfitMode] = useState(false);
  const [outfitSelected, setOutfitSelected] = useState<string[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const filters = ["All", "Casual", "Beach", "Sportswear", "Formal", "Nightlife", "Weekend", "Sleepwear", "Workwear"];

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

  const handleAskAura = (item: WardrobeItem) => {
    const snippet = item.compatibilityNotes.length > 150
      ? item.compatibilityNotes.substring(0, 150) + "…"
      : item.compatibilityNotes;
    const styleCtx = buildStylePrefsText(stylePrefs);
    const msg = `I have a ${item.name} (${item.category}, compatibility score ${item.compatibilityScore}/100). ${snippet} How should I style it? What outfits can I build around it?${styleCtx ? ` My style preferences: ${styleCtx}.` : ""}`;
    setPendingChatInput(msg);
    setSelectedItem(null);
    router.push("/(tabs)/chat");
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleOutfitSelect = async (id: string) => {
    await Haptics.selectionAsync();
    setOutfitSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 6
        ? [...prev, id]
        : prev
    );
  };

  const handleStyleWithAura = async () => {
    const items = wardrobeItems.filter((i) => outfitSelected.includes(i.id));
    const list = items
      .map((i) => `${i.name} (${i.category}, score ${i.compatibilityScore}/100)`)
      .join(", ");
    const styleCtx = buildStylePrefsText(stylePrefs);
    const msg = `I'm trying to build an outfit from pieces I own: ${list}. Can you suggest how to combine them into a great look? Please give me specific styling tips for each piece and any additional items that would complete the outfit.${styleCtx ? ` My style preferences: ${styleCtx}.` : ""}`;
    setPendingChatInput(msg);
    setOutfitMode(false);
    setOutfitSelected([]);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/(tabs)/chat");
  };

  const exitOutfitMode = async () => {
    await Haptics.selectionAsync();
    setOutfitMode(false);
    setOutfitSelected([]);
  };

  // Fetch AI season insights once per session when user opens the Seasons tab
  useEffect(() => {
    if (section !== "seasons" || seasonInsightsFetched.current || wardrobeItems.length === 0) return;
    seasonInsightsFetched.current = true;
    const inSeasonNames = wardrobeItems
      .filter((i) => i.seasons?.includes(currentSeason))
      .map((i) => i.name)
      .slice(0, 6)
      .join(", ");
    const totalTagged = wardrobeItems.filter((i) => i.seasons && i.seasons.length > 0).length;

    const styleCtxNote = buildStylePrefsText(stylePrefs);
    const brandNote = styleCtxNote ? ` My style preferences: ${styleCtxNote}.` : "";

    // Fetch gap note
    void (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{
              role: "user" as const,
              content: `My wardrobe for ${SEASON_LABELS[currentSeason]}: ${inSeasonNames || "no items tagged yet"} (${totalTagged} of ${wardrobeItems.length} items tagged with seasons). In one sentence, give me a specific tip on what type of piece I should add to complete my ${SEASON_LABELS[currentSeason]} wardrobe. Be direct and specific.${brandNote}`,
            }],
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { reply: string };
          if (data.reply) setGapNote(data.reply);
        }
      } catch { /* silent */ }
    })();

    // Fetch planner suggestions for upcoming seasons
    const upcomingSeasons = getNextSeasons(currentSeason, 3);
    for (const s of upcomingSeasons) {
      const seasonItems = wardrobeItems.filter((i) => i.seasons?.includes(s)).map((i) => i.name).slice(0, 4).join(", ");
      void (async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{
                role: "user" as const,
                content: `For ${SEASON_LABELS[s]} planning, I have these items: ${seasonItems || "none yet"}. In one short sentence, what's the single most important piece to add or prep for ${SEASON_LABELS[s]}? Be specific.${brandNote}`,
              }],
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { reply: string };
            if (data.reply) {
              setPlannerSuggestions((prev) => ({ ...prev, [s]: data.reply }));
            }
          }
        } catch { /* silent */ }
      })();
    }
  }, [section, wardrobeItems.length, currentSeason]);

  const untaggedItems = useMemo(
    () => wardrobeItems.filter((i) => !i.seasons || i.seasons.length === 0),
    [wardrobeItems]
  );

  const offSeasonItems = useMemo(
    () => wardrobeItems.filter(
      (i) => i.seasons && i.seasons.length > 0 && !i.seasons.includes(currentSeason)
    ),
    [wardrobeItems, currentSeason]
  );

  const handleAutoTagAll = async () => {
    if (autoTagging || untaggedItems.length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAutoTagging(true);
    const validSeasons = new Set<Season>(["spring", "summer", "autumn", "winter"]);
    for (const item of untaggedItems) {
      try {
        const res = await fetch(`${BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{
              role: "user" as const,
              content: `For a "${item.name}" (${item.category} clothing), which calendar seasons is it appropriate to wear? Reply with ONLY a JSON array using these exact values: ["spring","summer","autumn","winter"]. Include only seasons that truly apply. Example: ["spring","autumn"]`,
            }],
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { reply: string };
          const match = data.reply.match(/\[[\s\S]*?\]/);
          if (match) {
            const parsed = JSON.parse(match[0]) as unknown[];
            const seasons = parsed.filter(
              (s): s is Season => typeof s === "string" && validSeasons.has(s as Season)
            );
            if (seasons.length > 0) {
              await updateItemSeasons(item.id, seasons);
            }
          }
        }
      } catch {
      }
    }
    setAutoTagging(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSellItem = async (item: WardrobeItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = encodeURIComponent(item.name);
    await WebBrowser.openBrowserAsync(`https://www.vinted.com/catalog?search_text=${q}`, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: "#FAF8F5",
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: outfitMode ? botPad + 80 : botPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Wardrobe
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {section === "closet" ? "Your uploaded clothing" : section === "seasons" ? "Plan your seasonal wardrobe" : "AI style guide for your profile"}
          </Text>
        </View>

        {/* My Measurements card */}
        <View style={styles.measurementsWrap}>
          <MeasurementsCard colors={colors} />
        </View>

        {/* Section toggle */}
        <View style={styles.sectionToggle}>
          {([
            { key: "closet" as const, label: "My Closet", icon: "shirt-outline" as const },
            { key: "picks" as const, label: "AI Picks", icon: "sparkles-outline" as const },
            { key: "seasons" as const, label: "Seasons", icon: "leaf-outline" as const },
          ]).map((s) => (
            <Pressable
              key={s.key}
              onPress={async () => {
                await Haptics.selectionAsync();
                setSection(s.key);
                if (outfitMode) { setOutfitMode(false); setOutfitSelected([]); }
              }}
              style={[
                styles.sectionBtn,
                {
                  backgroundColor: section === s.key ? colors.primary : colors.secondary,
                  borderColor: section === s.key ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={s.icon}
                size={15}
                color={section === s.key ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.sectionBtnText,
                  { color: section === s.key ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {s.label}
              </Text>
              {s.key === "closet" && wardrobeItems.length > 0 && (
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
                  {outfitMode ? "Pick items to style" : "My Closet"}
                </Text>
                {wardrobeItems.length > 0 && !outfitMode && (
                  <Text style={[styles.closetSubtitle, { color: colors.mutedForeground }]}>
                    {wardrobeItems.length} item{wardrobeItems.length !== 1 ? "s" : ""}
                    {avgScore !== null ? ` · avg score ${avgScore}` : ""}
                  </Text>
                )}
                {outfitMode && (
                  <Text style={[styles.closetSubtitle, { color: colors.primary }]}>
                    {outfitSelected.length === 0
                      ? "Tap items to select (up to 6)"
                      : `${outfitSelected.length} selected`}
                  </Text>
                )}
              </View>
              <View style={styles.closetHeaderRight}>
                {wardrobeItems.length > 1 && !outfitMode && (
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
                {outfitMode ? (
                  <Pressable
                    onPress={exitOutfitMode}
                    style={[styles.addBtn, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }]}
                  >
                    <Ionicons name="close" size={16} color={colors.foreground} />
                    <Text style={[styles.addBtnText, { color: colors.foreground }]}>Done</Text>
                  </Pressable>
                ) : (
                  <>
                    {wardrobeItems.length >= 2 && (
                      <Pressable
                        onPress={async () => {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setOutfitMode(true);
                        }}
                        style={[styles.outfitBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
                      >
                        <Ionicons name="color-wand-outline" size={15} color={colors.primary} />
                        <Text style={[styles.outfitBtnText, { color: colors.primary }]}>Outfit</Text>
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
                      <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>Add</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            {/* Wardrobe stats panel */}
            {wardrobeItems.length > 0 && !outfitMode && (
              <StatsPanel
                avgScore={avgScore}
                wardrobeColors={wardrobeColors}
                categoryCounts={categoryCounts}
                total={wardrobeItems.length}
                colors={colors}
              />
            )}

            {/* Wardrobe insights */}
            {wardrobeItems.length >= 4 && !outfitMode && (
              <InsightsPanel items={wardrobeItems} colors={colors} />
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
                {/* Category filter (hidden in outfit mode) */}
                {!outfitMode && (
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
                )}

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
                    {(outfitMode ? wardrobeItems : displayedItems).map((item) => (
                      <ClosetItemCard
                        key={item.id}
                        item={item}
                        colors={colors}
                        outfitMode={outfitMode}
                        selected={outfitSelected.includes(item.id)}
                        onPress={() => {
                          if (outfitMode) {
                            void toggleOutfitSelect(item.id);
                          } else {
                            setSelectedItem(item);
                          }
                        }}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── SEASONS ── */}
        {section === "seasons" && (
          <View style={styles.sectionPad}>
            <SeasonReadinessCard
              wardrobeItems={wardrobeItems}
              currentSeason={currentSeason}
              gapNote={gapNote}
              colors={colors}
            />

            {/* Auto-tag banner — one-time first-entry prompt; null = still loading dismissal state */}
            {untaggedItems.length > 0 && wardrobeItems.length > 0 && autoTagBannerDismissed === false && (
              <AutoTagBanner
                untaggedCount={untaggedItems.length}
                tagging={autoTagging}
                onAutoTag={() => { void handleAutoTagAll(); }}
                onDismiss={() => {
                  setAutoTagBannerDismissed(true);
                  void AsyncStorage.setItem("veloura_autotag_dismissed", "1");
                }}
                colors={colors}
              />
            )}

            {/* Season Planner */}
            {wardrobeItems.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8, marginBottom: 10 }]}>
                  Season Planner
                </Text>
                <View style={seStyles.plannerRow}>
                  {getNextSeasons(currentSeason, 3).map((s) => {
                    const matching = wardrobeItems.filter((i) => i.seasons?.includes(s) && !i.stored);
                    return (
                      <SeasonPlannerCard
                        key={s}
                        season={s}
                        count={matching.length}
                        suggestion={plannerSuggestions[s]}
                        matchingItems={matching}
                        colors={colors}
                      />
                    );
                  })}
                </View>
              </>
            )}

            {/* Off-season items — active (not stored) */}
            {offSeasonItems.filter((i) => !i.stored).length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16, marginBottom: 4 }]}>
                  Off-Season Items
                </Text>
                <Text style={[seStyles.offSeasonSubtitle, { color: colors.mutedForeground }]}>
                  Store or sell pieces you won't need this {SEASON_LABELS[currentSeason].toLowerCase()}
                </Text>
                <View style={{ gap: 10, marginTop: 10 }}>
                  {offSeasonItems.filter((i) => !i.stored).map((item) => (
                    <OffSeasonItemRow
                      key={item.id}
                      item={item}
                      colors={colors}
                      onStore={async () => {
                        await Haptics.selectionAsync();
                        await toggleStored(item.id);
                      }}
                      onSell={() => { void handleSellItem(item); }}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Stored off-season items — collapsed group */}
            {offSeasonItems.filter((i) => i.stored).length > 0 && (
              <StoredOffSeasonGroup
                items={offSeasonItems.filter((i) => i.stored)}
                colors={colors}
                onUnstore={async (id) => {
                  await Haptics.selectionAsync();
                  await toggleStored(id);
                }}
                onSell={(item) => { void handleSellItem(item); }}
              />
            )}

            {/* Empty state when no items at all */}
            {wardrobeItems.length === 0 && (
              <View style={[seStyles.emptySeasons, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 40 }}>🌸☀️🍂❄️</Text>
                <Text style={[seStyles.emptySeasonsTitle, { color: colors.foreground }]}>Season Wardrobe Helper</Text>
                <Text style={[seStyles.emptySeasonsDesc, { color: colors.mutedForeground }]}>
                  Add items to My Closet first, then tag them with seasons to plan your wardrobe year-round.
                </Text>
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/add-item");
                  }}
                  style={({ pressed }) => [seStyles.emptySeasonsBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={seStyles.emptySeasonsBtnText}>Add Your First Item</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* ── AI PICKS ── */}
        {section === "picks" && (
          <>
            {analysis && (
              <View style={{ paddingHorizontal: 20, marginBottom: 20, gap: 10 }}>
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
                {stylePrefs.favouriteBrands.length > 0 && (
                  <View style={[styles.brandBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="heart" size={13} color={colors.primary} />
                    <Text style={[styles.brandBannerText, { color: colors.mutedForeground }]}>
                      Picks influenced by your brands:{" "}
                      <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>
                        {stylePrefs.favouriteBrands.slice(0, 4).join(", ")}
                        {stylePrefs.favouriteBrands.length > 4 ? ` +${stylePrefs.favouriteBrands.length - 4}` : ""}
                      </Text>
                    </Text>
                  </View>
                )}
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

      {/* Outfit Builder floating bar */}
      {outfitMode && (
        <View
          style={[
            styles.outfitBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 10,
            },
          ]}
        >
          {outfitSelected.length < 2 ? (
            <View style={styles.outfitBarInner}>
              <Ionicons name="color-wand-outline" size={20} color={colors.primary} />
              <Text style={[styles.outfitBarHint, { color: colors.mutedForeground }]}>
                Select at least 2 items to style together
              </Text>
            </View>
          ) : (
            <View style={styles.outfitBarInner}>
              <View style={styles.outfitBarLeft}>
                <View style={styles.outfitMiniAvatars}>
                  {wardrobeItems
                    .filter((i) => outfitSelected.includes(i.id))
                    .slice(0, 3)
                    .map((item, idx) => (
                      <View
                        key={item.id}
                        style={[
                          styles.outfitMiniAvatar,
                          { marginLeft: idx > 0 ? -10 : 0, zIndex: 3 - idx, borderColor: colors.card },
                        ]}
                      >
                        {item.imageUri ? (
                          <Image source={{ uri: item.imageUri }} style={styles.outfitMiniAvatarImg} contentFit="cover" />
                        ) : (
                          <View style={[styles.outfitMiniAvatarImg, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
                            <Ionicons name="shirt-outline" size={12} color={colors.primary} />
                          </View>
                        )}
                      </View>
                    ))}
                </View>
                <Text style={[styles.outfitBarCount, { color: colors.foreground }]}>
                  {outfitSelected.length} piece{outfitSelected.length !== 1 ? "s" : ""} selected
                </Text>
              </View>
              <Pressable
                onPress={handleStyleWithAura}
                style={({ pressed }) => [
                  styles.styleBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.styleBtnText}>Style with {analysis?.companion_name ?? "Aura"}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        colors={colors}
        onClose={() => setSelectedItem(null)}
        onRemove={(item) => {
          setSelectedItem(null);
          handleRemoveItem(item);
        }}
        onFindSimilar={(item) => { void handleFindSimilar(item); }}
        onAskAura={(item) => handleAskAura(item)}
        onUpdateSeasons={updateItemSeasons}
      />
    </View>
  );
}

function InsightsPanel({
  items,
  colors,
}: {
  items: WardrobeItem[];
  colors: ReturnType<typeof useColors>;
}) {
  const best = useMemo(
    () => [...items].sort((a, b) => b.compatibilityScore - a.compatibilityScore)[0],
    [items]
  );

  const missingCategory = useMemo(() => {
    const owned = new Set(items.map((i) => i.category));
    return CLOTHING_CATEGORIES.find((c) => !owned.has(c)) ?? null;
  }, [items]);

  const pctAbove70 = Math.round(
    (items.filter((i) => i.compatibilityScore >= 70).length / items.length) * 100
  );

  const healthColor = pctAbove70 >= 70 ? "#4CAF50" : pctAbove70 >= 40 ? "#FF9800" : "#F44336";

  return (
    <View style={[styles.insightsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.insightsHeader}>
        <Ionicons name="bulb-outline" size={15} color={colors.primary} />
        <Text style={[styles.insightsTitle, { color: colors.foreground }]}>Wardrobe Insights</Text>
      </View>

      <View style={[styles.insightsDivider, { backgroundColor: colors.border }]} />

      {/* Best match */}
      <View style={styles.insightRow}>
        <View style={[styles.insightIcon, { backgroundColor: "#4CAF5018" }]}>
          <Ionicons name="trophy-outline" size={14} color="#4CAF50" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.insightLabel, { color: colors.mutedForeground }]}>Best match</Text>
          <Text style={[styles.insightValue, { color: colors.foreground }]} numberOfLines={1}>
            {best.name}
            <Text style={{ color: scoreColor(best.compatibilityScore) }}> · {best.compatibilityScore}/100</Text>
          </Text>
        </View>
      </View>

      {/* Wardrobe health */}
      <View style={styles.insightRow}>
        <View style={[styles.insightIcon, { backgroundColor: healthColor + "18" }]}>
          <Ionicons name="pulse-outline" size={14} color={healthColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.insightLabel, { color: colors.mutedForeground }]}>Wardrobe health</Text>
          <Text style={[styles.insightValue, { color: colors.foreground }]}>
            <Text style={{ color: healthColor }}>{pctAbove70}%</Text>
            {" of items score above 70"}
          </Text>
        </View>
      </View>

      {/* Gap suggestion */}
      {missingCategory && (
        <View style={styles.insightRow}>
          <View style={[styles.insightIcon, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name={categoryIcon(missingCategory)} size={14} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightLabel, { color: colors.mutedForeground }]}>Add to complete your wardrobe</Text>
            <Text style={[styles.insightValue, { color: colors.primary }]}>{missingCategory}</Text>
          </View>
        </View>
      )}
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
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{total}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Items</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: avgScore !== null ? scoreColor(avgScore) : colors.foreground }]}>
            {avgScore ?? "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Score</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
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

      {topCategories.length > 0 && (
        <View style={[styles.categoryBreakdown, { borderTopColor: colors.border }]}>
          {topCategories.map(([cat, count]) => (
            <View key={cat} style={styles.breakdownItem}>
              <Ionicons name={categoryIcon(cat as ClothingCategory)} size={13} color={colors.primary} />
              <Text style={[styles.breakdownCat, { color: colors.foreground }]}>{cat}</Text>
              <Text style={[styles.breakdownCount, { color: colors.mutedForeground }]}>{count}</Text>
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
  onAskAura,
  onUpdateSeasons,
}: {
  item: WardrobeItem | null;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
  onRemove: (item: WardrobeItem) => void;
  onFindSimilar: (item: WardrobeItem) => void;
  onAskAura: (item: WardrobeItem) => void;
  onUpdateSeasons: (id: string, seasons: Season[]) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const { analysis: modalAnalysis } = useAnalysis();
  const companionName = modalAnalysis?.companion_name ?? "Aura";
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
            item.backgroundRemoved ? (
              <View style={[styles.modalImage, styles.modalImageNeutralBg]}>
                <Image source={{ uri: item.imageUri }} style={styles.modalImageContain} contentFit="contain" />
              </View>
            ) : (
              <Image source={{ uri: item.imageUri }} style={styles.modalImage} contentFit="cover" />
            )
          ) : (
            <View style={[styles.modalImage, styles.modalImagePlaceholder, { backgroundColor: colors.secondary }]}>
              <Ionicons name="shirt-outline" size={56} color={colors.mutedForeground} />
            </View>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.38)", "transparent"]}
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
            <Text style={[styles.modalName, { color: colors.foreground }]} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.modalMetaRow}>
              <View style={[styles.modalCatChip, { backgroundColor: colors.secondary }]}>
                <Ionicons name={categoryIcon(item.category)} size={11} color={colors.primary} />
                <Text style={[styles.modalCatText, { color: colors.primary }]}>{item.category}</Text>
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

          {/* Compatibility score bar */}
          <View style={[styles.modalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalScoreHeader}>
              <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>Compatibility</Text>
              <Text style={[styles.modalScoreNum, { color: sColor }]}>{sc}/100</Text>
            </View>
            <View style={[styles.scoreTrack, { backgroundColor: colors.secondary }]}>
              <View style={[styles.scoreBar, { width: `${sc}%` as `${number}%`, backgroundColor: sColor }]} />
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

          {/* Season tags */}
          <View style={[styles.modalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalNotesHeader}>
              <Ionicons name="leaf-outline" size={16} color={colors.primary} />
              <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>Seasons</Text>
            </View>
            <View style={seStyles.modalSeasonPills}>
              {ALL_SEASONS.map((s) => {
                const active = item.seasons?.includes(s) ?? false;
                return (
                  <SeasonPill
                    key={s}
                    season={s}
                    active={active}
                    colors={colors}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      const current = item.seasons ?? [];
                      const next = active
                        ? current.filter((x) => x !== s)
                        : [...current, s];
                      await onUpdateSeasons(item.id, next);
                    }}
                  />
                );
              })}
            </View>
            {(!item.seasons || item.seasons.length === 0) && (
              <Text style={[seStyles.noSeasonHint, { color: colors.mutedForeground }]}>
                Tap seasons to tag when you wear this item
              </Text>
            )}
          </View>

          {/* AI notes */}
          {item.compatibilityNotes.length > 0 && (
            <View style={[styles.modalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalNotesHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                  {companionName}'s Assessment
                </Text>
              </View>
              <Text style={[styles.modalNotes, { color: colors.foreground }]}>
                {item.compatibilityNotes}
              </Text>
            </View>
          )}

          {/* Ask Aura CTA */}
          <Pressable
            onPress={() => onAskAura(item)}
            style={({ pressed }) => [
              styles.askAuraBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.askAuraBtnText}>Ask {companionName} how to style this</Text>
            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>

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
              <Text style={[styles.modalActionText, { color: colors.foreground }]}>Find Similar</Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove(item)}
              style={({ pressed }) => [
                styles.modalActionBtn,
                { backgroundColor: "#FFF0F0", borderColor: "#FFCDD2", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
              <Text style={[styles.modalActionText, { color: "#F44336" }]}>Remove</Text>
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
  outfitMode,
  selected,
  onPress,
}: {
  item: WardrobeItem;
  colors: ReturnType<typeof useColors>;
  outfitMode: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const score = item.compatibilityScore;
  const sColor = scoreColor(score);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemCard,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2.5 : StyleSheet.hairlineWidth,
          opacity: outfitMode && !selected ? 0.75 : item.stored ? 0.45 : pressed ? 0.88 : 1,
        },
      ]}
    >
      {item.imageUri ? (
        item.backgroundRemoved ? (
          <View style={[styles.itemImage, styles.itemImageNeutralBg]}>
            <Image source={{ uri: item.imageUri }} style={styles.itemImageContain} contentFit="contain" />
          </View>
        ) : (
          <Image source={{ uri: item.imageUri }} style={styles.itemImage} contentFit="cover" />
        )
      ) : (
        <View style={[styles.itemImage, styles.itemImagePlaceholder, { backgroundColor: colors.secondary }]}>
          <Ionicons name="shirt-outline" size={32} color={colors.mutedForeground} />
        </View>
      )}

      {/* Score badge or selection check */}
      {outfitMode ? (
        <View style={[
          styles.selectBadge,
          { backgroundColor: selected ? colors.primary : "rgba(255,255,255,0.7)" },
        ]}>
          <Ionicons
            name={selected ? "checkmark" : "add"}
            size={14}
            color={selected ? "#fff" : colors.mutedForeground}
          />
        </View>
      ) : (
        <View style={[styles.scoreBadge, { backgroundColor: sColor + "ee" }]}>
          <Text style={styles.scoreBadgeText}>{score}</Text>
        </View>
      )}
      {/* Trans-seasonal badge */}
      {!outfitMode && item.seasons && item.seasons.length >= 3 && (
        <View style={seStyles.transSeasonalBadge}>
          <Text style={seStyles.transSeasonalBadgeText}>
            {item.seasons.length === 4 ? "Year-round" : "Multi-season"}
          </Text>
        </View>
      )}

      {/* Bottom overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        style={styles.itemOverlay}
      >
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.itemFooter}>
          <View style={[styles.catChip, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.catChipText}>{item.category}</Text>
          </View>
          {!outfitMode && (
            <View style={styles.tapHint}>
              <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Selected overlay */}
      {selected && (
        <View style={styles.selectedOverlay} />
      )}
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
    <LinearGradient colors={gradient} style={styles.outfitCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
      <View style={styles.feedbackRow}>
        <Pressable
          onPress={() => onFeedback("liked")}
          style={[styles.feedbackBtn, {
            backgroundColor: currentFeedback === "liked" ? "#4CAF5033" : "rgba(255,255,255,0.55)",
            borderColor: currentFeedback === "liked" ? "#4CAF50" : "transparent",
          }]}
        >
          <Ionicons name={currentFeedback === "liked" ? "thumbs-up" : "thumbs-up-outline"} size={14} color={currentFeedback === "liked" ? "#4CAF50" : OUTFIT_TEXT_DIM} />
          <Text style={[styles.feedbackLabel, { color: currentFeedback === "liked" ? "#4CAF50" : OUTFIT_TEXT_DIM }]}>Like</Text>
        </Pressable>
        <Pressable
          onPress={() => onFeedback("disliked")}
          style={[styles.feedbackBtn, {
            backgroundColor: currentFeedback === "disliked" ? "#F4433633" : "rgba(255,255,255,0.55)",
            borderColor: currentFeedback === "disliked" ? "#F44336" : "transparent",
          }]}
        >
          <Ionicons name={currentFeedback === "disliked" ? "thumbs-down" : "thumbs-down-outline"} size={14} color={currentFeedback === "disliked" ? "#F44336" : OUTFIT_TEXT_DIM} />
          <Text style={[styles.feedbackLabel, { color: currentFeedback === "disliked" ? "#F44336" : OUTFIT_TEXT_DIM }]}>Not me</Text>
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
  sectionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  sectionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  countBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  countText: { fontSize: 11, fontFamily: "Inter_700Bold" },

  sectionPad: { paddingHorizontal: 20 },
  closetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  closetSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  closetHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },

  sortBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  sortBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  outfitBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  outfitBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  statsCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, overflow: "hidden" },
  statsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statDivider: { width: StyleSheet.hairlineWidth, height: 36 },
  colorDots: { flexDirection: "row", alignItems: "center", height: 26 },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#fff" },
  categoryBreakdown: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 16 },
  breakdownItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  breakdownCat: { fontSize: 12, fontFamily: "Inter_500Medium" },
  breakdownCount: { fontSize: 12, fontFamily: "Inter_400Regular" },

  insightsCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, overflow: "hidden" },
  insightsHeader: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  insightsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  insightsDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16, marginBottom: 4 },
  insightRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  insightIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  insightLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  insightValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  categoryScroll: { gap: 8, paddingBottom: 14 },
  categoryPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  categoryCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  categoryCountText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  closetEmpty: { alignItems: "center", padding: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, gap: 12, marginBottom: 16 },
  closetEmptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  closetEmptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  closetEmptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  closetEmptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  closetEmptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },

  itemGrid: { flexDirection: "row", flexWrap: "wrap", gap: ITEM_GAP, marginBottom: 16 },
  itemCard: { width: ITEM_WIDTH, height: ITEM_HEIGHT, borderRadius: 18, overflow: "hidden" },
  itemImage: { width: "100%", height: "100%", position: "absolute" },
  itemImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  itemImageNeutralBg: { backgroundColor: colorTokens.wardrobeNeutralBg, alignItems: "center", justifyContent: "center" },
  itemImageContain: { width: "100%", height: "100%", position: "absolute" },
  scoreBadge: { position: "absolute", top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  scoreBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  selectBadge: { position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  selectedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(196,149,106,0.18)", borderRadius: 18 },
  itemOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 12, paddingTop: 24, paddingBottom: 12 },
  itemName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff", marginBottom: 6 },
  itemFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.9)" },
  tapHint: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },

  outfitBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingTop: 14 },
  outfitBarInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  outfitBarLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  outfitMiniAvatars: { flexDirection: "row", alignItems: "center" },
  outfitMiniAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, overflow: "hidden" },
  outfitMiniAvatarImg: { width: "100%", height: "100%" },
  outfitBarHint: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  outfitBarCount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  styleBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  styleBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  archetypeBanner: { borderRadius: 18, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  archetypeLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  archetypeValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  brandBanner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  brandBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },

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
  modalImageNeutralBg: { backgroundColor: colorTokens.wardrobeNeutralBg, alignItems: "center", justifyContent: "center" },
  modalImageContain: { width: "100%", height: "100%" },
  modalImageTop: { position: "absolute", top: 0, left: 0, right: 0, height: 100, paddingTop: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "flex-start" },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalScoreBadge: { position: "absolute", top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  modalScoreBadgeText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  modalNameRow: { marginBottom: 16 },
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

  askAuraBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15, borderRadius: 18, marginBottom: 14 },
  askAuraBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", flex: 1, textAlign: "center" },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  modalActionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  measurementsWrap: { paddingHorizontal: 20, marginBottom: 12 },
});

const mStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitleCol: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardSummary: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  expandedContent: { paddingHorizontal: 14, paddingBottom: 14 },
  fieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  fieldItem: { width: "47%" },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 5, letterSpacing: 0.3 },
  fieldInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  fieldInputText: { fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

const seStyles = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  readinessCard: {
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12, overflow: "hidden",
  },
  readinessHeader: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 16,
  },
  readinessSeason: { fontSize: 36 },
  readinessLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  readinessTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  readinessBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  readinessBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#2D1F14" },
  readinessTrackBg: { height: 8, borderRadius: 6, overflow: "hidden" },
  readinessTrackFill: { height: "100%", borderRadius: 6 },
  readinessHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  autoTagBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 14,
  },
  autoTagTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  autoTagHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  autoTagBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, minWidth: 72, alignItems: "center",
  },
  autoTagBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

  plannerRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  plannerCard: {
    flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden",
  },
  plannerColorBar: { height: 44, alignItems: "center", justifyContent: "center" },
  plannerEmoji: { fontSize: 24 },
  plannerBody: { padding: 10, gap: 3 },
  plannerSeason: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  plannerCount: { fontSize: 11, fontFamily: "Inter_400Regular" },

  offSeasonSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 2 },
  offSeasonRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  offSeasonThumb: { width: 60, height: 60, borderRadius: 12, overflow: "hidden", flexShrink: 0 },
  offSeasonThumbImg: { width: "100%", height: "100%", position: "absolute" },
  offSeasonName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  offSeasonCat: { fontSize: 12, fontFamily: "Inter_400Regular" },
  offSeasonScorePip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  offSeasonScore: { fontSize: 11, fontFamily: "Inter_700Bold" },
  storedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  storedBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  offSeasonActions: { gap: 6, flexShrink: 0 },
  offSeasonBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  offSeasonBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  transSeasonalBadge: {
    position: "absolute", bottom: 46, left: 8,
    backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  transSeasonalBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },

  modalSeasonPills: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 4 },
  noSeasonHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },

  emptySeasons: {
    alignItems: "center", padding: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, gap: 12, marginBottom: 16,
  },
  emptySeasonsTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptySeasonsDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptySeasonsBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  emptySeasonsBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },

  gapNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  gapNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  plannerSuggestion: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 15, marginTop: 4 },
  plannerSuggestionSkeleton: { height: 28, borderRadius: 6, marginTop: 6 },
  plannerExpanded: { borderTopWidth: StyleSheet.hairlineWidth, padding: 10, gap: 8 },
  plannerExpandedItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  plannerExpandedThumb: { width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 },
  plannerExpandedName: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  plannerExpandedMore: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", paddingTop: 2 },

  autoTagDismiss: { fontSize: 11, fontFamily: "Inter_400Regular" },

  storedGroupHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  storedGroupTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
