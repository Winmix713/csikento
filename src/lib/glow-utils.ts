import type { GlowState, GlowLayer, BlendMode } from "./glow-types";
import { 
  hexToHsl, 
  hslToHex 
} from "./color";

// ========================================================================================
// COLOR UTILITIES (Re-exported from color module for backwards compatibility)
// ========================================================================================

export { 
  hexToHsl, 
  hslToHex, 
  getColorPalette, 
  getColorHarmonies 
} from "./color";

// ========================================================================================
// LAYER UTILITIES
// ========================================================================================

export function duplicateLayer(layer: GlowLayer): GlowLayer {
  return {
    ...layer,
    id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: `${layer.name} (copy)`,
    x: layer.x + 20,
    y: layer.y + 20,
  };
}

const BLEND_MODES: BlendMode[] = ["normal", "screen", "overlay", "soft-light", "color-dodge"];

function randRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomGlow(): GlowState {
  const numLayers = randRange(3, 5);
  const baseHue = Math.random() * 360;
  const layers: GlowLayer[] = [];

  for (let i = 0; i < numLayers; i++) {
    const hueShift = (i * 20) + randRange(-10, 10);
    const hue = (baseHue + hueShift) % 360;
    const sat = randRange(50, 100);
    const light = 30 + (i * 15);
    layers.push({
      id: `rand-${Date.now()}-${i}`,
      name: `Layer ${i + 1}`,
      active: true,
      color: hslToHex(hue, sat, Math.min(light, 90)),
      blur: 200 - i * 40 + randRange(-20, 20),
      opacity: 0.3 + i * 0.15,
      width: 600 - i * 80 + randRange(-30, 30),
      height: 400 - i * 60 + randRange(-30, 30),
      x: randRange(-80, 80),
      y: randRange(-80, 80),
      blendMode: i === numLayers - 1 ? "normal" : "screen",
    });
  }

  return {
    power: true,
    themeMode: "dark",
    globalScale: 0.9,
    globalOpacity: 1,
    noiseEnabled: Math.random() > 0.3,
    noiseIntensity: 0.2 + Math.random() * 0.3,
    layers,
    selectedLayerId: layers[0].id,
    animation: {
      enabled: Math.random() > 0.5,
      type: "breathe",
      duration: 2 + Math.round(Math.random() * 6),
    },
  };
}
