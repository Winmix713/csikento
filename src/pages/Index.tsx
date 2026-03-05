import { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { GlowPreview } from "@/components/glow-editor/GlowPreview";
import { LeftSidebar } from "@/components/glow-editor/LeftSidebar";
import { RightSidebar, ExportModal } from "@/components/glow-editor/RightSidebar";
import { ABSplitView, ABSplitToggle } from "@/components/glow-editor/ABSplitView";
import { useHistory, usePresets } from "@/hooks/use-glow-editor";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { exportAsCSS, debounce, INITIAL_STATE } from "@/lib/glow-types";
import type { GlowState } from "@/lib/glow-types";

export default function Index() {
  const { state: currentState, setState: setCurrentState } = usePersistedState();
  const [cssOverride, setCssOverride] = useState<string | null>(null);
  const [showABSplit, setShowABSplit] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const history = useHistory(currentState);
  const presetManager = usePresets(INITIAL_STATE);

  const debouncedHistoryPush = useMemo(
    () => debounce((state: GlowState) => { history.pushState(state); }, 500),
    [history]
  );

  const handleStateChange = useCallback(
    (newState: GlowState) => {
      setCurrentState(newState);
      debouncedHistoryPush(newState);
    },
    [setCurrentState, debouncedHistoryPush]
  );

  const handleUndo = useCallback(() => {
    const prevState = history.undo();
    if (prevState) { setCurrentState(prevState); setCssOverride(null); }
  }, [history, setCurrentState]);

  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    if (nextState) { setCurrentState(nextState); setCssOverride(null); }
  }, [history, setCurrentState]);

  const handleSavePreset = useCallback(
    (name: string) => { presetManager.savePreset(name, currentState); },
    [currentState, presetManager]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const activeCss = cssOverride ?? exportAsCSS(currentState);

  return (
    <div className="h-screen editor-bg text-foreground font-sans selection:bg-primary/30 overflow-hidden flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: activeCss }} />

      {/* 3-column workspace */}
      <div className="flex-1 flex gap-2 p-2 min-h-0">
        {/* Left Sidebar */}
        <LeftSidebar
          state={currentState}
          onStateChange={handleStateChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onSavePreset={handleSavePreset}
          presetManager={presetManager}
          onOpenExport={() => setShowExportModal(true)}
        />

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 gap-2 p-1">
          {/* A/B Split */}
          <AnimatePresence>
            {showABSplit && (
              <div className="w-full max-w-[960px] mx-auto mb-2">
                <ABSplitView currentState={currentState} onClose={() => setShowABSplit(false)} />
              </div>
            )}
          </AnimatePresence>

          {/* Preview Canvas */}
          <div className="flex-1 min-h-0 relative bg-black/10 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-inner">
            <GlowPreview
              state={currentState}
              setPower={(v) => handleStateChange({ ...currentState, power: v })}
              onStateChange={handleStateChange}
              onLayerSelect={(id) => handleStateChange({ ...currentState, selectedLayerId: id })}
              cssOverride={cssOverride}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          state={currentState}
          onStateChange={handleStateChange}
          cssOverride={cssOverride}
          setCssOverride={setCssOverride}
        />
      </div>

      {/* Export Modal */}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} state={currentState} cssOverride={cssOverride} />
    </div>
  );
}
