import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useCountry } from "@/context/CountryContext";
import { useWishlistProducts } from "@/context/WishlistProductContext";
import { useColors } from "@/hooks/useColors";
import {
  CATEGORIES,
  PRICE_TIER_COLORS,
  PRICE_TIER_LABELS,
  PRODUCTS,
  RETAILER_ICONS,
  getProductUrl,
  type PriceTier,
  type Product,
} from "@/data/products";

const { width, height } = Dimensions.get("window");
const CARD_W = width * 0.57;

async function openShopUrl(url: string) {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: "#FAF8F5",
  });
}

function buildKeywordUrl(keyword: string, country: string): string {
  const k = encodeURIComponent(keyword);
  switch (country) {
    case "GB": return `https://www.amazon.co.uk/s?k=${k}`;
    case "AU": return `https://www.amazon.com.au/s?k=${k}`;
    case "CA": return `https://www.amazon.ca/s?k=${k}`;
    case "FR": return `https://www.amazon.fr/s?k=${k}`;
    case "DE": return `https://www.amazon.de/s?k=${k}`;
    case "INT": return `https://www.google.com/search?q=buy+${k}&tbm=shop`;
    default:   return `https://www.amazon.com/s?k=${k}`;
  }
}

function buildJewelryWatchKeywords(
  undertone: string,
  archetype: string,
  season?: string | null
): string[] {
  const lower = undertone.toLowerCase();
  const arcLower = archetype.toLowerCase();
  const seasonLower = season?.toLowerCase() ?? "";

  const seasonKeywords: string[] =
    seasonLower.includes("soft summer") || seasonLower.includes("soft autumn")
      ? ["delicate pearl necklace women", "silver fine jewelry women"]
      : seasonLower.includes("deep winter") || seasonLower.includes("dark winter")
      ? ["bold silver jewelry women", "sapphire drop earrings", "onyx ring"]
      : seasonLower.includes("bright spring") || seasonLower.includes("clear spring")
      ? ["colorful gemstone earrings", "gold jewelry bright stones"]
      : seasonLower.includes("warm spring") || seasonLower.includes("true spring")
      ? ["yellow gold dainty necklace", "coral gemstone jewelry"]
      : seasonLower.includes("warm autumn") || seasonLower.includes("true autumn")
      ? ["gold earthy jewelry women", "amber citrine necklace"]
      : [];

  const metalKeywords: string[] = lower.includes("warm")
    ? ["gold jewelry women", "rose gold earrings", "gold hoop earrings", "yellow gold necklace"]
    : lower.includes("cool")
    ? ["silver jewelry women", "sterling silver earrings", "white gold necklace", "platinum ring"]
    : ["two-tone jewelry women", "gold silver mixed jewelry", "versatile necklace women"];

  const styleKeywords: string[] = arcLower.includes("romantic") || arcLower.includes("feminine")
    ? ["pearl necklace women", "dainty gold necklace", "floral earrings"]
    : arcLower.includes("minimalist") || arcLower.includes("modern")
    ? ["minimalist jewelry set", "geometric pendant necklace", "thin gold band ring"]
    : arcLower.includes("edgy") || arcLower.includes("bold")
    ? ["statement cuff bracelet", "chunky chain necklace", "bold earrings women"]
    : arcLower.includes("boho") || arcLower.includes("earthy")
    ? ["layered necklace set", "turquoise bracelet", "boho earrings women"]
    : arcLower.includes("classic") || arcLower.includes("timeless")
    ? ["pearl strand necklace", "diamond stud earrings", "tennis bracelet women"]
    : ["stacking ring set women", "layered bracelet set", "pendant necklace women"];

  const watchKeywords: string[] = lower.includes("warm")
    ? arcLower.includes("minimalist")
      ? ["minimalist leather watch women gold"]
      : arcLower.includes("romantic")
      ? ["rose gold watch women dress"]
      : ["gold watch women leather strap"]
    : lower.includes("cool")
    ? ["silver mesh watch women", "stainless steel watch women minimalist"]
    : ["women watch gold silver two-tone"];

  const combined = [
    ...seasonKeywords.slice(0, 2),
    ...metalKeywords.slice(0, seasonKeywords.length > 0 ? 1 : 2),
    ...styleKeywords.slice(0, 2),
    ...watchKeywords.slice(0, 1),
  ];
  return combined.slice(0, 6);
}

function JewelryWatchKeywords({
  analysis,
  colors,
  country,
}: {
  analysis: NonNullable<ReturnType<typeof useAnalysis>["analysis"]>;
  colors: ReturnType<typeof useColors>;
  country: string;
}) {
  const archetypes =
    (analysis as { aesthetic_archetypes?: string[] }).aesthetic_archetypes?.join(", ") ??
    analysis.style_archetype;
  const season = (analysis as { color_season?: string }).color_season ?? null;
  const keywords = buildJewelryWatchKeywords(analysis.undertone, archetypes, season);
  if (!keywords.length) return null;
  return (
    <View style={styles.jwSection}>
      <View style={styles.jwHeader}>
        <Ionicons name="diamond-outline" size={15} color={colors.primary} />
        <Text style={[styles.jwTitle, { color: colors.foreground }]}>Jewelry & Watches for You</Text>
      </View>
      <Text style={[styles.jwSub, { color: colors.mutedForeground }]}>
        {analysis.undertone.toLowerCase().includes("warm")
          ? "Gold & warm tones"
          : analysis.undertone.toLowerCase().includes("cool")
          ? "Silver & cool tones"
          : "Versatile metals"} · tap to shop
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jwScroll}>
        {keywords.map((kw) => (
          <Pressable
            key={kw}
            onPress={() => openShopUrl(buildKeywordUrl(kw, country))}
            style={({ pressed }) => [
              styles.jwChip,
              { backgroundColor: pressed ? colors.primary + "22" : colors.card, borderColor: colors.primary + "35" },
            ]}
          >
            <Ionicons name="bag-outline" size={12} color={colors.primary} />
            <Text style={[styles.jwChipText, { color: colors.foreground }]}>{kw}</Text>
            <Ionicons name="open-outline" size={10} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const { country } = useCountry();
  const { isSaved, toggleSave, savedCount } = useWishlistProducts();

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const filtered = useMemo(() => {
    let list = PRODUCTS;
    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.reason.toLowerCase().includes(q) ||
          getProductUrl(p, country).retailer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery, country]);

  const featured = useMemo(() => filtered.filter((p) => p.featured), [filtered]);
  const newArrivals = useMemo(
    () => filtered.filter((p) => p.isNew && !p.featured).slice(0, 4),
    [filtered]
  );
  const regular = useMemo(
    () => filtered.filter((p) => !p.featured && !p.isNew),
    [filtered]
  );

  const openProduct = async (product: Product) => {
    await Haptics.selectionAsync();
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleSave = async (product: Product) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleSave(product.id);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={["#F5EDE3", "#FAF8F5"]}
          style={[styles.headerGrad, { paddingTop: topPad + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Shop</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                {analysis
                  ? `Curated for ${analysis.style_archetype}`
                  : `${PRODUCTS.length} products across ${CATEGORIES.length - 1} categories`}
              </Text>
            </View>
            <Pressable
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/wishlist");
              }}
              style={({ pressed }) => [
                styles.wishlistBtn,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name={savedCount > 0 ? "heart" : "heart-outline"}
                size={18}
                color={savedCount > 0 ? "#D45F5F" : colors.primary}
              />
              <Text style={[styles.wishlistBtnText, { color: colors.foreground }]}>
                {savedCount > 0 ? `${savedCount} Saved` : "Saved"}
              </Text>
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search products, categories…"
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </LinearGradient>

        {/* Personalized banner */}
        {analysis && !searchQuery && (
          <View style={styles.sectionPad}>
            <View style={[styles.personalBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.personalText, { color: colors.primary }]}>
                Curated for your {analysis.undertone.toLowerCase()} undertone · {analysis.face_shape.toLowerCase()} face shape
              </Text>
            </View>
          </View>
        )}

        {/* Shopping keywords */}
        {analysis?.shopping_keywords && analysis.shopping_keywords.length > 0 && !searchQuery && (
          <KeywordsSection keywords={analysis.shopping_keywords} colors={colors} country={country} />
        )}

        {/* Jewelry & watch keywords based on profile */}
        {analysis && !searchQuery && (
          <JewelryWatchKeywords analysis={analysis} colors={colors} country={country} />
        )}

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => {
            const count = cat === "All" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === cat).length;
            const active = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setActiveCategory(cat);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? colors.primary : colors.secondary,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                  {cat}
                </Text>
                <View style={[styles.filterCount, { backgroundColor: active ? "rgba(255,255,255,0.22)" : colors.primary + "20" }]}>
                  <Text style={[styles.filterCountText, { color: active ? colors.primaryForeground : colors.primary }]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Search results summary */}
        {searchQuery.trim() !== "" && (
          <View style={styles.sectionPad}>
            <Text style={[styles.searchResultsText, { color: colors.mutedForeground }]}>
              {filtered.length === 0
                ? `No results for "${searchQuery}"`
                : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchQuery}"`}
            </Text>
          </View>
        )}

        {filtered.length === 0 && searchQuery.trim() !== "" && (
          <View style={[styles.noResults, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.noResultsTitle, { color: colors.foreground }]}>Nothing found</Text>
            <Pressable onPress={() => setSearchQuery("")} style={[styles.noResultsBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.noResultsBtnText, { color: colors.primaryForeground }]}>Clear Search</Text>
            </Pressable>
          </View>
        )}

        {/* Curated Picks (featured) */}
        {featured.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>✦ Curated Picks</Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{featured.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featured.map((product) => (
                <FeaturedCard
                  key={product.id}
                  product={product}
                  colors={colors}
                  saved={isSaved(product.id)}
                  onPress={() => openProduct(product)}
                  onSave={() => handleSave(product)}
                  country={country}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && !searchQuery && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New Arrivals</Text>
                <View style={[styles.newBadge, { backgroundColor: "#4CAF50" }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{newArrivals.length}</Text>
            </View>
            <View style={styles.sectionPad}>
              {newArrivals.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  colors={colors}
                  saved={isSaved(product.id)}
                  onPress={() => openProduct(product)}
                  onSave={() => handleSave(product)}
                  country={country}
                />
              ))}
            </View>
          </>
        )}

        {/* All other products */}
        {regular.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {searchQuery ? "Results" : activeCategory === "All" ? "All Products" : activeCategory}
              </Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{regular.length}</Text>
            </View>
            <View style={styles.sectionPad}>
              {regular.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  colors={colors}
                  saved={isSaved(product.id)}
                  onPress={() => openProduct(product)}
                  onSave={() => handleSave(product)}
                  country={country}
                />
              ))}
            </View>
          </>
        )}

        {/* No analysis CTA */}
        {!analysis && !searchQuery && (
          <View style={styles.sectionPad}>
            <View style={[styles.promptCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
              <Text style={[styles.promptTitle, { color: colors.foreground }]}>Get personalized picks</Text>
              <Text style={[styles.promptDesc, { color: colors.mutedForeground }]}>
                Complete a style analysis to see products curated specifically for your features
              </Text>
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/upload");
                }}
                style={[styles.promptBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.promptBtnText, { color: colors.primaryForeground }]}>Analyze My Style</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={[styles.globalDisclosure, { color: colors.mutedForeground }]}>
          Veloura may earn a commission from purchases made through links in this app.
        </Text>
      </ScrollView>

      <ProductDetailModal
        product={selectedProduct}
        visible={modalVisible}
        saved={selectedProduct ? isSaved(selectedProduct.id) : false}
        onClose={() => setModalVisible(false)}
        onSave={() => selectedProduct && handleSave(selectedProduct)}
        colors={colors}
        country={country}
      />
    </View>
  );
}

function FeaturedCard({
  product,
  colors,
  saved,
  onPress,
  onSave,
  country,
}: {
  product: Product;
  colors: ReturnType<typeof useColors>;
  saved: boolean;
  onPress: () => void;
  onSave: () => void;
  country: string;
}) {
  const { retailer } = getProductUrl(product, country);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <LinearGradient
        colors={product.gradient}
        style={[styles.featCard, { borderColor: colors.border }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top row: icon + save */}
        <View style={styles.featTopRow}>
          <View style={[styles.featIcon, { backgroundColor: "rgba(255,255,255,0.72)" }]}>
            <Ionicons name={product.icon} size={26} color="#C4956A" />
          </View>
          <Pressable
            onPress={(e) => { e.stopPropagation(); onSave(); }}
            hitSlop={10}
            style={[styles.saveBtn, { backgroundColor: "rgba(255,255,255,0.75)" }]}
          >
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={17}
              color={saved ? "#D45F5F" : "#8B6B4A"}
            />
          </Pressable>
        </View>

        {/* Badges */}
        <View style={styles.featBadges}>
          <View style={[styles.catBadge, { backgroundColor: "rgba(255,255,255,0.72)" }]}>
            <Text style={[styles.catBadgeText, { color: "#C4956A" }]}>{product.category}</Text>
          </View>
          <PriceTierBadge tier={product.priceTier} />
          {product.isNew && <NewBadge />}
        </View>

        <Text style={[styles.featName, { color: "#2D1F14" }]}>{product.name}</Text>
        <Text style={[styles.featReason, { color: "#6B4C35" }]} numberOfLines={2}>
          {product.reason}
        </Text>

        <View style={styles.featFooter}>
          <View>
            <Text style={[styles.featPrice, { color: "#2D1F14" }]}>{product.price}</Text>
            <Text style={[styles.featRetailer, { color: "#6B4C35" }]}>{retailer}</Text>
          </View>
          <View style={[styles.featBtn, { backgroundColor: "#C4956A" }]}>
            <Text style={styles.featBtnText}>View</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function ProductRow({
  product,
  colors,
  saved,
  onPress,
  onSave,
  country,
}: {
  product: Product;
  colors: ReturnType<typeof useColors>;
  saved: boolean;
  onPress: () => void;
  onSave: () => void;
  country: string;
}) {
  const { retailer } = getProductUrl(product, country);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.productRow,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <LinearGradient colors={product.gradient} style={styles.productThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={product.icon} size={22} color="#C4956A" />
      </LinearGradient>

      <View style={styles.productInfo}>
        <View style={styles.productBadgeRow}>
          <View style={[styles.catBadgeSmall, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.catBadgeSmallText, { color: colors.primary }]}>{product.category}</Text>
          </View>
          {product.isNew && <NewBadge small />}
        </View>
        <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
        <Text style={[styles.productReason, { color: colors.mutedForeground }]} numberOfLines={1}>
          {product.reason}
        </Text>
      </View>

      <View style={styles.productRight}>
        <Text style={[styles.productPrice, { color: colors.foreground }]}>{product.price}</Text>
        <Text style={[styles.productRetailerText, { color: colors.mutedForeground }]}>{retailer}</Text>
        <View style={styles.productActions}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); onSave(); }}
            hitSlop={8}
            style={[styles.rowSaveBtn, { backgroundColor: saved ? "#FFF0F0" : colors.secondary }]}
          >
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={15}
              color={saved ? "#D45F5F" : colors.mutedForeground}
            />
          </Pressable>
          <View style={[styles.viewBtn, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.viewBtnText, { color: colors.primary }]}>View</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function PriceTierBadge({ tier }: { tier: PriceTier }) {
  const color = PRICE_TIER_COLORS[tier];
  return (
    <View style={[styles.tierBadge, { backgroundColor: color + "22", borderColor: color + "55" }]}>
      <Text style={[styles.tierBadgeText, { color }]}>{PRICE_TIER_LABELS[tier]}</Text>
    </View>
  );
}

function NewBadge({ small }: { small?: boolean }) {
  return (
    <View style={[styles.newDot, small && styles.newDotSmall]}>
      <Text style={[styles.newDotText, small && styles.newDotTextSmall]}>NEW</Text>
    </View>
  );
}

function KeywordsSection({
  keywords,
  colors,
  country,
}: {
  keywords: string[];
  colors: ReturnType<typeof useColors>;
  country: string;
}) {
  if (!keywords || keywords.length === 0) return null;
  return (
    <View style={styles.keywordsSection}>
      <View style={styles.keywordsHeader}>
        <Ionicons name="search-outline" size={15} color={colors.primary} />
        <Text style={[styles.keywordsTitle, { color: colors.foreground }]}>Shop Your Keywords</Text>
      </View>
      <Text style={[styles.keywordsSub, { color: colors.mutedForeground }]}>
        Aura picked these from your profile — tap to shop
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keywordsScroll}>
        {keywords.slice(0, 10).map((kw) => (
          <Pressable
            key={kw}
            onPress={() => openShopUrl(buildKeywordUrl(kw, country))}
            style={({ pressed }) => [
              styles.keywordChip,
              { backgroundColor: pressed ? colors.primary + "22" : colors.card, borderColor: colors.primary + "40" },
            ]}
          >
            <Ionicons name="cart-outline" size={13} color={colors.primary} />
            <Text style={[styles.keywordText, { color: colors.foreground }]}>{kw}</Text>
            <Ionicons name="open-outline" size={11} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function ProductDetailModal({
  product,
  visible,
  saved,
  onClose,
  onSave,
  colors,
  country,
}: {
  product: Product | null;
  visible: boolean;
  saved: boolean;
  onClose: () => void;
  onSave: () => void;
  colors: ReturnType<typeof useColors>;
  country: string;
}) {
  const insets = useSafeAreaInsets();
  if (!product) return null;

  const tierColor = PRICE_TIER_COLORS[product.priceTier];
  const { url: shopUrl, retailer } = getProductUrl(product, country);
  const retailerIcon = RETAILER_ICONS[retailer] ?? "open-outline";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          {/* Hero gradient */}
          <LinearGradient
            colors={product.gradient}
            style={styles.modalHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.modalHeroIcon, { backgroundColor: "rgba(255,255,255,0.72)" }]}>
              <Ionicons name={product.icon} size={44} color="#C4956A" />
            </View>
            {product.isNew && (
              <View style={styles.modalNewBadge}>
                <Text style={styles.modalNewText}>NEW</Text>
              </View>
            )}
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Badge row */}
            <View style={styles.modalBadgeRow}>
              <View style={[styles.modalCatBadge, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.modalCatText, { color: colors.primary }]}>{product.category}</Text>
              </View>
              <View style={[styles.tierBadge, { backgroundColor: tierColor + "18", borderColor: tierColor + "40" }]}>
                <Text style={[styles.tierBadgeText, { color: tierColor }]}>{PRICE_TIER_LABELS[product.priceTier]}</Text>
              </View>
              <View style={[styles.retailerBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Ionicons name={retailerIcon} size={11} color={colors.mutedForeground} />
                <Text style={[styles.retailerText, { color: colors.mutedForeground }]}>{retailer}</Text>
              </View>
            </View>

            <Text style={[styles.modalName, { color: colors.foreground }]}>{product.name}</Text>
            <Text style={[styles.modalPrice, { color: colors.primary }]}>{product.price}</Text>

            {/* Why it matches */}
            <View style={[styles.matchBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "28" }]}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.matchText, { color: colors.primary }]}>{product.reason}</Text>
            </View>

            <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>{product.description}</Text>

            {/* Highlights */}
            {product.highlights.length > 0 && (
              <View style={styles.highlightsRow}>
                {product.highlights.map((h) => (
                  <View key={h} style={[styles.highlightChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                    <Text style={[styles.highlightText, { color: colors.foreground }]}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={onSave}
                style={({ pressed }) => [
                  styles.saveFullBtn,
                  {
                    backgroundColor: saved ? "#FFF0F0" : colors.secondary,
                    borderColor: saved ? "#FFCDD2" : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name={saved ? "heart" : "heart-outline"} size={18} color={saved ? "#D45F5F" : colors.foreground} />
                <Text style={[styles.saveFullBtnText, { color: saved ? "#D45F5F" : colors.foreground }]}>
                  {saved ? "Saved" : "Save"}
                </Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  onClose();
                  setTimeout(() => { void openShopUrl(shopUrl); }, 300);
                }}
                style={({ pressed }) => [
                  styles.shopNowBtn,
                  { backgroundColor: colors.primary, flex: 1, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="bag-outline" size={17} color="#fff" />
                <Text style={styles.shopNowText}>Shop on {retailer}</Text>
                <Ionicons name="open-outline" size={14} color="rgba(255,255,255,0.75)" />
              </Pressable>
            </View>

            <Text style={[styles.disclosureNote, { color: colors.mutedForeground }]}>
              Opens {retailer} · prices vary by retailer
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 20, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },

  wishlistBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  wishlistBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 0 },

  sectionPad: { paddingHorizontal: 20, marginBottom: 8 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionCount: { fontSize: 12, fontFamily: "Inter_500Medium" },

  personalBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  personalText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  keywordsSection: { paddingHorizontal: 20, marginBottom: 12 },
  keywordsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  keywordsTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  keywordsSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  keywordsScroll: { gap: 8 },
  keywordChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  keywordText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  filterScroll: { paddingHorizontal: 20, gap: 8, paddingVertical: 16 },
  filterPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  filterCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  filterCountText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  searchResultsText: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  noResults: { marginHorizontal: 20, padding: 28, borderRadius: 18, borderWidth: 1, alignItems: "center", gap: 10, marginBottom: 16 },
  noResultsTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  noResultsBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  noResultsBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  newBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  newBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  newDot: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "#4CAF50" },
  newDotSmall: { paddingHorizontal: 5, paddingVertical: 1 },
  newDotText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.4 },
  newDotTextSmall: { fontSize: 8 },

  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  tierBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  // Featured cards
  featuredScroll: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  featCard: { width: CARD_W, padding: 16, borderRadius: 20, borderWidth: 1, gap: 10 },
  featTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  featIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  saveBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  featBadges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  catBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  featName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  featReason: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  featFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  featPrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  featRetailer: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  featBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  featBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },

  // Product rows
  productRow: { flexDirection: "row", alignItems: "center", padding: 13, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 12 },
  productThumb: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  productInfo: { flex: 1, gap: 4 },
  productBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  catBadgeSmall: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  catBadgeSmallText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  productReason: { fontSize: 12, fontFamily: "Inter_400Regular" },
  productRight: { alignItems: "flex-end", gap: 4 },
  productPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  productRetailerText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  productActions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  rowSaveBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  viewBtn: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10 },
  viewBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  // Prompt
  promptCard: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: "center", gap: 12, marginBottom: 16 },
  promptTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  promptDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  promptBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  promptBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  jwSection: { paddingHorizontal: 20, marginBottom: 12 },
  jwHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  jwTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  jwSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  jwScroll: { gap: 8 },
  jwChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  jwChipText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  globalDisclosure: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, maxHeight: height * 0.9 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHero: { height: 130, marginHorizontal: 20, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalHeroIcon: { width: 76, height: 76, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalNewBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "#4CAF50", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalNewText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  modalContent: { paddingHorizontal: 20 },
  modalBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  modalCatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalCatText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  retailerBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  retailerText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  modalName: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalPrice: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 12 },
  matchBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 11, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  matchText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modalDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 23, marginBottom: 14 },
  highlightsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  highlightChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  highlightText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  modalActions: { flexDirection: "row", gap: 10, marginBottom: 10 },
  saveFullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  saveFullBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  shopNowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16 },
  shopNowText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff", flex: 1, textAlign: "center" },
  disclosureNote: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", paddingBottom: 4, lineHeight: 16 },
});
