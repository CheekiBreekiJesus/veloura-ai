import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface BrandSize {
  brand: string;
  size: string;
}

export interface StylePrefs {
  age: number | null;
  favouriteBrands: string[];
  brandSizes: BrandSize[];
}

interface StylePrefsContextValue {
  stylePrefs: StylePrefs;
  setAge: (age: number | null) => Promise<void>;
  addBrand: (brand: string) => Promise<void>;
  removeBrand: (brand: string) => Promise<void>;
  addBrandSize: (entry: BrandSize) => Promise<void>;
  removeBrandSize: (index: number) => Promise<void>;
  updateBrandSize: (index: number, entry: BrandSize) => Promise<void>;
  clearStylePrefs: () => Promise<void>;
}

const STORAGE_KEY = "veloura_style_prefs";

const DEFAULT_PREFS: StylePrefs = {
  age: null,
  favouriteBrands: [],
  brandSizes: [],
};

const StylePrefsContext = createContext<StylePrefsContextValue | null>(null);

export function StylePrefsProvider({ children }: { children: React.ReactNode }) {
  const [stylePrefs, setStylePrefsState] = useState<StylePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        setStylePrefsState({ ...DEFAULT_PREFS, ...(JSON.parse(stored) as Partial<StylePrefs>) });
      }
    });
  }, []);

  const save = useCallback(async (next: StylePrefs) => {
    setStylePrefsState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setAge = useCallback(async (age: number | null) => {
    await save({ ...stylePrefs, age });
  }, [stylePrefs, save]);

  const addBrand = useCallback(async (brand: string) => {
    const trimmed = brand.trim();
    if (!trimmed || stylePrefs.favouriteBrands.includes(trimmed)) return;
    await save({ ...stylePrefs, favouriteBrands: [...stylePrefs.favouriteBrands, trimmed] });
  }, [stylePrefs, save]);

  const removeBrand = useCallback(async (brand: string) => {
    await save({ ...stylePrefs, favouriteBrands: stylePrefs.favouriteBrands.filter((b) => b !== brand) });
  }, [stylePrefs, save]);

  const addBrandSize = useCallback(async (entry: BrandSize) => {
    const b = entry.brand.trim();
    const s = entry.size.trim();
    if (!b || !s) return;
    await save({ ...stylePrefs, brandSizes: [...stylePrefs.brandSizes, { brand: b, size: s }] });
  }, [stylePrefs, save]);

  const removeBrandSize = useCallback(async (index: number) => {
    const next = stylePrefs.brandSizes.filter((_, i) => i !== index);
    await save({ ...stylePrefs, brandSizes: next });
  }, [stylePrefs, save]);

  const updateBrandSize = useCallback(async (index: number, entry: BrandSize) => {
    const b = entry.brand.trim();
    const s = entry.size.trim();
    if (!b || !s) return;
    const next = stylePrefs.brandSizes.map((e, i) => i === index ? { brand: b, size: s } : e);
    await save({ ...stylePrefs, brandSizes: next });
  }, [stylePrefs, save]);

  const clearStylePrefs = useCallback(async () => {
    setStylePrefsState(DEFAULT_PREFS);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <StylePrefsContext.Provider
      value={{ stylePrefs, setAge, addBrand, removeBrand, addBrandSize, removeBrandSize, updateBrandSize, clearStylePrefs }}
    >
      {children}
    </StylePrefsContext.Provider>
  );
}

export function useStylePrefs() {
  const ctx = useContext(StylePrefsContext);
  if (!ctx) throw new Error("useStylePrefs must be used within StylePrefsProvider");
  return ctx;
}

export function buildStylePrefsText(prefs: StylePrefs): string | null {
  const parts: string[] = [];
  if (prefs.age) parts.push(`Age: ${prefs.age}`);
  if (prefs.favouriteBrands.length > 0) {
    parts.push(`Favourite brands: ${prefs.favouriteBrands.join(", ")}`);
  }
  if (prefs.brandSizes.length > 0) {
    const sizes = prefs.brandSizes.map((e) => `${e.brand} ${e.size}`).join(", ");
    parts.push(`Known sizes: ${sizes}`);
  }
  return parts.length > 0 ? parts.join(". ") : null;
}
