import React, { createContext, useContext, useState } from "react";

export type UploadedOutfitResult = {
  imageUri: string;
  name: string;
  category: string;
  dominantColor: string;
  compatibilityScore: number;
  compatibilityNotes: string;
};

export type SuggestedOutfitItem = {
  name: string;
  category: string;
};

export type SuggestedOutfitResult = {
  suggestionText: string;
  items: SuggestedOutfitItem[];
};

type TodayOutfitMode = "empty" | "uploading" | "uploaded" | "suggesting" | "suggested";

type TodayOutfitState = {
  mode: TodayOutfitMode;
  uploaded: UploadedOutfitResult | null;
  suggested: SuggestedOutfitResult | null;
  error: string | null;
};

type TodayOutfitContextValue = TodayOutfitState & {
  setUploading: () => void;
  setUploaded: (result: UploadedOutfitResult) => void;
  setSuggesting: () => void;
  setSuggested: (result: SuggestedOutfitResult) => void;
  setError: (msg: string) => void;
  reset: () => void;
};

const initial: TodayOutfitState = {
  mode: "empty",
  uploaded: null,
  suggested: null,
  error: null,
};

const TodayOutfitContext = createContext<TodayOutfitContextValue | null>(null);

export function TodayOutfitProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TodayOutfitState>(initial);

  const setUploading = () =>
    setState({ mode: "uploading", uploaded: null, suggested: null, error: null });

  const setUploaded = (result: UploadedOutfitResult) =>
    setState((s) => ({ ...s, mode: "uploaded", uploaded: result, error: null }));

  const setSuggesting = () =>
    setState({ mode: "suggesting", uploaded: null, suggested: null, error: null });

  const setSuggested = (result: SuggestedOutfitResult) =>
    setState((s) => ({ ...s, mode: "suggested", suggested: result, error: null }));

  const setError = (msg: string) =>
    setState((s) => ({ ...s, mode: "empty", error: msg }));

  const reset = () => setState(initial);

  return (
    <TodayOutfitContext.Provider
      value={{ ...state, setUploading, setUploaded, setSuggesting, setSuggested, setError, reset }}
    >
      {children}
    </TodayOutfitContext.Provider>
  );
}

export function useTodayOutfit(): TodayOutfitContextValue {
  const ctx = useContext(TodayOutfitContext);
  if (!ctx) throw new Error("useTodayOutfit must be used inside TodayOutfitProvider");
  return ctx;
}
