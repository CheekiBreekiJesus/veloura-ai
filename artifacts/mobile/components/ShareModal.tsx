import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AnalysisResult } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";
import ShareProfileCard from "@/components/ShareProfileCard";

type Props = {
  visible: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
  userName: string | null;
};

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) {
          opacity.setValue(0);
        }
      });
    }
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Ionicons name="checkmark-circle" size={18} color="#fff" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export default function ShareModal({ visible, onClose, analysis, userName }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const captureCard = async () => {
    const uri = await captureRef(cardRef, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });
    return uri;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 50);
  };

  const handleShare = async () => {
    if (sharing || saving) return;
    setError(null);
    setSharing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureCard();

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        if (Platform.OS === "web") {
          setError("Sharing isn't supported in the browser. Open Veloura in the Expo Go app on your phone to share your style card.");
        } else {
          setError("Sharing is not available on this device.");
        }
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share your style profile",
        UTI: "public.png",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setSharing(false);
    }
  };

  const handleSaveToPhotos = async () => {
    if (saving || sharing) return;
    setError(null);

    if (Platform.OS === "web") {
      setError("Saving to photos isn't supported in the browser. Open Veloura in the Expo Go app on your phone.");
      return;
    }

    setSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        if (!canAskAgain) {
          setError("Photos permission was denied. Please enable it in your device Settings to save style cards.");
        } else {
          setError("Photos permission is required to save your style card.");
        }
        return;
      }

      const uri = await captureCard();
      await MediaLibrary.saveToLibraryAsync(uri);

      showToast("Style card saved to your photos!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const busy = sharing || saving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 16, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            Share Style Card
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="close" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Your personalized style profile card — ready to share or save.
          </Text>

          {/* Card preview */}
          <View style={styles.cardWrap}>
            <ShareProfileCard ref={cardRef} analysis={analysis} userName={userName} />
          </View>

          {/* Error */}
          {error && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          {/* Buttons row */}
          <View style={styles.btnRow}>
            {/* Save to Photos */}
            <Pressable
              onPress={handleSaveToPhotos}
              disabled={busy}
              style={({ pressed }) => [
                styles.saveBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  opacity: pressed || busy ? 0.7 : 1,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Ionicons name="download-outline" size={20} color={colors.foreground} />
              )}
              <Text style={[styles.saveBtnText, { color: colors.foreground }]}>
                {saving ? "Saving…" : "Save to Photos"}
              </Text>
            </Pressable>

            {/* Share */}
            <Pressable
              onPress={handleShare}
              disabled={busy}
              style={({ pressed }) => [
                styles.shareBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || busy ? 0.8 : 1,
                },
              ]}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Ionicons name="share-outline" size={20} color={colors.primaryForeground} />
              )}
              <Text style={[styles.shareBtnText, { color: colors.primaryForeground }]}>
                {sharing ? "Preparing…" : "Share Profile"}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Save to your camera roll or share to Instagram, Messages, and more.
          </Text>
        </ScrollView>

        {/* Toast */}
        <Toast message={toastMessage} visible={toastVisible} />
      </View>
    </Modal>
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
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 20,
    alignItems: "center",
    gap: 20,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  cardWrap: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  shareBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2D1F14",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
