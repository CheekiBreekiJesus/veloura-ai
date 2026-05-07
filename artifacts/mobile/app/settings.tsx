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
import { useBodyProfile } from "@/context/BodyProfileContext";
import { COUNTRIES, useCountry } from "@/context/CountryContext";
import { usePortraitHistory } from "@/context/PortraitHistoryContext";
import { useSeason, type Hemisphere } from "@/context/SeasonContext";
import { useStylePrefs } from "@/context/StylePrefsContext";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";

const QUICK_BRANDS = [
  "Zara", "Mango", "COS", "Uniqlo", "H&M", "ASOS",
  "& Other Stories", "Arket", "Massimo Dutti", "Reformation",
  "Free People", "Topshop", "River Island", "Reiss", "Revolve",
];

const QUICK_HEALTH_CONCERNS = [
  "Fragrance-free",
  "Nut allergy",
  "Latex allergy",
  "Gluten / Wheat",
  "Hormonal sensitivity",
  "Sensitive skin",
  "Vegan only",
  "Alcohol-free",
  "Paraben-free",
];

const APP_VERSION = "1.0.0";

const THEME_OPTIONS: { label: string; value: ThemePreference; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { label: "System", value: "system", icon: "phone-portrait-outline" },
  { label: "Light", value: "light", icon: "sunny-outline" },
  { label: "Dark", value: "dark", icon: "moon-outline" },
];

const HEMISPHERE_OPTIONS: { label: string; value: Hemisphere; icon: React.ComponentProps<typeof Ionicons>["name"]; hint: string }[] = [
  { label: "Northern", value: "northern", icon: "arrow-up-outline", hint: "Spring: Mar–May" },
  { label: "Southern", value: "southern", icon: "arrow-down-outline", hint: "Spring: Sep–Nov" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preference, setTheme } = useTheme();
  const { country, countryFlag, countryLabel, setCountry } = useCountry();
  const { hemisphere, setHemisphere } = useSeason();
  const { userName, setUserName, clearAnalysis, clearChatHistory, chatHistory, analysis, healthConcerns, setHealthConcerns } = useAnalysis();
  const { clearPortraits } = usePortraitHistory();
  const { clearBodyProfile } = useBodyProfile();
  const { clearAll: clearWardrobe } = useWardrobe();
  const { stylePrefs, setAge, addBrand, removeBrand, addBrandSize, removeBrandSize, updateBrandSize, clearStylePrefs } = useStylePrefs();
  const companionName = analysis?.companion_name ?? "Aura";
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userName ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [customConcern, setCustomConcern] = useState("");
  const [ageInput, setAgeInput] = useState(stylePrefs.age != null ? String(stylePrefs.age) : "");

  React.useEffect(() => {
    setAgeInput(stylePrefs.age != null ? String(stylePrefs.age) : "");
  }, [stylePrefs.age]);
  const [ageSaved, setAgeSaved] = useState(false);
  const [brandInput, setBrandInput] = useState("");
  const [newSizeBrand, setNewSizeBrand] = useState("");
  const [newSizeValue, setNewSizeValue] = useState("");
  const [editingSizeIndex, setEditingSizeIndex] = useState<number | null>(null);
  const [editSizeBrand, setEditSizeBrand] = useState("");
  const [editSizeValue, setEditSizeValue] = useState("");

  const toggleConcern = async (concern: string) => {
    await Haptics.selectionAsync();
    const next = healthConcerns.includes(concern)
      ? healthConcerns.filter((c) => c !== concern)
      : [...healthConcerns, concern];
    await setHealthConcerns(next);
  };

  const addCustomConcern = async () => {
    const trimmed = customConcern.trim();
    if (!trimmed || healthConcerns.includes(trimmed)) {
      setCustomConcern("");
      return;
    }
    await setHealthConcerns([...healthConcerns, trimmed]);
    setCustomConcern("");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveAge = async () => {
    Keyboard.dismiss();
    const parsed = parseInt(ageInput, 10);
    const age = !isNaN(parsed) && parsed > 0 && parsed < 120 ? parsed : null;
    await setAge(age);
    setAgeSaved(true);
    setTimeout(() => setAgeSaved(false), 1800);
  };

  const addCustomBrand = async () => {
    const trimmed = brandInput.trim();
    if (!trimmed) return;
    await addBrand(trimmed);
    setBrandInput("");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addSizeEntry = async () => {
    const b = newSizeBrand.trim();
    const s = newSizeValue.trim();
    if (!b || !s) return;
    await addBrandSize({ brand: b, size: s });
    setNewSizeBrand("");
    setNewSizeValue("");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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
        Promise.all([clearAnalysis(), clearPortraits(), clearBodyProfile(), clearWardrobe(), clearStylePrefs()]).then(() => {
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
            await Promise.all([clearAnalysis(), clearPortraits(), clearBodyProfile(), clearWardrobe(), clearStylePrefs()]);
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

          {/* Health & Sensitivities */}
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              HEALTH & SENSITIVITIES
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ padding: 14, gap: 12 }}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Allergies & Product Preferences
                </Text>
                <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                  Aura will avoid recommending products that conflict with your selected concerns.
                </Text>
                {/* Quick-add chips */}
                <View style={hStyles.pillWrap}>
                  {QUICK_HEALTH_CONCERNS.map((concern) => {
                    const active = healthConcerns.includes(concern);
                    return (
                      <Pressable
                        key={concern}
                        onPress={() => { void toggleConcern(concern); }}
                        style={[
                          hStyles.chip,
                          {
                            backgroundColor: active ? colors.primary : colors.secondary,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                        <Text style={[hStyles.chipText, { color: active ? "#fff" : colors.foreground }]}>
                          {concern}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {/* Custom concern input */}
                <View style={[hStyles.customRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <TextInput
                    value={customConcern}
                    onChangeText={setCustomConcern}
                    placeholder="Add custom concern…"
                    placeholderTextColor={colors.mutedForeground}
                    style={[hStyles.customInput, { color: colors.foreground }]}
                    returnKeyType="done"
                    onSubmitEditing={addCustomConcern}
                    maxLength={40}
                  />
                  <Pressable
                    onPress={addCustomConcern}
                    style={({ pressed }) => [
                      hStyles.addBtn,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </Pressable>
                </View>
                {/* Active custom concerns (non-quick-add) */}
                {healthConcerns.filter((c) => !QUICK_HEALTH_CONCERNS.includes(c)).length > 0 && (
                  <View style={hStyles.pillWrap}>
                    {healthConcerns
                      .filter((c) => !QUICK_HEALTH_CONCERNS.includes(c))
                      .map((concern) => (
                        <Pressable
                          key={concern}
                          onPress={() => { void toggleConcern(concern); }}
                          style={[hStyles.customPill, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
                        >
                          <Text style={[hStyles.customPillText, { color: colors.primary }]}>{concern}</Text>
                          <Ionicons name="close" size={12} color={colors.primary} />
                        </Pressable>
                      ))}
                  </View>
                )}
                <Text style={[hStyles.disclaimer, { color: colors.mutedForeground }]}>
                  For product filtering only — not medical advice. Consult a healthcare provider for medical concerns.
                </Text>
              </View>
            </View>
          </View>

          {/* Style Preferences */}
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              STYLE PREFERENCES
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Age */}
              <View style={{ padding: 14, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.secondary + "80" }]}>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>Age</Text>
                  {ageSaved && (
                    <View style={[styles.savedBadge, { backgroundColor: colors.primary + "18" }]}>
                      <Ionicons name="checkmark" size={12} color={colors.primary} />
                      <Text style={[styles.savedText, { color: colors.primary }]}>Saved</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                  Helps Aura tailor suggestions to your stage of life
                </Text>
                <View style={[hStyles.customRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <TextInput
                    value={ageInput}
                    onChangeText={setAgeInput}
                    placeholder="Your age (optional)"
                    placeholderTextColor={colors.mutedForeground}
                    style={[hStyles.customInput, { color: colors.foreground }]}
                    keyboardType="number-pad"
                    maxLength={3}
                    returnKeyType="done"
                    onSubmitEditing={() => { void handleSaveAge(); }}
                  />
                  <Pressable
                    onPress={() => { void handleSaveAge(); }}
                    style={({ pressed }) => [hStyles.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 14 }]} />

              {/* Favourite Brands */}
              <View style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.secondary + "80" }]}>
                    <Ionicons name="heart-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>Favourite Brands</Text>
                </View>
                <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                  Aura references these brands when giving style advice and shopping suggestions
                </Text>
                <View style={hStyles.pillWrap}>
                  {QUICK_BRANDS.map((brand) => {
                    const active = stylePrefs.favouriteBrands.includes(brand);
                    return (
                      <Pressable
                        key={brand}
                        onPress={async () => {
                          await Haptics.selectionAsync();
                          if (active) { await removeBrand(brand); } else { await addBrand(brand); }
                        }}
                        style={[
                          hStyles.chip,
                          {
                            backgroundColor: active ? colors.primary : colors.secondary,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                        <Text style={[hStyles.chipText, { color: active ? "#fff" : colors.foreground }]}>
                          {brand}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={[hStyles.customRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <TextInput
                    value={brandInput}
                    onChangeText={setBrandInput}
                    placeholder="Add another brand…"
                    placeholderTextColor={colors.mutedForeground}
                    style={[hStyles.customInput, { color: colors.foreground }]}
                    returnKeyType="done"
                    onSubmitEditing={() => { void addCustomBrand(); }}
                    maxLength={40}
                  />
                  <Pressable
                    onPress={() => { void addCustomBrand(); }}
                    style={({ pressed }) => [hStyles.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </Pressable>
                </View>
                {stylePrefs.favouriteBrands.filter((b) => !QUICK_BRANDS.includes(b)).length > 0 && (
                  <View style={hStyles.pillWrap}>
                    {stylePrefs.favouriteBrands
                      .filter((b) => !QUICK_BRANDS.includes(b))
                      .map((brand) => (
                        <Pressable
                          key={brand}
                          onPress={async () => { await removeBrand(brand); }}
                          style={[hStyles.customPill, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
                        >
                          <Text style={[hStyles.customPillText, { color: colors.primary }]}>{brand}</Text>
                          <Ionicons name="close" size={12} color={colors.primary} />
                        </Pressable>
                      ))}
                  </View>
                )}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 14 }]} />

              {/* Brand Sizes */}
              <View style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.secondary + "80" }]}>
                    <Ionicons name="resize-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>My Sizes by Brand</Text>
                </View>
                <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                  Add a size you know — Aura uses these to estimate sizing in other brands too
                </Text>
                {stylePrefs.brandSizes.length > 0 && (
                  <View style={{ gap: 6 }}>
                    {stylePrefs.brandSizes.map((entry, i) => (
                      editingSizeIndex === i ? (
                        <View key={i} style={spStyles.addSizeRow}>
                          <View style={[spStyles.addSizeField, { borderColor: colors.primary, backgroundColor: colors.muted }]}>
                            <TextInput
                              value={editSizeBrand}
                              onChangeText={setEditSizeBrand}
                              style={[spStyles.addSizeText, { color: colors.foreground }]}
                              maxLength={30}
                              autoFocus
                            />
                          </View>
                          <View style={[spStyles.addSizeFieldSmall, { borderColor: colors.primary, backgroundColor: colors.muted }]}>
                            <TextInput
                              value={editSizeValue}
                              onChangeText={setEditSizeValue}
                              style={[spStyles.addSizeText, { color: colors.foreground }]}
                              maxLength={10}
                            />
                          </View>
                          <Pressable
                            onPress={async () => {
                              await updateBrandSize(i, { brand: editSizeBrand, size: editSizeValue });
                              setEditingSizeIndex(null);
                            }}
                            style={({ pressed }) => [spStyles.addSizeBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
                          >
                            <Ionicons name="checkmark" size={18} color="#fff" />
                          </Pressable>
                          <Pressable
                            onPress={() => setEditingSizeIndex(null)}
                            style={({ pressed }) => [spStyles.addSizeBtn, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
                          >
                            <Ionicons name="close" size={18} color={colors.mutedForeground} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          key={i}
                          onPress={() => {
                            setEditingSizeIndex(i);
                            setEditSizeBrand(entry.brand);
                            setEditSizeValue(entry.size);
                          }}
                          style={[spStyles.sizeRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                        >
                          <Text style={[spStyles.sizeBrand, { color: colors.foreground }]}>{entry.brand}</Text>
                          <View style={[spStyles.sizeBadge, { backgroundColor: colors.primary + "18" }]}>
                            <Text style={[spStyles.sizeLabel, { color: colors.primary }]}>{entry.size}</Text>
                          </View>
                          <Ionicons name="pencil-outline" size={14} color={colors.mutedForeground} style={{ marginRight: 2 }} />
                          <Pressable
                            onPress={async () => { await removeBrandSize(i); }}
                            hitSlop={8}
                            style={{ padding: 4 }}
                          >
                            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                          </Pressable>
                        </Pressable>
                      )
                    ))}
                  </View>
                )}
                <View style={spStyles.addSizeRow}>
                  <View style={[spStyles.addSizeField, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                    <TextInput
                      value={newSizeBrand}
                      onChangeText={setNewSizeBrand}
                      placeholder="Brand"
                      placeholderTextColor={colors.mutedForeground}
                      style={[spStyles.addSizeText, { color: colors.foreground }]}
                      maxLength={30}
                    />
                  </View>
                  <View style={[spStyles.addSizeFieldSmall, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                    <TextInput
                      value={newSizeValue}
                      onChangeText={setNewSizeValue}
                      placeholder="Size"
                      placeholderTextColor={colors.mutedForeground}
                      style={[spStyles.addSizeText, { color: colors.foreground }]}
                      maxLength={10}
                    />
                  </View>
                  <Pressable
                    onPress={() => { void addSizeEntry(); }}
                    style={({ pressed }) => [spStyles.addSizeBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </Pressable>
                </View>
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

          {/* Wardrobe — hemisphere */}
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              WARDROBE
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.row, { paddingBottom: 8 }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="earth-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Hemisphere
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    Sets your seasonal calendar for wardrobe planning
                  </Text>
                </View>
              </View>
              <View style={[styles.themeToggleRow, { paddingHorizontal: 14, paddingBottom: 14 }]}>
                {HEMISPHERE_OPTIONS.map((opt) => {
                  const active = hemisphere === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={async () => {
                        await Haptics.selectionAsync();
                        await setHemisphere(opt.value);
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
                      <View>
                        <Text style={[styles.themeOptionText, { color: active ? "#fff" : colors.foreground }]}>
                          {opt.label}
                        </Text>
                        <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: active ? "rgba(255,255,255,0.75)" : colors.mutedForeground }}>
                          {opt.hint}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
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

const hStyles = StyleSheet.create({
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  customInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  customPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  customPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    fontStyle: "italic",
  },
});

const spStyles = StyleSheet.create({
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  sizeBrand: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  sizeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sizeLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  addSizeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  addSizeField: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  addSizeFieldSmall: {
    flex: 0.55,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  addSizeText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addSizeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
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
