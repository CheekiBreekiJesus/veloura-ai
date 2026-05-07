import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import BackButton from "@/components/BackButton";
import React, { useRef, useState } from "react";
import {
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
import { useColors } from "@/hooks/useColors";

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserName, setPendingImage, userName } = useAnalysis();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [name, setName] = useState(userName ?? "");
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
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
      quality: 0.75,
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
    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Save name
    const trimmed = name.trim();
    if (trimmed) await setUserName(trimmed);

    // Store pending image in context so analyzing.tsx can read it
    setPendingImage({ base64: imageBase64, mimeType, uri: imageUri });

    // Navigate to animated analyzing screen
    router.push("/analyzing");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 12, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Upload Photo
          </Text>
          <BackButton variant="close" />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: botPad + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name input */}
          <View style={styles.nameSection}>
            <Text style={[styles.nameLabel, { color: colors.mutedForeground }]}>
              Your name (optional)
            </Text>
            <View
              style={[
                styles.nameInput,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={colors.mutedForeground}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sofia"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.nameTextInput, { color: colors.foreground }]}
                returnKeyType="done"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
          </View>

          {/* Image picker area */}
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
                    size={52}
                    color={colors.mutedForeground}
                  />
                </View>
                <Text
                  style={[
                    styles.placeholderText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Tap to choose a photo
                </Text>
                <Text
                  style={[
                    styles.placeholderHint,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Use a clear front-facing selfie{"\n"}for best results
                </Text>
              </LinearGradient>
            )}
          </Pressable>

          {/* Tips row */}
          <View style={styles.tipsRow}>
            {[
              { icon: "sunny-outline" as const, tip: "Good lighting" },
              { icon: "eye-outline" as const, tip: "Face forward" },
              { icon: "cut-outline" as const, tip: "Hair visible" },
            ].map((t, i) => (
              <View
                key={i}
                style={[
                  styles.tipChip,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <Ionicons name={t.icon} size={13} color={colors.primary} />
                <Text style={[styles.tipChipText, { color: colors.foreground }]}>
                  {t.tip}
                </Text>
              </View>
            ))}
          </View>

          {/* Error */}
          {error && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: colors.destructive + "15" },
              ]}
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

          {/* Source buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handlePickImage}
              style={({ pressed }) => [
                styles.sourceBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="images-outline" size={22} color={colors.primary} />
              <Text style={[styles.sourceBtnText, { color: colors.foreground }]}>
                Gallery
              </Text>
            </Pressable>
            <Pressable
              onPress={handleTakePhoto}
              style={({ pressed }) => [
                styles.sourceBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
              <Text style={[styles.sourceBtnText, { color: colors.foreground }]}>
                Camera
              </Text>
            </Pressable>
          </View>

          {/* Analyze button */}
          <Pressable
            onPress={handleAnalyze}
            disabled={!imageUri}
            style={({ pressed }) => [
              styles.analyzeBtn,
              {
                backgroundColor: !imageUri ? colors.muted : colors.primary,
                opacity: pressed && !!imageUri ? 0.85 : 1,
              },
            ]}
          >
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
          </Pressable>

          <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>
            Your photo is processed securely and never stored on our servers.
          </Text>
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
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 20, gap: 16 },
  nameSection: { gap: 6 },
  nameLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  nameInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  nameTextInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  imageArea: { height: 300, borderRadius: 24, overflow: "hidden" },
  preview: { flex: 1 },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  placeholderHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  tipsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tipChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tipChipText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  buttonRow: { flexDirection: "row", gap: 12 },
  sourceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  sourceBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
  },
  analyzeBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  privacyNote: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
