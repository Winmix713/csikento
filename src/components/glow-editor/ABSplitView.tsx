import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SplitSquareHorizontal, X, Lock, Unlock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlowState } from "@/lib/glow-types";

interface ABSplitViewProps {
  currentState: GlowState;
  onClose: () => void;
}

function GlowMiniPreview({ state, label, isDark }: { state: GlowState; label: string; isDark: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      <div
        className={cn(
          "w-full aspect-[4/3] rounded-xl border-2 overflow-hidden relative",
          isDark ? "bg-background border-border/40" : "bg-neutral-100 border-neutral-300/50"
        )}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${state.globalScale})`,
            opacity: state.power ? state.globalOpacity : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          {state.layers
            .filter((l) => l.active)
            .map((layer, i) => (
              <div
                key={layer.id}
                className="absolute top-1/2 left-1/2 rounded-full"
                style={{
                  transform: `translate(-50%, -50%) translate(${layer.x * 0.4}px, ${layer.y * 0.4}px)`,
                  width: layer.width * 0.4,
                  height: layer.height * 0.4,
                  backgroundColor: layer.color,
                  filter: `blur(${layer.blur * 0.4}px)`,
                  opacity: layer.opacity,
                  mixBlendMode: layer.blendMode as any,
                  zIndex: i,
                }}
              />
            ))}
        </div>
        {state.noiseEnabled && (
          <div
            className="absolute inset-0 pointer-events-none z-[100]"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.15'/></svg>")`,
              backgroundRepeat: "repeat",
              backgroundSize: "100px 100px",
              opacity: state.noiseIntensity,
              mixBlendMode: "overlay",
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ABSplitView({ currentState, onClose }: ABSplitViewProps) {
  const [snapshotState, setSnapshotState] = useState<GlowState>(currentState);
  const [locked, setLocked] = useState(true);
  const isDark = currentState.themeMode === "dark";

  const handleResnapshot = () => {
    setSnapshotState(currentState);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="glass-surface rounded-2xl p-4 space-y-3 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SplitSquareHorizontal className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground">A/B Compare</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleResnapshot}
            title="Re-snapshot current as A"
            className="p-1.5 rounded-lg text-editor-text-dim hover:text-foreground hover:bg-editor-surface-hover transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLocked(!locked)}
            title={locked ? "Snapshot locked" : "Snapshot unlocked"}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              locked ? "text-primary bg-primary/10" : "text-editor-text-dim hover:text-foreground hover:bg-editor-surface-hover"
            )}
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-editor-text-dim hover:text-foreground hover:bg-editor-surface-hover transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Split previews */}
      <div className="flex gap-3">
        <GlowMiniPreview state={snapshotState} label="Before" isDark={isDark} />
        <div className="w-px bg-border/60 self-stretch my-6" />
        <GlowMiniPreview state={currentState} label="After" isDark={isDark} />
      </div>

      <p className="text-[10px] text-editor-text-dim text-center font-medium">
        "Before" shows your snapshot · Edit controls to see changes in "After"
      </p>
    </motion.div>
  );
}

export function ABSplitToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "p-2 rounded-lg transition-all duration-150",
        isOpen
          ? "text-primary bg-primary/10"
          : "text-editor-text-dim hover:text-foreground hover:bg-editor-surface-hover"
      )}
      title="A/B Compare"
    >
      <SplitSquareHorizontal className="w-4 h-4" />
    </motion.button>
  );
}
