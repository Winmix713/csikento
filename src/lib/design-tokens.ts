// ========================================================================================
// DESIGN TOKENS
// Extracted from index.css for centralized theming
// ========================================================================================

export const tokens = {
  // Radii
  radius: {
    DEFAULT: "1rem",
    sm: "8px",
    lg: "18px",
    xl: "24px",
  },

  // Blur amounts
  blur: {
    panel: "32px",
    overlay: "12px",
  },

  // Transitions
  transition: {
    fast: "0.12s",
    normal: "0.2s",
    smooth: "cubic-bezier(0.2, 0, 0, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },

  // Shadows
  shadow: {
    depth: "0 32px 64px -16px hsla(0 0% 0% / 0.65)",
    ambient: "0 16px 32px -8px hsla(0 0% 0% / 0.45)",
    close: "0 4px 12px hsla(0 0% 0% / 0.35)",
    inset: "inset 0 1px 1px hsla(0 0% 100% / 0.03)",
    top: "0 -0.5px 0 hsla(0 0% 100% / 0.08)",
  },
} as const;

// Color tokens with HSL values for dynamic manipulation
export const colorTokens = {
  // Base colors (dark theme defaults)
  background: { h: 0, s: 0, l: 5 },
  foreground: { h: 0, s: 0, l: 95 },

  // Card
  card: { h: 0, s: 0, l: 7 },
  cardForeground: { h: 0, s: 0, l: 95 },

  // Popover
  popover: { h: 0, s: 0, l: 7 },
  popoverForeground: { h: 0, s: 0, l: 95 },

  // Primary (green)
  primary: { h: 142, s: 71, l: 45 },
  primaryForeground: { h: 0, s: 0, l: 0 },

  // Secondary
  secondary: { h: 0, s: 0, l: 11 },
  secondaryForeground: { h: 0, s: 0, l: 55 },

  // Muted
  muted: { h: 0, s: 0, l: 13 },
  mutedForeground: { h: 0, s: 0, l: 45 },

  // Accent
  accent: { h: 0, s: 0, l: 13 },
  accentForeground: { h: 0, s: 0, l: 90 },

  // Destructive
  destructive: { h: 0, s: 62, l: 50 },
  destructiveForeground: { h: 0, s: 0, l: 100 },

  // Border
  border: { h: 0, s: 0, l: 15 },
  input: { h: 0, s: 0, l: 15 },
  ring: { h: 142, s: 71, l: 45 },

  // Editor-specific
  editor: {
    surface: { h: 0, s: 0, l: 7, a: 0.03 },
    surfaceHover: { h: 0, s: 0, l: 7, a: 0.06 },
    border: { h: 0, s: 0, l: 100, a: 0.08 },
    borderHover: { h: 0, s: 0, l: 100, a: 0.12 },
    textDim: { h: 0, s: 0, l: 45 },
    textMuted: { h: 0, s: 0, l: 60 },
  },

  // Glass
  glass: {
    bg: { h: 0, s: 0, l: 7, a: 0.4 },
    border: { h: 0, s: 0, l: 100, a: 0.08 },
    borderHover: { h: 0, s: 0, l: 100, a: 0.15 },
    highlight: { h: 0, s: 0, l: 100, a: 0.03 },
  },

  // Sidebar
  sidebar: {
    background: { h: 0, s: 0, l: 7 },
    foreground: { h: 0, s: 0, l: 90 },
    primary: { h: 142, s: 71, l: 45 },
    primaryForeground: { h: 0, s: 0, l: 0 },
    accent: { h: 0, s: 0, l: 13 },
    accentForeground: { h: 0, s: 0, l: 90 },
    border: { h: 0, s: 0, l: 15 },
    ring: { h: 142, s: 71, l: 45 },
  },
} as const;

// Helper to convert HSL to CSS variable string
export function hslToVar(h: number, s: number, l: number, a?: number): string {
  if (a !== undefined) {
    return `hsl(${h} ${s}% ${l}% / ${a * 100}%)`;
  }
  return `hsl(${h} ${s}% ${l}%)`;
}

// Generate CSS custom properties from tokens
export function generateCSSVariables(): string {
  const vars: string[] = [];

  // Base colors
  Object.entries(colorTokens).forEach(([key, value]) => {
    if (key === 'editor' || key === 'glass' || key === 'sidebar') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        const varName = `--${key}-${subKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        vars.push(`${varName}: ${hslToVar(subValue.h, subValue.s, subValue.l, (subValue as typeof subValue & { a?: number }).a)};`);
      });
    } else {
      const varName = `--${key}`;
      vars.push(`${varName}: ${hslToVar(value.h, value.s, value.l)};`);
    }
  });

  return vars.join('\n  ');
}
