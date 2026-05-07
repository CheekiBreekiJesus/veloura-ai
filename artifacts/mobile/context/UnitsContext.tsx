import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type UnitsPreference = "metric" | "imperial";

const UNITS_KEY = "veloura_units_pref";

interface UnitsContextValue {
  unitsPreference: UnitsPreference;
  setUnitsPreference: (u: UnitsPreference) => Promise<void>;
}

const UnitsContext = createContext<UnitsContextValue | null>(null);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [unitsPreference, setUnitsState] = useState<UnitsPreference>("metric");

  useEffect(() => {
    AsyncStorage.getItem(UNITS_KEY)
      .then((val) => {
        if (val === "metric" || val === "imperial") setUnitsState(val);
      })
      .catch(() => undefined);
  }, []);

  const setUnitsPreference = useCallback(async (u: UnitsPreference) => {
    setUnitsState(u);
    await AsyncStorage.setItem(UNITS_KEY, u);
  }, []);

  return (
    <UnitsContext.Provider value={{ unitsPreference, setUnitsPreference }}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used within UnitsProvider");
  return ctx;
}
