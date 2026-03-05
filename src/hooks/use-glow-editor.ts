import { useState, useCallback, useEffect } from "react";
import type { GlowState, Preset } from "@/lib/glow-types";

export function useHistory<T>(initialState: T, maxHistory: number = 50) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback(
    (newState: T) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(newState);
        if (newHistory.length > maxHistory) {
          return newHistory.slice(newHistory.length - maxHistory);
        }
        return newHistory;
      });
      setCurrentIndex((prev) => Math.min(prev + 1, maxHistory - 1));
    },
    [currentIndex, maxHistory],
  );

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [canRedo, currentIndex, history]);

  return { pushState, undo, redo, canUndo, canRedo };
}

export function usePresets(initialState: GlowState) {
  const STORAGE_KEY = "glow-editor-presets-v2";

  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error("Failed to save presets:", error);
    }
  }, [presets]);

  const savePreset = useCallback((name: string, state: GlowState) => {
    const newPreset: Preset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      favorite: false,
      state,
    };
    setPresets((prev) => [newPreset, ...prev]);
    return newPreset;
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)),
    );
  }, []);

  const loadPreset = useCallback(
    (id: string): GlowState | null => {
      const preset = presets.find((p) => p.id === id);
      return preset ? preset.state : null;
    },
    [presets],
  );

  const exportPresets = useCallback(() => {
    const dataStr = JSON.stringify(presets, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `glow-presets-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [presets]);

  const importPresets = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setPresets((prev) => [...imported, ...prev]);
        }
      } catch (error) {
        console.error("Failed to import presets:", error);
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    presets,
    savePreset,
    deletePreset,
    toggleFavorite,
    loadPreset,
    exportPresets,
    importPresets,
  };
}
