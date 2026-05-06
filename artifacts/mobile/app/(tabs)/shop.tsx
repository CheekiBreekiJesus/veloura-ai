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
};

const BASE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Hydrating Serum",
    category: "Skincare",
    reason: "Boosts radiance for warm skin tones",
    price: "$48",
    icon: "water-outline",
    gradient: ["#FDECD3", "#F5D5B0"],
    featured: true,
  },
  {
    id: "2",
    name: "Soft Glow Foundation",
    category: "Makeup",
    reason: "Matches warm undertone perfectly",
    price: "$52",
    icon: "color-fill-outline",
    gradient: ["#F5EDE3", "#EDE3D9"],
  },
  {
    id: "3",
    name: "Terracotta Eyeshadow Palette",
    category: "Makeup",
    reason: "Complements your eye shape beautifully",
    price: "$64",
    icon: "layers-outline",
    gradient: ["#F0E4F5", "#DFC8EF"],
    featured: true,
  },
  {
    id: "4",
    name: "Silk Slip Dress",
    category: "Fashion",
    reason: "Flatters your face and style archetype",
    price: "$145",
    icon: "shirt-outline",
    gradient: ["#D9EEF5", "#B8DCEA"],
  },
  {
    id: "5",
    name: "Argan Oil Hair Mask",
    category: "Haircare",
    reason: "Nourishes and defines your hair type",
    price: "$34",
    icon: "cut-outline",
    gradient: ["#D9F5E4", "#B8EAD0"],
  },
  {
    id: "6",
    name: "Gold Oval Frames",
    category: "Eyewear",
    reason: "Balances and enhances your face shape",
    price: "$220",
    icon: "glasses-outline",
    gradient: ["#F5F0D9", "#EADCB8"],
    featured: true,
  },
  {
    id: "7",
    name: "Tinted Lip Balm",
    category: "Makeup",
    reason: "Enhances your natural lip shape",
    price: "$22",
    icon: "heart-outline",
    gradient: ["#FDECD3", "#F5D5B0"],
  },
  {
    id: "8",
    name: "Linen Blazer",
    category: "Fashion",
    reason: "Versatile piece for your wardrobe",
    price: "$178",
    icon: "shirt-outline",
    gradient: ["#D9EEF5", "#B8DCEA"],
  },
];

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const [activeCategory, setActiveCategory] = useState("All");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const filtered =
    activeCategory === "All"
      ? BASE_PRODUCTS
      : BASE_PRODUCTS.filter((p) => p.category === activeCategory);

  const featured = filtered.filter((p) => p.featured);
  const regular = filtered.filter((p) => !p.featured);

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
        </LinearGradient>

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

        {/* Personalized banner */}
        {analysis && activeCategory === "All" && (
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
                <ProductRow key={product.id} product={product} colors={colors} />
              ))}
            </View>
          </>
        )}

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
      </ScrollView>
    </View>
  );
}

function FeaturedCard({
  product,
  colors,
}: {
  product: Product;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={async () => {
        await Haptics.selectionAsync();
      }}
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
          <Text style={[styles.featPrice, { color: colors.foreground }]}>
            {product.price}
          </Text>
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
}: {
  product: Product;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={async () => {
        await Haptics.selectionAsync();
      }}
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
        <View style={[styles.viewBtn, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.viewBtnText, { color: colors.primary }]}>View</Text>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_W = width * 0.55;

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 20 },
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
  featBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  featBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
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
  productRight: { alignItems: "flex-end", gap: 6 },
  productPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  viewBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  viewBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  analysisPrompt: { paddingHorizontal: 20, paddingTop: 8 },
  promptCard: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: "center", gap: 12 },
  promptTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  promptDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  promptBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  promptBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
