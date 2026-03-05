import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings2, Code, Palette, RefreshCcw, Copy, Check,
  FileText, FileCode2, Sparkles, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { GlowState, GlowLayer, BlendMode } from "@/lib/glow-types";
import { exportAsCSS } from "@/lib/glow-export";
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
    <div className="w-[320px] flex-shrink-0 glass-surface rounded-3xl flex flex-col max-h-[calc(100vh-1.5rem)] overflow-hidden m-1.5 border-white/5 shadow-2xl">
      {/* Tab bar */}
      <div className="p-4 pb-0 bg-white/[0.02]">
        <div className="flex bg-black/20 rounded-2xl p-1 gap-1 border border-white/5 relative">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("flex-1 py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative z-10",
                activeTab === id ? "text-white" : "text-white/40 hover:text-white/70")}>
              <Icon className="w-3.5 h-3.5" /> {label}
              {activeTab === id && (
                <motion.div layoutId="right-tab-bg" className="absolute inset-0 bg-white/[0.05] border border-white/10 rounded-xl shadow-lg -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pt-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }} className="space-y-6">

            {activeTab === "style" ? (
              selectedLayer ? (
                <>
                  {/* Smart Suggestions Bento */}
                  <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 space-y-3 relative overflow-hidden group/suggestions">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-hover/suggestions:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center gap-2 relative z-10">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Smart Suggestions</span>
                    </div>
                    <div className="flex gap-2 relative z-10">
                      <button
                        onClick={() => updateLayer({ blur: Math.min(300, selectedLayer.blur + 50), width: Math.min(800, selectedLayer.width + 100), height: Math.min(800, selectedLayer.height + 100) })}
                        className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Wand2 className="w-3 h-3 text-primary/60" /> Boost Glow
                      </button>
                      <button
                        onClick={() => {
                          const otherLayers = state.layers.filter(l => l.id !== selectedLayer.id);
                          if (otherLayers.length > 0) {
                            const avgColor = otherLayers[0].color; // Simplified harmonize
                            updateLayer({ color: avgColor });
                            toast.success("Color harmonized with group");
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold text-white transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCcw className="w-3 h-3 text-primary/60" /> Harmonize
                      </button>
                    </div>
                  </div>

                  {/* Layer Info Bento */}
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <motion.div className="w-12 h-12 rounded-2xl border-2 border-white/10 cursor-pointer shadow-xl group-hover:scale-105 transition-transform overflow-hidden"
                          style={{ backgroundColor: selectedLayer.color }} />
                        <input type="color" value={selectedLayer.color} onChange={(e) => updateLayer({ color: e.target.value })} className="w-12 h-12 opacity-0 absolute inset-0 cursor-pointer" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Active Layer</span>
                        <input type="text" value={selectedLayer.color} onChange={(e) => updateLayer({ color: e.target.value })}
                          className="bg-transparent border-none w-full text-sm font-bold text-white outline-none focus:text-primary transition-colors" />
                      </div>
                    </div>

                    <ColorSwatchRow currentColor={selectedLayer.color} onSelect={(c) => updateLayer({ color: c })} />
                  </div>

                  {/* Harmony Bento */}
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <ColorHarmonyPanel currentColor={selectedLayer.color} onSelect={(c) => updateLayer({ color: c })} />
                  </div>

                  {/* Sliders Bento */}
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-5">
                    {([
                      { label: "Blur", key: "blur" as const, max: 300, step: 1, unit: "px" },
                      { label: "Opacity", key: "opacity" as const, max: 1, step: 0.01, unit: "" },
                      { label: "Width", key: "width" as const, max: 800, step: 10, unit: "px" },
                      { label: "Height", key: "height" as const, max: 800, step: 10, unit: "px" },
                    ] as const).map(({ label, key, max, step, unit }) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{label}</span>
                          <NumberInput value={selectedLayer[key]} onChange={(v) => updateLayer({ [key]: v })} min={0} max={max} step={step} unit={unit} />
                        </div>
                        <AnimatedSlider value={[selectedLayer[key]]} onValueChange={(v) => updateLayer({ [key]: v[0] })} max={max} step={step} className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3" />
                      </div>
                    ))}
                  </div>

                  {/* Blend Mode Bento */}
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Blending</span>
                    <Select value={selectedLayer.blendMode} onValueChange={(v) => updateLayer({ blendMode: v as BlendMode })}>
                      <SelectTrigger className="h-10 text-[11px] bg-black/20 border-white/10 rounded-xl font-bold hover:bg-black/30 transition-all"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-editor-surface border-white/10 backdrop-blur-xl">
                        {["normal", "screen", "overlay", "soft-light", "color-dodge", "multiply"].map((m) => (
                          <SelectItem key={m} value={m} className="text-[11px] font-bold">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <Palette className="w-12 h-12 mb-4" />
                  <p className="text-[11px] font-bold uppercase tracking-widest">Select a layer</p>
                </div>
              )
            ) : activeTab === "global" ? (
              <div className="space-y-4">
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-5">
                   <div className="space-y-2">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Scale</span><NumberInput value={state.globalScale} onChange={(v) => updateState({ globalScale: v })} step={0.1} min={0.5} max={2} /></div>
                    <AnimatedSlider value={[state.globalScale]} onValueChange={(v) => updateState({ globalScale: v[0] })} min={0.5} max={2.0} step={0.05} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Opacity</span><NumberInput value={state.globalOpacity} onChange={(v) => updateState({ globalOpacity: v })} step={0.05} max={1} min={0} /></div>
                    <AnimatedSlider value={[state.globalOpacity]} onValueChange={(v) => updateState({ globalOpacity: v[0] })} max={1} step={0.01} />
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Animation</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">Dynamic pulsing</span>
                    </div>
                    <Switch checked={state.animation.enabled} onCheckedChange={(v) => updateState({ animation: { ...state.animation, enabled: v } })} className="data-[state=checked]:bg-primary" />
                  </div>
                  <AnimatePresence>
                    {state.animation.enabled && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-[10px] font-bold text-white/50"><span>SPEED</span><span>{state.animation.duration}s</span></div>
                          <AnimatedSlider value={[state.animation.duration]} onValueChange={(v) => updateState({ animation: { ...state.animation, duration: v[0] } })} min={0.5} max={10} step={0.5} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Texture</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">Organic noise</span>
                    </div>
                    <Switch checked={state.noiseEnabled} onCheckedChange={(v) => updateState({ noiseEnabled: v })} className="data-[state=checked]:bg-primary" />
                  </div>
                  <AnimatePresence>
                    {state.noiseEnabled && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-[10px] font-bold text-white/50"><span>INTENSITY</span><span>{Math.round(state.noiseIntensity * 100)}%</span></div>
                          <AnimatedSlider value={[state.noiseIntensity]} onValueChange={(v) => updateState({ noiseIntensity: v[0] })} max={1} step={0.01} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-4 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live System CSS</span>
                  {cssOverride && (
                    <button onClick={() => setCssOverride(null)} className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                      <RefreshCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-colors pointer-events-none" />
                  <textarea
                    value={cssOverride ?? exportAsCSS(state)}
                    onChange={(e) => setCssOverride(e.target.value)}
                    className="w-full h-[400px] bg-black/40 p-4 rounded-xl font-mono text-[11px] text-white/70 leading-relaxed outline-none border border-white/5 focus:border-primary/40 focus:text-white resize-none transition-all relative z-10 custom-scrollbar"
                    spellCheck={false} />
                </div>
                <p className="text-[9px] text-white/30 font-medium italic">Directly manipulate the generated CSS engine.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
