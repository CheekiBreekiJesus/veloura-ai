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

const AURA_AVATAR_FALLBACK = require("../../assets/images/aura-avatar.png");

import { ChatMessage, useAnalysis } from "@/context/AnalysisContext";
import { buildMeasurementsText, useBodyProfile } from "@/context/BodyProfileContext";
import { buildStylePrefsText, useStylePrefs } from "@/context/StylePrefsContext";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";

type Message = ChatMessage;

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

async function sendChat(
  messages: { role: string; content: string }[],
  profile: object | null,
  feedback?: Record<string, string>,
  healthConcerns?: string[]
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, profile, feedback, healthConcerns }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Chat request failed");
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}

// ── Timestamp helpers ─────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateSeparator(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const msgMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((todayMidnight - msgMidnight) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "long", day: "numeric" });
  }
  return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function isSameCalendarDay(ts1: number, ts2: number): boolean {
  const a = new Date(ts1);
  const b = new Date(ts2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── DateSeparator ─────────────────────────────────────────────────────────────

function DateSeparator({
  label,
  colors,
}: {
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.separatorRow}>
      <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.separatorLabel, { color: colors.mutedForeground, backgroundColor: colors.background }]}>
        {label}
      </Text>
      <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

const QUICK_PROMPTS = [
  "💄 Makeup for me?",
  "👗 Best outfits?",
  "✨ Colors to wear?",
  "💇 Hair ideas?",
  "👓 Glasses that suit me?",
];

type AvatarSource = number | { uri: string };

function MessageBubble({
  message,
  colors,
  avatarSource,
}: {
  message: Message;
  colors: ReturnType<typeof useColors>;
  avatarSource: AvatarSource;
}) {
  const isUser = message.role === "user";
  const timeLabel = message.ts ? formatTime(message.ts) : null;

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && <Image source={avatarSource} style={styles.avatar} contentFit="cover" />}
      <View style={[styles.bubbleCol, isUser ? styles.bubbleColUser : styles.bubbleColAI]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: colors.primary }]
              : [styles.bubbleAI, { backgroundColor: colors.card, borderColor: colors.border }],
            { maxWidth: "100%" },
          ]}
        >
          <Text style={[styles.bubbleText, { color: isUser ? "#fff" : colors.foreground }]}>
            {message.content}
          </Text>
        </View>
        {timeLabel && (
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
            {timeLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

function TypingIndicator({
  colors,
  avatarSource,
}: {
  colors: ReturnType<typeof useColors>;
  avatarSource: AvatarSource;
}) {
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
      <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
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
  const { analysis, userName, chatHistory, saveChatHistory, pendingChatInput, setPendingChatInput, healthConcerns } = useAnalysis();

  const companionName = analysis?.companion_name ?? "Aura";
  // Use DALL-E avatar when available, fall back to the bundled static asset.
  const avatarSource: AvatarSource = analysis?.companion_avatar_url
    ? { uri: analysis.companion_avatar_url }
    : AURA_AVATAR_FALLBACK;
  const { feedback } = useWardrobe();
  const { bodyProfile } = useBodyProfile();
  const { stylePrefs } = useStylePrefs();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const tokenCache = useRef<{ token: string; exp: number } | null>(null);
  // Track the previous analysis object reference so we can detect a fresh
  // analysis replacing the old one (analysis !== null → different analysis).
  const prevAnalysisRef = useRef<typeof analysis | undefined>(undefined);
  // When a re-analysis reset fires, the auto-persist effect runs in the same
  // render cycle with the old closure values (messages = stale, initialized =
  // true). Setting this flag in the reset effect (which runs first) tells the
  // persist effect to skip that one invocation before state updates land.
  const skipNextPersistRef = useRef(false);

  const baseUrl = (() => {
    const d = process.env["EXPO_PUBLIC_DOMAIN"];
    return d ? `https://${d}` : "";
  })();

  // Consume a pending chat input queued from another screen (e.g. wardrobe "Ask Aura")
  useEffect(() => {
    if (pendingChatInput) {
      setInput(pendingChatInput);
      setPendingChatInput(null);
    }
  }, [pendingChatInput, setPendingChatInput]);

  // Reset local state when analysis is cleared OR replaced with a new one.
  // prevAnalysisRef tracks the previous object reference so we can distinguish
  // a re-analysis (old → new) from the initial mount (undefined → loaded).
  useEffect(() => {
    const prev = prevAnalysisRef.current;
    prevAnalysisRef.current = analysis;

    if (analysis === null) {
      // Profile cleared entirely
      setMessages([]);
      setInitialized(false);
      return;
    }

    if (prev !== undefined && prev !== null && prev !== analysis) {
      // A brand-new analysis replaced the previous one — wipe stale messages
      // so Aura generates a fresh greeting on next render.
      // Set the skip flag BEFORE state updates so the auto-persist effect
      // (which runs later in the same cycle with old closure values) does not
      // re-save the stale history back to storage.
      skipNextPersistRef.current = true;
      setMessages([]);
      setInitialized(false);
    }
  }, [analysis]);

  // Restore history or show greeting — runs once per analysis session
  useEffect(() => {
    if (!analysis || initialized) return;
    setInitialized(true);

    if (chatHistory.length > 0) {
      setMessages(chatHistory);
      return;
    }

    const firstName = userName?.split(" ")[0] ?? null;
    const archetypes = analysis.aesthetic_archetypes?.slice(0, 2).join(" and ") ?? analysis.style_archetype;
    const season = (analysis as unknown as Record<string, unknown>).color_season as string | undefined;
    const greeting = [
      firstName ? `Hi ${firstName}! ` : "Hi there! ",
      `I'm ${companionName}, your personal AI stylist. I've read your full Aesthetic Identity Profile — `,
      `you're a beautiful ${archetypes}`,
      season ? ` with a ${season} color palette. ` : ". ",
      `I'm here whenever you want advice on style, beauty, skincare, hair, or shopping. What would you like to explore today?`,
    ].join("");

    const initial: Message[] = [
      { id: "greeting", role: "assistant", content: greeting, ts: Date.now() },
    ];
    setMessages(initial);
  }, [analysis, chatHistory, initialized, userName]);

  // Auto-persist all message mutations (greeting, user optimistic, assistant reply, error rollback).
  // skipNextPersistRef guards against a stale re-save when a re-analysis reset
  // fires: the reset effect runs first (same cycle) and sets the flag so this
  // effect skips the invocation where messages/initialized still hold old values.
  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    if (!initialized || !analysis || messages.length === 0) return;
    void saveChatHistory(messages);
  }, [messages, initialized, analysis, saveChatHistory]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, loading]);

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading || !analysis) return;

      setInput("");
      setError(null);

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content, ts: Date.now() };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setLoading(true);

      try {
        const history = nextMessages.map((m) => ({ role: m.role, content: m.content }));
        // Strip companion_avatar_url (large data URI, ~800 KB) before sending
        // — the chat system prompt only needs companion_name, not the image.
        const { companion_avatar_url: _avatar, ...profileForChat } = analysis;
        const measurementsText = buildMeasurementsText(bodyProfile);
        const stylePrefsText = buildStylePrefsText(stylePrefs);
        const profileWithExtras = {
          ...profileForChat,
          ...(measurementsText ? { measurements: measurementsText } : {}),
          ...(stylePrefsText ? { stylePreferences: stylePrefsText } : {}),
        };
        const reply = await sendChat(history, profileWithExtras, feedback, healthConcerns.length ? healthConcerns : undefined);
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", content: reply, ts: Date.now() },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setMessages(nextMessages.slice(0, -1));
      } finally {
        setLoading(false);
      }
    },
    [input, loading, analysis, messages, bodyProfile, feedback, healthConcerns]
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
        <Image source={avatarSource} style={styles.headerAvatar} contentFit="cover" />
        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{companionName}</Text>
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
        {messages.map((m, i) => {
          const prevTs = i > 0 ? messages[i - 1]!.ts : null;
          const showSeparator =
            m.ts != null &&
            (prevTs == null || !isSameCalendarDay(prevTs, m.ts));
          return (
            <React.Fragment key={m.id}>
              {showSeparator && m.ts != null && (
                <DateSeparator label={formatDateSeparator(m.ts)} colors={colors} />
              )}
              <MessageBubble message={m} colors={colors} avatarSource={avatarSource} />
            </React.Fragment>
          );
        })}
        {loading && <TypingIndicator colors={colors} avatarSource={avatarSource} />}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#FF5252" />
            <Text style={[styles.errorText, { color: "#FF5252" }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {showSuggestions && (
        <SuggestionChips colors={colors} onSelect={(s) => { void send(s); }} />
      )}

      <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: insets.bottom + 10, backgroundColor: colors.background }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`Ask ${companionName} anything…`}
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
    <View style={[styles.noAnalysisRoot, { backgroundColor: colors.background }]}>
      <View style={[styles.noAnalysisIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name="sparkles" size={34} color={colors.primary} />
      </View>
      <Text style={[styles.noAnalysisTitle, { color: colors.foreground }]}>Meet Your AI Stylist</Text>
      <Text style={[styles.noAnalysisBody, { color: colors.mutedForeground }]}>Complete a style analysis first. Your personal companion will read your full Aesthetic Identity Profile and be ready to advise you on everything — makeup, outfits, skincare, and more.</Text>
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
  bubbleCol: { flexShrink: 1, maxWidth: "80%", gap: 3 },
  bubbleColUser: { alignItems: "flex-end" },
  bubbleColAI: { alignItems: "flex-start" },
  avatar: { width: 30, height: 30, borderRadius: 15, flexShrink: 0 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  timestamp: { fontSize: 11, fontFamily: "Inter_400Regular", marginHorizontal: 4 },
  separatorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 12 },
  separatorLine: { flex: 1, height: StyleSheet.hairlineWidth },
  separatorLabel: { fontSize: 11, fontFamily: "Inter_500Medium", paddingHorizontal: 6 },
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
