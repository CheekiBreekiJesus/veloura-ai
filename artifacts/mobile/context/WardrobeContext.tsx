import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Season } from "./SeasonContext";

export type ClothingCategory =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Outerwear"
  | "Shoes"
  | "Accessories"
  | "Sleepwear";

export interface WardrobeItem {
  id: string;
  name: string;
  category: ClothingCategory;
  imageUri: string;
  galleryUri?: string;
  dominantColor: string;
  compatibilityScore: number;
  compatibilityNotes: string;
  addedAt: number;
  backgroundRemoved?: boolean;
  seasons?: Season[];
  stored?: boolean;
}

export type FeedbackValue = "liked" | "disliked";

interface WardrobeContextValue {
  wardrobeItems: WardrobeItem[];
  feedback: Record<string, FeedbackValue>;
  addItem: (item: WardrobeItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItemSeasons: (id: string, seasons: Season[]) => Promise<void>;
  toggleStored: (id: string) => Promise<void>;
  setFeedback: (key: string, value: FeedbackValue | null) => Promise<void>;
  clearAll: () => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

const ITEMS_KEY = "veloura_wardrobe_items";
const FEEDBACK_KEY = "veloura_wardrobe_feedback";

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [feedback, setFeedbackState] = useState<Record<string, FeedbackValue>>({});

  useEffect(() => {
    const load = async () => {
      const [items, fb] = await Promise.all([
        AsyncStorage.getItem(ITEMS_KEY),
        AsyncStorage.getItem(FEEDBACK_KEY),
      ]);
      if (items) {
        const parsed = JSON.parse(items) as WardrobeItem[];
        // Normalize legacy items: ensure seasons and stored have explicit defaults
        setWardrobeItems(parsed.map((i) => ({
          ...i,
          seasons: i.seasons ?? [],
          stored: i.stored ?? false,
        })));
      }
      if (fb) setFeedbackState(JSON.parse(fb) as Record<string, FeedbackValue>);
    };
    void load();
  }, []);

  const addItem = useCallback(async (item: WardrobeItem) => {
    setWardrobeItems((prev) => {
      const next = [{ ...item, seasons: item.seasons ?? [], stored: item.stored ?? false }, ...prev];
      void AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback(async (id: string) => {
    setWardrobeItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      void AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateItemSeasons = useCallback(async (id: string, seasons: Season[]) => {
    setWardrobeItems((prev) => {
      const next = prev.map((item) => item.id === id ? { ...item, seasons } : item);
      void AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleStored = useCallback(async (id: string) => {
    setWardrobeItems((prev) => {
      const next = prev.map((item) => item.id === id ? { ...item, stored: !item.stored } : item);
      void AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setFeedback = useCallback(
    async (key: string, value: FeedbackValue | null) => {
      setFeedbackState((prev) => {
        const next = { ...prev };
        if (value === null) {
          delete next[key];
        } else {
          next[key] = value;
        }
        void AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const clearAll = useCallback(async () => {
    setWardrobeItems([]);
    setFeedbackState({});
    await Promise.all([
      AsyncStorage.removeItem(ITEMS_KEY),
      AsyncStorage.removeItem(FEEDBACK_KEY),
    ]);
  }, []);

  return (
    <WardrobeContext.Provider
      value={{ wardrobeItems, feedback, addItem, removeItem, updateItemSeasons, toggleStored, setFeedback, clearAll }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error("useWardrobe must be used within WardrobeProvider");
  return ctx;
}
