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

function ActionBtn({ onClick, disabled, children, title, accent }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; title?: string; accent?: boolean }) {
  return (
    <motion.button
      onClick={onClick} disabled={disabled} title={title}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn("p-2 rounded-lg transition-all duration-150 disabled:opacity-20", accent ? "text-primary hover:bg-primary/10" : "text-editor-text-dim hover:text-foreground hover:bg-editor-surface-hover")}
    >
      {children}
    </motion.button>
  );
}

// ── Layer Manager ─────────────────────────────────────────────────────────────

function LayerManager({ layers, selectedId, onSelect, onUpdate, onAdd, onRemove, onDuplicate }: {
  layers: GlowLayer[]; selectedId: string | null; onSelect: (id: string) => void;
  onUpdate: (layers: GlowLayer[]) => void; onAdd: () => void; onRemove: (id: string) => void; onDuplicate: (id: string) => void;
}) {
  const toggleVis = (id: string, e: React.MouseEvent) => { e.stopPropagation(); onUpdate(layers.map((l) => l.id === id ? { ...l, active: !l.active } : l)); };
  const moveLayer = (id: string, dir: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = layers.findIndex((l) => l.id === id);
    const nIdx = dir === "up" ? idx + 1 : idx - 1;
    if (nIdx < 0 || nIdx >= layers.length) return;
    const nl = [...layers]; [nl[idx], nl[nIdx]] = [nl[nIdx], nl[idx]]; onUpdate(nl);
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
                <motion.div className="w-0.5 h-5 rounded-full bg-primary flex-shrink-0" initial={false}
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
                <span className="flex-1 text-[11px] font-medium truncate">{layer.name}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }} className="p-0.5 rounded hover:text-primary transition-colors"><CopyPlus className="w-2.5 h-2.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onRemove(layer.id); }} className="p-0.5 rounded hover:text-destructive transition-colors"><Trash2 className="w-2.5 h-2.5" /></button>
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
            <div className="relative focus-glow rounded-lg">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-editor-text-dim" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="w-full pl-6 pr-2 py-1.5 text-[10px] bg-editor-surface border border-editor-border rounded-lg text-foreground outline-none focus:border-editor-border-hover transition-colors" />
            </div>
          )}
          <div className="flex gap-1.5">
            <button onClick={() => fileRef.current?.click()} className="flex-1 py-1.5 text-[9px] font-medium bg-editor-surface border border-editor-border rounded-lg text-muted-foreground hover:text-foreground hover:border-editor-border-hover transition-all">Import</button>
            <button onClick={onExport} className="flex-1 py-1.5 text-[9px] font-medium bg-editor-surface border border-editor-border rounded-lg text-muted-foreground hover:text-foreground hover:border-editor-border-hover transition-all">Export</button>
          </div>
          <input ref={fileRef} type="file" accept=".json" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); e.target.value = ""; }} className="hidden" />
          <div className="max-h-[140px] overflow-y-auto space-y-0.5 custom-scrollbar">
            {favs.length > 0 && <span className="text-[8px] text-editor-text-dim uppercase tracking-widest font-semibold">Favorites</span>}
            {favs.map((p: any) => (
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
            {rest.map((p: any) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-2 bg-editor-surface/50 rounded-lg border border-transparent hover:border-editor-border group transition-all">
                <MiniPresetPreview state={p.state} />
                <span className="flex-1 text-[10px] text-foreground/80 font-medium truncate">{p.name}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onToggleFavorite(p.id)} className="p-0.5 hover:text-amber-400 text-editor-text-dim rounded"><Star className="w-2.5 h-2.5" /></button>
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

  const handleRandomize = () => { onStateChange(generateRandomGlow()); toast.success("Randomized!"); };

  const handleLoadBuiltIn = (s: GlowState) => onStateChange(s);

  return (
    <div className="w-[280px] flex-shrink-0 glass-surface rounded-3xl flex flex-col max-h-[calc(100vh-1.5rem)] overflow-hidden m-1.5 border-white/5 shadow-2xl">
      {/* Branding */}
      <div className="p-5 pb-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center relative group overflow-hidden">
              <div className="absolute inset-0 bg-primary/20 blur-md group-hover:bg-primary/40 transition-colors" />
              <div className="w-3.5 h-3.5 rounded-full bg-primary relative z-10 shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">GLOW</span>
              <span className="text-[9px] font-medium text-primary/80 uppercase tracking-[0.1em] mt-0.5">Editor Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ActionBtn onClick={onUndo} disabled={!canUndo} title="Undo"><Undo2 className="w-4 h-4" /></ActionBtn>
            <ActionBtn onClick={onRedo} disabled={!canRedo} title="Redo"><Redo2 className="w-4 h-4" /></ActionBtn>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleRandomize}
            className="flex-1 h-9 px-3 text-[11px] font-bold bg-white/[0.05] border border-white/5 rounded-xl text-white hover:bg-white/[0.1] hover:border-white/10 transition-all flex items-center justify-center gap-2">
            <Shuffle className="w-3.5 h-3.5 text-primary" /> Random
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onOpenExport}
            className="h-9 px-4 text-[11px] font-bold bg-primary text-black rounded-xl hover:bg-primary/90 transition-all shadow-[0_4px_16px_rgba(var(--primary),0.2)] flex items-center gap-2">
            <Code className="w-3.5 h-3.5" /> Export
          </motion.button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {/* Master Power & Theme */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-3 border border-white/5 hover:border-white/10 transition-all group">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">Power</span>
              <span className="text-[9px] text-muted-foreground mt-1">Master Toggle</span>
            </div>
            <Switch checked={state.power} onCheckedChange={(v) => updateState({ power: v })} className="data-[state=checked]:bg-primary" />
          </div>

          <Select value={state.themeMode} onValueChange={(v: "dark" | "light") => updateState({ themeMode: v })}>
            <SelectTrigger className="h-10 text-[11px] bg-white/[0.03] border-white/5 rounded-2xl font-bold hover:border-white/10 transition-all focus:ring-primary/20"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-editor-surface border-white/10 backdrop-blur-xl">
              <SelectItem value="dark" className="text-[11px] font-bold">Dark Aesthetics</SelectItem>
              <SelectItem value="light" className="text-[11px] font-bold">Light Aesthetic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Layers Section */}
        <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 space-y-4">
          <LayerManager
            layers={state.layers} selectedId={state.selectedLayerId}
            onSelect={(id) => updateState({ selectedLayerId: id })}
            onUpdate={(layers) => updateState({ layers })}
            onAdd={handleAddLayer} onRemove={handleRemoveLayer} onDuplicate={handleDuplicate}
          />
        </div>

        {/* Templates Section */}
        <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 space-y-4">
          <TemplateBrowser onLoad={handleLoadBuiltIn} />
        </div>

        {/* Presets Section */}
        <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 space-y-4">
          <div className="space-y-3">
            {showPresetInput ? (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); setShowPresetInput(false); toast.success("Preset saved!"); } }}
                  placeholder="Enter preset name..." className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[11px] text-white outline-none focus:border-primary/40 transition-all font-bold" autoFocus />
                <div className="flex gap-2">
                  <button onClick={() => { if (presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); setShowPresetInput(false); toast.success("Preset saved!"); } }}
                    className="flex-1 py-2 bg-primary hover:bg-primary/90 rounded-xl text-[11px] font-bold text-black transition-all">Save Preset</button>
                  <button onClick={() => setShowPresetInput(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all text-[11px] font-bold">✕</button>
                </div>
              </motion.div>
            ) : (
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => setShowPresetInput(true)}
                className="w-full h-10 px-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 text-white/70 hover:text-white group">
                <Save className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" /> Create Preset
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

      {/* Footer / Status */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between opacity-50">
        <span className="text-[9px] font-bold text-white/60 tracking-wider">BUILDER FUSION</span>
        <span className="text-[9px] font-mono text-white/40">v2.0.26</span>
      </div>
    </div>
  );
}
