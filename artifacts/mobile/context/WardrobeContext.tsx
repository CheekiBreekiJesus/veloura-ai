import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ClothingCategory =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Outerwear"
  | "Shoes"
  | "Accessories";

export interface WardrobeItem {
  id: string;
  name: string;
  category: ClothingCategory;
  imageUri: string;
  dominantColor: string;
  compatibilityScore: number;
  compatibilityNotes: string;
  addedAt: number;
}

export type FeedbackValue = "liked" | "disliked";

interface WardrobeContextValue {
  wardrobeItems: WardrobeItem[];
  feedback: Record<string, FeedbackValue>;
  addItem: (item: WardrobeItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
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
      if (items) setWardrobeItems(JSON.parse(items) as WardrobeItem[]);
      if (fb) setFeedbackState(JSON.parse(fb) as Record<string, FeedbackValue>);
    };
    void load();
  }, []);

  const addItem = useCallback(async (item: WardrobeItem) => {
    setWardrobeItems((prev) => {
      const next = [item, ...prev];
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
      value={{ wardrobeItems, feedback, addItem, removeItem, setFeedback, clearAll }}
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
