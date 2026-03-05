import { hexToHsl, hslToHex } from './color-utils';

export interface ColorSuggestion {
  name: string;
  color: string;
}

/**
 * Generate color palette suggestions based on a base color
 * @param hex - Base color in #RRGGBB format
 * @returns Array of color suggestions with names
 */
export function getColorPalette(hex: string): ColorSuggestion[] {
  try {
    const [h, s, l] = hexToHsl(hex);
    return [
      { name: "Complementary", color: hslToHex((h + 180) % 360, s, l) },
      { name: "Analogous +", color: hslToHex((h + 30) % 360, s, l) },
      { name: "Analogous -", color: hslToHex((h + 330) % 360, s, l) },
      { name: "Triadic", color: hslToHex((h + 120) % 360, s, l) },
      { name: "Lighter", color: hslToHex(h, s, Math.min(l + 20, 95)) },
      { name: "Darker", color: hslToHex(h, s, Math.max(l - 20, 5)) },
    ];
  } catch {
    // Return empty array if invalid hex
    return [];
  }
}

/**
 * Generate color variations at different lightness levels
 * @param hex - Base color in #RRGGBB format
 * @param steps - Number of lightness steps to generate
 * @returns Array of colors with varying lightness
 */
export function getColorShades(hex: string, steps: number = 9): string[] {
  try {
    const [h, s] = hexToHsl(hex);
    const shades: string[] = [];
    const stepSize = 100 / (steps + 1);
    
    for (let i = 1; i <= steps; i++) {
      const l = Math.round(stepSize * i);
      shades.push(hslToHex(h, s, l));
    }
    
    return shades;
  } catch {
    return [];
  }
}

/**
 * Generate color variations at different saturation levels
 * @param hex - Base color in #RRGGBB format
 * @param steps - Number of saturation steps to generate
 * @returns Array of colors with varying saturation
 */
export function getColorTones(hex: string, steps: number = 5): string[] {
  try {
    const [h, l] = hexToHsl(hex);
    const tones: string[] = [];
    const stepSize = 100 / (steps - 1);
    
    for (let i = 0; i < steps; i++) {
      const s = Math.round(stepSize * i);
      tones.push(hslToHex(h, s, l));
    }
    
    return tones;
  } catch {
    return [];
  }
}
