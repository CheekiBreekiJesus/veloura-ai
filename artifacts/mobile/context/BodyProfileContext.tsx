import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface BodyProfile {
  height: string;
  weight: string;
  bust: string;
  cupSize: string;
  waist: string;
  hips: string;
  inseam: string;
}

const STORAGE_KEY = "veloura_body_profile";

interface BodyProfileContextValue {
  bodyProfile: BodyProfile;
  setBodyProfile: (profile: BodyProfile) => Promise<void>;
  clearBodyProfile: () => Promise<void>;
}

const DEFAULT_PROFILE: BodyProfile = {
  height: "",
  weight: "",
  bust: "",
  cupSize: "",
  waist: "",
  hips: "",
  inseam: "",
};

const BodyProfileContext = createContext<BodyProfileContextValue | null>(null);

export function BodyProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bodyProfile, setBodyProfileState] =
    useState<BodyProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBodyProfileState({ ...DEFAULT_PROFILE, ...(JSON.parse(stored) as Partial<BodyProfile>) });
      }
    };
    void load();
  }, []);

  const setBodyProfile = useCallback(async (profile: BodyProfile) => {
    setBodyProfileState(profile);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, []);

  const clearBodyProfile = useCallback(async () => {
    setBodyProfileState(DEFAULT_PROFILE);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <BodyProfileContext.Provider
      value={{ bodyProfile, setBodyProfile, clearBodyProfile }}
    >
      {children}
    </BodyProfileContext.Provider>
  );
}

export function useBodyProfile() {
  const ctx = useContext(BodyProfileContext);
  if (!ctx)
    throw new Error(
      "useBodyProfile must be used within BodyProfileProvider"
    );
  return ctx;
}

export function buildMeasurementsText(profile: BodyProfile): string | null {
  const parts: string[] = [];
  if (profile.height) parts.push(`height ${profile.height}`);
  if (profile.weight) parts.push(`weight ${profile.weight}`);
  if (profile.bust && profile.cupSize) parts.push(`bust ${profile.bust}${profile.cupSize}`);
  else if (profile.bust) parts.push(`bust ${profile.bust}`);
  if (profile.waist) parts.push(`waist ${profile.waist}`);
  if (profile.hips) parts.push(`hips ${profile.hips}`);
  if (profile.inseam) parts.push(`inseam ${profile.inseam}`);
  if (parts.length === 0) return null;
  return parts.join(", ");
}
