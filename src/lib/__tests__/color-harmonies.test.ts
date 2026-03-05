import { describe, test, expect } from "vitest";
import { 
  getColorHarmonies, 
  getMonochromaticColors, 
  getTetradicColors,
  getSquareColors 
} from "../color/color-harmonies";

describe("getColorHarmonies", () => {
  test("returns 4 harmony types", () => {
    const harmonies = getColorHarmonies("#4ade80");
    expect(harmonies).toHaveLength(4);
  });

  test("includes complementary harmony", () => {
    const harmonies = getColorHarmonies("#4ade80");
    const complementary = harmonies.find((h) => h.name === "Complementary");
    expect(complementary).toBeDefined();
    expect(complementary?.colors).toHaveLength(2);
  });

  test("includes analogous harmony", () => {
    const harmonies = getColorHarmonies("#4ade80");
    const analogous = harmonies.find((h) => h.name === "Analogous");
    expect(analogous).toBeDefined();
    expect(analogous?.colors).toHaveLength(3);
  });

  test("includes triadic harmony", () => {
    const harmonies = getColorHarmonies("#4ade80");
    const triadic = harmonies.find((h) => h.name === "Triadic");
    expect(triadic).toBeDefined();
    expect(triadic?.colors).toHaveLength(3);
  });

  test("includes split complementary harmony", () => {
    const harmonies = getColorHarmonies("#4ade80");
    const splitComp = harmonies.find((h) => h.name === "Split Comp.");
    expect(splitComp).toBeDefined();
    expect(splitComp?.colors).toHaveLength(3);
  });

  test("returns valid hex colors", () => {
    const harmonies = getColorHarmonies("#4ade80");
    harmonies.forEach((harmony) => {
      harmony.colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  test("handles invalid hex gracefully", () => {
    const harmonies = getColorHarmonies("invalid");
    expect(harmonies).toHaveLength(4);
    harmonies.forEach((h) => {
      expect(h.colors).toEqual(["invalid"]);
    });
  });
});

describe("getMonochromaticColors", () => {
  test("returns default 5 colors", () => {
    const colors = getMonochromaticColors("#4ade80");
    expect(colors).toHaveLength(5);
  });

  test("returns specified number of colors", () => {
    const colors = getMonochromaticColors("#4ade80", 7);
    expect(colors).toHaveLength(7);
  });

  test("returns valid hex colors", () => {
    const colors = getMonochromaticColors("#4ade80");
    colors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test("all colors have same hue", () => {
    const colors = getMonochromaticColors("#ff0000", 3);
    // All should be shades of red (or grayscale if lightness is extreme)
    colors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test("returns single color for invalid hex", () => {
    const colors = getMonochromaticColors("invalid");
    expect(colors).toEqual(["invalid"]);
  });
});

describe("getTetradicColors", () => {
  test("returns 4 colors", () => {
    const colors = getTetradicColors("#4ade80");
    expect(colors).toHaveLength(4);
  });

  test("returns valid hex colors", () => {
    const colors = getTetradicColors("#4ade80");
    colors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test("first color is the original", () => {
    const original = "#4ade80";
    const colors = getTetradicColors(original);
    expect(colors[0]).toBe(original);
  });

  test("returns single color for invalid hex", () => {
    const colors = getTetradicColors("invalid");
    expect(colors).toEqual(["invalid"]);
  });
});

describe("getSquareColors", () => {
  test("returns 4 colors", () => {
    const colors = getSquareColors("#4ade80");
    expect(colors).toHaveLength(4);
  });

  test("returns valid hex colors", () => {
    const colors = getSquareColors("#4ade80");
    colors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test("first color is the original", () => {
    const original = "#4ade80";
    const colors = getSquareColors(original);
    expect(colors[0]).toBe(original);
  });

  test("colors are 90 degrees apart in hue", () => {
    // Square colors are at 0, 90, 180, 270 degrees
    const colors = getSquareColors("#ff0000");
    expect(colors).toHaveLength(4);
  });

  test("returns single color for invalid hex", () => {
    const colors = getSquareColors("invalid");
    expect(colors).toEqual(["invalid"]);
  });
});
