import type { GlowState } from "../glow-types";
import type { 
  ExportPlugin, 
  ExportPluginRegistry 
} from "./export-plugin";
import { 
  PluginNotFoundError, 
  PluginValidationError, 
  DuplicatePluginError 
} from "./export-plugin";

// ========================================================================================
// EXPORT PLUGIN MANAGER
// ========================================================================================

class ExportPluginManager implements ExportPluginRegistry {
  private plugins = new Map<string, ExportPlugin>();

  register(plugin: ExportPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new DuplicatePluginError(plugin.id);
    }
    this.plugins.set(plugin.id, plugin);
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  get(pluginId: string): ExportPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAll(): ExportPlugin[] {
    return Array.from(this.plugins.values());
  }

  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  export(state: GlowState, pluginId: string): string {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new PluginNotFoundError(pluginId);
    }

    if (plugin.validate && !plugin.validate(state)) {
      throw new PluginValidationError(pluginId);
    }

    return plugin.export(state);
  }
}

// Singleton instance for the application
export const exportRegistry = new ExportPluginManager();

// ========================================================================================
// UTILITY FUNCTIONS
// ========================================================================================

/**
 * Register multiple plugins at once
 */
export function registerPlugins(...plugins: ExportPlugin[]): void {
  plugins.forEach((plugin) => exportRegistry.register(plugin));
}

/**
 * Create a downloadable file from exported content
 */
export function downloadExport(
  content: string, 
  filename: string, 
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy export content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}
