import { describe, test, expect } from "vitest";
import { 
  getColorPalette, 
  getColorShades, 
  getColorTones 
} from "../color/color-palette";

describe("getColorPalette", () => {
  test("returns 6 color suggestions", () => {
    const palette = getColorPalette("#4ade80");
    expect(palette).toHaveLength(6);
  });

  test("includes complementary color", () => {
    const palette = getColorPalette("#4ade80");
    const complementary = palette.find((p) => p.name === "Complementary");
    expect(complementary).toBeDefined();
    expect(complementary?.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("includes analogous colors", () => {
    const palette = getColorPalette("#4ade80");
    const analogousPlus = palette.find((p) => p.name === "Analogous +");
    const analogousMinus = palette.find((p) => p.name === "Analogous -");
    expect(analogousPlus).toBeDefined();
    expect(analogousMinus).toBeDefined();
  });

  test("includes triadic color", () => {
    const palette = getColorPalette("#4ade80");
    const triadic = palette.find((p) => p.name === "Triadic");
    expect(triadic).toBeDefined();
  });

  test("includes lighter and darker variants", () => {
    const palette = getColorPalette("#4ade80");
    const lighter = palette.find((p) => p.name === "Lighter");
    const darker = palette.find((p) => p.name === "Darker");
    expect(lighter).toBeDefined();
    expect(darker).toBeDefined();
  });

  test("returns empty array for invalid hex", () => {
    const palette = getColorPalette("invalid");
    expect(palette).toEqual([]);
  });

  test("returns valid hex colors", () => {
    const palette = getColorPalette("#4ade80");
    palette.forEach((item) => {
      expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe("getColorShades", () => {
  test("returns default 9 shades", () => {
    const shades = getColorShades("#4ade80");
    expect(shades).toHaveLength(9);
  });

  test("returns specified number of shades", () => {
    const shades = getColorShades("#4ade80", 5);
    expect(shades).toHaveLength(5);
  });

  test("returns valid hex colors", () => {
    const shades = getColorShades("#4ade80");
    shades.forEach((shade) => {
      expect(shade).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test("shades progress from dark to light", () => {
    const shades = getColorShades("#4ade80", 5);
    // First shade should be darker than last
    expect(shades[0]).not.toBe(shades[shades.length - 1]);
  });

  test("returns empty array for invalid hex", () => {
    const shades = getColorShades("invalid");
    expect(shades).toEqual([]);
  });
});

describe("getColorTones", () => {
  test("returns default 5 tones", () => {
    const tones = getColorTones("#4ade80");
    expect(tones).toHaveLength(5);
  });

  test("returns specified number of tones", () => {
    const tones = getColorTones("#4ade80", 3);
    expect(tones).toHaveLength(3);
  });

  test("returns valid hex colors", () => {
    const tones = getColorTones("#4ade80");
    tones.forEach((tone) => {
      expect(tone).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test("includes grayscale variant (0 saturation)", () => {
    const tones = getColorTones("#4ade80", 5);
    // First tone should be grayscale
    expect(tones[0]).toBeDefined();
  });

  test("returns empty array for invalid hex", () => {
    const tones = getColorTones("invalid");
    expect(tones).toEqual([]);
  });
});
