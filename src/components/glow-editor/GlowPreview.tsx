import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { toPng } from "html-to-image";
import {
  Smartphone, Tablet, Monitor, Grid3X3, Download, Activity,
  ZoomIn, ZoomOut, Maximize2, FileImage, Move, MousePointer2,
  Crosshair, Ruler,
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
    <div className="flex flex-col h-full w-full relative" onWheel={handleWheel}>
      {/* Floating top toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {/* Device switcher */}
        <div className="flex items-center gap-1 canvas-toolbar p-1.5 backdrop-blur-xl border-white/5 shadow-2xl">
          {(["mobile", "tablet", "desktop"] as const).map((size) => {
            const Icon = frameDimensions[size].icon;
            return (
              <ToolBtn key={size} active={frameSize === size} onClick={() => setFrameSize(size)} title={frameDimensions[size].label}>
                <Icon className="w-4 h-4" />
              </ToolBtn>
            );
          })}
        </div>

        <div className="w-px h-6 bg-white/5" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 canvas-toolbar p-1.5 backdrop-blur-xl border-white/5 shadow-2xl">
          <ToolBtn onClick={() => handleZoom("out")} title="Zoom out">
            <ZoomOut className="w-3.5 h-3.5" />
          </ToolBtn>
          <button
            onClick={() => handleZoom("reset")}
            className="px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground font-bold min-w-[50px] text-center transition-all rounded-xl hover:bg-white/5"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolBtn onClick={() => handleZoom("in")} title="Zoom in">
            <ZoomIn className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>

        <div className="w-px h-6 bg-white/5" />

        {/* View tools */}
        <div className="flex items-center gap-1 canvas-toolbar p-1.5 backdrop-blur-xl border-white/5 shadow-2xl">
          <ToolBtn active={showDimensions} onClick={() => setShowDimensions(!showDimensions)} title="Dimensions">
            <Maximize2 className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn active={showGrid} onClick={() => setShowGrid(!showGrid)} title="Grid overlay">
            <Grid3X3 className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn active={showRulers} onClick={() => setShowRulers(!showRulers)} title="Rulers">
            <Ruler className="w-4 h-4" />
          </ToolBtn>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center relative canvas-bg rounded-xl overflow-hidden">
        {/* Rulers */}
        {showRulers && <CanvasRulers width={currentFrame.w} height={currentFrame.h} zoom={zoom} />}

        {/* Frame container with zoom */}
        <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}>
          {/* Frame shadow glow */}
          <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl pointer-events-none" style={{
            background: state.power && activeLayerCount > 0
              ? `radial-gradient(ellipse, ${state.layers.find(l => l.active)?.color ?? 'transparent'}40, transparent 70%)`
              : 'transparent',
            transition: 'opacity 0.5s ease'
          }} />

          {/* Preview frame */}
          <div
            ref={previewRef}
            className={cn(
              "relative overflow-hidden rounded-2xl border transition-all duration-300",
              isDark
                ? "bg-background border-border/30"
                : "bg-neutral-100 border-neutral-300/40",
              "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_-15px_rgba(0,0,0,0.5),0_4px_20px_-5px_rgba(0,0,0,0.3)]"
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
                          ? "ring-2 ring-primary/50 z-50"
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
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30">
        <div className="canvas-toolbar px-3 py-1.5 flex items-center gap-3 text-[10px] font-mono text-muted-foreground/70">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            {currentFrame.w}×{currentFrame.h}
          </span>
          <span className="w-px h-3 bg-border/40" />
          <span>{activeLayerCount} layer{activeLayerCount !== 1 ? 's' : ''}</span>
          {selectedLayer && (
            <>
              <span className="w-px h-3 bg-border/40" />
              <span className="flex items-center gap-1">
                <MousePointer2 className="w-2.5 h-2.5" />
                {selectedLayer.name}
              </span>
            </>
          )}
          <span className="w-px h-3 bg-border/40" />
          <span className="flex items-center gap-1">
            <Move className="w-2.5 h-2.5" />
            drag to move
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Toolbar button ── */
function ToolBtn({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "p-2 rounded-xl transition-all duration-200 border-transparent border",
        active
          ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]"
          : "text-editor-text-dim hover:text-foreground hover:bg-white/5 hover:border-white/5"
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
