import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SkinConcerns {
  acne: "none" | "mild" | "moderate" | "severe";
  redness: "none" | "mild" | "moderate" | "severe";
  dryness: "none" | "mild" | "moderate" | "severe";
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

  // ── Extended skin analysis ───────────────────────────────────────────────
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
  setAnalysis: (result: AnalysisResult, uri: string) => Promise<void>;
  clearAnalysis: () => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  setPendingImage: (img: PendingImage | null) => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

const STORAGE_KEY = "ai_stylist_analysis";
const IMAGE_URI_KEY = "ai_stylist_image_uri";
const NAME_KEY = "ai_stylist_user_name";

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analysis, setAnalysisState] = useState<AnalysisResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [pendingImage, setPendingImageState] = useState<PendingImage | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      const [storedAnalysis, storedUri, storedName] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(IMAGE_URI_KEY),
        AsyncStorage.getItem(NAME_KEY),
      ]);
      if (storedAnalysis) {
        setAnalysisState(JSON.parse(storedAnalysis) as AnalysisResult);
      }
      if (storedUri) setImageUri(storedUri);
      if (storedName) setUserNameState(storedName);
    };
    load();
  }, []);

  const setAnalysis = useCallback(
    async (result: AnalysisResult, uri: string) => {
      setAnalysisState(result);
      setImageUri(uri);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result)),
        AsyncStorage.setItem(IMAGE_URI_KEY, uri),
      ]);
    },
    []
  );

  const clearAnalysis = useCallback(async () => {
    setAnalysisState(null);
    setImageUri(null);
    setUserNameState(null);
    setPendingImageState(null);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY),
      AsyncStorage.removeItem(IMAGE_URI_KEY),
      AsyncStorage.removeItem(NAME_KEY),
    ]);
  }, []);

  const setUserName = useCallback(async (name: string) => {
    setUserNameState(name);
    await AsyncStorage.setItem(NAME_KEY, name);
  }, []);

  const setPendingImage = useCallback((img: PendingImage | null) => {
    setPendingImageState(img);
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        imageUri,
        userName,
        pendingImage,
        setAnalysis,
        clearAnalysis,
        setUserName,
        setPendingImage,
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
