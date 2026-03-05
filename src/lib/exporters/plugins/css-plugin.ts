import { exportAsCSS } from "../../glow-export";
import type { GlowState } from "../../glow-types";
import type { ExportPlugin } from "../export-plugin";

/**
 * CSS Export Plugin
 * Exports glow state as raw CSS with box-shadow and filter effects
 */
export const cssPlugin: ExportPlugin = {
  id: "css",
  name: "CSS",
  description: "Raw CSS with box-shadow filters",
  icon: "FileText",
  
  export: exportAsCSS,
  extension: ".css",
  mimeType: "text/css",
  
  validate: (state) => {
    // Require at least one active layer
    return state.layers.some((l) => l.active);
  },
};

export default cssPlugin;
