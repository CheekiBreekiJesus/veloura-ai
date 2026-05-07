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

const { width } = Dimensions.get("window");

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

type MakeupCategory = "Eyes" | "Lips" | "Face" | "Full Look";

type MakeupLook = {
  name: string;
  category: MakeupCategory;
  description: string;
  promptFragment: string;
  gradient: [string, string];
  emoji: string;
};

const MAKEUP_LOOKS: MakeupLook[] = [
  {
    name: "Natural Smoke",
    category: "Eyes",
    description: "Soft taupe and brown shadow with a subtle liner",
    promptFragment:
      "a natural smoky eye with blended taupe and warm brown eyeshadow, thin brown liner, mascara-coated lashes, and brushed-up brows",
    gradient: ["#D9C4B8", "#B8A090"],
    emoji: "🤎",
  },
  {
    name: "Glam Smoky Eye",
    category: "Eyes",
    description: "Dramatic charcoal-black shadow with intense lashes",
    promptFragment:
      "a dramatic glamorous smoky eye with deep charcoal and black eyeshadow perfectly blended, bold winged liner, dramatic volumized lashes, sharp brows",
    gradient: ["#3A3431", "#1A1210"],
    emoji: "🖤",
  },
  {
    name: "Cut Crease",
    category: "Eyes",
    description: "Sharp editorial cut crease with champagne lid",
    promptFragment:
      "a precise editorial cut crease eye look with champagne shimmer on the lid, sharp deep brown crease line, lower lash liner, and fluttery lashes",
    gradient: ["#EAD5A0", "#C4A86A"],
    emoji: "✨",
  },
  {
    name: "Colorful Liner",
    category: "Eyes",
    description: "Graphic teal or violet liner pop",
    promptFragment:
      "a graphic colored liner look with a bold teal or violet liner wing on upper lids, minimal base, clean skin, and mascara",
    gradient: ["#B8D5EA", "#7AB0D4"],
    emoji: "🎨",
  },
  {
    name: "Nude MLBB",
    category: "Lips",
    description: "My-lips-but-better satin nude",
    promptFragment:
      "a perfectly lined satin nude lip that is slightly deeper than natural skin tone, glossy center, no eyeshadow, fresh skin",
    gradient: ["#D4A88A", "#B8846A"],
    emoji: "🤍",
  },
  {
    name: "Classic Red",
    category: "Lips",
    description: "Timeless matte red with clean edges",
    promptFragment:
      "a bold classic matte red lip, sharply lined, full coverage, paired with clean dewy skin and minimal eye makeup",
    gradient: ["#C4504A", "#9A2E2A"],
    emoji: "❤️",
  },
  {
    name: "Berry Glam",
    category: "Lips",
    description: "Deep berry with a glossy finish",
    promptFragment:
      "a rich deep berry lip with a glossy sheen, overlined slightly for fullness, paired with peachy blush and neutral eye",
    gradient: ["#8B3A5C", "#5A2040"],
    emoji: "🍇",
  },
  {
    name: "Coral Pop",
    category: "Lips",
    description: "Warm coral-orange lip for summer glow",
    promptFragment:
      "a vibrant warm coral-orange lip gloss, paired with bronzed glowing skin and natural eyes",
    gradient: ["#E8835A", "#C4573A"],
    emoji: "🍊",
  },
  {
    name: "Dewy Skin Glow",
    category: "Face",
    description: "Glass skin with lit-from-within luminosity",
    promptFragment:
      "glass skin makeup with extreme dewy luminosity, no-makeup foundation, subtle highlighter on cheekbones and nose bridge, barely-there nude lip, and soft natural brows",
    gradient: ["#FDECD3", "#F5D5B0"],
    emoji: "🌟",
  },
  {
    name: "Sun-Kissed Bronze",
    category: "Face",
    description: "Bronzed goddess with warm terracotta tones",
    promptFragment:
      "sun-kissed bronze makeup with terracotta blush swept across cheeks and nose, warm bronzer, peachy lip, golden highlighter on cheekbones",
    gradient: ["#C4956A", "#A07040"],
    emoji: "☀️",
  },
  {
    name: "Porcelain Matte",
    category: "Face",
    description: "Flawless matte finish with sculpted definition",
    promptFragment:
      "flawless matte porcelain skin with contour sculpting on cheeks and jawline, soft rosy blush, matte setting powder finish, subtle highlight",
    gradient: ["#F0E8E0", "#D8CCBC"],
    emoji: "🤍",
  },
  {
    name: "Romantic Date Night",
    category: "Full Look",
    description: "Soft glam for an intimate evening",
    promptFragment:
      "romantic soft glam makeup with rosy blush, champagne shimmer eyes with brown liner and fluffy lashes, and a glossy rose-nude lip",
    gradient: ["#F5D5D5", "#E8A0B0"],
    emoji: "🌹",
  },
  {
    name: "Editorial Glam",
    category: "Full Look",
    description: "High-fashion bold look, runway-ready",
    promptFragment:
      "high-fashion editorial makeup with graphic black liner sculpture, bold monochromatic deep plum eye and lip, sculpted contour, and glossy skin",
    gradient: ["#4A3460", "#2E1A40"],
    emoji: "💫",
  },
  {
    name: "Office Chic",
    category: "Full Look",
    description: "Polished and professional daytime look",
    promptFragment:
      "polished professional makeup with light coverage skin-like foundation, subtle taupe shimmer eye, peachy-nude lip, and precise brows",
    gradient: ["#D8C8B8", "#B8A898"],
    emoji: "💼",
  },
  {
    name: "Holiday Glam",
    category: "Full Look",
    description: "Festive sparkle with gold accents",
    promptFragment:
      "festive holiday glam makeup with gold glitter cut crease, bold red lip, strobe highlight on cheekbones, and dramatic lashes",
    gradient: ["#C4A84A", "#8B6A1A"],
    emoji: "✨",
  },
];

const CATEGORIES: MakeupCategory[] = ["Eyes", "Lips", "Face", "Full Look"];

function categoryIcon(cat: MakeupCategory): React.ComponentProps<typeof Ionicons>["name"] {
  switch (cat) {
    case "Eyes": return "eye-outline";
    case "Lips": return "heart-outline";
    case "Face": return "sparkles-outline";
    case "Full Look": return "color-palette-outline";
  }
}

function LookCard({
  look,
  selected,
  onPress,
  colors,
}: {
  look: MakeupLook;
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
        colors={look.gradient}
        style={styles.lookCardGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.lookEmoji}>{look.emoji}</Text>
        {selected && (
          <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </LinearGradient>
      <View style={[styles.lookCardBody, { backgroundColor: colors.card }]}>
        <Text style={[styles.lookName, { color: colors.foreground }]} numberOfLines={1}>
          {look.name}
        </Text>
        <Text style={[styles.lookDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {look.description}
        </Text>
      </View>
    </Pressable>
  );
}

export default function StudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri } = useAnalysis();

  const [activeCategory, setActiveCategory] = useState<MakeupCategory>("Eyes");
  const [selectedLook, setSelectedLook] = useState<MakeupLook | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedToken, setCachedToken] = useState<{ token: string; expiresAt: number } | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  const visibleLooks = MAKEUP_LOOKS.filter((l) => l.category === activeCategory);

  async function getToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
    const res = await fetch(`${BASE_URL}/api/auth/token`);
    if (!res.ok) throw new Error("Could not obtain auth token");
    const { token } = (await res.json()) as { token: string };
    setCachedToken({ token, expiresAt: Date.now() + 8 * 60 * 1000 });
    return token;
  }

  const handleGenerate = async () => {
    if (!selectedLook || !imageUri) return;
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
          lookName: selectedLook.name,
          lookPromptFragment: selectedLook.promptFragment,
          profile: analysis ?? {},
        }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? "Preview generation failed");
      }

      const data = (await res.json()) as { imageBase64: string; mimeType: string };
      setResultBase64(data.imageBase64);
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
            <View style={[styles.headerBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text style={[styles.headerBadgeText, { color: colors.primary }]}>AI Preview</Text>
            </View>
          </View>
        </LinearGradient>

        {/* No analysis gate */}
        {!analysis ? (
          <View style={styles.gateContainer}>
            <View style={[styles.gateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                Complete your selfie analysis to try on makeup looks personalised to your coloring and features.
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
              <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                          {showBefore ? "Original" : selectedLook?.name ?? "Preview"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.resultActions}>
                      <Pressable
                        onPress={async () => {
                          await Haptics.selectionAsync();
                          setShowBefore((v) => !v);
                        }}
                        style={[styles.toggleBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      >
                        <Ionicons name="swap-horizontal-outline" size={16} color={colors.foreground} />
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
                          <Ionicons name="download-outline" size={16} color={colors.primaryForeground} />
                          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
                        </Pressable>
                      )}

                      <Pressable
                        onPress={handleReset}
                        style={[styles.resetBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      >
                        <Ionicons name="refresh-outline" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    </View>

                    <View style={[styles.disclaimerRow, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="information-circle-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
                        AI-generated artistic preview — results vary from real application
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.previewPlaceholder}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.previewPlaceholderImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.previewPlaceholderImage, { backgroundColor: colors.secondary }]} />
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
                            Generating your look…
                          </Text>
                          <Text style={[styles.generatingHint, { color: colors.mutedForeground }]}>
                            This may take 15–30 seconds
                          </Text>
                        </>
                      ) : (
                        <>
                          <View style={[styles.placeholderIcon, { backgroundColor: colors.card }]}>
                            <Ionicons name="color-palette-outline" size={32} color={colors.primary} />
                          </View>
                          <Text style={[styles.placeholderText, { color: colors.foreground }]}>
                            {selectedLook ? `Ready to preview "${selectedLook.name}"` : "Choose a look below"}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="alert-circle-outline" size={17} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text>
              </View>
            )}

            {/* Generate button */}
            {!resultBase64 && (
              <View style={styles.generateWrap}>
                <Pressable
                  onPress={handleGenerate}
                  disabled={!selectedLook || generating}
                  style={({ pressed }) => [
                    styles.generateBtn,
                    {
                      backgroundColor:
                        !selectedLook ? colors.muted : pressed ? colors.primary + "cc" : colors.primary,
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
                        color={!selectedLook ? colors.mutedForeground : "#fff"}
                      />
                      <Text
                        style={[
                          styles.generateBtnText,
                          { color: !selectedLook ? colors.mutedForeground : "#fff" },
                        ]}
                      >
                        {selectedLook ? `Preview ${selectedLook.name}` : "Select a look first"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Makeup Looks ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Makeup Looks
              </Text>

              {/* Category tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catScroll}
              >
                {CATEGORIES.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={async () => {
                        await Haptics.selectionAsync();
                        setActiveCategory(cat);
                      }}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: active ? colors.primary : colors.secondary,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={categoryIcon(cat)}
                        size={13}
                        color={active ? colors.primaryForeground : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.catPillText,
                          { color: active ? colors.primaryForeground : colors.foreground },
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Look grid */}
              <View style={styles.looksGrid}>
                {visibleLooks.map((look) => (
                  <LookCard
                    key={look.name}
                    look={look}
                    selected={selectedLook?.name === look.name}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      setSelectedLook((prev) =>
                        prev?.name === look.name ? null : look
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
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Hair Try-On
              </Text>
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
                  Virtual hair color and style previews tailored to your face shape and skin undertone are on their way.
                </Text>
                <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
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
  gateTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 20, textAlign: "center", paddingHorizontal: 24 },
  gateBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginTop: 10, paddingHorizontal: 28 },
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
    marginBottom: 14,
  },

  catScroll: { paddingHorizontal: 18, gap: 10, marginBottom: 16 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  catPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

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
  comingSoonBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  comingSoonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  comingSoonBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
