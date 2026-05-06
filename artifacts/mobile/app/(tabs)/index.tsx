import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis, type AnalysisResult } from "@/context/AnalysisContext";
import { getDailyTip } from "@/constants/tips";
import { getColorSeason, getSeasonProfile } from "@/constants/seasons";
import { useColors } from "@/hooks/useColors";

const ND = Platform.OS !== "web";

const { width } = Dimensions.get("window");
const CARD_W = Math.min(width * 0.44, 196);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

type CategoryCard = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  gradient: [string, string];
};

function buildCategories(a: AnalysisResult): CategoryCard[] {
  return [
    {
      title: "Skincare",
      subtitle: a.beauty_recommendations[0] ?? "Routine for you",
      icon: "water-outline",
      gradient: ["#FDECD3", "#F5D5B0"],
    },
    {
      title: "Cosmetics",
      subtitle: a.beauty_recommendations[1] ?? "Your glam look",
      icon: "sparkles-outline",
      gradient: ["#F0E4F5", "#DFC8EF"],
    },
    {
      title: "Hairstyle",
      subtitle: a.hairstyle_suggestions[0] ?? "Flatters your shape",
      icon: "cut-outline",
      gradient: ["#D9EEF5", "#B8DCEA"],
    },
    {
      title: "Outfit",
      subtitle: a.fashion_recommendations[0] ?? "Curated for you",
      icon: "shirt-outline",
      gradient: ["#D9F5E4", "#B8EAD0"],
    },
  ];
}

type Rec = { title: string; desc: string; icon: React.ComponentProps<typeof Ionicons>["name"] };

function buildRecs(a: AnalysisResult): Rec[] {
  const recs: Rec[] = [];
  if (a.beauty_recommendations[0])
    recs.push({ title: "Glow Routine", desc: a.beauty_recommendations[0], icon: "sunny-outline" });
  if (a.beauty_recommendations[1])
    recs.push({ title: "Makeup Look", desc: a.beauty_recommendations[1], icon: "color-palette-outline" });
  if (a.hairstyle_suggestions[0])
    recs.push({ title: "Hairstyle Tip", desc: a.hairstyle_suggestions[0], icon: "cut-outline" });
  if (a.fashion_recommendations[0])
    recs.push({ title: "Style Direction", desc: a.fashion_recommendations[0], icon: "shirt-outline" });
  if (a.glasses_suggestions[0])
    recs.push({ title: "Eyewear Pick", desc: a.glasses_suggestions[0], icon: "glasses-outline" });
  return recs;
}

function useFadeIn(delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: ND,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: ND,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return { opacity: anim, transform: [{ translateY }] };
}

function SeasonCard({
  seasonProfile,
  colors,
}: {
  seasonProfile: ReturnType<typeof getSeasonProfile>;
  colors: ReturnType<typeof useColors>;
}) {
  const anim = useFadeIn(200);
  return (
    <Animated.View style={[styles.sectionPad, anim]}>
      <LinearGradient
        colors={seasonProfile.gradient}
        style={[styles.seasonCard, { borderColor: colors.border }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.seasonCardHeader}>
          <View>
            <Text style={[styles.seasonCardLabel, { color: colors.mutedForeground }]}>
              Color Season
            </Text>
            <View style={styles.seasonCardTitle}>
              <Text style={styles.seasonCardEmoji}>{seasonProfile.emoji}</Text>
              <Text style={[styles.seasonCardName, { color: colors.foreground }]}>
                {seasonProfile.season}
              </Text>
              <Text style={[styles.seasonCardSubtitle, { color: colors.mutedForeground }]}>
                {seasonProfile.subtitle}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={async () => {
              await Haptics.selectionAsync();
              router.push("/profile");
            }}
            style={({ pressed }) => [
              styles.seasonViewBtn,
              { backgroundColor: "rgba(255,255,255,0.7)", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.seasonViewText, { color: colors.primary }]}>Details</Text>
          </Pressable>
        </View>
        <Text style={[styles.seasonDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {seasonProfile.description}
        </Text>
        <View style={styles.seasonSwatches}>
          {seasonProfile.palette.slice(0, 5).map((hex, i) => (
            <View key={i} style={[styles.seasonSwatch, { backgroundColor: hex }]} />
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function DailyTip({
  tip,
  colors,
}: {
  tip: ReturnType<typeof getDailyTip>;
  colors: ReturnType<typeof useColors>;
}) {
  const anim = useFadeIn(280);
  return (
    <Animated.View style={[styles.sectionPad, anim]}>
      <View
        style={[
          styles.tipCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.tipHeader}>
          <View style={[styles.tipIconWrap, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons
              name={tip.icon as React.ComponentProps<typeof Ionicons>["name"]}
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.tipMeta}>
            <Text style={[styles.tipLabel, { color: colors.mutedForeground }]}>
              TIP OF THE DAY
            </Text>
            <Text style={[styles.tipTitle, { color: colors.foreground }]}>
              {tip.title}
            </Text>
          </View>
        </View>
        <Text style={[styles.tipBody, { color: colors.mutedForeground }]}>
          {tip.body}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri, userName } = useAnalysis();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 80;

  if (!analysis) {
    return <OnboardingView colors={colors} topPad={topPad} botPad={botPad} />;
  }

  const cats = buildCategories(analysis);
  const recs = buildRecs(analysis);
  const tip = getDailyTip(analysis);
  const season = getColorSeason(analysis.undertone, analysis.skin_tone);
  const seasonProfile = getSeasonProfile(season);
  const displayName = userName?.trim() ? `, ${userName.trim()}` : "";

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      <Header
        greeting={`${getGreeting()}${displayName} ✦`}
        colors={colors}
        topPad={topPad}
      />
      <ProfileCard analysis={analysis} imageUri={imageUri} colors={colors} season={season} seasonEmoji={seasonProfile.emoji} />
      <PaletteStrip palette={analysis.color_palette} colors={colors} />
      <SeasonCard seasonProfile={seasonProfile} colors={colors} />
      <DailyTip tip={tip} colors={colors} />
      <TodayForYou cats={cats} colors={colors} />
      <AIRecommendations recs={recs} colors={colors} />
    </ScrollView>
  );
}

function Header({
  greeting,
  colors,
  topPad,
}: {
  greeting: string;
  colors: ReturnType<typeof useColors>;
  topPad: number;
}) {
  const anim = useFadeIn(0);
  return (
    <Animated.View
      style={[styles.header, { paddingTop: topPad + 16 }, anim]}
    >
      <View style={styles.headerLeft}>
        <Text style={[styles.greeting, { color: colors.foreground }]}>
          {greeting}
        </Text>
        <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
          Your AI stylist is ready for you
        </Text>
      </View>
      <View style={styles.headerBtns}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/settings");
          }}
          style={({ pressed }) => [
            styles.headerIconBtn,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="settings-outline" size={18} color={colors.foreground} />
        </Pressable>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/upload");
          }}
          style={({ pressed }) => [
            styles.aiBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="sparkles" size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ProfileCard({
  analysis,
  imageUri,
  colors,
  season,
  seasonEmoji,
}: {
  analysis: AnalysisResult;
  imageUri: string | null;
  colors: ReturnType<typeof useColors>;
  season: string;
  seasonEmoji: string;
}) {
  const anim = useFadeIn(80);
  return (
    <Animated.View style={[styles.sectionPad, anim]}>
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.profilePhoto}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.profilePhoto,
              styles.profilePhotoPlaceholder,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Ionicons name="person" size={28} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.profileArchetype, { color: colors.primary }]}>
            {analysis.style_archetype}
          </Text>
          <View style={styles.profileSubRow}>
            <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
              Your Style Profile
            </Text>
            <View style={[styles.seasonPill, { backgroundColor: colors.primary + "18" }]}>
              <Text style={styles.seasonEmoji}>{seasonEmoji}</Text>
              <Text style={[styles.seasonPillText, { color: colors.primary }]}>{season}</Text>
            </View>
          </View>
          <View style={styles.profileTraits}>
            {[
              { icon: "sunny-outline" as const, label: analysis.undertone },
              { icon: "scan-outline" as const, label: analysis.face_shape },
              { icon: "cut-outline" as const, label: analysis.hair_type },
            ].map((t, i) => (
              <View key={i} style={styles.traitRow}>
                <Ionicons name={t.icon} size={13} color={colors.mutedForeground} />
                <Text style={[styles.traitText, { color: colors.foreground }]}>
                  {t.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Pressable
          onPress={async () => {
            await Haptics.selectionAsync();
            router.push("/profile");
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[styles.editLabel, { color: colors.primary }]}>View ›</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function PaletteStrip({
  palette,
  colors,
}: {
  palette: string[];
  colors: ReturnType<typeof useColors>;
}) {
  const anim = useFadeIn(160);
  return (
    <Animated.View style={[styles.sectionPad, anim]}>
      <View style={styles.paletteRow}>
        {palette.slice(0, 6).map((hex, i) => (
          <View key={i} style={[styles.paletteDot, { backgroundColor: hex }]} />
        ))}
      </View>
      <Text style={[styles.paletteCaption, { color: colors.mutedForeground }]}>
        Your personal color story
      </Text>
    </Animated.View>
  );
}

function TodayForYou({
  cats,
  colors,
}: {
  cats: CategoryCard[];
  colors: ReturnType<typeof useColors>;
}) {
  const anim = useFadeIn(240);
  return (
    <Animated.View style={anim}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Today for you ✦
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {cats.map((cat, i) => (
          <Pressable
            key={i}
            onPress={async () => {
              await Haptics.selectionAsync();
              router.push("/wardrobe");
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          >
            <LinearGradient
              colors={cat.gradient}
              style={[styles.categoryCard, { borderColor: colors.border }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.catTitle, { color: colors.foreground }]}>
                {cat.title}
              </Text>
              <Text
                style={[styles.catSubtitle, { color: colors.mutedForeground }]}
                numberOfLines={3}
              >
                {cat.subtitle}
              </Text>
              <View
                style={[
                  styles.catIconCircle,
                  { backgroundColor: "rgba(255,255,255,0.65)" },
                ]}
              >
                <Ionicons name={cat.icon} size={18} color={colors.primary} />
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function AIRecommendations({
  recs,
  colors,
}: {
  recs: Rec[];
  colors: ReturnType<typeof useColors>;
}) {
  const anim = useFadeIn(320);
  return (
    <Animated.View style={[styles.sectionPad, anim]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>
        AI Recommendations ✦
      </Text>
      {recs.map((rec, i) => (
        <Pressable
          key={i}
          onPress={async () => {
            await Haptics.selectionAsync();
          }}
          style={({ pressed }) => [
            styles.recRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={[styles.recThumb, { backgroundColor: colors.secondary }]}>
            <Ionicons name={rec.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.recContent}>
            <Text style={[styles.recTitle, { color: colors.foreground }]}>
              {rec.title}
            </Text>
            <Text
              style={[styles.recDesc, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {rec.desc}
            </Text>
          </View>
          <View style={[styles.viewPill, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.viewPillText, { color: colors.primary }]}>
              View
            </Text>
          </View>
        </Pressable>
      ))}
    </Animated.View>
  );
}

function OnboardingView({
  colors,
  topPad,
  botPad,
}: {
  colors: ReturnType<typeof useColors>;
  topPad: number;
  botPad: number;
}) {
  const anim = useFadeIn(0);
  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.onboardContent,
        { paddingTop: topPad + 24, paddingBottom: botPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[{ alignItems: "center", marginBottom: 32 }, anim]}>
        <LinearGradient
          colors={["#F5EDE3", "#E8C4A0"]}
          style={styles.logoGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="sparkles" size={32} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.appLabel, { color: colors.mutedForeground }]}>
          AI IDENTITY STYLIST
        </Text>
      </Animated.View>

      <Text style={[styles.onboardTitle, { color: colors.foreground }]}>
        Discover what{"\n"}truly suits you.
      </Text>
      <Text style={[styles.onboardSub, { color: colors.mutedForeground }]}>
        Upload a selfie and receive a personalized beauty and fashion profile crafted by AI.
      </Text>

      <LinearGradient
        colors={["#F5EDE3", "#FAF2EA"]}
        style={[styles.previewCard, { borderColor: colors.border }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.previewPalette}>
          {["#C4956A", "#E8C4A0", "#F5EDE3", "#9B8B7E", "#4A3728"].map((c, i) => (
            <View key={i} style={[styles.previewDot, { backgroundColor: c }]} />
          ))}
        </View>
        <View style={styles.previewTags}>
          {["Warm Undertone", "Oval Face", "Soft Classic", "Wavy Hair"].map((tag, i) => (
            <View
              key={i}
              style={[styles.previewTag, { backgroundColor: colors.primary + "20" }]}
            >
              <Text style={[styles.previewTagText, { color: colors.primary }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.previewCaption, { color: colors.mutedForeground }]}>
          Sample analysis output
        </Text>
      </LinearGradient>

      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/upload");
        }}
        style={({ pressed }) => [
          styles.startBtn,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="sparkles" size={20} color={colors.primaryForeground} />
        <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>
          Start Style Analysis
        </Text>
        <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
      </Pressable>

      <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>
        Your photo is analyzed securely and never stored.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  greetingSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerBtns: { flexDirection: "row", gap: 8, alignItems: "center" },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionPad: { paddingHorizontal: 20, marginBottom: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  profilePhoto: { width: 72, height: 72, borderRadius: 36 },
  profilePhotoPlaceholder: { alignItems: "center", justifyContent: "center" },
  profileInfo: { flex: 1 },
  profileArchetype: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  profileSubRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  profileSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  seasonPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  seasonEmoji: { fontSize: 11 },
  seasonPillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  profileTraits: { gap: 5 },
  traitRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  traitText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  editLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  paletteRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  paletteDot: { width: 36, height: 36, borderRadius: 18 },
  paletteCaption: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  categoryScroll: { paddingHorizontal: 20, gap: 12 },
  categoryCard: {
    width: CARD_W,
    minHeight: 168,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  catTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  catSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, flex: 1 },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  recRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
  },
  recThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  recContent: { flex: 1 },
  recTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  recDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  viewPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  viewPillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  seasonCard: { borderRadius: 20, padding: 18, borderWidth: 1, gap: 12 },
  seasonCardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  seasonCardLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  seasonCardTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  seasonCardEmoji: { fontSize: 20 },
  seasonCardName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seasonCardSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  seasonViewBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  seasonViewText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  seasonDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  seasonSwatches: { flexDirection: "row", gap: 8 },
  seasonSwatch: { width: 32, height: 32, borderRadius: 16 },
  tipCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  tipIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tipMeta: { flex: 1 },
  tipLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 2 },
  tipTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tipBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  onboardContent: { paddingHorizontal: 24 },
  logoGrad: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  appLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2.5 },
  onboardTitle: { fontSize: 36, fontFamily: "Inter_700Bold", lineHeight: 44, marginBottom: 14 },
  onboardSub: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24, marginBottom: 28 },
  previewCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 28 },
  previewPalette: { flexDirection: "row", gap: 10, marginBottom: 14 },
  previewDot: { width: 34, height: 34, borderRadius: 17 },
  previewTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  previewTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  previewTagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  previewCaption: { fontSize: 12, fontFamily: "Inter_400Regular" },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    marginBottom: 16,
  },
  startBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  privacyNote: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular" },
});
