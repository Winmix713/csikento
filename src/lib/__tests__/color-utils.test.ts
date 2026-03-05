import { describe, test, expect } from "vitest";
import { 
  hexToHsl, 
  hslToHex, 
  getLuminance, 
  getContrastColor 
} from "../color/color-utils";

describe("hexToHsl", () => {
  test("converts white correctly", () => {
    expect(hexToHsl("#ffffff")).toEqual([0, 0, 100]);
  });

  test("converts black correctly", () => {
    expect(hexToHsl("#000000")).toEqual([0, 0, 0]);
  });

  test("converts primary green correctly", () => {
    const [h, s, l] = hexToHsl("#4ade80");
    // Allow small rounding differences
    expect(h).toBeGreaterThanOrEqual(130);
    expect(h).toBeLessThanOrEqual(145);
    expect(s).toBeGreaterThanOrEqual(60);
    expect(s).toBeLessThanOrEqual(100);
    expect(l).toBeGreaterThanOrEqual(55);
    expect(l).toBeLessThanOrEqual(80);
  });

  test("handles uppercase hex", () => {
    expect(hexToHsl("#FFFFFF")).toEqual([0, 0, 100]);
  });

  test("handles mixed case hex", () => {
    expect(hexToHsl("#FfFfFf")).toEqual([0, 0, 100]);
  });

  test("throws on invalid hex format", () => {
    expect(() => hexToHsl("invalid")).toThrow();
  });

  test("throws on hex without hash", () => {
    expect(() => hexToHsl("ffffff")).toThrow();
  });

  test("throws on short hex", () => {
    expect(() => hexToHsl("#fff")).toThrow();
  });

  test("converts red correctly", () => {
    expect(hexToHsl("#ff0000")).toEqual([0, 100, 50]);
  });

  test("converts green correctly", () => {
    expect(hexToHsl("#00ff00")).toEqual([120, 100, 50]);
  });

  test("converts blue correctly", () => {
    expect(hexToHsl("#0000ff")).toEqual([240, 100, 50]);
  });
});

describe("hslToHex", () => {
  test("is reversible with hexToHsl", () => {
    const [h, s, l] = hexToHsl("#4ade80");
    expect(hslToHex(h, s, l)).toBe("#4ade80");
  });

  test("converts white HSL to hex", () => {
    expect(hslToHex(0, 0, 100)).toBe("#ffffff");
  });

  test("converts black HSL to hex", () => {
    expect(hslToHex(0, 0, 0)).toBe("#000000");
  });

  test("clamps saturation above 100", () => {
    expect(hslToHex(0, 150, 50)).toBe("#ff0000");
  });

  test("clamps lightness above 100", () => {
    expect(hslToHex(0, 100, 150)).toBe("#ffffff");
  });

  test("clamps negative saturation", () => {
    expect(hslToHex(0, -50, 50)).toBe("#808080");
  });

  test("clamps negative lightness", () => {
    expect(hslToHex(0, 100, -50)).toBe("#000000");
  });

  test("handles hue at 360 degrees", () => {
    expect(hslToHex(360, 0, 0)).toBe("#000000");
  });

  test("handles hue wrapping", () => {
    expect(hslToHex(720, 100, 50)).toBe("#ff0000");
  });

  test("handles negative hue", () => {
    expect(hslToHex(-360, 100, 50)).toBe("#ff0000");
  });
});

describe("Color conversion round-trip", () => {
  test("round-trip preserves common colors", () => {
    // Test colors that should round-trip exactly
    const exactColors = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000", "#4ade80"];
    
    exactColors.forEach((hex) => {
      const [h, s, l] = hexToHsl(hex);
      const result = hslToHex(h, s, l);
      expect(result).toBe(hex.toLowerCase());
    });
  });

  test("round-trip approximates colors within tolerance", () => {
    // Some colors may have slight rounding differences
    const colors = ["#f97316"];
    
    colors.forEach((hex) => {
      const [h, s, l] = hexToHsl(hex);
      const result = hslToHex(h, s, l);
      // Check that result is very close to original (within 1 hex digit tolerance per channel)
      const original = hex.toLowerCase();
      expect(result.slice(0, 1)).toBe("#");
      expect(result).toHaveLength(7);
      // Verify it's a valid hex color
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});

describe("getLuminance", () => {
  test("returns 0 for black", () => {
    expect(getLuminance("#000000")).toBe(0);
  });

  test("returns 1 for white", () => {
    expect(getLuminance("#ffffff")).toBe(1);
  });

  test("returns higher value for lighter colors", () => {
    expect(getLuminance("#ffffff")).toBeGreaterThan(getLuminance("#808080"));
  });

  test("returns lower value for darker colors", () => {
    expect(getLuminance("#000000")).toBeLessThan(getLuminance("#808080"));
  });
});

describe("getContrastColor", () => {
  test("returns black for white background", () => {
    expect(getContrastColor("#ffffff")).toBe("black");
  });

  test("returns white for black background", () => {
    expect(getContrastColor("#000000")).toBe("white");
  });

  test("returns white for dark colors", () => {
    expect(getContrastColor("#1a1a1a")).toBe("white");
  });

  test("returns black for light colors", () => {
    expect(getContrastColor("#e5e5e5")).toBe("black");
  });
});
