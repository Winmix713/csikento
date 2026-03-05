import type { GlowState, GlowLayer, BlendMode } from "./glow-types";

// ========================================================================================
// COLOR UTILITIES
// ========================================================================================

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getColorPalette(hex: string): { name: string; color: string }[] {
  const [h, s, l] = hexToHsl(hex);
  return [
    { name: "Complementary", color: hslToHex((h + 180) % 360, s, l) },
    { name: "Analogous +", color: hslToHex((h + 30) % 360, s, l) },
    { name: "Analogous -", color: hslToHex((h + 330) % 360, s, l) },
    { name: "Triadic", color: hslToHex((h + 120) % 360, s, l) },
    { name: "Lighter", color: hslToHex(h, s, Math.min(l + 20, 95)) },
    { name: "Darker", color: hslToHex(h, s, Math.max(l - 20, 5)) },
  ];
}

/**
 * Full color harmonies: complementary, analogous, triadic, split-complementary
 */
export function getColorHarmonies(hex: string): { name: string; colors: string[] }[] {
  const [h, s, l] = hexToHsl(hex);
  return [
    {
      name: "Complementary",
      colors: [hex, hslToHex((h + 180) % 360, s, l)],
    },
    {
      name: "Analogous",
      colors: [
        hslToHex((h + 330) % 360, s, l),
        hex,
        hslToHex((h + 30) % 360, s, l),
      ],
    },
    {
      name: "Triadic",
      colors: [
        hex,
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
      ],
    },
    {
      name: "Split Comp.",
      colors: [
        hex,
        hslToHex((h + 150) % 360, s, l),
        hslToHex((h + 210) % 360, s, l),
      ],
    },
  ];
}

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
