import { describe, test, expect } from "vitest";
import { 
  exportAsCSS, 
  exportAsTailwind, 
  exportAsReactComponent, 
  exportAsSVG,
  exportForFormat 
} from "../glow-export";
import { INITIAL_STATE } from "../glow-types";

describe("exportAsCSS", () => {
  test("exports basic glow CSS", () => {
    const css = exportAsCSS(INITIAL_STATE);
    expect(css).toContain(".glow-container");
    expect(css).toContain("position: relative");
    expect(css).toContain("width: 100%");
    expect(css).toContain("height: 100%");
  });

  test("includes active layers only", () => {
    const state = {
      ...INITIAL_STATE,
      layers: [
        { ...INITIAL_STATE.layers[0], active: true },
        { ...INITIAL_STATE.layers[1], active: false },
      ]
    };
    const css = exportAsCSS(state);
    expect(css).toContain(".glow-layer-1");
    expect(css).not.toContain(".glow-layer-2");
  });

  test("includes animation when enabled", () => {
    const state = {
      ...INITIAL_STATE,
      animation: { ...INITIAL_STATE.animation, enabled: true }
    };
    const css = exportAsCSS(state);
    expect(css).toContain("@keyframes breathe");
    expect(css).toContain("animation: breathe");
  });

  test("does not include animation when disabled", () => {
    const css = exportAsCSS(INITIAL_STATE);
    expect(css).not.toContain("@keyframes breathe");
  });

  test("includes noise overlay when enabled", () => {
    const state = {
      ...INITIAL_STATE,
      noiseEnabled: true,
      noiseIntensity: 0.5
    };
    const css = exportAsCSS(state);
    expect(css).toContain(".noise-overlay");
    expect(css).toContain("mix-blend-mode: overlay");
  });

  test("does not include noise overlay when disabled", () => {
    const state = {
      ...INITIAL_STATE,
      noiseEnabled: false
    };
    const css = exportAsCSS(state);
    expect(css).not.toContain(".noise-overlay");
  });

  test("includes global scale and opacity", () => {
    const css = exportAsCSS(INITIAL_STATE);
    expect(css).toContain(`transform: scale(${INITIAL_STATE.globalScale})`);
    expect(css).toContain(`opacity: ${INITIAL_STATE.globalOpacity}`);
  });

  test("includes layer properties", () => {
    const css = exportAsCSS(INITIAL_STATE);
    const firstLayer = INITIAL_STATE.layers[0];
    expect(css).toContain(`background-color: ${firstLayer.color}`);
    expect(css).toContain(`filter: blur(${firstLayer.blur}px)`);
    expect(css).toContain(`opacity: ${firstLayer.opacity}`);
    expect(css).toContain(`mix-blend-mode: ${firstLayer.blendMode}`);
  });

  test("handles empty layers", () => {
    const state = {
      ...INITIAL_STATE,
      layers: []
    };
    const css = exportAsCSS(state);
    expect(css).toContain(".glow-container");
  });
});

describe("exportAsTailwind", () => {
  test("exports Tailwind-compatible code", () => {
    const code = exportAsTailwind(INITIAL_STATE);
    expect(code).toContain("className=");
    expect(code).toContain("relative w-full h-full");
  });

  test("includes active layers", () => {
    const code = exportAsTailwind(INITIAL_STATE);
    INITIAL_STATE.layers.filter(l => l.active).forEach((layer) => {
      expect(code).toContain(layer.name);
    });
  });

  test("includes animation config comment when enabled", () => {
    const state = {
      ...INITIAL_STATE,
      animation: { ...INITIAL_STATE.animation, enabled: true }
    };
    const code = exportAsTailwind(state);
    expect(code).toContain("tailwind.config.ts");
    expect(code).toContain("keyframes");
  });

  test("includes inline styles for layer properties", () => {
    const code = exportAsTailwind(INITIAL_STATE);
    expect(code).toContain("style={{");
    expect(code).toContain("transform:");
    expect(code).toContain("backgroundColor:");
    expect(code).toContain("filter:");
  });
});

describe("exportAsReactComponent", () => {
  test("exports valid React component", () => {
    const code = exportAsReactComponent(INITIAL_STATE);
    expect(code).toContain("import React from \"react\"");
    expect(code).toContain("export function GlowEffect");
    expect(code).toContain("interface GlowEffectProps");
  });

  test("includes layer configurations", () => {
    const code = exportAsReactComponent(INITIAL_STATE);
    INITIAL_STATE.layers.filter(l => l.active).forEach((layer) => {
      expect(code).toContain(layer.color);
      expect(code).toContain(layer.name);
    });
  });

  test("component accepts props", () => {
    const code = exportAsReactComponent(INITIAL_STATE);
    expect(code).toContain("className = \"\"");
    expect(code).toContain("scale = ");
    expect(code).toContain("opacity = ");
  });

  test("uses layers.map for rendering", () => {
    const code = exportAsReactComponent(INITIAL_STATE);
    expect(code).toContain("layers.map((layer, i) =>");
    expect(code).toContain("key={i}");
  });
});

describe("exportAsSVG", () => {
  test("exports valid SVG markup", () => {
    const svg = exportAsSVG(INITIAL_STATE);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("xmlns=\"http://www.w3.org/2000/svg\"");
  });

  test("includes filters for blur effects", () => {
    const svg = exportAsSVG(INITIAL_STATE);
    INITIAL_STATE.layers.filter(l => l.active).forEach((_, i) => {
      expect(svg).toContain(`id="blur-${i}"`);
      expect(svg).toContain("feGaussianBlur");
    });
  });

  test("includes ellipse elements for layers", () => {
    const svg = exportAsSVG(INITIAL_STATE);
    expect(svg).toContain("<ellipse");
    expect(svg).toContain("rx=");
    expect(svg).toContain("ry=");
  });

  test("uses theme mode for background", () => {
    const darkSvg = exportAsSVG({ ...INITIAL_STATE, themeMode: "dark" });
    expect(darkSvg).toContain("#0d0d0d");
    
    const lightSvg = exportAsSVG({ ...INITIAL_STATE, themeMode: "light" });
    expect(lightSvg).toContain("#f5f5f5");
  });

  test("applies global scale", () => {
    const svg = exportAsSVG(INITIAL_STATE);
    expect(svg).toContain(`transform="scale(${INITIAL_STATE.globalScale})"`);
  });

  test("includes custom dimensions", () => {
    const svg = exportAsSVG(INITIAL_STATE, 1024, 768);
    expect(svg).toContain('width="1024"');
    expect(svg).toContain('height="768"');
    expect(svg).toContain('viewBox="0 0 1024 768"');
  });
});

describe("exportForFormat", () => {
  test("exports CSS format", () => {
    const css = exportForFormat(INITIAL_STATE, "css");
    expect(css).toContain(".glow-container");
  });

  test("exports Tailwind format", () => {
    const tw = exportForFormat(INITIAL_STATE, "tailwind");
    expect(tw).toContain("className=");
  });

  test("exports React format", () => {
    const react = exportForFormat(INITIAL_STATE, "react");
    expect(react).toContain("export function GlowEffect");
  });

  test("exports SVG format", () => {
    const svg = exportForFormat(INITIAL_STATE, "svg");
    expect(svg).toContain("<svg");
  });
});
