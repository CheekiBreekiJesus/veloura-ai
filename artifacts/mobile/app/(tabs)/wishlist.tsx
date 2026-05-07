import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useCountry } from "@/context/CountryContext";
import { useWishlistProducts } from "@/context/WishlistProductContext";
import { useColors } from "@/hooks/useColors";
import {
  PRICE_TIER_COLORS,
  PRICE_TIER_LABELS,
  PRODUCTS,
  RETAILER_ICONS,
  getProductUrl,
  type Product,
} from "@/data/products";

async function openShopUrl(url: string) {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: "#FAF8F5",
  });
}

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const { country } = useCountry();
  const { savedIds, isSaved, toggleSave, clearWishlist, savedCount } = useWishlistProducts();

  const [activeTab, setActiveTab] = useState<"saved" | "recs">("saved");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const savedProducts = useMemo(
    () => PRODUCTS.filter((p) => savedIds.has(p.id)),
    [savedIds]
  );

  const handleRemove = async (product: Product) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleSave(product.id);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear Wishlist",
      "Remove all saved products?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await clearWishlist();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Wishlist</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                {savedCount > 0 ? `${savedCount} saved product${savedCount !== 1 ? "s" : ""}` : "No saved products yet"}
              </Text>
            </View>
            {savedCount > 0 && (
              <Pressable
                onPress={handleClearAll}
                style={({ pressed }) => [
                  styles.clearBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="trash-outline" size={15} color="#F44336" />
                <Text style={[styles.clearBtnText, { color: "#F44336" }]}>Clear</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          {(["saved", "recs"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={async () => { await Haptics.selectionAsync(); setActiveTab(tab); }}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === tab ? colors.primary : colors.secondary,
                  borderColor: activeTab === tab ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={tab === "saved" ? "heart-outline" : "sparkles-outline"}
                size={15}
                color={activeTab === tab ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text style={[styles.tabBtnText, { color: activeTab === tab ? colors.primaryForeground : colors.foreground }]}>
                {tab === "saved" ? "Saved Products" : "Style Recs"}
              </Text>
              {tab === "saved" && savedCount > 0 && (
                <View style={[styles.tabCount, { backgroundColor: activeTab === "saved" ? "rgba(255,255,255,0.25)" : colors.primary + "22" }]}>
                  <Text style={[styles.tabCountText, { color: activeTab === "saved" ? colors.primaryForeground : colors.primary }]}>
                    {savedCount}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* ── SAVED PRODUCTS TAB ── */}
        {activeTab === "saved" && (
          <View style={styles.sectionPad}>
            {savedProducts.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
                  <Ionicons name="heart-outline" size={36} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing saved yet</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Tap the heart on any product in the Shop to save it here
                </Text>
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/(tabs)/shop");
                  }}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="bag-outline" size={16} color="#fff" />
                  <Text style={styles.emptyBtnText}>Browse Shop</Text>
                </Pressable>
              </View>
            ) : (
              savedProducts.map((product) => (
                <SavedProductCard
                  key={product.id}
                  product={product}
                  colors={colors}
                  country={country}
                  onRemove={() => handleRemove(product)}
                  onShop={() => openShopUrl(getProductUrl(product, country).url)}
                />
              ))
            )}
          </View>
        )}

        {/* ── STYLE RECS TAB ── */}
        {activeTab === "recs" && (
          <View style={styles.sectionPad}>
            {analysis ? (
              <>
                {/* Profile summary card */}
                <LinearGradient
                  colors={["#F5EDE3", "#EDE3D9"]}
                  style={[styles.summaryCard, { borderColor: colors.border }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.summaryRow}>
                    <View>
                      <Text style={[styles.summaryLabel, { color: "#8B6B4A" }]}>Your Archetype</Text>
                      <Text style={[styles.summaryValue, { color: "#2D1F14" }]}>{analysis.style_archetype}</Text>
                    </View>
                    <View style={styles.miniPalette}>
                      {analysis.color_palette.slice(0, 4).map((hex, i) => (
                        <View key={i} style={[styles.miniDot, { backgroundColor: hex }]} />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.summaryHint, { color: "#8B6B4A" }]}>
                    {analysis.face_shape} face · {analysis.undertone} undertone
                  </Text>
                </LinearGradient>

                {/* Beauty recs */}
                {analysis.beauty_recommendations.length > 0 && (
                  <>
                    <Text style={[styles.recSectionTitle, { color: colors.foreground }]}>Beauty</Text>
                    {analysis.beauty_recommendations.map((r, i) => (
                      <RecRow key={`beauty-${i}`} title={r} icon="sparkles-outline" category="Beauty" colors={colors} />
                    ))}
                  </>
                )}

                {/* Fashion recs */}
                {analysis.fashion_recommendations.slice(0, 3).length > 0 && (
                  <>
                    <Text style={[styles.recSectionTitle, { color: colors.foreground }]}>Fashion</Text>
                    {analysis.fashion_recommendations.slice(0, 3).map((r, i) => (
                      <RecRow key={`fashion-${i}`} title={r} icon="shirt-outline" category="Fashion" colors={colors} />
                    ))}
                  </>
                )}

                {/* Hair recs */}
                {analysis.hairstyle_suggestions.length > 0 && (
                  <>
                    <Text style={[styles.recSectionTitle, { color: colors.foreground }]}>Hairstyle</Text>
                    {analysis.hairstyle_suggestions.map((r, i) => (
                      <RecRow key={`hair-${i}`} title={r} icon="cut-outline" category="Hairstyle" colors={colors} />
                    ))}
                  </>
                )}

                {/* Glasses recs */}
                {analysis.glasses_suggestions.length > 0 && (
                  <>
                    <Text style={[styles.recSectionTitle, { color: colors.foreground }]}>Eyewear</Text>
                    {analysis.glasses_suggestions.map((r, i) => (
                      <RecRow key={`glasses-${i}`} title={r} icon="glasses-outline" category="Eyewear" colors={colors} />
                    ))}
                  </>
                )}
              </>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
                  <Ionicons name="sparkles-outline" size={36} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No style profile yet</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Complete a style analysis to get personalized recommendations
                </Text>
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/upload");
                  }}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.emptyBtnText}>Start Analysis</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SavedProductCard({
  product,
  colors,
  country,
  onRemove,
  onShop,
}: {
  product: Product;
  colors: ReturnType<typeof useColors>;
  country: string;
  onRemove: () => void;
  onShop: () => void;
}) {
  const tierColor = PRICE_TIER_COLORS[product.priceTier];
  const { retailer } = getProductUrl(product, country);
  const retailerIcon = RETAILER_ICONS[retailer] ?? "open-outline";

  return (
    <View style={[styles.savedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient colors={product.gradient} style={styles.savedThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={product.icon} size={26} color="#C4956A" />
      </LinearGradient>

      <View style={styles.savedInfo}>
        <View style={styles.savedBadgeRow}>
          <View style={[styles.catChip, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.catChipText, { color: colors.primary }]}>{product.category}</Text>
          </View>
          <View style={[styles.tierChip, { backgroundColor: tierColor + "18" }]}>
            <Text style={[styles.tierChipText, { color: tierColor }]}>{PRICE_TIER_LABELS[product.priceTier]}</Text>
          </View>
          {product.isNew && (
            <View style={styles.newChip}>
              <Text style={styles.newChipText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={[styles.savedName, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.savedReason, { color: colors.mutedForeground }]} numberOfLines={1}>{product.reason}</Text>

        <View style={styles.savedFooter}>
          <View style={styles.savedRetailerRow}>
            <Ionicons name={retailerIcon} size={11} color={colors.mutedForeground} />
            <Text style={[styles.savedRetailer, { color: colors.mutedForeground }]}>{retailer}</Text>
          </View>
          <Text style={[styles.savedPrice, { color: colors.primary }]}>{product.price}</Text>
        </View>
      </View>

      <View style={styles.savedActions}>
        <Pressable
          onPress={onShop}
          style={({ pressed }) => [styles.shopSmallBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="open-outline" size={14} color="#fff" />
          <Text style={styles.shopSmallBtnText}>Shop</Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingTop: 6 })}
        >
          <Ionicons name="heart" size={20} color="#D45F5F" />
        </Pressable>
      </View>
    </View>
  );
}

function RecRow({
  title,
  icon,
  category,
  colors,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  category: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.recRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.recIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.recInfo}>
        <View style={[styles.catChip, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[styles.catChipText, { color: colors.primary }]}>{category}</Text>
        </View>
        <Text style={[styles.recTitle, { color: colors.foreground }]} numberOfLines={3}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  clearBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  tabBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tabCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9 },
  tabCountText: { fontSize: 11, fontFamily: "Inter_700Bold" },

  sectionPad: { paddingHorizontal: 20, paddingBottom: 8 },

  emptyCard: { padding: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },

  savedCard: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12, gap: 12 },
  savedThumb: { width: 60, height: 60, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  savedInfo: { flex: 1, gap: 5 },
  savedBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  catChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  catChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  tierChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tierChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  newChip: { backgroundColor: "#4CAF50", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  newChipText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  savedName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  savedReason: { fontSize: 12, fontFamily: "Inter_400Regular" },
  savedFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  savedRetailerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  savedRetailer: { fontSize: 11, fontFamily: "Inter_400Regular" },
  savedPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  savedActions: { alignItems: "center", gap: 10, paddingTop: 2 },
  shopSmallBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12 },
  shopSmallBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },

  summaryCard: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 20 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  summaryValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  miniPalette: { flexDirection: "row", gap: 5 },
  miniDot: { width: 22, height: 22, borderRadius: 11 },
  summaryHint: { fontSize: 13, fontFamily: "Inter_400Regular" },

  recSectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 10, marginTop: 4 },
  recRow: { flexDirection: "row", alignItems: "center", padding: 13, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 12 },
  recIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  recInfo: { flex: 1, gap: 4 },
  recTitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
