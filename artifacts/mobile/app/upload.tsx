import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";
import type { AnalysisResult } from "@/context/AnalysisContext";

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setAnalysis } = useAnalysis();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setMimeType(asset.mimeType ?? "image/jpeg");
      setError(null);
    }
  };

  const handleTakePhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError("Camera permission is required to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setMimeType(asset.mimeType ?? "image/jpeg");
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64 || !imageUri) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);
    setError(null);

    const domain = process.env["EXPO_PUBLIC_DOMAIN"];
    const baseUrl = domain ? `https://${domain}` : "";

    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (!response.ok) {
      const errBody = (await response.json()) as { error?: string };
      setError(errBody.error ?? "Analysis failed. Please try again.");
      setIsAnalyzing(false);
      return;
    }

    const result = (await response.json()) as AnalysisResult;
    await setAnalysis(result, imageUri);
    setIsAnalyzing(false);
    router.replace("/dashboard");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Your Photo
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.content, { paddingBottom: botPad + 24 }]}>
        <Pressable onPress={handlePickImage} style={styles.imageArea}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={["#F5EDE3", "#EDE3D9"]}
              style={styles.placeholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={[
                  styles.placeholderIcon,
                  { backgroundColor: colors.card },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={48}
                  color={colors.mutedForeground}
                />
              </View>
              <Text
                style={[styles.placeholderText, { color: colors.mutedForeground }]}
              >
                Tap to choose a photo
              </Text>
              <Text
                style={[
                  styles.placeholderHint,
                  { color: colors.mutedForeground },
                ]}
              >
                For best results, use a clear{"\n"}front-facing selfie
              </Text>
            </LinearGradient>
          )}
        </Pressable>

        {error && (
          <View
            style={[styles.errorBox, { backgroundColor: colors.destructive + "15" }]}
          >
            <Ionicons
              name="alert-circle"
              size={16}
              color={colors.destructive}
            />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="images-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>
              Gallery
            </Text>
          </Pressable>
          <Pressable
            onPress={handleTakePhoto}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="camera-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.actionText, { color: colors.foreground }]}>
              Camera
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleAnalyze}
          disabled={!imageUri || isAnalyzing}
          style={({ pressed }) => [
            styles.analyzeBtn,
            {
              backgroundColor:
                !imageUri || isAnalyzing
                  ? colors.muted
                  : colors.primary,
              opacity: pressed && imageUri && !isAnalyzing ? 0.85 : 1,
            },
          ]}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator color={colors.primaryForeground} size="small" />
              <Text
                style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}
              >
                Analyzing...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="sparkles"
                size={20}
                color={!imageUri ? colors.mutedForeground : colors.primaryForeground}
              />
              <Text
                style={[
                  styles.analyzeBtnText,
                  {
                    color: !imageUri
                      ? colors.mutedForeground
                      : colors.primaryForeground,
                  },
                ]}
              >
                Analyze My Style
              </Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
          Analysis takes about 15-20 seconds
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: { width: 40 },
  content: { flex: 1, padding: 20 },
  imageArea: { flex: 1, borderRadius: 24, overflow: "hidden", marginBottom: 16 },
  preview: { flex: 1 },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 300,
  },
  placeholderIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  placeholderHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    marginBottom: 12,
  },
  analyzeBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  tipText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
