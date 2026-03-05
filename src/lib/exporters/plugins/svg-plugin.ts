import { exportAsSVG } from "../../glow-export";
import type { GlowState } from "../../glow-types";
import type { ExportPlugin } from "../export-plugin";

/**
 * SVG Export Plugin
 * Exports glow state as SVG for use in design tools
 */
export const svgPlugin: ExportPlugin = {
  id: "svg",
  name: "SVG",
  description: "SVG format for design tools",
  icon: "Image",
  
  export: exportAsSVG,
  extension: ".svg",
  mimeType: "image/svg+xml",
  
  validate: (state) => {
    return state.layers.some((l) => l.active);
  },
};

export default svgPlugin;
