import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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

export default function ShareModal({ visible, onClose, analysis, userName }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (sharing) return;
    setError(null);
    setSharing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

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

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

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
            Your personalized style profile card — ready to share.
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

          {/* Share button */}
          <Pressable
            onPress={handleShare}
            disabled={sharing}
            style={({ pressed }) => [
              styles.shareBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || sharing ? 0.8 : 1,
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

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Saves as a PNG image — share to Instagram, Messages, or anywhere you like.
          </Text>
        </ScrollView>
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
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    paddingHorizontal: 40,
    borderRadius: 18,
    width: "100%",
  },
  shareBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
