import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { toPng } from "html-to-image";
import {
  Smartphone, Tablet, Monitor, Grid3X3, Download, Activity,
  ZoomIn, ZoomOut, Maximize2, FileImage, Move, MousePointer2,
  Crosshair, Ruler, Eye, EyeOff, CopyPlus, Trash2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlowState } from "@/lib/glow-types";
import { exportAsSVG } from "@/lib/glow-export";
import { toast } from "sonner";

interface PreviewProps {
  state: GlowState;
  setPower: (v: boolean) => void;
  onStateChange: (v: GlowState) => void;
  onLayerSelect: (id: string) => void;
  cssOverride: string | null;
}

const frameDimensions = {
  mobile: { w: 320, h: 400, label: "Mobile", icon: Smartphone },
  tablet: { w: 500, h: 620, label: "Tablet", icon: Tablet },
  desktop: { w: 820, h: 520, label: "Desktop", icon: Monitor },
};

export function GlowPreview({ state, onStateChange, onLayerSelect }: PreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [frameSize, setFrameSize] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const isDark = state.themeMode === "dark";
  const currentFrame = frameDimensions[frameSize];
  const activeLayerCount = state.layers.filter(l => l.active).length;
  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId);

  const handleExportImage = async () => {
    if (!previewRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2, skipFonts: true, skipAutoScale: true });
      const link = document.createElement("a");
      link.download = `glow-preview-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("PNG exported!");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = () => {
    const svgStr = exportAsSVG(state, currentFrame.w, currentFrame.h);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `glow-preview-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("SVG exported!");
  };

  const handleLayerDrag = useCallback((id: string, info: PanInfo) => {
    const updatedLayers = state.layers.map((l) =>
      l.id === id ? { ...l, x: l.x + info.delta.x / zoom, y: l.y + info.delta.y / zoom } : l
    );
    onStateChange({ ...state, layers: updatedLayers });
  }, [state, zoom, onStateChange]);

  const handleZoom = (dir: "in" | "out" | "reset") => {
    if (dir === "reset") setZoom(1);
    else setZoom((z) => Math.max(0.25, Math.min(3, +(z + (dir === "in" ? 0.25 : -0.25)).toFixed(2))));
  };

  // Scroll zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(0.25, Math.min(3, +(z + delta).toFixed(2))));
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full relative group/canvas" onWheel={handleWheel}>
      {/* Floating top toolbar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 transition-all duration-500 opacity-60 hover:opacity-100 group-hover/canvas:translate-y-[-4px]">
        {/* Device switcher */}
        <div className="flex items-center gap-1.5 p-2 px-3 bg-black/60 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] shadow-2xl relative overflow-hidden group/toolbar">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/toolbar:opacity-100 transition-opacity pointer-events-none" />
          {(["mobile", "tablet", "desktop"] as const).map((size) => {
            const Icon = frameDimensions[size].icon;
            return (
              <ToolBtn key={size} active={frameSize === size} onClick={() => setFrameSize(size)} title={frameDimensions[size].label}>
                <Icon className="w-4 h-4" />
              </ToolBtn>
            );
          })}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 p-2 px-4 bg-black/60 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] shadow-2xl group/zoom">
          <ToolBtn onClick={() => handleZoom("out")} title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </ToolBtn>
          <div className="relative">
            <button
              onClick={() => handleZoom("reset")}
              className="px-3 py-1.5 text-[11px] text-white/50 hover:text-white font-black min-w-[54px] text-center transition-all rounded-xl hover:bg-white/10 tracking-widest"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>
          <ToolBtn onClick={() => handleZoom("in")} title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </ToolBtn>
        </div>

        {/* View & Export tools combined */}
        <div className="flex items-center gap-1.5 p-2 px-3 bg-black/60 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] shadow-2xl">
          <ToolBtn active={showDimensions} onClick={() => setShowDimensions(!showDimensions)} title="Dimensions">
            <Maximize2 className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn active={showGrid} onClick={() => setShowGrid(!showGrid)} title="Grid overlay">
            <Grid3X3 className="w-4 h-4" />
          </ToolBtn>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ToolBtn onClick={handleExportImage} title="Export PNG" className="bg-primary/20 text-primary hover:bg-primary hover:text-black">
            {isExporting ? <Activity className="w-4 h-4 animate-pulse" /> : <Download className="w-4 h-4" />}
          </ToolBtn>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center relative bg-[#050505] overflow-hidden group/studio">
        {/* Subtle radial center highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />

        {/* Rulers */}
        {showRulers && <CanvasRulers width={currentFrame.w} height={currentFrame.h} zoom={zoom} />}

        {/* Frame container with zoom */}
        <div className="relative z-10" style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.4s cubic-bezier(0.2, 0, 0, 1)" }}>
          {/* Enhanced Frame shadow glow - Reactive to first active layer color */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: state.power ? [0.2, 0.35, 0.2] : 0
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-20 rounded-[4rem] blur-[100px] pointer-events-none z-0"
            style={{
              background: state.power && activeLayerCount > 0
                ? `radial-gradient(circle, ${state.layers.find(l => l.active)?.color ?? 'transparent'}50, transparent 75%)`
                : 'transparent',
            }}
          />

          {/* Preview frame */}
          <div
            ref={previewRef}
            className={cn(
              "relative overflow-hidden rounded-[2rem] border transition-all duration-500 z-10",
              isDark
                ? "bg-black border-white/10"
                : "bg-neutral-100 border-neutral-300/40",
              "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_40px_120px_-20px_rgba(0,0,0,0.8),0_12px_40px_-10px_rgba(0,0,0,0.4)]"
            )}
            style={{ width: currentFrame.w, height: currentFrame.h }}
          >
            {/* Grid overlay */}
            <AnimatePresence>
              {showGrid && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(hsla(0 0% 100% / 0.07) 1px, transparent 1px), linear-gradient(90deg, hsla(0 0% 100% / 0.07) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Center crosshair */}
            {showDimensions && (
              <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                <div className="w-px h-full bg-primary/10 absolute" />
                <div className="h-px w-full bg-primary/10 absolute" />
                <Crosshair className="w-4 h-4 text-primary/20" />
              </div>
            )}

            {/* Glow Layers */}
            <div
              className="absolute inset-0 glow-container"
              style={{
                transform: `scale(${state.globalScale})`,
                opacity: state.power ? state.globalOpacity : 0,
                transition: "opacity 0.5s ease",
              }}
            >
              <AnimatePresence>
                {state.layers.map((layer, index) =>
                  layer.active ? (
                    <motion.div
                      key={layer.id}
                      drag
                      dragMomentum={false}
                      onTap={() => onLayerSelect(layer.id)}
                      onDrag={(_, info) => handleLayerDrag(layer.id, info)}
                      onHoverStart={() => setHoveredLayer(layer.id)}
                      onHoverEnd={() => setHoveredLayer(null)}
                      className={cn(
                        "absolute top-1/2 left-1/2 rounded-full cursor-move transition-shadow duration-200",
                        state.selectedLayerId === layer.id
                          ? "ring-2 ring-primary/50 z-50 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                          : hoveredLayer === layer.id
                            ? "ring-1 ring-foreground/15"
                            : ""
                      )}
                      style={{
                        x: layer.x, y: layer.y,
                        translateX: "-50%", translateY: "-50%",
                        width: layer.width, height: layer.height,
                        backgroundColor: layer.color,
                        filter: `blur(${layer.blur}px)`,
                        opacity: layer.opacity,
                        mixBlendMode: layer.blendMode as any,
                        zIndex: index,
                      }}
                    >
                      {/* Floating Layer Context Toolbar */}
                      {state.selectedLayerId === layer.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-black/80 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl z-[1000] pointer-events-auto"
                        >
                          <ToolBtn onClick={(e) => { e?.stopPropagation(); onStateChange({ ...state, layers: state.layers.map(l => l.id === layer.id ? { ...l, active: !l.active } : l) }); }} className="p-1.5 rounded-lg">
                            {layer.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </ToolBtn>
                          <div className="w-px h-4 bg-white/10" />
                          <ToolBtn onClick={(e) => { e?.stopPropagation(); const nl = { ...layer, id: `layer-${Date.now()}`, name: `${layer.name} Copy`, x: layer.x + 20, y: layer.y + 20 }; onStateChange({ ...state, layers: [...state.layers, nl], selectedLayerId: nl.id }); toast.success("Layer duplicated"); }} className="p-1.5 rounded-lg">
                            <CopyPlus className="w-3.5 h-3.5" />
                          </ToolBtn>
                          <ToolBtn onClick={(e) => { e?.stopPropagation(); if (state.layers.length > 1) { const nl = state.layers.filter(l => l.id !== layer.id); onStateChange({ ...state, layers: nl, selectedLayerId: nl[0].id }); toast.success("Layer removed"); } }} className="p-1.5 rounded-lg hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </ToolBtn>
                          <div className="w-px h-4 bg-white/10" />
                          <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                            <Sparkles className="w-3 h-3 text-primary/60" />
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">Selected</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Layer info tooltip */}
                      {(showDimensions && state.selectedLayerId === layer.id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-[999]"
                        >
                          <span className="canvas-toolbar px-2 py-1 text-[9px] font-mono whitespace-nowrap">
                            {layer.width}×{layer.height} · ({Math.round(layer.x)}, {Math.round(layer.y)})
                          </span>
                        </motion.div>
                      )}

                      {/* Layer name on hover */}
                      {hoveredLayer === layer.id && state.selectedLayerId !== layer.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-[999]"
                        >
                          <span className="text-[9px] text-muted-foreground/80 font-mono whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                            {layer.name}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : null
                )}
              </AnimatePresence>
            </div>

            {/* Noise overlay */}
            {state.noiseEnabled && (
              <div
                className="absolute inset-0 pointer-events-none z-[100]"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.15'/></svg>")`,
                  backgroundRepeat: "repeat",
                  backgroundSize: "200px 200px",
                  opacity: state.noiseIntensity,
                  mixBlendMode: "overlay",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 opacity-60 hover:opacity-100 group-hover/canvas:translate-y-[4px]">
        <div className="px-6 py-3 flex items-center gap-6 text-[10px] font-black tracking-[0.2em] text-white/40 bg-black/60 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] shadow-2xl uppercase">
          <span className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.6)]"
            />
            {currentFrame.w}×{currentFrame.h}
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span>{activeLayerCount} LAYERS ACTIVE</span>
          {selectedLayer && (
            <>
              <span className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-2 text-primary font-black">
                <MousePointer2 className="w-3.5 h-3.5" />
                {selectedLayer.name}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Toolbar button ── */
function ToolBtn({ active, onClick, children, title, className }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string; className?: string }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "p-2.5 rounded-xl transition-all duration-200",
        active
          ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10"
          : "text-white/40 hover:text-white hover:bg-white/5",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

/* ── Canvas rulers ── */
function CanvasRulers({ width, height, zoom }: { width: number; height: number; zoom: number }) {
  const step = 40;
  const hTicks = Math.ceil(width / step) + 1;
  const vTicks = Math.ceil(height / step) + 1;

  return (
    <>
      {/* Horizontal */}
      <div className="absolute top-0 left-1/2 z-20 pointer-events-none" style={{ transform: `translateX(-50%) scale(${zoom})`, transformOrigin: "center top", width, height: 16 }}>
        <div className="w-full h-full bg-background/40 backdrop-blur-sm border-b border-border/20 flex items-end">
          {Array.from({ length: hTicks }, (_, i) => (
            <div key={i} className="absolute bottom-0 flex flex-col items-center" style={{ left: i * step }}>
              <span className="text-[7px] text-editor-text-dim font-mono mb-0.5">{i * step}</span>
              <div className="w-px h-1.5 bg-editor-text-dim/30" />
            </div>
          ))}
        </div>
      </div>
      {/* Vertical */}
      <div className="absolute left-1/2 top-1/2 z-20 pointer-events-none" style={{ transform: `translate(calc(-50% - ${width * zoom / 2}px - 20px), -50%) scale(${zoom})`, transformOrigin: "right center", width: 16, height }}>
        <div className="w-full h-full bg-background/40 backdrop-blur-sm border-r border-border/20 flex flex-col">
          {Array.from({ length: vTicks }, (_, i) => (
            <div key={i} className="absolute right-0 flex items-center" style={{ top: i * step }}>
              <span className="text-[7px] text-editor-text-dim font-mono mr-0.5 rotate-[-90deg] origin-right">{i * step}</span>
              <div className="h-px w-1.5 bg-editor-text-dim/30" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
