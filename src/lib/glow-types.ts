// ========================================================================================
// TYPE DEFINITIONS
// ========================================================================================

export type BlendMode = "normal" | "screen" | "overlay" | "soft-light" | "color-dodge" | "multiply";

export interface GlowLayer {
  id: string;
  name: string;
  active: boolean;
  color: string;
  blur: number;
  opacity: number;
  width: number;
  height: number;
  x: number;
  y: number;
  blendMode: BlendMode;
}

export interface AnimationConfig {
  enabled: boolean;
  type: "pulse" | "breathe" | "none";
  duration: number;
}

export interface GlowState {
  power: boolean;
  themeMode: "dark" | "light";
  globalScale: number;
  globalOpacity: number;
  noiseEnabled: boolean;
  noiseIntensity: number;
  layers: GlowLayer[];
  selectedLayerId: string | null;
  animation: AnimationConfig;
}

export interface Preset {
  id: string;
  name: string;
  timestamp: number;
  favorite: boolean;
  state: GlowState;
}

// ========================================================================================
// INITIAL STATE
// ========================================================================================

const DEFAULT_LAYERS: GlowLayer[] = [
  {
    id: "layer-1",
    name: "Base Glow",
    active: true,
    color: "#4ade80",
    blur: 180,
    opacity: 0.4,
    width: 600,
    height: 380,
    x: -50,
    y: -50,
    blendMode: "screen",
  },
  {
    id: "layer-2",
    name: "Core Glow",
    active: true,
    color: "#22c55e",
    blur: 120,
    opacity: 0.6,
    width: 440,
    height: 440,
    x: 30,
    y: 50,
    blendMode: "screen",
  },
  {
    id: "layer-3",
    name: "Inner Light",
    active: true,
    color: "#86efac",
    blur: 60,
    opacity: 1,
    width: 360,
    height: 300,
    x: 70,
    y: 100,
    blendMode: "screen",
  },
  {
    id: "layer-highlight",
    name: "Highlight",
    active: true,
    color: "#FFFFFF",
    blur: 80,
    opacity: 0.4,
    width: 240,
    height: 180,
    x: 130,
    y: 130,
    blendMode: "normal",
  },
];

export const INITIAL_STATE: GlowState = {
  power: true,
  themeMode: "dark",
  globalScale: 0.9,
  globalOpacity: 1,
  noiseEnabled: true,
  noiseIntensity: 0.35,
  layers: DEFAULT_LAYERS,
  selectedLayerId: "layer-1",
  animation: {
    enabled: false,
    type: "breathe",
    duration: 3,
  },
};

// Built-in presets moved to src/lib/glow-presets.ts

// ========================================================================================
// DEBOUNCE
// ========================================================================================

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
