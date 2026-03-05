import type { GlowState } from "../glow-types";

// ========================================================================================
// EXPORT PLUGIN SYSTEM
// ========================================================================================

/**
 * Interface for export plugins
 * Each plugin defines how to export glow state to a specific format
 */
export interface ExportPlugin {
  /** Unique plugin identifier */
  id: string;
  
  /** Display name for the plugin */
  name: string;
  
  /** Description of the export format */
  description: string;
  
  /** Icon identifier or component */
  icon: string;
  
  /** Main export function - converts GlowState to output string */
  export(state: GlowState): string;
  
  /** File extension (e.g., '.css', '.tsx') */
  extension: string;
  
  /** MIME type for file downloads */
  mimeType: string;
  
  /** Optional: validation function to check if state can be exported */
  validate?(state: GlowState): boolean;
  
  /** Optional: format-specific options */
  options?: Record<string, unknown>;
}

/**
 * Export plugin registry interface
 * Manages registered plugins and provides export functionality
 */
export interface ExportPluginRegistry {
  /** Register a new plugin */
  register(plugin: ExportPlugin): void;
  
  /** Unregister a plugin by ID */
  unregister(pluginId: string): void;
  
  /** Get a plugin by ID */
  get(pluginId: string): ExportPlugin | undefined;
  
  /** Get all registered plugins */
  getAll(): ExportPlugin[];
  
  /** Export state using a specific plugin */
  export(state: GlowState, pluginId: string): string;
  
  /** Check if a plugin is registered */
  has(pluginId: string): boolean;
}

/**
 * Error thrown when a plugin is not found
 */
export class PluginNotFoundError extends Error {
  constructor(pluginId: string) {
    super(`Plugin "${pluginId}" not found in registry`);
    this.name = "PluginNotFoundError";
  }
}

/**
 * Error thrown when plugin validation fails
 */
export class PluginValidationError extends Error {
  constructor(pluginId: string) {
    super(`Plugin "${pluginId}" validation failed`);
    this.name = "PluginValidationError";
  }
}

/**
 * Error thrown when trying to register a duplicate plugin
 */
export class DuplicatePluginError extends Error {
  constructor(pluginId: string) {
    super(`Plugin "${pluginId}" is already registered`);
    this.name = "DuplicatePluginError";
  }
}
