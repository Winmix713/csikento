// ========================================================================================
// COLOR UTILITIES
// ========================================================================================

/**
 * Hex color konvertálása HSL formátumba
 * @param hex - #RRGGBB formátumú szín
 * @returns [hue, saturation, lightness] tuple (0-360, 0-100, 0-100)
 * @throws Error if hex format is invalid
 */
export function hexToHsl(hex: string): [number, number, number] {
  // Validate hex format
  const validHex = /^#([0-9A-Fa-f]{6})$/.test(hex);
  if (!validHex) {
    throw new Error(`Invalid hex color format: ${hex}. Expected #RRGGBB`);
  }

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
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

/**
 * HSL color konvertálása Hex formátumba
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns #RRGGBB formátumú szín
 */
export function hslToHex(h: number, s: number, l: number): string {
  // Clamp values
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));

  h /= 360; 
  s /= 100; 
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r: number, g: number, b: number;
  
  if (s === 0) { 
    r = g = b = l; 
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate relative luminance of a color
 * @param hex - #RRGGBB formátumú szín
 * @returns Luminance value (0-1)
 */
export function getLuminance(hex: string): number {
  const [r, g, b] = [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
  const [lr, lg, lb] = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/**
 * Determine if text should be dark or light for contrast
 * @param hex - Background color in #RRGGBB format
 * @returns 'black' or 'white' depending on background luminance
 */
export function getContrastColor(hex: string): 'black' | 'white' {
  return getLuminance(hex) > 0.5 ? 'black' : 'white';
}
