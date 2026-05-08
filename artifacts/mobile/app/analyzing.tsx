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
import { usePortraitHistory } from "@/context/PortraitHistoryContext";
import { useColors } from "@/hooks/useColors";
import { resizeImageForUpload } from "@/utils/resizeImage";
import { saveToGallery } from "@/utils/saveToGallery";

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
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
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
  const { pendingImage, setAnalysis, setPendingImage, userName } = useAnalysis();
  const { addPortrait } = usePortraitHistory();
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
    const pulse = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(pulseScale, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
        Animated.timing(pulseOpacity, { toValue: 1, duration: 1200, useNativeDriver: ND }),
      ]),
      Animated.parallel([
        Animated.timing(pulseScale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
        Animated.timing(pulseOpacity, { toValue: 0.6, duration: 1200, useNativeDriver: ND }),
      ]),
    ]));

    const ring = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 1.35, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: ND }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 1600, useNativeDriver: ND }),
      ]),
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 0.85, duration: 0, useNativeDriver: ND }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 0, useNativeDriver: ND }),
      ]),
    ]));

    Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: ND }).start();
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
      Animated.timing(stepAnims[idx], { toValue: 1, duration: 400, useNativeDriver: ND }).start();
    };
    const completeStep = (idx: number) => setCompletedSteps((prev) => new Set([...prev, idx]));
    activateStep(0);
    const intervals: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < STEPS.length; i++) {
      const t = setTimeout(() => {
        completeStep(i - 1);
        activateStep(i);
      }, i * STEP_DURATION);
      intervals.push(t);
    }
    const finalT = setTimeout(() => completeStep(STEPS.length - 1), STEPS.length * STEP_DURATION);
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
      const [tokenRes, resized] = await Promise.all([
        fetch(`${baseUrl}/api/auth/token`),
        resizeImageForUpload(pendingImage.uri),
      ]);
      if (!tokenRes.ok) throw new Error(await readJsonError(tokenRes, "Could not obtain analysis token"));
      const { token } = (await tokenRes.json()) as { token: string };
      const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: resized.base64, mimeType: resized.mimeType }),
      });
      if (!analyzeRes.ok) throw new Error(await readJsonError(analyzeRes, "Analysis failed"));
      return parseJsonResponse<AnalysisResult>(await analyzeRes.text());
    };

    run().then((result) => {
      setApiResult(result);
      setApiDone(true);
      void (async () => {
        try {
          const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
          if (!tokenRes.ok) return;
          const { token } = (await tokenRes.json()) as { token: string };
          void fetch(`${baseUrl}/api/shop/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              undertone: result.undertone,
              color_season: result.skin_tone_category ? undefined : result.undertone,
              style_archetype: result.style_archetype,
              aesthetic_archetypes: result.aesthetic_archetypes,
              skin_type: result.skin_type,
              shopping_keywords: result.shopping_keywords,
              color_palette: result.color_palette,
              fashion_direction: result.fashion_direction,
              makeup_direction: result.makeup_direction,
              skin_tone_category: result.skin_tone_category,
            }),
          });
        } catch {}
      })();
    }).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!apiDone || !apiResult || !pendingImage) return;
    const minSteps = 2;
    if (currentStep >= minSteps || completedSteps.size >= minSteps) {
      const finish = async () => {
        const persistableUri = pendingImage.base64 ? `data:${pendingImage.mimeType};base64,${pendingImage.base64}` : pendingImage.uri;
        await setAnalysis(apiResult, persistableUri);
        void (async () => {
          if (Platform.OS !== "web") await saveToGallery(pendingImage.uri, "Veloura");
          await addPortrait({ imageUri: persistableUri, analyzedAt: Date.now(), profileName: userName ?? null });
        })();
        setPendingImage(null);
        router.replace("/(tabs)");
      };
      const t = setTimeout(finish, 600);
      return () => clearTimeout(t);
    }
  }, [apiDone, apiResult, currentStep, completedSteps]);

  if (error) {
    return <View style={[styles.errorRoot, { backgroundColor: colors.background, paddingTop: topPad + 24 }]}><View style={[styles.errorIcon, { backgroundColor: colors.destructive + "15" }]}><Ionicons name="alert-circle-outline" size={28} color={colors.destructive} /></View><Text style={[styles.errorTitle, { color: colors.foreground }]}>Analysis failed</Text><Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text></View>;
  }

  if (!pendingImage) return null;
  const imageUri = pendingImage.base64 ? `data:${pendingImage.mimeType};base64,${pendingImage.base64}` : pendingImage.uri;
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width - 80] });

  return <LinearGradient colors={[colors.background, colors.card ?? colors.background]} style={[styles.root, { paddingTop: topPad + 16 }]}><Animated.Text style={[styles.title, { color: colors.foreground, opacity: titleOpacity }]}>Reading your features…</Animated.Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>This takes about 15 seconds</Text><View style={styles.photoWrapper}><Animated.View style={[styles.ring, { borderColor: colors.primary + "55" }, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} /><Animated.View style={[styles.pulse, { backgroundColor: colors.primary + "22" }, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} /><Image source={{ uri: imageUri }} style={styles.photo} contentFit="cover" /></View><View style={[styles.progressTrack, { backgroundColor: colors.muted ?? "#E8E0D8" }]}><Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} /></View><View style={styles.stepList}>{STEPS.map((step, i) => { const isCompleted = completedSteps.has(i); const isActive = currentStep === i && !isCompleted; return <Animated.View key={step.label} style={[styles.stepRow, { opacity: stepAnims[i] }]}><View style={[styles.stepIcon, { backgroundColor: isCompleted ? colors.primary + "22" : isActive ? colors.primary + "15" : colors.muted ?? "#E8E0D8" }]}><Ionicons name={isCompleted ? "checkmark" : step.icon} size={16} color={isCompleted || isActive ? colors.primary : colors.mutedForeground} /></View><Text style={[styles.stepLabel, { color: isCompleted || isActive ? colors.foreground : colors.mutedForeground, fontFamily: isActive ? "Inter_600SemiBold" : "Inter_400Regular" }]}>{step.label}</Text></Animated.View>; })}</View></LinearGradient>;
}

const PHOTO_SIZE = Math.min(width * 0.48, 220);

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  title: { fontSize: 22, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 32 },
  photoWrapper: { width: PHOTO_SIZE, height: PHOTO_SIZE, marginBottom: 28, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: PHOTO_SIZE + 48, height: PHOTO_SIZE + 48, borderRadius: (PHOTO_SIZE + 48) / 2, borderWidth: 2 },
  pulse: { position: "absolute", width: PHOTO_SIZE + 24, height: PHOTO_SIZE + 24, borderRadius: (PHOTO_SIZE + 24) / 2 },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2 },
  progressTrack: { width: width - 80, height: 4, borderRadius: 2, overflow: "hidden", marginBottom: 28 },
  progressFill: { height: 4, borderRadius: 2 },
  stepList: { width: "100%", gap: 14 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stepLabel: { fontSize: 14, flex: 1 },
  errorRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  errorIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  errorTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});
