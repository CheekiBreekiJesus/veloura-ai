import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Linking,
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

const MOCK_PRODUCTS = [
  {
    name: "Soft Matte Foundation",
    category: "Beauty",
    reason: "Matches warm undertones perfectly",
    icon: "color-fill-outline" as const,
  },
  {
    name: "Warm Terracotta Palette",
    category: "Makeup",
    reason: "Complements your skin tone beautifully",
    icon: "layers-outline" as const,
  },
  {
    name: "Silk Wrap Midi Dress",
    category: "Fashion",
    reason: "Flatters your face shape and archetype",
    icon: "shirt-outline" as const,
  },
  {
    name: "Gold Oval Sunglasses",
    category: "Accessories",
    reason: "Balances and enhances your features",
    icon: "glasses-outline" as const,
  },
];

type Tab = "profile" | "beauty" | "fashion" | "products";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri, clearAnalysis } = useAnalysis();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!analysis) {
    return (
      <View
        style={[
          styles.emptyRoot,
          {
            backgroundColor: colors.background,
            paddingTop: topPad + 24,
            paddingBottom: botPad + 24,
          },
        ]}
      >
        <Ionicons
          name="person-circle-outline"
          size={64}
          color={colors.mutedForeground}
        />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No Analysis Yet
        </Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
          Upload a selfie to get your personalized style profile.
        </Text>
        <Pressable
          onPress={() => router.replace("/upload")}
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
            Start Analysis
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleReset = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearAnalysis();
    router.replace("/");
  };

  const tabs: { key: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
    { key: "profile", label: "Profile", icon: "person-outline" },
    { key: "beauty", label: "Beauty", icon: "sparkles-outline" },
    { key: "fashion", label: "Fashion", icon: "shirt-outline" },
    { key: "products", label: "Shop", icon: "bag-outline" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#F5EDE3", "#FAF8F5"]}
        style={[styles.heroHeader, { paddingTop: topPad + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.card + "CC", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Your Profile
          </Text>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.card + "CC", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.heroContent}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={[styles.profileImage, { borderColor: colors.card }]}
              contentFit="cover"
            />
          )}
          <View style={styles.heroInfo}>
            <Text style={[styles.archetypeLabel, { color: colors.primary }]}>
              {analysis.style_archetype}
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: colors.card }]}>
                <Text style={[styles.tagText, { color: colors.foreground }]}>
                  {analysis.face_shape}
                </Text>
              </View>
              <View style={[styles.tag, { backgroundColor: colors.card }]}>
                <Text style={[styles.tagText, { color: colors.foreground }]}>
                  {analysis.undertone}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={async () => {
              await Haptics.selectionAsync();
              setActiveTab(t.key);
            }}
            style={styles.tab}
          >
            <Ionicons
              name={t.icon}
              size={20}
              color={activeTab === t.key ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === t.key
                      ? colors.primary
                      : colors.mutedForeground,
                  fontFamily:
                    activeTab === t.key
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                },
              ]}
            >
              {t.label}
            </Text>
            {activeTab === t.key && (
              <View
                style={[styles.tabIndicator, { backgroundColor: colors.primary }]}
              />
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: botPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "profile" && (
          <ProfileTab analysis={analysis} colors={colors} />
        )}
        {activeTab === "beauty" && (
          <BeautyTab analysis={analysis} colors={colors} />
        )}
        {activeTab === "fashion" && (
          <FashionTab analysis={analysis} colors={colors} />
        )}
        {activeTab === "products" && <ProductsTab colors={colors} />}
      </ScrollView>
    </View>
  );
}

function ProfileTab({
  analysis,
  colors,
}: {
  analysis: ReturnType<typeof useAnalysis>["analysis"] & object;
  colors: ReturnType<typeof useColors>;
}) {
  if (!analysis) return null;

  const traits = [
    { label: "Face Shape", value: analysis.face_shape, icon: "scan-outline" as const },
    { label: "Skin Tone", value: analysis.skin_tone, icon: "sunny-outline" as const },
    { label: "Undertone", value: analysis.undertone, icon: "color-filter-outline" as const },
    { label: "Eye Shape", value: analysis.eye_shape, icon: "eye-outline" as const },
    { label: "Lip Shape", value: analysis.lip_shape, icon: "happy-outline" as const },
    { label: "Hair Type", value: analysis.hair_type, icon: "cut-outline" as const },
  ];

  return (
    <View style={styles.tabContent}>
      <SectionHeader title="Identity Profile" colors={colors} />
      <View style={styles.traitsGrid}>
        {traits.map((t, i) => (
          <View
            key={i}
            style={[
              styles.traitCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.traitIcon,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Ionicons name={t.icon} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.traitLabel, { color: colors.mutedForeground }]}>
              {t.label}
            </Text>
            <Text style={[styles.traitValue, { color: colors.foreground }]}>
              {t.value}
            </Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Your Color Palette" colors={colors} />
      <View
        style={[
          styles.paletteCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.paletteRow}>
          {analysis.color_palette.map((color, i) => (
            <View key={i} style={styles.paletteItem}>
              <View
                style={[styles.paletteSwatch, { backgroundColor: color }]}
              />
              <Text style={[styles.paletteHex, { color: colors.mutedForeground }]}>
                {color}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.paletteDesc, { color: colors.mutedForeground }]}>
          These colors are curated for your unique complexion
        </Text>
      </View>
    </View>
  );
}

function BeautyTab({
  analysis,
  colors,
}: {
  analysis: ReturnType<typeof useAnalysis>["analysis"] & object;
  colors: ReturnType<typeof useColors>;
}) {
  if (!analysis) return null;
  return (
    <View style={styles.tabContent}>
      <SectionHeader title="Beauty Recommendations" colors={colors} />
      {analysis.beauty_recommendations.map((rec, i) => (
        <RecommendationCard
          key={i}
          text={rec}
          icon="sparkles-outline"
          colors={colors}
          index={i}
        />
      ))}
      <SectionHeader title="Hairstyle Suggestions" colors={colors} />
      {analysis.hairstyle_suggestions.map((rec, i) => (
        <RecommendationCard
          key={i}
          text={rec}
          icon="cut-outline"
          colors={colors}
          index={i}
        />
      ))}
      <SectionHeader title="Glasses Suggestions" colors={colors} />
      {analysis.glasses_suggestions.map((rec, i) => (
        <RecommendationCard
          key={i}
          text={rec}
          icon="glasses-outline"
          colors={colors}
          index={i}
        />
      ))}
    </View>
  );
}

function FashionTab({
  analysis,
  colors,
}: {
  analysis: ReturnType<typeof useAnalysis>["analysis"] & object;
  colors: ReturnType<typeof useColors>;
}) {
  if (!analysis) return null;
  return (
    <View style={styles.tabContent}>
      <SectionHeader title="Fashion Recommendations" colors={colors} />
      {analysis.fashion_recommendations.map((rec, i) => (
        <RecommendationCard
          key={i}
          text={rec}
          icon="shirt-outline"
          colors={colors}
          index={i}
        />
      ))}
    </View>
  );
}

function ProductsTab({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.tabContent}>
      <SectionHeader title="Curated for You" colors={colors} />
      <Text style={[styles.shopDisclaimer, { color: colors.mutedForeground }]}>
        Products selected based on your style profile
      </Text>
      {MOCK_PRODUCTS.map((p, i) => (
        <Pressable
          key={i}
          onPress={async () => {
            await Haptics.selectionAsync();
          }}
          style={({ pressed }) => [
            styles.productCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View
            style={[styles.productIcon, { backgroundColor: colors.secondary }]}
          >
            <Ionicons name={p.icon} size={24} color={colors.primary} />
          </View>
          <View style={styles.productInfo}>
            <View
              style={[styles.productCat, { backgroundColor: colors.accent + "50" }]}
            >
              <Text style={[styles.productCatText, { color: colors.primary }]}>
                {p.category}
              </Text>
            </View>
            <Text style={[styles.productName, { color: colors.foreground }]}>
              {p.name}
            </Text>
            <Text style={[styles.productReason, { color: colors.mutedForeground }]}>
              {p.reason}
            </Text>
          </View>
          <View style={[styles.viewBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.viewBtnText, { color: colors.primaryForeground }]}>
              View
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function SectionHeader({
  title,
  colors,
}: {
  title: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
      {title}
    </Text>
  );
}

function RecommendationCard({
  text,
  icon,
  colors,
  index,
}: {
  text: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  colors: ReturnType<typeof useColors>;
  index: number;
}) {
  return (
    <View
      style={[
        styles.recCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.recIndex, { backgroundColor: colors.primary + "18" }]}>
        <Text style={[styles.recIndexText, { color: colors.primary }]}>
          {index + 1}
        </Text>
      </View>
      <Text style={[styles.recText, { color: colors.foreground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_600SemiBold" },
  emptyDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  heroHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  heroContent: { flexDirection: "row", alignItems: "center", gap: 16 },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  heroInfo: { flex: 1 },
  archetypeLabel: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  tagText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
    position: "relative",
  },
  tabLabel: { fontSize: 11 },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 2,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  tabContent: { gap: 12 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  traitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  traitCard: {
    width: (width - 60) / 2,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  traitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  traitLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  traitValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  paletteCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  paletteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  paletteItem: { alignItems: "center", gap: 4 },
  paletteSwatch: { width: 40, height: 40, borderRadius: 20 },
  paletteHex: { fontSize: 9, fontFamily: "Inter_400Regular" },
  paletteDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  recCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  recIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  recIndexText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  recText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  shopDisclaimer: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  productIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1, gap: 4 },
  productCat: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productCatText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  productReason: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
