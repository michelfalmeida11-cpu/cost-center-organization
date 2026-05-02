"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight,
  Download, Calendar, Hash, Building2, AlertCircle, CheckCircle2, Clock,
  FolderOpen, Folder, Search, Filter,
} from "lucide-react";
import { PROCESSES, type Group, type Process } from "@/lib/cost-centers";

// ── Types ────────────────────────────────────────────────────────────────────
type ContractStatus = "vigente" | "vencido" | "a_vencer" | "suspenso";

interface Contract {
  id: string;
  groupId: string;
  processId: string;
  number: string;
  supplier: string;
  object: string;
  value: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  notes: string;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v);

function computeStatus(endDate: string): ContractStatus {
  if (!endDate) return "vigente";
  const end = new Date(endDate);
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return "vencido";
  if (diffDays <= 30) return "a_vencer";
  return "vigente";
}

const STATUS_META: Record<ContractStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  vigente:  { label: "Vigente",    color: "oklch(0.68 0.22 145)", bg: "oklch(0.68 0.22 145 / 0.12)", icon: CheckCircle2 },
  vencido:  { label: "Vencido",    color: "oklch(0.65 0.22 25)",  bg: "oklch(0.65 0.22 25 / 0.12)",  icon: AlertCircle  },
  a_vencer: { label: "A Vencer",   color: "oklch(0.72 0.20 55)",  bg: "oklch(0.72 0.20 55 / 0.12)",  icon: Clock        },
  suspenso: { label: "Suspenso",   color: "oklch(0.68 0.18 270)", bg: "oklch(0.68 0.18 270 / 0.12)", icon: AlertCircle  },
};

const PROCESS_COLOR: Record<string, string> = {
  LM:  "oklch(0.75 0.20 185)",
  BEN: "oklch(0.65 0.20 145)",
  INS: "oklch(0.70 0.22 55)",
  MA:  "oklch(0.65 0.18 155)",
  ADM: "oklch(0.68 0.18 300)",
  LOG: "oklch(0.70 0.22 55)",
  DEP: "oklch(0.55 0.05 240)",
};

const LS_KEY = "avg-contracts-v1";

function loadContracts(): Contract[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveContracts(list: Contract[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

const EMPTY_FORM: Omit<Contract, "id" | "createdAt"> = {
  groupId: "",
  processId: "",
  number: "",
  supplier: "",
  object: "",
  value: 0,
  startDate: "",
  endDate: "",
  status: "vigente",
  notes: "",
};

// ── Inline editable input ────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-mono uppercase tracking-[0.16em]" style={{ color: "oklch(0.48 0.03 220)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="h-8 px-2.5 rounded-lg text-[12px] font-mono outline-none transition-all"
        style={{
          background: "oklch(0.12 0.018 240)",
          border: "1px solid oklch(0.22 0.03 220)",
          color: "oklch(0.88 0.02 200)",
        }}
        onFocus={e => { e.currentTarget.style.border = "1px solid oklch(0.75 0.20 185 / 0.70)"; }}
        onBlur={e => { e.currentTarget.style.border = "1px solid oklch(0.22 0.03 220)"; }}
      />
    </div>
  );
}

// ── Add / Edit Contract Modal ────────────────────────────────────────────────
function ContractModal({
  initial,
  defaultGroupId,
  defaultProcessId,
  onSave,
  onClose,
}: {
  initial?: Contract;
  defaultGroupId: string;
  defaultProcessId: string;
  onSave: (c: Omit<Contract, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Contract, "id" | "createdAt">>(() =>
    initial
      ? { groupId: initial.groupId, processId: initial.processId, number: initial.number, supplier: initial.supplier, object: initial.object, value: initial.value, startDate: initial.startDate, endDate: initial.endDate, status: initial.status, notes: initial.notes }
      : { ...EMPTY_FORM, groupId: defaultGroupId, processId: defaultProcessId }
  );

  const set = (k: keyof typeof form) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: k === "value" ? Number(v) : v }));

  const isValid = form.number.trim() && form.supplier.trim() && form.object.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0.04 0.01 240 / 0.85)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "oklch(0.10 0.017 240)",
          border: "1px solid oklch(0.75 0.20 185 / 0.30)",
          boxShadow: "0 0 60px oklch(0.75 0.20 185 / 0.12)",
        }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "oklch(0.20 0.025 240)" }}>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: "oklch(0.75 0.20 185)" }} />
            <span className="text-[13px] font-mono font-bold" style={{ color: "oklch(0.88 0.02 195)" }}>
              {initial ? "Editar Contrato" : "Novo Contrato"}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
            <X className="h-4 w-4" style={{ color: "oklch(0.55 0.03 220)" }} />
          </button>
        </div>

        {/* form */}
        <div className="p-5 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          <Field label="N° do Contrato" value={form.number} onChange={set("number")} placeholder="CTR-2026-001" />
          <Field label="Fornecedor / Empresa" value={form.supplier} onChange={set("supplier")} placeholder="Nome da empresa" />
          <div className="col-span-2">
            <Field label="Objeto do Contrato" value={form.object} onChange={set("object")} placeholder="Descreva o objeto contratado" />
          </div>
          <Field label="Valor (R$)" value={String(form.value)} onChange={set("value")} type="number" placeholder="0" />
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono uppercase tracking-[0.16em]" style={{ color: "oklch(0.48 0.03 220)" }}>
              Status
            </label>
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value as ContractStatus }))}
              className="h-8 px-2.5 rounded-lg text-[12px] font-mono outline-none"
              style={{ background: "oklch(0.12 0.018 240)", border: "1px solid oklch(0.22 0.03 220)", color: "oklch(0.88 0.02 200)" }}
            >
              <option value="vigente">Vigente</option>
              <option value="a_vencer">A Vencer</option>
              <option value="vencido">Vencido</option>
              <option value="suspenso">Suspenso</option>
            </select>
          </div>
          <Field label="Data Início" value={form.startDate} onChange={set("startDate")} type="date" />
          <Field label="Data Fim" value={form.endDate} onChange={set("endDate")} type="date" />
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[9px] font-mono uppercase tracking-[0.16em]" style={{ color: "oklch(0.48 0.03 220)" }}>
              Observações
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Notas adicionais sobre o contrato..."
              className="px-2.5 py-2 rounded-lg text-[12px] font-mono outline-none resize-none transition-all"
              style={{
                background: "oklch(0.12 0.018 240)",
                border: "1px solid oklch(0.22 0.03 220)",
                color: "oklch(0.88 0.02 200)",
              }}
              onFocus={e => { e.currentTarget.style.border = "1px solid oklch(0.75 0.20 185 / 0.70)"; }}
              onBlur={e => { e.currentTarget.style.border = "1px solid oklch(0.22 0.03 220)"; }}
            />
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "oklch(0.20 0.025 240)" }}>
          <button
            onClick={onClose}
            className="px-4 h-8 rounded-lg text-[11px] font-mono transition-colors"
            style={{ background: "oklch(0.15 0.02 240)", color: "oklch(0.55 0.03 220)", border: "1px solid oklch(0.22 0.03 220)" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => { if (isValid) onSave(form); }}
            disabled={!isValid}
            className="px-4 h-8 rounded-lg text-[11px] font-mono font-bold transition-all"
            style={{
              background: isValid ? "oklch(0.75 0.20 185)" : "oklch(0.22 0.03 220)",
              color: isValid ? "oklch(0.08 0.014 240)" : "oklch(0.40 0.02 220)",
              cursor: isValid ? "pointer" : "not-allowed",
              boxShadow: isValid ? "0 0 14px oklch(0.75 0.20 185 / 0.35)" : "none",
            }}
          >
            {initial ? "Salvar Alterações" : "Adicionar Contrato"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contract Row ─────────────────────────────────────────────────────────────
function ContractRow({ contract, onEdit, onDelete }: {
  contract: Contract;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meta = STATUS_META[contract.status];
  const StatusIcon = meta.icon;

  return (
    <div
      className="grid items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
      style={{
        gridTemplateColumns: "1fr 1fr 1fr auto auto auto",
        background: hovered ? "oklch(0.75 0.20 185 / 0.04)" : "transparent",
        border: `1px solid ${hovered ? "oklch(0.75 0.20 185 / 0.15)" : "oklch(0.18 0.022 240)"}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* N° + Fornecedor */}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-mono font-bold truncate" style={{ color: "oklch(0.75 0.20 185)" }}>
          {contract.number || "—"}
        </span>
        <span className="text-[11px] font-mono truncate" style={{ color: "oklch(0.78 0.02 200)" }}>
          {contract.supplier}
        </span>
      </div>

      {/* Objeto */}
      <div className="min-w-0">
        <span className="text-[11px] font-mono truncate block" style={{ color: "oklch(0.55 0.03 220)" }}>
          {contract.object}
        </span>
      </div>

      {/* Valor */}
      <div>
        <span className="text-[12px] font-mono font-bold" style={{ color: "oklch(0.88 0.02 200)" }}>
          {fmt(contract.value)}
        </span>
      </div>

      {/* Status badge */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0"
        style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}
      >
        <StatusIcon className="h-3 w-3 shrink-0" style={{ color: meta.color }} />
        <span className="text-[10px] font-mono font-bold whitespace-nowrap" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>

      {/* Datas */}
      <div className="flex flex-col shrink-0">
        <span className="text-[9px] font-mono" style={{ color: "oklch(0.42 0.025 220)" }}>
          {contract.startDate ? new Date(contract.startDate + "T00:00").toLocaleDateString("pt-BR") : "—"}
        </span>
        <span className="text-[9px] font-mono" style={{ color: "oklch(0.42 0.025 220)" }}>
          {contract.endDate ? new Date(contract.endDate + "T00:00").toLocaleDateString("pt-BR") : "—"}
        </span>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "oklch(0.60 0.03 220)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "oklch(0.75 0.20 185)"; e.currentTarget.style.background = "oklch(0.75 0.20 185 / 0.10)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "oklch(0.60 0.03 220)"; e.currentTarget.style.background = "transparent"; }}
          title="Editar"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "oklch(0.60 0.03 220)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "oklch(0.65 0.22 25)"; e.currentTarget.style.background = "oklch(0.65 0.22 25 / 0.10)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "oklch(0.60 0.03 220)"; e.currentTarget.style.background = "transparent"; }}
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Group Section ────────────────────────────────────────────────────────────
function GroupSection({
  process,
  group,
  contracts,
  onAdd,
  onEdit,
  onDelete,
}: {
  process: Process;
  group: Group;
  contracts: Contract[];
  onAdd: (groupId: string, processId: string) => void;
  onEdit: (c: Contract) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const accent = PROCESS_COLOR[process.id] || "oklch(0.75 0.20 185)";
  const count = contracts.length;
  const total = contracts.reduce((a, c) => a + c.value, 0);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid oklch(0.18 0.022 240)" }}
    >
      {/* Group header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
        style={{ background: open ? "oklch(0.12 0.018 240)" : "oklch(0.10 0.016 240)" }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          {open
            ? <FolderOpen className="h-4 w-4 shrink-0" style={{ color: accent }} />
            : <Folder className="h-4 w-4 shrink-0" style={{ color: "oklch(0.45 0.03 220)" }} />
          }
          <div className="flex flex-col">
            <span className="text-[12px] font-mono font-semibold" style={{ color: open ? "oklch(0.88 0.02 200)" : "oklch(0.65 0.03 220)" }}>
              {group.name}
            </span>
            <span className="text-[9px] font-mono" style={{ color: "oklch(0.40 0.025 220)" }}>
              {group.code}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {count > 0 && (
            <>
              <span className="text-[10px] font-mono" style={{ color: "oklch(0.50 0.03 220)" }}>
                {fmt(total)}
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${accent}20`, color: accent }}
              >
                {count} {count === 1 ? "contrato" : "contratos"}
              </span>
            </>
          )}
          {count === 0 && (
            <span className="text-[10px] font-mono" style={{ color: "oklch(0.32 0.02 220)" }}>
              Nenhum contrato
            </span>
          )}
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.45 0.03 220)" }} />
                : <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.38 0.025 220)" }} />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-2" style={{ borderTop: "1px solid oklch(0.16 0.020 240)" }}>
          {/* Column headers */}
          {contracts.length > 0 && (
            <div
              className="grid items-center gap-3 px-4 py-1.5"
              style={{ gridTemplateColumns: "1fr 1fr 1fr auto auto auto" }}
            >
              {["N° / Fornecedor", "Objeto", "Valor", "Status", "Período", ""].map((h, i) => (
                <span key={i} className="text-[9px] font-mono uppercase tracking-[0.14em]" style={{ color: "oklch(0.36 0.025 220)" }}>
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* Rows */}
          <div className="flex flex-col gap-1.5">
            {contracts.map(c => (
              <ContractRow
                key={c.id}
                contract={c}
                onEdit={() => onEdit(c)}
                onDelete={() => onDelete(c.id)}
              />
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={() => onAdd(group.id, process.id)}
            className="flex items-center gap-2 w-full justify-center px-4 py-2 rounded-xl transition-all mt-1"
            style={{
              background: `${accent}08`,
              border: `1px dashed ${accent}40`,
              color: accent,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${accent}14`;
              e.currentTarget.style.borderColor = `${accent}80`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${accent}08`;
              e.currentTarget.style.borderColor = `${accent}40`;
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-[11px] font-mono font-semibold">Adicionar Contrato</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Process Panel ────────────────────────────────────────────────────────────
function ProcessPanel({
  process,
  contracts,
  onAdd,
  onEdit,
  onDelete,
}: {
  process: Process;
  contracts: Contract[];
  onAdd: (groupId: string, processId: string) => void;
  onEdit: (c: Contract) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const accent = PROCESS_COLOR[process.id] || "oklch(0.75 0.20 185)";
  const count = contracts.length;
  const total = contracts.reduce((a, c) => a + c.value, 0);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${open ? `${accent}35` : "oklch(0.18 0.022 240)"}`,
        boxShadow: open ? `0 0 24px ${accent}10` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Process header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{
          background: open ? "oklch(0.10 0.016 240)" : "oklch(0.09 0.014 240)",
          borderBottom: open ? `1px solid oklch(0.16 0.020 240)` : "none",
        }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          {/* Color bar */}
          <div className="h-8 w-1 rounded-full shrink-0" style={{ background: accent }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-mono font-bold" style={{ color: open ? "oklch(0.92 0.02 195)" : "oklch(0.70 0.03 220)" }}>
                {process.name}
              </span>
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: `${accent}15`, color: accent }}
              >
                {process.code}
              </span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: "oklch(0.40 0.025 220)" }}>
              {process.groups.length} grupos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {count > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[12px] font-mono font-bold" style={{ color: "oklch(0.80 0.02 200)" }}>
                {fmt(total)}
              </span>
              <span className="text-[10px] font-mono" style={{ color: accent }}>
                {count} {count === 1 ? "contrato" : "contratos"}
              </span>
            </div>
          )}
          {open
            ? <ChevronDown className="h-4 w-4" style={{ color: "oklch(0.48 0.03 220)" }} />
            : <ChevronRight className="h-4 w-4" style={{ color: "oklch(0.38 0.025 220)" }} />
          }
        </div>
      </button>

      {/* Groups */}
      {open && (
        <div className="p-4 flex flex-col gap-3" style={{ background: "oklch(0.08 0.013 240)" }}>
          {process.groups.map(group => (
            <GroupSection
              key={group.id}
              process={process}
              group={group}
              contracts={contracts.filter(c => c.groupId === group.id)}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Contract Vault (main export) ─────────────────────────────────────────────
export function ContractVault() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [modal, setModal] = useState<{ mode: "add"; groupId: string; processId: string } | { mode: "edit"; contract: Contract } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");

  // Hydrate from localStorage on mount
  useEffect(() => { setContracts(loadContracts()); }, []);

  function addContract(data: Omit<Contract, "id" | "createdAt">) {
    const c: Contract = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: data.endDate ? computeStatus(data.endDate) : data.status,
    };
    const updated = [...contracts, c];
    setContracts(updated);
    saveContracts(updated);
    setModal(null);
  }

  function updateContract(id: string, data: Omit<Contract, "id" | "createdAt">) {
    const updated = contracts.map(c =>
      c.id === id
        ? { ...c, ...data, status: data.endDate ? computeStatus(data.endDate) : data.status }
        : c
    );
    setContracts(updated);
    saveContracts(updated);
    setModal(null);
  }

  function deleteContract(id: string) {
    const updated = contracts.filter(c => c.id !== id);
    setContracts(updated);
    saveContracts(updated);
  }

  // Stats
  const total = contracts.length;
  const totalValue = contracts.reduce((a, c) => a + c.value, 0);
  const vigentes = contracts.filter(c => c.status === "vigente").length;
  const aVencer = contracts.filter(c => c.status === "a_vencer").length;
  const vencidos = contracts.filter(c => c.status === "vencido").length;

  // Filtered contracts for search/status (used to compute per-process counts)
  const filtered = contracts.filter(c => {
    const matchSearch = !search ||
      c.supplier.toLowerCase().includes(search.toLowerCase()) ||
      c.number.toLowerCase().includes(search.toLowerCase()) ||
      c.object.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const BORDER = "oklch(0.20 0.025 240)";

  return (
    <div className="flex flex-col gap-4">

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Contratos", value: total, color: "oklch(0.75 0.20 185)", sub: fmt(totalValue) },
          { label: "Vigentes", value: vigentes, color: "oklch(0.68 0.22 145)", sub: `${total ? Math.round(vigentes / total * 100) : 0}% do total` },
          { label: "A Vencer (30d)", value: aVencer, color: "oklch(0.72 0.20 55)", sub: aVencer > 0 ? "Atenção requerida" : "Nenhum" },
          { label: "Vencidos", value: vencidos, color: "oklch(0.65 0.22 25)", sub: vencidos > 0 ? "Renovação pendente" : "Nenhum" },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl px-4 py-3"
            style={{ background: "oklch(0.10 0.016 240)", border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.16em]" style={{ color: "oklch(0.42 0.025 220)" }}>
                {stat.label}
              </span>
            </div>
            <span className="text-2xl font-mono font-bold" style={{ color: stat.color }}>
              {stat.value}
            </span>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.42 0.025 220)" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div
        className="flex flex-col sm:flex-row gap-3 px-4 py-3 rounded-xl"
        style={{ background: "oklch(0.10 0.016 240)", border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-2 flex-1 rounded-lg px-3 h-8" style={{ background: "oklch(0.08 0.013 240)", border: "1px solid oklch(0.22 0.025 240)" }}>
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.45 0.03 220)" }} />
          <input
            className="flex-1 bg-transparent text-[12px] font-mono outline-none"
            style={{ color: "oklch(0.85 0.02 200)" }}
            placeholder="Buscar por fornecedor, número ou objeto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="h-3 w-3" style={{ color: "oklch(0.45 0.03 220)" }} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 shrink-0 mr-1" style={{ color: "oklch(0.45 0.03 220)" }} />
          {(["all", "vigente", "a_vencer", "vencido", "suspenso"] as const).map(s => {
            const label = s === "all" ? "Todos" : STATUS_META[s].label;
            const color = s === "all" ? "oklch(0.75 0.20 185)" : STATUS_META[s].color;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all"
                style={{
                  background: active ? `${color}18` : "transparent",
                  color: active ? color : "oklch(0.45 0.03 220)",
                  border: `1px solid ${active ? `${color}40` : "transparent"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Process panels */}
      <div className="flex flex-col gap-3">
        {PROCESSES.map(proc => (
          <ProcessPanel
            key={proc.id}
            process={proc}
            contracts={filtered.filter(c => c.processId === proc.id)}
            onAdd={(groupId, processId) => setModal({ mode: "add", groupId, processId })}
            onEdit={c => setModal({ mode: "edit", contract: c })}
            onDelete={deleteContract}
          />
        ))}
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "oklch(0.09 0.014 240)", border: "1px dashed oklch(0.22 0.025 240)" }}
        >
          <FileText className="h-10 w-10 mb-3" style={{ color: "oklch(0.28 0.025 240)" }} />
          <p className="text-[13px] font-mono" style={{ color: "oklch(0.40 0.025 220)" }}>
            Nenhum contrato cadastrado
          </p>
          <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.32 0.02 220)" }}>
            Expanda um processo e clique em "Adicionar Contrato"
          </p>
        </div>
      )}

      {/* Modal */}
      {modal && (
        modal.mode === "add"
          ? <ContractModal
              defaultGroupId={modal.groupId}
              defaultProcessId={modal.processId}
              onSave={addContract}
              onClose={() => setModal(null)}
            />
          : <ContractModal
              initial={modal.contract}
              defaultGroupId={modal.contract.groupId}
              defaultProcessId={modal.contract.processId}
              onSave={data => updateContract(modal.contract.id, data)}
              onClose={() => setModal(null)}
            />
      )}
    </div>
  );
}
