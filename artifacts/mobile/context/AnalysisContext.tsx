import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AnalysisResult {
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
}

interface AnalysisContextValue {
  analysis: AnalysisResult | null;
  imageUri: string | null;
  setAnalysis: (result: AnalysisResult, uri: string) => void;
  clearAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

const STORAGE_KEY = "ai_stylist_analysis";
const IMAGE_URI_KEY = "ai_stylist_image_uri";

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analysis, setAnalysisState] = useState<AnalysisResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const storedAnalysis = await AsyncStorage.getItem(STORAGE_KEY);
      const storedUri = await AsyncStorage.getItem(IMAGE_URI_KEY);
      if (storedAnalysis) {
        setAnalysisState(JSON.parse(storedAnalysis) as AnalysisResult);
      }
      if (storedUri) {
        setImageUri(storedUri);
      }
    };
    load();
  }, []);

  const setAnalysis = useCallback(
    async (result: AnalysisResult, uri: string) => {
      setAnalysisState(result);
      setImageUri(uri);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      await AsyncStorage.setItem(IMAGE_URI_KEY, uri);
    },
    []
  );

  const clearAnalysis = useCallback(async () => {
    setAnalysisState(null);
    setImageUri(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(IMAGE_URI_KEY);
  }, []);

  return (
    <AnalysisContext.Provider
      value={{ analysis, imageUri, setAnalysis, clearAnalysis }}
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
