import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
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
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const CATEGORIES = ["All", "Skincare", "Makeup", "Fashion", "Haircare", "Eyewear"];

type Product = {
  id: string;
  name: string;
  category: string;
  reason: string;
  price: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  gradient: [string, string];
  featured?: boolean;
  description: string;
  shopUrl: string;
  retailer: string;
};

// Build a search URL from a keyword (Amazon product search)
function buildKeywordUrl(keyword: string): string {
  const encoded = encodeURIComponent(keyword);
  return `https://www.amazon.com/s?k=${encoded}`;
}

// Open a URL in the in-app browser with haptic feedback
async function openShopUrl(url: string) {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: "#FAF8F5",
  });
}

const BASE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Hydrating Vitamin C Serum",
    category: "Skincare",
    reason: "Boosts radiance for warm skin tones",
    description:
      "A lightweight hyaluronic serum that deeply hydrates while enhancing your natural glow. Formulated with niacinamide and vitamin C to even skin tone and reduce dullness — ideal for warm, dewy skin looks.",
    price: "from $28",
    icon: "water-outline",
    gradient: ["#FDECD3", "#F5D5B0"],
    featured: true,
    shopUrl: "https://www.sephora.com/search?keyword=vitamin+c+hydrating+serum",
    retailer: "Sephora",
  },
  {
    id: "2",
    name: "Soft Glow Foundation",
    category: "Makeup",
    reason: "Matches warm undertone perfectly",
    description:
      "A buildable, skin-like foundation with a soft satin finish. Its undertone-adaptive formula means warm undertones get that golden, lit-from-within look without looking orange or flat.",
    price: "from $34",
    icon: "color-fill-outline",
    gradient: ["#F5EDE3", "#EDE3D9"],
    shopUrl: "https://www.sephora.com/search?keyword=soft+glow+foundation+warm+undertone",
    retailer: "Sephora",
  },
  {
    id: "3",
    name: "Terracotta Eyeshadow Palette",
    category: "Makeup",
    reason: "Complements your eye shape beautifully",
    description:
      "10 curated shades from champagne to rich rust, designed to sculpt and define any eye shape. Perfect for creating depth that enhances almond, hooded, or upturned eyes with ease.",
    price: "from $42",
    icon: "layers-outline",
    gradient: ["#F0E4F5", "#DFC8EF"],
    featured: true,
    shopUrl: "https://www.sephora.com/search?keyword=terracotta+eyeshadow+palette",
    retailer: "Sephora",
  },
  {
    id: "4",
    name: "Silk Slip Dress",
    category: "Fashion",
    reason: "Flatters your face and style archetype",
    description:
      "A luxurious slip dress cut on the bias for a fluid, flattering silhouette. The clean lines balance structured faces while the silky drape adds elegance — a wardrobe essential for the Modern Romantic.",
    price: "from $60",
    icon: "shirt-outline",
    gradient: ["#D9EEF5", "#B8DCEA"],
    shopUrl: "https://www.asos.com/search/?q=silk+slip+dress",
    retailer: "ASOS",
  },
  {
    id: "5",
    name: "Argan Oil Hair Mask",
    category: "Haircare",
    reason: "Nourishes and defines your hair type",
    description:
      "A rich weekly treatment infused with pure argan oil and keratin proteins. Reduces frizz, enhances natural wave pattern, and adds long-lasting shine — perfect for fine wavy to thick curly hair types.",
    price: "from $18",
    icon: "cut-outline",
    gradient: ["#D9F5E4", "#B8EAD0"],
    shopUrl: "https://www.amazon.com/s?k=argan+oil+hair+mask",
    retailer: "Amazon",
  },
  {
    id: "6",
    name: "Gold Oval Frames",
    category: "Eyewear",
    reason: "Balances and enhances your face shape",
    description:
      "Timeless oval frames in warm gold-tone metal. The soft curves complement angular jawlines while the gold tone harmonizes with warm undertones for a polished, editorial look.",
    price: "from $95",
    icon: "glasses-outline",
    gradient: ["#F5F0D9", "#EADCB8"],
    featured: true,
    shopUrl: "https://www.warbyparker.com/eyeglasses/women/oval",
    retailer: "Warby Parker",
  },
  {
    id: "7",
    name: "Tinted Lip Balm",
    category: "Makeup",
    reason: "Enhances your natural lip shape",
    description:
      "A sheer, buildable tint that gives your lips the perfect wash of color while keeping them moisturized. Available in terracotta, rose, and berry — all flattering for warm and neutral undertones.",
    price: "from $14",
    icon: "heart-outline",
    gradient: ["#FDECD3", "#F5D5B0"],
    shopUrl: "https://www.sephora.com/search?keyword=tinted+lip+balm+warm",
    retailer: "Sephora",
  },
  {
    id: "8",
    name: "Linen Blazer",
    category: "Fashion",
    reason: "Versatile piece for your wardrobe",
    description:
      "A perfectly cut linen blazer that works for everything from brunch to boardroom. The relaxed, unstructured silhouette suits most body types while projecting effortless polished style.",
    price: "from $55",
    icon: "shirt-outline",
    gradient: ["#D9EEF5", "#B8DCEA"],
    shopUrl: "https://www.asos.com/search/?q=linen+blazer+women",
    retailer: "ASOS",
  },
];

// ── Retailer icon helper ──────────────────────────────────────────────────────

const RETAILER_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  Sephora: "flower-outline",
  Amazon: "cart-outline",
  ASOS: "bag-outline",
  "Warby Parker": "glasses-outline",
};

function RetailerBadge({
  retailer,
  colors,
}: {
  retailer: string;
  colors: ReturnType<typeof useColors>;
}) {
  const icon = RETAILER_ICONS[retailer] ?? "open-outline";
  return (
    <View style={[styles.retailerBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <Ionicons name={icon} size={12} color={colors.mutedForeground} />
      <Text style={[styles.retailerText, { color: colors.mutedForeground }]}>{retailer}</Text>
    </View>
  );
}

// ── Product Detail Modal ──────────────────────────────────────────────────────

function ProductDetailModal({
  product,
  visible,
  onClose,
  colors,
}: {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const insets = useSafeAreaInsets();
  if (!product) return null;

  const handleShopNow = async () => {
    onClose();
    // Small delay so the modal closes before browser opens
    setTimeout(() => {
      openShopUrl(product.shopUrl);
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Drag handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          {/* Product hero */}
          <LinearGradient
            colors={product.gradient}
            style={styles.modalHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.modalHeroIcon, { backgroundColor: "rgba(255,255,255,0.7)" }]}>
              <Ionicons name={product.icon} size={40} color="#C4956A" />
            </View>
          </LinearGradient>

          <View style={styles.modalContent}>
            {/* Category + retailer row */}
            <View style={styles.modalBadgeRow}>
              <View style={[styles.modalCatBadge, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.modalCatText, { color: colors.primary }]}>
                  {product.category}
                </Text>
              </View>
              <RetailerBadge retailer={product.retailer} colors={colors} />
            </View>

            <Text style={[styles.modalName, { color: colors.foreground }]}>
              {product.name}
            </Text>

            <Text style={[styles.modalPrice, { color: colors.primary }]}>
              {product.price}
            </Text>

            {/* Why it matches */}
            <View style={[styles.matchBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "28" }]}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.matchText, { color: colors.primary }]}>
                {product.reason}
              </Text>
            </View>

            <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
              {product.description}
            </Text>

            {/* CTA */}
            <Pressable
              onPress={handleShopNow}
              style={({ pressed }) => [
                styles.shopNowBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="bag-outline" size={18} color={colors.primaryForeground} />
              <Text style={[styles.shopNowText, { color: colors.primaryForeground }]}>
                Shop on {product.retailer}
              </Text>
              <Ionicons name="open-outline" size={15} color={colors.primaryForeground} />
            </Pressable>

            <Text style={[styles.disclosureNote, { color: colors.mutedForeground }]}>
              Opens {product.retailer} · prices vary by retailer
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Shopping keywords section ─────────────────────────────────────────────────

function KeywordsSection({
  keywords,
  colors,
}: {
  keywords: string[];
  colors: ReturnType<typeof useColors>;
}) {
  if (!keywords || keywords.length === 0) return null;

  return (
    <View style={styles.keywordsSection}>
      <View style={styles.keywordsHeader}>
        <Ionicons name="search-outline" size={16} color={colors.primary} />
        <Text style={[styles.keywordsTitle, { color: colors.foreground }]}>
          Shop Your Keywords
        </Text>
      </View>
      <Text style={[styles.keywordsSub, { color: colors.mutedForeground }]}>
        Aura picked these search terms from your profile — tap to shop
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.keywordsScroll}
      >
        {keywords.slice(0, 10).map((keyword) => (
          <Pressable
            key={keyword}
            onPress={() => openShopUrl(buildKeywordUrl(keyword))}
            style={({ pressed }) => [
              styles.keywordChip,
              {
                backgroundColor: pressed ? colors.primary + "22" : colors.card,
                borderColor: colors.primary + "40",
              },
            ]}
          >
            <Ionicons name="cart-outline" size={13} color={colors.primary} />
            <Text style={[styles.keywordText, { color: colors.foreground }]}>
              {keyword}
            </Text>
            <Ionicons name="open-outline" size={11} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const filtered =
    activeCategory === "All"
      ? BASE_PRODUCTS
      : BASE_PRODUCTS.filter((p) => p.category === activeCategory);

  const featured = filtered.filter((p) => p.featured);
  const regular = filtered.filter((p) => !p.featured);

  const openProduct = async (product: Product) => {
    await Haptics.selectionAsync();
    setSelectedProduct(product);
    setModalVisible(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
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
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                Shop
              </Text>
              {analysis ? (
                <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                  Curated for {analysis.style_archetype}
                </Text>
              ) : (
                <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                  Products for every style
                </Text>
              )}
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
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
              <Text style={[styles.wishlistBtnText, { color: colors.foreground }]}>Saved</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Personalized banner */}
        {analysis && (
          <View style={styles.sectionPad}>
            <View
              style={[
                styles.personalBanner,
                { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
              ]}
            >
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.personalText, { color: colors.primary }]}>
                Products selected based on your {analysis.undertone.toLowerCase()} undertone and {analysis.face_shape.toLowerCase()} face shape
              </Text>
            </View>
          </View>
        )}

        {/* Shopping keywords from analysis */}
        {analysis?.shopping_keywords && analysis.shopping_keywords.length > 0 && (
          <KeywordsSection
            keywords={analysis.shopping_keywords}
            colors={colors}
          />
        )}

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={async () => {
                await Haptics.selectionAsync();
                setActiveCategory(cat);
              }}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeCategory === cat ? colors.primary : colors.secondary,
                  borderColor:
                    activeCategory === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeCategory === cat
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Featured products */}
        {featured.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                ✦ Curated Picks
              </Text>
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
                  onPress={() => openProduct(product)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Regular products */}
        {regular.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                All Products
              </Text>
            </View>
            <View style={styles.sectionPad}>
              {regular.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  colors={colors}
                  onPress={() => openProduct(product)}
                />
              ))}
            </View>
          </>
        )}

        {/* No analysis CTA */}
        {!analysis && (
          <View style={styles.analysisPrompt}>
            <View
              style={[
                styles.promptCard,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
              <Text style={[styles.promptTitle, { color: colors.foreground }]}>
                Get personalized picks
              </Text>
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
                <Text style={[styles.promptBtnText, { color: colors.primaryForeground }]}>
                  Analyze My Style
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Disclosure */}
        <Text style={[styles.globalDisclosure, { color: colors.mutedForeground }]}>
          Veloura earns no commission — links open retailer search results directly
        </Text>
      </ScrollView>

      <ProductDetailModal
        product={selectedProduct}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        colors={colors}
      />
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeaturedCard({
  product,
  colors,
  onPress,
}: {
  product: Product;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <LinearGradient
        colors={product.gradient}
        style={[styles.featCard, { borderColor: colors.border }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.featIcon, { backgroundColor: "rgba(255,255,255,0.7)" }]}>
          <Ionicons name={product.icon} size={28} color={colors.primary} />
        </View>
        <View style={[styles.featCatBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.featCatText, { color: colors.primary }]}>
            {product.category}
          </Text>
        </View>
        <Text style={[styles.featName, { color: colors.foreground }]}>
          {product.name}
        </Text>
        <Text style={[styles.featReason, { color: colors.mutedForeground }]} numberOfLines={2}>
          {product.reason}
        </Text>
        <View style={styles.featFooter}>
          <View>
            <Text style={[styles.featPrice, { color: colors.foreground }]}>
              {product.price}
            </Text>
            <Text style={[styles.featRetailer, { color: colors.mutedForeground }]}>
              {product.retailer}
            </Text>
          </View>
          <View style={[styles.featBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.featBtnText, { color: colors.primaryForeground }]}>
              View
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function ProductRow({
  product,
  colors,
  onPress,
}: {
  product: Product;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.productRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={product.gradient}
        style={styles.productThumb}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={product.icon} size={22} color={colors.primary} />
      </LinearGradient>
      <View style={styles.productInfo}>
        <View style={[styles.catBadge, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[styles.catBadgeText, { color: colors.primary }]}>
            {product.category}
          </Text>
        </View>
        <Text style={[styles.productName, { color: colors.foreground }]}>
          {product.name}
        </Text>
        <Text style={[styles.productReason, { color: colors.mutedForeground }]} numberOfLines={1}>
          {product.reason}
        </Text>
      </View>
      <View style={styles.productRight}>
        <Text style={[styles.productPrice, { color: colors.foreground }]}>
          {product.price}
        </Text>
        <Text style={[styles.productRetailer, { color: colors.mutedForeground }]}>
          {product.retailer}
        </Text>
        <View style={[styles.viewBtn, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.viewBtnText, { color: colors.primary }]}>View</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_W = width * 0.55;

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wishlistBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  wishlistBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  filterScroll: { paddingHorizontal: 20, gap: 8, paddingVertical: 16 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionPad: { paddingHorizontal: 20, marginBottom: 8 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  personalBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  personalText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  // Keywords section
  keywordsSection: { paddingHorizontal: 20, marginBottom: 8 },
  keywordsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  keywordsTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  keywordsSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  keywordsScroll: { gap: 8 },
  keywordChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  keywordText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  // Featured
  featuredScroll: { paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  featCard: {
    width: CARD_W,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  featIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  featCatBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  featCatText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  featName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  featReason: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  featFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  featPrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  featRetailer: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  featBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  featBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Product row
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  productThumb: { width: 54, height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  productInfo: { flex: 1, gap: 4 },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  productReason: { fontSize: 12, fontFamily: "Inter_400Regular" },
  productRight: { alignItems: "flex-end", gap: 4 },
  productPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  productRetailer: { fontSize: 11, fontFamily: "Inter_400Regular" },
  viewBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  viewBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  // No analysis prompt
  analysisPrompt: { paddingHorizontal: 20, paddingTop: 8 },
  promptCard: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: "center", gap: 12 },
  promptTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  promptDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  promptBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  promptBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Global disclosure
  globalDisclosure: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    lineHeight: 16,
  },

  // Retailer badge
  retailerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  retailerText: { fontSize: 11, fontFamily: "Inter_500Medium" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: height * 0.85,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHero: {
    height: 120,
    marginHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: { paddingHorizontal: 20, gap: 12 },
  modalBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalCatBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  modalCatText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  modalPrice: { fontSize: 20, fontFamily: "Inter_700Bold" },
  matchBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  modalDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  shopNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 4,
  },
  shopNowText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  disclosureNote: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -4 },
});
