import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import BackButton from "@/components/BackButton";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { useAnalysis } from "@/context/AnalysisContext";
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
  profile: object | null
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, profile }),
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
    return "Hi! I'm your AI stylist. Upload a selfie first to get personalized advice, or ask me any general beauty and fashion question!";
  }
  return `Hi! I'm your AI stylist. I've reviewed your profile — you're a ${analysis.style_archetype} with ${analysis.undertone} undertones and a ${analysis.face_shape} face shape. Ask me anything about your look!`;
}

function MessageBubble({
  message,
  colors,
}: {
  message: Message;
  colors: ReturnType<typeof useColors>;
}) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      {!isUser && (
        <View style={[styles.avatarWrap, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View style={[styles.avatarWrap, { backgroundColor: colors.primary + "20" }]}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    </View>
  );
}

const QUICK_PROMPTS = [
  "What makeup suits my eye shape?",
  "Best outfit colors for me?",
  "What hairstyle fits my face?",
  "Skincare routine for my skin?",
];

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analysis } = useAnalysis();
  const scrollRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  const welcome = buildWelcome(analysis);

  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: welcome },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setInput("");

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      const history = [...messages, userMessage]
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const reply = await sendChat(history, analysis);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I had trouble connecting. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, analysis]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#F5EDE3", colors.background]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <BackButton />
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Stylist</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              Personalized advice
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: 12 }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {/* Quick prompts if only welcome message */}
          {messages.length === 1 && (
            <View style={styles.quickPrompts}>
              <Text style={[styles.quickLabel, { color: colors.mutedForeground }]}>
                Try asking...
              </Text>
              {QUICK_PROMPTS.map((prompt, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSend(prompt)}
                  style={({ pressed }) => [
                    styles.quickChip,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
                  <Text style={[styles.quickChipText, { color: colors.foreground }]}>
                    {prompt}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} colors={colors} />
          ))}

          {loading && <TypingIndicator colors={colors} />}
        </ScrollView>

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: botPad + 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Ask your stylist anything..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor:
                  input.trim() && !loading ? colors.primary : colors.muted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Ionicons name="send" size={18} color={colors.primaryForeground} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  quickPrompts: { marginBottom: 16, gap: 8 },
  quickLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickChipText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "100%" },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAssistant: { justifyContent: "flex-start" },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
