import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Ellipse, Line, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";
import {
  buildFaceFeatureCards,
  FeatureCard,
  getFeatureBalanceStyle,
  getHarmonyLabel,
} from "@/lib/faceFeatures";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const PORTRAIT_W = Math.min(SCREEN_W * 0.46, 180);
const CARD_W = (SCREEN_W - PORTRAIT_W - 56) / 2;
const PORTRAIT_H = PORTRAIT_W * 1.25;
const PORTRAIT_TOP_H = PORTRAIT_H + 64;

const CARD_GOLD = "#C4956A";
const LINE_OPACITY = 0.35;

function AnimatedLine({
  anim,
  x1, y1, x2, y2,
  color,
}: {
  anim: Animated.Value;
  x1: number; y1: number; x2: number; y2: number;
  color: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const [x2anim, setX2anim] = React.useState(x1);
  const [y2anim, setY2anim] = React.useState(y1);
  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      setX2anim(x1 + dx * value);
      setY2anim(y1 + dy * value);
    });
    return () => anim.removeListener(id);
  }, [anim, x1, y1, dx, dy]);
  return (
    <Line
      x1={x1} y1={y1}
      x2={x2anim} y2={y2anim}
      stroke={color}
      strokeWidth={1}
      strokeOpacity={LINE_OPACITY}
      strokeLinecap="round"
    />
  );
}

function FaceOverlaySvg({
  opacity,
  w,
  h,
}: {
  opacity: Animated.Value;
  w: number;
  h: number;
}) {
  const [opacityVal, setOpacityVal] = React.useState(0);
  useEffect(() => {
    const id = opacity.addListener(({ value }) => setOpacityVal(value));
    return () => opacity.removeListener(id);
  }, [opacity]);

  const cx = w / 2;
  const cy = h / 2;
  const goldFaint = `rgba(196,149,106,${0.18 * opacityVal})`;
  const whiteFaint = `rgba(255,255,255,${0.15 * opacityVal})`;

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Ellipse
        cx={cx}
        cy={cy * 1.05}
        rx={w * 0.3}
        ry={h * 0.42}
        stroke={goldFaint}
        strokeWidth={1.5}
        fill="none"
      />
      <Line x1={cx - w * 0.28} y1={cy * 0.62} x2={cx + w * 0.28} y2={cy * 0.62}
        stroke={whiteFaint} strokeWidth={1} />
      <Line x1={cx - w * 0.22} y1={cy * 0.62} x2={cx - w * 0.04} y2={cy * 0.5}
        stroke={whiteFaint} strokeWidth={1} />
      <Line x1={cx + w * 0.22} y1={cy * 0.62} x2={cx + w * 0.04} y2={cy * 0.5}
        stroke={whiteFaint} strokeWidth={1} />
      <Line x1={cx} y1={cy * 0.5} x2={cx} y2={cy * 1.35}
        stroke={whiteFaint} strokeWidth={1} />
      <Path
        d={`M ${cx - w * 0.18} ${cy * 1.55} Q ${cx} ${cy * 1.72} ${cx + w * 0.18} ${cy * 1.55}`}
        stroke={goldFaint}
        strokeWidth={1.5}
        fill="none"
      />
    </Svg>
  );
}

function ConnectorLinesSvg({
  anims,
  containerW,
  containerH,
  portraitLeft,
  portraitTop,
  cardPositions,
}: {
  anims: Animated.Value[];
  containerW: number;
  containerH: number;
  portraitLeft: number;
  portraitTop: number;
  cardPositions: { x: number; y: number; side: "left" | "right" }[];
}) {
  const portraitRight = portraitLeft + PORTRAIT_W;
  const portraitCy = portraitTop + PORTRAIT_H / 2;
  const anchorsY = [
    portraitTop + PORTRAIT_H * 0.2,
    portraitTop + PORTRAIT_H * 0.5,
    portraitTop + PORTRAIT_H * 0.78,
  ];
  return (
    <Svg
      width={containerW}
      height={containerH}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {cardPositions.map((pos, i) => {
        const anchorX = pos.side === "left" ? portraitLeft : portraitRight;
        const anchorY = anchorsY[i % 3] ?? portraitCy;
        const cardConnectX = pos.side === "left" ? pos.x + CARD_W : pos.x;
        const cardConnectY = pos.y + 28;
        return (
          <AnimatedLine
            key={i}
            anim={anims[i] ?? anims[0]}
            x1={anchorX}
            y1={anchorY}
            x2={cardConnectX}
            y2={cardConnectY}
            color={CARD_GOLD}
          />
        );
      })}
    </Svg>
  );
}

function FeatureCardView({
  card,
  anim,
  side,
  colors,
}: {
  card: FeatureCard;
  anim: Animated.Value;
  side: "left" | "right";
  colors: ReturnType<typeof useColors>;
}) {
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [side === "left" ? -18 : 18, 0],
  });
  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          width: CARD_W,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: anim,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.featureCardIconRow}>
        <View style={[styles.featureCardIconBg, { backgroundColor: CARD_GOLD + "18" }]}>
          <Ionicons name={card.icon} size={13} color={CARD_GOLD} />
        </View>
      </View>
      <Text style={[styles.featureCardTitle, { color: colors.foreground }]} numberOfLines={1}>
        {card.title}
      </Text>
      {card.bullets.slice(0, 2).map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: CARD_GOLD }]} />
          <Text style={[styles.bulletText, { color: colors.mutedForeground }]} numberOfLines={2}>
            {b}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

export default function FaceFeaturesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, imageUri } = useAnalysis();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const portraitAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;
  const lineAnims = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(portraitAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.stagger(
        80,
        cardAnims.map((a) =>
          Animated.timing(a, { toValue: 1, duration: 380, useNativeDriver: true })
        )
      ),
    ]).start();
    Animated.stagger(
      120,
      lineAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 500,
          delay: 700,
          useNativeDriver: false,
        })
      )
    ).start();
  }, []);

  if (!analysis) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background, paddingTop: topPad + 24 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backPill, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-back" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No analysis available yet.</Text>
      </View>
    );
  }

  const cards = buildFaceFeatureCards(analysis);
  const leftCards = [cards[0], cards[2], cards[4]];
  const rightCards = [cards[1], cards[3], cards[5]];

  const containerW = SCREEN_W;
  const containerH = PORTRAIT_TOP_H;

  const portraitLeft = (containerW - PORTRAIT_W) / 2;
  const portraitTop = 20;

  const SIDE_PAD = 10;
  const leftCardX = SIDE_PAD;
  const rightCardX = containerW - SIDE_PAD - CARD_W;

  const cardGapY = (PORTRAIT_H - 28) / 3;

  const cardPositions = [
    { x: leftCardX, y: portraitTop + cardGapY * 0, side: "left" as const },
    { x: rightCardX, y: portraitTop + cardGapY * 0, side: "right" as const },
    { x: leftCardX, y: portraitTop + cardGapY * 1, side: "left" as const },
    { x: rightCardX, y: portraitTop + cardGapY * 1, side: "right" as const },
    { x: leftCardX, y: portraitTop + cardGapY * 2, side: "left" as const },
    { x: rightCardX, y: portraitTop + cardGapY * 2, side: "right" as const },
  ];

  const harmony = getHarmonyLabel(analysis.facial_symmetry_score);
  const archetype = analysis.aesthetic_archetypes?.[0] ?? analysis.style_archetype;
  const featureBalance = getFeatureBalanceStyle(analysis.style_archetype);
  const symmetryPct = analysis.facial_symmetry_score !== undefined
    ? Math.round(analysis.facial_symmetry_score * 100)
    : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backPill, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Face Features</Text>
        <View style={styles.backPill} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad }}
      >
        <View style={[styles.label, { marginTop: 8 }]}>
          <Ionicons name="sparkles" size={12} color={CARD_GOLD} />
          <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
            PORTRAIT ANALYSIS
          </Text>
        </View>

        <View style={{ width: containerW, height: containerH + 20 }}>
          <ConnectorLinesSvg
            anims={lineAnims}
            containerW={containerW}
            containerH={containerH + 20}
            portraitLeft={portraitLeft}
            portraitTop={portraitTop}
            cardPositions={cardPositions}
          />

          <Animated.View
            style={[
              styles.portraitWrapper,
              {
                left: portraitLeft,
                top: portraitTop,
                width: PORTRAIT_W,
                height: PORTRAIT_H,
                borderColor: CARD_GOLD + "40",
                opacity: portraitAnim,
                transform: [
                  {
                    scale: portraitAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.portraitImg} contentFit="cover" />
            ) : (
              <LinearGradient colors={["#F5EDE3", "#EDE3D9"]} style={styles.portraitImg}>
                <Ionicons name="person" size={48} color={CARD_GOLD} />
              </LinearGradient>
            )}
            <LinearGradient
              colors={["transparent", colors.background + "80"]}
              style={styles.portraitGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0, y: 1 }}
            />
            <FaceOverlaySvg opacity={overlayAnim} w={PORTRAIT_W} h={PORTRAIT_H} />
          </Animated.View>

          {leftCards.map((card, i) => (
            <Animated.View
              key={card.id}
              style={{
                position: "absolute",
                left: cardPositions[i * 2]!.x,
                top: cardPositions[i * 2]!.y,
              }}
            >
              <FeatureCardView
                card={card}
                anim={cardAnims[i * 2]!}
                side="left"
                colors={colors}
              />
            </Animated.View>
          ))}

          {rightCards.map((card, i) => (
            <Animated.View
              key={card.id}
              style={{
                position: "absolute",
                left: cardPositions[i * 2 + 1]!.x,
                top: cardPositions[i * 2 + 1]!.y,
              }}
            >
              <FeatureCardView
                card={card}
                anim={cardAnims[i * 2 + 1]!}
                side="right"
                colors={colors}
              />
            </Animated.View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.label}>
            <Ionicons name="analytics-outline" size={12} color={CARD_GOLD} />
            <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
              AESTHETIC SUMMARY
            </Text>
          </View>

          <LinearGradient
            colors={["#FDF6EE", "#F8EDE0"]}
            style={[styles.summaryCard, { borderColor: CARD_GOLD + "30" }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryRow}>
              <SummaryItem
                label="HARMONY"
                value={harmony}
                icon="infinite-outline"
                colors={colors}
              />
              {symmetryPct !== null && (
                <View style={[styles.symmetryCircle, { borderColor: CARD_GOLD }]}>
                  <Text style={[styles.symmetryPct, { color: CARD_GOLD }]}>{symmetryPct}%</Text>
                  <Text style={[styles.symmetrySub, { color: colors.mutedForeground }]}>sym</Text>
                </View>
              )}
              <SummaryItem
                label="BALANCE"
                value={featureBalance}
                icon="git-merge-outline"
                colors={colors}
                align="right"
              />
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: CARD_GOLD + "20" }]} />

            <View style={styles.archetypeRow}>
              <Ionicons name="diamond-outline" size={14} color={CARD_GOLD} />
              <Text style={[styles.archetypeLabel, { color: colors.mutedForeground }]}>
                AESTHETIC ARCHETYPE
              </Text>
            </View>
            <Text style={[styles.archetypeValue, { color: colors.foreground }]}>
              {archetype ? capitalize(archetype) : analysis.style_archetype}
            </Text>

            {analysis.aesthetic_archetypes && analysis.aesthetic_archetypes.length > 1 && (
              <View style={styles.archPills}>
                {analysis.aesthetic_archetypes.slice(0, 3).map((a, i) => (
                  <View key={i} style={[styles.archPill, { backgroundColor: CARD_GOLD + "12", borderColor: CARD_GOLD + "25" }]}>
                    <Text style={[styles.archPillText, { color: CARD_GOLD }]}>{a}</Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={[styles.detailSection, { paddingBottom: 8 }]}>
          <View style={styles.label}>
            <Ionicons name="list-outline" size={12} color={CARD_GOLD} />
            <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
              FEATURE BREAKDOWN
            </Text>
          </View>
          {cards.map((card, i) => (
            <Animated.View
              key={card.id}
              style={[
                styles.detailCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: cardAnims[i],
                },
              ]}
            >
              <View style={styles.detailCardHeader}>
                <View style={[styles.detailIconBg, { backgroundColor: CARD_GOLD + "18" }]}>
                  <Ionicons name={card.icon} size={16} color={CARD_GOLD} />
                </View>
                <Text style={[styles.detailCardTitle, { color: colors.foreground }]}>
                  {card.title}
                </Text>
              </View>
              {card.bullets.map((b, bi) => (
                <View key={bi} style={styles.detailBulletRow}>
                  <View style={[styles.detailBulletDot, { backgroundColor: CARD_GOLD + "80" }]} />
                  <Text style={[styles.detailBulletText, { color: colors.mutedForeground }]}>
                    {b}
                  </Text>
                </View>
              ))}
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryItem({
  label,
  value,
  icon,
  colors,
  align = "left",
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  colors: ReturnType<typeof useColors>;
  align?: "left" | "right";
}) {
  return (
    <View style={[styles.summaryItem, align === "right" && { alignItems: "flex-end" }]}>
      <View style={[styles.summaryItemIcon, align === "right" && { flexDirection: "row-reverse" }]}>
        <Ionicons name={icon} size={11} color={CARD_GOLD} />
        <Text style={[styles.summaryItemLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[styles.summaryItemValue, { color: colors.foreground }, align === "right" && { textAlign: "right" }]}>
        {value}
      </Text>
    </View>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  backPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  labelText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  portraitWrapper: {
    position: "absolute",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: CARD_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  portraitImg: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  portraitGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  featureCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  featureCardIconRow: { flexDirection: "row", marginBottom: 2 },
  featureCardIconBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCardTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    lineHeight: 14,
  },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  bulletDot: { width: 3, height: 3, borderRadius: 1.5, marginTop: 4, flexShrink: 0, opacity: 0.7 },
  bulletText: { fontSize: 9, fontFamily: "Inter_400Regular", lineHeight: 13, flex: 1 },
  summarySection: { paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 0,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryItem: { flex: 1, gap: 4 },
  summaryItemIcon: { flexDirection: "row", alignItems: "center", gap: 4 },
  summaryItemLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  summaryItemValue: { fontSize: 13, fontFamily: "Inter_700Bold", lineHeight: 18 },
  symmetryCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  symmetryPct: { fontSize: 14, fontFamily: "Inter_700Bold" },
  symmetrySub: { fontSize: 8, fontFamily: "Inter_500Medium" },
  summaryDivider: { height: 1, marginBottom: 14 },
  archetypeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  archetypeLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  archetypeValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 10 },
  archPills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  archPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  archPillText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  detailSection: { paddingHorizontal: 20, gap: 10 },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  detailCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  detailBulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingLeft: 40 },
  detailBulletDot: { width: 4, height: 4, borderRadius: 2, marginTop: 6, flexShrink: 0 },
  detailBulletText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
