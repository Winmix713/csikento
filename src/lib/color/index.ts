// ========================================================================================
// COLOR MODULE - Public API
// ========================================================================================

// Core color conversions
export { 
  hexToHsl, 
  hslToHex, 
  getLuminance, 
  getContrastColor 
} from './color-utils';

// Color palette generation
export { 
  getColorPalette, 
  getColorShades, 
  getColorTones,
  type ColorSuggestion 
} from './color-palette';

// Color harmonies
export { 
  getColorHarmonies, 
  getMonochromaticColors, 
  getTetradicColors, 
  getSquareColors,
  type ColorHarmony 
} from './color-harmonies';
