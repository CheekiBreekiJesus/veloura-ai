import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "wishlist_product_ids_v1";

type WishlistProductContextType = {
  savedIds: Set<string>;
  isSaved: (id: string) => boolean;
  toggleSave: (id: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  savedCount: number;
};

const WishlistProductContext = createContext<WishlistProductContextType | null>(null);

export function WishlistProductProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const arr: string[] = JSON.parse(raw) as string[];
          setSavedIds(new Set(arr));
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(async (next: Set<string>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggleSave = useCallback(
    async (id: string) => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearWishlist = useCallback(async () => {
    setSavedIds(new Set());
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <WishlistProductContext.Provider
      value={{
        savedIds,
        isSaved,
        toggleSave,
        clearWishlist,
        savedCount: savedIds.size,
      }}
    >
      {children}
    </WishlistProductContext.Provider>
  );
}

export function useWishlistProducts() {
  const ctx = useContext(WishlistProductContext);
  if (!ctx) throw new Error("useWishlistProducts must be used inside WishlistProductProvider");
  return ctx;
}
