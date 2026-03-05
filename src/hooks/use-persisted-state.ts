import { useState, useEffect, useCallback, useRef } from "react";
import type { GlowState } from "@/lib/glow-types";
import { INITIAL_STATE } from "@/lib/glow-types";

const STORAGE_KEY = "glow-editor-state-v1";
const SAVE_DEBOUNCE_MS = 300;

function isValidGlowState(obj: any): obj is GlowState {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.power === "boolean" &&
    Array.isArray(obj.layers) &&
    obj.layers.length > 0 &&
    typeof obj.globalScale === "number" &&
    typeof obj.globalOpacity === "number"
  );
}

export function loadPersistedState(): GlowState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    if (isValidGlowState(parsed)) return parsed;
  } catch {
    console.warn("Failed to load persisted state, using defaults");
  }
  return INITIAL_STATE;
}

export function usePersistedState() {
  const [state, setState] = useState<GlowState>(loadPersistedState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save to localStorage
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Failed to persist state:", e);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state]);

  const resetState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
  }, []);

  return { state, setState, resetState };
}
