import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { GlowState } from "@/lib/glow-types";
import type { ExportFormat } from "@/lib/glow-export";
import type { ExportWorkerResponse } from "@/workers/export.worker";

export interface ExportState {
  isLoading: boolean;
  code: string | null;
  error: string | null;
}

export interface UseExportWorkerReturn {
  /** Current export state */
  exportState: ExportState;
  
  /** Trigger an export operation */
  export: (state: GlowState, format: ExportFormat) => void;
  
  /** Copy exported code to clipboard */
  copyCode: () => Promise<boolean>;
  
  /** Clear current export state */
  clear: () => void;
}

/**
 * Hook for running exports in a Web Worker
 * Prevents UI blocking during large export operations
 */
export function useExportWorker(): UseExportWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [exportState, setExportState] = useState<ExportState>({
    isLoading: false,
    code: null,
    error: null,
  });

  // Initialize worker
  useEffect(() => {
    // Create worker using Vite's worker import
    const worker = new Worker(
      new URL("../workers/export.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent<ExportWorkerResponse>) => {
      const { id, code, error } = e.data;
      
      if (error) {
        setExportState({
          isLoading: false,
          code: null,
          error,
        });
        toast.error(`Export failed: ${error}`);
      } else {
        setExportState({
          isLoading: false,
          code,
          error: null,
        });
        toast.success("Export completed!");
      }
    };

    worker.onerror = (error) => {
      setExportState({
        isLoading: false,
        code: null,
        error: error.message,
      });
      toast.error(`Worker error: ${error.message}`);
    };

    workerRef.current = worker;

    // Cleanup on unmount
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Trigger an export operation
   */
  const exportFn = useCallback((state: GlowState, format: ExportFormat) => {
    if (!workerRef.current) {
      toast.error("Export worker not available");
      return;
    }

    setExportState({
      isLoading: true,
      code: null,
      error: null,
    });

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    workerRef.current.postMessage({
      type: "export",
      state,
      format,
      id,
    });
  }, []);

  /**
   * Copy exported code to clipboard
   */
  const copyCode = useCallback(async (): Promise<boolean> => {
    if (!exportState.code) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(exportState.code);
      toast.success("Copied to clipboard!");
      return true;
    } catch {
      toast.error("Failed to copy to clipboard");
      return false;
    }
  }, [exportState.code]);

  /**
   * Clear export state
   */
  const clear = useCallback(() => {
    setExportState({
      isLoading: false,
      code: null,
      error: null,
    });
  }, []);

  return {
    exportState,
    export: exportFn,
    copyCode,
    clear,
  };
}
