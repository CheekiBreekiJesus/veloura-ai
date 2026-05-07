import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import BackButton from "@/components/BackButton";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  WELLNESS_ARTICLES,
  type WellnessProduct,
  type WellnessVideo,
} from "@/data/wellness-content";

const RETAILER_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  Sephora: "flower-outline",
  Amazon: "cart-outline",
  iHerb: "leaf-outline",
};

async function openUrl(url: string) {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: "#FAF8F5",
  });
}

const RETAILER_GRADIENTS: Record<string, [string, string]> = {
  Sephora: ["#FCE4EC", "#F8BBD9"],
  Amazon: ["#FFF3E0", "#FFE082"],
  iHerb: ["#E8F5E9", "#A5D6A7"],
};

function ProductCard({
  product,
  colors,
}: {
  product: WellnessProduct;
  colors: ReturnType<typeof useColors>;
}) {
  const icon = RETAILER_ICONS[product.retailer] ?? "open-outline";
  const grad = RETAILER_GRADIENTS[product.retailer] ?? ["#F5EDE3", "#EDE3D9"];
  return (
    <Pressable
      onPress={() => openUrl(product.url)}
      style={({ pressed }) => [
        styles.productCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <LinearGradient colors={grad} style={styles.productCardTop} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={24} color="#C4956A" />
      </LinearGradient>
      <View style={styles.productCardBody}>
        <Text style={[styles.productCardName, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.productCardMeta}>
          <Text style={[styles.productCardPrice, { color: colors.primary }]}>{product.price}</Text>
          <View style={[styles.productCardRetailerChip, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.productCardRetailerText, { color: colors.mutedForeground }]}>
              {product.retailer}
            </Text>
          </View>
        </View>
        <View style={styles.productCardFooter}>
          <Ionicons name="open-outline" size={11} color={colors.mutedForeground} />
          <Text style={[styles.productCardShop, { color: colors.mutedForeground }]}>Shop now</Text>
        </View>
      </View>
    </Pressable>
  );
}

function VideoCard({
  video,
  colors,
}: {
  video: WellnessVideo;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() => openUrl(video.url)}
      style={({ pressed }) => [
        styles.videoCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <LinearGradient
        colors={video.thumbnailGradient}
        style={styles.videoThumb}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.playBtn, { backgroundColor: "rgba(255,255,255,0.8)" }]}>
          <Ionicons name="play" size={16} color="#C4956A" />
        </View>
      </LinearGradient>
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={styles.videoMeta}>
          <Ionicons name="logo-youtube" size={13} color="#FF0000" />
          <Text style={[styles.videoChannel, { color: colors.mutedForeground }]}>
            {video.channel}
          </Text>
        </View>
      </View>
      <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ArticleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { articleId } = useLocalSearchParams<{ articleId: string }>();

  const article = WELLNESS_ARTICLES.find((a) => a.id === articleId);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (!article) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Article not found</Text>
        <BackButton />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={article.gradientColors}
          style={[styles.hero, { paddingTop: topPad + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <BackButton
            style={{ backgroundColor: "rgba(255,255,255,0.7)", marginBottom: 20 }}
            iconColor="#2D1F14"
          />

          <View style={styles.heroBody}>
            <View style={[styles.heroIcon, { backgroundColor: "rgba(255,255,255,0.65)" }]}>
              <Ionicons
                name={article.icon as React.ComponentProps<typeof Ionicons>["name"]}
                size={44}
                color="#C4956A"
              />
            </View>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroCatBadge, { backgroundColor: "rgba(255,255,255,0.65)" }]}>
                <Text style={styles.heroCatText}>{article.category}</Text>
              </View>
              <View style={[styles.heroTimeBadge, { backgroundColor: "rgba(255,255,255,0.65)" }]}>
                <Ionicons name="time-outline" size={12} color="#6B4C35" />
                <Text style={styles.heroTimeText}>{article.readingMins} min read</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.articleTitle, { color: colors.foreground }]}>{article.title}</Text>
        </View>

        {/* Intro */}
        <View style={styles.contentSection}>
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>{article.intro}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Tips */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How to do it</Text>
          </View>
          {article.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipNum, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.tipNumText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Products */}
        {article.products.length > 0 && (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Products We Love</Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Tap to shop — opens retailer in browser
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productScroll}
            >
              {article.products.map((product, i) => (
                <ProductCard key={i} product={product} colors={colors} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Videos */}
        {article.videos.length > 0 && (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Watch & Learn</Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Curated YouTube tutorials and guides
            </Text>
            {article.videos.map((video, i) => (
              <VideoCard key={i} video={video} colors={colors} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heroBody: { alignItems: "center", gap: 16 },
  heroIcon: { width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  heroBadgeRow: { flexDirection: "row", gap: 8 },
  heroCatBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  heroCatText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#6B4C35" },
  heroTimeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  heroTimeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B4C35" },

  titleSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4 },
  articleTitle: { fontSize: 24, fontFamily: "Inter_700Bold", lineHeight: 32 },

  contentSection: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  intro: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 26 },

  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -8, marginBottom: 4 },

  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tipNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  tipNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  tipText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },

  productScroll: { gap: 12, paddingBottom: 4 },
  productCard: { width: 155, borderRadius: 18, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  productCardTop: { height: 70, alignItems: "center", justifyContent: "center" },
  productCardBody: { padding: 12, gap: 6 },
  productCardName: { fontSize: 12, fontFamily: "Inter_600SemiBold", lineHeight: 17 },
  productCardMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  productCardPrice: { fontSize: 12, fontFamily: "Inter_700Bold" },
  productCardRetailerChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  productCardRetailerText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  productCardFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  productCardShop: { fontSize: 10, fontFamily: "Inter_400Regular" },

  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  videoThumb: { width: 90, height: 72, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  playBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  videoInfo: { flex: 1, padding: 12, gap: 6 },
  videoTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  videoMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  videoChannel: { fontSize: 11, fontFamily: "Inter_400Regular" },

  notFoundText: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginTop: 12, marginBottom: 20 },
  backFab: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
});
