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
                  "group flex items-center gap-2 p-2.5 rounded-xl text-xs cursor-pointer border transition-all relative overflow-hidden",
                  selectedId === layer.id
                    ? "bg-secondary/80 border-primary/20 text-foreground shadow-sm backdrop-blur-md"
                    : "bg-transparent border-transparent hover:bg-editor-surface hover:border-editor-border text-muted-foreground"
                )}
              >
                {/* Active indicator */}
                <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1/2 rounded-full bg-primary" initial={false}
                  animate={{ opacity: selectedId === layer.id ? 1 : 0, scaleY: selectedId === layer.id ? 1 : 0.4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }} />

                <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => moveLayer(layer.id, "up", e)} disabled={ri >= layers.length - 1} className="text-editor-text-dim hover:text-foreground disabled:opacity-0 transition-all"><ChevronUp className="w-2.5 h-2.5" /></button>
                  <button onClick={(e) => moveLayer(layer.id, "down", e)} disabled={ri <= 0} className="text-editor-text-dim hover:text-foreground disabled:opacity-0 transition-all"><ChevronDown className="w-2.5 h-2.5" /></button>
                </div>

                <button onClick={(e) => toggleVis(layer.id, e)} className="text-editor-text-dim hover:text-foreground transition-colors ml-0.5">
                  {layer.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-editor-text-muted" />}
                </button>

                <motion.div
                  className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10 shadow-sm relative overflow-hidden"
                  style={{ backgroundColor: layer.color }}
                  layoutId={`lc-${layer.id}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/20 pointer-events-none" />
                </motion.div>

                <span className={cn("flex-1 text-[11px] font-medium truncate transition-colors", selectedId === layer.id ? "text-foreground" : "text-muted-foreground")}>
                  {layer.name}
                </span>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                  <button onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }} className="p-1 rounded-md hover:bg-editor-surface-hover hover:text-primary transition-all shadow-none"><CopyPlus className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onRemove(layer.id); }} className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all shadow-none"><Trash2 className="w-3 h-3" /></button>
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
    <div className="w-[260px] flex-shrink-0 glass-surface rounded-2xl flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Branding */}
      <div className="p-4 pb-3 border-b border-glass-border/40">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight text-foreground">Glow Editor</span>
            <span className="ml-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">v2</span>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-0.5">
          <ActionBtn onClick={handleRandomize} title="Randomize" accent><Shuffle className="w-3.5 h-3.5" /></ActionBtn>
          <ActionBtn onClick={onUndo} disabled={!canUndo} title="Undo"><Undo2 className="w-3.5 h-3.5" /></ActionBtn>
          <ActionBtn onClick={onRedo} disabled={!canRedo} title="Redo"><Redo2 className="w-3.5 h-3.5" /></ActionBtn>
          <div className="flex-1" />
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onOpenExport}
            className="h-7 px-3 text-[10px] font-semibold bg-primary/10 border border-primary/20 rounded-lg text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5">
            <Code className="w-3 h-3" /> Export
          </motion.button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-3 space-y-4">
        {/* Master Power */}
        <div className="flex items-center justify-between bg-editor-surface rounded-xl px-3 py-2.5 border border-editor-border">
          <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Master</span>
          <Switch checked={state.power} onCheckedChange={(v) => updateState({ power: v })} />
        </div>

        {/* Theme */}
        <Select value={state.themeMode} onValueChange={(v: "dark" | "light") => updateState({ themeMode: v })}>
          <SelectTrigger className="h-8 text-[10px] bg-editor-surface border-editor-border rounded-xl font-medium"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="dark">Dark Mode</SelectItem>
            <SelectItem value="light">Light Mode</SelectItem>
          </SelectContent>
        </Select>

        {/* Layers */}
        <LayerManager
          layers={state.layers} selectedId={state.selectedLayerId}
          onSelect={(id) => updateState({ selectedLayerId: id })}
          onUpdate={(layers) => updateState({ layers })}
          onAdd={handleAddLayer} onRemove={handleRemoveLayer} onDuplicate={handleDuplicate}
        />

        {/* Templates */}
        <TemplateBrowser onLoad={handleLoadBuiltIn} />

        {/* Preset save */}
        <div className="space-y-2 pt-2 border-t border-glass-border/30">
          {showPresetInput ? (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-1.5">
              <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); setShowPresetInput(false); toast.success("Preset saved!"); } }}
                placeholder="Name..." className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-[10px] text-foreground outline-none focus:border-primary/40 transition-colors font-medium" autoFocus />
              <button onClick={() => { if (presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); setShowPresetInput(false); toast.success("Preset saved!"); } }}
                className="px-3 py-2 bg-primary hover:bg-primary/90 rounded-lg text-[10px] font-bold text-primary-foreground transition-colors">Save</button>
              <button onClick={() => setShowPresetInput(false)} className="px-2 py-2 bg-secondary hover:bg-accent rounded-lg text-muted-foreground transition-colors text-[10px]">✕</button>
            </motion.div>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowPresetInput(true)}
              className="w-full px-3 py-2 bg-editor-surface hover:bg-editor-surface-hover border border-editor-border hover:border-editor-border-hover rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Save className="w-3 h-3" /> Save Preset
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
  );
}
