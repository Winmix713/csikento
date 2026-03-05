import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown, ChevronUp, Copy, Check, Code, Undo2, Redo2, Save,
  FolderOpen, Plus, Trash2, Eye, EyeOff, Layers, Settings2, RefreshCcw,
  Sparkles, Shuffle, CopyPlus, Palette, FileCode2, FileText, Star, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { GlowState, GlowLayer, BlendMode } from "@/lib/glow-types";
import { exportAsCSS } from "@/lib/glow-export";
import { BUILT_IN_PRESETS, PRESET_CATEGORIES } from "@/lib/glow-presets";
import { exportForFormat, type ExportFormat } from "@/lib/glow-export";
import { getColorPalette, duplicateLayer, generateRandomGlow } from "@/lib/glow-utils";

// ========================================================================================
// SMALL COMPONENTS
// ========================================================================================

function NumberInput({
  value, onChange, min, max, step = 1, unit = "", className,
}: {
  value: number; onChange: (val: number) => void; min?: number; max?: number; step?: number; unit?: string; className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 bg-editor-surface rounded-lg px-2.5 py-1.5 border border-editor-border focus-within:border-editor-border-hover transition-colors", className)}>
      <input
        type="number" value={value}
        onChange={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) onChange(val); }}
        min={min} max={max} step={step}
        className="w-12 bg-transparent border-none outline-none text-xs text-right pr-0.5 text-foreground font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {unit && <span className="text-[10px] text-editor-text-dim">{unit}</span>}
    </div>
  );
}

function MiniPresetPreview({ state }: { state: GlowState }) {
  const colors = state.layers.filter((l) => l.active).slice(0, 4).map((l) => l.color);
  return (
    <div className="w-9 h-7 rounded-lg overflow-hidden relative border border-editor-border bg-background flex-shrink-0">
      {colors.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            backgroundColor: c, width: "55%", height: "55%",
            top: `${10 + i * 8}%`, left: `${10 + i * 12}%`,
            filter: "blur(3px)", opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

// ========================================================================================
// ANIMATED SLIDER WRAPPER
// ========================================================================================

function AnimatedSlider(props: React.ComponentPropsWithoutRef<typeof Slider>) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Slider {...props} />
    </motion.div>
  );
}

// ========================================================================================
// LAYER MANAGER
// ========================================================================================

function LayerManager({
  layers, selectedId, onSelect, onUpdate, onAdd, onRemove, onDuplicate,
}: {
  layers: GlowLayer[]; selectedId: string | null; onSelect: (id: string) => void;
  onUpdate: (layers: GlowLayer[]) => void; onAdd: () => void; onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(layers.map((l) => (l.id === id ? { ...l, active: !l.active } : l)));
  };

  const moveLayer = (id: string, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const index = layers.findIndex((l) => l.id === id);
    if (index === -1) return;
    const newIndex = direction === "up" ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= layers.length) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
    onUpdate(newLayers);
  };

  const reversedLayers = [...layers].reverse();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" /> Layers
          <span className="text-[10px] font-mono text-editor-text-dim bg-editor-surface px-1.5 py-0.5 rounded">{layers.length}</span>
        </span>
        <motion.button
          onClick={onAdd}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-1.5 rounded-lg hover:bg-editor-surface-hover text-editor-text-dim hover:text-foreground transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>
      <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {reversedLayers.map((layer, displayIndex) => {
            const realIndex = layers.length - 1 - displayIndex;
            return (
              <motion.div
                key={layer.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={() => onSelect(layer.id)}
                className={cn(
                  "group flex items-center gap-2 p-2.5 rounded-xl text-sm cursor-pointer border",
                  selectedId === layer.id
                    ? "bg-secondary border-editor-border-hover text-foreground shadow-sm"
                    : "bg-transparent border-transparent hover:bg-editor-surface hover:border-editor-border text-muted-foreground"
                )}
              >
                {/* Selection indicator */}
                <motion.div
                  className="w-0.5 h-6 rounded-full bg-primary"
                  initial={false}
                  animate={{ opacity: selectedId === layer.id ? 1 : 0, scaleY: selectedId === layer.id ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                <div className="flex flex-col gap-0.5">
                  <button onClick={(e) => moveLayer(layer.id, "up", e)} disabled={realIndex >= layers.length - 1} className="text-editor-text-dim hover:text-foreground disabled:opacity-15 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={(e) => moveLayer(layer.id, "down", e)} disabled={realIndex <= 0} className="text-editor-text-dim hover:text-foreground disabled:opacity-15 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                </div>
                <button onClick={(e) => toggleVisibility(layer.id, e)} className="text-editor-text-dim hover:text-foreground transition-colors">
                  {layer.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <motion.div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-editor-border"
                  style={{ backgroundColor: layer.color }}
                  layoutId={`color-${layer.id}`}
                />
                <span className="flex-1 text-xs font-medium truncate">{layer.name}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }} className="p-1 rounded hover:text-primary transition-colors" title="Duplicate"><CopyPlus className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onRemove(layer.id); }} className="p-1 rounded hover:text-destructive transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ========================================================================================
// COLOR PALETTE
// ========================================================================================

function ColorPalettePanel({ currentColor, onSelectColor }: { currentColor: string; onSelectColor: (c: string) => void }) {
  const palette = getColorPalette(currentColor);
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold text-editor-text-dim uppercase tracking-wider flex items-center gap-1.5">
        <Palette className="w-3 h-3" /> Suggestions
      </span>
      <div className="flex gap-1.5 flex-wrap">
        {palette.map((p) => (
          <motion.button
            key={p.name}
            onClick={() => onSelectColor(p.color)}
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="group flex flex-col items-center gap-1"
            title={p.name}
          >
            <div
              className="w-7 h-7 rounded-lg border border-editor-border hover:border-editor-border-hover transition-all cursor-pointer hover:shadow-lg"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-[8px] text-editor-text-dim group-hover:text-muted-foreground transition-colors">{p.name.slice(0, 4)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ========================================================================================
// EXPORT MODAL
// ========================================================================================

function ExportModal({ isOpen, onClose, state, cssOverride }: { isOpen: boolean; onClose: () => void; state: GlowState; cssOverride: string | null }) {
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-surface rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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
                <button
                  key={id} onClick={() => setFormat(id)}
                  className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 relative z-10",
                    format === id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                  {format === id && (
                    <motion.div
                      layoutId="export-tab-bg"
                      className="absolute inset-0 bg-secondary rounded-lg shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
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

// ========================================================================================
// PRESET MANAGER
// ========================================================================================

function PresetManagerUI({ presets, onLoad, onDelete, onToggleFavorite, onExport, onImport }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPresets = presets.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const favoritePresets = filteredPresets.filter((p: any) => p.favorite);
  const otherPresets = filteredPresets.filter((p: any) => !p.favorite);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full text-xs font-semibold text-editor-text-dim hover:text-muted-foreground transition-colors pt-2">
          <span className="flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5" /> My Presets ({presets.length})</span>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 space-y-2.5"
        >
          {presets.length > 3 && (
            <div className="relative focus-glow rounded-lg">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-editor-text-dim" />
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets..."
                className="w-full pl-7 pr-3 py-2 text-[11px] bg-editor-surface border border-editor-border rounded-lg text-foreground outline-none focus:border-editor-border-hover transition-colors"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 text-[10px] font-medium bg-editor-surface border border-editor-border rounded-lg text-muted-foreground hover:text-foreground hover:border-editor-border-hover transition-all">Import</button>
            <button onClick={onExport} className="flex-1 py-2 text-[10px] font-medium bg-editor-surface border border-editor-border rounded-lg text-muted-foreground hover:text-foreground hover:border-editor-border-hover transition-all">Export</button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); e.target.value = ""; }} className="hidden" />

          <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar">
            {favoritePresets.length > 0 && (
              <>
                <span className="text-[9px] text-editor-text-dim uppercase tracking-widest font-semibold">Favorites</span>
                {favoritePresets.map((p: any) => (
                  <PresetRow key={p.id} preset={p} onLoad={onLoad} onDelete={onDelete} onToggleFavorite={onToggleFavorite} />
                ))}
              </>
            )}
            {otherPresets.map((p: any) => (
              <PresetRow key={p.id} preset={p} onLoad={onLoad} onDelete={onDelete} onToggleFavorite={onToggleFavorite} />
            ))}
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PresetRow({ preset: p, onLoad, onDelete, onToggleFavorite }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2.5 p-2.5 bg-editor-surface/50 rounded-xl border border-transparent hover:border-editor-border group transition-all"
    >
      <MiniPresetPreview state={p.state} />
      <span className="flex-1 text-xs text-foreground/80 font-medium truncate">{p.name}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onToggleFavorite(p.id)} className={cn("p-1 transition-colors rounded", p.favorite ? "text-amber-400" : "hover:text-amber-400 text-editor-text-dim")}>
          <Star className="w-3 h-3" fill={p.favorite ? "currentColor" : "none"} />
        </button>
        <button onClick={() => onLoad(p.id)} className="p-1 hover:text-foreground text-editor-text-dim rounded"><FolderOpen className="w-3 h-3" /></button>
        <button onClick={() => onDelete(p.id)} className="p-1 hover:text-destructive text-editor-text-dim rounded"><Trash2 className="w-3 h-3" /></button>
      </div>
    </motion.div>
  );
}

// ========================================================================================
// TEMPLATE BROWSER
// ========================================================================================

function TemplateBrowser({ onLoad }: { onLoad: (state: GlowState) => void }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const filtered = activeCategory === "all"
    ? BUILT_IN_PRESETS
    : BUILT_IN_PRESETS.filter((p) => p.categoryId === activeCategory);

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" /> Templates
      </span>

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn("px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-all",
            activeCategory === "all" ? "bg-secondary border-editor-border-hover text-foreground" : "border-editor-border text-editor-text-dim hover:text-muted-foreground hover:border-editor-border-hover")}
        >
          All
        </button>
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn("px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-all",
              activeCategory === cat.id ? "bg-secondary border-editor-border-hover text-foreground" : "border-editor-border text-editor-text-dim hover:text-muted-foreground hover:border-editor-border-hover")}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filtered.map((bp) => (
            <motion.button
              key={bp.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { onLoad(bp.state); toast.success(`Loaded "${bp.name}"`); }}
              className="py-2.5 px-2 bg-editor-surface/50 hover:bg-editor-surface border border-editor-border hover:border-editor-border-hover rounded-xl text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-1.5"
            >
              <MiniPresetPreview state={bp.state} />
              <span className="truncate w-full text-center">{bp.emoji} {bp.name}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ========================================================================================
// MAIN CONTROL PANEL
// ========================================================================================

interface ControlPanelProps {
  state: GlowState;
  onStateChange: (v: GlowState) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSavePreset: (name: string) => void;
  presetManager: any;
  cssOverride: string | null;
  setCssOverride: (v: string | null) => void;
}

export function ControlPanel({
  state, onStateChange, onUndo, onRedo, canUndo, canRedo, onSavePreset, presetManager, cssOverride, setCssOverride,
}: ControlPanelProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [activeTab, setActiveTab] = useState<"layers" | "global" | "code">("layers");

  const selectedLayer = state.layers.find((l) => l.id === state.selectedLayerId);

  const updateState = (updates: Partial<GlowState>) => {
    onStateChange({ ...state, ...updates });
    setCssOverride(null);
  };

  const updateSelectedLayer = (updates: Partial<GlowLayer>) => {
    if (!selectedLayer) return;
    const newLayers = state.layers.map((l) => l.id === selectedLayer.id ? { ...l, ...updates } : l);
    updateState({ layers: newLayers });
  };

  const handleAddLayer = () => {
    const newLayer: GlowLayer = {
      id: `layer-${Date.now()}`, name: "New Layer", active: true,
      color: "#ffffff", blur: 50, opacity: 0.5, width: 200, height: 200, x: 0, y: 0, blendMode: "screen",
    };
    updateState({ layers: [...state.layers, newLayer], selectedLayerId: newLayer.id });
  };

  const handleRemoveLayer = (id: string) => {
    if (state.layers.length <= 1) return;
    const newLayers = state.layers.filter((l) => l.id !== id);
    updateState({ layers: newLayers, selectedLayerId: newLayers[0].id });
  };

  const handleDuplicateLayer = (id: string) => {
    const layer = state.layers.find((l) => l.id === id);
    if (!layer) return;
    const dup = duplicateLayer(layer);
    updateState({ layers: [...state.layers, dup], selectedLayerId: dup.id });
    toast.success("Layer duplicated");
  };

  const handleRandomize = () => {
    const randomState = generateRandomGlow();
    onStateChange(randomState);
    setCssOverride(null);
    toast.success("Randomized!");
  };

  const handleCopyCSS = () => {
    const css = cssOverride ?? exportAsCSS(state);
    navigator.clipboard.writeText(css);
    toast.success("CSS copied!");
  };

  const handleLoadBuiltIn = (presetState: GlowState) => {
    onStateChange(presetState);
    setCssOverride(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); onUndo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); onRedo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); setShowPresetInput(true); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo]);

  const ActionBtn = ({ onClick, disabled, children, title, accent }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; title?: string; accent?: boolean }) => (
    <motion.button
      onClick={onClick} disabled={disabled} title={title}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "p-2 rounded-lg transition-all duration-150 disabled:opacity-20",
        accent
          ? "text-primary hover:bg-primary/10"
          : "text-editor-text-dim hover:text-foreground hover:bg-editor-surface-hover"
      )}
    >
      {children}
    </motion.button>
  );

  const tabs = [
    { id: "layers" as const, label: "Layers", icon: Layers },
    { id: "global" as const, label: "Global", icon: Settings2 },
    { id: "code" as const, label: "Code", icon: Code },
  ];

  return (
    <>
      <div className="w-full lg:w-[360px] glass-surface rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl max-h-[88vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Glow Editor</h2>
            <p className="text-[10px] text-editor-text-dim font-medium mt-0.5">Multi-Layer System</p>
          </div>
          <div className="flex items-center gap-0.5">
            <ActionBtn onClick={handleRandomize} title="Randomize" accent><Shuffle className="w-4 h-4" /></ActionBtn>
            <ActionBtn onClick={onUndo} disabled={!canUndo} title="Undo"><Undo2 className="w-4 h-4" /></ActionBtn>
            <ActionBtn onClick={onRedo} disabled={!canRedo} title="Redo"><Redo2 className="w-4 h-4" /></ActionBtn>
          </div>
        </div>

        {/* Master Toggle + Export */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-editor-surface rounded-xl px-4 py-3 border border-editor-border">
            <span className="text-xs font-semibold text-foreground">Master Power</span>
            <Switch checked={state.power} onCheckedChange={(v) => updateState({ power: v })} />
          </div>
          <div className="flex gap-2">
            <Select value={state.themeMode} onValueChange={(v: "dark" | "light") => updateState({ themeMode: v })}>
              <SelectTrigger className="h-9 text-xs bg-editor-surface border-editor-border rounded-xl flex-1 font-medium"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark Mode</SelectItem>
                <SelectItem value="light">Light Mode</SelectItem>
              </SelectContent>
            </Select>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowExportModal(true)}
              className="h-9 px-4 text-xs font-semibold bg-primary/10 border border-primary/20 rounded-xl text-primary hover:bg-primary/20 transition-all flex items-center gap-2"
            >
              <Code className="w-3.5 h-3.5" /> Export
            </motion.button>
            <button onClick={handleCopyCSS} className="h-9 px-3 text-xs bg-editor-surface border border-editor-border rounded-xl text-editor-text-dim hover:text-foreground hover:border-editor-border-hover transition-all" title="Quick copy CSS">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher with animated indicator */}
        <div className="flex bg-editor-surface rounded-xl p-1 gap-1 border border-editor-border/50 relative">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id} onClick={() => setActiveTab(id)}
              className={cn("flex-1 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 relative z-10",
                activeTab === id ? "text-foreground" : "text-editor-text-dim hover:text-muted-foreground")}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
              {activeTab === id && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-secondary rounded-lg shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Main Content with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 min-h-[300px]"
          >
            {activeTab === "layers" ? (
              <>
                <LayerManager
                  layers={state.layers} selectedId={state.selectedLayerId}
                  onSelect={(id) => updateState({ selectedLayerId: id })}
                  onUpdate={(layers) => updateState({ layers })}
                  onAdd={handleAddLayer} onRemove={handleRemoveLayer} onDuplicate={handleDuplicateLayer}
                />

                {selectedLayer ? (
                  <motion.div
                    key={selectedLayer.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 pt-4 border-t border-border/50"
                  >
                    {/* Color */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <motion.div
                          className="w-10 h-10 rounded-xl border-2 border-editor-border cursor-pointer shadow-lg"
                          style={{ backgroundColor: selectedLayer.color }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        />
                        <input type="color" value={selectedLayer.color} onChange={(e) => updateSelectedLayer({ color: e.target.value })} className="w-10 h-10 opacity-0 absolute inset-0 cursor-pointer" />
                      </div>
                      <input type="text" value={selectedLayer.color} onChange={(e) => updateSelectedLayer({ color: e.target.value })} className="bg-transparent border-b border-editor-border w-full text-sm py-1.5 outline-none font-mono text-foreground focus:border-primary/50 transition-colors" />
                    </div>

                    <ColorPalettePanel currentColor={selectedLayer.color} onSelectColor={(c) => updateSelectedLayer({ color: c })} />

                    {/* Sliders */}
                    <div className="space-y-4">
                      {([
                        { label: "Blur (px)", key: "blur" as const, max: 300, step: 1, unit: "px" },
                        { label: "Opacity", key: "opacity" as const, max: 1, step: 0.01, unit: "" },
                        { label: "Width (px)", key: "width" as const, max: 800, step: 10, unit: "px" },
                        { label: "Height (px)", key: "height" as const, max: 800, step: 10, unit: "px" },
                      ] as const).map(({ label, key, max, step, unit }) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                            <NumberInput value={selectedLayer[key]} onChange={(v) => updateSelectedLayer({ [key]: v })} min={0} max={max} step={step} unit={unit} />
                          </div>
                          <AnimatedSlider value={[selectedLayer[key]]} onValueChange={(v) => updateSelectedLayer({ [key]: v[0] })} max={max} step={step} />
                        </div>
                      ))}
                    </div>

                    {/* Blend Mode */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-medium text-muted-foreground">Blend Mode</span>
                      <Select value={selectedLayer.blendMode} onValueChange={(v) => updateSelectedLayer({ blendMode: v as BlendMode })}>
                        <SelectTrigger className="h-9 text-xs bg-editor-surface border-editor-border rounded-xl font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["normal", "screen", "overlay", "soft-light", "color-dodge", "multiply"].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-xs text-editor-text-dim text-center py-6">Select a layer to edit</p>
                )}
              </>
            ) : activeTab === "global" ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><span className="text-[11px] font-medium text-muted-foreground">Master Scale</span><NumberInput value={state.globalScale} onChange={(v) => updateState({ globalScale: v })} step={0.1} min={0.5} max={2} /></div>
                  <AnimatedSlider value={[state.globalScale]} onValueChange={(v) => updateState({ globalScale: v[0] })} min={0.5} max={2.0} step={0.05} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><span className="text-[11px] font-medium text-muted-foreground">Master Opacity</span><NumberInput value={state.globalOpacity} onChange={(v) => updateState({ globalOpacity: v })} step={0.05} max={1} min={0} /></div>
                  <AnimatedSlider value={[state.globalOpacity]} onValueChange={(v) => updateState({ globalOpacity: v[0] })} max={1} step={0.01} />
                </div>
                <div className="space-y-3 bg-editor-surface rounded-xl p-4 border border-editor-border">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-foreground">Animation</span><Switch checked={state.animation.enabled} onCheckedChange={(v) => updateState({ animation: { ...state.animation, enabled: v } })} /></div>
                  <AnimatePresence>
                    {state.animation.enabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                          <div className="flex justify-between text-[11px] text-muted-foreground"><span>Duration</span><span className="font-mono">{state.animation.duration}s</span></div>
                          <AnimatedSlider value={[state.animation.duration]} onValueChange={(v) => updateState({ animation: { ...state.animation, duration: v[0] } })} min={0.5} max={10} step={0.5} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-3 bg-editor-surface rounded-xl p-4 border border-editor-border">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-foreground">Noise Overlay</span><Switch checked={state.noiseEnabled} onCheckedChange={(v) => updateState({ noiseEnabled: v })} /></div>
                  <AnimatePresence>
                    {state.noiseEnabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                          <div className="flex justify-between text-[11px] text-muted-foreground"><span>Intensity</span><span className="font-mono">{Math.round(state.noiseIntensity * 100)}%</span></div>
                          <AnimatedSlider value={[state.noiseIntensity]} onValueChange={(v) => updateState({ noiseIntensity: v[0] })} max={1} step={0.01} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Live CSS Editor</span>
                  {cssOverride && (
                    <button onClick={() => setCssOverride(null)} className="text-[10px] font-medium bg-destructive/10 text-destructive px-2.5 py-1 rounded-lg border border-destructive/20 flex items-center gap-1.5 hover:bg-destructive/20 transition-all">
                      <RefreshCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
                <textarea
                  value={cssOverride ?? exportAsCSS(state)}
                  onChange={(e) => setCssOverride(e.target.value)}
                  className="w-full h-[300px] bg-background p-4 rounded-xl font-mono text-xs text-muted-foreground leading-relaxed outline-none border border-border focus:border-primary/30 resize-none transition-colors"
                  spellCheck={false}
                />
                <p className="text-[10px] text-editor-text-dim font-medium">Edit CSS directly. Slider changes reset manual edits.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="pt-4 border-t border-border/40 flex flex-col gap-4">
          <TemplateBrowser onLoad={handleLoadBuiltIn} />

          <div className="space-y-2">
            {showPresetInput ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); setShowPresetInput(false); toast.success("Preset saved!"); } }}
                  placeholder="Preset name..." className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary/40 transition-colors font-medium" autoFocus
                />
                <button onClick={() => { if (presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); setShowPresetInput(false); toast.success("Preset saved!"); } }} className="px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-xl text-sm font-bold text-primary-foreground transition-colors">Save</button>
                <button onClick={() => setShowPresetInput(false)} className="px-3 py-2.5 bg-secondary hover:bg-accent rounded-xl text-muted-foreground transition-colors">✕</button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPresetInput(true)}
                className="w-full px-4 py-2.5 bg-editor-surface hover:bg-editor-surface-hover border border-editor-border hover:border-editor-border-hover rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Save className="w-3.5 h-3.5" /> Save Preset
              </motion.button>
            )}
            <PresetManagerUI
              presets={presetManager.presets}
              onLoad={(id: string) => { const l = presetManager.loadPreset(id); if (l) { onStateChange(l); toast.success("Preset loaded!"); } }}
              onDelete={presetManager.deletePreset} onToggleFavorite={presetManager.toggleFavorite}
              onExport={presetManager.exportPresets} onImport={presetManager.importPresets}
            />
          </div>
        </div>
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} state={state} cssOverride={cssOverride} />
    </>
  );
}
