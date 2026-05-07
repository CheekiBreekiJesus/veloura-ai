import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CountryCode = "US" | "GB" | "AU" | "CA" | "FR" | "DE" | "INT";

export const COUNTRIES: { code: CountryCode; label: string; flag: string }[] = [
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "INT", label: "International", flag: "🌍" },
];

const VALID_CODES = COUNTRIES.map((c) => c.code) as string[];

interface CountryContextValue {
  country: CountryCode;
  countryLabel: string;
  countryFlag: string;
  setCountry: (code: CountryCode) => Promise<void>;
}

const CountryContext = createContext<CountryContextValue | null>(null);

const STORAGE_KEY = "veloura_country_v1";

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<CountryCode>("US");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v && VALID_CODES.includes(v)) {
          setCountryState(v as CountryCode);
        }
      })
      .catch(() => {});
  }, []);

  const setCountry = useCallback(async (code: CountryCode) => {
    setCountryState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  }, []);

  const found = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  return (
    <CountryContext.Provider
      value={{
        country,
        countryLabel: found.label,
        countryFlag: found.flag,
        setCountry,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}

export const CURRENCY_CONFIG: Record<CountryCode, { symbol: string; rate: number; code: string }> = {
  US:  { symbol: "$",  rate: 1.00, code: "USD" },
  GB:  { symbol: "£",  rate: 0.79, code: "GBP" },
  AU:  { symbol: "A$", rate: 1.55, code: "AUD" },
  CA:  { symbol: "C$", rate: 1.36, code: "CAD" },
  FR:  { symbol: "€",  rate: 0.92, code: "EUR" },
  DE:  { symbol: "€",  rate: 0.92, code: "EUR" },
  INT: { symbol: "$",  rate: 1.00, code: "USD" },
};

export function formatPrice(priceNumeric: number, country: CountryCode): string {
  const cfg = CURRENCY_CONFIG[country];
  const converted = Math.round(priceNumeric * cfg.rate);
  return `${cfg.symbol}${converted}+`;
}
