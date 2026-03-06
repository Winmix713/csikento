// ========================================================================================
// TYPE DEFINITIONS
// ========================================================================================

export type BlendMode = "normal" | "screen" | "overlay" | "soft-light" | "color-dodge" | "multiply";
export type SceneType = "studio" | "glass" | "night" | "clean";
export type MotionType = "none" | "pulse" | "breathe" | "orbit" | "float" | "sequence" | "waver" | "glitch" | "rainbow";

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
  type: MotionType;
  duration: number;
}

export interface GlowState {
  power: boolean;
  themeMode: "dark" | "light";
  sceneType: SceneType;
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
  sceneType: "studio",
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
      (layer, i) => {
        let animationName = "";
        if (state.animation.enabled) {
          if (state.animation.type === "rainbow") {
            animationName = `rainbow-${i} ${state.animation.duration}s linear infinite`;
          } else if (state.animation.type !== "sequence") {
             animationName = `${state.animation.type} ${state.animation.duration}s ease-in-out infinite`;
             if (state.animation.type === "orbit") animationName = `orbit ${state.animation.duration}s linear infinite`;
          }
        }

        return `
.glow-layer-${i + 1} {
  /* ${layer.name} */
  position: absolute;
  top: 50%;
  left: 50%;
  --x: ${layer.x}px;
  --y: ${layer.y}px;
  transform: translate(-50%, -50%) translate(var(--x), var(--y));
  width: ${layer.width}px;
  height: ${layer.height}px;
  background-color: ${layer.color};
  filter: blur(${layer.blur}px);
  opacity: ${layer.opacity};
  border-radius: 9999px;
  mix-blend-mode: ${layer.blendMode};
  z-index: ${i};
  pointer-events: auto;
  ${animationName ? `animation: ${animationName};` : ""}
}`;
      }
    )
    .join("\n");

  let keyframes = "";
  if (state.animation.enabled) {
    if (state.animation.type === "breathe") {
      keyframes = `
@keyframes breathe {
  0%, 100% { opacity: 1; transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(1.05); }
}`;
    } else if (state.animation.type === "pulse") {
      keyframes = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}`;
    } else if (state.animation.type === "orbit") {
      keyframes = `
@keyframes orbit {
  from { transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) rotate(0deg) translateX(20px) rotate(0deg); }
  to { transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) rotate(360deg) translateX(20px) rotate(-360deg); }
}`;
    } else if (state.animation.type === "float") {
      keyframes = `
@keyframes float {
  0%, 100% { transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)); }
  33% { transform: translate(-50%, -50%) translate(calc(var(--x, 0) + 20px), calc(var(--y, 0) - 20px)); }
  66% { transform: translate(-50%, -50%) translate(calc(var(--x, 0) - 20px), calc(var(--y, 0) + 20px)); }
}`;
    } else if (state.animation.type === "waver") {
      keyframes = `
@keyframes waver {
  0%, 100% { transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) skew(0deg); }
  25% { transform: translate(-50%, -50%) translate(calc(var(--x, 0) + 10px), var(--y, 0)) skew(2deg); }
  75% { transform: translate(-50%, -50%) translate(calc(var(--x, 0) - 10px), var(--y, 0)) skew(-2deg); }
}`;
    } else if (state.animation.type === "glitch") {
      keyframes = `
@keyframes glitch {
  0%, 100% { transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)); opacity: 1; }
  10% { transform: translate(-50%, -50%) translate(calc(var(--x, 0) + 5px), calc(var(--y, 0) - 5px)); opacity: 0.8; }
  20% { transform: translate(-50%, -50%) translate(calc(var(--x, 0) - 5px), calc(var(--y, 0) + 2px)); opacity: 0.9; }
  30% { transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)); opacity: 1; }
  40% { transform: translate(-50%, -50%) translate(calc(var(--x, 0) + 2px), calc(var(--y, 0) + 5px)); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) translate(calc(var(--x, 0) - 2px), calc(var(--y, 0) - 2px)); opacity: 1; }
}`;
    } else if (state.animation.type === "rainbow") {
      state.layers.forEach((l, i) => {
        keyframes += `
@keyframes rainbow-${i} {
  0% { background-color: ${l.color}; }
  33% { background-color: #ff0000; }
  66% { background-color: #00ff00; }
  100% { background-color: #0000ff; }
}`;
      });
    }
  }

  return `/* Glow Effect CSS */
.glow-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform: scale(${state.globalScale});
  opacity: ${state.globalOpacity};
}

${keyframes}

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
