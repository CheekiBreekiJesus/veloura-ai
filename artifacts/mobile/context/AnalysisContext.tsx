import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const MAX_CHAT_MESSAGES = 100;

export interface SkinConcerns {
  acne: "none" | "mild" | "moderate" | "severe";
  redness: "none" | "mild" | "moderate" | "severe";
  dryness: "none" | "mild" | "moderate" | "severe";
  pores: "none" | "mild" | "moderate" | "severe";
  texture: "none" | "mild" | "moderate" | "severe";
}

export interface AnalysisResult {
  // ── Core (always present) ────────────────────────────────────────────────
  face_shape: string;
  skin_tone: string;
  undertone: string;
  eye_shape: string;
  lip_shape: string;
  hair_type: string;
  style_archetype: string;
  color_palette: string[];
  beauty_recommendations: string[];
  fashion_recommendations: string[];
  hairstyle_suggestions: string[];
  glasses_suggestions: string[];

  // ── Extended face structure ──────────────────────────────────────────────
  jawline_definition?: string;
  cheekbone_prominence?: string;
  facial_symmetry_score?: number;
  eyebrow_shape: string;
  nose_shape: string;

  // ── Extended skin analysis ───────────────────────────────────────────────
  skin_type?: "oily" | "combination" | "normal" | "dry" | "sensitive";
  skin_tone_category?: string;
  skin_evenness?: string;
  skin_concerns?: SkinConcerns;

  // ── Color profile ────────────────────────────────────────────────────────
  contrast_level?: string;
  color_families?: string[];

  // ── Hair profile ─────────────────────────────────────────────────────────
  hair_lengths?: string[];
  recommended_style_direction?: string;

  // ── Accessories ──────────────────────────────────────────────────────────
  earring_styles?: string[];
  necklace_lengths?: string[];

  // ── Aesthetic archetypes ─────────────────────────────────────────────────
  aesthetic_archetypes?: string[];

  // ── Recommendation seeds ─────────────────────────────────────────────────
  skincare_focus?: string[];
  makeup_direction?: string;
  fashion_direction?: string;
  shopping_keywords?: string[];

  // ── Companion identity ───────────────────────────────────────────────────
  // companion_name is small and stored inside the main analysis JSON.
  // companion_avatar_url is a large data URI and stored in a separate key.
  companion_name?: string;
  companion_avatar_url?: string;
}

export interface PendingImage {
  base64: string;
  mimeType: string;
  uri: string;
}

interface AnalysisContextValue {
  analysis: AnalysisResult | null;
  imageUri: string | null;
  userName: string | null;
  pendingImage: PendingImage | null;
  pendingChatInput: string | null;
  chatHistory: ChatMessage[];
  setAnalysis: (result: AnalysisResult, uri: string) => Promise<void>;
  clearAnalysis: () => Promise<void>;
  clearChatHistory: () => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  setPendingImage: (img: PendingImage | null) => void;
  setPendingChatInput: (msg: string | null) => void;
  saveChatHistory: (messages: ChatMessage[]) => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

const STORAGE_KEY = "ai_stylist_analysis";
const IMAGE_URI_KEY = "ai_stylist_image_uri";
const NAME_KEY = "ai_stylist_user_name";
const CHAT_HISTORY_KEY = "ai_stylist_chat_history";
// companion_avatar_url is a large data URI (~800 KB) — stored separately so
// the main analysis JSON stays small and fast to parse.
const COMPANION_AVATAR_KEY = "ai_stylist_companion_avatar";

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analysis, setAnalysisState] = useState<AnalysisResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [pendingImage, setPendingImageState] = useState<PendingImage | null>(
    null
  );
  const [pendingChatInput, setPendingChatInputState] = useState<string | null>(null);
  const [chatHistory, setChatHistoryState] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const load = async () => {
      const [storedAnalysis, storedUri, storedName, storedChat, storedAvatar] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(IMAGE_URI_KEY),
          AsyncStorage.getItem(NAME_KEY),
          AsyncStorage.getItem(CHAT_HISTORY_KEY),
          AsyncStorage.getItem(COMPANION_AVATAR_KEY),
        ]);
      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis) as AnalysisResult;
        // Re-attach the avatar URI that was stored in its own key
        if (storedAvatar) parsed.companion_avatar_url = storedAvatar;
        setAnalysisState(parsed);
      }
      if (storedUri) setImageUri(storedUri);
      if (storedName) setUserNameState(storedName);
      if (storedChat) {
        setChatHistoryState(JSON.parse(storedChat) as ChatMessage[]);
      }
    };
    load();
  }, []);

  const setAnalysis = useCallback(
    async (result: AnalysisResult, uri: string) => {
      // Split companion_avatar_url out before serialising the analysis — the
      // data URI can be ~800 KB which would bloat the main JSON key.
      const { companion_avatar_url, ...analysisForStorage } = result;

      setAnalysisState(result);
      setImageUri(uri);
      // Clear stale chat history whenever a new analysis replaces the previous
      // one so the companion's greeting reflects the updated profile.
      setChatHistoryState([]);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(analysisForStorage)),
        AsyncStorage.setItem(IMAGE_URI_KEY, uri),
        AsyncStorage.removeItem(CHAT_HISTORY_KEY),
        companion_avatar_url
          ? AsyncStorage.setItem(COMPANION_AVATAR_KEY, companion_avatar_url)
          : AsyncStorage.removeItem(COMPANION_AVATAR_KEY),
      ]);
    },
    []
  );

  const saveChatHistory = useCallback(async (messages: ChatMessage[]) => {
    const capped = messages.slice(-MAX_CHAT_MESSAGES);
    setChatHistoryState(capped);
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(capped));
  }, []);

  const clearAnalysis = useCallback(async () => {
    setAnalysisState(null);
    setImageUri(null);
    setUserNameState(null);
    setPendingImageState(null);
    setChatHistoryState([]);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY),
      AsyncStorage.removeItem(IMAGE_URI_KEY),
      AsyncStorage.removeItem(NAME_KEY),
      AsyncStorage.removeItem(CHAT_HISTORY_KEY),
      AsyncStorage.removeItem(COMPANION_AVATAR_KEY),
    ]);
  }, []);

  const clearChatHistory = useCallback(async () => {
    setChatHistoryState([]);
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  }, []);

  const setUserName = useCallback(async (name: string) => {
    setUserNameState(name);
    await AsyncStorage.setItem(NAME_KEY, name);
  }, []);

  const setPendingImage = useCallback((img: PendingImage | null) => {
    setPendingImageState(img);
  }, []);

  const setPendingChatInput = useCallback((msg: string | null) => {
    setPendingChatInputState(msg);
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        imageUri,
        userName,
        pendingImage,
        pendingChatInput,
        chatHistory,
        setAnalysis,
        clearAnalysis,
        clearChatHistory,
        setUserName,
        setPendingImage,
        setPendingChatInput,
        saveChatHistory,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
