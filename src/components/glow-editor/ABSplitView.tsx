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
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="glass-surface rounded-[2rem] p-6 space-y-5 shadow-2xl border-white/10 backdrop-blur-3xl relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <SplitSquareHorizontal className="w-4 h-4 text-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white uppercase tracking-widest leading-none">A/B Engine</span>
            <span className="text-[9px] text-white/40 font-medium mt-1">Real-time comparison mode</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResnapshot}
            title="Update snapshot"
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase hidden sm:inline">Snapshot</span>
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split previews */}
      <div className="flex gap-6 relative z-10">
        <GlowMiniPreview state={snapshotState} label="Current Snapshot" isDark={isDark} />
        <div className="flex flex-col items-center justify-center gap-3">
           <div className="w-px flex-1 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
           <div className="p-2 rounded-full bg-white/5 border border-white/10">
             <SplitSquareHorizontal className="w-3 h-3 text-white/20" />
           </div>
           <div className="w-px flex-1 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </div>
        <GlowMiniPreview state={currentState} label="Live Evolution" isDark={isDark} />
      </div>

      <div className="pt-2 border-t border-white/5 text-center relative z-10">
        <span className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em]">Snapshot locked at point of entry · Edit to see evolution</span>
      </div>
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
