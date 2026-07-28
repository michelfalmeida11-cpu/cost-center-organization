"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  Factory,
  FileSpreadsheet,
  Filter,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Menu,
  Search,
  Settings,
  Shield,
  Truck,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import { useProcurement } from "@/context/ProcurementContext";
import {
  APP_MENU,
  AppModule,
  EMPTY_FILTERS,
  SC_STATUS_LABEL,
  OC_STATUS_LABEL,
  buildAlerts,
  buildScTimeline,
  computeKpis,
  filterData,
  formatCurrency,
  monthlySeries,
  ocStatusToExecutive,
  statusSeries,
  supplierRanking,
} from "@/lib/procurement/data";
import { AppState, OCStatus, PurchaseOrder, PurchaseRequest, SCStatus } from "@/lib/procurement/types";

const NAV: Array<{ id: AppModule; label: string; icon: React.ElementType }> = [
  { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
  { id: "SC", label: "Central SC / OC", icon: ClipboardList },
  { id: "FORNECEDORES", label: "Fornecedores", icon: Building2 },
  { id: "SETORES", label: "Setores", icon: Factory },
  { id: "ACOMPANHAMENTO", label: "Acompanhamento", icon: ListChecks },
  { id: "KPIS_ANALYTICS", label: "KPIs & Analytics", icon: Gauge },
  { id: "RELATORIOS", label: "Relatorios", icon: BarChart3 },
  { id: "EXCEL", label: "Exportacao Excel", icon: FileSpreadsheet },
  { id: "CONFIGURACOES", label: "Configuracoes", icon: Settings },
];

const NAV_GROUPS: Array<{ title: string; items: AppModule[] }> = [
  { title: "Overview", items: ["DASHBOARD", "SC"] },
  { title: "Procurement", items: ["FORNECEDORES", "SETORES", "ACOMPANHAMENTO"] },
  { title: "Intelligence", items: ["KPIS_ANALYTICS", "RELATORIOS", "EXCEL"] },
  { title: "System", items: ["CONFIGURACOES"] },
];

const MOBILE_NAV: Array<{ id: AppModule; label: string; icon: React.ElementType }> = [
  { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
  { id: "SC", label: "SC / OC", icon: ClipboardList },
  { id: "ACOMPANHAMENTO", label: "Kanban", icon: ListChecks },
  { id: "FORNECEDORES", label: "Fornec.", icon: Building2 },
  { id: "RELATORIOS", label: "Alertas", icon: Bell },
];

const CYAN = "#35f3ff";
const GREEN = "#58ff9b";
const AMBER = "#ffd564";
const RED = "#ff5d7d";
const PURPLE = "#9f7aff";
const BLUE = "#5ba5ff";

const OC_PHASE_LABEL: Record<OcPhase, string> = {
  ABERTO_TOTAL: "Aberto Total",
  ABERTO_PARCIAL: "Aberto Parcial",
  LIQUIDADO: "Liquidado",
  NAO_FECHADO: "Nao Fechado",
  CANCELADA: "Cancelado",
};

function businessStatusBadge(status: SCStatus | OcPhase) {
  if (status === "ABERTO_TOTAL") return "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
  if (status === "ABERTO_PARCIAL" || status === "LIQUIDADO") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (status === "NAO_FECHADO") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (status === "CANCELADA") return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  if (status === "APROVADA") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (status === "REPROVADA") return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  if (status === "LANCADA") return "border-blue-500/40 bg-blue-500/10 text-blue-200";
  return "border-amber-500/40 bg-amber-500/10 text-amber-200";
}

function scStatusBadge(status: SCStatus) {
  return businessStatusBadge(status);
}

function ocStatusBadge(status: OCStatus) {
  if (status === "CANCELADA") return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  if (status === "ABERTO_PARCIAL" || status === "LIQUIDADO") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (status === "NAO_FECHADO") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
}

type OcPhase = OCStatus;

type UnifiedScOcRow = {
  id: string;
  entity: "SC" | "OC";
  numeroSC: string;
  numeroOC: string;
  setor: string;
  statusKey: SCStatus | OcPhase;
  statusLabel: string;
  fornecedor: string;
  valor: number;
  sortDate: string;
};

type AiAnswerContext = {
  delayedCount: number;
  topSupplier: string;
  topSector: string;
  phaseSummary: string;
  totalOcValue: string;
  openOcCount: number;
  totalSc: number;
  totalOc: number;
  totalScOcValue: string;
  pendingSc: number;
  activeSuppliers: number;
  alertsCount: number;
};

type PremiumKpiCard = {
  label: string;
  value: string;
  note: string;
  context: string;
  delta: number;
  color: string;
  icon: React.ElementType;
  invertDelta?: boolean;
  series: number[];
};

type AssistantFacts = {
  totalSc: number;
  totalOc: number;
  totalScOcValue: number;
  pendingSc: number;
  openOc: number;
  delayedOc: number;
  topSupplier: string;
  topSector: string;
  activeSuppliers: number;
  onTimeRate: number;
  leadTime: number;
  approvalTime: number;
};

function ocToPhase(status: OCStatus): OcPhase {
  return status;
}

function phaseToOcStatus(phase: OcPhase): OCStatus {
  return phase;
}

function phaseColor(label: string) {
  if (label === "Liquidado" || label === "Aberto Parcial") return GREEN;
  if (label === "Aberto Total") return CYAN;
  if (label === "Nao Fechado") return AMBER;
  if (label === "Cancelado") return RED;
  return BLUE;
}

function truncateSupplierName(value: string, max = 20) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
}

function toDeltaPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

function formatDatePtBr(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("pt-BR");
}

function diffDaysFromNow(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 0;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function toPercent(value: number, total: number) {
  if (!total) return 0;
  return Number(((value / total) * 100).toFixed(2));
}

function diffDaysBetween(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.max(0, Math.floor((e - s) / (1000 * 60 * 60 * 24)));
}

function agingBucketLabel(days: number) {
  if (days <= 7) return "0-7";
  if (days <= 15) return "8-15";
  if (days <= 30) return "16-30";
  if (days <= 60) return "31-60";
  return "+60";
}

function calculateOperationalHealth(params: {
  totalSc: number;
  totalOc: number;
  delayedOc: number;
  pendingSc: number;
  withoutSupplier: number;
  withoutOc: number;
  longAging: number;
}) {
  const total = params.totalSc + params.totalOc;
  if (!total) return null;

  const delayedWeight = 30;
  const pendingWeight = 20;
  const withoutSupplierWeight = 20;
  const withoutOcWeight = 15;
  const agingWeight = 15;

  const delayedFactor = Math.min(1, params.delayedOc / total);
  const pendingFactor = Math.min(1, params.pendingSc / Math.max(1, params.totalSc));
  const noSupplierFactor = Math.min(1, params.withoutSupplier / Math.max(1, params.totalSc));
  const noOcFactor = Math.min(1, params.withoutOc / Math.max(1, params.totalSc));
  const agingFactor = Math.min(1, params.longAging / total);

  const penalty =
    delayedFactor * delayedWeight +
    pendingFactor * pendingWeight +
    noSupplierFactor * withoutSupplierWeight +
    noOcFactor * withoutOcWeight +
    agingFactor * agingWeight;

  const score = Math.max(0, Math.min(100, Number((100 - penalty).toFixed(1))));
  const status = score >= 80 ? "HEALTHY" : score >= 60 ? "ATENCAO" : "CRITICO";

  return { score, status };
}

function relativeTimePtBr(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "agora";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `ha ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours} h`;
  const days = Math.floor(hours / 24);
  return `ha ${days} d`;
}

function healthStatusTone(status?: string) {
  if (status === "HEALTHY") return "text-emerald-300";
  if (status === "ATENCAO") return "text-amber-300";
  return "text-rose-300";
}

function buildUnifiedRows(
  scs: PurchaseRequest[],
  ocs: PurchaseOrder[],
  setores: AppState["setores"],
  fornecedores: AppState["fornecedores"],
): UnifiedScOcRow[] {
  const supplierNameById = new Map(fornecedores.map((fornecedor) => [fornecedor.id, fornecedor.nomeFantasia]));

  const scRows: UnifiedScOcRow[] = scs.map((sc) => ({
    fornecedor:
      (sc.fornecedorSugeridoId ? supplierNameById.get(sc.fornecedorSugeridoId) : undefined) ??
      (() => {
        const linkedOc = ocs.find((oc) => oc.scId === sc.id || oc.numeroOC === sc.numeroOCRelacionada);
        return linkedOc?.fornecedorId ? supplierNameById.get(linkedOc.fornecedorId) : undefined;
      })() ??
      "-",
    id: sc.id,
    entity: "SC",
    numeroSC: sc.numeroSC,
    numeroOC: sc.numeroOCRelacionada ?? "-",
    setor: setores.find((setor) => setor.id === sc.setorId)?.nome ?? "-",
    statusKey: sc.status,
    statusLabel: SC_STATUS_LABEL[sc.status],
    valor: sc.valorEstimado,
    sortDate: sc.dataCriacao,
  }));

  const ocRows: UnifiedScOcRow[] = ocs.map((oc) => ({
    id: oc.id,
    entity: "OC",
    numeroSC: scs.find((sc) => sc.id === oc.scId)?.numeroSC ?? "-",
    numeroOC: oc.numeroOC,
    setor: setores.find((setor) => setor.id === oc.setorId)?.nome ?? "-",
    statusKey: ocToPhase(oc.status as OCStatus),
    statusLabel: OC_PHASE_LABEL[ocToPhase(oc.status as OCStatus)],
    fornecedor: fornecedores.find((fornecedor) => fornecedor.id === oc.fornecedorId)?.nomeFantasia ?? "-",
    valor: oc.valorOC,
    sortDate: oc.dataOC,
  }));

  return [...ocRows, ...scRows].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

function getTaggedValue(text: string | null | undefined, tag: string) {
  if (!text) return "";
  const regex = new RegExp(`(?:^|\\n)${tag}:([^\\n]*)`, "i");
  const match = text.match(regex);
  return match?.[1]?.trim() ?? "";
}

function setTaggedValue(text: string | null | undefined, tag: string, value: string) {
  const lines = (text ?? "")
    .split("\n")
    .filter((line) => line.trim().length > 0 && !new RegExp(`^${tag}:`, "i").test(line));

  if (value.trim()) lines.push(`${tag}:${value.trim()}`);
  return lines.join("\n");
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function parseNfAttachment(entry: string | undefined | null) {
  if (!entry || !entry.startsWith("NF_FILE:")) return null;
  const payload = entry.replace("NF_FILE:", "");
  const [name, mime, size, ts, ...dataParts] = payload.split("|");
  const dataUrl = dataParts.join("|");
  if (!dataUrl) return null;
  return {
    name: name || "NF",
    mime: mime || "application/octet-stream",
    size: Number(size || 0),
    ts: Number(ts || 0),
    dataUrl,
  };
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getValueByAliases(row: Record<string, unknown>, aliases: string[]) {
  const normalizedMap = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => {
    normalizedMap.set(normalizeKey(key), value);
  });

  for (const alias of aliases) {
    const value = normalizedMap.get(normalizeKey(alias));
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return undefined;
}

function getValueByPositionFallback(row: Record<string, unknown>, columnIndex: number) {
  const values = Object.values(row);
  return values[columnIndex];
}

function parseMoneyValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;
  const normalized = String(value).replace(/R\$/gi, "").replace(/\s+/g, "").replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDateValue(value: unknown, fallbackDate: string) {
  if (typeof value === "number" && Number.isFinite(value) && value > 20000 && value < 70000) {
    const excelBase = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelBase.getTime() + value * 24 * 60 * 60 * 1000);
    return parsed.toISOString().slice(0, 10);
  }

  if (value === null || value === undefined || String(value).trim() === "") return fallbackDate;
  const text = String(value).trim();

  const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, "0");
    const month = brMatch[2].padStart(2, "0");
    const year = brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3];
    return `${year}-${month}-${day}`;
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return fallbackDate;
  return date.toISOString().slice(0, 10);
}

function makeSafeId(prefix: string, seed: string, index: number) {
  const compact = seed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return compact ? `${prefix}-${compact}` : `${prefix}-${index}`;
}

function toScStatus(value: unknown): SCStatus {
  const v = normalizeKey(String(value ?? ""));
  if (v.includes("reprov")) return "REPROVADA";
  if (v.includes("lanc") || v.includes("enviad")) return "LANCADA";
  if (v.includes("aprov")) return "APROVADA";
  return "EM_ANALISE";
}

function toOcStatus(value: unknown): OCStatus {
  const v = normalizeKey(String(value ?? ""));
  if (v.includes("cancel")) return "CANCELADA";
  if (v.includes("naofechado")) return "NAO_FECHADO";
  if (v.includes("abertoparcial")) return "ABERTO_PARCIAL";
  if (v.includes("liquid")) return "LIQUIDADO";
  return "ABERTO_TOTAL";
}

const OC_IMPORT_ALIASES = {
  numeroOC: ["n ordem", "n. ordem", "nº ordem", "numero ordem", "numerooc", "n oc", "n.oc", "oc", "pedido", "pedido compra"],
  dataOC: ["emissao", "emissão", "data oc", "data emissao", "data"],
  status: ["situacao o.c.", "situacao oc", "status oc", "status", "situacao"],
  valor: ["vlr. orig. oc", "vlr orig oc", "valor oc", "valor", "valor total", "total"],
  fornecedorNome: ["nome fornecedor", "fornecedor nome", "razao social", "nome fantasia", "fornecedor"],
  comprador: ["usuario comprador nome", "comprador", "usuario comprador", "responsavel", "aprovador"],
  setor: ["setor", "area", "área", "unidade", "departamento", "centro de custo"],
};

function detectBestOcSheet(workbook: XLSX.WorkBook) {
  let bestName = workbook.SheetNames[0] ?? "";
  let bestRows: Record<string, unknown>[] = [];
  let bestScore = -1;

  workbook.SheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" });
    if (!rows.length) return;

    const headerKeys = Object.keys(rows[0] ?? {}).map((key) => normalizeKey(key));
    const hasNumero = OC_IMPORT_ALIASES.numeroOC.some((alias) => headerKeys.includes(normalizeKey(alias)));
    const hasStatus = OC_IMPORT_ALIASES.status.some((alias) => headerKeys.includes(normalizeKey(alias)));
    const hasValor = OC_IMPORT_ALIASES.valor.some((alias) => headerKeys.includes(normalizeKey(alias)));
    const hasData = OC_IMPORT_ALIASES.dataOC.some((alias) => headerKeys.includes(normalizeKey(alias)));
    const hasFornecedor = OC_IMPORT_ALIASES.fornecedorNome.some((alias) => headerKeys.includes(normalizeKey(alias)));
    const hasComprador = OC_IMPORT_ALIASES.comprador.some((alias) => headerKeys.includes(normalizeKey(alias)));

    const score = [hasNumero, hasStatus, hasValor, hasData, hasFornecedor, hasComprador].filter(Boolean).length;
    if (score > bestScore) {
      bestScore = score;
      bestName = sheetName;
      bestRows = rows;
    }
  });

  return { sheetName: bestName, rows: bestRows, score: bestScore };
}

function answerProcurementQuestion(rawQuestion: string, facts: AssistantFacts) {
  const q = normalizeName(rawQuestion);
  if (!q) {
    return "Pergunte sobre SC, OC, valores, atrasos, fornecedores, setores, prazos, lead time, aprovacao, ranking ou uso dos modulos.";
  }

  if (q.includes("total") && q.includes("sc") && q.includes("oc")) {
    return `Total atual: ${facts.totalSc} SC e ${facts.totalOc} OC. Valor consolidado: ${formatCurrency(facts.totalScOcValue)}.`;
  }

  if (q.includes("valor") || q.includes("financeiro") || q.includes("gasto")) {
    return `Valor consolidado SC + OC: ${formatCurrency(facts.totalScOcValue)}.`;
  }

  if (q.includes("atras") || q.includes("atrasada") || q.includes("atraso")) {
    return `Existem ${facts.delayedOc} OCs atrasadas e ${facts.openOc} OCs em aberto.`;
  }

  if (q.includes("pendente") || q.includes("analise") || q.includes("aprova")) {
    return `Temos ${facts.pendingSc} SC em analise. Tempo medio de aprovacao: ${facts.approvalTime} dias.`;
  }

  if (q.includes("fornecedor") && (q.includes("lider") || q.includes("top") || q.includes("melhor"))) {
    return `Fornecedor lider atual: ${facts.topSupplier}. Fornecedores ativos: ${facts.activeSuppliers}.`;
  }

  if (q.includes("setor") && (q.includes("lider") || q.includes("top") || q.includes("maior"))) {
    return `Setor lider atual: ${facts.topSector}.`;
  }

  if (q.includes("prazo") || q.includes("sla")) {
    return `Taxa de entregas no prazo: ${facts.onTimeRate}%.`;
  }

  if (q.includes("lead") || q.includes("entrega")) {
    return `Lead time medio atual: ${facts.leadTime} dias.`;
  }

  if (q.includes("kpi") || q.includes("analytics")) {
    return "Use a aba KPIs & Analytics para tempo medio de aprovacao, lead time, taxa no prazo, ticket medio e evolucao financeira mensal.";
  }

  if (q.includes("excel") || q.includes("import") || q.includes("export")) {
    return "Use a aba Exportacao Excel para exportar dashboard completo e importar abas SC, OC, FORNECEDORES e SETORES com validacao.";
  }

  if (q.includes("como") || q.includes("onde") || q.includes("modulo")) {
    return "Fluxo recomendado: 1) Central SC/OC para lancamentos e edicoes. 2) Acompanhamento para Kanban e timeline. 3) KPIs & Analytics para analise executiva.";
  }

  return "Nao encontrei uma resposta direta para essa pergunta. Tente: total de SC/OC, valor total, atrasos, fornecedor lider, setor lider, taxa no prazo ou lead time.";
}

function ModuleTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">{subtitle}</p>
      <h2 className="text-2xl font-bold text-white/95">{title}</h2>
    </div>
  );
}

function LoginCard() {
  const { login, hydrated } = useProcurement();
  const [email, setEmail] = useState("admin@cyberproc.local");
  const [senha, setSenha] = useState("Admin@123");
  const [erro, setErro] = useState("");

  if (!hydrated) {
    return (
      <div className="mx-auto mt-20 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/90 p-8 text-center shadow-[0_20px_40px_rgba(2,6,23,0.55)]">
        <div className="mx-auto mb-4 h-12 w-44 opacity-90">
          <Image src="/avg-logo.svg" alt="Grupo AVG Emesa" width={176} height={48} className="h-full w-full object-contain" priority />
        </div>
        <p className="text-sm text-slate-300">Carregando sessao segura...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/92 p-8 shadow-[0_24px_50px_rgba(2,6,23,0.65)]">
      <div className="mb-5 h-14 w-56">
        <Image src="/avg-logo.svg" alt="Grupo AVG Emesa" width={224} height={56} className="h-full w-full object-contain object-left" priority />
      </div>
      <h1 className="font-orbitron text-2xl text-slate-100">SC / OC Desenvolvido por Michel Almeida</h1>
      <p className="mt-2 text-sm text-slate-400">Acesso corporativo para gestao de procurement, aprovacoes e inteligencia operacional.</p>
      <div className="mt-6 space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-200" placeholder="Email corporativo" />
        <input value={senha} type="password" onChange={(e) => setSenha(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-200" placeholder="Senha" />
        {erro ? <p className="text-xs text-rose-400">{erro}</p> : null}
        <button
          className="w-full rounded-xl border border-cyan-400/40 bg-cyan-400/15 p-3 font-semibold text-cyan-100 transition hover:bg-cyan-400/25"
          onClick={async () => {
            const result = await login(email, senha);
            if (!result.ok) setErro(result.message);
          }}
        >
          Acessar Command Center
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-500">Perfis de teste: admin/compras/gestor/solicitante/viewer.</p>
    </div>
  );
}

export function ProcurementControlCenter() {
  const {
    state,
    filters,
    setFilters,
    resetFilters,
    refreshState,
    currentUser,
    logout,
    collapsedSidebar,
    setCollapsedSidebar,
    canEdit,
    createSC,
    updateSC,
    deleteSC,
    createOC,
    updateOC,
    deleteOC,
    createSupplier,
    createSupplierWithResult,
    updateSupplier,
    deleteSupplier,
    createSector,
    updateSector,
    deleteSector,
    moveTrackingItem,
    importAllData,
  } = useProcurement();

  const [module, setModule] = useState<AppModule>("DASHBOARD");
  const [selectedSC, setSelectedSC] = useState<string>(state.scs[0]?.id ?? "");
  const [importReport, setImportReport] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quickActionFeedback, setQuickActionFeedback] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("Pergunte sobre SC, OC, valores, atrasos, fornecedores e indicadores.");
  const [movementDetail, setMovementDetail] = useState<{ title: string; description: string; details: string } | null>(null);
  const [filterDraft, setFilterDraft] = useState(filters);
  const [financialSort, setFinancialSort] = useState<"desc" | "asc">("desc");
  const [sectorViewMode, setSectorViewMode] = useState<"quantidade" | "valor">("quantidade");
  const [sectorSortMode, setSectorSortMode] = useState<"desc" | "asc">("desc");
  const [financialViewMode, setFinancialViewMode] = useState<"setor" | "status">("setor");
  const [supplierRankMode, setSupplierRankMode] = useState<"valor" | "quantidade">("valor");
  const [buyerRankMode, setBuyerRankMode] = useState<"valor" | "quantidade">("quantidade");
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [agingDrilldown, setAgingDrilldown] = useState<string>("");
  const [centralPreset, setCentralPreset] = useState<"" | "SC_SEM_FORNECEDOR" | "SC_SEM_OC">("");
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const scFilterInputRef = useRef<HTMLInputElement | null>(null);
  const responsibleFilterInputRef = useRef<HTMLInputElement | null>(null);

  function openCentralWithFilters(partial: Partial<typeof filters>) {
    const nextFilters = { ...filters, ...partial };
    setFilters(nextFilters);
    setFilterDraft(nextFilters);
    setAgingDrilldown("");
    setCentralPreset("");
    setModule("SC");
  }

  function openCentralWithPreset(preset: "SC_SEM_FORNECEDOR" | "SC_SEM_OC") {
    setAgingDrilldown("");
    setCentralPreset(preset);
    setModule("SC");
  }

  function openAgingDrilldown(bucket: string) {
    setAgingDrilldown(bucket);
    setCentralPreset("");
    setModule("SC");
  }

  function applyGlobalFilters() {
    setFilters(filterDraft);
  }

  function clearGlobalFilters() {
    resetFilters();
    setFilterDraft(EMPTY_FILTERS);
    setCentralPreset("");
    setAgingDrilldown("");
    setQuickActionFeedback("Filtros limpos.");
  }

  const dataset = useMemo(() => filterData(state, filters), [state, filters]);
  const kpis = useMemo(() => computeKpis(state, filters), [state, filters]);
  const monthly = useMemo(() => monthlySeries(state, filters), [state, filters]);
  const ranking = useMemo(() => supplierRanking(state, filters), [state, filters]);
  const statuses = useMemo(() => statusSeries(state, filters), [state, filters]);
  const kpisGlobal = useMemo(() => computeKpis(state, EMPTY_FILTERS), [state]);
  const monthlyGlobal = useMemo(() => monthlySeries(state, EMPTY_FILTERS), [state]);
  const statusesGlobal = useMemo(() => statusSeries(state, EMPTY_FILTERS), [state]);
  const rankingGlobal = useMemo(() => supplierRanking(state, EMPTY_FILTERS), [state]);
  const rankingPerformance = useMemo(
    () => rankingGlobal.filter((item) => item.totalOC > 0 || item.valorTotal > 0),
    [rankingGlobal],
  );
  const supplierExecutiveRanking = useMemo(() => {
    const sorted = [...rankingPerformance].sort((a, b) => {
      if (supplierRankMode === "quantidade") {
        if (b.totalOC !== a.totalOC) return b.totalOC - a.totalOC;
        return b.valorTotal - a.valorTotal;
      }
      if (b.valorTotal !== a.valorTotal) return b.valorTotal - a.valorTotal;
      return b.totalOC - a.totalOC;
    });
    return sorted.slice(0, 10);
  }, [rankingPerformance, supplierRankMode]);
  const buyerExecutiveRanking = useMemo(() => {
    const map = new Map<string, { comprador: string; totalOC: number; valorTotal: number }>();
    dataset.ocFiltered.forEach((oc) => {
      const comprador = (oc.responsavel || "Nao informado").trim() || "Nao informado";
      const row = map.get(comprador) ?? { comprador, totalOC: 0, valorTotal: 0 };
      row.totalOC += 1;
      row.valorTotal += oc.valorOC;
      map.set(comprador, row);
    });
    const base = Array.from(map.values());
    base.sort((a, b) => {
      if (buyerRankMode === "quantidade") {
        if (b.totalOC !== a.totalOC) return b.totalOC - a.totalOC;
        return b.valorTotal - a.valorTotal;
      }
      if (b.valorTotal !== a.valorTotal) return b.valorTotal - a.valorTotal;
      return b.totalOC - a.totalOC;
    });
    return base.slice(0, 10);
  }, [dataset.ocFiltered, buyerRankMode]);
  const analyticsValuePerOc = useMemo(
    () => (kpisGlobal.totalOC > 0 ? kpisGlobal.valorTotalOC / kpisGlobal.totalOC : 0),
    [kpisGlobal.totalOC, kpisGlobal.valorTotalOC],
  );
  const analyticsScToOcConversion = useMemo(
    () => (kpisGlobal.totalSC > 0 ? Number(((kpisGlobal.totalOC / kpisGlobal.totalSC) * 100).toFixed(2)) : 0),
    [kpisGlobal.totalOC, kpisGlobal.totalSC],
  );
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: keyof typeof filters; label: string; value: string }> = [];
    if (filters.ano) chips.push({ key: "ano", label: "ANO", value: filters.ano });
    if (filters.mes) chips.push({ key: "mes", label: "MES", value: filters.mes });
    if (filters.setorId) {
      const setor = state.setores.find((x) => x.id === filters.setorId)?.nome ?? filters.setorId;
      chips.push({ key: "setorId", label: "SETOR", value: setor });
    }
    if (filters.fornecedorId) {
      const forn = state.fornecedores.find((x) => x.id === filters.fornecedorId)?.nomeFantasia ?? filters.fornecedorId;
      chips.push({ key: "fornecedorId", label: "FORNECEDOR", value: forn });
    }
    if (filters.responsavel) chips.push({ key: "responsavel", label: "RESP", value: filters.responsavel });
    if (filters.status) chips.push({ key: "status", label: "STATUS", value: filters.status });
    if (filters.sc) chips.push({ key: "sc", label: "SC", value: filters.sc });
    if (filters.oc) chips.push({ key: "oc", label: "OC", value: filters.oc });
    return chips;
  }, [filters, state.setores, state.fornecedores]);
  const unifiedRows = useMemo(() => buildUnifiedRows(dataset.scFiltered, dataset.ocFiltered as PurchaseOrder[], state.setores, state.fornecedores), [dataset.scFiltered, dataset.ocFiltered, state.setores, state.fornecedores]);
  const scOcBySector = useMemo(() => {
    const map = new Map<string, { setor: string; total: number; valor: number }>();
    dataset.scFiltered.forEach((sc) => {
      const setorNome = state.setores.find((s) => s.id === sc.setorId)?.nome ?? "Sem setor";
      const current = map.get(setorNome) ?? { setor: setorNome, total: 0, valor: 0 };
      current.total += 1;
      current.valor += sc.valorEstimado;
      map.set(setorNome, current);
    });
    dataset.ocFiltered.forEach((oc) => {
      const setorNome = state.setores.find((s) => s.id === oc.setorId)?.nome ?? "Sem setor";
      const current = map.get(setorNome) ?? { setor: setorNome, total: 0, valor: 0 };
      current.total += 1;
      current.valor += oc.valorOC;
      map.set(setorNome, current);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [dataset.scFiltered, dataset.ocFiltered, state.setores]);
  const assistantFacts = useMemo<AssistantFacts>(() => ({
    totalSc: kpisGlobal.totalSC,
    totalOc: kpisGlobal.totalOC,
    totalScOcValue: kpisGlobal.valorTotalOC,
    pendingSc: kpisGlobal.emAnalise,
    openOc: kpisGlobal.entregasPendentes,
    delayedOc: kpisGlobal.entregasAtrasadas,
    topSupplier: rankingPerformance[0]?.fornecedor ?? "Sem fornecedor lider",
    topSector: scOcBySector[0]?.setor ?? "Sem setor lider",
    activeSuppliers: kpisGlobal.fornecedoresAtivos,
    onTimeRate: kpisGlobal.taxaEntregaNoPrazo,
    leadTime: kpisGlobal.leadTimeMedioDias,
    approvalTime: kpisGlobal.tempoMedioAprovacaoDias,
  }), [kpisGlobal, rankingPerformance, scOcBySector]);
  const ocExecutiveDistribution = useMemo(() => {
    const groups = {
      ABERTAS: { key: "ABERTAS", label: "ABERTAS", total: 0, value: 0, color: CYAN, filter: "ABERTO_TOTAL" },
      FINALIZADAS_LIQUIDADAS: { key: "FINALIZADAS_LIQUIDADAS", label: "FINALIZADAS / LIQUIDADAS", total: 0, value: 0, color: GREEN, filter: "LIQUIDADO" },
      NAO_FECHADAS: { key: "NAO_FECHADAS", label: "NAO FECHADAS", total: 0, value: 0, color: AMBER, filter: "NAO_FECHADO" },
      CANCELADAS: { key: "CANCELADAS", label: "CANCELADAS", total: 0, value: 0, color: RED, filter: "CANCELADA" },
    };

    dataset.ocFiltered.forEach((oc) => {
      const group = ocStatusToExecutive(oc.status as OCStatus);
      groups[group].total += 1;
      groups[group].value += oc.valorOC;
    });

    const total = dataset.ocFiltered.length;
    return Object.values(groups).map((item) => ({
      ...item,
      percent: toPercent(item.total, total),
    }));
  }, [dataset.ocFiltered]);
  const pipelineStages = useMemo(() => {
    const total = Math.max(1, dataset.ocFiltered.length);
    const abertas = ocExecutiveDistribution.find((x) => x.key === "ABERTAS")?.total ?? 0;
    const finalizadas = ocExecutiveDistribution.find((x) => x.key === "FINALIZADAS_LIQUIDADAS")?.total ?? 0;
    const naoFechadas = ocExecutiveDistribution.find((x) => x.key === "NAO_FECHADAS")?.total ?? 0;
    const canceladas = ocExecutiveDistribution.find((x) => x.key === "CANCELADAS")?.total ?? 0;
    return [
      { key: "TOTAL_OC", label: "Total de OCs", count: dataset.ocFiltered.length, percent: 100, value: kpis.valorTotalOC, action: () => openCentralWithFilters({ status: "" }) },
      { key: "ABERTAS", label: "Abertas", count: abertas, percent: toPercent(abertas, total), value: dataset.ocFiltered.filter((oc) => oc.status === "ABERTO_TOTAL").reduce((sum, oc) => sum + oc.valorOC, 0), action: () => openCentralWithFilters({ status: "ABERTO_TOTAL" }) },
      { key: "FINALIZADAS", label: "Finalizadas/Liquidadas", count: finalizadas, percent: toPercent(finalizadas, total), value: dataset.ocFiltered.filter((oc) => oc.status === "LIQUIDADO" || oc.status === "ABERTO_PARCIAL").reduce((sum, oc) => sum + oc.valorOC, 0), action: () => openCentralWithFilters({ status: "LIQUIDADO" }) },
      { key: "NAO_FECHADAS", label: "Nao Fechadas", count: naoFechadas, percent: toPercent(naoFechadas, total), value: dataset.ocFiltered.filter((oc) => oc.status === "NAO_FECHADO").reduce((sum, oc) => sum + oc.valorOC, 0), action: () => openCentralWithFilters({ status: "NAO_FECHADO" }) },
      { key: "CANCELADAS", label: "Canceladas", count: canceladas, percent: toPercent(canceladas, total), value: dataset.ocFiltered.filter((oc) => oc.status === "CANCELADA").reduce((sum, oc) => sum + oc.valorOC, 0), action: () => openCentralWithFilters({ status: "CANCELADA" }) },
    ];
  }, [dataset.ocFiltered, kpis.valorTotalOC, ocExecutiveDistribution]);
  const pipelineDistribution = useMemo(() => {
    return ocExecutiveDistribution.map((item) => ({
      status: item.label,
      total: item.total,
      percent: item.percent,
      filter: item.filter,
      value: item.value,
      key: item.key,
      color: item.color,
    }));
  }, [ocExecutiveDistribution]);
  const pipelineStatusData = useMemo(() => {
    return pipelineDistribution.map((item) => ({
      key: item.key,
      label: item.status,
      total: item.total,
      percent: item.percent,
      color: item.color,
      value: item.value,
      filter: item.filter,
    }));
  }, [pipelineDistribution]);
  const pipelineTotals = useMemo(() => {
    const totalProcessos = pipelineStatusData.reduce((sum, item) => sum + item.total, 0);
    const totalValor = pipelineStatusData.reduce((sum, item) => sum + item.value, 0);
    return { totalProcessos, totalValor };
  }, [pipelineStatusData]);
  const sectorDistribution = useMemo(() => {
    const total = scOcBySector.reduce((sum, item) => sum + item.total, 0);
    return scOcBySector.map((item) => ({ ...item, percent: toPercent(item.total, total) }));
  }, [scOcBySector]);
  const sectorRankData = useMemo(() => {
    const sorted = [...scOcBySector].sort((a, b) => {
      const metricA = sectorViewMode === "valor" ? a.valor : a.total;
      const metricB = sectorViewMode === "valor" ? b.valor : b.total;
      return sectorSortMode === "desc" ? metricB - metricA : metricA - metricB;
    });
    return sorted;
  }, [scOcBySector, sectorViewMode, sectorSortMode]);
  const maxSectorRankMetric = useMemo(() => {
    const values = sectorRankData.map((item) => (sectorViewMode === "valor" ? item.valor : item.total));
    return Math.max(1, ...values);
  }, [sectorRankData, sectorViewMode]);
  const financialBySector = useMemo(() => {
    const data = [...scOcBySector].sort((a, b) => (financialSort === "desc" ? b.valor - a.valor : a.valor - b.valor));
    return data;
  }, [scOcBySector, financialSort]);
  const financialByStatus = useMemo(() => {
    const statusValue = new Map<string, { label: string; value: number; filter: string; color: string }>([
      ["ABERTO_TOTAL", { label: "ABERTO", value: 0, filter: "ABERTO_TOTAL", color: CYAN }],
      ["FINALIZADAS", { label: "FINALIZADO / LIQUIDADO", value: 0, filter: "LIQUIDADO", color: GREEN }],
      ["NAO_FECHADO", { label: "NAO FECHADO", value: 0, filter: "NAO_FECHADO", color: AMBER }],
      ["CANCELADA", { label: "CANCELADO", value: 0, filter: "CANCELADA", color: RED }],
    ]);

    dataset.ocFiltered.forEach((oc) => {
      const key = oc.status === "ABERTO_PARCIAL" || oc.status === "LIQUIDADO" ? "FINALIZADAS" : oc.status;
      const row = statusValue.get(key);
      if (row) row.value += oc.valorOC;
    });

    return Array.from(statusValue.values()).sort((a, b) => (financialSort === "desc" ? b.value - a.value : a.value - b.value));
  }, [dataset.ocFiltered, financialSort]);
  const financialIntelligenceData = useMemo(() => {
    if (financialViewMode === "setor") return financialBySector.map((item) => ({ key: item.setor, label: item.setor, value: item.valor, meta: `${item.total} processos`, color: CYAN, type: "setor" as const }));
    return financialByStatus.map((item) => ({ key: item.label, label: item.label, value: item.value, meta: item.filter, color: item.color, type: "status" as const }));
  }, [financialViewMode, financialBySector, financialByStatus]);
  const maxFinancialIntValue = useMemo(() => Math.max(1, ...financialIntelligenceData.map((item) => item.value)), [financialIntelligenceData]);
  const maxFinancialValue = useMemo(() => {
    const values = financialBySector.map((item) => item.valor);
    return Math.max(1, ...values);
  }, [financialBySector]);
  const agingData = useMemo(() => {
    const buckets = new Map<string, number>([["0-7", 0], ["8-15", 0], ["16-30", 0], ["31-60", 0], ["+60", 0]]);
    dataset.scFiltered.forEach((sc) => {
      if (["APROVADA", "REPROVADA", "LANCADA"].includes(sc.status)) return;
      const days = diffDaysFromNow(sc.dataCriacao);
      buckets.set(agingBucketLabel(days), (buckets.get(agingBucketLabel(days)) ?? 0) + 1);
    });
    dataset.ocFiltered.forEach((oc) => {
      if (["LIQUIDADO", "ABERTO_PARCIAL", "CANCELADA"].includes(oc.status)) return;
      const days = diffDaysFromNow(oc.dataOC);
      buckets.set(agingBucketLabel(days), (buckets.get(agingBucketLabel(days)) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([faixa, total]) => ({ faixa, total }));
  }, [dataset.scFiltered, dataset.ocFiltered]);
  const scForCentral = useMemo(() => {
    let scoped = dataset.scFiltered;
    if (agingDrilldown) {
      scoped = scoped.filter((sc) => {
        if (["APROVADA", "REPROVADA", "LANCADA"].includes(sc.status)) return false;
        return agingBucketLabel(diffDaysFromNow(sc.dataCriacao)) === agingDrilldown;
      });
    }
    if (centralPreset === "SC_SEM_FORNECEDOR") {
      scoped = scoped.filter((sc) => !sc.fornecedorSugeridoId);
    }
    if (centralPreset === "SC_SEM_OC") {
      scoped = scoped.filter((sc) => !sc.numeroOCRelacionada);
    }
    return scoped;
  }, [dataset.scFiltered, agingDrilldown, centralPreset]);
  const ocForCentral = useMemo(() => {
    let scoped = dataset.ocFiltered as PurchaseOrder[];
    if (agingDrilldown) {
      scoped = scoped.filter((oc) => {
        if (["LIQUIDADO", "ABERTO_PARCIAL", "CANCELADA"].includes(oc.status)) return false;
        return agingBucketLabel(diffDaysFromNow(oc.dataOC)) === agingDrilldown;
      });
    }
    if (centralPreset === "SC_SEM_FORNECEDOR" || centralPreset === "SC_SEM_OC") {
      scoped = [];
    }
    return scoped;
  }, [dataset.ocFiltered, agingDrilldown, centralPreset]);
  const supplierPerformance = useMemo(() => {
    const scBySupplier = new Map<string, number>();
    dataset.scFiltered.forEach((sc) => {
      if (!sc.fornecedorSugeridoId) return;
      scBySupplier.set(sc.fornecedorSugeridoId, (scBySupplier.get(sc.fornecedorSugeridoId) ?? 0) + 1);
    });
    return rankingPerformance
      .map((item) => ({
        ...item,
        totalSC: scBySupplier.get(item.fornecedorId) ?? 0,
      }))
      .slice(0, 10);
  }, [dataset.scFiltered, rankingPerformance]);
  const scWithoutOc = useMemo(() => dataset.scFiltered.filter((sc) => !sc.numeroOCRelacionada).length, [dataset.scFiltered]);
  const scWithoutSupplier = useMemo(() => dataset.scFiltered.filter((sc) => !sc.fornecedorSugeridoId).length, [dataset.scFiltered]);
  const longAgingCount = useMemo(() => agingData.find((x) => x.faixa === "+60")?.total ?? 0, [agingData]);
  const agingOpenItems = useMemo(() => {
    const scAges = dataset.scFiltered
      .filter((sc) => !["APROVADA", "REPROVADA", "LANCADA"].includes(sc.status))
      .map((sc) => diffDaysFromNow(sc.dataCriacao));
    const ocAges = dataset.ocFiltered
      .filter((oc) => !["LIQUIDADO", "ABERTO_PARCIAL", "CANCELADA"].includes(oc.status))
      .map((oc) => diffDaysFromNow(oc.dataOC));
    return [...scAges, ...ocAges];
  }, [dataset.scFiltered, dataset.ocFiltered]);
  const averageAgingDays = useMemo(() => {
    if (!agingOpenItems.length) return null;
    return Number((agingOpenItems.reduce((sum, d) => sum + d, 0) / agingOpenItems.length).toFixed(1));
  }, [agingOpenItems]);
  const slaMetrics = useMemo(() => {
    const openOcWithDeadline = dataset.ocFiltered.filter((oc) => !["LIQUIDADO", "ABERTO_PARCIAL", "CANCELADA"].includes(oc.status) && !!oc.dataPrevistaEntrega);
    if (!openOcWithDeadline.length) {
      return {
        hasData: false,
        averageSlaDays: null as number | null,
        statusLabel: "SEM HISTORICO SUFICIENTE",
        noPrazoPercent: null as number | null,
        riscoPercent: null as number | null,
        atrasadoPercent: null as number | null,
      };
    }

    const now = new Date().toISOString().slice(0, 10);
    let noPrazo = 0;
    let emRisco = 0;
    let atrasados = 0;
    const slaSamples = openOcWithDeadline
      .map((oc) => diffDaysBetween(oc.dataOC, oc.dataPrevistaEntrega))
      .filter((value) => value > 0);

    openOcWithDeadline.forEach((oc) => {
      const remaining = diffDaysBetween(now, oc.dataPrevistaEntrega);
      if (now > oc.dataPrevistaEntrega) {
        atrasados += 1;
      } else if (remaining <= 2) {
        emRisco += 1;
      } else {
        noPrazo += 1;
      }
    });

    const total = openOcWithDeadline.length;
    const averageSlaDays = slaSamples.length ? Number((slaSamples.reduce((sum, d) => sum + d, 0) / slaSamples.length).toFixed(1)) : null;
    const statusLabel = atrasados > 0 ? "FORA DO SLA" : emRisco > 0 ? "EM RISCO" : "DENTRO DO SLA";

    return {
      hasData: true,
      averageSlaDays,
      statusLabel,
      noPrazoPercent: toPercent(noPrazo, total),
      riscoPercent: toPercent(emRisco, total),
      atrasadoPercent: toPercent(atrasados, total),
    };
  }, [dataset.ocFiltered]);
  const operationalHealth = useMemo(
    () => calculateOperationalHealth({
      totalSc: kpis.totalSC,
      totalOc: kpis.totalOC,
      delayedOc: kpis.entregasAtrasadas,
      pendingSc: kpis.emAnalise,
      withoutSupplier: scWithoutSupplier,
      withoutOc: scWithoutOc,
      longAging: longAgingCount,
    }),
    [kpis, scWithoutSupplier, scWithoutOc, longAgingCount],
  );
  const operationalHealthFactors = useMemo(
    () => [
      { label: "SC em analise", score: Math.max(0, 100 - toPercent(kpis.emAnalise, Math.max(1, kpis.totalSC))) },
      { label: "OC atrasadas", score: Math.max(0, 100 - toPercent(kpis.entregasAtrasadas, Math.max(1, kpis.totalOC))) },
      { label: "SC sem fornecedor", score: Math.max(0, 100 - toPercent(scWithoutSupplier, Math.max(1, kpis.totalSC))) },
      { label: "SC sem OC", score: Math.max(0, 100 - toPercent(scWithoutOc, Math.max(1, kpis.totalSC))) },
      { label: "Aging critico (+60)", score: Math.max(0, 100 - toPercent(longAgingCount, Math.max(1, kpis.totalSC + kpis.totalOC))) },
    ],
    [kpis.emAnalise, kpis.totalSC, kpis.entregasAtrasadas, kpis.totalOC, scWithoutSupplier, scWithoutOc, longAgingCount],
  );
  const attentionItems = useMemo(() => {
    const items: Array<{ id: string; label: string; detail: string; onClick: () => void }> = [];
    if (kpis.emAnalise > 0) items.push({ id: "att-analise", label: "SC aguardando aprovacao", detail: `${kpis.emAnalise} em analise`, onClick: () => openCentralWithFilters({ status: "EM_ANALISE" }) });
    if (kpis.entregasAtrasadas > 0) items.push({ id: "att-atrasadas", label: "OC nao fechada", detail: `${kpis.entregasAtrasadas} nao fechadas`, onClick: () => openCentralWithFilters({ status: "NAO_FECHADO" }) });
    if (scWithoutSupplier > 0) items.push({ id: "att-no-supplier", label: "SC sem fornecedor", detail: `${scWithoutSupplier} sem fornecedor`, onClick: () => openCentralWithPreset("SC_SEM_FORNECEDOR") });
    if (scWithoutOc > 0) items.push({ id: "att-no-oc", label: "SC sem OC", detail: `${scWithoutOc} sem OC`, onClick: () => openCentralWithPreset("SC_SEM_OC") });
    if (longAgingCount > 0) items.push({ id: "att-aging", label: "Processos +60 dias", detail: `${longAgingCount} processos`, onClick: () => openAgingDrilldown("+60") });
    return items;
  }, [kpis.emAnalise, kpis.entregasAtrasadas, scWithoutSupplier, scWithoutOc, longAgingCount]);
  const executiveInsights = useMemo(() => {
    const insights: Array<{ id: string; tone: "ok" | "warn" | "risk"; title: string; detail: string }> = [];
    const total = Math.max(1, pipelineTotals.totalProcessos);
    const approvedCount = pipelineDistribution.find((item) => item.filter === "APROVADA")?.total ?? 0;
    const approvedRate = toPercent(approvedCount, total);
    const avgValue = pipelineTotals.totalValor > 0 ? pipelineTotals.totalValor / total : 0;
    const hasHighPending = dataset.scFiltered.some((sc) => sc.status === "EM_ANALISE" && sc.valorEstimado > avgValue && avgValue > 0);

    if (pipelineTotals.totalProcessos === 0) {
      insights.push({ id: "ins-empty", tone: "warn", title: "SEM HISTORICO SUFICIENTE", detail: "Nao ha processos no periodo filtrado para gerar leitura executiva." });
      return insights;
    }

    if (kpis.entregasAtrasadas === 0 && kpis.emAnalise <= 1) {
      insights.push({ id: "ins-stable", tone: "ok", title: "OPERACAO ESTAVEL", detail: `${approvedRate}% dos processos estao aprovados e nao ha OCs atrasadas.` });
    } else if (kpis.entregasAtrasadas > 0) {
      insights.push({ id: "ins-delay", tone: "risk", title: "PONTO DE ATENCAO", detail: `${kpis.entregasAtrasadas} OCs atrasadas exigem acao imediata da equipe de compras.` });
    }

    if (hasHighPending) {
      insights.push({ id: "ins-high-value", tone: "warn", title: "PENDENCIA DE ALTO IMPACTO", detail: "Existe SC em analise com valor acima da media dos processos filtrados." });
    }

    if (slaMetrics.hasData && slaMetrics.atrasadoPercent !== null) {
      insights.push({ id: "ins-sla", tone: slaMetrics.atrasadoPercent > 0 ? "risk" : "ok", title: "STATUS OPERACIONAL", detail: `SLA atual: ${slaMetrics.statusLabel}. No prazo: ${slaMetrics.noPrazoPercent ?? 0}% | Em risco: ${slaMetrics.riscoPercent ?? 0}% | Atrasados: ${slaMetrics.atrasadoPercent ?? 0}%.` });
    }

    return insights.slice(0, 3);
  }, [pipelineTotals.totalProcessos, pipelineTotals.totalValor, pipelineDistribution, dataset.scFiltered, kpis.entregasAtrasadas, kpis.emAnalise, slaMetrics]);
  const operationalSnapshotItems = useMemo(
    () => [
      { id: "snap-sc-analise", label: "SCs em analise", value: kpis.emAnalise, onClick: () => openCentralWithFilters({ status: "EM_ANALISE" }) },
      { id: "snap-oc-curso", label: "OCs em curso", value: kpis.entregasPendentes, onClick: () => openCentralWithFilters({ status: "" }) },
      { id: "snap-oc-nao-fechada", label: "OCs nao fechadas", value: kpis.entregasAtrasadas, onClick: () => openCentralWithFilters({ status: "NAO_FECHADO" }) },
      { id: "snap-sc-sem-oc", label: "SCs sem OC", value: scWithoutOc, onClick: () => openCentralWithPreset("SC_SEM_OC") },
      { id: "snap-sc-sem-forn", label: "SCs sem fornecedor", value: scWithoutSupplier, onClick: () => openCentralWithPreset("SC_SEM_FORNECEDOR") },
      { id: "snap-criticos", label: "Processos criticos", value: longAgingCount + kpis.entregasAtrasadas, onClick: () => openAgingDrilldown("+60") },
    ],
    [kpis.emAnalise, kpis.entregasPendentes, kpis.entregasAtrasadas, scWithoutOc, scWithoutSupplier, longAgingCount],
  );
  const ocByPhase = useMemo(() => {
    const order: OcPhase[] = ["ABERTO_TOTAL", "ABERTO_PARCIAL", "LIQUIDADO", "NAO_FECHADO", "CANCELADA"];
    const map = new Map<OcPhase, number>();
    dataset.ocFiltered.forEach((oc) => {
      const phase = ocToPhase(oc.status as OCStatus);
      map.set(phase, (map.get(phase) ?? 0) + 1);
    });
    return order.map((phase) => ({ status: OC_PHASE_LABEL[phase], total: map.get(phase) ?? 0 }));
  }, [dataset.ocFiltered]);
  const unifiedStatusCards = useMemo(() => {
    const finalizadas = dataset.ocFiltered.filter((oc) => oc.status === "LIQUIDADO" || oc.status === "ABERTO_PARCIAL").length;
    const abertas = dataset.ocFiltered.filter((oc) => oc.status === "ABERTO_TOTAL").length;
    const naoFechadas = dataset.ocFiltered.filter((oc) => oc.status === "NAO_FECHADO").length;
    const canceladas = dataset.ocFiltered.filter((oc) => oc.status === "CANCELADA").length;
    const counts = {
      aprovada: finalizadas,
      emAnalise: abertas,
      reprovada: canceladas,
      lancada: naoFechadas,
      atrasada: naoFechadas,
    };

    return counts;
  }, [dataset.ocFiltered]);
  const unifiedStatusPie = useMemo(
    () => [
      { status: "Finalizadas / Liquidadas", total: unifiedStatusCards.aprovada },
      { status: "Abertas", total: unifiedStatusCards.emAnalise },
      { status: "Nao Fechadas", total: unifiedStatusCards.lancada },
      { status: "Canceladas", total: unifiedStatusCards.reprovada },
    ],
    [unifiedStatusCards],
  );
  const unifiedStatusEvolution = useMemo(() => {
    const map = new Map<string, { mes: string; aprovada: number; emAnalise: number; reprovada: number; lancada: number }>();

    dataset.ocFiltered.forEach((oc) => {
      const key = oc.dataOC.slice(0, 7);
      if (!map.has(key)) map.set(key, { mes: key, aprovada: 0, emAnalise: 0, reprovada: 0, lancada: 0 });
      const bucket = map.get(key)!;

      if (oc.status === "ABERTO_TOTAL") bucket.emAnalise += 1;
      else if (oc.status === "ABERTO_PARCIAL" || oc.status === "LIQUIDADO") bucket.aprovada += 1;
      else if (oc.status === "NAO_FECHADO") bucket.lancada += 1;
      else bucket.reprovada += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [dataset.ocFiltered]);
  const monthlyFinanceSeries = useMemo(() => {
    const map = new Map<string, { mes: string; valor: number }>();

    dataset.ocFiltered.forEach((oc) => {
      const key = oc.dataOC.slice(0, 7);
      const current = map.get(key) ?? { mes: key, valor: 0 };
      current.valor += oc.valorOC;
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [dataset.ocFiltered]);

  const delayedSeries = useMemo(() => {
    const map = new Map<string, number>();
    dataset.ocFiltered.forEach((oc) => {
      if (oc.status !== "NAO_FECHADO") return;
      const key = oc.dataOC.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([, total]) => total);
  }, [dataset.ocFiltered]);

  const premiumKpis = useMemo<PremiumKpiCard[]>(() => {
    const valueSeries = monthlyFinanceSeries.map((item) => item.valor);
    const approvedSeries = unifiedStatusEvolution.map((item) => item.aprovada);
    const analysisSeries = unifiedStatusEvolution.map((item) => item.emAnalise);
    const rejectedSeries = unifiedStatusEvolution.map((item) => item.reprovada);
    const launchedSeries = unifiedStatusEvolution.map((item) => item.lancada);
    const delayed = delayedSeries.length ? delayedSeries : [0];

    const deltaFrom = (series: number[]) => {
      const current = series.at(-1) ?? 0;
      const previous = series.at(-2) ?? current;
      return toDeltaPercent(current, previous);
    };

    return [
      {
        label: "VALOR TOTAL OCs",
        value: formatCurrency(kpis.valorTotalOC),
        note: "Base financeira oficial da OC",
        context: "vs. periodo anterior",
        delta: deltaFrom(valueSeries),
        color: GREEN,
        icon: BarChart3,
        series: valueSeries.length ? valueSeries : [0],
      },
      {
        label: "FINALIZADAS / LIQUIDADAS",
        value: String(unifiedStatusCards.aprovada),
        note: `${kpis.totalOC ? Math.round((unifiedStatusCards.aprovada / kpis.totalOC) * 100) : 0}% do total de OCs`,
        context: "vs. periodo anterior",
        delta: deltaFrom(approvedSeries),
        color: GREEN,
        icon: Shield,
        series: approvedSeries.length ? approvedSeries : [0],
      },
      {
        label: "ABERTAS",
        value: String(unifiedStatusCards.emAnalise),
        note: "Status: Aberto Total",
        context: "vs. periodo anterior",
        delta: deltaFrom(analysisSeries),
        color: CYAN,
        icon: Activity,
        invertDelta: true,
        series: analysisSeries.length ? analysisSeries : [0],
      },
      {
        label: "NAO FECHADAS",
        value: String(unifiedStatusCards.lancada),
        note: `${kpis.totalOC ? Math.round((unifiedStatusCards.lancada / kpis.totalOC) * 100) : 0}% do total de OCs`,
        context: "vs. periodo anterior",
        delta: deltaFrom(launchedSeries),
        color: AMBER,
        icon: AlertTriangle,
        invertDelta: true,
        series: launchedSeries.length ? launchedSeries : [0],
      },
      {
        label: "CANCELADAS",
        value: String(unifiedStatusCards.reprovada),
        note: `${kpis.totalOC ? Math.round((unifiedStatusCards.reprovada / kpis.totalOC) * 100) : 0}% do total de OCs`,
        context: "vs. periodo anterior",
        delta: deltaFrom(rejectedSeries),
        color: RED,
        icon: AlertTriangle,
        invertDelta: true,
        series: rejectedSeries.length ? rejectedSeries : [0],
      },
      {
        label: "NAO FECHADAS (RISCO)",
        value: String(unifiedStatusCards.atrasada),
        note: "Indicador de atencao operacional",
        context: "vs. periodo anterior",
        delta: deltaFrom(delayed),
        color: RED,
        icon: Truck,
        invertDelta: true,
        series: delayed,
      },
    ];
  }, [monthlyFinanceSeries, unifiedStatusEvolution, delayedSeries, kpis, unifiedStatusCards]);
  const latestRows = useMemo(() => unifiedRows.slice(0, 8), [unifiedRows]);
  const recentActivity = useMemo(() => {
    if (state.auditoria.length > 0) {
      return [...state.auditoria]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8)
        .map((item) => ({ id: item.id, title: `${item.entidade} ${item.acao}`, when: relativeTimePtBr(item.createdAt) }));
    }

    return latestRows.slice(0, 8).map((row) => ({
      id: `${row.entity}-${row.id}`,
      title: `${row.entity} ${row.entity === "SC" ? row.numeroSC : row.numeroOC} atualizada`,
      when: relativeTimePtBr(row.sortDate),
    }));
  }, [state.auditoria, latestRows]);
  const executiveSnapshot = useMemo(
    () => [
      {
        label: "Conversao SC->OC",
        value: `${analyticsScToOcConversion}%`,
        tone: "border-cyan-500/35 bg-cyan-500/10 text-cyan-100",
      },
      {
        label: "Lead Time Medio",
        value: `${kpis.leadTimeMedioDias} dias`,
        tone: "border-blue-500/35 bg-blue-500/10 text-blue-100",
      },
      {
        label: "No Prazo",
        value: `${kpis.taxaEntregaNoPrazo}%`,
        tone: "border-emerald-500/35 bg-emerald-500/10 text-emerald-100",
      },
      {
        label: "Saude",
        value: `${operationalHealth?.score ?? 0}`,
        tone: "border-amber-500/35 bg-amber-500/10 text-amber-100",
      },
    ],
    [analyticsScToOcConversion, kpis.leadTimeMedioDias, kpis.taxaEntregaNoPrazo, operationalHealth?.score],
  );
  const openOcCount = useMemo(() => dataset.ocFiltered.filter((oc) => oc.status === "ABERTO_TOTAL" || oc.status === "NAO_FECHADO").length, [dataset.ocFiltered]);
  const alerts = useMemo(() => buildAlerts(state, filters), [state, filters]);
  const delayedOcs = useMemo(() => dataset.ocFiltered.filter((oc) => oc.status === "NAO_FECHADO"), [dataset.ocFiltered]);
  const aiContext = useMemo<AiAnswerContext>(() => ({
    delayedCount: delayedOcs.length,
    topSupplier: ranking[0]?.fornecedor ?? "Sem fornecedor dominante",
    topSector: scOcBySector[0]?.setor ?? "Sem setor dominante",
    phaseSummary: ocByPhase.map((item) => `${item.status}: ${item.total}`).join(" | "),
    totalOcValue: formatCurrency(kpis.valorTotalOC),
    openOcCount,
    totalSc: kpis.totalSC,
    totalOc: kpis.totalOC,
    totalScOcValue: formatCurrency(kpis.valorTotalOC),
    pendingSc: dataset.scFiltered.filter((sc) => sc.status === "EM_ANALISE").length,
    activeSuppliers: dataset.fornecedoresAtivos.length,
    alertsCount: alerts.length,
  }), [delayedOcs.length, ranking, scOcBySector, ocByPhase, kpis.valorTotalOC, kpis.totalSC, kpis.totalOC, openOcCount, dataset.scFiltered, dataset.fornecedoresAtivos.length, alerts.length]);
  const anosDisponiveis = useMemo(() => {
    const years = new Set<string>();
    state.scs.forEach((sc) => years.add(sc.dataCriacao.slice(0, 4)));
    state.ocs.forEach((oc) => years.add(oc.dataOC.slice(0, 4)));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [state.scs, state.ocs]);

  const selectedScRecord = useMemo(() => dataset.scFiltered.find((x) => x.id === selectedSC) ?? dataset.scFiltered[0], [dataset.scFiltered, selectedSC]);
  const timeline = useMemo(() => (selectedScRecord ? buildScTimeline(selectedScRecord, state.ocs) : []), [selectedScRecord, state.ocs]);
  const commandResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return [] as Array<{ type: "SC" | "OC" | "FORNECEDOR"; id: string; label: string; subtitle: string }>;

    const scMatches = state.scs
      .filter((sc) => [sc.numeroSC, sc.solicitante, sc.descricao, sc.observacoes].some((part) => (part || "").toLowerCase().includes(q)))
      .slice(0, 6)
      .map((sc) => ({ type: "SC" as const, id: sc.id, label: sc.numeroSC, subtitle: `${sc.solicitante} • ${sc.descricao}` }));

    const ocMatches = state.ocs
      .filter((oc) => {
        const linkedSc = state.scs.find((sc) => sc.id === oc.scId);
        const supplier = state.fornecedores.find((f) => f.id === oc.fornecedorId);
        return [oc.numeroOC, oc.observacoes, oc.responsavel, linkedSc?.numeroSC, supplier?.nomeFantasia, supplier?.cnpj].some((part) => (part || "").toLowerCase().includes(q));
      })
      .slice(0, 6)
      .map((oc) => ({ type: "OC" as const, id: oc.id, label: oc.numeroOC, subtitle: `${oc.responsavel || "Sem responsavel"} • ${oc.status}` }));

    const supplierMatches = state.fornecedores
      .filter((f) => [f.nomeFantasia, f.razaoSocial, f.cnpj].some((part) => (part || "").toLowerCase().includes(q)))
      .slice(0, 6)
      .map((f) => ({ type: "FORNECEDOR" as const, id: f.id, label: f.nomeFantasia, subtitle: `${f.razaoSocial} • ${f.cnpj}` }));

    return [...scMatches, ...ocMatches, ...supplierMatches].slice(0, 14);
  }, [globalQuery, state.scs, state.ocs, state.fornecedores]);

  const runQuickRefresh = useCallback(async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      await refreshState();
      setQuickActionFeedback("Dados sincronizados com sucesso.");
    } catch {
      setQuickActionFeedback("Nao foi possivel sincronizar os dados agora.");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshState]);

  const cycleModule = useCallback((direction: "next" | "previous") => {
    const index = NAV.findIndex((item) => item.id === module);
    if (index < 0) return;
    const nextIndex = direction === "next"
      ? (index + 1) % NAV.length
      : (index - 1 + NAV.length) % NAV.length;
    setModule(NAV[nextIndex].id);
  }, [module]);

  const submitAiQuestion = useCallback((question: string) => {
    setAiAnswer(answerProcurementQuestion(question, assistantFacts));
  }, [assistantFacts]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingContext = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }

      if (event.altKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        void runQuickRefresh();
      }

      if (event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        clearGlobalFilters();
      }

      if (event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        scFilterInputRef.current?.focus();
      }

      if (event.altKey && event.key.toLowerCase() === "u") {
        event.preventDefault();
        responsibleFilterInputRef.current?.focus();
      }

      if (event.altKey && event.key === "ArrowRight" && !isTypingContext) {
        event.preventDefault();
        cycleModule("next");
      }

      if (event.altKey && event.key === "ArrowLeft" && !isTypingContext) {
        event.preventDefault();
        cycleModule("previous");
      }

      if (event.altKey && !isTypingContext) {
        const moduleMap: Record<string, AppModule> = {
          "1": "DASHBOARD",
          "2": "SC",
          "3": "ACOMPANHAMENTO",
          "4": "FORNECEDORES",
          "5": "KPIS_ANALYTICS",
          "6": "RELATORIOS",
        };
        const targetModule = moduleMap[event.key];
        if (targetModule) {
          event.preventDefault();
          setModule(targetModule);
        }
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [clearGlobalFilters, cycleModule, runQuickRefresh]);

  useEffect(() => {
    if (commandOpen) {
      window.setTimeout(() => commandInputRef.current?.focus(), 0);
    }
  }, [commandOpen]);

  useEffect(() => {
    if (!quickActionFeedback) return;
    const timer = window.setTimeout(() => setQuickActionFeedback(""), 2600);
    return () => window.clearTimeout(timer);
  }, [quickActionFeedback]);

  useEffect(() => {
    setFilterDraft(filters);
  }, [filters]);

  if (!currentUser) {
    return <LoginCard />;
  }

  const canWrite = canEdit;
  const nowStamp = new Date();
  const currentDate = nowStamp.toLocaleDateString("pt-BR");
  const currentTime = nowStamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

    const dashboardRows = [
      { indicador: "Total SC", valor: kpis.totalSC },
      { indicador: "Total OC", valor: kpis.totalOC },
      { indicador: "Valor Total SC", valor: kpis.valorTotalSC },
      { indicador: "Valor Total OC", valor: kpis.valorTotalOC },
      { indicador: "Entregas Atrasadas", valor: kpis.entregasAtrasadas },
      { indicador: "Taxa no Prazo", valor: `${kpis.taxaEntregaNoPrazo}%` },
    ];

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dashboardRows), "DASHBOARD");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.scs), "SC");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.ocs), "OC");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.fornecedores), "FORNECEDORES");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.setores), "SETORES");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataset.ocFiltered), "ENTREGAS");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([kpis]), "KPIS");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthly), "DADOS");

      const fileName = `procurement-control-center-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setQuickActionFeedback(`Exportacao concluida: ${fileName}`);
    } catch {
      setQuickActionFeedback("Falha ao exportar Excel. Tente novamente.");
    }
  };

  const handleImportExcel = async (file: File) => {
    const report: string[] = [];
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });

      const requiredSheets = ["SC", "OC", "FORNECEDORES", "SETORES"];
      const hasStructuredWorkbook = requiredSheets.every((sheetName) => wb.SheetNames.includes(sheetName));
      const bestOcSheet = detectBestOcSheet(wb);

      if (hasStructuredWorkbook) {
        const ocRowsFromOcSheet = XLSX.utils.sheet_to_json<PurchaseOrder>(wb.Sheets.OC, { defval: "" });
        const ocRowsInput = ocRowsFromOcSheet.length > 0
          ? ocRowsFromOcSheet
          : (bestOcSheet.score >= 2 ? (bestOcSheet.rows as unknown as PurchaseOrder[]) : []);
        const fornecedoresRowsInput = XLSX.utils.sheet_to_json<AppState["fornecedores"][number]>(wb.Sheets.FORNECEDORES, { defval: "" });
        const setoresRowsInput = XLSX.utils.sheet_to_json<AppState["setores"][number]>(wb.Sheets.SETORES, { defval: "" });

        if (!ocRowsInput.every((r) => r.id && r.numeroOC && r.status)) report.push("OC: colunas id/numeroOC/status obrigatorias.");
        const hasDuplicateOc = new Set(ocRowsInput.map((r) => r.numeroOC)).size !== ocRowsInput.length;
        if (hasDuplicateOc) report.push("Duplicidade detectada em numeroOC.");

        if (report.length) {
          setImportReport(report);
          return;
        }

        const nowIso = new Date().toISOString().slice(0, 10);
        const setoresMap = new Map<string, AppState["setores"][number]>();
        const fornecedoresMap = new Map<string, AppState["fornecedores"][number]>();
        const ocByNumero = new Map<string, PurchaseOrder>();

        state.setores.forEach((item) => {
          const key = normalizeKey(item.nome);
          if (!setoresMap.has(key)) setoresMap.set(key, item);
        });
        setoresRowsInput.forEach((item, index) => {
          const nome = String(item.nome ?? "").trim();
          if (!nome) return;
          const key = normalizeKey(nome);
          if (setoresMap.has(key)) return;
          setoresMap.set(key, {
            id: item.id || makeSafeId("setor", nome, index + 1),
            nome,
            descricao: String(item.descricao ?? "Importado da aba SETORES"),
            ativo: item.ativo !== false,
            createdAt: String(item.createdAt ?? nowIso),
            updatedAt: nowIso,
            deletedAt: null,
          });
        });

        state.fornecedores.forEach((item) => {
          const key = normalizeKey(`${item.nomeFantasia}|${item.cnpj}`);
          if (!fornecedoresMap.has(key)) fornecedoresMap.set(key, item);
        });
        fornecedoresRowsInput.forEach((item, index) => {
          const nome = String(item.nomeFantasia ?? item.razaoSocial ?? "").trim();
          const cnpj = String(item.cnpj ?? "").trim();
          if (!nome && !cnpj) return;
          const key = normalizeKey(`${nome}|${cnpj}`);
          if (fornecedoresMap.has(key)) return;
          fornecedoresMap.set(key, {
            id: item.id || makeSafeId("forn", nome || cnpj || `fornecedor-${index + 1}`, index + 1),
            codigo: String(item.codigo ?? `IMP-${String(index + 1).padStart(4, "0")}`),
            razaoSocial: String(item.razaoSocial ?? nome ?? "Fornecedor importado"),
            nomeFantasia: nome || String(item.razaoSocial ?? "Fornecedor importado"),
            cnpj,
            contato: String(item.contato ?? ""),
            telefone: String(item.telefone ?? ""),
            email: String(item.email ?? ""),
            cidade: String(item.cidade ?? ""),
            estado: String(item.estado ?? ""),
            categoria: String(item.categoria ?? "Importado"),
            status: item.status || "ATIVO",
            observacoes: String(item.observacoes ?? "Origem: SETORES/FORNECEDORES"),
            createdAt: String(item.createdAt ?? nowIso),
            updatedAt: nowIso,
            deletedAt: null,
          });
        });

        state.ocs.forEach((item) => {
          const key = normalizeKey(item.numeroOC);
          if (!ocByNumero.has(key)) ocByNumero.set(key, item);
        });

        ocRowsInput.forEach((row, index) => {
          const numeroOC = String(row.numeroOC ?? "").trim();
          if (!numeroOC) return;

          const key = normalizeKey(numeroOC);
          const existing = ocByNumero.get(key);
          const setor = state.setores.find((x) => x.id === row.setorId) ?? Array.from(setoresMap.values())[0];

          ocByNumero.set(key, {
            id: String(existing?.id ?? row.id ?? makeSafeId("oc", numeroOC, index + 1)),
            numeroOC,
            scId: String(existing?.scId ?? row.scId ?? ""),
            fornecedorId: String(existing?.fornecedorId ?? row.fornecedorId ?? ""),
            dataOC: String(row.dataOC || existing?.dataOC || nowIso),
            dataEmissao: String(row.dataEmissao || row.dataOC || existing?.dataEmissao || nowIso),
            dataPrevistaEntrega: String(row.dataPrevistaEntrega || existing?.dataPrevistaEntrega || row.dataOC || nowIso),
            dataRealEntrega: row.dataRealEntrega || existing?.dataRealEntrega || null,
            valorOC: Number(row.valorOC ?? existing?.valorOC ?? 0),
            setorId: String(row.setorId || existing?.setorId || setor?.id || ""),
            responsavel: String(row.responsavel || existing?.responsavel || "Nao informado"),
            status: toOcStatus(row.status),
            condicaoPagamento: String(row.condicaoPagamento || existing?.condicaoPagamento || "A definir"),
            observacoes: String(row.observacoes || existing?.observacoes || "Origem: estrutura completa"),
            anexos: Array.isArray(row.anexos) ? row.anexos : (existing?.anexos ?? []),
            createdAt: String(existing?.createdAt ?? row.createdAt ?? nowIso),
            updatedAt: nowIso,
            deletedAt: existing?.deletedAt ?? null,
          });
        });

        const nextState: AppState = {
          setores: Array.from(setoresMap.values()),
          fornecedores: Array.from(fornecedoresMap.values()),
          scs: state.scs,
          ocs: Array.from(ocByNumero.values()),
          // Evita payload gigante na importacao (auditoria pode crescer muito).
          auditoria: [],
        };

        await importAllData(nextState);
        await refreshState();
        setFilters(EMPTY_FILTERS);
        setFilterDraft(EMPTY_FILTERS);
        setCentralPreset("");
        setAgingDrilldown("");
        setQuickActionFeedback(`Importacao aplicada: ${nextState.ocs.length} OCs, ${nextState.fornecedores.length} fornecedores, ${nextState.setores.length} setores.`);
        setImportReport([
          "Importacao concluida com sucesso.",
          "Modo reconhecido: estrutura completa (OC-only).",
          ocRowsFromOcSheet.length === 0 && bestOcSheet.score >= 2 ? `Aba OC vazia: dados de OC lidos automaticamente da aba ${bestOcSheet.sheetName}.` : "Dados de OC lidos da aba OC.",
          `Resumo: ${nextState.ocs.length} OCs por upsert, ${nextState.fornecedores.length} fornecedores, ${nextState.setores.length} setores.`,
          "SCs mantidas sem alteracao.",
        ]);
        return;
      }

      const sourceSheetName = bestOcSheet.sheetName;
      const rawRows = bestOcSheet.rows;

      if (!rawRows.length) {
        setImportReport([`A aba ${sourceSheetName} esta vazia. Nada para importar.`]);
        return;
      }

      const nowIso = new Date().toISOString().slice(0, 10);
      const setoresMap = new Map<string, AppState["setores"][number]>();
      const fornecedoresMap = new Map<string, AppState["fornecedores"][number]>();
      const ocByNumero = new Map<string, PurchaseOrder>();

      state.setores.forEach((item) => {
        const key = normalizeKey(item.nome);
        if (!setoresMap.has(key)) setoresMap.set(key, item);
      });
      state.fornecedores.forEach((item) => {
        const key = normalizeKey(`${item.nomeFantasia}|${item.cnpj}`);
        if (!fornecedoresMap.has(key)) fornecedoresMap.set(key, item);
      });
      state.ocs.forEach((item) => {
        const key = normalizeKey(item.numeroOC);
        if (!ocByNumero.has(key)) ocByNumero.set(key, item);
      });

      rawRows.forEach((row, index) => {
        const numeroOCRaw = getValueByAliases(row, OC_IMPORT_ALIASES.numeroOC) ?? getValueByPositionFallback(row, 0);
        const setorRaw = getValueByAliases(row, OC_IMPORT_ALIASES.setor);
        const fornecedorCodigoRaw = getValueByAliases(row, ["fornecedor", "codigo fornecedor", "cod fornecedor"]) ?? getValueByPositionFallback(row, 4);
        const fornecedorRaw = getValueByAliases(row, OC_IMPORT_ALIASES.fornecedorNome) ?? getValueByPositionFallback(row, 5);
        const cnpjRaw = getValueByAliases(row, ["cnpj", "cnpj fornecedor"]);
        const compradorRaw = getValueByAliases(row, OC_IMPORT_ALIASES.comprador) ?? getValueByPositionFallback(row, 6);
        const statusRaw = getValueByAliases(row, OC_IMPORT_ALIASES.status) ?? getValueByPositionFallback(row, 2);
        const valorRaw = getValueByAliases(row, OC_IMPORT_ALIASES.valor) ?? getValueByPositionFallback(row, 3);
        const dataOcRaw = getValueByAliases(row, OC_IMPORT_ALIASES.dataOC) ?? getValueByPositionFallback(row, 1);
        const dataPrevistaRaw = getValueByAliases(row, ["data prevista entrega", "previsao entrega", "prazo entrega"]);
        const numeroOCText = String(numeroOCRaw ?? "").trim();

        if (!numeroOCText) return;

        const setorNome = String(setorRaw ?? "").trim() || "Nao informado";
        const setorKey = normalizeKey(setorNome);
        let setor = setoresMap.get(setorKey);
        if (!setor) {
          setor = {
            id: makeSafeId("setor", setorNome, index + 1),
            nome: setorNome,
            descricao: `Importado da aba ${sourceSheetName}`,
            ativo: true,
            createdAt: nowIso,
            updatedAt: nowIso,
            deletedAt: null,
          };
          setoresMap.set(setorKey, setor);
        }

        const fornecedorNome = String(fornecedorRaw ?? "").trim();
        const fornecedorCodigo = String(fornecedorCodigoRaw ?? "").trim();
        const cnpj = String(cnpjRaw ?? "").trim();
        let fornecedorId: string | null = null;
        if (fornecedorNome || cnpj) {
          const supplierKey = normalizeKey(`${fornecedorNome}|${cnpj}`);
          let supplier = fornecedoresMap.get(supplierKey);
          if (!supplier) {
            supplier = {
              id: makeSafeId("forn", fornecedorNome || cnpj || `fornecedor-${index + 1}`, index + 1),
              codigo: fornecedorCodigo || `IMP-${String(index + 1).padStart(4, "0")}`,
              razaoSocial: fornecedorNome || "Fornecedor importado",
              nomeFantasia: fornecedorNome || "Fornecedor importado",
              cnpj,
              contato: "",
              telefone: "",
              email: "",
              cidade: "",
              estado: "",
              categoria: "Importado",
              status: "ATIVO",
              observacoes: `Origem: ${sourceSheetName}`,
              createdAt: nowIso,
              updatedAt: nowIso,
              deletedAt: null,
            };
            fornecedoresMap.set(supplierKey, supplier);
          }
          fornecedorId = supplier.id;
        }

        if (!fornecedorId) {
          const fallbackSupplierKey = "fornecedor_nao_informado";
          let fallbackSupplier = fornecedoresMap.get(fallbackSupplierKey);
          if (!fallbackSupplier) {
            fallbackSupplier = {
              id: "forn-nao-informado",
              codigo: "IMP-0000",
              razaoSocial: "Fornecedor nao informado",
              nomeFantasia: "Fornecedor nao informado",
              cnpj: "",
              contato: "",
              telefone: "",
              email: "",
              cidade: "",
              estado: "",
              categoria: "Importado",
              status: "ATIVO",
              observacoes: `Origem: ${sourceSheetName}`,
              createdAt: nowIso,
              updatedAt: nowIso,
              deletedAt: null,
            };
            fornecedoresMap.set(fallbackSupplierKey, fallbackSupplier);
          }
          fornecedorId = fallbackSupplier.id;
        }

        const valor = parseMoneyValue(valorRaw);
        const responsavel = String(compradorRaw ?? "").trim() || "Nao informado";
        const ocDate = parseDateValue(dataOcRaw, nowIso);
        const entregaPrevista = parseDateValue(dataPrevistaRaw, ocDate);

        const ocKey = normalizeKey(numeroOCText);
        const existingOc = ocByNumero.get(ocKey);

        ocByNumero.set(ocKey, {
          id: existingOc?.id ?? makeSafeId("oc", numeroOCText, index + 1),
          numeroOC: numeroOCText,
          scId: existingOc?.scId ?? "",
          fornecedorId: fornecedorId ?? existingOc?.fornecedorId ?? "",
          dataOC: ocDate,
          dataEmissao: ocDate,
          dataPrevistaEntrega: entregaPrevista,
          dataRealEntrega: existingOc?.dataRealEntrega ?? null,
          valorOC: valor,
          // No upsert inteligente, o setor vindo da planilha deve prevalecer.
          setorId: setor.id || existingOc?.setorId || "",
          responsavel,
          status: toOcStatus(statusRaw),
          condicaoPagamento: existingOc?.condicaoPagamento ?? "A definir",
          observacoes: existingOc?.observacoes || `Origem: ${sourceSheetName}`,
          anexos: existingOc?.anexos ?? [],
          createdAt: existingOc?.createdAt ?? nowIso,
          updatedAt: nowIso,
          deletedAt: existingOc?.deletedAt ?? null,
        });
      });

      const ocRows = Array.from(ocByNumero.values());
      const fornecedoresRows = Array.from(fornecedoresMap.values());
      const setoresRows = Array.from(setoresMap.values());

      if (!ocRows.length) {
        setImportReport([
          "Nao foi possivel identificar dados de OC na planilha.",
          "Colunas esperadas: Nº Ordem, Emissao, Situacao O.C., Vlr. Orig. OC, Fornecedor, Nome Fornecedor, Usuario Comprador (Nome).",
        ]);
        return;
      }

      const nextState: AppState = {
        setores: setoresRows,
        fornecedores: fornecedoresRows,
        scs: state.scs,
        ocs: ocRows,
        // Evita payload gigante na importacao (auditoria pode crescer muito).
        auditoria: [],
      };

      await importAllData(nextState);
      await refreshState();
      setFilters(EMPTY_FILTERS);
      setFilterDraft(EMPTY_FILTERS);
      setCentralPreset("");
      setAgingDrilldown("");
      setQuickActionFeedback(`Importacao aplicada: ${ocRows.length} OCs, ${fornecedoresRows.length} fornecedores, ${setoresRows.length} setores.`);
      setImportReport([
        "Importacao concluida com sucesso.",
        `Modo reconhecido: importacao inteligente de OC (aba ${sourceSheetName}).`,
        `Resumo: ${ocRows.length} OCs atualizadas por upsert, ${fornecedoresRows.length} fornecedores e ${setoresRows.length} setores.`,
        "SCs mantidas sem alteracao.",
      ]);
    } catch (error) {
      setImportReport([`Falha na importacao: ${(error as Error).message}`]);
    }
  };

  const scTimelineBlock = selectedScRecord ? (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-sm font-semibold text-cyan-200">Timeline da SC {selectedScRecord.numeroSC}</p>
      <div className="mt-3 space-y-2">
        {timeline.map((step) => (
          <div key={step.etapa} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
            <div className={`h-2.5 w-2.5 rounded-full ${step.status ? "bg-cyan-300" : "bg-slate-600"}`} />
            <p className="text-sm text-slate-200">{step.etapa}</p>
            <p className="ml-auto text-xs text-slate-400">{step.data ?? "pendente"}</p>
          </div>
        ))}
        {selectedScRecord.status === "REPROVADA" && selectedScRecord.motivoReprovacao ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">Motivo: {selectedScRecord.motivoReprovacao}</div>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(14,165,233,.10),transparent_28%),radial-gradient(circle_at_88%_6%,rgba(16,185,129,.08),transparent_24%),#060b14] text-slate-100">
      <div className="flex min-h-screen">
        <aside className={`${collapsedSidebar ? "w-[92px]" : "w-[310px]"} sticky top-0 hidden h-screen border-r border-[#1A3445] bg-[#080E17]/95 px-3 py-4 transition-all md:block`}>
          <div className="mb-6 rounded-xl border border-[#1A3445] bg-[#0C1420]/90 p-3">
            <div className="flex items-center justify-between">
              {!collapsedSidebar ? (
                <div className="h-12 w-[180px]">
                  <Image src="/avg-logo.svg" alt="Grupo AVG Emesa" width={180} height={48} className="h-full w-full object-contain object-left" priority />
                </div>
              ) : (
                <div className="h-10 w-10 overflow-hidden rounded-lg border border-[#1A3445] bg-[#05080D]">
                  <Image src="/avg-logo.svg" alt="Grupo AVG Emesa" width={40} height={40} className="h-full w-full object-cover object-left" priority />
                </div>
              )}
              <button onClick={() => setCollapsedSidebar(!collapsedSidebar)} className="rounded-md border border-slate-700 p-1 hover:border-cyan-400/70">
                {collapsedSidebar ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>
            </div>
            {!collapsedSidebar ? <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">Desenvolvido por Michel Almeida</p> : null}
          </div>

          <nav className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                {!collapsedSidebar ? <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">{group.title}</p> : null}
                <div className="space-y-1">
                  {group.items.map((moduleId) => {
                    const item = NAV.find((entry) => entry.id === moduleId);
                    if (!item) return null;
                    const Icon = item.icon;
                    const active = module === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setModule(item.id)}
                        className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-cyan-300/55 bg-cyan-400/12 text-cyan-100 shadow-[inset_2px_0_0_rgba(34,211,238,0.9)]"
                            : "border-transparent bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70"
                        }`}
                      >
                        <Icon size={16} className={active ? "text-cyan-200" : "text-slate-400 group-hover:text-slate-200"} />
                        {!collapsedSidebar ? <span className="text-sm font-medium">{item.label}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {!collapsedSidebar ? (
            <div className="mt-6 rounded-xl border border-[#1A3445] bg-[#0C1420]/85 p-3 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Sistema Online</span>
              </div>
              <p className="mt-1">{currentUser.role}</p>
              <div className="mt-3 space-y-2">
                <button onClick={exportExcel} className="w-full rounded-md border border-cyan-500/35 bg-cyan-500/10 py-1.5 text-cyan-100">
                  <Download size={12} className="mr-1 inline" /> Exportar Snapshot
                </button>
              </div>
              <button onClick={logout} className="mt-3 w-full rounded-md border border-rose-500/40 bg-rose-500/10 py-2 text-rose-200">Sair</button>

              <div className="mt-3 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">IA de Perguntas</p>
                <input
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitAiQuestion(aiQuestion);
                    }
                  }}
                  placeholder="Pergunte sobre SC, OC, KPI..."
                  className="mt-2 w-full rounded border border-slate-700 bg-slate-900/90 px-2 py-1.5 text-xs text-slate-100 outline-none"
                />
                <button
                  onClick={() => submitAiQuestion(aiQuestion)}
                  className="mt-2 w-full rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  Responder
                </button>
                <div className="mt-2 rounded border border-slate-800 bg-slate-900/70 p-2 text-[11px] text-slate-300">{aiAnswer}</div>
              </div>
            </div>
          ) : null}
        </aside>

        {mobileMenuOpen ? <div className="fixed inset-0 z-40 bg-slate-950/70 md:hidden" onClick={() => setMobileMenuOpen(false)} /> : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[84%] max-w-[340px] border-r border-[#1A3445] bg-[#080E17]/95 px-3 py-4 shadow-[0_0_40px_rgba(0,0,0,0.45)] transition-transform duration-200 md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="mb-6 rounded-xl border border-[#1A3445] bg-[#0C1420]/90 p-3">
            <div className="flex items-center justify-between">
              <div className="h-11 w-[170px]">
                <Image src="/avg-logo.svg" alt="Grupo AVG Emesa" width={170} height={44} className="h-full w-full object-contain object-left" priority />
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-md border border-slate-700 p-1 text-slate-300">
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">Desenvolvido por Michel Almeida</p>
          </div>

          <nav className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={`mobile-${group.title}`}>
                <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((moduleId) => {
                    const item = NAV.find((entry) => entry.id === moduleId);
                    if (!item) return null;
                    const Icon = item.icon;
                    const active = module === item.id;
                    return (
                      <button
                        key={`mobile-${item.id}`}
                        onClick={() => {
                          setModule(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-cyan-300/55 bg-cyan-400/12 text-cyan-100 shadow-[inset_2px_0_0_rgba(34,211,238,0.9)]"
                            : "border-transparent bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70"
                        }`}
                      >
                        <Icon size={16} className={active ? "text-cyan-200" : "text-slate-400"} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-6 rounded-xl border border-[#1A3445] bg-[#0C1420]/85 p-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Sistema Online</span>
            </div>
            <p className="mt-1">{currentUser.role}</p>
            <div className="mt-3 space-y-2">
              <button onClick={exportExcel} className="w-full rounded-md border border-cyan-500/35 bg-cyan-500/10 py-1.5 text-cyan-100">
                <Download size={12} className="mr-1 inline" /> Exportar Snapshot
              </button>
            </div>
            <button onClick={logout} className="mt-3 w-full rounded-md border border-rose-500/40 bg-rose-500/10 py-2 text-rose-200">Sair</button>

            <div className="mt-3 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">IA de Perguntas</p>
              <input
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitAiQuestion(aiQuestion);
                  }
                }}
                placeholder="Pergunte sobre SC, OC, KPI..."
                className="mt-2 w-full rounded border border-slate-700 bg-slate-900/90 px-2 py-1.5 text-xs text-slate-100 outline-none"
              />
              <button
                onClick={() => submitAiQuestion(aiQuestion)}
                className="mt-2 w-full rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Responder
              </button>
              <div className="mt-2 rounded border border-slate-800 bg-slate-900/70 p-2 text-[11px] text-slate-300">{aiAnswer}</div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-3 pb-24 pt-3 md:p-6 md:pb-6">
          <header className="mb-4 rounded-2xl border border-slate-800/90 bg-slate-950/88 p-3 shadow-[0_16px_45px_rgba(2,6,23,0.55)] backdrop-blur-sm md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
              <button onClick={() => setMobileMenuOpen(true)} className="rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-slate-200">
                <Menu size={16} />
              </button>
              <p className="truncate px-2 text-sm font-semibold text-cyan-100">{NAV.find((item) => item.id === module)?.label ?? "Dashboard"}</p>
              <button onClick={exportExcel} className="rounded-lg border border-cyan-500/35 bg-cyan-500/10 p-2 text-cyan-200">
                <Download size={15} />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Sistema Online</p>
                <span className="text-xs text-slate-500">v2.0.1</span>
              </div>
              <p className="hidden border-y border-cyan-500/25 px-3 py-1 text-[11px] uppercase tracking-[0.34em] text-cyan-300/90 md:block">Controle • Supervisao • Resultados</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCommandOpen(true)} className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-400/50 md:flex">
                  <Search size={13} />
                  <span>Buscar SC, OC, Fornecedor, CNPJ, NF...</span>
                  <span className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-500">CTRL + K</span>
                </button>
                <button className="rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-slate-300">
                  <Bell size={13} />
                </button>
                <div className="rounded-lg border border-cyan-500/35 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-300">
                  <UserCircle2 size={14} className="mr-1 inline text-cyan-300" />
                  {currentUser.nome}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">GRUPO AVG EMESA</p>
                <h1 className="font-orbitron text-2xl text-white md:text-3xl">SC / OC Desenvolvido por Michel Almeida</h1>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Enterprise Procurement Intelligence • {currentDate} • {currentTime}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded-full border px-3 py-1 ${canWrite ? "border-emerald-400/45 bg-emerald-500/10 text-emerald-200" : "border-amber-400/45 bg-amber-500/10 text-amber-200"}`}>
                  {canWrite ? "Modo Edicao" : "Modo Visualizacao"}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2 text-[11px] text-slate-300">
              <button
                onClick={() => void runQuickRefresh()}
                disabled={isRefreshing}
                className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshing ? "Sincronizando..." : "Sincronizar dados"}
                <span className="ml-1 rounded border border-cyan-600/50 px-1 text-[10px] text-cyan-300">Alt+R</span>
              </button>
              <button
                onClick={() => {
                  clearGlobalFilters();
                }}
                className="rounded-md border border-slate-700 px-2 py-1 transition hover:border-cyan-500/40"
              >
                Limpar filtros
                <span className="ml-1 rounded border border-slate-600 px-1 text-[10px] text-slate-400">Alt+L</span>
              </button>
              <button onClick={() => setCommandOpen(true)} className="rounded-md border border-slate-700 px-2 py-1 transition hover:border-cyan-500/40">
                Busca global
                <span className="ml-1 rounded border border-slate-600 px-1 text-[10px] text-slate-400">Ctrl+K</span>
              </button>
              <span className="text-slate-500">Modulos: Alt+1..6 | Navegar: Alt+←/→ | SC: Alt+S | Responsavel: Alt+U</span>
            </div>
            {quickActionFeedback ? <p className="mt-2 text-xs text-emerald-300">{quickActionFeedback}</p> : null}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-10">
              <FilterSelect
                label="Ano"
                value={filterDraft.ano}
                onChange={(value) => setFilterDraft({ ...filterDraft, ano: value })}
                options={[{ label: "Todos", value: "" }, ...anosDisponiveis.map((ano) => ({ label: ano, value: ano }))]}
              />
              <FilterSelect
                label="Mes"
                value={filterDraft.mes}
                onChange={(value) => setFilterDraft({ ...filterDraft, mes: value })}
                options={[
                  { label: "Todos", value: "" },
                  { label: "01", value: "01" },
                  { label: "02", value: "02" },
                  { label: "03", value: "03" },
                  { label: "04", value: "04" },
                  { label: "05", value: "05" },
                  { label: "06", value: "06" },
                  { label: "07", value: "07" },
                  { label: "08", value: "08" },
                  { label: "09", value: "09" },
                  { label: "10", value: "10" },
                  { label: "11", value: "11" },
                  { label: "12", value: "12" },
                ]}
              />
              <FilterSelect
                label="Setor"
                value={filterDraft.setorId}
                onChange={(value) => setFilterDraft({ ...filterDraft, setorId: value })}
                options={[{ label: "Todos", value: "" }, ...state.setores.map((s) => ({ label: s.nome, value: s.id }))]}
              />
              <FilterSelect
                label="Fornecedor"
                value={filterDraft.fornecedorId}
                onChange={(value) => setFilterDraft({ ...filterDraft, fornecedorId: value })}
                options={[{ label: "Todos", value: "" }, ...state.fornecedores.map((f) => ({ label: f.nomeFantasia, value: f.id }))]}
              />
              <FilterSelect
                label="Status"
                value={filterDraft.status}
                onChange={(value) => setFilterDraft({ ...filterDraft, status: value })}
                options={[
                  { label: "Todos", value: "" },
                  { label: "OC - Aberto Total", value: "ABERTO_TOTAL" },
                  { label: "OC - Aberto Parcial", value: "ABERTO_PARCIAL" },
                  { label: "OC - Liquidado", value: "LIQUIDADO" },
                  { label: "OC - Nao Fechado", value: "NAO_FECHADO" },
                  { label: "OC - Cancelado", value: "CANCELADA" },
                  { label: "Em Analise", value: "EM_ANALISE" },
                  { label: "Aprovada", value: "APROVADA" },
                  { label: "Reprovada", value: "REPROVADA" },
                  { label: "Lancada", value: "LANCADA" },
                ]}
              />
              <FilterInput label="Responsavel" value={filterDraft.responsavel} onChange={(value) => setFilterDraft({ ...filterDraft, responsavel: value })} placeholder="buscar" inputRef={responsibleFilterInputRef} />
              <FilterInput label="SC" value={filterDraft.sc} onChange={(value) => setFilterDraft({ ...filterDraft, sc: value })} placeholder="SC-" inputRef={scFilterInputRef} />
              <FilterInput label="OC" value={filterDraft.oc} onChange={(value) => setFilterDraft({ ...filterDraft, oc: value })} placeholder="OC-" />
              <button className="rounded-lg border border-cyan-500/45 bg-cyan-500/10 px-3 text-sm text-cyan-100 hover:bg-cyan-500/20" onClick={applyGlobalFilters}>
                Aplicar Filtros
              </button>
              <button
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm hover:border-cyan-300"
                onClick={clearGlobalFilters}
              >
                Limpar Filtros
              </button>
            </div>
            {activeFilterChips.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <button
                    key={`chip-${chip.key}`}
                    onClick={() => {
                      const next = { ...filters, [chip.key]: "" };
                      setFilters(next);
                      setFilterDraft(next);
                    }}
                    className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100"
                  >
                    {chip.label}: {chip.value} x
                  </button>
                ))}
              </div>
            ) : null}
          </header>

          <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-200/90">Valor Total OCs</p>
              <p className="text-lg font-bold text-emerald-200">{formatCurrency(kpis.valorTotalOC)}</p>
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-rose-200/90">Nao Fechadas</p>
              <p className="text-lg font-bold text-rose-200">{unifiedStatusCards.atrasada}</p>
            </div>
          </div>

          {module === "DASHBOARD" ? (
            <section>
              <ModuleTitle title="Dashboard Executivo" subtitle="Visao tatica em tempo real" />
              <div className="dashboard-rise grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" style={{ animationDelay: "40ms" }}>
                {premiumKpis.map((item) => (
                  <KpiCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    note={item.note}
                    context={item.context}
                    delta={item.delta}
                    color={item.color}
                    icon={item.icon}
                    invertDelta={item.invertDelta}
                    series={item.series}
                  />
                ))}
              </div>

              <div className="dashboard-rise mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" style={{ animationDelay: "90ms" }}>
                {executiveSnapshot.map((item) => (
                  <div key={`snapshot-${item.label}`} className={`rounded-xl border px-3 py-2 ${item.tone}`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] opacity-85">{item.label}</p>
                    <p className="mt-0.5 text-lg font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="dashboard-rise mt-4" style={{ animationDelay: "120ms" }}>
                <Panel title="Procurement Pipeline">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
                    {pipelineStages.map((stage, index) => (
                      <button
                        key={stage.key}
                        onClick={stage.action}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-500/45 hover:bg-slate-900"
                      >
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{stage.label}</p>
                        <p className="mt-1 text-2xl font-bold text-cyan-100">{stage.count}</p>
                        <p className="text-xs text-slate-400">{stage.percent}% do fluxo</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full" style={{ width: `${stage.percent}%`, backgroundColor: [CYAN, AMBER, GREEN, BLUE, PURPLE, RED][index % 6] }} />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-300">{formatCurrency(stage.value)}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">Clique para abrir</p>
                      </button>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="dashboard-rise mt-4 grid gap-4 lg:grid-cols-2" style={{ animationDelay: "160ms" }}>
                <Panel title="Status das Ordens de Compra">
                  {pipelineTotals.totalProcessos === 0 ? (
                    <p className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-5 text-center text-sm text-slate-400">SEM HISTORICO SUFICIENTE</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-[1.05fr_.95fr]">
                      <div className="relative h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pipelineStatusData} dataKey="total" nameKey="label" innerRadius={72} outerRadius={104} paddingAngle={2}>
                              {pipelineStatusData.map((entry) => (
                                <Cell key={`pipeline-donut-${entry.key}`} fill={entry.color} onClick={() => openCentralWithFilters({ status: entry.filter })} style={{ cursor: "pointer" }} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: "#0C1420", border: "1px solid #1A3445", borderRadius: 12, color: "#F4F7FA" }}
                              formatter={(value: number, _name: string, item: { payload?: { percent?: number; value?: number } }) => [`${value} processos • ${item?.payload?.percent ?? 0}%`, "Volume"]}
                              labelFormatter={(_, payload) => {
                                const first = payload?.[0] as { payload?: { label?: string; value?: number } } | undefined;
                                if (!first?.payload) return "";
                                return `${first.payload.label} • ${formatCurrency(first.payload.value ?? 0)}`;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-3xl font-bold text-cyan-100">{pipelineTotals.totalProcessos}</p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Processos</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {pipelineStatusData.map((item) => (
                          <button
                            key={`status-legend-${item.key}`}
                            onClick={() => openCentralWithFilters({ status: item.filter })}
                            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left transition hover:border-cyan-500/40"
                          >
                            <p className="text-xs font-semibold" style={{ color: item.color }}>{item.label} {item.total}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">{item.percent}% do total • {formatCurrency(item.value)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-800 bg-slate-900/55 p-2 text-xs">
                    <div>
                      <p className="uppercase tracking-[0.12em] text-slate-500">Total de Processos</p>
                      <p className="text-sm font-semibold text-cyan-100">{pipelineTotals.totalProcessos}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.12em] text-slate-500">Valor Total</p>
                      <p className="text-sm font-semibold text-cyan-100">{formatCurrency(pipelineTotals.totalValor)}</p>
                    </div>
                  </div>
                </Panel>

                <Panel title="SC + OC por Setor">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button className={`rounded-md border px-2 py-1 text-xs ${sectorViewMode === "quantidade" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`} onClick={() => setSectorViewMode("quantidade")}>Visao por Quantidade</button>
                    <button className={`rounded-md border px-2 py-1 text-xs ${sectorViewMode === "valor" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`} onClick={() => setSectorViewMode("valor")}>Visao por Valor</button>
                    <button className={`rounded-md border px-2 py-1 text-xs ${sectorSortMode === "desc" ? "border-blue-500/45 bg-blue-500/10 text-blue-100" : "border-slate-700 text-slate-300"}`} onClick={() => setSectorSortMode("desc")}>Maior</button>
                    <button className={`rounded-md border px-2 py-1 text-xs ${sectorSortMode === "asc" ? "border-blue-500/45 bg-blue-500/10 text-blue-100" : "border-slate-700 text-slate-300"}`} onClick={() => setSectorSortMode("asc")}>Menor</button>
                  </div>
                  <div className="space-y-2">
                    {sectorRankData.length === 0 ? (
                      <p className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-4 text-center text-sm text-slate-400">DADOS INSUFICIENTES</p>
                    ) : sectorRankData.map((item) => {
                      const metric = sectorViewMode === "valor" ? item.valor : item.total;
                      const width = Math.max(8, toPercent(metric, maxSectorRankMetric));
                      return (
                        <button key={`sector-rank-${item.setor}`} onClick={() => {
                          const sector = state.setores.find((x) => x.nome === item.setor);
                          if (sector?.id) openCentralWithFilters({ setorId: sector.id });
                        }} className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left transition hover:border-cyan-500/40">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-100">{item.setor}</span>
                            <span className="text-cyan-200">{sectorViewMode === "valor" ? formatCurrency(item.valor) : `${item.total} processos`}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400">{item.total} processos • {formatCurrency(item.valor)}</p>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-blue-400" style={{ width: `${width}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Panel>
              </div>

              <div className="dashboard-rise mt-4 grid gap-4 lg:grid-cols-2" style={{ animationDelay: "200ms" }}>
                <Panel title="Aging & SLA">
                  <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/65 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Tempo Medio</p>
                      <p className="text-sm font-semibold text-cyan-100">{averageAgingDays !== null ? `${averageAgingDays} dias` : "SEM HISTORICO SUFICIENTE"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/65 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">SLA Medio</p>
                      <p className="text-sm font-semibold text-cyan-100">{slaMetrics.averageSlaDays !== null ? `${slaMetrics.averageSlaDays} dias` : "SEM HISTORICO SUFICIENTE"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/65 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Status</p>
                      <p className={`text-sm font-semibold ${slaMetrics.statusLabel === "DENTRO DO SLA" ? "text-emerald-300" : slaMetrics.statusLabel === "EM RISCO" ? "text-amber-300" : "text-rose-300"}`}>{slaMetrics.statusLabel}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={agingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="faixa" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="total" fill={AMBER} radius={[8, 8, 0, 0]} onClick={(data) => data?.faixa && openAgingDrilldown(String(data.faixa))} />
                    </BarChart>
                  </ResponsiveContainer>
                  {slaMetrics.hasData ? (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-emerald-200">No prazo: {slaMetrics.noPrazoPercent}%</div>
                      <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-amber-200">Em risco: {slaMetrics.riscoPercent}%</div>
                      <div className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-rose-200">Atrasados: {slaMetrics.atrasadoPercent}%</div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">SEM HISTORICO SUFICIENTE para leitura de SLA.</p>
                  )}
                </Panel>

                <Panel title="Financial Intelligence">
                  <div className="mb-2 rounded-lg border border-cyan-500/25 bg-cyan-500/8 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-300">Valor Total SC + OC</p>
                    <p className="text-lg font-semibold text-cyan-100">{formatCurrency(kpis.valorTotalSC + kpis.valorTotalOC)}</p>
                  </div>
                  <div className="mb-2 flex gap-2">
                    <button
                      className={`rounded-md border px-2 py-1 text-xs ${financialViewMode === "setor" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`}
                      onClick={() => setFinancialViewMode("setor")}
                    >
                      Valor por Setor
                    </button>
                    <button
                      className={`rounded-md border px-2 py-1 text-xs ${financialViewMode === "status" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`}
                      onClick={() => setFinancialViewMode("status")}
                    >
                      Valor por Status
                    </button>
                    <button
                      className={`rounded-md border px-2 py-1 text-xs ${financialSort === "desc" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`}
                      onClick={() => setFinancialSort("desc")}
                    >
                      Maior Valor
                    </button>
                    <button
                      className={`rounded-md border px-2 py-1 text-xs ${financialSort === "asc" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`}
                      onClick={() => setFinancialSort("asc")}
                    >
                      Menor Valor
                    </button>
                  </div>
                  <div className="space-y-2">
                    {financialIntelligenceData.length === 0 ? (
                      <p className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-4 text-center text-sm text-slate-400">DADOS INSUFICIENTES</p>
                    ) : financialIntelligenceData.slice(0, 8).map((item) => {
                      const width = Math.max(8, toPercent(item.value, maxFinancialIntValue));
                      return (
                        <button
                          key={`fin-${item.key}`}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-500/35"
                          onClick={() => {
                            if (item.type === "setor") {
                              const sector = state.setores.find((x) => x.nome === item.label);
                              if (sector?.id) openCentralWithFilters({ setorId: sector.id });
                            } else {
                              const statusMap: Record<string, string> = {
                                APROVADO: "APROVADA",
                                "EM ANALISE": "EM_ANALISE",
                                REPROVADO: "REPROVADA",
                                LANCADO: "LANCADA",
                              };
                              openCentralWithFilters({ status: statusMap[item.label] ?? "" });
                            }
                          }}
                        >
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span>{item.label}</span>
                            <span className="text-cyan-200">{formatCurrency(item.value)}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400">{item.meta}</p>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: item.color }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Panel>
              </div>

              <div className="dashboard-rise mt-4 grid gap-4 lg:grid-cols-2" style={{ animationDelay: "240ms" }}>
                <Panel title="Performance de Fornecedores">
                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900/80 text-left uppercase tracking-[0.12em] text-slate-400">
                        <tr>
                          <th className="px-2 py-2">Fornecedor</th>
                          <th className="px-2">SC</th>
                          <th className="px-2">OC</th>
                          <th className="px-2">Prazo</th>
                          <th className="px-2 text-right">Indice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierPerformance.length === 0 ? (
                          <tr className="border-t border-slate-800">
                            <td colSpan={5} className="px-2 py-3 text-center text-slate-500">Sem dados de performance no periodo.</td>
                          </tr>
                        ) : supplierPerformance.map((item) => (
                          <tr key={`supf-${item.fornecedorId}`} className="border-t border-slate-800/80">
                            <td className="px-2 py-2">
                              <button
                                className="truncate text-left text-cyan-200 underline decoration-dotted underline-offset-2"
                                onClick={() => openCentralWithFilters({ fornecedorId: item.fornecedorId })}
                              >
                                {item.fornecedor}
                              </button>
                            </td>
                            <td className="px-2">{item.totalSC}</td>
                            <td className="px-2">{item.totalOC}</td>
                            <td className="px-2">{item.taxaPrazo}%</td>
                            <td className="px-2 text-right font-semibold text-cyan-200">{item.indicePerformance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                <Panel title="Saude Operacional">
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/8 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Indice Geral</p>
                      <p className="text-3xl font-bold text-cyan-100">{operationalHealth?.score ?? 0}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">Quanto maior o indice, melhor o fluxo de procurement no periodo filtrado.</p>
                    <p className={`mt-1 text-xs ${healthStatusTone(operationalHealth?.status)}`}>Status: {operationalHealth?.status ?? "SEM DADOS"}</p>
                    <button className="mt-2 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300" onClick={() => setHealthExpanded((v) => !v)}>
                      {healthExpanded ? "Ocultar fatores" : "Ver fatores"}
                    </button>
                    {healthExpanded ? (
                      <div className="mt-2 space-y-1 text-xs text-slate-300">
                        {operationalHealthFactors.map((factor) => (
                          <div key={factor.label} className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/70 px-2 py-1.5">
                            <span>{factor.label}</span>
                            <span className={factor.score >= 70 ? "text-emerald-300" : factor.score >= 40 ? "text-amber-300" : "text-rose-300"}>{factor.score}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Panel>
              </div>

              <div className="dashboard-rise mt-4 grid gap-4 lg:grid-cols-2" style={{ animationDelay: "280ms" }}>
                <Panel title="Atencao Necessaria">
                  <div className="space-y-2">
                    {attentionItems.length === 0 ? (
                      <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Sem pendencias criticas no momento.</p>
                    ) : attentionItems.map((item) => (
                      <button key={item.id} onClick={item.onClick} className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-left transition duration-200 hover:-translate-y-0.5 hover:border-rose-400/55">
                        <p className="text-sm font-medium text-rose-100">{item.label}</p>
                        <p className="text-xs text-rose-200/85">{item.detail}</p>
                      </button>
                    ))}
                  </div>
                </Panel>

                <Panel title="Executive Insights">
                  <div className="space-y-2">
                    {executiveInsights.length === 0 ? (
                      <p className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-4 text-center text-sm text-slate-400">DADOS INSUFICIENTES</p>
                    ) : executiveInsights.map((insight) => (
                      <div key={insight.id} className={`rounded-lg border px-3 py-2 ${insight.tone === "ok" ? "border-emerald-500/30 bg-emerald-500/10" : insight.tone === "warn" ? "border-amber-500/30 bg-amber-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
                        <p className={`text-sm font-semibold ${insight.tone === "ok" ? "text-emerald-100" : insight.tone === "warn" ? "text-amber-100" : "text-rose-100"}`}>{insight.title}</p>
                        <p className={`text-xs ${insight.tone === "ok" ? "text-emerald-200/90" : insight.tone === "warn" ? "text-amber-200/90" : "text-rose-200/90"}`}>{insight.detail}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="dashboard-rise mt-4" style={{ animationDelay: "320ms" }}>
                <Panel title="Operational Snapshot">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
                    {operationalSnapshotItems.map((item) => (
                      <button key={item.id} onClick={item.onClick} className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left transition hover:border-cyan-500/40">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                        <p className="mt-1 text-2xl font-semibold text-cyan-100">{item.value}</p>
                      </button>
                    ))}
                  </div>
                </Panel>
              </div>

              <style jsx global>{`
                @keyframes dashboardRise {
                  0% {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                .dashboard-rise {
                  animation: dashboardRise 480ms ease-out both;
                }
              `}</style>

              <div className="mt-4">
                <Panel title="Ultimas Movimentacoes SC / OC">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-[11px] text-slate-300">
                    <span className="uppercase tracking-[0.14em] text-cyan-200">Ultimos registros operacionais</span>
                    <span>{latestRows.length} linhas exibidas</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950/50">
                    <table className="w-full table-fixed text-xs md:text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-950/95 text-left text-[10px] uppercase tracking-[0.14em] text-slate-400 backdrop-blur">
                        <tr>
                          <th className="w-[8%] px-2 py-2">SC</th>
                          <th className="w-[8%] px-2">OC</th>
                          <th className="w-[8%] px-2">NF</th>
                          <th className="w-[16%] px-2">Solicitante</th>
                          <th className="hidden w-[15%] px-2 md:table-cell">Fornecedor</th>
                          <th className="hidden w-[10%] px-2 md:table-cell">Unidade</th>
                          <th className="hidden w-[10%] px-2 lg:table-cell">CNPJ</th>
                          <th className="w-[12%] px-2">Status</th>
                          <th className="w-[10%] px-2 text-right">Valor</th>
                          <th className="w-[8%] px-2">Data</th>
                          <th className="w-[13%] px-2">Acoes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestRows.map((row) => {
                          const scRecord = row.entity === "SC" ? dataset.scFiltered.find((item) => item.id === row.id) : dataset.scFiltered.find((item) => item.numeroSC === row.numeroSC);
                          const ocRecord = row.entity === "OC" ? (dataset.ocFiltered as PurchaseOrder[]).find((item) => item.id === row.id) : (dataset.ocFiltered as PurchaseOrder[]).find((item) => item.numeroOC === row.numeroOC);
                          const supplierId = ocRecord?.fornecedorId ?? scRecord?.fornecedorSugeridoId ?? null;
                          const supplier = supplierId ? state.fornecedores.find((item) => item.id === supplierId) : null;
                          const currentObservacoes = ocRecord?.observacoes ?? scRecord?.observacoes ?? "";
                          const nfValue = getTaggedValue(currentObservacoes, "NF");
                          const nfAttachmentEntry = (ocRecord?.anexos ?? scRecord?.anexos ?? []).find((entry) => entry.startsWith("NF_FILE:"));
                          const nfAttachment = parseNfAttachment(nfAttachmentEntry);
                          const unidadeValue = getTaggedValue(currentObservacoes, "UNIDADE") || row.setor;
                          const supplierName = supplier?.nomeFantasia || supplier?.razaoSocial || row.fornecedor || "-";
                          const cnpj = supplier?.cnpj?.trim() || "-";
                          const solicitante = scRecord?.solicitante || ocRecord?.responsavel || "-";
                          const rowDate = scRecord?.dataCriacao || ocRecord?.dataOC || row.sortDate;
                          const fileInputId = `latest-nf-upload-${row.entity}-${row.id}`;
                          const fullDescription = scRecord?.descricao || getTaggedValue(currentObservacoes, "DESCRICAO") || "Sem descricao detalhada.";
                          const detailedNotes = currentObservacoes || "Sem observacoes adicionais.";

                          return (
                            <tr key={`${row.entity}-${row.id}`} className="border-t border-slate-800/90 align-top transition even:bg-slate-900/30 hover:bg-slate-900/70">
                            <td className="truncate px-2 py-2 font-medium text-cyan-100">
                              <button
                                className="truncate text-left underline decoration-dotted underline-offset-2 hover:text-cyan-300"
                                onClick={() => setMovementDetail({ title: `${row.numeroSC} / ${row.numeroOC}`, description: fullDescription, details: detailedNotes })}
                              >
                                {row.numeroSC}
                              </button>
                            </td>
                            <td className="truncate px-2 text-slate-200">
                              <button
                                className="truncate text-left underline decoration-dotted underline-offset-2 hover:text-cyan-300"
                                onClick={() => setMovementDetail({ title: `${row.numeroSC} / ${row.numeroOC}`, description: fullDescription, details: detailedNotes })}
                              >
                                {row.numeroOC}
                              </button>
                            </td>
                            <td className="truncate px-2">{nfValue || "-"}</td>
                            <td className="truncate px-2">
                              <button
                                className="truncate text-left underline decoration-dotted underline-offset-2 hover:text-cyan-300"
                                onClick={() => setMovementDetail({ title: `${row.numeroSC} / ${row.numeroOC}`, description: fullDescription, details: detailedNotes })}
                              >
                                {solicitante}
                              </button>
                            </td>
                            <td className="hidden truncate px-2 md:table-cell" title={supplierName}>{truncateSupplierName(supplierName)}</td>
                            <td className="hidden truncate px-2 md:table-cell">{unidadeValue}</td>
                            <td className="hidden truncate px-2 lg:table-cell">{cnpj}</td>
                            <td className="px-2">
                              {canWrite && row.entity === "SC" && scRecord ? (
                                <select
                                  className="field w-full max-w-[132px] text-xs"
                                  value={scRecord.status}
                                  onChange={async (e) => {
                                    const nextStatus = e.target.value as SCStatus;
                                    await updateSC(scRecord.id, {
                                      status: nextStatus,
                                      dataAprovacao: nextStatus === "APROVADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataAprovacao,
                                      dataReprovacao: nextStatus === "REPROVADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataReprovacao,
                                      dataLancamento: nextStatus === "LANCADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataLancamento,
                                    });
                                  }}
                                >
                                  <option value="EM_ANALISE">Em Analise</option>
                                  <option value="APROVADA">Aprovado</option>
                                  <option value="REPROVADA">Reprovado</option>
                                  <option value="LANCADA">Lancado</option>
                                </select>
                              ) : null}

                              {canWrite && row.entity === "OC" && ocRecord ? (
                                <select
                                  className="field w-full max-w-[132px] text-xs"
                                  value={ocToPhase(ocRecord.status as OCStatus)}
                                  onChange={async (e) => {
                                    const phase = e.target.value as OcPhase;
                                    await updateOC(ocRecord.id, { status: phaseToOcStatus(phase) });
                                  }}
                                >
                                  <option value="ABERTO_TOTAL">Aberto Total</option>
                                  <option value="ABERTO_PARCIAL">Aberto Parcial</option>
                                  <option value="LIQUIDADO">Liquidado</option>
                                  <option value="NAO_FECHADO">Nao Fechado</option>
                                  <option value="CANCELADA">Cancelado</option>
                                </select>
                              ) : null}

                              {!canWrite ? <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium ${businessStatusBadge(row.statusKey)}`}>{row.statusLabel}</span> : null}
                            </td>
                            <td className="px-2 text-right font-medium text-emerald-300">{formatCurrency(row.valor)}</td>
                            <td className="px-2 text-slate-300">{formatDatePtBr(rowDate)}</td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-start gap-1 xl:flex-row xl:items-center">
                                {canWrite ? (
                                  <label className="cursor-pointer rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/10">
                                    Upload NF
                                    <input
                                      id={fileInputId}
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 1_500_000) {
                                          e.currentTarget.value = "";
                                          return;
                                        }

                                        try {
                                          const encoded = await fileToDataUrl(file);
                                          const fileEntry = `NF_FILE:${file.name}|${file.type}|${file.size}|${Date.now()}|${encoded}`;
                                          if (row.entity === "OC" && ocRecord) {
                                            await updateOC(ocRecord.id, {
                                              anexos: [...(ocRecord.anexos ?? []).filter((entry) => !entry.startsWith("NF_FILE:")), fileEntry],
                                            });
                                          } else if (row.entity === "SC" && scRecord) {
                                            await updateSC(scRecord.id, {
                                              anexos: [...(scRecord.anexos ?? []).filter((entry) => !entry.startsWith("NF_FILE:")), fileEntry],
                                            });
                                          }
                                        } finally {
                                          e.currentTarget.value = "";
                                        }
                                      }}
                                    />
                                  </label>
                                ) : null}
                                {nfAttachment ? (
                                  <button
                                    className="rounded border border-cyan-700 px-2 py-1 text-xs text-cyan-200 transition hover:bg-cyan-500/10"
                                    onClick={() => {
                                      if (typeof window !== "undefined") {
                                        window.open(nfAttachment.dataUrl, "_blank", "noopener,noreferrer");
                                      }
                                    }}
                                  >
                                    Ver NF
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {movementDetail ? (
                    <div className="mt-3 rounded-xl border border-cyan-500/25 bg-slate-900/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-cyan-200">Detalhe da Solicitacao • {movementDetail.title}</p>
                        <button className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300" onClick={() => setMovementDetail(null)}>
                          Fechar
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">{movementDetail.description}</p>
                      <p className="mt-2 whitespace-pre-wrap rounded border border-slate-800 bg-slate-950/70 p-2 text-xs text-slate-400">{movementDetail.details}</p>
                    </div>
                  ) : null}
                </Panel>
              </div>

              <div className="mt-4">
                <Panel title="Exportacao Excel">
                  <p className="mb-3 text-sm text-slate-300">Exporte dados e indicadores no layout corporativo.</p>
                  <button onClick={exportExcel} className="w-full rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-cyan-100 transition hover:bg-cyan-500/20">
                    Exportar Tudo
                  </button>
                  <button onClick={() => setModule("EXCEL")} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-200 transition hover:border-cyan-500/40">
                    Abrir modulo Excel
                  </button>
                </Panel>
              </div>
            </section>
          ) : null}

          {module === "SC" ? (
            <>
              {agingDrilldown || centralPreset ? (
                <div className="mb-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {agingDrilldown
                        ? `Recorte Aging ativo: ${agingDrilldown} dias`
                        : centralPreset === "SC_SEM_FORNECEDOR"
                          ? "Recorte ativo: SC sem fornecedor"
                          : "Recorte ativo: SC sem OC"}
                    </span>
                    <button
                      className="rounded border border-amber-400/45 px-2 py-1 text-xs"
                      onClick={() => {
                        setAgingDrilldown("");
                        setCentralPreset("");
                      }}
                    >
                      Limpar recorte
                    </button>
                  </div>
                </div>
              ) : null}
              <UnifiedScOcModule
                scs={scForCentral}
                ocs={ocForCentral}
                setores={state.setores}
                fornecedores={state.fornecedores}
                canWrite={canWrite}
                onCreateSC={createSC}
                onUpdateSC={updateSC}
                onDeleteSC={deleteSC}
                onCreateOC={createOC}
                onUpdateOC={updateOC}
                onDeleteOC={deleteOC}
                onCreateSupplierWithResult={createSupplierWithResult}
                onPickTimeline={(id) => {
                  setSelectedSC(id);
                  setModule("ACOMPANHAMENTO");
                }}
              />
            </>
          ) : null}

          {module === "FORNECEDORES" ? (
            <SupplierModule fornecedores={dataset.fornecedoresAtivos} ranking={rankingPerformance} canWrite={canWrite} onCreate={createSupplier} onUpdate={updateSupplier} onDelete={deleteSupplier} />
          ) : null}

          {module === "SETORES" ? (
            <SectorModule setores={dataset.setoresAtivos} canWrite={canWrite} onCreate={createSector} onUpdate={updateSector} onDelete={deleteSector} />
          ) : null}

          {module === "ACOMPANHAMENTO" ? (
            <section>
              <ModuleTitle title="Central de Acompanhamento" subtitle="Tabela + Kanban + Timeline" />
              <Panel title="Kanban Operacional">
                <KanbanBoard scs={dataset.scFiltered} ocs={dataset.ocFiltered as PurchaseOrder[]} onMove={moveTrackingItem} canWrite={canWrite} />
              </Panel>
              <div className="mt-4">{scTimelineBlock}</div>
            </section>
          ) : null}

          {module === "KPIS_ANALYTICS" ? (
            <section>
              <ModuleTitle title="KPIs e Analytics" subtitle="Volume, Financeiro, Eficiencia e Fornecedores" />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <MetricCell label="Tempo medio aprovacao" value={`${kpisGlobal.tempoMedioAprovacaoDias} dias`} />
                <MetricCell label="Tempo medio SC -> OC" value={`${kpisGlobal.tempoMedioSCparaOCDias} dias`} />
                <MetricCell label="Lead time medio" value={`${kpisGlobal.leadTimeMedioDias} dias`} />
                <MetricCell label="Taxa no prazo" value={`${kpisGlobal.taxaEntregaNoPrazo}%`} />
                <MetricCell label="Valor total OC" value={formatCurrency(kpisGlobal.valorTotalOC)} />
                <MetricCell label="Ticket medio OC" value={formatCurrency(analyticsValuePerOc)} />
                <MetricCell label="Backlog aberto" value={String(kpisGlobal.entregasPendentes)} />
                <MetricCell label="Conversao SC->OC" value={`${analyticsScToOcConversion}%`} />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Panel title="Top Fornecedores">
                  <div className="mb-2 flex gap-2">
                    <button className={`rounded-md border px-2 py-1 text-xs ${supplierRankMode === "valor" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`} onClick={() => setSupplierRankMode("valor")}>Maior valor</button>
                    <button className={`rounded-md border px-2 py-1 text-xs ${supplierRankMode === "quantidade" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`} onClick={() => setSupplierRankMode("quantidade")}>Maior quantidade</button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-400">
                      <tr>
                        <th>Fornecedor</th>
                        <th>OC</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierExecutiveRanking.length === 0 ? (
                        <tr className="border-t border-slate-800">
                          <td colSpan={3} className="py-3 text-center text-slate-500">Sem dados de OCs para ranking.</td>
                        </tr>
                      ) : supplierExecutiveRanking.map((r) => (
                        <tr key={r.fornecedorId} className="border-t border-slate-800">
                          <td className="py-2" title={r.fornecedor}>{truncateSupplierName(r.fornecedor)}</td>
                          <td>{r.totalOC}</td>
                          <td>{formatCurrency(r.valorTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
                <Panel title="OCs por Comprador">
                  <div className="mb-2 flex gap-2">
                    <button className={`rounded-md border px-2 py-1 text-xs ${buyerRankMode === "quantidade" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`} onClick={() => setBuyerRankMode("quantidade")}>Maior quantidade</button>
                    <button className={`rounded-md border px-2 py-1 text-xs ${buyerRankMode === "valor" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`} onClick={() => setBuyerRankMode("valor")}>Maior valor</button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-400">
                      <tr>
                        <th>Comprador</th>
                        <th>OC</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyerExecutiveRanking.length === 0 ? (
                        <tr className="border-t border-slate-800">
                          <td colSpan={3} className="py-3 text-center text-slate-500">Sem dados para ranking de compradores.</td>
                        </tr>
                      ) : buyerExecutiveRanking.map((r) => (
                        <tr key={r.comprador} className="border-t border-slate-800">
                          <td className="py-2">{r.comprador}</td>
                          <td>{r.totalOC}</td>
                          <td>{formatCurrency(r.valorTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
                <Panel title="Status OC">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={statusesGlobal.ocByStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="status" stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={70} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="total" fill={CYAN} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
              </div>
              <div className="mt-4">
                <Panel title="Evolucao Financeira de OCs">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyGlobal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="mes" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="valorTotal" stroke={CYAN} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Panel>
              </div>
            </section>
          ) : null}

          {module === "RELATORIOS" ? (
            <section>
              <ModuleTitle title="Relatorios e Monitoramento" subtitle="Consolidado operacional" />
              <Panel title="Alertas Prioritarios">
                <ul className="space-y-2 text-sm">
                  {alerts.map((alert) => (
                    <li key={alert.id} className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                      <strong className="text-cyan-200">[{alert.nivel}]</strong> {alert.mensagem}
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          ) : null}

          {module === "EXCEL" ? (
            <section>
              <ModuleTitle title="Integracao Excel" subtitle="Exportacao completa e importacao validada" />
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Exportar Dados">
                  <p className="mb-3 text-sm text-slate-300">Gera arquivo com abas: DASHBOARD, SC, OC, FORNECEDORES, SETORES, ENTREGAS, KPIS e DADOS.</p>
                  <button onClick={exportExcel} className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-emerald-200">
                    Exportar para Excel
                  </button>
                </Panel>
                <Panel title="Importar Planilha">
                  <p className="mb-3 text-sm text-slate-300">Importacao oficial de OC por planilha (upsert por Nº Ordem). SCs existentes sao preservadas.</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleImportExcel(file);
                    }}
                    className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                  />
                  <div className="space-y-1 text-xs text-slate-300">
                    {importReport.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </Panel>
              </div>
            </section>
          ) : null}

          {module === "CONFIGURACOES" ? (
            <section>
              <ModuleTitle title="Configuracoes e Auditoria" subtitle="Permissoes e historico de alteracoes" />
              <Panel title="Politica de Acesso">
                <p className="text-sm text-slate-300">Perfil atual: {currentUser.role}</p>
                <p className="text-sm text-slate-400">Edicao liberada para ADMINISTRADOR, COMPRAS e GESTOR.</p>
              </Panel>
              <Panel title="Auditoria" className="mt-4">
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-slate-400">
                      <tr>
                        <th>Data</th>
                        <th>Usuario</th>
                        <th>Acao</th>
                        <th>Entidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.auditoria.map((log) => (
                        <tr key={log.id} className="border-t border-slate-800">
                          <td className="py-1">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                          <td>{log.usuario}</td>
                          <td>{log.acao}</td>
                          <td>{log.entidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </section>
          ) : null}

          {commandOpen ? (
            <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/75 px-3 pt-20" onClick={() => setCommandOpen(false)}>
              <div className="w-full max-w-2xl rounded-2xl border border-[#1A3445] bg-[#0C1420] shadow-[0_30px_70px_rgba(2,6,23,0.75)]" onClick={(e) => e.stopPropagation()}>
                <div className="border-b border-slate-800 px-4 py-3">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
                    <Search size={14} className="text-slate-400" />
                    <input
                      ref={commandInputRef}
                      value={globalQuery}
                      onChange={(e) => setGlobalQuery(e.target.value)}
                      placeholder="Pesquisar SC, OC, Fornecedor, CNPJ, NF, Solicitante, Descricao..."
                      className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    />
                    <span className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-500">ESC</span>
                  </div>
                </div>
                <div className="max-h-[52vh] overflow-auto p-2">
                  {commandResults.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-500">Nenhum resultado encontrado.</p>
                  ) : (
                    commandResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        className="mb-1 w-full rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-slate-700 hover:bg-slate-900/80"
                        onClick={() => {
                          if (result.type === "SC") {
                            setSelectedSC(result.id);
                            setModule("SC");
                          } else if (result.type === "OC") {
                            setModule("SC");
                          } else {
                            setModule("FORNECEDORES");
                          }
                          setCommandOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded border border-cyan-600/40 bg-cyan-600/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-cyan-200">{result.type}</span>
                          <p className="text-sm font-medium text-slate-100">{result.label}</p>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-400">{result.subtitle}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <footer className="mt-6 rounded-lg border border-cyan-500/20 bg-slate-950/70 px-4 py-2 text-center text-[10px] uppercase tracking-[0.18em] text-cyan-300/80 md:text-[11px] md:tracking-[0.24em]">
            Dados hoje • Decisoes melhores • Resultados amanha
          </footer>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cyan-500/20 bg-slate-950/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = module === item.id;
            return (
              <button
                key={`quick-${item.id}`}
                onClick={() => setModule(item.id)}
                className={`flex flex-col items-center justify-center rounded-lg px-1 py-1 text-[10px] ${active ? "bg-cyan-500/15 text-cyan-200" : "text-slate-400"}`}
              >
                <Icon size={14} />
                <span className="mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-800/90 bg-slate-950/88 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.45)] ${className}`}>
      <p className="mb-3 border-b border-slate-800 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">{title}</p>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  note,
  context,
  delta,
  icon: Icon,
  invertDelta,
  series,
}: {
  label: string;
  value: string;
  color: string;
  note?: string;
  context?: string;
  delta?: number;
  icon: React.ElementType;
  invertDelta?: boolean;
  series?: number[];
}) {
  const safeDelta = delta ?? 0;
  const deltaPositive = invertDelta ? safeDelta <= 0 : safeDelta >= 0;
  const DeltaIcon = deltaPositive ? ArrowUpRight : ArrowDownRight;
  const trendColor = deltaPositive ? GREEN : RED;
  const chartData = (series ?? [0]).map((valuePoint, index) => ({ index, value: valuePoint }));
  const gradientId = `kpi-${label.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-gradient`;

  return (
    <div className="h-[132px] rounded-2xl border bg-slate-950/88 p-3" style={{ borderColor: `${color}50`, boxShadow: `0 10px 24px rgba(2,6,23,.35)` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="mt-1 text-[26px] font-bold leading-none" style={{ color }}>
        {value}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ borderColor: `${trendColor}66`, color: trendColor, background: `${trendColor}1A` }}
        >
          <DeltaIcon size={11} />
          {formatDelta(safeDelta)}
        </span>
        <div className="h-8 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.65} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.4} fill={`url(#${gradientId})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {note ? <p className="mt-1 line-clamp-1 text-[10px] text-slate-500">{note}</p> : null}
      {context ? <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-600">{context}</p> : null}
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-cyan-200">{value}</p>
    </div>
  );
}

function FilterInput({ label, value, onChange, placeholder, inputRef }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; inputRef?: React.MutableRefObject<HTMLInputElement | null> }) {
  return (
    <label className="rounded-lg border border-slate-700 bg-slate-900/90 px-2 py-2 text-xs transition focus-within:border-cyan-500/60 focus-within:shadow-[0_0_10px_rgba(0,210,255,0.15)]">
      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <input
        ref={(node) => {
          if (inputRef) inputRef.current = node;
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="rounded-lg border border-slate-700 bg-slate-900/90 px-2 py-2 text-xs transition focus-within:border-cyan-500/60 focus-within:shadow-[0_0_10px_rgba(0,210,255,0.15)]">
      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-transparent text-sm text-cyan-100 outline-none">
        {options.map((opt) => (
          <option key={`${label}-${opt.value || "all"}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UnifiedScOcModule({
  scs,
  ocs,
  setores,
  fornecedores,
  canWrite,
  onCreateSC,
  onUpdateSC,
  onDeleteSC,
  onCreateOC,
  onUpdateOC,
  onDeleteOC,
  onCreateSupplierWithResult,
  onPickTimeline,
}: {
  scs: PurchaseRequest[];
  ocs: PurchaseOrder[];
  setores: AppState["setores"];
  fornecedores: AppState["fornecedores"];
  canWrite: boolean;
  onCreateSC: (payload: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<PurchaseRequest>;
  onUpdateSC: (id: string, payload: Partial<PurchaseRequest>) => Promise<void>;
  onDeleteSC: (id: string) => Promise<void>;
  onCreateOC: (payload: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<PurchaseOrder>;
  onUpdateOC: (id: string, payload: Partial<PurchaseOrder>) => Promise<void>;
  onDeleteOC: (id: string) => Promise<void>;
  onCreateSupplierWithResult: (payload: Omit<AppState["fornecedores"][number], "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<AppState["fornecedores"][number]>;
  onPickTimeline: (id: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<SCStatus | OCStatus | "">("");
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    numeroSC: "",
    numeroOC: "",
    nf: "",
    solicitante: "",
    fornecedorNome: "",
    unidade: "",
    valor: 0,
    data: "",
    descricao: "",
    setorId: "",
  });
  const rows = useMemo(() => buildUnifiedRows(scs, ocs, setores, fornecedores), [scs, ocs, setores, fornecedores]);
  const [formEntry, setFormEntry] = useState({
    solicitante: "",
    fornecedorNome: "",
    unidade: "",
    setorId: setores[0]?.id ?? "",
    area: "",
    numeroSC: "",
    numeroOC: "",
    numeroNF: "",
    valor: 0,
    contrato: true,
    descricao: "",
    status: "EM_ANALISE" as SCStatus,
  });

  const resolveSupplierId = useCallback(async (supplierName: string, fallbackSupplierId?: string | null) => {
    const typedName = supplierName.trim();
    if (!typedName) return fallbackSupplierId ?? null;

    const normalized = normalizeName(typedName);
    const existing = fornecedores.find((item) => {
      return normalizeName(item.nomeFantasia) === normalized || normalizeName(item.razaoSocial) === normalized;
    });
    if (existing) return existing.id;

    const suffix = Date.now().toString().slice(-6);
    const createdSupplier = await onCreateSupplierWithResult({
      codigo: `AUTO-${suffix}`,
      razaoSocial: typedName,
      nomeFantasia: typedName,
        cnpj: "-",
      contato: formEntry.solicitante || "Cadastro automatico",
      telefone: "",
      email: "",
      cidade: "",
      estado: "",
      categoria: "Cadastro Automatico",
      status: "ATIVO",
      observacoes: "Fornecedor criado automaticamente pela Central SC/OC.",
    });
    return createdSupplier.id;
  }, [fornecedores, onCreateSupplierWithResult, formEntry.solicitante]);

  const selectedRows = useMemo(() => {
    const selectedSet = new Set(selectedKeys);
    return rows.filter((row) => selectedSet.has(`${row.entity}:${row.id}`));
  }, [rows, selectedKeys]);

  useEffect(() => {
    setSelectedKeys((prev) => {
      const available = new Set(rows.map((row) => `${row.entity}:${row.id}`));
      return prev.filter((key) => available.has(key));
    });
  }, [rows]);

  const allRowsSelected = rows.length > 0 && selectedKeys.length === rows.length;

  const toggleRowSelection = (key: string) => {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const toggleSelectAll = () => {
    if (allRowsSelected) {
      setSelectedKeys([]);
      return;
    }
    setSelectedKeys(rows.map((row) => `${row.entity}:${row.id}`));
  };

  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedRows.length === 0) return;
    setIsBulkRunning(true);

    let success = 0;
    let failures = 0;

    try {
      for (const row of selectedRows) {
        try {
          if (row.entity === "SC") {
            const scRecord = scs.find((item) => item.id === row.id);
            if (!scRecord) {
              failures += 1;
              continue;
            }

            if (!["EM_ANALISE", "APROVADA", "REPROVADA", "LANCADA"].includes(bulkStatus)) {
              failures += 1;
              continue;
            }

            await onUpdateSC(scRecord.id, {
              status: bulkStatus as SCStatus,
              dataAprovacao: bulkStatus === "APROVADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataAprovacao,
              dataReprovacao: bulkStatus === "REPROVADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataReprovacao,
              dataLancamento: bulkStatus === "LANCADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataLancamento,
            });
            success += 1;
            continue;
          }

          const ocRecord = ocs.find((item) => item.id === row.id);
          if (!ocRecord) {
            failures += 1;
            continue;
          }

          if (!["ABERTO_TOTAL", "ABERTO_PARCIAL", "LIQUIDADO", "NAO_FECHADO", "CANCELADA"].includes(bulkStatus)) {
            failures += 1;
            continue;
          }

          await onUpdateOC(ocRecord.id, { status: bulkStatus as OCStatus });
          success += 1;
        } catch {
          failures += 1;
        }
      }

      setMessage(`Acao em lote concluida: ${success} atualizados, ${failures} falhas.`);
      if (success > 0) setSelectedKeys([]);
    } finally {
      setIsBulkRunning(false);
    }
  };

  const clearBulkNf = async () => {
    if (selectedRows.length === 0) return;
    setIsBulkRunning(true);

    let success = 0;
    let failures = 0;

    try {
      for (const row of selectedRows) {
        try {
          if (row.entity === "SC") {
            const scRecord = scs.find((item) => item.id === row.id);
            if (!scRecord) {
              failures += 1;
              continue;
            }

            await onUpdateSC(scRecord.id, {
              observacoes: setTaggedValue(scRecord.observacoes, "NF", ""),
              anexos: (scRecord.anexos ?? []).filter((entry) => !entry.startsWith("NF_FILE:")),
            });
            success += 1;
            continue;
          }

          const ocRecord = ocs.find((item) => item.id === row.id);
          if (!ocRecord) {
            failures += 1;
            continue;
          }

          await onUpdateOC(ocRecord.id, {
            observacoes: setTaggedValue(ocRecord.observacoes, "NF", ""),
            anexos: (ocRecord.anexos ?? []).filter((entry) => !entry.startsWith("NF_FILE:")),
          });
          success += 1;
        } catch {
          failures += 1;
        }
      }

      setMessage(`Limpeza de NF em lote: ${success} atualizados, ${failures} falhas.`);
      if (success > 0) setSelectedKeys([]);
    } finally {
      setIsBulkRunning(false);
    }
  };

  const deleteSelectedRows = async () => {
    if (selectedRows.length === 0) return;
    if (typeof window !== "undefined") {
      const approved = window.confirm(`Excluir ${selectedRows.length} registros selecionados? Esta acao nao pode ser desfeita.`);
      if (!approved) return;
    }

    setIsBulkRunning(true);
    let success = 0;
    let failures = 0;

    try {
      for (const row of selectedRows) {
        try {
          if (row.entity === "SC") {
            await onDeleteSC(row.id);
          } else {
            await onDeleteOC(row.id);
          }
          success += 1;
        } catch {
          failures += 1;
        }
      }

      setMessage(`Exclusao em lote concluida: ${success} excluidos, ${failures} falhas.`);
      if (success > 0) setSelectedKeys([]);
    } finally {
      setIsBulkRunning(false);
    }
  };

  const openRowEditor = (row: UnifiedScOcRow, scRecord: PurchaseRequest | undefined, ocRecord: PurchaseOrder | undefined, supplierName: string, unidadeValue: string, nfValue: string, rowDate: string) => {
    setEditingRowKey(`${row.entity}:${row.id}`);
    setEditDraft({
      numeroSC: row.numeroSC === "-" ? "" : row.numeroSC,
      numeroOC: row.numeroOC === "-" ? "" : row.numeroOC,
      nf: nfValue,
      solicitante: scRecord?.solicitante || ocRecord?.responsavel || "",
      fornecedorNome: supplierName === "-" ? "" : supplierName,
      unidade: unidadeValue === "-" ? "" : unidadeValue,
      valor: row.valor,
      data: rowDate,
      descricao: (scRecord?.descricao || ocRecord?.observacoes || "").slice(0, 500),
      setorId: scRecord?.setorId || ocRecord?.setorId || "",
    });
  };

  const cancelRowEditor = () => {
    setEditingRowKey(null);
  };

  const saveRowEditor = async (row: UnifiedScOcRow, scRecord: PurchaseRequest | undefined, ocRecord: PurchaseOrder | undefined) => {
    try {
      const fallbackSupplierId = ocRecord?.fornecedorId ?? scRecord?.fornecedorSugeridoId ?? fornecedores[0]?.id ?? null;
      const supplierId = await resolveSupplierId(editDraft.fornecedorNome, fallbackSupplierId);

      if (scRecord) {
        await onUpdateSC(scRecord.id, {
          numeroSC: editDraft.numeroSC.trim() || scRecord.numeroSC,
          solicitante: editDraft.solicitante.trim() || scRecord.solicitante,
          responsavel: editDraft.solicitante.trim() || scRecord.responsavel,
          setorId: editDraft.setorId || scRecord.setorId,
          valorEstimado: Number(editDraft.valor || 0),
          fornecedorSugeridoId: supplierId,
          numeroOCRelacionada: editDraft.numeroOC.trim() || scRecord.numeroOCRelacionada,
          dataCriacao: editDraft.data || scRecord.dataCriacao,
          descricao: editDraft.descricao.trim() || scRecord.descricao,
          observacoes: setTaggedValue(setTaggedValue(scRecord.observacoes, "NF", editDraft.nf), "UNIDADE", editDraft.unidade),
        });
      }

      if (ocRecord) {
        await onUpdateOC(ocRecord.id, {
          numeroOC: editDraft.numeroOC.trim() || ocRecord.numeroOC,
          responsavel: editDraft.solicitante.trim() || ocRecord.responsavel,
          setorId: editDraft.setorId || ocRecord.setorId,
          valorOC: Number(editDraft.valor || 0),
          fornecedorId: supplierId ?? ocRecord.fornecedorId,
          dataOC: editDraft.data || ocRecord.dataOC,
          dataEmissao: editDraft.data || ocRecord.dataEmissao,
          observacoes: setTaggedValue(setTaggedValue(ocRecord.observacoes, "NF", editDraft.nf), "UNIDADE", editDraft.unidade),
        });
      }

      setMessage(`Registro ${row.numeroSC}/${row.numeroOC} atualizado com sucesso.`);
      setEditingRowKey(null);
    } catch (error) {
      setMessage((error as Error).message || "Falha ao salvar alteracoes da linha.");
    }
  };

  return (
    <section className="space-y-4">
      <ModuleTitle title="Central SC / OC" subtitle="Criacao e controle em uma unica operacao" />

      {canWrite ? (
        <Panel title="Criacao Integrada SC / OC">
          <div className="grid gap-2 md:grid-cols-5">
            <input className="field" placeholder="Solicitante" value={formEntry.solicitante} onChange={(e) => setFormEntry((prev) => ({ ...prev, solicitante: e.target.value }))} />
            <input className="field" placeholder="Fornecedor (digite para cadastrar)" value={formEntry.fornecedorNome} onChange={(e) => setFormEntry((prev) => ({ ...prev, fornecedorNome: e.target.value }))} />
            <input className="field" placeholder="Unidade" value={formEntry.unidade} onChange={(e) => setFormEntry((prev) => ({ ...prev, unidade: e.target.value }))} />
            <select className="field" value={formEntry.setorId} onChange={(e) => setFormEntry((prev) => ({ ...prev, setorId: e.target.value }))}>
              <option value="">Setor</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>{setor.nome}</option>
              ))}
            </select>
            <input className="field" placeholder="Area" value={formEntry.area} onChange={(e) => setFormEntry((prev) => ({ ...prev, area: e.target.value }))} />
            <input className="field" placeholder="SC" value={formEntry.numeroSC} onChange={(e) => setFormEntry((prev) => ({ ...prev, numeroSC: e.target.value }))} />
            <input className="field" placeholder="OC" value={formEntry.numeroOC} onChange={(e) => setFormEntry((prev) => ({ ...prev, numeroOC: e.target.value }))} />

            <input className="field" placeholder="Nº NF" value={formEntry.numeroNF} onChange={(e) => setFormEntry((prev) => ({ ...prev, numeroNF: e.target.value }))} />
            <input className="field" type="number" placeholder="Valor" value={formEntry.valor} onChange={(e) => setFormEntry((prev) => ({ ...prev, valor: Number(e.target.value || 0) }))} />
            <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">
              <span>Contrato</span>
              <input type="checkbox" checked={formEntry.contrato} onChange={(e) => setFormEntry((prev) => ({ ...prev, contrato: e.target.checked }))} />
            </label>

            <textarea
              className="field md:col-span-5 min-h-[120px]"
              placeholder="Descricao"
              value={formEntry.descricao}
              onChange={(e) => setFormEntry((prev) => ({ ...prev, descricao: e.target.value }))}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100"
              disabled={isSaving}
              onClick={async () => {
                if (isSaving) return;

                const withRetry = async <T,>(fn: () => Promise<T>, retries = 1): Promise<T> => {
                  try {
                    return await fn();
                  } catch (error) {
                    if (retries <= 0) throw error;
                    return withRetry(fn, retries - 1);
                  }
                };

                let supplierId: string | null = fornecedores[0]?.id ?? null;
                try {
                  supplierId = await resolveSupplierId(formEntry.fornecedorNome, supplierId);
                  if (!supplierId) {
                    supplierId = await resolveSupplierId("Fornecedor Padrao", supplierId);
                  }
                } catch {
                  setMessage("Nao foi possivel cadastrar/associar fornecedor para concluir a OC.");
                  return;
                }

                const now = new Date().toISOString().slice(0, 10);
                const numeroSC = formEntry.numeroSC.trim() || `SC-${Date.now().toString().slice(-6)}`;
                const numeroOC = formEntry.numeroOC.trim() || `OC-${Date.now().toString().slice(-6)}`;
                const observacoesSc = setTaggedValue(setTaggedValue(formEntry.descricao, "NF", formEntry.numeroNF), "UNIDADE", formEntry.unidade);
                const observacoesOc = setTaggedValue(setTaggedValue(formEntry.descricao, "NF", formEntry.numeroNF), "UNIDADE", formEntry.unidade);
                const setorId = formEntry.setorId || setores[0]?.id || "-";

                try {
                  setIsSaving(true);
                  setMessage("Salvando SC/OC...");

                  const createdSc = await withRetry(() => onCreateSC({
                    numeroSC,
                    dataCriacao: now,
                    solicitante: formEntry.solicitante || "-",
                    setorId,
                    descricao: formEntry.descricao || "-",
                    categoria: formEntry.area,
                    prioridade: "MEDIA",
                    valorEstimado: formEntry.valor,
                    fornecedorSugeridoId: supplierId,
                    justificativa: formEntry.contrato ? "CONTRATO:SIM" : "CONTRATO:NAO",
                    status: formEntry.status,
                    responsavel: formEntry.solicitante,
                    dataAprovacao: null,
                    dataReprovacao: null,
                    motivoReprovacao: null,
                    dataLancamento: null,
                    numeroOCRelacionada: formEntry.numeroOC.trim() || null,
                    observacoes: observacoesSc,
                    anexos: [],
                  }));
                  await withRetry(() => onCreateOC({
                    numeroOC,
                    scId: createdSc.id,
                    fornecedorId: supplierId ?? "-",
                    dataOC: now,
                    dataEmissao: now,
                    dataPrevistaEntrega: now,
                    dataRealEntrega: null,
                    valorOC: formEntry.valor,
                    setorId,
                    responsavel: formEntry.solicitante,
                    status: "ABERTO_TOTAL",
                    condicaoPagamento: formEntry.contrato ? "Contrato" : "Avulso",
                    observacoes: observacoesOc,
                    anexos: [],
                  }));
                  setFormEntry((prev) => ({
                    ...prev,
                    solicitante: "",
                    fornecedorNome: "",
                    unidade: "",
                    setorId: setores[0]?.id ?? "",
                    area: "",
                    numeroSC: "",
                    numeroOC: "",
                    numeroNF: "",
                    valor: 0,
                    descricao: "",
                  }));
                  setMessage("SC e OC salvas com sucesso.");
                } catch (error) {
                  setMessage((error as Error).message || "Falha ao salvar SC/OC.");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
        </Panel>
      ) : null}

      <Panel title="Lista de Acompanhamento SC / OC">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-[11px] text-slate-300">
          <span className="uppercase tracking-[0.14em] text-cyan-200">Tabela operacional integrada</span>
          <span>{rows.length} linhas monitoradas</span>
        </div>

        {canWrite ? (
          <div className="mb-3 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md border border-cyan-500/35 px-2 py-1 text-cyan-200">Selecionados: {selectedRows.length}</span>
              <select
                className="field max-w-[170px] text-xs"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as SCStatus | OCStatus | "")}
                disabled={isBulkRunning}
              >
                <option value="">Status em lote</option>
                <option value="EM_ANALISE">SC - Em Analise</option>
                <option value="APROVADA">SC - Aprovada</option>
                <option value="REPROVADA">SC - Reprovada</option>
                <option value="LANCADA">SC - Lancada</option>
                <option value="ABERTO_TOTAL">OC - Aberto Total</option>
                <option value="ABERTO_PARCIAL">OC - Aberto Parcial</option>
                <option value="LIQUIDADO">OC - Liquidado</option>
                <option value="NAO_FECHADO">OC - Nao Fechado</option>
                <option value="CANCELADA">OC - Cancelado</option>
              </select>
              <button
                className="rounded border border-emerald-700 px-2 py-1 text-emerald-200 transition hover:bg-emerald-500/10 disabled:opacity-50"
                onClick={() => void applyBulkStatus()}
                disabled={!bulkStatus || selectedRows.length === 0 || isBulkRunning}
              >
                Aplicar status
              </button>
              <button
                className="rounded border border-amber-700 px-2 py-1 text-amber-200 transition hover:bg-amber-500/10 disabled:opacity-50"
                onClick={() => void clearBulkNf()}
                disabled={selectedRows.length === 0 || isBulkRunning}
              >
                Limpar NF
              </button>
              <button
                className="rounded border border-rose-700 px-2 py-1 text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-50"
                onClick={() => void deleteSelectedRows()}
                disabled={selectedRows.length === 0 || isBulkRunning}
              >
                Excluir selecionados
              </button>
              <button
                className="rounded border border-slate-700 px-2 py-1 text-slate-300 transition hover:bg-slate-800/80 disabled:opacity-50"
                onClick={() => setSelectedKeys([])}
                disabled={selectedRows.length === 0 || isBulkRunning}
              >
                Limpar selecao
              </button>
              {isBulkRunning ? <span className="text-cyan-200">Processando lote...</span> : null}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950/50">
          <table className="w-full table-fixed text-xs md:text-sm">
            <thead className="sticky top-0 z-10 bg-slate-950/95 text-left text-[10px] uppercase tracking-[0.14em] text-slate-400 backdrop-blur">
              <tr>
                <th className="w-[4%] px-2 py-2">
                  {canWrite ? (
                    <input type="checkbox" checked={allRowsSelected} onChange={toggleSelectAll} className="h-3.5 w-3.5 accent-cyan-500" />
                  ) : null}
                </th>
                <th className="w-[8%] px-2 py-2">SC</th>
                <th className="w-[8%] px-2">OC</th>
                <th className="w-[8%] px-2">NF</th>
                <th className="w-[16%] px-2">Solicitante</th>
                <th className="hidden w-[15%] px-2 md:table-cell">Fornecedor</th>
                <th className="hidden w-[10%] px-2 md:table-cell">Unidade</th>
                <th className="hidden w-[10%] px-2 lg:table-cell">CNPJ</th>
                <th className="w-[12%] px-2">Status</th>
                <th className="w-[10%] px-2 text-right">Valor</th>
                <th className="w-[8%] px-2">Data</th>
                <th className="w-[13%] px-2">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const scRecord = row.entity === "SC" ? scs.find((item) => item.id === row.id) : scs.find((item) => item.numeroSC === row.numeroSC);
                const ocRecord = row.entity === "OC" ? ocs.find((item) => item.id === row.id) : ocs.find((item) => item.numeroOC === row.numeroOC);
                const supplierId = ocRecord?.fornecedorId ?? scRecord?.fornecedorSugeridoId ?? null;
                const supplier = supplierId ? fornecedores.find((item) => item.id === supplierId) : null;
                const currentObservacoes = ocRecord?.observacoes ?? scRecord?.observacoes ?? "";
                const nfValue = getTaggedValue(currentObservacoes, "NF");
                const nfArquivoLabel =
                  (ocRecord?.anexos ?? scRecord?.anexos ?? [])
                    .find((entry) => entry.startsWith("NF_FILE:"))
                    ?.replace("NF_FILE:", "")
                    .split("|")[0] ?? "";
                const unidadeValue = getTaggedValue(currentObservacoes, "UNIDADE") || row.setor;
                const supplierName = supplier?.nomeFantasia || supplier?.razaoSocial || row.fornecedor || "-";
                const cnpj = supplier?.cnpj?.trim() || "-";
                const solicitante = scRecord?.solicitante || ocRecord?.responsavel || "-";
                const rowDate = scRecord?.dataCriacao || ocRecord?.dataOC || row.sortDate;
                const fileInputId = `nf-upload-${row.entity}-${row.id}`;
                const rowSelectionKey = `${row.entity}:${row.id}`;
                const isSelected = selectedKeys.includes(rowSelectionKey);
                const isEditing = editingRowKey === rowSelectionKey;

                return (
                  <tr key={`${row.entity}-${row.id}`} className={`border-t border-slate-800/90 align-top transition even:bg-slate-900/30 hover:bg-slate-900/70 ${isSelected ? "bg-cyan-500/10" : ""}`}>
                    <td className="px-2 py-2">
                      {canWrite ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(rowSelectionKey)}
                          className="h-3.5 w-3.5 accent-cyan-500"
                        />
                      ) : null}
                    </td>
                    <td className="truncate px-2 py-2 font-medium text-cyan-100">
                      {isEditing ? (
                        <input className="field w-full text-xs" value={editDraft.numeroSC} onChange={(e) => setEditDraft((prev) => ({ ...prev, numeroSC: e.target.value }))} />
                      ) : row.numeroSC}
                    </td>
                    <td className="truncate px-2 text-slate-200">
                      {isEditing ? (
                        <input className="field w-full text-xs" value={editDraft.numeroOC} onChange={(e) => setEditDraft((prev) => ({ ...prev, numeroOC: e.target.value }))} />
                      ) : row.numeroOC}
                    </td>
                    <td className="truncate px-2">
                      {isEditing ? (
                        <input className="field w-full text-xs" value={editDraft.nf} onChange={(e) => setEditDraft((prev) => ({ ...prev, nf: e.target.value }))} />
                      ) : (nfValue || "-")}
                    </td>
                    <td className="truncate px-2">
                      {isEditing ? (
                        <input className="field w-full text-xs" value={editDraft.solicitante} onChange={(e) => setEditDraft((prev) => ({ ...prev, solicitante: e.target.value }))} />
                      ) : solicitante}
                    </td>
                    <td className="hidden truncate px-2 md:table-cell" title={supplierName}>
                      {isEditing ? (
                        <input className="field w-full text-xs" value={editDraft.fornecedorNome} onChange={(e) => setEditDraft((prev) => ({ ...prev, fornecedorNome: e.target.value }))} />
                      ) : truncateSupplierName(supplierName)}
                    </td>
                    <td className="hidden truncate px-2 md:table-cell">
                      {isEditing ? (
                        <input className="field w-full text-xs" value={editDraft.unidade} onChange={(e) => setEditDraft((prev) => ({ ...prev, unidade: e.target.value }))} />
                      ) : unidadeValue}
                    </td>
                    <td className="hidden truncate px-2 lg:table-cell">{cnpj}</td>
                    <td className="px-2">
                      {isEditing ? (
                        <select
                          className="field w-full max-w-[132px] text-xs"
                          value={editDraft.setorId}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, setorId: e.target.value }))}
                        >
                          <option value="">Setor</option>
                          {setores.map((setor) => (
                            <option key={`edit-setor-${setor.id}`} value={setor.id}>{setor.nome}</option>
                          ))}
                        </select>
                      ) : null}

                      {!isEditing && canWrite && row.entity === "SC" && scRecord ? (
                        <select
                          className="field w-full max-w-[132px] text-xs"
                          value={scRecord.status}
                          onChange={async (e) => {
                            const nextStatus = e.target.value as SCStatus;
                            await onUpdateSC(scRecord.id, {
                              status: nextStatus,
                              dataAprovacao: nextStatus === "APROVADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataAprovacao,
                              dataReprovacao: nextStatus === "REPROVADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataReprovacao,
                              dataLancamento: nextStatus === "LANCADA" ? new Date().toISOString().slice(0, 10) : scRecord.dataLancamento,
                            });
                          }}
                        >
                          <option value="EM_ANALISE">Em Analise</option>
                          <option value="APROVADA">Aprovada</option>
                          <option value="REPROVADA">Reprovada</option>
                          <option value="LANCADA">Lancada</option>
                        </select>
                      ) : null}

                      {!isEditing && canWrite && row.entity === "OC" && ocRecord ? (
                        <select
                          className="field w-full max-w-[132px] text-xs"
                          value={ocToPhase(ocRecord.status as OCStatus)}
                          onChange={async (e) => {
                            const phase = e.target.value as OcPhase;
                            await onUpdateOC(ocRecord.id, { status: phaseToOcStatus(phase) });
                          }}
                        >
                          <option value="ABERTO_TOTAL">Aberto Total</option>
                          <option value="ABERTO_PARCIAL">Aberto Parcial</option>
                          <option value="LIQUIDADO">Liquidado</option>
                          <option value="NAO_FECHADO">Nao Fechado</option>
                          <option value="CANCELADA">Cancelado</option>
                        </select>
                      ) : null}

                      {!canWrite ? <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium ${businessStatusBadge(row.statusKey)}`}>{row.statusLabel}</span> : null}
                    </td>
                    <td className="px-2 text-right font-medium text-emerald-300">
                      {isEditing ? (
                        <input className="field w-full text-right text-xs" type="number" value={editDraft.valor} onChange={(e) => setEditDraft((prev) => ({ ...prev, valor: Number(e.target.value || 0) }))} />
                      ) : formatCurrency(row.valor)}
                    </td>
                    <td className="px-2 text-slate-300">
                      {isEditing ? (
                        <input className="field w-full text-xs" type="date" value={editDraft.data} onChange={(e) => setEditDraft((prev) => ({ ...prev, data: e.target.value }))} />
                      ) : formatDatePtBr(rowDate)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col items-start gap-1 xl:flex-row xl:items-center">
                        {canWrite ? (
                          isEditing ? (
                            <>
                              <button className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/10" onClick={() => void saveRowEditor(row, scRecord, ocRecord)}>
                                Salvar
                              </button>
                              <button className="rounded border border-slate-700 px-2 py-1 text-xs transition hover:bg-slate-800/80" onClick={cancelRowEditor}>
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              className="rounded border border-cyan-700 px-2 py-1 text-xs text-cyan-200 transition hover:bg-cyan-500/10"
                              onClick={() => openRowEditor(row, scRecord, ocRecord, supplierName, unidadeValue, nfValue, rowDate)}
                            >
                              Editar
                            </button>
                          )
                        ) : null}
                        {scRecord ? (
                          <button className="rounded border border-slate-700 px-2 py-1 text-xs transition hover:bg-slate-800/80" onClick={() => onPickTimeline(scRecord.id)}>
                            Timeline
                          </button>
                        ) : null}
                        {canWrite && !isEditing ? (
                          <label className="cursor-pointer rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/10">
                            Arquivo NF
                            <input
                              id={fileInputId}
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.webp"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 1_500_000) {
                                  setMessage("Arquivo NF maior que 1.5MB. Use arquivo menor para persistir com estabilidade.");
                                  e.currentTarget.value = "";
                                  return;
                                }

                                try {
                                  const encoded = await fileToDataUrl(file);
                                  const fileEntry = `NF_FILE:${file.name}|${file.type}|${file.size}|${Date.now()}|${encoded}`;
                                  if (row.entity === "OC" && ocRecord) {
                                    await onUpdateOC(ocRecord.id, {
                                      anexos: [...(ocRecord.anexos ?? []).filter((entry) => !entry.startsWith("NF_FILE:")), fileEntry],
                                    });
                                  } else if (row.entity === "SC" && scRecord) {
                                    await onUpdateSC(scRecord.id, {
                                      anexos: [...(scRecord.anexos ?? []).filter((entry) => !entry.startsWith("NF_FILE:")), fileEntry],
                                    });
                                  }

                                  setMessage(`Arquivo NF salvo: ${file.name}`);
                                } catch (error) {
                                  setMessage((error as Error).message || "Falha ao salvar arquivo NF.");
                                } finally {
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                          </label>
                        ) : null}
                        {nfArquivoLabel && !isEditing ? <span className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">NF: {nfArquivoLabel}</span> : null}
                        {canWrite && !isEditing ? (
                          <button
                            className="rounded border border-rose-700 px-2 py-1 text-xs transition hover:bg-rose-500/10"
                            onClick={async () => {
                              if (row.entity === "SC") {
                                await onDeleteSC(row.id);
                                return;
                              }

                              await onDeleteOC(row.id);
                            }}
                          >
                            Excluir
                          </button>
                        ) : null}
                      </div>
                      {isEditing ? (
                        <textarea
                          className="field mt-1 min-h-[56px] w-full text-xs"
                          placeholder="Descricao / observacoes"
                          value={editDraft.descricao}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, descricao: e.target.value }))}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function ScModule({
  scs,
  setores,
  fornecedores,
  canWrite,
  onCreate,
  onUpdate,
  onDelete,
  onPickTimeline,
}: {
  scs: PurchaseRequest[];
  setores: AppState["setores"];
  fornecedores: AppState["fornecedores"];
  canWrite: boolean;
  onCreate: (payload: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  onUpdate: (id: string, payload: Partial<PurchaseRequest>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPickTimeline: (id: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [newSC, setNewSC] = useState({
    numeroSC: "",
    solicitante: "",
    setorId: setores[0]?.id ?? "",
    descricao: "",
    categoria: "",
    prioridade: "MEDIA" as PurchaseRequest["prioridade"],
    valorEstimado: 0,
    fornecedorSugeridoId: fornecedores[0]?.id ?? null,
    justificativa: "",
    status: "EM_ANALISE" as SCStatus,
    responsavel: "",
    observacoes: "",
  });

  return (
    <section>
      <ModuleTitle title="Controle de SC" subtitle="Solicitacoes de Compra" />
      {canWrite ? (
        <Panel title="Nova SC">
          <div className="grid gap-2 md:grid-cols-4">
            <input className="field" placeholder="Numero SC" value={newSC.numeroSC} onChange={(e) => setNewSC({ ...newSC, numeroSC: e.target.value })} />
            <input className="field" placeholder="Solicitante" value={newSC.solicitante} onChange={(e) => setNewSC({ ...newSC, solicitante: e.target.value })} />
            <input className="field" placeholder="Responsavel" value={newSC.responsavel} onChange={(e) => setNewSC({ ...newSC, responsavel: e.target.value })} />
            <input className="field" type="number" placeholder="Valor" value={newSC.valorEstimado} onChange={(e) => setNewSC({ ...newSC, valorEstimado: Number(e.target.value) })} />
            <input className="field md:col-span-2" placeholder="Descricao" value={newSC.descricao} onChange={(e) => setNewSC({ ...newSC, descricao: e.target.value })} />
            <input className="field" placeholder="Categoria" value={newSC.categoria} onChange={(e) => setNewSC({ ...newSC, categoria: e.target.value })} />
            <input className="field" placeholder="Justificativa" value={newSC.justificativa} onChange={(e) => setNewSC({ ...newSC, justificativa: e.target.value })} />
          </div>
          <button
            className="mt-3 rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"
            onClick={async () => {
              if (!newSC.numeroSC || !newSC.solicitante || !newSC.descricao) {
                setMessage("Preencha Numero SC, Solicitante e Descricao.");
                return;
              }
              try {
                await onCreate({
                numeroSC: newSC.numeroSC,
                dataCriacao: new Date().toISOString().slice(0, 10),
                solicitante: newSC.solicitante,
                setorId: newSC.setorId,
                descricao: newSC.descricao,
                categoria: newSC.categoria,
                prioridade: newSC.prioridade,
                valorEstimado: newSC.valorEstimado,
                fornecedorSugeridoId: newSC.fornecedorSugeridoId,
                justificativa: newSC.justificativa,
                status: newSC.status,
                responsavel: newSC.responsavel,
                dataAprovacao: null,
                dataReprovacao: null,
                motivoReprovacao: null,
                dataLancamento: null,
                numeroOCRelacionada: null,
                observacoes: newSC.observacoes,
                anexos: [],
              });
                setNewSC({ ...newSC, numeroSC: "", descricao: "", solicitante: "", valorEstimado: 0 });
                setMessage("SC criada e refletida no dashboard.");
              } catch (error) {
                setMessage((error as Error).message || "Falha ao criar SC.");
              }
            }}
          >
            Criar SC
          </button>
          {message ? <p className="mt-2 text-xs text-cyan-200">{message}</p> : null}
        </Panel>
      ) : null}

      <Panel title="Lista de SC" className="mt-4">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th>SC</th>
                <th>Setor</th>
                <th>Status</th>
                <th>Responsavel</th>
                <th>Valor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {scs.map((sc) => (
                <tr key={sc.id} className="border-t border-slate-800">
                  <td className="py-2">{sc.numeroSC}</td>
                  <td>{setores.find((s) => s.id === sc.setorId)?.nome ?? "-"}</td>
                  <td>{SC_STATUS_LABEL[sc.status]}</td>
                  <td>{sc.responsavel}</td>
                  <td>{formatCurrency(sc.valorEstimado)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => onPickTimeline(sc.id)}>
                        Timeline
                      </button>
                      {canWrite ? (
                        <>
                          <button className="rounded border border-emerald-700 px-2 py-1 text-xs" onClick={async () => await onUpdate(sc.id, { status: "APROVADA", dataAprovacao: new Date().toISOString().slice(0, 10) })}>
                            Aprovar
                          </button>
                          <button className="rounded border border-rose-700 px-2 py-1 text-xs" onClick={async () => await onDelete(sc.id)}>
                            Excluir
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function OcModule({
  ocs,
  scs,
  fornecedores,
  setores,
  canWrite,
  onCreate,
  onUpdate,
  onDelete,
}: {
  ocs: PurchaseOrder[];
  scs: PurchaseRequest[];
  fornecedores: AppState["fornecedores"];
  setores: AppState["setores"];
  canWrite: boolean;
  onCreate: (payload: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  onUpdate: (id: string, payload: Partial<PurchaseOrder>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [newOc, setNewOc] = useState({
    numeroOC: "",
    scId: scs[0]?.id ?? "",
    fornecedorId: fornecedores[0]?.id ?? "",
    dataPrevistaEntrega: new Date().toISOString().slice(0, 10),
    valorOC: 0,
    setorId: setores[0]?.id ?? "",
    responsavel: "",
    condicaoPagamento: "30 dias",
    observacoes: "",
  });

  return (
    <section>
      <ModuleTitle title="Controle de OC" subtitle="Ordens de Compra" />
      {canWrite ? (
        <Panel title="Nova OC">
          <div className="grid gap-2 md:grid-cols-4">
            <input className="field" placeholder="Numero OC" value={newOc.numeroOC} onChange={(e) => setNewOc({ ...newOc, numeroOC: e.target.value })} />
            <select className="field" value={newOc.scId} onChange={(e) => setNewOc({ ...newOc, scId: e.target.value })}>
              {scs.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.numeroSC}</option>
              ))}
            </select>
            <select className="field" value={newOc.fornecedorId} onChange={(e) => setNewOc({ ...newOc, fornecedorId: e.target.value })}>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nomeFantasia}</option>
              ))}
            </select>
            <input className="field" type="number" placeholder="Valor" value={newOc.valorOC} onChange={(e) => setNewOc({ ...newOc, valorOC: Number(e.target.value) })} />
            <input className="field" type="date" value={newOc.dataPrevistaEntrega} onChange={(e) => setNewOc({ ...newOc, dataPrevistaEntrega: e.target.value })} />
            <select className="field" value={newOc.setorId} onChange={(e) => setNewOc({ ...newOc, setorId: e.target.value })}>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
            <input className="field" placeholder="Responsavel" value={newOc.responsavel} onChange={(e) => setNewOc({ ...newOc, responsavel: e.target.value })} />
            <input className="field" placeholder="Condicao" value={newOc.condicaoPagamento} onChange={(e) => setNewOc({ ...newOc, condicaoPagamento: e.target.value })} />
          </div>
          <button
            className="mt-3 rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"
            onClick={async () => {
              if (!newOc.numeroOC || !newOc.scId || !newOc.fornecedorId || !newOc.setorId) {
                setMessage("Preencha Numero OC, SC, Fornecedor e Setor.");
                return;
              }
              const today = new Date().toISOString().slice(0, 10);
              try {
                await onCreate({
                numeroOC: newOc.numeroOC,
                scId: newOc.scId,
                fornecedorId: newOc.fornecedorId,
                dataOC: today,
                dataEmissao: today,
                dataPrevistaEntrega: newOc.dataPrevistaEntrega,
                dataRealEntrega: null,
                valorOC: newOc.valorOC,
                setorId: newOc.setorId,
                responsavel: newOc.responsavel,
                status: "ABERTO_TOTAL",
                condicaoPagamento: newOc.condicaoPagamento,
                observacoes: newOc.observacoes,
                anexos: [],
              });
                setNewOc({ ...newOc, numeroOC: "", valorOC: 0, responsavel: "" });
                setMessage("OC criada e refletida no dashboard.");
              } catch (error) {
                setMessage((error as Error).message || "Falha ao criar OC.");
              }
            }}
          >
            Criar OC
          </button>
          {message ? <p className="mt-2 text-xs text-cyan-200">{message}</p> : null}
        </Panel>
      ) : null}

      <Panel title="Lista de OCs" className="mt-4">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th>OC</th>
                <th>SC</th>
                <th>Fornecedor</th>
                <th>Status</th>
                <th>Prevista</th>
                <th>Valor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {ocs.map((oc) => (
                <tr key={oc.id} className="border-t border-slate-800">
                  <td className="py-2">{oc.numeroOC}</td>
                  <td>{scs.find((s) => s.id === oc.scId)?.numeroSC ?? oc.scId}</td>
                  <td title={fornecedores.find((f) => f.id === oc.fornecedorId)?.nomeFantasia ?? oc.fornecedorId}>{truncateSupplierName(fornecedores.find((f) => f.id === oc.fornecedorId)?.nomeFantasia ?? oc.fornecedorId)}</td>
                  <td className={oc.status === "NAO_FECHADO" ? "text-rose-300" : ""}>{OC_STATUS_LABEL[oc.status as OCStatus]}</td>
                  <td>{oc.dataPrevistaEntrega}</td>
                  <td>{formatCurrency(oc.valorOC)}</td>
                  <td>
                    {canWrite ? (
                      <div className="flex gap-2">
                        <select
                          className="field max-w-[170px] text-xs"
                          value={ocToPhase(oc.status as OCStatus)}
                          onChange={async (e) => {
                            const phase = e.target.value as OcPhase;
                            const nextStatus = phaseToOcStatus(phase);
                            const payload: Partial<PurchaseOrder> = { status: nextStatus };
                            if (nextStatus === "LIQUIDADO" || nextStatus === "ABERTO_PARCIAL") payload.dataRealEntrega = new Date().toISOString().slice(0, 10);
                            await onUpdate(oc.id, payload);
                          }}
                        >
                          <option value="ABERTO_TOTAL">Aberto Total</option>
                          <option value="ABERTO_PARCIAL">Aberto Parcial</option>
                          <option value="LIQUIDADO">Liquidado</option>
                          <option value="NAO_FECHADO">Nao Fechado</option>
                          <option value="CANCELADA">Cancelado</option>
                        </select>
                        <button className="rounded border border-emerald-700 px-2 py-1 text-xs" onClick={async () => await onUpdate(oc.id, { status: "LIQUIDADO", dataRealEntrega: new Date().toISOString().slice(0, 10) })}>
                          Liquidar
                        </button>
                        <button className="rounded border border-rose-700 px-2 py-1 text-xs" onClick={async () => await onDelete(oc.id)}>
                          Excluir
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Sem permissao</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function SupplierModule({
  fornecedores,
  ranking,
  canWrite,
  onCreate,
  onUpdate,
  onDelete,
}: {
  fornecedores: AppState["fornecedores"];
  ranking: ReturnType<typeof supplierRanking>;
  canWrite: boolean;
  onCreate: (payload: Omit<AppState["fornecedores"][number], "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  onUpdate: (id: string, payload: Partial<AppState["fornecedores"][number]>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [nomeDraft, setNomeDraft] = useState<Record<string, string>>({});
  const [savingSupplierId, setSavingSupplierId] = useState<string | null>(null);

  return (
    <section>
      <ModuleTitle title="Cadastro de Fornecedores" subtitle="Base estrategica" />
      {canWrite ? (
        <Panel title="Novo Fornecedor">
          <div className="flex gap-2">
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="field" placeholder="Nome fantasia" />
            <button
              className="rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"
              onClick={async () => {
                if (!nome) return;
                await onCreate({
                  codigo: `F${Math.round(Math.random() * 9999)}`,
                  razaoSocial: nome,
                  nomeFantasia: nome,
                  cnpj: "-",
                  contato: "",
                  telefone: "",
                  email: "",
                  cidade: "",
                  estado: "",
                  categoria: "Geral",
                  status: "ATIVO",
                  observacoes: "",
                });
                setNome("");
              }}
            >
              Criar
            </button>
          </div>
        </Panel>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Fornecedores">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th>Codigo</th>
                <th>Nome</th>
                <th>Status</th>
                <th className="w-[220px]">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((forn) => (
                <tr key={forn.id} className="border-t border-slate-800">
                  <td className="py-2">{forn.codigo}</td>
                  <td>
                    {canWrite ? (
                      <input
                        className="field"
                        value={nomeDraft[forn.id] ?? forn.nomeFantasia}
                        onChange={(e) => setNomeDraft((prev) => ({ ...prev, [forn.id]: e.target.value }))}
                        placeholder="Nome do fornecedor"
                      />
                    ) : (
                      forn.nomeFantasia
                    )}
                  </td>
                  <td>{forn.status}</td>
                  <td>
                    {canWrite ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded border border-cyan-600 px-2 py-1 text-xs"
                          onClick={async () => {
                            const nextNome = (nomeDraft[forn.id] ?? forn.nomeFantasia).trim();
                            if (!nextNome || nextNome === forn.nomeFantasia || savingSupplierId === forn.id) return;
                            setSavingSupplierId(forn.id);
                            try {
                              await onUpdate(forn.id, { nomeFantasia: nextNome, razaoSocial: nextNome });
                              setNomeDraft((prev) => {
                                const copy = { ...prev };
                                delete copy[forn.id];
                                return copy;
                              });
                            } finally {
                              setSavingSupplierId(null);
                            }
                          }}
                        >
                          {savingSupplierId === forn.id ? "Salvando..." : "Salvar Nome"}
                        </button>
                        <button className="rounded border border-amber-600 px-2 py-1 text-xs" onClick={async () => await onUpdate(forn.id, { status: forn.status === "ATIVO" ? "INATIVO" : "ATIVO" })}>
                          Alternar
                        </button>
                        <button className="rounded border border-rose-700 px-2 py-1 text-xs" onClick={async () => await onDelete(forn.id)}>
                          Excluir
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Ranking de Performance">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th>Fornecedor</th>
                <th>Valor</th>
                <th>Atrasos</th>
                <th>Prazo %</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item) => (
                <tr key={item.fornecedorId} className="border-t border-slate-800">
                  <td className="py-2">{item.fornecedor}</td>
                  <td>{formatCurrency(item.valorTotal)}</td>
                  <td>{item.atrasos}</td>
                  <td>{item.taxaPrazo}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </section>
  );
}

function SectorModule({
  setores,
  canWrite,
  onCreate,
  onUpdate,
  onDelete,
}: {
  setores: AppState["setores"];
  canWrite: boolean;
  onCreate: (payload: Omit<AppState["setores"][number], "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  onUpdate: (id: string, payload: Partial<AppState["setores"][number]>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  return (
    <section>
      <ModuleTitle title="Setores" subtitle="Gestao dos centros solicitantes" />
      {canWrite ? (
        <Panel title="Novo Setor">
          <div className="flex gap-2">
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="field" placeholder="Nome do setor" />
            <button
              className="rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"
              onClick={async () => {
                if (!nome) return;
                await onCreate({ nome, descricao: "", ativo: true });
                setNome("");
              }}
            >
              Criar
            </button>
          </div>
        </Panel>
      ) : null}
      <Panel title="Lista de Setores" className="mt-4">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th>Nome</th>
              <th>Ativo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {setores.map((setor) => (
              <tr key={setor.id} className="border-t border-slate-800">
                <td className="py-2">{setor.nome}</td>
                <td>{setor.ativo ? "Sim" : "Nao"}</td>
                <td>
                  {canWrite ? (
                    <div className="flex gap-2">
                      <button className="rounded border border-amber-600 px-2 py-1 text-xs" onClick={async () => await onUpdate(setor.id, { ativo: !setor.ativo })}>
                        Alternar
                      </button>
                      <button className="rounded border border-rose-700 px-2 py-1 text-xs" onClick={async () => await onDelete(setor.id)}>
                        Excluir
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </section>
  );
}

function KanbanBoard({
  scs,
  ocs,
  onMove,
  canWrite,
}: {
  scs: PurchaseRequest[];
  ocs: PurchaseOrder[];
  onMove: (entity: "SC" | "OC", id: string, targetStatus: string) => Promise<void>;
  canWrite: boolean;
}) {
  const columns = [
    { key: "EM_ANALISE", label: "EM ANALISE", kind: "SC" as const },
    { key: "APROVADA", label: "APROVADA", kind: "SC" as const },
    { key: "LANCADA", label: "LANCADA", kind: "SC" as const },
    { key: "ABERTO_TOTAL", label: "OC ABERTO TOTAL", kind: "OC" as const },
    { key: "ABERTO_PARCIAL", label: "OC ABERTO PARCIAL", kind: "OC" as const },
    { key: "LIQUIDADO", label: "OC LIQUIDADO", kind: "OC" as const },
    { key: "NAO_FECHADO", label: "OC NAO FECHADO", kind: "OC" as const },
    { key: "CANCELADA", label: "OC CANCELADO", kind: "OC" as const },
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-4">
      {columns.map((col) => {
        const cards =
          col.kind === "SC"
            ? scs.filter((sc) => sc.status === col.key)
            : ocs.filter((oc) => oc.status === col.key);

        return (
          <div
            key={col.key}
            className="min-h-[180px] rounded-lg border border-slate-800 bg-slate-900/60 p-2"
            onDragOver={(e) => {
              if (!canWrite) return;
              e.preventDefault();
            }}
            onDrop={async (e) => {
              if (!canWrite) return;
              const payload = e.dataTransfer.getData("text/plain");
              const [entity, id] = payload.split(":");
              if (!entity || !id) return;
              await onMove(entity as "SC" | "OC", id, col.key);
            }}
          >
            <p className="mb-2 text-xs font-semibold tracking-wider text-cyan-300">{col.label}</p>
            <div className="space-y-2">
              {cards.map((card) => {
                const id = card.id;
                const title = "numeroSC" in card ? card.numeroSC : card.numeroOC;
                return (
                  <div
                    key={id}
                    draggable={canWrite}
                    onDragStart={(e) => {
                      const entity = "numeroSC" in card ? "SC" : "OC";
                      e.dataTransfer.setData("text/plain", `${entity}:${id}`);
                    }}
                    className="cursor-grab rounded-md border border-slate-700 bg-slate-950/80 p-2 text-xs"
                  >
                    <p className="font-semibold text-slate-200">{title}</p>
                    <p className="text-slate-400">{"descricao" in card ? card.descricao : card.responsavel}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
