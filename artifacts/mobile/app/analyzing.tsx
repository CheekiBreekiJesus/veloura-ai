import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis, type AnalysisResult } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";

const ND = Platform.OS !== "web";

const { width } = Dimensions.get("window");

const STEPS = [
  { label: "Scanning facial features", icon: "scan-outline" as const },
  { label: "Analyzing skin tone & undertone", icon: "color-filter-outline" as const },
  { label: "Identifying your style archetype", icon: "sparkles-outline" as const },
  { label: "Generating personal color palette", icon: "color-palette-outline" as const },
  { label: "Curating recommendations", icon: "list-outline" as const },
];

const STEP_DURATION = 2800;

export default function AnalyzingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pendingImage, setAnalysis, setPendingImage } = useAnalysis();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [apiDone, setApiDone] = useState(false);
  const [apiResult, setApiResult] = useState<AnalysisResult | null>(null);

  // Animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Pulse the photo ring
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: ND,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: ND,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: ND,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: ND,
          }),
        ]),
      ])
    );

    // Scanning ring
    const ring = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.35,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: ND,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: ND,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 0.85, duration: 0, useNativeDriver: ND }),
          Animated.timing(ringOpacity, { toValue: 1, duration: 0, useNativeDriver: ND }),
        ]),
      ])
    );

    // Title fade in
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: ND,
    }).start();

    pulse.start();
    ring.start();

    return () => {
      pulse.stop();
      ring.stop();
    };
  }, []);

  // Progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / STEPS.length,
      duration: STEP_DURATION * 0.8,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Advance steps on a timer
  useEffect(() => {
    if (error) return;

    const activateStep = (idx: number) => {
      setCurrentStep(idx);
      Animated.timing(stepAnims[idx], {
        toValue: 1,
        duration: 400,
        useNativeDriver: ND,
      }).start();
    };

    const completeStep = (idx: number) => {
      setCompletedSteps((prev) => new Set([...prev, idx]));
    };

    let stepIndex = 0;
    activateStep(0);

    const intervals: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i < STEPS.length; i++) {
      const delay = i * STEP_DURATION;
      const t = setTimeout(() => {
        completeStep(i - 1);
        activateStep(i);
      }, delay);
      intervals.push(t);
    }

    // Complete final step after all
    const finalT = setTimeout(() => {
      completeStep(STEPS.length - 1);
    }, STEPS.length * STEP_DURATION);
    intervals.push(finalT);

    return () => intervals.forEach(clearTimeout);
  }, [error]);

  // Make the actual API call
  useEffect(() => {
    if (!pendingImage) {
      router.replace("/upload");
      return;
    }

    const domainEnv = process.env["EXPO_PUBLIC_DOMAIN"];
    const baseUrl = domainEnv ? `https://${domainEnv}` : "";

    fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: pendingImage.base64,
        mimeType: pendingImage.mimeType,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((e: { error?: string }) => {
            throw new Error(e.error ?? "Analysis failed");
          });
        }
        return res.json() as Promise<AnalysisResult>;
      })
      .then((result) => {
        setApiResult(result);
        setApiDone(true);
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  // Navigate when API done AND enough steps shown (at least step 3)
  useEffect(() => {
    if (!apiDone || !apiResult || !pendingImage) return;
    const minSteps = 2;
    if (currentStep >= minSteps || completedSteps.size >= minSteps) {
      const finish = async () => {
        await setAnalysis(apiResult, pendingImage.uri);
        setPendingImage(null);
        router.replace("/(tabs)");
      };
      // Small delay to let the last step visually complete
      const t = setTimeout(finish, 600);
      return () => clearTimeout(t);
    }
  }, [apiDone, apiResult, currentStep, completedSteps]);

  if (error) {
    return (
      <View
        style={[
          styles.errorRoot,
          { backgroundColor: colors.background, paddingTop: topPad + 24 },
        ]}
      >
        <View
          style={[
            styles.errorIcon,
            { backgroundColor: colors.destructive + "15" },
          ]}
        >
          <Ionicons
            name="alert-circle"
            size={36}
            color={colors.destructive}
          />
        </View>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>
          Analysis Failed
        </Text>
        <Text style={[styles.errorDesc, { color: colors.mutedForeground }]}>
          {error}
        </Text>
        <Text
          onPress={() => router.replace("/upload")}
          style={[styles.retryBtn, { color: colors.primary }]}
        >
          Try Again →
        </Text>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <LinearGradient
      colors={["#FAF8F5", "#F5EDE3", "#FAF8F5"]}
      style={styles.root}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Top spacer */}
      <View style={{ height: topPad + 40 }} />

      {/* Photo with pulsing ring */}
      <View style={styles.photoSection}>
        {/* Expanding ring */}
        <Animated.View
          style={[
            styles.ring,
            {
              borderColor: colors.primary,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
        {/* Pulsing glow */}
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        {/* Photo */}
        {pendingImage?.uri ? (
          <Image
            source={{ uri: pendingImage.uri }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View
            style={[styles.photo, { backgroundColor: colors.secondary }]}
          >
            <Ionicons name="person" size={48} color={colors.mutedForeground} />
          </View>
        )}
      </View>

      {/* Title */}
      <Animated.View style={[styles.titleSection, { opacity: titleOpacity }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Analyzing your style
        </Text>
        <AnimatedDots color={colors.primary} />
      </Animated.View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: progressWidth },
          ]}
        />
      </View>

      {/* Steps */}
      <View style={styles.steps}>
        {STEPS.map((step, i) => {
          const isDone = completedSteps.has(i);
          const isActive = currentStep === i && !isDone;
          const isVisible = i <= currentStep;

          return (
            <Animated.View
              key={i}
              style={[
                styles.stepRow,
                { opacity: stepAnims[i] },
              ]}
            >
              <View
                style={[
                  styles.stepIcon,
                  {
                    backgroundColor: isDone
                      ? colors.primary
                      : isActive
                      ? colors.primary + "20"
                      : colors.muted,
                  },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={14}
                    color={isActive ? colors.primary : colors.mutedForeground}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: isDone
                      ? colors.foreground
                      : isActive
                      ? colors.foreground
                      : colors.mutedForeground,
                    fontFamily: isDone || isActive ? "Inter_500Medium" : "Inter_400Regular",
                  },
                ]}
              >
                {step.label}
              </Text>
              {isActive && !isDone && (
                <ActivityDots color={colors.primary} />
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          This usually takes 15–20 seconds
        </Text>
      </View>
    </LinearGradient>
  );
}

function AnimatedDots({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: ND,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: ND,
          }),
          Animated.delay(800),
        ])
      );

    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 300);
    const a3 = anim(dot3, 600);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={styles.dots}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { backgroundColor: color, opacity: d }]}
        />
      ))}
    </View>
  );
}

function ActivityDots({ color }: { color: string }) {
  const d1 = useRef(new Animated.Value(1)).current;
  const d2 = useRef(new Animated.Value(1)).current;
  const d3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 0.3, duration: 300, useNativeDriver: ND }),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: ND }),
          Animated.delay(600),
        ])
      );
    const a1 = anim(d1, 0);
    const a2 = anim(d2, 200);
    const a3 = anim(d3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.activityDots}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View
          key={i}
          style={[
            styles.activityDot,
            { backgroundColor: color, opacity: d },
          ]}
        />
      ))}
    </View>
  );
}

const PHOTO_SIZE = Math.min(width * 0.42, 180);

const styles = StyleSheet.create({
  root: { flex: 1 },
  photoSection: {
    alignItems: "center",
    justifyContent: "center",
    height: PHOTO_SIZE + 80,
  },
  ring: {
    position: "absolute",
    width: PHOTO_SIZE + 48,
    height: PHOTO_SIZE + 48,
    borderRadius: (PHOTO_SIZE + 48) / 2,
    borderWidth: 2,
  },
  glow: {
    position: "absolute",
    width: PHOTO_SIZE + 16,
    height: PHOTO_SIZE + 16,
    borderRadius: (PHOTO_SIZE + 16) / 2,
    opacity: 0.15,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  dots: { flexDirection: "row", gap: 4, alignItems: "center" },
  dot: { width: 5, height: 5, borderRadius: 3 },
  progressTrack: {
    height: 4,
    borderRadius: 4,
    marginHorizontal: 32,
    marginBottom: 28,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  steps: { paddingHorizontal: 32, gap: 14 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: { flex: 1, fontSize: 14 },
  activityDots: { flexDirection: "row", gap: 3, alignItems: "center" },
  activityDot: { width: 4, height: 4, borderRadius: 2 },
  footer: { flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 60 },
  footerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  errorIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  errorTitle: { fontSize: 22, fontFamily: "Inter_600SemiBold" },
  errorDesc: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  retryBtn: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 8 },
});
