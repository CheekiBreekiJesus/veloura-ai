import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AURA_AVATAR = require("../../assets/images/aura-avatar.png");

import { useAnalysis } from "@/context/AnalysisContext";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

async function sendChat(
  messages: { role: string; content: string }[],
  profile: object | null,
  feedback?: Record<string, string>
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, profile, feedback }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Chat request failed");
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}

function buildWelcome(analysis: ReturnType<typeof useAnalysis>["analysis"]): string {
  if (!analysis) {
    return "Hi! ✨ Upload a selfie first for full style advice.";
  }
  return `Hi! ✨ I see ${analysis.style_archetype} vibes. Ask me anything — makeup, outfits, skincare, hair. 💄👗`;
}

const QUICK_PROMPTS = [
  "💄 Makeup for me?",
  "👗 Best outfits?",
  "✨ Colors to wear?",
  "💇 Hair ideas?",
  "👓 Glasses that suit me?",
];

function MessageBubble({
  message,
  colors,
}: {
  message: Message;
  colors: ReturnType<typeof useColors>;
}) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && <Image source={AURA_AVATAR} style={styles.avatar} contentFit="cover" />}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.primary }]
            : [styles.bubbleAI, { backgroundColor: colors.card, borderColor: colors.border }],
          { maxWidth: "80%" },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isUser ? "#fff" : colors.foreground }]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true }),
          Animated.delay(700),
        ])
      );
    const a1 = pulse(d1, 0);
    const a2 = pulse(d2, 200);
    const a3 = pulse(d3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.bubbleRow}>
      <Image source={AURA_AVATAR} style={styles.avatar} contentFit="cover" />
      <View style={[styles.bubble, styles.bubbleAI, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.typingDots}>
          {[d1, d2, d3].map((d, i) => (
            <Animated.View
              key={i}
              style={[styles.typingDot, { backgroundColor: colors.primary, opacity: d }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function SuggestionChips({
  colors,
  onSelect,
}: {
  colors: ReturnType<typeof useColors>;
  onSelect: (s: string) => void;
}) {
  return (
    <View style={styles.suggestions}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
        {QUICK_PROMPTS.map((s) => (
          <Pressable
            key={s}
            onPress={() => onSelect(s)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: pressed ? colors.primary + "18" : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: colors.foreground }]}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function StylistChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis, userName } = useAnalysis();
  const { feedback } = useWardrobe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const tokenCache = useRef<{ token: string; exp: number } | null>(null);

  const baseUrl = (() => {
    const d = process.env["EXPO_PUBLIC_DOMAIN"];
    return d ? `https://${d}` : "";
  })();

  useEffect(() => {
    if (!analysis) return;
    const firstName = userName?.split(" ")[0] ?? null;
    const greeting = `${firstName ? `Hi ${firstName}! ` : "Hi! "}✨ Short and sweet — ask me anything. 💄👗`;

    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content: greeting,
      },
    ]);
  }, [analysis, userName]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, loading]);

  const getToken = useCallback(async (): Promise<string> => {
    if (tokenCache.current && Date.now() < tokenCache.current.exp) return tokenCache.current.token;
    const t = await fetch(`${baseUrl}/api/auth/token`).then((r) => r.json()).then((d) => d.token as string);
    tokenCache.current = { token: t, exp: Date.now() + 8 * 60 * 1000 };
    return t;
  }, [baseUrl]);

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading || !analysis) return;

      setInput("");
      setError(null);

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setLoading(true);

      try {
        const token = await getToken();
        const history = nextMessages.map((m) => ({ role: m.role, content: m.content }));
        const reply = await sendChat(history, analysis, feedback);
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: reply, ts: Date.now() } as Message]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setMessages(nextMessages.slice(0, -1));
      } finally {
        setLoading(false);
      }
    },
    [input, loading, analysis, messages, getToken, baseUrl, userName]
  );

  if (!analysis) {
    return <NoAnalysis colors={colors} />;
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Image source={AURA_AVATAR} style={styles.headerAvatar} contentFit="cover" />
        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>Aura</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Your personal AI stylist</Text>
        </View>
        <View style={[styles.onlineDot, { backgroundColor: "#4CAF50" }]} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} colors={colors} />
        ))}
        {loading && <TypingIndicator colors={colors} />}
        {showSuggestions && <SuggestionChips colors={colors} onSelect={(s) => { send(s); }} />}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: insets.bottom + 10, backgroundColor: colors.background }]}> 
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Aura anything…"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={() => send()}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={() => send()}
          disabled={loading || !input.trim()}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor:
                loading || !input.trim()
                  ? colors.muted
                  : pressed
                  ? colors.primary + "cc"
                  : colors.primary,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-up" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function NoAnalysis({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.noAnalysisRoot, { backgroundColor: colors.background }] }>
      <View style={[styles.noAnalysisIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name="sparkles" size={34} color={colors.primary} />
      </View>
      <Text style={[styles.noAnalysisTitle, { color: colors.foreground }]}>Meet Aura, Your AI Stylist</Text>
      <Text style={[styles.noAnalysisBody, { color: colors.mutedForeground }]}>Complete a style analysis first. Aura will read your full Aesthetic Identity Profile and be ready to advise you on everything — makeup, outfits, skincare, and more.</Text>
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/upload");
        }}
        style={({ pressed }) => [
          styles.noAnalysisBtn,
          { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Text style={[styles.noAnalysisBtnText, { color: "#fff" }]}>Start Style Analysis</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  onlineDot: { width: 9, height: 9, borderRadius: 5 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 12, paddingBottom: 8 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 4 },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAI: { justifyContent: "flex-start" },
  avatar: { width: 30, height: 30, borderRadius: 15, flexShrink: 0 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, flexShrink: 1 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  typingDots: { flexDirection: "row", gap: 5, alignItems: "center", paddingVertical: 2 },
  typingDot: { width: 7, height: 7, borderRadius: 4 },
  suggestions: { marginTop: 8, marginBottom: 4 },
  suggestionRow: { gap: 8, paddingHorizontal: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 4 },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  input: { flex: 1, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 10 : 8, fontSize: 15, fontFamily: "Inter_400Regular", maxHeight: 120, lineHeight: 20 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  noAnalysisRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: 36, gap: 16 },
  noAnalysisIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  noAnalysisTitle: { fontSize: 22, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  noAnalysisBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  noAnalysisBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  noAnalysisBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
