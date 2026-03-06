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
    ${state.animation.type}: {
      ${state.animation.type === 'breathe' ? `'0%, 100%': { opacity: '1', transform: 'scale(1)' },
      '50%': { opacity: '0.8', transform: 'scale(1.05)' },` :
      state.animation.type === 'pulse' ? `'0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },` :
      state.animation.type === 'orbit' ? `'from': { transform: 'rotate(0deg) translateX(20px) rotate(0deg)' },
      'to': { transform: 'rotate(360deg) translateX(20px) rotate(-360deg)' },` :
      state.animation.type === 'float' ? `'0%, 100%': { transform: 'translate(0, 0)' },
      '33%': { transform: 'translate(20px, -20px)' },
      '66%': { transform: 'translate(-20px, 20px)' },` :
      state.animation.type === 'waver' ? `'0%, 100%': { transform: 'translate(0, 0) skew(0deg)' },
      '25%': { transform: 'translate(10px, 0) skew(2deg)' },
      '75%': { transform: 'translate(-10px, 0) skew(-2deg)' },` :
      state.animation.type === 'glitch' ? `'0%, 100%': { transform: 'translate(0, 0)', opacity: '1' },
      '10%': { transform: 'translate(5px, -5px)', opacity: '0.8' },
      '20%': { transform: 'translate(-5px, 2px)', opacity: '0.9' },
      '50%': { transform: 'translate(-2px, -2px)', opacity: '1' },` : ''}
    }
  },
  animation: {
    ${state.animation.type}: '${state.animation.type} ${state.animation.duration}s ${state.animation.type === 'orbit' ? 'linear' : 'ease-in-out'} infinite',
  }
*/}`
    : "";

  return `{/* Glow Effect - Tailwind + Inline Styles */}
<div className="relative w-full h-full overflow-hidden">
  <div
    className="absolute inset-0${state.animation.enabled ? ` animate-${state.animation.type}` : ""}"
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

  const animationName = state.animation.enabled ? state.animation.type : "";
  const animationDuration = state.animation.duration;

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
      <style>{\`
        @keyframes breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(20px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -20px); }
          66% { transform: translate(-20px, 20px); }
        }
        @keyframes waver {
          0%, 100% { transform: translate(0, 0) skew(0deg); }
          25% { transform: translate(10px, 0) skew(2deg); }
          75% { transform: translate(-10px, 0) skew(-2deg); }
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          10% { transform: translate(5px, -5px); opacity: 0.8; }
          20% { transform: translate(-5px, 2px); opacity: 0.9; }
          50% { transform: translate(-2px, -2px); opacity: 1; }
        }
      \`}</style>
      <div
        className="absolute inset-0"
        style={{
          transform: \`scale(\${scale})\`,
          opacity,${state.animation.enabled ? `\n          animation: "${animationName} ${animationDuration}s ${animationName === 'orbit' ? 'linear' : 'ease-in-out'} infinite",` : ""}
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
