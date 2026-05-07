import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import BackButton from "@/components/BackButton";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
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

import { useAnalysis } from "@/context/AnalysisContext";
import { useWardrobe, type ClothingCategory, type WardrobeItem } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";
import { saveToGallery } from "@/utils/saveToGallery";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

const CATEGORIES: ClothingCategory[] = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Shoes",
  "Accessories",
];

type AnalysisResult = {
  name: string;
  category: string;
  dominantColor: string;
  compatibilityScore: number;
  compatibilityNotes: string;
};

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

async function removeBackground(
  imageBase64: string,
  mimeType: string,
  token: string
): Promise<{ imageBase64: string; mimeType: string } | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/remove-background`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { imageBase64: string; mimeType: string };
    return data;
  } catch {
    return null;
  }
}

export default function AddItemScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const { addItem } = useWardrobe();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ClothingCategory>("Tops");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPhase, setSavingPhase] = useState<"saving" | "removing-bg">("saving");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pickImage = async (fromCamera = false) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult(null);
    setError(null);

    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setError("Camera permission required.");
        return;
      }
    }

    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const res = await fn({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
      base64: true,
    });

    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setMimeType(asset.mimeType ?? "image/jpeg");
    }
  };

  const analyzeItem = async () => {
    if (!imageBase64 || !imageUri) return;
    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const tokenRes = await fetch(`${BASE_URL}/api/auth/token`);
      if (!tokenRes.ok) throw new Error("Could not obtain auth token");
      const { token } = (await tokenRes.json()) as { token: string };

      const res = await fetch(`${BASE_URL}/api/analyze-clothing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          profile: analysis ?? {},
        }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? "Analysis failed");
      }

      const data = (await res.json()) as AnalysisResult;
      setResult(data);

      if (!name.trim() && data.name) setName(data.name);
      if (CATEGORIES.includes(data.category as ClothingCategory)) {
        setCategory(data.category as ClothingCategory);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveItem = async () => {
    if (!imageBase64 || !result) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    setSavingPhase("saving");

    const originalUri = `data:${mimeType};base64,${imageBase64}`;

    // Save original photo to "Veloura Wardrobe" album before background removal
    let galleryUri: string | undefined;
    if (imageUri && Platform.OS !== "web") {
      const saved = await saveToGallery(imageUri, "Veloura Wardrobe");
      if (saved) galleryUri = saved;
    }

    // Attempt background removal
    setSavingPhase("removing-bg");
    let finalImageUri = originalUri;
    let backgroundRemoved = false;

    try {
      const tokenRes = await fetch(`${BASE_URL}/api/auth/token`);
      if (tokenRes.ok) {
        const { token } = (await tokenRes.json()) as { token: string };
        const bgResult = await removeBackground(imageBase64, mimeType, token);
        if (bgResult) {
          finalImageUri = `data:${bgResult.mimeType};base64,${bgResult.imageBase64}`;
          backgroundRemoved = true;
        } else {
          if (__DEV__) console.warn("[Veloura] Background removal returned null — falling back to original image");
        }
      } else {
        if (__DEV__) console.warn("[Veloura] Token fetch failed for background removal — falling back to original image");
      }
    } catch (bgErr) {
      if (__DEV__) console.warn("[Veloura] Background removal failed:", bgErr);
    }

    const item: WardrobeItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim() || result.name,
      category,
      imageUri: finalImageUri,
      galleryUri,
      dominantColor: result.dominantColor,
      compatibilityScore: result.compatibilityScore,
      compatibilityNotes: result.compatibilityNotes,
      addedAt: Date.now(),
      backgroundRemoved,
    };

    await addItem(item);
    setSaving(false);
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: topPad + 12,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Add to My Closet
          </Text>
          <BackButton variant="close" />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => pickImage(false)} style={styles.imageArea}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={["#F5EDE3", "#EDE3D9"]}
                style={styles.placeholder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.placeholderIcon, { backgroundColor: colors.card }]}>
                  <Ionicons name="shirt-outline" size={52} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                  Tap to add a photo
                </Text>
                <Text style={[styles.placeholderHint, { color: colors.mutedForeground }]}>
                  Use a clear photo of the item{"\n"}on a flat or hanger background
                </Text>
              </LinearGradient>
            )}
          </Pressable>

          <View style={styles.photoButtons}>
            <Pressable
              onPress={() => pickImage(false)}
              style={({ pressed }) => [
                styles.photoBtn,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="images-outline" size={20} color={colors.primary} />
              <Text style={[styles.photoBtnText, { color: colors.foreground }]}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage(true)}
              style={({ pressed }) => [
                styles.photoBtn,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={[styles.photoBtnText, { color: colors.foreground }]}>Camera</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Item name (optional)
            </Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="pricetag-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. White Linen Blazer"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                returnKeyType="done"
                maxLength={60}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setCategory(cat);
                  }}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        category === cat ? colors.primary : colors.card,
                      borderColor:
                        category === cat ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color:
                          category === cat
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
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text>
            </View>
          )}

          {result && (
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                    Style Compatibility
                  </Text>
                  <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>
                    Matched against your profile
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: scoreColor(result.compatibilityScore) + "18" }]}>
                  <Text style={[styles.scoreNumber, { color: scoreColor(result.compatibilityScore) }]}>
                    {result.compatibilityScore}
                  </Text>
                  <Text style={[styles.scoreSlash, { color: scoreColor(result.compatibilityScore) + "88" }]}>
                    /100
                  </Text>
                </View>
              </View>
              <View style={[styles.scoreBar, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.scoreBarFill,
                    {
                      backgroundColor: scoreColor(result.compatibilityScore),
                      width: `${result.compatibilityScore}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.scoreLabel, { color: scoreColor(result.compatibilityScore) }]}>
                {scoreLabel(result.compatibilityScore)}
              </Text>
              <Text style={[styles.resultNotes, { color: colors.mutedForeground }]}>
                {result.compatibilityNotes}
              </Text>
              {result.dominantColor && (
                <View style={styles.colorRow}>
                  <View style={[styles.colorDot, { backgroundColor: result.dominantColor }]} />
                  <Text style={[styles.colorLabel, { color: colors.mutedForeground }]}>
                    Dominant color: {result.dominantColor}
                  </Text>
                </View>
              )}
            </View>
          )}

          {!result && (
            <Pressable
              onPress={analyzeItem}
              disabled={!imageUri || analyzing}
              style={({ pressed }) => [
                styles.analyzeBtn,
                {
                  backgroundColor:
                    !imageUri ? colors.muted : pressed ? colors.primary + "cc" : colors.primary,
                  opacity: analyzing ? 0.8 : 1,
                },
              ]}
            >
              {analyzing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.analyzeBtnText}>Analyzing…</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color={!imageUri ? colors.mutedForeground : "#fff"}
                  />
                  <Text
                    style={[
                      styles.analyzeBtnText,
                      { color: !imageUri ? colors.mutedForeground : "#fff" },
                    ]}
                  >
                    Analyze Style Match
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {result && (
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => { setResult(null); setError(null); }}
                style={({ pressed }) => [
                  styles.reanalyzeBtn,
                  { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.reanalyzeBtnText, { color: colors.foreground }]}>
                  Re-analyze
                </Text>
              </Pressable>
              <Pressable
                onPress={saveItem}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: pressed ? colors.primary + "cc" : colors.primary, opacity: saving ? 0.8 : 1 },
                ]}
              >
                {saving ? (
                  <View style={styles.savingInner}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.saveBtnText}>
                      {savingPhase === "removing-bg" ? "Removing background…" : "Saving…"}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.saveBtnText}>Add to My Closet</Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 16 },
  imageArea: { height: 280, borderRadius: 20, overflow: "hidden" },
  preview: { flex: 1 },
  placeholder: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 12,
  },
  placeholderIcon: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: "center", justifyContent: "center",
  },
  placeholderText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  placeholderHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  photoButtons: { flexDirection: "row", gap: 12 },
  photoBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  photoBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  categoryRow: { gap: 8 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth,
  },
  categoryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  resultCard: {
    padding: 20, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  resultSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  scoreBadge: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
  },
  scoreNumber: { fontSize: 28, fontFamily: "Inter_700Bold" },
  scoreSlash: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4, marginLeft: 2 },
  scoreBar: { height: 6, borderRadius: 4, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  scoreLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resultNotes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  colorLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  analyzeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 18, borderRadius: 18,
  },
  analyzeBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
  actionRow: { flexDirection: "row", gap: 12 },
  reanalyzeBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 15, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth,
  },
  reanalyzeBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  saveBtn: {
    flex: 2, alignItems: "center", justifyContent: "center",
    paddingVertical: 15, borderRadius: 15,
  },
  savingInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
