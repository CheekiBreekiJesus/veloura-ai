import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface PortraitEntry {
  id: string;
  imageUri: string;
  analyzedAt: number;
  profileName: string | null;
}

const MAX_PORTRAITS = 20;
const STORAGE_KEY = "veloura_portrait_history";

interface PortraitHistoryContextValue {
  portraits: PortraitEntry[];
  addPortrait: (entry: Omit<PortraitEntry, "id">) => Promise<void>;
  removePortrait: (id: string) => Promise<void>;
  clearPortraits: () => Promise<void>;
}

const PortraitHistoryContext =
  createContext<PortraitHistoryContextValue | null>(null);

export function PortraitHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [portraits, setPortraits] = useState<PortraitEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPortraits(JSON.parse(stored) as PortraitEntry[]);
      }
    };
    void load();
  }, []);

  const persist = useCallback(async (entries: PortraitEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, []);

  const addPortrait = useCallback(
    async (entry: Omit<PortraitEntry, "id">) => {
      const newEntry: PortraitEntry = {
        id: `portrait-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...entry,
      };
      setPortraits((prev) => {
        const next = [newEntry, ...prev].slice(0, MAX_PORTRAITS);
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  const removePortrait = useCallback(
    async (id: string) => {
      setPortraits((prev) => {
        const next = prev.filter((p) => p.id !== id);
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearPortraits = useCallback(async () => {
    setPortraits([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <PortraitHistoryContext.Provider
      value={{ portraits, addPortrait, removePortrait, clearPortraits }}
    >
      {children}
    </PortraitHistoryContext.Provider>
  );
}

export function usePortraitHistory() {
  const ctx = useContext(PortraitHistoryContext);
  if (!ctx)
    throw new Error(
      "usePortraitHistory must be used within PortraitHistoryProvider"
    );
  return ctx;
}
