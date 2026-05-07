import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter";
export type Hemisphere = "northern" | "southern";

const HEMISPHERE_KEY = "veloura_hemisphere";

interface SeasonContextValue {
  hemisphere: Hemisphere;
  setHemisphere: (h: Hemisphere) => Promise<void>;
  currentSeason: Season;
}

const SeasonContext = createContext<SeasonContextValue | null>(null);

const SEASON_ICONS: Record<Season, string> = {
  spring: "🌸",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
};

const SEASON_COLORS: Record<Season, string> = {
  spring: "#A8D8A8",
  summer: "#FFD166",
  autumn: "#E07A5F",
  winter: "#81B0D4",
};

export { SEASON_ICONS, SEASON_COLORS };

function computeCurrentSeason(h: Hemisphere): Season {
  const month = new Date().getMonth(); // 0=Jan
  let season: Season;
  if (month >= 2 && month <= 4) season = "spring";
  else if (month >= 5 && month <= 7) season = "summer";
  else if (month >= 8 && month <= 10) season = "autumn";
  else season = "winter";

  if (h === "southern") {
    const opposites: Record<Season, Season> = {
      spring: "autumn",
      summer: "winter",
      autumn: "spring",
      winter: "summer",
    };
    return opposites[season];
  }
  return season;
}

export function getNextSeasons(current: Season, count = 3): Season[] {
  const order: Season[] = ["spring", "summer", "autumn", "winter"];
  const idx = order.indexOf(current);
  const result: Season[] = [];
  for (let i = 1; i <= count; i++) {
    result.push(order[(idx + i) % 4]);
  }
  return result;
}

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [hemisphere, setHemisphereState] = useState<Hemisphere>("northern");

  useEffect(() => {
    AsyncStorage.getItem(HEMISPHERE_KEY)
      .then((val) => {
        if (val === "northern" || val === "southern") setHemisphereState(val);
      })
      .catch(() => undefined);
  }, []);

  const setHemisphere = useCallback(async (h: Hemisphere) => {
    setHemisphereState(h);
    await AsyncStorage.setItem(HEMISPHERE_KEY, h);
  }, []);

  const currentSeason = computeCurrentSeason(hemisphere);

  return (
    <SeasonContext.Provider value={{ hemisphere, setHemisphere, currentSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason must be used within SeasonProvider");
  return ctx;
}
