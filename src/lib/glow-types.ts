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
// CSS EXPORT
// ========================================================================================

export function exportAsCSS(state: GlowState): string {
  const layersCss = state.layers
    .filter((l) => l.active)
    .map(
      (layer, i) => `
.glow-layer-${i + 1} {
  /* ${layer.name} */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px);
  width: ${layer.width}px;
  height: ${layer.height}px;
  background-color: ${layer.color};
  filter: blur(${layer.blur}px);
  opacity: ${layer.opacity};
  border-radius: 9999px;
  mix-blend-mode: ${layer.blendMode};
  z-index: ${i};
  pointer-events: auto;
}`,
    )
    .join("\n");

  const animationCss = state.animation.enabled
    ? `
@keyframes breathe {
  0%, 100% { opacity: ${state.globalOpacity}; transform: scale(${state.globalScale}); }
  50% { opacity: ${state.globalOpacity * 0.8}; transform: scale(${state.globalScale * 1.05}); }
}

.glow-container {
  animation: breathe ${state.animation.duration}s ease-in-out infinite;
}`
    : "";

  return `/* Glow Effect CSS */
.glow-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform: scale(${state.globalScale});
  opacity: ${state.globalOpacity};
  
}
${animationCss}
${layersCss}
${
  state.noiseEnabled
    ? `
.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.15'/></svg>");
  background-repeat: repeat;
  background-size: 200px 200px;
  opacity: ${state.noiseIntensity};
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 100;
}`
    : ""
}`;
}

// ========================================================================================
// DEBOUNCE
// ========================================================================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
