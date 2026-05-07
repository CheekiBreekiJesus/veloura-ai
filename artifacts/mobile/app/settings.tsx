import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import BackButton from "@/components/BackButton";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
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
import { COUNTRIES, useCountry } from "@/context/CountryContext";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const APP_VERSION = "1.0.0";

const THEME_OPTIONS: { label: string; value: ThemePreference; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { label: "System", value: "system", icon: "phone-portrait-outline" },
  { label: "Light", value: "light", icon: "sunny-outline" },
  { label: "Dark", value: "dark", icon: "moon-outline" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preference, setTheme } = useTheme();
  const { country, countryFlag, countryLabel, setCountry } = useCountry();
  const { userName, setUserName, clearAnalysis, clearChatHistory, chatHistory, analysis } = useAnalysis();
  const companionName = analysis?.companion_name ?? "Aura";
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userName ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

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

  const handleClearChat = () => {
    if (chatHistory.length === 0) {
      Alert.alert("No Chat History", "There are no messages to clear.");
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Clear all chat messages with ${companionName}? Your style profile will stay intact.`
      );
      if (confirmed) void clearChatHistory();
      return;
    }

    Alert.alert(
      "Clear Chat History",
      `This will delete all messages with ${companionName}. Your style profile and wardrobe will stay intact.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await clearChatHistory();
          },
        },
      ]
    );
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
          <BackButton />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Settings
          </Text>
          <View style={{ width: 40 }} />
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

          {/* Shopping region */}
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              SHOPPING
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Pressable
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setCountryPickerVisible(true);
                }}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="globe-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Country / Region
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    {countryFlag} {countryLabel}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </Pressable>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={[styles.row, { paddingVertical: 10 }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="link-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Affiliate Disclosure
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    Veloura may earn a commission from purchases made through links in this app.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Appearance — theme toggle */}
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
              <View style={[styles.row, { paddingBottom: 8 }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Color Mode
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    Choose light, dark, or follow your device
                  </Text>
                </View>
              </View>
              {/* 3-way toggle */}
              <View style={[styles.themeToggleRow, { paddingHorizontal: 14, paddingBottom: 14 }]}>
                {THEME_OPTIONS.map((opt) => {
                  const active = preference === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={async () => {
                        await Haptics.selectionAsync();
                        await setTheme(opt.value);
                      }}
                      style={[
                        styles.themeOption,
                        {
                          backgroundColor: active ? colors.primary : colors.secondary,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={16}
                        color={active ? "#fff" : colors.foreground}
                      />
                      <Text
                        style={[
                          styles.themeOptionText,
                          { color: active ? "#fff" : colors.foreground },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
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
                  style={[styles.rowIcon, { backgroundColor: colors.secondary + "80" }]}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
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
                onPress={handleClearChat}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[styles.rowIcon, { backgroundColor: "#B06A1818" }]}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#B06A18" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: "#B06A18" }]}>
                    Clear Chat History
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    {chatHistory.length > 0
                      ? `${chatHistory.length} message${chatHistory.length !== 1 ? "s" : ""} · profile stays intact`
                      : "No messages to clear"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </Pressable>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <Pressable
                onPress={handleClearData}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[styles.rowIcon, { backgroundColor: "#D45F5F18" }]}
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
                    Veloura · Version
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

        {/* Country picker modal */}
        <Modal
          visible={countryPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCountryPickerVisible(false)}
        >
          <View style={cpStyles.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setCountryPickerVisible(false)} />
            <View style={[cpStyles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[cpStyles.handle, { backgroundColor: colors.border }]} />
              <Text style={[cpStyles.sheetTitle, { color: colors.foreground }]}>Country / Region</Text>
              <Text style={[cpStyles.sheetSub, { color: colors.mutedForeground }]}>
                Shop links will open retailers in your selected region
              </Text>
              {COUNTRIES.map((c) => {
                const selected = c.code === country;
                return (
                  <Pressable
                    key={c.code}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      await setCountry(c.code);
                      setCountryPickerVisible(false);
                    }}
                    style={({ pressed }) => [
                      cpStyles.countryRow,
                      {
                        backgroundColor: selected
                          ? colors.primary + "15"
                          : pressed
                          ? colors.secondary
                          : "transparent",
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={cpStyles.flag}>{c.flag}</Text>
                    <Text style={[cpStyles.countryLabel, { color: colors.foreground }]}>{c.label}</Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>
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
  content: { padding: 20, gap: 4 },
  group: { marginBottom: 20 },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
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
  divider: { height: 1, marginLeft: 62 },
  themeToggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeOptionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

const cpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 20,
    marginBottom: 12,
    lineHeight: 19,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flag: { fontSize: 24 },
  countryLabel: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium" },
});
