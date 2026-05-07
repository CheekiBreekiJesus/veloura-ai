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

function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

async function readJsonError(response: Response, fallback: string): Promise<string> {
  const text = await response.text();
  try {
    const parsed = parseJsonResponse<{ error?: string }>(text);
    return parsed.error ?? fallback;
  } catch {
    return text.trim() || fallback;
  }
}

export default function AnalyzingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pendingImage, setAnalysis, setPendingImage } = useAnalysis();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [apiDone, setApiDone] = useState(false);
  const [apiResult, setApiResult] = useState<AnalysisResult | null>(null);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / STEPS.length,
      duration: STEP_DURATION * 0.8,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

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

    const finalT = setTimeout(() => {
      completeStep(STEPS.length - 1);
    }, STEPS.length * STEP_DURATION);
    intervals.push(finalT);

    return () => intervals.forEach(clearTimeout);
  }, [error]);

  useEffect(() => {
    if (!pendingImage) {
      router.replace("/upload");
      return;
    }

    const domainEnv = process.env["EXPO_PUBLIC_DOMAIN"];
    const baseUrl = domainEnv ? `https://${domainEnv}` : "";

    const run = async () => {
      const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
      if (!tokenRes.ok) {
        throw new Error(await readJsonError(tokenRes, "Could not obtain analysis token"));
      }
      const { token } = (await tokenRes.json()) as { token: string };

      const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64: pendingImage.base64,
          mimeType: pendingImage.mimeType,
        }),
      });

      if (!analyzeRes.ok) {
        throw new Error(await readJsonError(analyzeRes, "Analysis failed"));
      }

      const text = await analyzeRes.text();
      try {
        return parseJsonResponse<AnalysisResult>(text);
      } catch {
        throw new Error("AI returned malformed analysis JSON");
      }
    };

    run()
      .then((result) => {
        setApiResult(result);
        setApiDone(true);
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    if (!apiDone || !apiResult || !pendingImage) return;
    const minSteps = 2;
    if (currentStep >= minSteps || completedSteps.size >= minSteps) {
      const finish = async () => {
        const persistableUri = pendingImage.base64
          ? `data:${pendingImage.mimeType};base64,${pendingImage.base64}`
          : pendingImage.uri;
        await setAnalysis(apiResult, persistableUri);
        setPendingImage(null);
        router.replace("/(tabs)");
      };
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
          <Ionicons name="alert-circle-outline" size={28} color={colors.destructive} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Analysis failed</Text>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
      </View>
    );
  }

  if (!pendingImage) return null;
}

const styles = StyleSheet.create({
  errorRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  errorIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  errorTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});
