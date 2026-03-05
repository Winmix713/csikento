import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Undo2, Redo2, Save, FolderOpen, Plus, Trash2, Eye, EyeOff,
  Layers, Sparkles, Shuffle, CopyPlus, Star, Search, Code,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import type { GlowState, GlowLayer } from "@/lib/glow-types";
import { BUILT_IN_PRESETS, PRESET_CATEGORIES } from "@/lib/glow-presets";
import { duplicateLayer, generateRandomGlow } from "@/lib/glow-utils";

// ── Design tokens — GLOW palette (matches HTML reference) ─────────────────────
const GLOW = {
  primary: "#A8FF50",
  primaryDim: "rgba(168,255,80,0.14)",
  primaryTint: "rgba(168,255,80,0.07)",
  primaryGlow: "rgba(168,255,80,0.28)",
  primaryRing: "rgba(168,255,80,0.30)",
};

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function MiniPresetPreview({ state }: { state: GlowState }) {
  const colors = state.layers.filter((l) => l.active).slice(0, 4).map((l) => l.color);
  return (
    <div className="w-9 h-7 rounded-lg overflow-hidden relative border border-editor-border bg-background flex-shrink-0">
      {colors.map((c, i) => (
        <div key={i} className="absolute rounded-full" style={{ backgroundColor: c, width: "55%", height: "55%", top: `${10 + i * 8}%`, left: `${10 + i * 12}%`, filter: "blur(3px)", opacity: 0.7 }} />
      ))}
    </div>
  );
}

// ── Layer Manager ─────────────────────────────────────────────────────────────

function LayerManager({ layers, selectedId, onSelect, onUpdate, onAdd, onRemove, onDuplicate }: {
  layers: GlowLayer[]; selectedId: string | null; onSelect: (id: string) => void;
  onUpdate: (layers: GlowLayer[]) => void; onAdd: () => void; onRemove: (id: string) => void; onDuplicate: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const toggleVis = (id: string, e: React.MouseEvent) => { e.stopPropagation(); onUpdate(layers.map((l) => l.id === id ? { ...l, active: !l.active } : l)); };
  const moveLayer = (id: string, dir: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = layers.findIndex((l) => l.id === id);
    const nIdx = dir === "up" ? idx + 1 : idx - 1;
    if (nIdx < 0 || nIdx >= layers.length) return;
    const nl = [...layers];[nl[idx], nl[nIdx]] = [nl[nIdx], nl[idx]]; onUpdate(nl);
  };

  const startEditing = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(name);
  };

  const saveName = (id: string) => {
    if (editName.trim()) {
      onUpdate(layers.map(l => l.id === id ? { ...l, name: editName.trim() } : l));
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-editor-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3 h-3" /> Layers
          <span className="text-[9px] font-mono text-editor-text-dim bg-editor-surface px-1.5 py-0.5 rounded">{layers.length}</span>
        </span>
        <motion.button onClick={onAdd} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 rounded-lg hover:bg-editor-surface-hover text-editor-text-dim hover:text-foreground transition-all">
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>
      <div className="space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-0.5">
        <AnimatePresence mode="popLayout">
          {[...layers].reverse().map((layer, di) => {
            const ri = layers.length - 1 - di;
            return (
              <motion.div key={layer.id} layout
                initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -16 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={() => onSelect(layer.id)}
                className={cn(
                  "group flex items-center gap-1.5 p-2 rounded-xl text-xs cursor-pointer border transition-all",
                  selectedId === layer.id
                    ? "bg-secondary border-editor-border-hover text-foreground shadow-sm"
                    : "bg-transparent border-transparent hover:bg-editor-surface hover:border-editor-border text-muted-foreground"
                )}
              >
                <motion.div className="w-0.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: GLOW.primary }} initial={false}
                  animate={{ opacity: selectedId === layer.id ? 1 : 0, scaleY: selectedId === layer.id ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                <div className="flex flex-col gap-0.5">
                  <button onClick={(e) => moveLayer(layer.id, "up", e)} disabled={ri >= layers.length - 1} className="text-editor-text-dim hover:text-foreground disabled:opacity-15 transition-colors"><ChevronUp className="w-2.5 h-2.5" /></button>
                  <button onClick={(e) => moveLayer(layer.id, "down", e)} disabled={ri <= 0} className="text-editor-text-dim hover:text-foreground disabled:opacity-15 transition-colors"><ChevronDown className="w-2.5 h-2.5" /></button>
                </div>
                <button onClick={(e) => toggleVis(layer.id, e)} className="text-editor-text-dim hover:text-foreground transition-colors">
                  {layer.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <motion.div className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-editor-border" style={{ backgroundColor: layer.color }} layoutId={`lc-${layer.id}`} />

                {editingId === layer.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => saveName(layer.id)}
                    onKeyDown={(e) => e.key === "Enter" && saveName(layer.id)}
                    className="flex-1 bg-black/40 border-none outline-none text-[11px] font-bold text-white px-1 rounded"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 text-[11px] font-medium truncate"
                    onDoubleClick={(e) => startEditing(layer.id, layer.name, e)}
                  >
                    {layer.name}
                  </span>
                )}

                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }} className="p-0.5 rounded transition-colors" style={{ color: "inherit" }} onMouseEnter={e => (e.currentTarget.style.color = GLOW.primary)} onMouseLeave={e => (e.currentTarget.style.color = "")}><CopyPlus className="w-2.5 h-2.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onRemove(layer.id); }} className="p-0.5 rounded hover:text-destructive text-editor-text-dim transition-colors"><Trash2 className="w-2.5 h-2.5" /></button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Template Browser ──────────────────────────────────────────────────────────

function TemplateBrowser({ onLoad }: { onLoad: (s: GlowState) => void }) {
  const [cat, setCat] = useState("all");
  const filtered = cat === "all" ? BUILT_IN_PRESETS : BUILT_IN_PRESETS.filter((p) => p.categoryId === cat);
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold text-editor-text-muted uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Templates</span>
      <div className="flex gap-1 flex-wrap">
        {[{ id: "all", name: "All", emoji: "" }, ...PRESET_CATEGORIES].map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={cn("px-2 py-0.5 text-[9px] font-medium rounded-md border transition-all",
              cat === c.id ? "bg-secondary border-editor-border-hover text-foreground" : "border-editor-border text-editor-text-dim hover:text-muted-foreground hover:border-editor-border-hover"
            )}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-0.5">
        <AnimatePresence mode="popLayout">
          {filtered.map((bp) => (
            <motion.button key={bp.id} layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}
              onClick={() => { onLoad(bp.state); toast.success(`Loaded "${bp.name}"`); }}
              className="py-2 px-1.5 bg-editor-surface/50 hover:bg-editor-surface border border-editor-border hover:border-editor-border-hover rounded-lg text-[9px] font-medium text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-1"
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

// ── Preset Manager ────────────────────────────────────────────────────────────

function PresetManagerUI({ presets, onLoad, onDelete, onToggleFavorite, onExport, onImport }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = presets.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));
  const favs = filtered.filter((p: any) => p.favorite);
  const rest = filtered.filter((p: any) => !p.favorite);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full text-[10px] font-semibold text-editor-text-dim hover:text-muted-foreground transition-colors pt-1">
          <span className="flex items-center gap-1.5"><FolderOpen className="w-3 h-3" /> My Presets ({presets.length})</span>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}><ChevronDown className="w-3 h-3" /></motion.span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="mt-2 space-y-2">
          {presets.length > 3 && (
            <div className="relative rounded-lg">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-editor-text-dim" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="w-full pl-6 pr-2 py-1.5 text-[10px] bg-editor-surface border border-editor-border rounded-lg text-foreground outline-none transition-colors"
                style={{ "--focus-border": GLOW.primaryRing } as React.CSSProperties}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(168,255,80,0.38)")}
                onBlur={e => (e.currentTarget.style.borderColor = "")}
              />
            </div>
          )}
          <div className="flex gap-1.5">
            <button onClick={() => fileRef.current?.click()} className="flex-1 py-1.5 text-[9px] font-medium bg-editor-surface border border-editor-border rounded-lg text-muted-foreground hover:text-foreground hover:border-editor-border-hover transition-all">Import</button>
            <button onClick={onExport} className="flex-1 py-1.5 text-[9px] font-medium bg-editor-surface border border-editor-border rounded-lg text-muted-foreground hover:text-foreground hover:border-editor-border-hover transition-all">Export</button>
          </div>
          <input ref={fileRef} type="file" accept=".json" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); e.target.value = ""; }} className="hidden" />
          <div className="max-h-[140px] overflow-y-auto space-y-0.5 custom-scrollbar">
            {favs.length > 0 && <span className="text-[8px] text-editor-text-dim uppercase tracking-widest font-semibold">Favorites</span>}
            {[...favs, ...rest].map((p: any) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-2 bg-editor-surface/50 rounded-lg border border-transparent hover:border-editor-border group transition-all">
                <MiniPresetPreview state={p.state} />
                <span className="flex-1 text-[10px] text-foreground/80 font-medium truncate">{p.name}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onToggleFavorite(p.id)} className={cn("p-0.5 transition-colors rounded", p.favorite ? "text-amber-400" : "hover:text-amber-400 text-editor-text-dim")}><Star className="w-2.5 h-2.5" fill={p.favorite ? "currentColor" : "none"} /></button>
                  <button onClick={() => onLoad(p.id)} className="p-0.5 hover:text-foreground text-editor-text-dim rounded"><FolderOpen className="w-2.5 h-2.5" /></button>
                  <button onClick={() => onDelete(p.id)} className="p-0.5 hover:text-destructive text-editor-text-dim rounded"><Trash2 className="w-2.5 h-2.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEFT SIDEBAR EXPORT
// ══════════════════════════════════════════════════════════════════════════════

interface LeftSidebarProps {
  state: GlowState;
  onStateChange: (s: GlowState) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSavePreset: (name: string) => void;
  presetManager: any;
  onOpenExport: () => void;
}

export function LeftSidebar({
  state, onStateChange, onUndo, onRedo, canUndo, canRedo, onSavePreset, presetManager, onOpenExport,
}: LeftSidebarProps) {
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [exportState, setExportState] = useState<"idle" | "loading" | "success">("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [randomSpin, setRandomSpin] = useState(false);

  const updateState = (u: Partial<GlowState>) => onStateChange({ ...state, ...u });

  const handleAddLayer = () => {
    const nl: GlowLayer = { id: `layer-${Date.now()}`, name: "New Layer", active: true, color: "#ffffff", blur: 50, opacity: 0.5, width: 200, height: 200, x: 0, y: 0, blendMode: "screen" };
    updateState({ layers: [...state.layers, nl], selectedLayerId: nl.id });
  };

  const handleRemoveLayer = (id: string) => {
    if (state.layers.length <= 1) return;
    const nl = state.layers.filter((l) => l.id !== id);
    updateState({ layers: nl, selectedLayerId: nl[0].id });
  };

  const handleDuplicate = (id: string) => {
    const l = state.layers.find((x) => x.id === id);
    if (!l) return;
    const d = duplicateLayer(l);
    updateState({ layers: [...state.layers, d], selectedLayerId: d.id });
    toast.success("Layer duplicated");
  };

  const handleRandomize = () => {
    setRandomSpin(true);
    setTimeout(() => setRandomSpin(false), 440);
    onStateChange(generateRandomGlow());
    toast.success("Randomized!");
  };

  const handleExport = () => {
    if (exportState !== "idle") return;
    setExportState("loading");
    onOpenExport();
    setTimeout(() => {
      setExportState("success");
      setTimeout(() => setExportState("idle"), 1800);
    }, 1400);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText("/* Copied from GLOW Editor */").catch(() => { });
    setCopyState("copied");
    toast.success("CSS copied!");
    setTimeout(() => setCopyState("idle"), 1800);
  };

  const handleLoadBuiltIn = (s: GlowState) => onStateChange(s);

  // ── Master toggle state ──
  const masterOn = state.power;

  return (
    <div
      className="w-[280px] flex-shrink-0 rounded-3xl flex flex-col max-h-[calc(100vh-1.5rem)] overflow-hidden m-1.5 shadow-2xl border"
      style={{
        background: "linear-gradient(130deg, rgba(255,255,255,0.042) 0%, transparent 42%), linear-gradient(220deg, rgba(168,255,80,0.022) 0%, transparent 50%), rgba(255,255,255,0.018)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderColor: "rgba(255,255,255,0.05)",
        boxShadow: "0 28px 48px -14px rgba(0,0,0,0.85), 0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.22)",
      }}
    >

      {/* ══ HEADER — GLOW reference layout ══ */}
      <div
        className="flex flex-col gap-3 border-b"
        style={{
          padding: "16px 16px 14px",
          background: "rgba(255,255,255,0.016)",
          borderColor: "rgba(255,255,255,0.05)",
        }}
      >
        {/* Row 1: Logo + Undo/Redo */}
        <div className="flex items-center justify-between">
          {/* Logo group */}
          <div className="flex items-center gap-2.5">
            <div
              className="relative w-8 h-8 flex items-center justify-center rounded-[14px] overflow-hidden"
              style={{ background: GLOW.primaryDim }}
            >
              {/* Inner glow blur */}
              <div
                className="absolute inset-0 transition-colors duration-200"
                style={{ background: GLOW.primaryDim, filter: "blur(10px)" }}
              />
              {/* Dot */}
              <span
                className="relative z-10 w-[13px] h-[13px] rounded-full"
                style={{
                  background: GLOW.primary,
                  boxShadow: `0 0 12px rgba(168,255,80,0.65), 0 0 4px rgba(168,255,80,0.90)`,
                }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[13px] font-bold tracking-[0.07em] leading-none"
                style={{ color: "rgba(255,255,255,0.97)" }}
              >
                GLOW
              </span>
              <span
                className="font-mono text-[8px] font-medium tracking-[0.11em] uppercase leading-none"
                style={{ color: "rgba(168,255,80,0.72)" }}
              >
                Editor Studio
              </span>
            </div>
          </div>

          {/* Undo / Redo icon buttons */}
          <div className="flex items-center gap-0.5" role="toolbar" aria-label="History">
            {/* Undo */}
            <motion.button
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
              whileTap={{ scale: 0.87 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg border-none outline-none transition-all group"
              style={{
                background: "transparent",
                color: !canUndo ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.38)",
                cursor: !canUndo ? "not-allowed" : "pointer",
                opacity: !canUndo ? 0.22 : 1,
              }}
              onMouseEnter={e => { if (canUndo) { e.currentTarget.style.color = "rgba(255,255,255,0.97)"; e.currentTarget.style.background = "rgba(255,255,255,0.052)"; } }}
              onMouseLeave={e => { e.currentTarget.style.color = !canUndo ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.38)"; e.currentTarget.style.background = "transparent"; }}
            >
              {/* Tooltip */}
              <span
                className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2 py-1 rounded pointer-events-none whitespace-nowrap font-mono text-[9px] font-medium tracking-[0.02em] opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: "rgba(8,8,8,0.98)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.60)", boxShadow: "0 4px 14px rgba(0,0,0,0.36)" }}
              >
                Undo
              </span>
              <Undo2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
            </motion.button>

            {/* Redo */}
            <motion.button
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
              whileTap={{ scale: 0.87 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg border-none outline-none transition-all group"
              style={{
                background: "transparent",
                color: !canRedo ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.38)",
                cursor: !canRedo ? "not-allowed" : "pointer",
                opacity: !canRedo ? 0.22 : 1,
              }}
              onMouseEnter={e => { if (canRedo) { e.currentTarget.style.color = "rgba(255,255,255,0.97)"; e.currentTarget.style.background = "rgba(255,255,255,0.052)"; } }}
              onMouseLeave={e => { e.currentTarget.style.color = !canRedo ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.38)"; e.currentTarget.style.background = "transparent"; }}
            >
              <span
                className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2 py-1 rounded pointer-events-none whitespace-nowrap font-mono text-[9px] font-medium tracking-[0.02em] opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: "rgba(8,8,8,0.98)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.60)", boxShadow: "0 4px 14px rgba(0,0,0,0.36)" }}
              >
                Redo
              </span>
              <Redo2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
            </motion.button>
          </div>
        </div>

        {/* Row 2: Random (ghost, flex-1) + Export (primary lime CTA) */}
        <div className="flex items-center gap-2">
          {/* Random button — ghost style */}
          <motion.button
            onClick={handleRandomize}
            aria-label="Randomize"
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex flex-1 items-center justify-center gap-[7px] h-9 px-3 rounded-2xl border outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.034)",
              borderColor: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.60)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.22)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.015em",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.060)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.97)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.034)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.60)"; }}
          >
            <motion.span
              animate={{ rotate: randomSpin ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex-shrink-0"
            >
              <Shuffle className="w-[14px] h-[14px]" style={{ color: GLOW.primary }} strokeWidth={2} />
            </motion.span>
            Random
          </motion.button>

          {/* Export button — primary lime fill */}
          <motion.button
            onClick={handleExport}
            disabled={exportState === "loading"}
            aria-label="Export"
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative overflow-hidden flex items-center gap-[7px] h-9 px-4 rounded-2xl border-none outline-none transition-all"
            style={{
              background: exportState === "success"
                ? "#00C26A"
                : exportState === "loading"
                  ? "rgba(168,255,80,0.58)"
                  : GLOW.primary,
              color: exportState === "success" ? "#fff" : "#0A0A0A",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.015em",
              whiteSpace: "nowrap",
              boxShadow: exportState === "success"
                ? "0 4px 16px rgba(0,194,106,0.36), inset 0 1px 0 rgba(255,255,255,0.22)"
                : `0 4px 16px ${GLOW.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.28)`,
              opacity: exportState === "loading" ? 0.8 : 1,
              cursor: exportState === "loading" ? "not-allowed" : "pointer",
            }}
            onMouseEnter={e => { if (exportState === "idle") { e.currentTarget.style.background = "#bfff6a"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(168,255,80,0.45), inset 0 1px 0 rgba(255,255,255,0.32)"; } }}
            onMouseLeave={e => { if (exportState === "idle") { e.currentTarget.style.background = GLOW.primary; e.currentTarget.style.boxShadow = `0 4px 16px ${GLOW.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.28)`; } }}
          >
            {/* Shine sweep */}
            <motion.span
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              initial={{ x: "-110%", skewX: "-15deg" }}
              whileHover={{ x: "160%" }}
              transition={{ duration: 0.4 }}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.26), transparent)",
                width: "60%",
              }}
            />

            {exportState === "loading" ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}>
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" strokeDasharray="26 10" />
                </svg>
              </motion.span>
            ) : exportState === "success" ? (
              <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <Code className="w-[14px] h-[14px] flex-shrink-0" strokeWidth={2.2} />
            )}

            <span>
              {exportState === "loading" ? "Exporting…" : exportState === "success" ? "Done" : "Export"}
            </span>
          </motion.button>
        </div>
      </div>

      {/* ══ MASTER POWER TOGGLE ══ */}
      <div className="border-b" style={{ padding: "14px 16px", borderColor: "rgba(255,255,255,0.05)" }}>
        <div
          className="flex items-center justify-between gap-3 rounded-xl border transition-all duration-300"
          style={{
            padding: "11px 13px",
            background: masterOn ? "rgba(168,255,80,0.07)" : "rgba(255,255,255,0.034)",
            borderColor: masterOn ? "rgba(168,255,80,0.18)" : "rgba(255,255,255,0.05)",
            boxShadow: masterOn
              ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(168,255,80,0.08)"
              : "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.22)",
          }}
        >
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.09em] leading-none"
              style={{ color: "rgba(255,255,255,0.97)" }}
            >
              Power
            </span>
            <span
              className="font-mono text-[9px] tracking-[0.03em] transition-colors duration-200"
              style={{ color: masterOn ? "rgba(168,255,80,0.62)" : "rgba(255,255,255,0.38)" }}
            >
              {masterOn ? "Master Toggle" : "Effects paused"}
            </span>
          </div>

          {/* GLOW-style toggle: 44×24, lime track, dark thumb when checked */}
          <div className="relative flex-shrink-0" style={{ width: 44, height: 24 }}>
            <input
              type="checkbox"
              id="masterToggleGlow"
              checked={masterOn}
              onChange={e => updateState({ power: e.target.checked })}
              className="absolute opacity-0 w-0 h-0"
            />
            <label
              htmlFor="masterToggleGlow"
              className="block cursor-pointer rounded-full transition-all duration-300"
              style={{
                width: 44,
                height: 24,
                background: masterOn ? GLOW.primary : "rgba(255,255,255,0.10)",
                border: masterOn ? `2px solid rgba(168,255,80,0.35)` : "2px solid transparent",
                boxShadow: masterOn
                  ? `0 0 0 3px rgba(168,255,80,0.12)`
                  : "inset 0 1px 3px rgba(0,0,0,0.42)",
                position: "relative",
              }}
            >
              <span
                className="absolute top-[2px] rounded-full transition-all"
                style={{
                  width: 16,
                  height: 16,
                  background: masterOn ? "#0A0A0A" : "rgba(255,255,255,0.48)",
                  boxShadow: masterOn ? "0 2px 6px rgba(0,0,0,0.55)" : "0 1px 4px rgba(0,0,0,0.42)",
                  transform: masterOn ? "translateX(22px)" : "translateX(2px)",
                  transitionDuration: "280ms",
                  transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* ══ COMPONENT PICKER (8-item grid) ══ */}
      <div className="border-b" style={{ padding: "14px 16px", borderColor: "rgba(255,255,255,0.05)" }}>
        <div
          className="font-mono text-[8px] font-medium uppercase tracking-[0.10em] mb-2.5 select-none"
          style={{ color: "rgba(255,255,255,0.20)" }}
        >
          Component
        </div>
        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Component type">
          {[
            { value: "button", label: "Button", icon: <><rect x="3" y="8" width="18" height="8" rx="4" /><line x1="8" y1="12" x2="16" y2="12" /></> },
            { value: "card", label: "Card", icon: <><rect x="3" y="4" width="18" height="16" rx="3" /><line x1="3" y1="9" x2="21" y2="9" /></> },
            { value: "header", label: "Header", icon: <><rect x="2" y="3" width="20" height="5" rx="2" /><line x1="5" y1="5.5" x2="10" y2="5.5" /><circle cx="18" cy="5.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="14.5" cy="5.5" r="1.2" fill="currentColor" stroke="none" /></> },
            { value: "hero", label: "Hero", icon: <><rect x="2" y="3" width="20" height="13" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="9" y1="11" x2="15" y2="11" /><rect x="8" y="19" width="8" height="3" rx="1.5" /></> },
            { value: "input", label: "Input", icon: <><rect x="3" y="8" width="18" height="8" rx="2" /><line x1="7" y1="12" x2="7.01" y2="12" strokeWidth={2.2} /></> },
            { value: "modal", label: "Modal", icon: <><rect x="4" y="5" width="16" height="14" rx="2" /><line x1="4" y1="9" x2="20" y2="9" /><line x1="17" y1="7" x2="17.01" y2="7" strokeWidth={2} /><line x1="14.5" y1="7" x2="14.51" y2="7" strokeWidth={2} /></> },
            { value: "nav", label: "Nav", icon: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></> },
            { value: "badge", label: "Badge", icon: <><rect x="5" y="9" width="14" height="6" rx="3" /><line x1="9" y1="12" x2="15" y2="12" strokeWidth={1.3} /></> },
          ].map(({ value, label, icon }) => {
            const isSelected = (state as any).componentType === value;
            return (
              <label key={value} style={{ position: "relative" }}>
                <input
                  type="radio"
                  name="glowComponent"
                  value={value}
                  checked={isSelected}
                  onChange={() => updateState({ componentType: value } as any)}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
                <motion.span
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex flex-col items-center justify-center gap-[7px] cursor-pointer rounded-2xl border transition-all select-none overflow-hidden"
                  style={{
                    padding: "11px 6px 10px",
                    background: isSelected ? "rgba(168,255,80,0.07)" : "rgba(255,255,255,0.034)",
                    borderColor: isSelected ? "rgba(168,255,80,0.28)" : "rgba(255,255,255,0.05)",
                    boxShadow: isSelected
                      ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(168,255,80,0.10), 0 2px 12px rgba(168,255,80,0.09)"
                      : "inset 0 1px 0 rgba(255,255,255,0.06), inset 1px 2px 10px rgba(255,255,255,0.022)",
                    position: "relative",
                  }}
                >
                  {/* Active dot indicator */}
                  {isSelected && (
                    <span
                      className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full"
                      style={{ background: GLOW.primary, boxShadow: `0 0 6px ${GLOW.primaryGlow}` }}
                    />
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px] flex-shrink-0 transition-colors duration-100"
                    fill="none"
                    stroke={isSelected ? GLOW.primary : "rgba(255,255,255,0.38)"}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {icon}
                  </svg>
                  <span
                    className="font-mono text-[8.5px] font-medium leading-none text-center whitespace-nowrap transition-colors duration-100"
                    style={{ color: isSelected ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.38)" }}
                  >
                    {label}
                  </span>
                </motion.span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ══ CONTROLS ROW: Select + Copy CSS ══ */}
      <div className="border-b" style={{ padding: "14px 16px", borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          {/* Mode select */}
          <div className="relative flex-1">
            <select
              value={state.themeMode}
              onChange={e => updateState({ themeMode: e.target.value as "dark" | "light" })}
              className="w-full h-9 rounded-2xl border outline-none transition-all appearance-none font-bold"
              style={{
                paddingLeft: 12,
                paddingRight: 30,
                background: "rgba(255,255,255,0.034)",
                borderColor: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.60)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.01em",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.22)",
                cursor: "pointer",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(168,255,80,0.38)"; e.currentTarget.style.color = "rgba(255,255,255,0.97)"; e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 2px rgba(168,255,80,0.14)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.60)"; e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.22)"; }}
            >
              <option value="dark" style={{ background: "#111", color: "rgba(255,255,255,0.90)" }}>Dark Aesthetics</option>
              <option value="light" style={{ background: "#111", color: "rgba(255,255,255,0.90)" }}>Light Mode</option>
            </select>
            {/* Chevron arrow */}
            <span className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.20)" }}>
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>

          {/* Copy CSS icon button */}
          <motion.button
            onClick={handleCopy}
            aria-label="Copy CSS"
            whileTap={{ scale: 0.87 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative group flex items-center justify-center flex-shrink-0 rounded-2xl border transition-all outline-none"
            style={{
              width: 36,
              height: 36,
              background: copyState === "copied" ? "rgba(168,255,80,0.07)" : "rgba(255,255,255,0.034)",
              borderColor: copyState === "copied" ? "rgba(168,255,80,0.22)" : "rgba(255,255,255,0.05)",
              color: copyState === "copied" ? GLOW.primary : "rgba(255,255,255,0.38)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
            onMouseEnter={e => { if (copyState === "idle") { e.currentTarget.style.background = "rgba(255,255,255,0.060)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.97)"; } }}
            onMouseLeave={e => { if (copyState === "idle") { e.currentTarget.style.background = "rgba(255,255,255,0.034)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.38)"; } }}
          >
            {/* Tooltip */}
            <span
              className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2 py-1 rounded pointer-events-none whitespace-nowrap font-mono text-[9px] font-medium tracking-[0.02em] opacity-0 group-hover:opacity-100 transition-opacity z-50"
              style={{ background: "rgba(8,8,8,0.98)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.60)", boxShadow: "0 4px 14px rgba(0,0,0,0.36)" }}
            >
              {copyState === "copied" ? "Copied!" : "Copy CSS"}
            </span>
            <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* ══ SCROLLABLE CONTENT (Layers, Templates, Presets) ══ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">

        {/* Layers */}
        <div
          className="rounded-2xl p-4 border space-y-4"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <LayerManager
            layers={state.layers} selectedId={state.selectedLayerId}
            onSelect={(id) => updateState({ selectedLayerId: id })}
            onUpdate={(layers) => updateState({ layers })}
            onAdd={handleAddLayer} onRemove={handleRemoveLayer} onDuplicate={handleDuplicate}
          />
        </div>

        {/* Templates */}
        <div
          className="rounded-2xl p-4 border space-y-4"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <TemplateBrowser onLoad={handleLoadBuiltIn} />
        </div>

        {/* Presets */}
        <div
          className="rounded-2xl p-4 border space-y-4"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="space-y-3">
            {showPresetInput ? (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                <input
                  type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); setShowPresetInput(false); toast.success("Preset saved!"); } }}
                  placeholder="Enter preset name..."
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[11px] text-white outline-none font-bold transition-all"
                  style={{ "--focus-border": GLOW.primaryRing } as React.CSSProperties}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(168,255,80,0.40)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); setShowPresetInput(false); toast.success("Preset saved!"); } }}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-black transition-all"
                    style={{ background: GLOW.primary }}
                  >
                    Save Preset
                  </button>
                  <button onClick={() => setShowPresetInput(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all text-[11px] font-bold">✕</button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => setShowPresetInput(true)}
                className="w-full h-10 px-4 border border-white/5 hover:border-white/10 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 group"
                style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.70)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.97)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(255,255,255,0.70)"; }}
              >
                <Save className="w-3.5 h-3.5 transition-colors" style={{ color: "rgba(168,255,80,0.60)" }} />
                Create Preset
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

      {/* ══ FOOTER ══ */}
      <div
        className="flex items-center justify-between border-t"
        style={{ padding: "12px 16px", background: "rgba(255,255,255,0.016)", borderColor: "rgba(255,255,255,0.05)", opacity: 0.5 }}
      >
        <span className="text-[9px] font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.60)" }}>BUILDER FUSION</span>
        <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.40)" }}>v2.0.26</span>
      </div>

    </div>
  );
}