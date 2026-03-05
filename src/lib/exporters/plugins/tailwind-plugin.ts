import { exportAsTailwind } from "../../glow-export";
import type { GlowState } from "../../glow-types";
import type { ExportPlugin } from "../export-plugin";

/**
 * Tailwind CSS Export Plugin
 * Exports glow state as Tailwind utility classes
 */
export const tailwindPlugin: ExportPlugin = {
  id: "tailwind",
  name: "Tailwind CSS",
  description: "Tailwind utility classes with inline styles",
  icon: "Code",
  
  export: exportAsTailwind,
  extension: ".tsx",
  mimeType: "text/typescript",
  
  validate: (state) => {
    return state.layers.some((l) => l.active);
  },
};

export default tailwindPlugin;
