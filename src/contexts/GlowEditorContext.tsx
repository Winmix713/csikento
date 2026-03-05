import { 
  createContext, 
  useContext, 
  useCallback, 
  useMemo, 
  useState,
  ReactNode 
} from "react";
import type { GlowState, GlowLayer, Preset } from "@/lib/glow-types";
import { INITIAL_STATE } from "@/lib/glow-types";
import { useHistory, usePresets } from "@/hooks/use-glow-editor";
import { debounce } from "@/lib/glow-types";

// ========================================================================================
// GLOW EDITOR CONTEXT
// ========================================================================================

export interface GlowEditorContextValue {
  // State
  state: GlowState;
  selectedLayer: GlowLayer | undefined;
  
  // Actions
  updateState: (updates: Partial<GlowState>) => void;
  updateSelectedLayer: (updates: Partial<GlowLayer>) => void;
  resetState: () => void;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  
  // Presets
  presets: Preset[];
  savePreset: (name: string) => void;
  deletePreset: (id: string) => void;
  toggleFavorite: (id: string) => void;
  loadPreset: (id: string) => void;
  exportPresets: () => void;
  importPresets: (file: File) => void;
  
  // Layer Management
  addLayer: () => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  selectLayer: (id: string) => void;
  updateLayers: (layers: GlowLayer[]) => void;
}

const GlowEditorContext = createContext<GlowEditorContextValue | null>(null);

export interface GlowEditorProviderProps {
  children: ReactNode;
  initialState?: GlowState;
}

/**
 * GlowEditor Provider Component
 * Provides centralized state management for the Glow Editor
 * Eliminates prop drilling and provides optimized context updates
 */
export function GlowEditorProvider({ 
  children, 
  initialState = INITIAL_STATE 
}: GlowEditorProviderProps) {
  const [state, setState] = useState<GlowState>(initialState);
  const history = useHistory(state);
  const presetManager = usePresets(INITIAL_STATE);

  // Debounced history push to avoid excessive history entries
  const debouncedPushState = useMemo(
    () => debounce((newState: GlowState) => {
      history.pushState(newState);
    }, 300),
    [history]
  );

  /**
   * Update global state with partial updates
   */
  const updateState = useCallback((updates: Partial<GlowState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      debouncedPushState(newState);
      return newState;
    });
  }, [debouncedPushState]);

  /**
   * Update the currently selected layer
   */
  const updateSelectedLayer = useCallback((updates: Partial<GlowLayer>) => {
    setState(prev => {
      if (!prev.selectedLayerId) return prev;
      
      const newLayers = prev.layers.map(layer =>
        layer.id === prev.selectedLayerId ? { ...layer, ...updates } : layer
      );
      
      const newState = { ...prev, layers: newLayers };
      debouncedPushState(newState);
      return newState;
    });
  }, [debouncedPushState]);

  /**
   * Reset to initial state
   */
  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
    history.pushState(INITIAL_STATE);
  }, [history]);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    const prevState = history.undo();
    if (prevState) {
      setState(prevState);
    }
  }, [history]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    const nextState = history.redo();
    if (nextState) {
      setState(nextState);
    }
  }, [history]);

  /**
   * Add a new layer
   */
  const addLayer = useCallback(() => {
    const newLayer: GlowLayer = {
      id: `layer-${Date.now()}`,
      name: "New Layer",
      active: true,
      color: "#ffffff",
      blur: 50,
      opacity: 0.5,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      blendMode: "screen",
    };
    
    updateState({
      layers: [...state.layers, newLayer],
      selectedLayerId: newLayer.id,
    });
  }, [state.layers, updateState]);

  /**
   * Remove a layer
   */
  const removeLayer = useCallback((id: string) => {
    if (state.layers.length <= 1) return;
    
    const newLayers = state.layers.filter(l => l.id !== id);
    updateState({
      layers: newLayers,
      selectedLayerId: newLayers[0]?.id || null,
    });
  }, [state.layers, updateState]);

  /**
   * Duplicate a layer
   */
  const duplicateLayer = useCallback((id: string) => {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    
    const duplicate: GlowLayer = {
      ...layer,
      id: `layer-${Date.now()}`,
      name: `${layer.name} (copy)`,
      x: layer.x + 20,
      y: layer.y + 20,
    };
    
    updateState({
      layers: [...state.layers, duplicate],
      selectedLayerId: duplicate.id,
    });
  }, [state.layers, updateState]);

  /**
   * Select a layer
   */
  const selectLayer = useCallback((id: string) => {
    updateState({ selectedLayerId: id });
  }, [updateState]);

  /**
   * Update all layers
   */
  const updateLayers = useCallback((layers: GlowLayer[]) => {
    updateState({ layers });
  }, [updateState]);

  /**
   * Save current state as a preset
   */
  const savePreset = useCallback((name: string) => {
    presetManager.savePreset(name, state);
  }, [presetManager, state]);

  /**
   * Load a preset by ID
   */
  const loadPreset = useCallback((id: string) => {
    const presetState = presetManager.loadPreset(id);
    if (presetState) {
      setState(presetState);
      history.pushState(presetState);
    }
  }, [presetManager, history]);

  // Memoize selected layer for performance
  const selectedLayer = useMemo(() => 
    state.layers.find(l => l.id === state.selectedLayerId),
    [state.layers, state.selectedLayerId]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<GlowEditorContextValue>(() => ({
    // State
    state,
    selectedLayer,
    
    // Actions
    updateState,
    updateSelectedLayer,
    resetState,
    
    // History
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo,
    redo,
    
    // Presets
    presets: presetManager.presets,
    savePreset,
    deletePreset: presetManager.deletePreset,
    toggleFavorite: presetManager.toggleFavorite,
    loadPreset,
    exportPresets: presetManager.exportPresets,
    importPresets: presetManager.importPresets,
    
    // Layer Management
    addLayer,
    removeLayer,
    duplicateLayer,
    selectLayer,
    updateLayers,
  }), [
    state,
    selectedLayer,
    updateState,
    updateSelectedLayer,
    resetState,
    history.canUndo,
    history.canRedo,
    undo,
    redo,
    presetManager.presets,
    presetManager.deletePreset,
    presetManager.toggleFavorite,
    presetManager.exportPresets,
    presetManager.importPresets,
    savePreset,
    loadPreset,
    addLayer,
    removeLayer,
    duplicateLayer,
    selectLayer,
    updateLayers,
  ]);

  return (
    <GlowEditorContext.Provider value={value}>
      {children}
    </GlowEditorContext.Provider>
  );
}

/**
 * Hook to access the Glow Editor context
 * Must be used within a GlowEditorProvider
 */
export function useGlowEditor(): GlowEditorContextValue {
  const context = useContext(GlowEditorContext);
  if (!context) {
    throw new Error("useGlowEditor must be used within GlowEditorProvider");
  }
  return context;
}
