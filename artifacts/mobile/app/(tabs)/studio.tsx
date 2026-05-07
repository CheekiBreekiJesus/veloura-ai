import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { PRODUCTS, type Product } from "@/data/products";

const { width } = Dimensions.get("window");

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

const MAKEUP_PRODUCTS = PRODUCTS.filter((p) => p.category === "Makeup");

function productEmoji(product: Product): string {
  const n = product.name.toLowerCase();
  if (n.includes("lip") || n.includes("tint")) return "💄";
  if (n.includes("eye") || n.includes("shadow") || n.includes("mascara")) return "👁️";
  if (n.includes("brow")) return "✨";
  if (n.includes("blush") || n.includes("highlight")) return "🌸";
  if (n.includes("contour")) return "🖌️";
  if (n.includes("foundation") || n.includes("glow")) return "🎨";
  return "💋";
}

function ProductCard({
  product,
  selected,
  onPress,
  colors,
}: {
  product: Product;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.lookCard,
        {
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={product.gradient}
        style={styles.lookCardGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.lookEmoji}>{productEmoji(product)}</Text>
        {selected && (
          <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </LinearGradient>
      <View style={[styles.lookCardBody, { backgroundColor: colors.card }]}>
        <Text style={[styles.lookName, { color: colors.foreground }]} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={[styles.lookDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {product.reason}
        </Text>
      </View>
    </Pressable>
  );
}

export default function StudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri } = useAnalysis();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedToken, setCachedToken] = useState<{ token: string; expiresAt: number } | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  async function getToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
    const res = await fetch(`${BASE_URL}/api/auth/token`);
    if (!res.ok) throw new Error("Could not obtain auth token");
    const { token } = (await res.json()) as { token: string };
    setCachedToken({ token, expiresAt: Date.now() + 8 * 60 * 1000 });
    return token;
  }

  const handleGenerate = async () => {
    if (!selectedProduct || !imageUri) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    setError(null);
    setResultBase64(null);
    setShowBefore(false);

    try {
      const token = await getToken();

      const base64match = imageUri.match(/^data:([^;]+);base64,(.+)$/);
      let imageBase64: string;
      let mimeType: string;

      if (base64match) {
        mimeType = base64match[1];
        imageBase64 = base64match[2];
      } else {
        throw new Error("No selfie image available. Please run a selfie analysis first.");
      }

      const res = await fetch(`${BASE_URL}/api/makeup-try-on`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          productName: selectedProduct.name,
          productCategory: selectedProduct.category,
          productDescription: selectedProduct.description,
          profile: analysis ?? {},
        }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? "Preview generation failed");
      }

      const data = (await res.json()) as { resultImageBase64: string; mimeType: string };
      setResultBase64(data.resultImageBase64);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!resultBase64) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow access to save the image to your camera roll.");
        return;
      }
      const fileUri = `${FileSystem.cacheDirectory}veloura_studio_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, resultBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await MediaLibrary.saveToLibraryAsync(fileUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Your makeup preview has been saved to your camera roll.");
    } catch {
      Alert.alert("Save failed", "Could not save the image. Please try again.");
    }
  };

  const handleReset = async () => {
    await Haptics.selectionAsync();
    setResultBase64(null);
    setShowBefore(false);
    setError(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={["#F5EDE3", colors.background]}
          style={[styles.header, { paddingTop: topPad + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Beauty Studio</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                AI-powered makeup preview
              </Text>
            </View>
            <View
              style={[
                styles.headerBadge,
                { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" },
              ]}
            >
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text style={[styles.headerBadgeText, { color: colors.primary }]}>AI Preview</Text>
            </View>
          </View>
        </LinearGradient>

        {/* No analysis gate */}
        {!analysis ? (
          <View style={styles.gateContainer}>
            <View
              style={[styles.gateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <LinearGradient
                colors={["#F5EDE3", "#EDE3D9"]}
                style={styles.gateIllustration}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="color-palette-outline" size={52} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.gateTitle, { color: colors.foreground }]}>
                Unlock Beauty Studio
              </Text>
              <Text style={[styles.gateBody, { color: colors.mutedForeground }]}>
                Complete your selfie analysis to try on makeup looks personalised to your coloring
                and features.
              </Text>
              <Pressable
                onPress={() => router.push("/upload")}
                style={({ pressed }) => [
                  styles.gateCta,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="camera-outline" size={18} color={colors.primaryForeground} />
                <Text style={[styles.gateCtaText, { color: colors.primaryForeground }]}>
                  Start Selfie Analysis
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {/* Preview panel */}
            <View style={styles.previewPanel}>
              <View
                style={[
                  styles.previewCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {resultBase64 ? (
                  <>
                    <View style={styles.previewImageWrap}>
                      <Image
                        source={{
                          uri: showBefore
                            ? imageUri ?? undefined
                            : `data:image/png;base64,${resultBase64}`,
                        }}
                        style={styles.previewImage}
                        contentFit="cover"
                      />
                      <View style={[styles.previewLabel, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                        <Ionicons
                          name={showBefore ? "person-outline" : "sparkles"}
                          size={12}
                          color="#fff"
                        />
                        <Text style={styles.previewLabelText}>
                          {showBefore ? "Original" : selectedProduct?.name ?? "Preview"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.resultActions}>
                      <Pressable
                        onPress={async () => {
                          await Haptics.selectionAsync();
                          setShowBefore((v) => !v);
                        }}
                        style={[
                          styles.toggleBtn,
                          { backgroundColor: colors.secondary, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="swap-horizontal-outline"
                          size={16}
                          color={colors.foreground}
                        />
                        <Text style={[styles.toggleBtnText, { color: colors.foreground }]}>
                          {showBefore ? "Show Preview" : "Show Original"}
                        </Text>
                      </Pressable>

                      {Platform.OS !== "web" && (
                        <Pressable
                          onPress={handleSave}
                          style={({ pressed }) => [
                            styles.saveBtn,
                            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                          ]}
                        >
                          <Ionicons
                            name="download-outline"
                            size={16}
                            color={colors.primaryForeground}
                          />
                          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                            Save
                          </Text>
                        </Pressable>
                      )}

                      <Pressable
                        onPress={handleReset}
                        style={[
                          styles.resetBtn,
                          { backgroundColor: colors.secondary, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons name="refresh-outline" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    </View>

                    <View style={[styles.disclaimerRow, { backgroundColor: colors.secondary }]}>
                      <Ionicons
                        name="information-circle-outline"
                        size={13}
                        color={colors.mutedForeground}
                      />
                      <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
                        AI-generated artistic preview — results vary from real application
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.previewPlaceholder}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.previewPlaceholderImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.previewPlaceholderImage,
                          { backgroundColor: colors.secondary },
                        ]}
                      />
                    )}
                    <LinearGradient
                      colors={["transparent", colors.card]}
                      style={styles.placeholderFade}
                    />
                    <View style={styles.placeholderOverlay}>
                      {generating ? (
                        <>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={[styles.generatingText, { color: colors.foreground }]}>
                            Applying your look…
                          </Text>
                          <Text style={[styles.generatingHint, { color: colors.mutedForeground }]}>
                            This may take 20–40 seconds
                          </Text>
                        </>
                      ) : (
                        <>
                          <View
                            style={[styles.placeholderIcon, { backgroundColor: colors.card }]}
                          >
                            <Ionicons
                              name="color-palette-outline"
                              size={32}
                              color={colors.primary}
                            />
                          </View>
                          <Text style={[styles.placeholderText, { color: colors.foreground }]}>
                            {selectedProduct
                              ? `Ready to preview "${selectedProduct.name}"`
                              : "Choose a product below"}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {error && (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={17} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text>
              </View>
            )}

            {/* Generate button */}
            {!resultBase64 && (
              <View style={styles.generateWrap}>
                <Pressable
                  onPress={handleGenerate}
                  disabled={!selectedProduct || generating}
                  style={({ pressed }) => [
                    styles.generateBtn,
                    {
                      backgroundColor: !selectedProduct
                        ? colors.muted
                        : pressed
                          ? colors.primary + "cc"
                          : colors.primary,
                      opacity: generating ? 0.8 : 1,
                    },
                  ]}
                >
                  {generating ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.generateBtnText}>Generating…</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="sparkles"
                        size={18}
                        color={!selectedProduct ? colors.mutedForeground : "#fff"}
                      />
                      <Text
                        style={[
                          styles.generateBtnText,
                          { color: !selectedProduct ? colors.mutedForeground : "#fff" },
                        ]}
                      >
                        {selectedProduct
                          ? `Preview ${selectedProduct.name}`
                          : "Select a product first"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Makeup Products ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Makeup Products
              </Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                Select a product to see it virtually applied to your selfie
              </Text>

              <View style={styles.looksGrid}>
                {MAKEUP_PRODUCTS.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selected={selectedProduct?.id === product.id}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      setSelectedProduct((prev) =>
                        prev?.id === product.id ? null : product
                      );
                      if (resultBase64) {
                        setResultBase64(null);
                        setShowBefore(false);
                      }
                    }}
                    colors={colors}
                  />
                ))}
              </View>
            </View>

            {/* ── Hair — Coming Soon ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hair Try-On</Text>
              <LinearGradient
                colors={["#F5EDE3", "#EDE3D9"]}
                style={[styles.comingSoonCard, { borderColor: colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.comingSoonIcon, { backgroundColor: colors.card }]}>
                  <Ionicons name="cut-outline" size={34} color={colors.primary} />
                </View>
                <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>
                  Coming Soon
                </Text>
                <Text style={[styles.comingSoonBody, { color: colors.mutedForeground }]}>
                  Virtual hair color and style previews tailored to your face shape and skin
                  undertone are on their way.
                </Text>
                <View
                  style={[
                    styles.comingSoonBadge,
                    {
                      backgroundColor: colors.primary + "18",
                      borderColor: colors.primary + "30",
                    },
                  ]}
                >
                  <Text style={[styles.comingSoonBadgeText, { color: colors.primary }]}>
                    Notify me when available
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  gateContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  gateCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 28,
  },
  gateIllustration: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  gateTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 20 },
  gateBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
    paddingHorizontal: 24,
  },
  gateCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  gateCtaText: { fontSize: 15, fontFamily: "Inter_700Bold" },

  previewPanel: { paddingHorizontal: 18, marginTop: 16 },
  previewCard: { borderRadius: 28, borderWidth: 1, overflow: "hidden" },
  previewImageWrap: { height: 340, position: "relative" },
  previewImage: { width: "100%", height: "100%" },
  previewLabel: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewLabelText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },

  resultActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
  toggleBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  saveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resetBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },

  disclaimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    margin: 14,
    marginTop: 0,
    borderRadius: 12,
  },
  disclaimerText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

  previewPlaceholder: { height: 300, position: "relative", overflow: "hidden" },
  previewPlaceholderImage: { ...StyleSheet.absoluteFillObject },
  placeholderFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  generatingText: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  generatingHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 18,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },

  generateWrap: { paddingHorizontal: 18, marginTop: 14 },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
  },
  generateBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

  section: { marginTop: 24, paddingBottom: 4 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginHorizontal: 18,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginHorizontal: 18,
    marginBottom: 14,
    lineHeight: 18,
  },

  looksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 18,
    gap: 12,
  },

  lookCard: {
    width: (width - 48) / 2,
    borderRadius: 20,
    overflow: "hidden",
  },
  lookCardGrad: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lookEmoji: { fontSize: 36 },
  selectedCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lookCardBody: {
    padding: 12,
    gap: 4,
  },
  lookName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  lookDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

  comingSoonCard: {
    marginHorizontal: 18,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    padding: 28,
    gap: 12,
  },
  comingSoonIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  comingSoonBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  comingSoonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  comingSoonBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
