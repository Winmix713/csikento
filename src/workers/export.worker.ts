import { exportAsCSS, exportAsTailwind, exportAsReactComponent, exportAsSVG } from "../lib/glow-export";
import type { GlowState } from "../lib/glow-types";
import type { ExportFormat } from "../lib/glow-export";

// ========================================================================================
// EXPORT WEB WORKER
// ========================================================================================
// This worker runs export operations off the main thread to prevent UI blocking

export interface ExportWorkerMessage {
  type: "export";
  state: GlowState;
  format: ExportFormat;
  id: string;
}

export interface ExportWorkerResponse {
  id: string;
  code: string;
  format: ExportFormat;
  error?: string;
}

/**
 * Format to export function mapping
 */
const exportFunctions: Record<ExportFormat, (state: GlowState) => string> = {
  css: exportAsCSS,
  tailwind: exportAsTailwind,
  react: exportAsReactComponent,
  svg: exportAsSVG,
};

/**
 * Handle export messages from the main thread
 */
self.onmessage = (e: MessageEvent<ExportWorkerMessage>) => {
  const { type, state, format, id } = e.data;

  if (type !== "export") {
    const response: ExportWorkerResponse = {
      id,
      code: "",
      format,
      error: `Unknown message type: ${type}`,
    };
    self.postMessage(response);
    return;
  }

  try {
    const exportFn = exportFunctions[format];
    
    if (!exportFn) {
      throw new Error(`Unknown format: ${format}`);
    }

    const code = exportFn(state);
    
    const response: ExportWorkerResponse = {
      id,
      code,
      format,
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: ExportWorkerResponse = {
      id,
      code: "",
      format,
      error: error instanceof Error ? error.message : "Unknown error during export",
    };
    self.postMessage(response);
  }
};

// Export for TypeScript module detection
export {};
