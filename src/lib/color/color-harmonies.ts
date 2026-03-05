import { hexToHsl, hslToHex } from './color-utils';

export interface ColorHarmony {
  name: string;
  colors: string[];
}

/**
 * Full color harmonies: complementary, analogous, triadic, split-complementary
 * @param hex - Base color in #RRGGBB format
 * @returns Array of color harmonies
 */
export function getColorHarmonies(hex: string): ColorHarmony[] {
  try {
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
  } catch {
    // Return empty harmonies if invalid hex
    return [
      { name: "Complementary", colors: [hex] },
      { name: "Analogous", colors: [hex] },
      { name: "Triadic", colors: [hex] },
      { name: "Split Comp.", colors: [hex] },
    ];
  }
}

/**
 * Generate monochromatic color scheme
 * @param hex - Base color in #RRGGBB format
 * @param count - Number of colors to generate
 * @returns Array of monochromatic colors
 */
export function getMonochromaticColors(hex: string, count: number = 5): string[] {
  try {
    const [h, s] = hexToHsl(hex);
    const colors: string[] = [];
    const stepSize = 100 / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      const l = Math.round(stepSize * i);
      colors.push(hslToHex(h, s, l));
    }
    
    return colors;
  } catch {
    return [hex];
  }
}

/**
 * Generate tetradic (rectangle) color harmony
 * @param hex - Base color in #RRGGBB format
 * @returns Array of 4 colors in tetradic harmony
 */
export function getTetradicColors(hex: string): string[] {
  try {
    const [h, s, l] = hexToHsl(hex);
    return [
      hex,
      hslToHex((h + 60) % 360, s, l),
      hslToHex((h + 180) % 360, s, l),
      hslToHex((h + 240) % 360, s, l),
    ];
  } catch {
    return [hex];
  }
}

/**
 * Generate square color harmony
 * @param hex - Base color in #RRGGBB format
 * @returns Array of 4 colors in square harmony
 */
export function getSquareColors(hex: string): string[] {
  try {
    const [h, s, l] = hexToHsl(hex);
    return [
      hex,
      hslToHex((h + 90) % 360, s, l),
      hslToHex((h + 180) % 360, s, l),
      hslToHex((h + 270) % 360, s, l),
    ];
  } catch {
    return [hex];
  }
}
