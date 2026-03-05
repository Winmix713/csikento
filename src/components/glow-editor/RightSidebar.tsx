import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings2, Code, Palette, RefreshCcw, Copy, Check,
  FileText, FileCode2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { GlowState, GlowLayer, BlendMode } from "@/lib/glow-types";
import { exportAsCSS } from "@/lib/glow-types";
import { exportForFormat, type ExportFormat } from "@/lib/glow-export";
import { getColorPalette, getColorHarmonies } from "@/lib/glow-utils";

// ── Quick Swatches ────────────────────────────────────────────────────────────

const QUICK_SWATCHES = [
  { name: "Red", color: "#ef4444" },
  { name: "Orange", color: "#f97316" },
  { name: "Yellow", color: "#eab308" },
  { name: "Green", color: "#22c55e" },
  { name: "Cyan", color: "#06b6d4" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Purple", color: "#8b5cf6" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function NumberInput({ value, onChange, min, max, step = 1, unit = "" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-0.5 bg-editor-surface rounded-lg px-2 py-1 border border-editor-border focus-within:border-editor-border-hover transition-colors">
      <input type="number" value={value}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
        min={min} max={max} step={step}
        className="w-10 bg-transparent border-none outline-none text-[10px] text-right text-foreground font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      {unit && <span className="text-[9px] text-editor-text-dim">{unit}</span>}
    </div>
  );
}

function AnimatedSlider(props: React.ComponentPropsWithoutRef<typeof Slider>) {
  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
      <Slider {...props} />
    </motion.div>
  );
}

function ColorSwatchRow({ currentColor, onSelect }: { currentColor: string; onSelect: (c: string) => void }) {
  return (
    <div className="space-y-1.5">
      <span className="prop-label">Quick</span>
      <div className="flex gap-1.5">
        {QUICK_SWATCHES.map((s) => (
          <motion.button key={s.name} onClick={() => onSelect(s.color)}
            whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            title={s.name} className="relative">
            <div className={cn("swatch-circle", currentColor === s.color && "active")} style={{ backgroundColor: s.color }} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ColorHarmonyPanel({ currentColor, onSelect }: { currentColor: string; onSelect: (c: string) => void }) {
  const harmonies = getColorHarmonies(currentColor);
  return (
    <div className="space-y-2">
      <span className="prop-label flex items-center gap-1"><Palette className="w-3 h-3" /> Harmony</span>
      <div className="space-y-1.5">
        {harmonies.map((group) => (
          <div key={group.name} className="space-y-1">
            <span className="text-[8px] text-editor-text-dim uppercase tracking-widest font-semibold">{group.name}</span>
            <div className="flex gap-1">
              {group.colors.map((c, i) => (
                <motion.button key={i} onClick={() => onSelect(c)}
                  whileHover={{ scale: 1.12, y: -1 }} whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="group flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 rounded-md border border-editor-border hover:border-editor-border-hover transition-all cursor-pointer hover:shadow-lg" style={{ backgroundColor: c }} />
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyntaxHighlightedCode({ code, format }: { code: string; format: ExportFormat }) {
  return (
    <code>
      {code.split("\n").map((line, i) => (
        <div key={i}>{highlightLine(line, format)}</div>
      ))}
    </code>
  );
}

function highlightLine(line: string, format: ExportFormat): React.ReactNode {
  if (format === "css") {
    if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return <span className="text-editor-text-dim">{line}</span>;
    if (line.includes(":") && !line.includes("{")) {
      const [prop, ...rest] = line.split(":");
      return <><span className="text-sky-400">{prop}</span>:<span className="text-amber-300">{rest.join(":")}</span></>;
    }
    if (line.includes("{") || line.includes("}")) return <span className="text-primary">{line}</span>;
    return <span className="text-muted-foreground">{line}</span>;
  }
  if (line.trim().startsWith("//") || line.trim().startsWith("{/*")) return <span className="text-editor-text-dim">{line}</span>;
  if (line.trim().startsWith("import") || line.trim().startsWith("export")) return <span className="text-violet-400">{line}</span>;
  if (line.includes("<") && line.includes(">")) return <span className="text-primary">{line}</span>;
  if (line.includes("'") || line.includes('"')) return <span className="text-amber-300">{line}</span>;
  return <span className="text-muted-foreground">{line}</span>;
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT MODAL
// ══════════════════════════════════════════════════════════════════════════════

export function ExportModal({ isOpen, onClose, state, cssOverride }: { isOpen: boolean; onClose: () => void; state: GlowState; cssOverride: string | null }) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [copied, setCopied] = useState(false);
  const code = cssOverride && format === "css" ? cssOverride : exportForFormat(state, format);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`${format.toUpperCase()} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-surface rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Export Code</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg">✕</button>
            </div>
            <div className="flex gap-1 mb-4 bg-editor-surface rounded-xl p-1 relative">
              {([
                { id: "css" as const, label: "CSS", icon: FileText },
                { id: "tailwind" as const, label: "Tailwind", icon: Code },
                { id: "react" as const, label: "React", icon: FileCode2 },
              ]).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setFormat(id)}
                  className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 relative z-10",
                    format === id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                  {format === id && (
                    <motion.div layoutId="export-tab-bg" className="absolute inset-0 bg-secondary rounded-lg shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                </button>
              ))}
            </div>
            <div className="relative flex-1 bg-background rounded-xl border border-border overflow-hidden">
              <button onClick={handleCopy} className="absolute top-3 right-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all z-10">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="p-5 text-xs font-mono overflow-auto h-full max-h-[50vh] leading-relaxed">
                <SyntaxHighlightedCode code={code} format={format} />
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RIGHT SIDEBAR EXPORT
// ══════════════════════════════════════════════════════════════════════════════

interface RightSidebarProps {
  state: GlowState;
  onStateChange: (s: GlowState) => void;
  cssOverride: string | null;
  setCssOverride: (v: string | null) => void;
}

export function RightSidebar({ state, onStateChange, cssOverride, setCssOverride }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<"style" | "global" | "code">("style");
  const selectedLayer = state.layers.find((l) => l.id === state.selectedLayerId);

  const updateState = (u: Partial<GlowState>) => { onStateChange({ ...state, ...u }); setCssOverride(null); };
  const updateLayer = (u: Partial<GlowLayer>) => {
    if (!selectedLayer) return;
    updateState({ layers: state.layers.map((l) => l.id === selectedLayer.id ? { ...l, ...u } : l) });
  };

  const tabs = [
    { id: "style" as const, label: "Style", icon: Palette },
    { id: "global" as const, label: "Global", icon: Settings2 },
    { id: "code" as const, label: "Code", icon: Code },
  ];

  return (
    <div className="w-[280px] flex-shrink-0 glass-surface rounded-2xl flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Tab bar */}
      <div className="p-4 pb-0">
        <div className="flex bg-editor-surface/80 backdrop-blur-md rounded-2xl p-1 gap-1 border border-editor-border/30 relative shadow-inner">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("flex-1 py-2 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative z-10",
                activeTab === id ? "text-foreground shadow-sm" : "text-editor-text-dim hover:text-foreground hover:bg-editor-surface/40")}>
              <Icon className={cn("w-3.5 h-3.5 transition-transform", activeTab === id && "scale-110")} /> {label}
              {activeTab === id && (
                <motion.div layoutId="right-tab-bg" className="absolute inset-0 bg-secondary rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-3">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }} className="space-y-4">

            {activeTab === "style" ? (
              selectedLayer ? (
                <>
                  {/* Color picker */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <motion.div className="w-9 h-9 rounded-xl border-2 border-editor-border cursor-pointer shadow-lg"
                        style={{ backgroundColor: selectedLayer.color }}
                        whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} />
                      <input type="color" value={selectedLayer.color} onChange={(e) => updateLayer({ color: e.target.value })} className="w-9 h-9 opacity-0 absolute inset-0 cursor-pointer" />
                    </div>
                    <input type="text" value={selectedLayer.color} onChange={(e) => updateLayer({ color: e.target.value })}
                      className="bg-transparent border-b border-editor-border w-full text-[11px] py-1 outline-none font-mono text-foreground focus:border-primary/50 transition-colors" />
                  </div>

                  {/* Quick swatches */}
                  <ColorSwatchRow currentColor={selectedLayer.color} onSelect={(c) => updateLayer({ color: c })} />

                  {/* Color harmonies */}
                  <ColorHarmonyPanel currentColor={selectedLayer.color} onSelect={(c) => updateLayer({ color: c })} />

                  {/* Sliders */}
                  <div className="space-y-3 pt-2 border-t border-glass-border/30">
                    {([
                      { label: "Blur", key: "blur" as const, max: 300, step: 1, unit: "px" },
                      { label: "Opacity", key: "opacity" as const, max: 1, step: 0.01, unit: "" },
                      { label: "Width", key: "width" as const, max: 800, step: 10, unit: "px" },
                      { label: "Height", key: "height" as const, max: 800, step: 10, unit: "px" },
                    ] as const).map(({ label, key, max, step, unit }) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="prop-label">{label}</span>
                          <NumberInput value={selectedLayer[key]} onChange={(v) => updateLayer({ [key]: v })} min={0} max={max} step={step} unit={unit} />
                        </div>
                        <AnimatedSlider value={[selectedLayer[key]]} onValueChange={(v) => updateLayer({ [key]: v[0] })} max={max} step={step} />
                      </div>
                    ))}
                  </div>

                  {/* Blend Mode */}
                  <div className="space-y-1">
                    <span className="prop-label">Blend</span>
                    <Select value={selectedLayer.blendMode} onValueChange={(v) => updateLayer({ blendMode: v as BlendMode })}>
                      <SelectTrigger className="h-7 text-[10px] bg-editor-surface border-editor-border rounded-lg font-medium"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["normal", "screen", "overlay", "soft-light", "color-dodge", "multiply"].map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <p className="text-[10px] text-editor-text-dim text-center py-8">Select a layer to edit</p>
              )
            ) : activeTab === "global" ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center"><span className="prop-label">Scale</span><NumberInput value={state.globalScale} onChange={(v) => updateState({ globalScale: v })} step={0.1} min={0.5} max={2} /></div>
                  <AnimatedSlider value={[state.globalScale]} onValueChange={(v) => updateState({ globalScale: v[0] })} min={0.5} max={2.0} step={0.05} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center"><span className="prop-label">Opacity</span><NumberInput value={state.globalOpacity} onChange={(v) => updateState({ globalOpacity: v })} step={0.05} max={1} min={0} /></div>
                  <AnimatedSlider value={[state.globalOpacity]} onValueChange={(v) => updateState({ globalOpacity: v[0] })} max={1} step={0.01} />
                </div>
                <div className="space-y-2 bg-editor-surface rounded-xl p-3 border border-editor-border">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-foreground">Animation</span><Switch checked={state.animation.enabled} onCheckedChange={(v) => updateState({ animation: { ...state.animation, enabled: v } })} /></div>
                  <AnimatePresence>
                    {state.animation.enabled && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="space-y-1 pl-2 border-l-2 border-primary/20">
                          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Duration</span><span className="font-mono">{state.animation.duration}s</span></div>
                          <AnimatedSlider value={[state.animation.duration]} onValueChange={(v) => updateState({ animation: { ...state.animation, duration: v[0] } })} min={0.5} max={10} step={0.5} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2 bg-editor-surface rounded-xl p-3 border border-editor-border">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-foreground">Noise Overlay</span><Switch checked={state.noiseEnabled} onCheckedChange={(v) => updateState({ noiseEnabled: v })} /></div>
                  <AnimatePresence>
                    {state.noiseEnabled && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="space-y-1 pl-2 border-l-2 border-primary/20">
                          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Intensity</span><span className="font-mono">{Math.round(state.noiseIntensity * 100)}%</span></div>
                          <AnimatedSlider value={[state.noiseIntensity]} onValueChange={(v) => updateState({ noiseIntensity: v[0] })} max={1} step={0.01} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-editor-text-muted uppercase tracking-wider">Live CSS</span>
                  {cssOverride && (
                    <button onClick={() => setCssOverride(null)} className="text-[9px] font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-md border border-destructive/20 flex items-center gap-1 hover:bg-destructive/20 transition-all">
                      <RefreshCcw className="w-2.5 h-2.5" /> Reset
                    </button>
                  )}
                </div>
                <textarea
                  value={cssOverride ?? exportAsCSS(state)}
                  onChange={(e) => setCssOverride(e.target.value)}
                  className="w-full h-[300px] bg-background p-3 rounded-xl font-mono text-[10px] text-muted-foreground leading-relaxed outline-none border border-border focus:border-primary/30 resize-none transition-colors"
                  spellCheck={false} />
                <p className="text-[9px] text-editor-text-dim">Edit CSS directly. Slider changes reset manual edits.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
