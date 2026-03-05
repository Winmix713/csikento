import type { GlowState } from "./glow-types";
import { exportAsCSS } from "./glow-types";

export type ExportFormat = "css" | "tailwind" | "react" | "svg";

export function exportAsTailwind(state: GlowState): string {
  const layers = state.layers
    .filter((l) => l.active)
    .map(
      (layer, i) =>
        `{/* ${layer.name} */}
<div
  className="absolute top-1/2 left-1/2 rounded-full"
  style={{
    transform: 'translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px)',
    width: '${layer.width}px',
    height: '${layer.height}px',
    backgroundColor: '${layer.color}',
    filter: 'blur(${layer.blur}px)',
    opacity: ${layer.opacity},
    mixBlendMode: '${layer.blendMode}',
    zIndex: ${i},
  }}
/>`
    )
    .join("\n");

  const animation = state.animation.enabled
    ? `\n{/* Add to tailwind.config.ts:
  keyframes: {
    breathe: {
      '0%, 100%': { opacity: '${state.globalOpacity}', transform: 'scale(${state.globalScale})' },
      '50%': { opacity: '${state.globalOpacity * 0.8}', transform: 'scale(${state.globalScale * 1.05})' },
    }
  },
  animation: {
    breathe: 'breathe ${state.animation.duration}s ease-in-out infinite',
  }
*/}`
    : "";

  return `{/* Glow Effect - Tailwind + Inline Styles */}
<div className="relative w-full h-full overflow-hidden">
  <div
    className="absolute inset-0${state.animation.enabled ? " animate-breathe" : ""}"
    style={{
      transform: 'scale(${state.globalScale})',
      opacity: ${state.globalOpacity},
    }}
  >
${layers}
  </div>
</div>${animation}`;
}

export function exportAsReactComponent(state: GlowState): string {
  const layerConfigs = state.layers
    .filter((l) => l.active)
    .map(
      (l) =>
        `    { name: "${l.name}", color: "${l.color}", blur: ${l.blur}, opacity: ${l.opacity}, width: ${l.width}, height: ${l.height}, x: ${l.x}, y: ${l.y}, blendMode: "${l.blendMode}" as const },`
    )
    .join("\n");

  return `import React from "react";

interface GlowEffectProps {
  className?: string;
  scale?: number;
  opacity?: number;
}

const layers = [
${layerConfigs}
];

export function GlowEffect({ className = "", scale = ${state.globalScale}, opacity = ${state.globalOpacity} }: GlowEffectProps) {
  return (
    <div className={\`relative w-full h-full overflow-hidden \${className}\`}>
      <div
        className="absolute inset-0"
        style={{
          transform: \`scale(\${scale})\`,
          opacity,${state.animation.enabled ? `\n          animation: "breathe ${state.animation.duration}s ease-in-out infinite",` : ""}
        }}
      >
        {layers.map((layer, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-full"
            style={{
              transform: \`translate(-50%, -50%) translate(\${layer.x}px, \${layer.y}px)\`,
              width: layer.width,
              height: layer.height,
              backgroundColor: layer.color,
              filter: \`blur(\${layer.blur}px)\`,
              opacity: layer.opacity,
              mixBlendMode: layer.blendMode,
              zIndex: i,
            }}
          />
        ))}
      </div>
    </div>
  );
}`;
}

export function exportAsSVG(state: GlowState, width = 800, height = 600): string {
  const activeLayers = state.layers.filter((l) => l.active);
  const filters = activeLayers.map((l, i) =>
    `  <filter id="blur-${i}"><feGaussianBlur stdDeviation="${l.blur / 2}" /></filter>`
  ).join("\n");

  const circles = activeLayers.map((l, i) => {
    const cx = width / 2 + l.x;
    const cy = height / 2 + l.y;
    return `  <ellipse cx="${cx}" cy="${cy}" rx="${l.width / 2}" ry="${l.height / 2}" fill="${l.color}" opacity="${l.opacity}" filter="url(#blur-${i})" style="mix-blend-mode:${l.blendMode}" />`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
${filters}
  </defs>
  <rect width="${width}" height="${height}" fill="${state.themeMode === 'dark' ? '#0d0d0d' : '#f5f5f5'}" />
  <g transform="scale(${state.globalScale})" opacity="${state.globalOpacity}">
${circles}
  </g>
</svg>`;
}

export function exportForFormat(state: GlowState, format: ExportFormat): string {
  switch (format) {
    case "css":
      return exportAsCSS(state);
    case "tailwind":
      return exportAsTailwind(state);
    case "react":
      return exportAsReactComponent(state);
    case "svg":
      return exportAsSVG(state);
  }
}
