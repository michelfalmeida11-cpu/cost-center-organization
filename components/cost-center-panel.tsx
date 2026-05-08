"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase, loadCostCenters, saveCostCenters } from "@/lib/supabase";

import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  FolderOpen,
  Folder,
  FileText,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Save,
  AlertTriangle,
  Minus,
  MountainSnow,
  Factory,
  Truck,
  Zap,
  Leaf,
  Building2,
  BarChart2,
  Lock,
} from "lucide-react";
import {
  Process, Group, SubGroup,
  formatBRL, getProcessBudgeted, getProcessRealized,
  getGroupBudgeted, getGroupRealized,
  getVariancePct, PROCESSES,
} from "@/lib/cost-centers";

// ─────────────────────────────────────────────────────────────
//  Icon map
// ─────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ElementType> = {
  "mountain-snow": MountainSnow,
  factory: Factory,
  truck: Truck,
  zap: Zap,
  leaf: Leaf,
  building2: Building2,
  "bar-chart-2": BarChart2,
};

// ─────────────────────────────────────────────────────────────
//  Accent palette
// ─────────────────────────────────────────────────────────────
const ACCENT: Record<string, { c: string; dim: string; bg: string }> = {
  LM:  { c: "oklch(0.75 0.20 185)", dim: "oklch(0.75 0.20 185 / 0.50)", bg: "oklch(0.75 0.20 185 / 0.08)" },
  BEN: { c: "oklch(0.68 0.22 145)", dim: "oklch(0.68 0.22 145 / 0.50)", bg: "oklch(0.68 0.22 145 / 0.08)" },
  INS: { c: "oklch(0.75 0.22 55)",  dim: "oklch(0.75 0.22 55  / 0.50)", bg: "oklch(0.75 0.22 55  / 0.08)" },
  MA:  { c: "oklch(0.70 0.20 155)", dim: "oklch(0.70 0.20 155 / 0.50)", bg: "oklch(0.70 0.20 155 / 0.08)" },
  ADM: { c: "oklch(0.72 0.20 295)", dim: "oklch(0.72 0.20 295 / 0.50)", bg: "oklch(0.72 0.20 295 / 0.08)" },
  LOG: { c: "oklch(0.76 0.20 45)",  dim: "oklch(0.76 0.20 45  / 0.50)", bg: "oklch(0.76 0.20 45  / 0.08)" },
  DEP: { c: "oklch(0.62 0.06 240)", dim: "oklch(0.62 0.06 240 / 0.50)", bg: "oklch(0.62 0.06 240 / 0.08)" },
};

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
/** Parse a BRL-formatted string OR plain number string into a float */
function parseMoney(v: string): number {
  // Remove "R$", non-breaking spaces, thousand-separator dots, then replace decimal comma
  const clean = v
    .replace(/R\$\s*/g, "")
    .replace(/\u00a0/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

// ─────────────────────────────────────────────────────────────
//  Mini execution bar
// ─────────────────────────────────────────────────────────────
function ExecBar({ budgeted, realized, color }: { budgeted: number; realized: number; color: string }) {
  const pct = budgeted > 0 ? Math.min((realized / budgeted) * 100, 110) : 0;
  const over = realized > budgeted;
  const barColor = over ? "oklch(0.65 0.22 25)" : color;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-[3px] rounded-full" style={{ background: "oklch(0.16 0.015 240)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: barColor, boxShadow: `0 0 6px ${barColor}` }}
        />
      </div>
      <span className="text-[9px] font-mono tabular-nums w-8 text-right shrink-0" style={{ color: over ? "oklch(0.65 0.22 25)" : "oklch(0.42 0.03 220)" }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Variance badge
// ─────────────────────────────────────────────────────────────
function VarBadge({ budgeted, realized }: { budgeted: number; realized: number }) {
  const pct = getVariancePct(budgeted, realized);
  const over = pct > 0.5;
  const under = pct < -0.5;
  const Icon = over ? TrendingUp : under ? TrendingDown : Minus;
  const color = over
    ? "oklch(0.65 0.22 25)"
    : under
    ? "oklch(0.68 0.22 145)"
    : "oklch(0.48 0.03 220)";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded whitespace-nowrap"
      style={{
        color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 28%, transparent)`,
      }}
    >
      <Icon className="h-2.5 w-2.5" />
      {over ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
//  Online editable — TEXT (name, code, description, unit)
// ─────────────────────────────────────────────────────────────
function EditableText({
  value,
  onSave,
  accent,
  placeholder = "—",
  className = "",
  disabled = false,
}: {
  value: string;
  onSave: (v: string) => void;
  accent: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when value changes externally
  useEffect(() => { setDraft(value); }, [value]);

  // Auto-focus + select when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed || value);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <span
        className={`group/et inline-flex items-center gap-0.5 rounded px-0.5 -mx-0.5 transition-colors ${className} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-primary/5"}`}
        onClick={disabled ? undefined : (e) => { e.stopPropagation(); setEditing(true); }}
        title={disabled ? "Modo leitura" : "Clique para editar"}
      >
        <span>{value || placeholder}</span>
        <Pencil className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/et:opacity-50 transition-opacity" style={{ color: accent }} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="rounded px-2 py-[3px] text-xs font-mono outline-none min-w-[80px] max-w-[240px]"
        style={{
          background: "var(--input)",
          border: `1px solid ${accent}`,
          color: "var(--foreground)",
          boxShadow: `0 0 8px color-mix(in oklch, ${accent} 25%, transparent)`,
        }}
      />
      <button
        onClick={e => { e.stopPropagation(); commit(); }}
        className="p-0.5 rounded transition-colors hover:bg-green-500/20"
        title="Confirmar (Enter)"
      >
        <Check className="h-3.5 w-3.5" style={{ color: "oklch(0.68 0.22 145)" }} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); cancel(); }}
        className="p-0.5 rounded transition-colors hover:bg-red-500/20"
        title="Cancelar (Esc)"
      >
        <X className="h-3.5 w-3.5" style={{ color: "oklch(0.65 0.22 25)" }} />
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
//  Online editable — MONEY (budgeted, realized)
//  Shows formatted BRL, edits as raw number
// ─────────────────────────────────────────────────────────────
function EditableMoney({
  value,
  onSave,
  accent,
  color,
}: {
  value: number;
  onSave: (v: number) => void;
  accent: string;
  color?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    // Show as plain number, replacing decimal comma with dot
    setDraft(value.toString());
    setEditing(true);
  }

  function commit() {
    const parsed = parseMoney(draft);
    onSave(parsed);
    setEditing(false);
  }

  function cancel() {
    setDraft(value.toString());
    setEditing(false);
  }

  if (!editing) {
    return (
      <span
        className="group/em inline-flex items-center gap-0.5 rounded px-0.5 -mx-0.5 transition-colors cursor-pointer font-mono tabular-nums"
        onClick={startEdit}
        title="Clique para editar"
        style={{ color: color ?? "inherit" }}
      >
        <span>{formatBRL(value)}</span>
        <Pencil className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/em:opacity-50 transition-opacity" style={{ color: accent }} />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="number"
        step="1000"
        min="0"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="rounded px-2 py-[3px] text-xs font-mono tabular-nums outline-none text-right"
        style={{
          background: "var(--input)",
          border: `1px solid ${accent}`,
          color: "var(--foreground)",
          boxShadow: `0 0 8px color-mix(in oklch, ${accent} 25%, transparent)`,
          width: 130,
        }}
      />
      <button
        onClick={e => { e.stopPropagation(); commit(); }}
        className="p-0.5 rounded transition-colors hover:bg-green-500/20"
        title="Confirmar (Enter)"
      >
        <Check className="h-3.5 w-3.5" style={{ color: "oklch(0.68 0.22 145)" }} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); cancel(); }}
        className="p-0.5 rounded transition-colors hover:bg-red-500/20"
        title="Cancelar (Esc)"
      >
        <X className="h-3.5 w-3.5" style={{ color: "oklch(0.65 0.22 25)" }} />
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
//  Subgroup row
// ─────────────────────────────────────────────────────────────
function SubGroupRow({
  sub,
  accent,
  isLast,
  onUpdate,
  onDelete,
}: {
  sub: SubGroup;
  accent: { c: string; dim: string; bg: string };
  isLast: boolean;
  onUpdate: (field: keyof SubGroup, value: string | number) => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isOver = sub.realized > sub.budgeted;
  const borderColor = "oklch(0.15 0.015 240)";

  return (
    <div
      style={{ borderBottom: isLast ? "none" : `1px solid ${borderColor}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Row — 5-col grid */}
      <div
        className="grid items-center transition-colors"
        style={{
          gridTemplateColumns: "1fr 160px 160px 70px 120px",
          background: hovered ? "var(--muted)" : "transparent",
          minHeight: 56,
        }}
      >
        {/* Col 1 — Name / Code / Description */}
        <div className="px-5 py-3 flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Code badge */}
            <span
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ color: accent.c, background: accent.bg, border: `1px solid ${accent.dim}` }}
            >
              <EditableText
                value={sub.code}
                onSave={v => onUpdate("code", v)}
                accent={accent.c}
              />
            </span>
            {/* Name */}
            <span className="text-[12px] font-mono font-semibold" style={{ color: "oklch(0.88 0.02 200)" }}>
              <EditableText
                value={sub.name}
                onSave={v => onUpdate("name", v)}
                accent={accent.c}
              />
            </span>
          </div>
          {/* Description */}
          <span className="text-[10px] font-mono leading-snug" style={{ color: "oklch(0.42 0.025 220)" }}>
            <EditableText
              value={sub.description || "—"}
              onSave={v => onUpdate("description", v)}
              accent={accent.c}
              placeholder="Adicionar descrição..."
            />
          </span>
          {/* Exec bar */}
          <div className="mt-1">
            <ExecBar budgeted={sub.budgeted} realized={sub.realized} color={accent.c} />
          </div>
        </div>

        {/* Col 2 — Orçado */}
        <div
          className="px-4 py-3 flex items-center"
          style={{ borderLeft: `1px solid ${borderColor}` }}
        >
          <EditableMoney
            value={sub.budgeted}
            onSave={v => onUpdate("budgeted", v)}
            accent={accent.c}
            color="oklch(0.62 0.04 220)"
          />
        </div>

        {/* Col 3 — Realizado */}
        <div
          className="px-4 py-3 flex items-center"
          style={{ borderLeft: `1px solid ${borderColor}` }}
        >
          <EditableMoney
            value={sub.realized}
            onSave={v => onUpdate("realized", v)}
            accent={accent.c}
            color={isOver ? "oklch(0.65 0.22 25)" : "oklch(0.68 0.22 145)"}
          />
        </div>

        {/* Col 4 — Unidade */}
        <div
          className="px-3 py-3 flex items-center"
          style={{ borderLeft: `1px solid ${borderColor}` }}
        >
          <span className="text-[11px] font-mono" style={{ color: "oklch(0.52 0.04 220)" }}>
            <EditableText
              value={sub.unit || "R$"}
              onSave={v => onUpdate("unit", v)}
              accent={accent.c}
            />
          </span>
        </div>

        {/* Col 5 — Desvio + delete */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-2"
          style={{ borderLeft: `1px solid ${borderColor}` }}
        >
          <VarBadge budgeted={sub.budgeted} realized={sub.realized} />
          {hovered && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded transition-colors hover:bg-red-500/15 shrink-0"
              title="Remover subgrupo"
            >
              <Trash2 className="h-3 w-3" style={{ color: "oklch(0.65 0.22 25 / 0.7)" }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Add subgroup online form
// ─────────────────────────────────────────────────────────────
function AddSubGroupForm({
  accent,
  nextCode,
  onAdd,
  onCancel,
}: {
  accent: { c: string; dim: string; bg: string };
  nextCode: string;
  onAdd: (s: Omit<SubGroup, "id">) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(nextCode);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [unit, setUnit] = useState("R$");
  const [budgeted, setBudgeted] = useState("");
  const [realized, setRealized] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const fieldStyle: React.CSSProperties = {
    background: "var(--input)",
    border: `1px solid ${accent.dim}`,
    color: "var(--foreground)",
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 11,
    fontFamily: "ui-monospace, monospace",
    outline: "none",
    width: "100%",
  };

  function submit() {
    if (!name.trim()) return;
    onAdd({
      code: code.trim() || nextCode,
      name: name.trim(),
      description: desc.trim(),
      unit: unit.trim() || "R$",
      budgeted: parseMoney(budgeted),
      realized: parseMoney(realized),
    });
  }

  return (
    <div
      className="mx-4 my-3 rounded-lg p-4"
      style={{ background: accent.bg, border: `1px dashed ${accent.dim}` }}
      onClick={e => e.stopPropagation()}
    >
      <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] mb-3" style={{ color: accent.c }}>
        + Novo Subgrupo
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3">
        <div>
          <label className="block text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.025 220)" }}>Código</label>
          <input value={code} onChange={e => setCode(e.target.value)} style={fieldStyle} />
        </div>
        <div>
          <label className="block text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.025 220)" }}>Unidade</label>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="R$" style={fieldStyle} />
        </div>
        <div className="col-span-2">
          <label className="block text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.025 220)" }}>Nome *</label>
          <input
            ref={nameRef}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do subgrupo"
            onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
            style={fieldStyle}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.025 220)" }}>Descrição</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição técnica (opcional)" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.025 220)" }}>Orçado (R$)</label>
          <input
            type="number"
            min="0"
            value={budgeted}
            onChange={e => setBudgeted(e.target.value)}
            placeholder="0"
            style={{ ...fieldStyle, textAlign: "right" }}
          />
        </div>
        <div>
          <label className="block text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.025 220)" }}>Realizado (R$)</label>
          <input
            type="number"
            min="0"
            value={realized}
            onChange={e => setRealized(e.target.value)}
            placeholder="0"
            style={{ ...fieldStyle, textAlign: "right" }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-4 py-2 rounded transition-opacity hover:opacity-90"
          style={{ background: accent.c, color: "oklch(0.08 0.014 240)" }}
        >
          <Check className="h-3.5 w-3.5" /> Adicionar
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-[11px] font-mono px-4 py-2 rounded transition-opacity hover:opacity-80"
          style={{ color: "oklch(0.55 0.04 220)", background: "oklch(0.12 0.016 240)", border: "1px solid oklch(0.22 0.025 240)" }}
        >
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Add group online form
// ─────────────────────────────────────────────────────────────
function AddGroupForm({
  accent,
  nextCode,
  onAdd,
  onCancel,
}: {
  accent: { c: string; dim: string; bg: string };
  nextCode: string;
  onAdd: (g: Omit<Group, "id" | "subGroups">) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(nextCode);
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const fieldStyle: React.CSSProperties = {
    background: "var(--input)",
    border: `1px solid ${accent.dim}`,
    color: "var(--foreground)",
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 11,
    fontFamily: "ui-monospace, monospace",
    outline: "none",
    width: "100%",
  };

  function submit() {
    if (!name.trim()) return;
    onAdd({ code: code.trim() || nextCode, name: name.trim() });
  }

  return (
    <div
      className="mx-4 mb-3 rounded-lg p-4"
      style={{ background: accent.bg, border: `1px dashed ${accent.dim}` }}
      onClick={e => e.stopPropagation()}
    >
      <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] mb-3" style={{ color: accent.c }}>+ Novo Grupo</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.025 220)" }}>Código</label>
          <input value={code} onChange={e => setCode(e.target.value)} style={fieldStyle} />
        </div>
        <div>
          <label className="block text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.025 220)" }}>Nome *</label>
          <input
            ref={nameRef}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do grupo"
            onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
            style={fieldStyle}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-4 py-2 rounded hover:opacity-90"
          style={{ background: accent.c, color: "oklch(0.08 0.014 240)" }}
        >
          <Check className="h-3.5 w-3.5" /> Criar Grupo
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-[11px] font-mono px-4 py-2 rounded hover:opacity-80"
          style={{ color: "oklch(0.55 0.04 220)", background: "oklch(0.12 0.016 240)", border: "1px solid oklch(0.22 0.025 240)" }}
        >
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Group section (2nd level — collapsible)
// ─────────────────────────────────────────────────────────────
function GroupSection({
  group,
  accent,
  onUpdateGroup,
  onDeleteGroup,
  onUpdateSub,
  onDeleteSub,
  onAddSub,
  canEdit,
}: {
  group: Group;
  accent: { c: string; dim: string; bg: string };
  onUpdateGroup: (gid: string, field: "code" | "name", val: string) => void;
  onDeleteGroup: (gid: string) => void;
  onUpdateSub: (gid: string, sid: string, field: keyof SubGroup, val: string | number) => void;
  onDeleteSub: (gid: string, sid: string) => void;
  onAddSub: (gid: string, sub: Omit<SubGroup, "id">) => void;
  canEdit: boolean;
}) { 
  const [open, setOpen] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [hoveredHeader, setHoveredHeader] = useState(false);

  const gBudgeted = getGroupBudgeted(group);
  const gRealized = getGroupRealized(group);
  const isOver = gRealized > gBudgeted;
  const borderColor = "var(--border)";

  // Generate next subgroup code from the last existing one
  const lastSub = group.subGroups[group.subGroups.length - 1];
  const lastSubNum = lastSub ? parseInt(lastSub.code.replace(/\D/g, ""), 10) || 0 : parseInt(group.code.replace(/\D/g, ""), 10) * 10 || 0;
  const nextSubCode = `CC-${lastSubNum + 1}`;

  return (
    <div className="overflow-hidden" style={{ borderTop: `1px solid ${borderColor}` }}>
      {/* Group header row */}
      <div
        className="flex items-center cursor-pointer select-none transition-all"
        style={{
          background: hoveredHeader
            ? "color-mix(in oklch, var(--muted) 80%, var(--primary) 8%)"
            : open
            ? "var(--muted)"
            : "var(--card)",
          minHeight: 48,
        }}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHoveredHeader(true)}
        onMouseLeave={() => setHoveredHeader(false)}
      >
        {/* Left accent strip */}
        <div
          className="w-[3px] self-stretch shrink-0 transition-colors"
          style={{ background: open ? accent.c : borderColor }}
        />

        {/* Toggle icon */}
        <div className="w-8 flex items-center justify-center shrink-0">
          {open
            ? <ChevronDown className="h-3.5 w-3.5" style={{ color: accent.c }} />
            : <ChevronRight className="h-3.5 w-3.5" style={{ color: "oklch(0.38 0.025 220)" }} />
          }
        </div>

        {/* Folder icon */}
        <div className="mr-2 shrink-0">
          {open
            ? <FolderOpen className="h-4 w-4" style={{ color: accent.c }} />
            : <Folder className="h-4 w-4" style={{ color: "oklch(0.40 0.03 220)" }} />
          }
        </div>

        {/* Code badge */}
        <span
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 mr-2"
          style={{ color: accent.c, background: accent.bg, border: `1px solid ${accent.dim}` }}
        >
          <EditableText
            value={group.code}
            onSave={v => onUpdateGroup(group.id, "code", v)}
            accent={accent.c}
          />
        </span>

        {/* Name */}
        <span
          className="text-[12px] font-mono font-semibold flex-1 min-w-0 mr-3"
          style={{ color: open ? "oklch(0.88 0.02 200)" : "oklch(0.60 0.04 220)" }}
        >
          <EditableText
            value={group.name}
            onSave={v => onUpdateGroup(group.id, "name", v)}
            accent={accent.c}
          />
        </span>

        {/* Sub count chip */}
        <span
          className="text-[9px] font-mono px-2 py-0.5 rounded mr-3 shrink-0"
          style={{ color: "oklch(0.40 0.03 220)", background: "oklch(0.13 0.015 240)" }}
        >
          {group.subGroups.length} subgrupo{group.subGroups.length !== 1 ? "s" : ""}
        </span>

        {/* Totals (only on wider screens) */}
        <div className="hidden md:flex items-center gap-4 px-4 shrink-0">
          <div className="text-right">
            <p className="text-[7px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.32 0.02 220)" }}>Orçado</p>
            <p className="text-[11px] font-mono font-semibold tabular-nums" style={{ color: "oklch(0.55 0.04 220)" }}>
              {formatBRL(gBudgeted)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.32 0.02 220)" }}>Realizado</p>
            <p className="text-[11px] font-mono font-semibold tabular-nums" style={{ color: isOver ? "oklch(0.65 0.22 25)" : "oklch(0.68 0.22 145)" }}>
              {formatBRL(gRealized)}
            </p>
          </div>
          <VarBadge budgeted={gBudgeted} realized={gRealized} />
        </div>

        {/* Delete group (on hover) */}
        {hoveredHeader && (
          <button
            onClick={e => { e.stopPropagation(); onDeleteGroup(group.id); }}
            className="mr-2 p-1.5 rounded transition-colors hover:bg-red-500/15 shrink-0"
            title="Remover grupo"
          >
            <Trash2 className="h-3.5 w-3.5" style={{ color: "oklch(0.65 0.22 25 / 0.6)" }} />
          </button>
        )}
      </div>

      {/* Subgroups */}
      {open && (
        <div>
          {/* Column header */}
          <div
            className="grid text-[8px] font-mono uppercase tracking-[0.14em]"
            style={{
              gridTemplateColumns: "1fr 160px 160px 70px 120px",
              background: "var(--secondary)",
              borderTop: `1px solid ${borderColor}`,
              color: "var(--muted-foreground)",
            }}
          >
            <div className="px-5 py-2">Subgrupo</div>
            <div className="px-4 py-2" style={{ borderLeft: `1px solid ${borderColor}` }}>Orçado</div>
            <div className="px-4 py-2" style={{ borderLeft: `1px solid ${borderColor}` }}>Realizado</div>
            <div className="px-3 py-2" style={{ borderLeft: `1px solid ${borderColor}` }}>Unid.</div>
            <div className="px-4 py-2" style={{ borderLeft: `1px solid ${borderColor}` }}>Desvio</div>
          </div>

          {/* Subgroup rows */}
          {group.subGroups.length === 0 ? (
            <div className="px-6 py-6 text-center text-[11px] font-mono" style={{ color: "oklch(0.35 0.02 220)" }}>
              Nenhum subgrupo. Adicione um abaixo.
            </div>
          ) : (
            group.subGroups.map((sub, idx) => (
              <SubGroupRow
                key={sub.id}
                sub={sub}
                accent={accent}
                isLast={idx === group.subGroups.length - 1}
                onUpdate={(field, val) => onUpdateSub(group.id, sub.id, field, val)}
                onDelete={() => onDeleteSub(group.id, sub.id)}
              />
            ))
          )}

          {/* Add subgroup */}
{addingSub ? (
            <AddSubGroupForm
              accent={accent}
              nextCode={nextSubCode}
              onAdd={sub => { onAddSub(group.id, sub); setAddingSub(false); }}
              onCancel={() => setAddingSub(false)}
            />
          ) : (
            <div
              className="px-5 py-2"
              style={{ borderTop: `1px solid ${borderColor}`, background: "var(--secondary)" }}
            >
              <button
                onClick={(e) => {
                  if (!canEdit) return;
                  e.stopPropagation();
                  setAddingSub(true);
                }}
                className="flex items-center gap-1.5 text-[10px] font-mono transition-opacity opacity-60"
                style={{
                  color: accent.c,
                  cursor: canEdit ? "pointer" : "not-allowed",
                  opacity: canEdit ? 1 : 0.5,
                }}
              >
                {canEdit ? <Plus className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                Adicionar subgrupo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Process card (top level — collapsible)
// ─────────────────────────────────────────────────────────────
function ProcessCard({
  process,
  onUpdateProcess,
  onUpdateGroup,
  onDeleteGroup,
  onAddGroup,
  onUpdateSub,
  onDeleteSub,
  onAddSub,
  canEdit,
}: {
  process: Process;
  onUpdateProcess: (pid: string, field: "code" | "name" | "acronym", val: string) => void;
  onUpdateGroup: (pid: string, gid: string, field: "code" | "name", val: string) => void;
  onDeleteGroup: (pid: string, gid: string) => void;
  onAddGroup: (pid: string, g: Omit<Group, "id" | "subGroups">) => void;
  onUpdateSub: (pid: string, gid: string, sid: string, field: keyof SubGroup, val: string | number) => void;
  onDeleteSub: (pid: string, gid: string, sid: string) => void;
  onAddSub: (pid: string, gid: string, sub: Omit<SubGroup, "id">) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);

  const accent = ACCENT[process.id] ?? ACCENT["DEP"];
  const Icon = ICONS[process.icon] ?? BarChart2;
  const pBudgeted = getProcessBudgeted(process);
  const pRealized = getProcessRealized(process);
  const pIsOver = pRealized > pBudgeted;
  const pct = pBudgeted > 0 ? Math.min((pRealized / pBudgeted) * 100, 110) : 0;
  const overCount = process.groups.reduce(
    (a, g) => a + g.subGroups.filter(s => s.realized > s.budgeted).length, 0
  );

  const lastGCode = process.groups[process.groups.length - 1]?.code ?? process.code;
  const lastGNum = parseInt(lastGCode.replace(/\D/g, ""), 10) || 0;
  const nextGroupCode = `CC-${lastGNum + 10}`;

  return (
    <div
      className="rounded-xl overflow-hidden transition-shadow"
      style={{
        border: `1px solid ${open ? accent.dim : "var(--border)"}`,
        boxShadow: open ? `0 0 20px color-mix(in oklch, ${accent.c} 10%, transparent)` : "none",
        background: "var(--card)",
      }}
    >
      {/* Process header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none transition-colors"
        style={{ background: open ? "color-mix(in oklch, var(--card) 85%, var(--primary) 5%)" : "transparent" }}
        onClick={() => setOpen(o => !o)}
      >
        {/* Left glow strip */}
        <div
          className="w-[3px] self-stretch rounded-full shrink-0 transition-all"
          style={{ background: accent.c, boxShadow: open ? `0 0 10px ${accent.c}` : "none" }}
        />

        {/* Icon */}
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: accent.bg, border: `1px solid ${accent.dim}` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent.c }} />
        </div>

        {/* Name + Code */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ color: accent.c, background: accent.bg, border: `1px solid ${accent.dim}` }}
            >
              <EditableText value={process.code} onSave={v => onUpdateProcess(process.id, "code", v)} accent={accent.c} />
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: "oklch(0.42 0.03 220)", background: "oklch(0.13 0.015 240)" }}>
              <EditableText value={process.acronym} onSave={v => onUpdateProcess(process.id, "acronym", v)} accent={accent.c} />
            </span>
          </div>
          <h3 className="text-sm font-mono font-bold mt-1 leading-tight" style={{ color: "oklch(0.90 0.02 200)" }}>
            <EditableText value={process.name} onSave={v => onUpdateProcess(process.id, "name", v)} accent={accent.c} />
          </h3>
          <p className="text-[9px] font-mono mt-0.5" style={{ color: "oklch(0.38 0.025 220)" }}>
            {process.groups.length} grupo{process.groups.length !== 1 ? "s" : ""} ·{" "}
            {process.groups.reduce((a, g) => a + g.subGroups.length, 0)} subgrupos
          </p>
        </div>

        {/* KPI block */}
        <div className="hidden sm:grid grid-cols-3 gap-4 shrink-0 mr-4">
          <div className="text-right">
            <p className="text-[7px] font-mono uppercase tracking-widest mb-0.5" style={{ color: "oklch(0.32 0.02 220)" }}>Orçado</p>
            <p className="text-[12px] font-mono font-bold tabular-nums" style={{ color: "oklch(0.58 0.04 220)" }}>{formatBRL(pBudgeted)}</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-mono uppercase tracking-widest mb-0.5" style={{ color: "oklch(0.32 0.02 220)" }}>Realizado</p>
            <p className="text-[12px] font-mono font-bold tabular-nums" style={{ color: pIsOver ? "oklch(0.65 0.22 25)" : "oklch(0.68 0.22 145)" }}>{formatBRL(pRealized)}</p>
          </div>
          <div className="flex flex-col items-end justify-center gap-1">
            <VarBadge budgeted={pBudgeted} realized={pRealized} />
            {overCount > 0 && (
              <span className="flex items-center gap-0.5 text-[8px] font-mono" style={{ color: "oklch(0.65 0.22 25 / 0.8)" }}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {overCount} item{overCount !== 1 ? "s" : ""} acima
              </span>
            )}
          </div>
        </div>

        {/* Progress bar (compact) */}
        <div className="hidden lg:flex flex-col gap-1 w-32 shrink-0">
          <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "oklch(0.17 0.018 240)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: pIsOver ? "oklch(0.65 0.22 25)" : accent.c,
                boxShadow: `0 0 8px ${pIsOver ? "oklch(0.65 0.22 25)" : accent.c}`,
              }}
            />
          </div>
          <span className="text-[9px] font-mono tabular-nums text-right" style={{ color: "oklch(0.38 0.025 220)" }}>
            {pct.toFixed(1)}% executado
          </span>
        </div>

        {/* Chevron */}
        <div className="ml-2 shrink-0">
          {open
            ? <ChevronDown className="h-4 w-4" style={{ color: accent.c }} />
            : <ChevronRight className="h-4 w-4" style={{ color: "oklch(0.40 0.03 220)" }} />
          }
        </div>
      </div>

      {/* Groups */}
      {open && (
        <div style={{ borderTop: `1px solid ${accent.dim}` }}>
          {process.groups.length === 0 ? (
            <div className="px-6 py-8 text-center text-[11px] font-mono" style={{ color: "oklch(0.35 0.02 220)" }}>
              Nenhum grupo cadastrado. Adicione um abaixo.
            </div>
          ) : (
            process.groups.map(group => (
              <GroupSection
                key={group.id}
                group={group}
                accent={accent}
                onUpdateGroup={(gid, field, val) => onUpdateGroup(process.id, gid, field, val)}
                onDeleteGroup={gid => onDeleteGroup(process.id, gid)}
                onUpdateSub={(gid, sid, field, val) => onUpdateSub(process.id, gid, sid, field, val)}
                onDeleteSub={(gid, sid) => onDeleteSub(process.id, gid, sid)}
                onAddSub={(gid, sub) => onAddSub(process.id, gid, sub)}
                canEdit={canEdit}
              />
            ))
          )}

          {/* Add group */}
      {addingGroup ? (
        <AddGroupForm
          accent={accent}
          nextCode={nextGroupCode}
          onAdd={g => { onAddGroup(process.id, g); setAddingGroup(false); }}
          onCancel={() => setAddingGroup(false)}
        />
      ) : (
        <div
          className="flex items-center justify-end px-4 py-2.5"
          style={{ background: "var(--secondary)", borderTop: `1px solid var(--border)` }}
        >
            <button
              onClick={(e) => {
                if (canEdit) return;
                e.stopPropagation();
                setAddingGroup(true);
              }}
              className="flex items-center gap-1.5 text-[10px] font-mono transition-opacity opacity-60"
              style={{
                color: accent.c,
                cursor: canEdit ? "pointer" : "not-allowed",
                opacity: canEdit ? 1 : 0.5,
              }}
            >
            {canEdit ? <Plus className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            Adicionar grupo
          </button>
        </div>
      )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  localStorage helpers — client-only
// ─────────────────────────────────────────────────────────────
// Fallback to localStorage; prefer Supabase
const LS_KEY = "avg-cost-centers-v1-fallback";

async function loadData(): Promise<Process[]> {
  try {
    const supabaseData = await loadCostCenters();
    if (supabaseData) return supabaseData;
  } catch (e) {
    console.warn('Supabase load failed, using localStorage:', e);
  }
  // Fallback
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Process[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedIds = new Set(parsed.map((p: Process) => p.id));
        const missing = PROCESSES.filter(p => !savedIds.has(p.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
    }
  } catch {}
  return PROCESSES;
}

async function saveData(data: Process[]) {
  try {
    await saveCostCenters(data);
  } catch (e) {
    console.warn('Supabase save failed, using localStorage:', e);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {}
  }
}

// ─────────────────────────────────────────────────────────────
//  Root panel — owns all state + localStorage persistence
// ─────────────────────────────────────────────────────────────
export function CostCenterPanel() {
  const [processes, setProcesses] = useState<Process[]>(PROCESSES);
  const [hydrated, setHydrated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Check admin on mount
  useEffect(() => {
    const adminFlag = localStorage.getItem('cost-center-admin');
    if (adminFlag === 'true') {
      setIsAdmin(true);
    } else {
      setShowPasswordModal(true);
    }
  }, []);

  const handlePasswordSubmit = (password: string) => {
    if (password === 'admin123') { // Change this password!
      localStorage.setItem('cost-center-admin', 'true');
      setIsAdmin(true);
      setShowPasswordModal(false);
    } else {
      alert('Senha incorreta. Apenas administradores podem editar.');
    }
  };

  const canEdit = isAdmin && hydrated;

  // Load from Supabase/localStorage
  useEffect(() => {
    loadData().then(saved => {
      setProcesses(saved);
      setHydrated(true);
    });
  }, []);

// Persist to localStorage after every change — but ONLY after hydration
  // to avoid overwriting saved data with the static default on first render
  useEffect(() => {
    if (!hydrated) return;
    saveData(processes);
  }, [processes, hydrated]);

  // ── Process update ────────────────────────────────────────
  const updateProcess = useCallback(
    (pid: string, field: "code" | "name" | "acronym", val: string) => {
      setProcesses(prev =>
        prev.map(p => (p.id === pid ? { ...p, [field]: val } : p))
      );
    },
    []
  );

  // ── Group operations ──────────────────────────────────────
  const updateGroup = useCallback(
    (pid: string, gid: string, field: "code" | "name", val: string) => {
      setProcesses(prev =>
        prev.map(p =>
          p.id !== pid ? p : {
            ...p,
            groups: p.groups.map(g => g.id !== gid ? g : { ...g, [field]: val }),
          }
        )
      );
    },
    []
  );

  const deleteGroup = useCallback((pid: string, gid: string) => {
    setProcesses(prev =>
      prev.map(p =>
        p.id !== pid ? p : { ...p, groups: p.groups.filter(g => g.id !== gid) }
      )
    );
  }, []);

  const addGroup = useCallback((pid: string, g: Omit<Group, "id" | "subGroups">) => {
    setProcesses(prev =>
      prev.map(p =>
        p.id !== pid ? p : {
          ...p,
          groups: [...p.groups, { ...g, id: `${pid}-G${Date.now()}`, subGroups: [] }],
        }
      )
    );
  }, []);

  // ── SubGroup operations ───────────────────────────────────
  const updateSub = useCallback(
    (pid: string, gid: string, sid: string, field: keyof SubGroup, val: string | number) => {
      setProcesses(prev =>
        prev.map(p =>
          p.id !== pid ? p : {
            ...p,
            groups: p.groups.map(g =>
              g.id !== gid ? g : {
                ...g,
                subGroups: g.subGroups.map(s =>
                  s.id !== sid ? s : { ...s, [field]: val }
                ),
              }
            ),
          }
        )
      );
    },
    []
  );

  const deleteSub = useCallback((pid: string, gid: string, sid: string) => {
    setProcesses(prev =>
      prev.map(p =>
        p.id !== pid ? p : {
          ...p,
          groups: p.groups.map(g =>
            g.id !== gid ? g : { ...g, subGroups: g.subGroups.filter(s => s.id !== sid) }
          ),
        }
      )
    );
  }, []);

  const addSub = useCallback(
    (pid: string, gid: string, sub: Omit<SubGroup, "id">) => {
      setProcesses(prev =>
        prev.map(p =>
          p.id !== pid ? p : {
            ...p,
            groups: p.groups.map(g =>
              g.id !== gid ? g : {
                ...g,
                subGroups: [...g.subGroups, { ...sub, id: `${gid}-S${Date.now()}` }],
              }
            ),
          }
        )
      );
    },
    []
  );

  // ── Export / Import handlers ──────────────────────────────
  const handleExport = useCallback(() => {
    const json = JSON.stringify(processes, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avg-centro-custo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [processes]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          alert("Arquivo inválido. Selecione um JSON exportado pelo sistema AVG.");
          return;
        }
        setProcesses(parsed);
        saveData(parsed);
        alert("Dados importados com sucesso!");
      } catch {
        alert("Erro ao ler o arquivo. Verifique se é um JSON válido.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be imported again if needed
    e.target.value = "";
  }, []);

  const [saved, setSaved] = useState(false);
  const handleManualSave = useCallback(() => {
    saveData(processes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [processes]);

  // Password modal
  if (showPasswordModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-200" style={{ boxShadow: "0 25px 50px -12px hsl(0 0% 0% / 0.25)" }}>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Acesso de Edição</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">Digite a senha de administrador para habilitar edições.</p>
          <input
            type="password"
            placeholder="Senha"
            onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit(e.currentTarget.value)}
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
            autoFocus
          />
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handlePasswordSubmit('')} // Empty to trigger alert
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
            >
              Entrar
            </button>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Contate o administrador para obter a senha.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Persistence toolbar ───────────────────────────── */}
      <div
        className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* Warning info */}
        <div className="flex items-start gap-2.5 flex-1">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "oklch(0.72 0.20 55)" }} />
          <div>
            <p className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.72 0.20 55)" }}>
              Persistencia de dados
            </p>
            <p className="text-[10px] font-mono leading-relaxed" style={{ color: "oklch(0.48 0.03 220)" }}>
              Todas as edicoes sao salvas automaticamente no navegador.
              Para nao perder dados ao atualizar o projeto, <strong style={{ color: "oklch(0.75 0.20 185)" }}>exporte o JSON</strong> antes
              de qualquer atualizacao e <strong style={{ color: "oklch(0.75 0.20 185)" }}>importe</strong> apos.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Manual save */}
          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all"
            style={{
              background: saved ? "oklch(0.55 0.18 145 / 0.15)" : "oklch(0.55 0.18 145 / 0.10)",
              border: `1px solid oklch(0.55 0.18 145 / ${saved ? "0.60" : "0.30"})`,
              color: "oklch(0.65 0.18 145)",
            }}
            title="Salvar agora no navegador"
          >
            <Save className="h-3 w-3" />
            {saved ? "Salvo!" : "Salvar"}
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all hover:opacity-90"
            style={{
              background: "oklch(0.75 0.20 185 / 0.10)",
              border: "1px solid oklch(0.75 0.20 185 / 0.35)",
              color: "oklch(0.75 0.20 185)",
            }}
            title="Exportar todos os dados como JSON"
          >
            <Download className="h-3 w-3" />
            Exportar JSON
          </button>

          {/* Import JSON */}
          <label
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all hover:opacity-90 cursor-pointer"
            style={{
              background: "oklch(0.68 0.18 300 / 0.10)",
              border: "1px solid oklch(0.68 0.18 300 / 0.35)",
              color: "oklch(0.68 0.18 300)",
            }}
            title="Importar dados de um arquivo JSON"
          >
            <Upload className="h-3 w-3" />
            Importar JSON
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      {/* ── Processes ─────────────────────────────────────── */}
      {processes.map(process => (
        <ProcessCard
          key={process.id}
          process={process}
          onUpdateProcess={updateProcess}
          onUpdateGroup={updateGroup}
          onDeleteGroup={deleteGroup}
          onAddGroup={addGroup}
          onUpdateSub={updateSub}
          onDeleteSub={deleteSub}
          onAddSub={addSub}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
