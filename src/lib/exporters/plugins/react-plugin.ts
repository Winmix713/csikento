import { exportAsReactComponent } from "../../glow-export";
import type { GlowState } from "../../glow-types";
import type { ExportPlugin } from "../export-plugin";

/**
 * React Component Export Plugin
 * Exports glow state as a reusable React component
 */
export const reactPlugin: ExportPlugin = {
  id: "react",
  name: "React Component",
  description: "Reusable React component with TypeScript",
  icon: "FileCode2",
  
  export: exportAsReactComponent,
  extension: ".tsx",
  mimeType: "text/typescript",
  
  validate: (state) => {
    return state.layers.some((l) => l.active);
  },
};

export default reactPlugin;
