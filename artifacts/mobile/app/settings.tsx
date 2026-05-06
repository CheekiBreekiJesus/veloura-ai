import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";

const APP_VERSION = "1.0.0";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { userName, setUserName, clearAnalysis, analysis } = useAnalysis();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userName ?? "");
  const [nameSaved, setNameSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const handleSaveName = async () => {
    Keyboard.dismiss();
    const trimmed = nameValue.trim();
    if (trimmed) {
      await setUserName(trimmed);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
    setEditingName(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClearData = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Clear all profile data? This cannot be undone."
      );
      if (confirmed) {
        clearAnalysis().then(() => {
          router.replace("/(tabs)");
        });
      }
      return;
    }

    Alert.alert(
      "Clear Profile",
      "This will delete your analysis and start fresh. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await clearAnalysis();
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: topPad + 12,
              borderBottomColor: colors.border,
            },
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
            Settings
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: botPad + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile section */}
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              PROFILE
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* Name row */}
              <View style={styles.row}>
                <View
                  style={[styles.rowIcon, { backgroundColor: colors.secondary }]}
                >
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Your Name
                  </Text>
                  {editingName ? (
                    <TextInput
                      value={nameValue}
                      onChangeText={setNameValue}
                      autoFocus
                      style={[styles.nameInput, { color: colors.foreground, borderColor: colors.primary }]}
                      placeholder="Enter your name"
                      placeholderTextColor={colors.mutedForeground}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                      autoCapitalize="words"
                      maxLength={30}
                    />
                  ) : (
                    <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                      {userName?.trim() || "Not set"}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => {
                    if (editingName) {
                      handleSaveName();
                    } else {
                      setEditingName(true);
                      setNameSaved(false);
                    }
                  }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  {nameSaved ? (
                    <View style={[styles.savedBadge, { backgroundColor: colors.primary + "20" }]}>
                      <Ionicons name="checkmark" size={14} color={colors.primary} />
                      <Text style={[styles.savedText, { color: colors.primary }]}>Saved</Text>
                    </View>
                  ) : (
                    <Text style={[styles.editAction, { color: colors.primary }]}>
                      {editingName ? "Save" : "Edit"}
                    </Text>
                  )}
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Analysis status */}
              <View style={styles.row}>
                <View
                  style={[styles.rowIcon, { backgroundColor: colors.secondary }]}
                >
                  <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Style Profile
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    {analysis ? `${analysis.style_archetype} · Active` : "No analysis yet"}
                  </Text>
                </View>
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/upload");
                  }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Text style={[styles.editAction, { color: colors.primary }]}>
                    {analysis ? "Re-run" : "Start"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Appearance */}
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              APPEARANCE
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: scheme === "dark" ? "#2E2218" : colors.secondary },
                  ]}
                >
                  <Ionicons
                    name={scheme === "dark" ? "moon" : "sunny-outline"}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Color Mode
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    {scheme === "dark" ? "Dark" : "Light"} · Follows system
                  </Text>
                </View>
                <View
                  style={[
                    styles.modeBadge,
                    { backgroundColor: colors.primary + "18" },
                  ]}
                >
                  <Text style={[styles.modeBadgeText, { color: colors.primary }]}>
                    System
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.groupHint, { color: colors.mutedForeground }]}>
              Change your device's appearance setting to switch between light and dark mode.
            </Text>
          </View>

          {/* Data */}
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              DATA & PRIVACY
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                <View
                  style={[styles.rowIcon, { backgroundColor: "#FFF0F0" }]}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color="#D45F5F" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Photo Storage
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    Never stored on servers
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <Pressable
                onPress={handleClearData}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[styles.rowIcon, { backgroundColor: "#FFF0F0" }]}
                >
                  <Ionicons name="trash-outline" size={18} color="#D45F5F" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: "#D45F5F" }]}>
                    Clear All Profile Data
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    Removes analysis, name, and photo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* About */}
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              ABOUT
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                <View
                  style={[styles.rowIcon, { backgroundColor: colors.secondary }]}
                >
                  <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    App Version
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    {APP_VERSION}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.row}>
                <View
                  style={[styles.rowIcon, { backgroundColor: colors.secondary }]}
                >
                  <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Powered by
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    OpenAI GPT Vision
                  </Text>
                </View>
              </View>
            </View>
          </View>
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, gap: 4 },
  group: { marginBottom: 20 },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 18,
  },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_500Medium", marginBottom: 2 },
  rowValue: { fontSize: 12, fontFamily: "Inter_400Regular" },
  editAction: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  nameInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderBottomWidth: 1,
    paddingBottom: 2,
    marginTop: 2,
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savedText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  modeBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, marginLeft: 62 },
});
