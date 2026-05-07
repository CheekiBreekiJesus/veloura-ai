import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAnalysis } from "@/context/AnalysisContext";
import { useTodayOutfit } from "@/context/TodayOutfitContext";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

const ND = Platform.OS !== "web";

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

function PulsingDots({ color }: { color: string }) {
  const a1 = useRef(new Animated.Value(0.3)).current;
  const a2 = useRef(new Animated.Value(0.3)).current;
  const a3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const makeDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: ND,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: ND,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );
    const d1 = makeDot(a1, 0);
    const d2 = makeDot(a2, 160);
    const d3 = makeDot(a3, 320);
    d1.start();
    d2.start();
    d3.start();
    return () => {
      d1.stop();
      d2.stop();
      d3.stop();
    };
  }, []);

  return (
    <View style={dotStyles.row}>
      {[a1, a2, a3].map((a, i) => (
        <Animated.View
          key={i}
          style={[dotStyles.dot, { backgroundColor: color, opacity: a }]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

function EmptyState({
  onUpload,
  onSuggest,
  colors,
}: {
  onUpload: () => void;
  onSuggest: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.emptyBody}>
      <LinearGradient
        colors={["#F5EDE3", "#EDE3D9"]}
        style={styles.emptyIllustration}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View
          style={[
            styles.hangerCircle,
            { backgroundColor: "rgba(255,255,255,0.7)" },
          ]}
        >
          <Ionicons name="shirt-outline" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.emptyPrompt, { color: colors.mutedForeground }]}>
          What are you wearing today?
        </Text>
      </LinearGradient>

      <View style={styles.emptyActions}>
        <Pressable
          onPress={onUpload}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnPrimaryText}>Add today's look</Text>
        </Pressable>
        <Pressable
          onPress={onSuggest}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnSecondary,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          <Text
            style={[styles.actionBtnSecondaryText, { color: colors.primary }]}
          >
            Suggest an outfit
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function UploadedState({
  result,
  colors,
}: {
  result: {
    imageUri: string;
    name: string;
    category: string;
    dominantColor: string;
    compatibilityScore: number;
    compatibilityNotes: string;
  };
  colors: ReturnType<typeof useColors>;
}) {
  const sc = scoreColor(result.compatibilityScore);
  return (
    <View style={styles.uploadedBody}>
      <Image
        source={{ uri: result.imageUri }}
        style={styles.thumbnail}
        contentFit="cover"
      />
      <View style={styles.uploadedInfo}>
        <View style={styles.uploadedNameRow}>
          <Text
            style={[styles.uploadedName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {result.name}
          </Text>
          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryPillText,
                { color: colors.mutedForeground },
              ]}
            >
              {result.category}
            </Text>
          </View>
        </View>

        <View style={[styles.scoreBadge, { backgroundColor: sc + "18" }]}>
          <Text style={[styles.scoreNumber, { color: sc }]}>
            {result.compatibilityScore}
          </Text>
          <Text style={[styles.scoreSlash, { color: sc + "88" }]}>/100</Text>
          <Text style={[styles.scoreLabelText, { color: sc }]}>
            {" "}
            · {scoreLabel(result.compatibilityScore)}
          </Text>
        </View>

        <View style={[styles.scoreBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.scoreBarFill,
              {
                backgroundColor: sc,
                width: `${result.compatibilityScore}%`,
              },
            ]}
          />
        </View>

        {result.dominantColor ? (
          <View style={styles.colorRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: result.dominantColor },
              ]}
            />
            <Text
              style={[styles.colorLabel, { color: colors.mutedForeground }]}
            >
              {result.dominantColor}
            </Text>
          </View>
        ) : null}

        <Text
          style={[styles.uploadedNotes, { color: colors.mutedForeground }]}
          numberOfLines={3}
        >
          {result.compatibilityNotes}
        </Text>
      </View>
    </View>
  );
}

function SuggestedState({
  result,
  colors,
}: {
  result: {
    suggestionText: string;
    items: { name: string; category: string }[];
  };
  colors: ReturnType<typeof useColors>;
}) {
  const cleanText = result.suggestionText
    .split("\n")
    .filter((l) => !l.trim().startsWith("-"))
    .join(" ")
    .trim();

  return (
    <View style={styles.suggestedBody}>
      <View style={styles.auraRow}>
        <LinearGradient
          colors={["#F5EDE3", "#E8C4A0"]}
          style={styles.auraAvatar}
        >
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.auraLabel, { color: colors.mutedForeground }]}>
          Aura's suggestion for today
        </Text>
      </View>

      {cleanText.length > 0 && (
        <Text style={[styles.suggestionText, { color: colors.foreground }]}>
          {cleanText}
        </Text>
      )}

      {result.items.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itemChips}
        >
          {result.items.map((item, i) => (
            <View
              key={i}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="shirt-outline" size={12} color={colors.primary} />
              <Text
                style={[styles.chipText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.category ? (
                <View
                  style={[
                    styles.chipCat,
                    { backgroundColor: colors.primary + "18" },
                  ]}
                >
                  <Text
                    style={[styles.chipCatText, { color: colors.primary }]}
                  >
                    {item.category}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function TodayOutfitCard() {
  const colors = useColors();
  const { analysis, userName } = useAnalysis();
  const { wardrobeItems, feedback } = useWardrobe();
  const {
    mode,
    uploaded,
    suggested,
    error,
    setUploading,
    setUploaded,
    setSuggesting,
    setSuggested,
    setError,
    reset,
  } = useTodayOutfit();

  const [lastAction, setLastAction] = useState<"upload" | "suggest" | null>(null);

  const handleUpload = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
      base64: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    if (!asset.base64) {
      setError("Could not read image");
      return;
    }

    setLastAction("upload");
    setUploading();

    try {
      const tokenRes = await fetch(`${BASE_URL}/api/auth/token`);
      if (!tokenRes.ok) throw new Error("Could not obtain auth token");
      const { token } = (await tokenRes.json()) as { token: string };

      const apiRes = await fetch(`${BASE_URL}/api/analyze-clothing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64: asset.base64,
          mimeType: asset.mimeType ?? "image/jpeg",
          profile: analysis ?? {},
        }),
      });

      if (!apiRes.ok) {
        const e = (await apiRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(e.error ?? "Analysis failed");
      }

      const data = (await apiRes.json()) as {
        name: string;
        category: string;
        dominantColor: string;
        compatibilityScore: number;
        compatibilityNotes: string;
      };

      setUploaded({
        imageUri: asset.uri,
        name: data.name,
        category: data.category,
        dominantColor: data.dominantColor,
        compatibilityScore: data.compatibilityScore,
        compatibilityNotes: data.compatibilityNotes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  const handleSuggest = async () => {
    if (wardrobeItems.length === 0) {
      setError(
        "Add some items to your closet first so Aura can suggest an outfit."
      );
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setLastAction("suggest");
    setSuggesting();

    const wardrobeList = wardrobeItems
      .slice(0, 20)
      .map(
        (item) =>
          `• ${item.name} (${item.category}, score ${item.compatibilityScore})`
      )
      .join("\n");

    const likedKeys = Object.entries(
      (feedback as Record<string, string>) ?? {}
    )
      .filter(([, v]) => v === "liked")
      .map(([k]) => k)
      .slice(0, 5);

    const prompt = `I need an outfit suggestion for today. Here are the items in my wardrobe:\n${wardrobeList}${likedKeys.length ? `\n\nI've also liked these styles: ${likedKeys.join(", ")}` : ""}\n\nPlease suggest a complete outfit combination using items from my wardrobe. List each piece on a new line starting with a dash. Keep the suggestion concise and wearable.`;

    try {
      const apiRes = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          profile: analysis ?? {},
          userName: userName ?? null,
          feedback,
        }),
      });

      if (!apiRes.ok) {
        const e = (await apiRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(e.error ?? "Suggestion failed");
      }

      const { reply } = (await apiRes.json()) as { reply: string };

      const dashLines = reply
        .split("\n")
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*/, "").trim())
        .filter((l) => l.length > 0);

      const matchedItems = dashLines
        .map((line) => {
          const matched = wardrobeItems.find(
            (item) =>
              line.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(line.toLowerCase().slice(0, 12))
          );
          if (matched) {
            return { name: matched.name, category: matched.category };
          }
          const categoryMatch = wardrobeItems.find((item) =>
            line.toLowerCase().includes(item.category.toLowerCase())
          );
          if (categoryMatch) {
            return { name: line, category: categoryMatch.category };
          }
          return { name: line, category: "" };
        })
        .filter((item) => item.name.length > 0);

      setSuggested({ suggestionText: reply, items: matchedItems });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suggestion failed");
    }
  };

  const handleRetry = () => {
    reset();
    if (lastAction === "upload") {
      void handleUpload();
    } else if (lastAction === "suggest") {
      void handleSuggest();
    }
  };

  const isLoading = mode === "uploading" || mode === "suggesting";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.titleRow}>
        <LinearGradient
          colors={["#F5EDE3", "#E8C4A0"]}
          style={styles.titleIcon}
        >
          <Ionicons name="shirt-outline" size={16} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Today's Outfit
        </Text>
        {(mode === "uploaded" || mode === "suggested") && (
          <Pressable
            onPress={reset}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[styles.resetText, { color: colors.mutedForeground }]}>
              Reset
            </Text>
          </Pressable>
        )}
      </View>

      {error && (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: colors.destructive + "12",
              borderColor: colors.destructive + "30",
            },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={colors.destructive}
          />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {error}
          </Text>
          <Pressable onPress={handleRetry}>
            <Text style={[styles.retryText, { color: colors.primary }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      )}

      {mode === "empty" && !error && (
        <EmptyState
          onUpload={handleUpload}
          onSuggest={handleSuggest}
          colors={colors}
        />
      )}

      {isLoading && (
        <View style={styles.loadingBox}>
          <PulsingDots color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {mode === "uploading"
              ? "Analyzing your outfit…"
              : "Aura is styling you…"}
          </Text>
        </View>
      )}

      {mode === "uploaded" && uploaded && (
        <UploadedState result={uploaded} colors={colors} />
      )}

      {mode === "suggested" && suggested && (
        <SuggestedState result={suggested} colors={colors} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  resetText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexWrap: "wrap",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  emptyBody: {
    gap: 12,
  },
  emptyIllustration: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 140,
  },
  hangerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPrompt: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  emptyActions: {
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnPrimaryText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  actionBtnSecondary: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBtnSecondaryText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  uploadedBody: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  thumbnail: {
    width: 88,
    height: 116,
    borderRadius: 14,
    flexShrink: 0,
  },
  uploadedInfo: {
    flex: 1,
    gap: 8,
  },
  uploadedNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  uploadedName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryPillText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  scoreNumber: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  scoreSlash: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  scoreLabelText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  scoreBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: 4,
    borderRadius: 2,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  uploadedNotes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  suggestedBody: {
    gap: 12,
  },
  auraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  auraAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  auraLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  itemChips: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 220,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flexShrink: 1,
  },
  chipCat: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chipCatText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
});
