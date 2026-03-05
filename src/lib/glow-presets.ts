import type { GlowState } from "./glow-types";

export interface PresetCategory {
  id: string;
  name: string;
  emoji: string;
}

export interface BuiltInPreset {
  id: string;
  name: string;
  emoji: string;
  categoryId: string;
  state: GlowState;
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  { id: "neon", name: "Neon", emoji: "⚡" },
  { id: "nature", name: "Nature", emoji: "🌿" },
  { id: "vibrant", name: "Vibrant", emoji: "🎨" },
  { id: "minimal", name: "Minimal", emoji: "✨" },
];

const base = (overrides: Partial<GlowState>): GlowState => ({
  power: true,
  themeMode: "dark",
  globalScale: 0.9,
  globalOpacity: 1,
  noiseEnabled: true,
  noiseIntensity: 0.25,
  selectedLayerId: null,
  animation: { enabled: false, type: "breathe", duration: 3 },
  layers: [],
  ...overrides,
});

export const BUILT_IN_PRESETS: BuiltInPreset[] = [
  // === NEON ===
  {
    id: "neon-blue", name: "Neon Blue", emoji: "💎", categoryId: "neon",
    state: base({
      layers: [
        { id: "nb-1", name: "Outer Haze", active: true, color: "#1e3a5f", blur: 200, opacity: 0.35, width: 620, height: 400, x: -40, y: -30, blendMode: "screen" },
        { id: "nb-2", name: "Core Blue", active: true, color: "#3b82f6", blur: 130, opacity: 0.6, width: 440, height: 420, x: 20, y: 40, blendMode: "screen" },
        { id: "nb-3", name: "Electric Core", active: true, color: "#60a5fa", blur: 60, opacity: 0.9, width: 320, height: 280, x: 60, y: 80, blendMode: "screen" },
        { id: "nb-4", name: "White Hot", active: true, color: "#dbeafe", blur: 40, opacity: 0.5, width: 180, height: 140, x: 100, y: 110, blendMode: "normal" },
      ],
    }),
  },
  {
    id: "neon-green", name: "Neon Green", emoji: "💚", categoryId: "neon",
    state: base({
      layers: [
        { id: "ng-1", name: "Base", active: true, color: "#4ade80", blur: 180, opacity: 0.4, width: 600, height: 380, x: -50, y: -50, blendMode: "screen" },
        { id: "ng-2", name: "Core", active: true, color: "#22c55e", blur: 120, opacity: 0.6, width: 440, height: 440, x: 30, y: 50, blendMode: "screen" },
        { id: "ng-3", name: "Inner", active: true, color: "#86efac", blur: 60, opacity: 1, width: 360, height: 300, x: 70, y: 100, blendMode: "screen" },
        { id: "ng-4", name: "Highlight", active: true, color: "#FFFFFF", blur: 80, opacity: 0.4, width: 240, height: 180, x: 130, y: 130, blendMode: "normal" },
      ],
    }),
  },
  {
    id: "neon-red", name: "Neon Red", emoji: "❤️‍🔥", categoryId: "neon",
    state: base({
      noiseIntensity: 0.3,
      layers: [
        { id: "nr-1", name: "Deep Crimson", active: true, color: "#7f1d1d", blur: 200, opacity: 0.35, width: 620, height: 400, x: -40, y: -20, blendMode: "screen" },
        { id: "nr-2", name: "Red Core", active: true, color: "#ef4444", blur: 130, opacity: 0.6, width: 440, height: 380, x: 20, y: 40, blendMode: "screen" },
        { id: "nr-3", name: "Hot Center", active: true, color: "#fca5a5", blur: 60, opacity: 0.85, width: 300, height: 260, x: 60, y: 80, blendMode: "screen" },
        { id: "nr-4", name: "White Hot", active: true, color: "#fef2f2", blur: 35, opacity: 0.5, width: 160, height: 130, x: 90, y: 100, blendMode: "color-dodge" },
      ],
    }),
  },
  {
    id: "neon-purple", name: "Neon Purple", emoji: "💜", categoryId: "neon",
    state: base({
      noiseIntensity: 0.35,
      layers: [
        { id: "np-1", name: "Deep Violet", active: true, color: "#581c87", blur: 210, opacity: 0.35, width: 640, height: 420, x: -50, y: -30, blendMode: "screen" },
        { id: "np-2", name: "Purple Core", active: true, color: "#a855f7", blur: 140, opacity: 0.55, width: 460, height: 400, x: 10, y: 30, blendMode: "screen" },
        { id: "np-3", name: "Lavender", active: true, color: "#d8b4fe", blur: 70, opacity: 0.8, width: 320, height: 280, x: 50, y: 70, blendMode: "screen" },
        { id: "np-4", name: "Glow Tip", active: true, color: "#f3e8ff", blur: 40, opacity: 0.5, width: 180, height: 140, x: 80, y: 100, blendMode: "color-dodge" },
      ],
    }),
  },
  {
    id: "cyberpunk", name: "Cyberpunk", emoji: "🤖", categoryId: "neon",
    state: base({
      noiseIntensity: 0.45,
      layers: [
        { id: "cp-1", name: "Magenta Base", active: true, color: "#be185d", blur: 200, opacity: 0.4, width: 600, height: 400, x: -80, y: -20, blendMode: "screen" },
        { id: "cp-2", name: "Cyan Core", active: true, color: "#06b6d4", blur: 140, opacity: 0.55, width: 500, height: 350, x: 60, y: 40, blendMode: "screen" },
        { id: "cp-3", name: "Electric Pink", active: true, color: "#ec4899", blur: 70, opacity: 0.8, width: 300, height: 280, x: -20, y: 80, blendMode: "color-dodge" },
        { id: "cp-4", name: "Neon Yellow", active: true, color: "#facc15", blur: 50, opacity: 0.3, width: 200, height: 160, x: 120, y: 60, blendMode: "overlay" },
      ],
    }),
  },

  // === NATURE ===
  {
    id: "forest-glow", name: "Forest Glow", emoji: "🌲", categoryId: "nature",
    state: base({
      animation: { enabled: true, type: "breathe", duration: 5 },
      noiseIntensity: 0.3,
      layers: [
        { id: "fg-1", name: "Deep Forest", active: true, color: "#14532d", blur: 220, opacity: 0.35, width: 650, height: 420, x: -60, y: -30, blendMode: "screen" },
        { id: "fg-2", name: "Emerald", active: true, color: "#059669", blur: 150, opacity: 0.5, width: 480, height: 380, x: 10, y: 20, blendMode: "screen" },
        { id: "fg-3", name: "Leaf Green", active: true, color: "#34d399", blur: 80, opacity: 0.7, width: 340, height: 280, x: 50, y: 70, blendMode: "screen" },
        { id: "fg-4", name: "Firefly", active: true, color: "#a7f3d0", blur: 40, opacity: 0.5, width: 180, height: 140, x: 80, y: 100, blendMode: "color-dodge" },
      ],
    }),
  },
  {
    id: "golden-hour", name: "Golden Hour", emoji: "🌤️", categoryId: "nature",
    state: base({
      animation: { enabled: true, type: "breathe", duration: 6 },
      noiseIntensity: 0.2,
      layers: [
        { id: "gh-1", name: "Amber Haze", active: true, color: "#78350f", blur: 220, opacity: 0.3, width: 660, height: 400, x: -40, y: -20, blendMode: "screen" },
        { id: "gh-2", name: "Gold", active: true, color: "#d97706", blur: 150, opacity: 0.5, width: 500, height: 380, x: 20, y: 30, blendMode: "screen" },
        { id: "gh-3", name: "Warm Light", active: true, color: "#fbbf24", blur: 80, opacity: 0.7, width: 360, height: 300, x: 60, y: 70, blendMode: "screen" },
        { id: "gh-4", name: "Sun Flare", active: true, color: "#fef3c7", blur: 45, opacity: 0.55, width: 200, height: 160, x: 90, y: 100, blendMode: "color-dodge" },
      ],
    }),
  },
  {
    id: "ice-crystal", name: "Ice Crystal", emoji: "❄️", categoryId: "nature",
    state: base({
      noiseIntensity: 0.15,
      layers: [
        { id: "ic-1", name: "Deep Ice", active: true, color: "#164e63", blur: 210, opacity: 0.35, width: 640, height: 420, x: -50, y: -30, blendMode: "screen" },
        { id: "ic-2", name: "Frost", active: true, color: "#22d3ee", blur: 140, opacity: 0.5, width: 460, height: 380, x: 20, y: 30, blendMode: "screen" },
        { id: "ic-3", name: "Crystal", active: true, color: "#a5f3fc", blur: 70, opacity: 0.75, width: 320, height: 260, x: 50, y: 70, blendMode: "screen" },
        { id: "ic-4", name: "Sparkle", active: true, color: "#ecfeff", blur: 35, opacity: 0.6, width: 180, height: 140, x: 80, y: 100, blendMode: "color-dodge" },
      ],
    }),
  },
  {
    id: "warm-sunset", name: "Warm Sunset", emoji: "🌅", categoryId: "nature",
    state: base({
      animation: { enabled: true, type: "breathe", duration: 5 },
      noiseIntensity: 0.3,
      layers: [
        { id: "ws-1", name: "Deep Red", active: true, color: "#991b1b", blur: 200, opacity: 0.3, width: 650, height: 380, x: -60, y: 20, blendMode: "screen" },
        { id: "ws-2", name: "Orange Glow", active: true, color: "#f97316", blur: 140, opacity: 0.55, width: 480, height: 400, x: 10, y: 30, blendMode: "screen" },
        { id: "ws-3", name: "Golden Core", active: true, color: "#fbbf24", blur: 70, opacity: 0.8, width: 360, height: 300, x: 50, y: 70, blendMode: "screen" },
        { id: "ws-4", name: "Sun Center", active: true, color: "#fef3c7", blur: 50, opacity: 0.6, width: 200, height: 160, x: 90, y: 100, blendMode: "normal" },
      ],
    }),
  },
  {
    id: "aurora", name: "Aurora", emoji: "🌌", categoryId: "nature",
    state: base({
      animation: { enabled: true, type: "breathe", duration: 6 },
      noiseIntensity: 0.2,
      layers: [
        { id: "au-1", name: "Deep Green", active: true, color: "#064e3b", blur: 220, opacity: 0.35, width: 700, height: 300, x: -60, y: -80, blendMode: "screen" },
        { id: "au-2", name: "Teal Band", active: true, color: "#14b8a6", blur: 150, opacity: 0.5, width: 550, height: 250, x: 0, y: -30, blendMode: "screen" },
        { id: "au-3", name: "Purple Accent", active: true, color: "#8b5cf6", blur: 100, opacity: 0.4, width: 400, height: 300, x: 80, y: 60, blendMode: "screen" },
        { id: "au-4", name: "Green Highlight", active: true, color: "#a7f3d0", blur: 60, opacity: 0.6, width: 250, height: 180, x: -20, y: 20, blendMode: "color-dodge" },
      ],
    }),
  },
  {
    id: "ocean-deep", name: "Ocean Deep", emoji: "🌊", categoryId: "nature",
    state: base({
      animation: { enabled: true, type: "breathe", duration: 4 },
      layers: [
        { id: "od-1", name: "Abyss", active: true, color: "#0c4a6e", blur: 200, opacity: 0.4, width: 640, height: 420, x: -30, y: -40, blendMode: "screen" },
        { id: "od-2", name: "Deep Blue", active: true, color: "#0284c7", blur: 140, opacity: 0.55, width: 460, height: 380, x: 20, y: 30, blendMode: "screen" },
        { id: "od-3", name: "Surface", active: true, color: "#38bdf8", blur: 80, opacity: 0.7, width: 340, height: 280, x: 50, y: 80, blendMode: "screen" },
        { id: "od-4", name: "Sparkle", active: true, color: "#e0f2fe", blur: 40, opacity: 0.45, width: 180, height: 140, x: 80, y: 100, blendMode: "normal" },
      ],
    }),
  },

  // === VIBRANT ===
  {
    id: "purple-haze", name: "Purple Haze", emoji: "🔮", categoryId: "vibrant",
    state: base({
      globalScale: 0.95,
      noiseIntensity: 0.4,
      animation: { enabled: true, type: "breathe", duration: 4 },
      layers: [
        { id: "ph-1", name: "Deep Violet", active: true, color: "#4c1d95", blur: 220, opacity: 0.35, width: 600, height: 420, x: -30, y: -40, blendMode: "screen" },
        { id: "ph-2", name: "Purple Mid", active: true, color: "#7c3aed", blur: 140, opacity: 0.55, width: 450, height: 380, x: 20, y: 30, blendMode: "screen" },
        { id: "ph-3", name: "Magenta Edge", active: true, color: "#c084fc", blur: 80, opacity: 0.7, width: 340, height: 300, x: 60, y: 80, blendMode: "screen" },
        { id: "ph-4", name: "Pink Core", active: true, color: "#f0abfc", blur: 40, opacity: 0.5, width: 200, height: 160, x: 100, y: 120, blendMode: "color-dodge" },
      ],
    }),
  },
  {
    id: "fire-blaze", name: "Fire Blaze", emoji: "🔥", categoryId: "vibrant",
    state: base({
      noiseIntensity: 0.35,
      animation: { enabled: true, type: "breathe", duration: 2.5 },
      layers: [
        { id: "fb-1", name: "Dark Ember", active: true, color: "#7c2d12", blur: 200, opacity: 0.4, width: 600, height: 400, x: -40, y: 40, blendMode: "screen" },
        { id: "fb-2", name: "Red Flame", active: true, color: "#dc2626", blur: 130, opacity: 0.6, width: 450, height: 350, x: 20, y: 0, blendMode: "screen" },
        { id: "fb-3", name: "Orange Core", active: true, color: "#f97316", blur: 70, opacity: 0.8, width: 320, height: 260, x: 40, y: -30, blendMode: "screen" },
        { id: "fb-4", name: "Yellow Tip", active: true, color: "#fde68a", blur: 40, opacity: 0.6, width: 180, height: 140, x: 60, y: -60, blendMode: "color-dodge" },
      ],
    }),
  },
  {
    id: "rainbow-prism", name: "Rainbow", emoji: "🌈", categoryId: "vibrant",
    state: base({
      layers: [
        { id: "rp-1", name: "Red", active: true, color: "#ef4444", blur: 140, opacity: 0.45, width: 350, height: 350, x: -120, y: -40, blendMode: "screen" },
        { id: "rp-2", name: "Yellow", active: true, color: "#eab308", blur: 120, opacity: 0.45, width: 300, height: 300, x: -40, y: 60, blendMode: "screen" },
        { id: "rp-3", name: "Green", active: true, color: "#22c55e", blur: 120, opacity: 0.45, width: 300, height: 300, x: 40, y: -20, blendMode: "screen" },
        { id: "rp-4", name: "Blue", active: true, color: "#3b82f6", blur: 140, opacity: 0.45, width: 350, height: 350, x: 120, y: 50, blendMode: "screen" },
      ],
    }),
  },

  // === MINIMAL ===
  {
    id: "minimal-white", name: "Soft White", emoji: "🤍", categoryId: "minimal",
    state: base({
      themeMode: "light",
      noiseEnabled: false,
      layers: [
        { id: "mw-1", name: "Haze", active: true, color: "#d4d4d8", blur: 200, opacity: 0.3, width: 600, height: 400, x: 0, y: 0, blendMode: "normal" },
        { id: "mw-2", name: "Core", active: true, color: "#e4e4e7", blur: 100, opacity: 0.5, width: 400, height: 300, x: 20, y: 30, blendMode: "normal" },
        { id: "mw-3", name: "Center", active: true, color: "#ffffff", blur: 60, opacity: 0.8, width: 250, height: 200, x: 40, y: 50, blendMode: "normal" },
      ],
    }),
  },
  {
    id: "minimal-mono", name: "Mono Glow", emoji: "🖤", categoryId: "minimal",
    state: base({
      noiseIntensity: 0.15,
      layers: [
        { id: "mm-1", name: "Dark Ring", active: true, color: "#27272a", blur: 180, opacity: 0.5, width: 600, height: 400, x: 0, y: 0, blendMode: "screen" },
        { id: "mm-2", name: "Mid Gray", active: true, color: "#52525b", blur: 120, opacity: 0.5, width: 400, height: 350, x: 20, y: 30, blendMode: "screen" },
        { id: "mm-3", name: "Light Core", active: true, color: "#a1a1aa", blur: 60, opacity: 0.6, width: 250, height: 200, x: 40, y: 50, blendMode: "screen" },
      ],
    }),
  },
  {
    id: "minimal-rose", name: "Rose Mist", emoji: "🌸", categoryId: "minimal",
    state: base({
      noiseIntensity: 0.15,
      animation: { enabled: true, type: "breathe", duration: 6 },
      layers: [
        { id: "mr-1", name: "Blush", active: true, color: "#9f1239", blur: 200, opacity: 0.2, width: 600, height: 400, x: -20, y: -20, blendMode: "screen" },
        { id: "mr-2", name: "Rose", active: true, color: "#fb7185", blur: 130, opacity: 0.4, width: 440, height: 360, x: 20, y: 30, blendMode: "screen" },
        { id: "mr-3", name: "Pink Core", active: true, color: "#fda4af", blur: 70, opacity: 0.6, width: 280, height: 220, x: 50, y: 70, blendMode: "screen" },
      ],
    }),
  },
];
