"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
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
  Search,
  Settings,
  Shield,
  Truck,
  UserCircle2,
  Users,
} from "lucide-react";
import {
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

const CYAN = "#35f3ff";
const GREEN = "#58ff9b";
const AMBER = "#ffd564";
const RED = "#ff5d7d";
const PURPLE = "#9f7aff";
const BLUE = "#5ba5ff";

const OC_PHASE_LABEL: Record<OcPhase, string> = {
  EM_ANALISE: "Em Analise",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  LANCADA: "Lancada",
};

function businessStatusBadge(status: SCStatus | OcPhase) {
  if (status === "APROVADA") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (status === "REPROVADA") return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  if (status === "LANCADA") return "border-blue-500/40 bg-blue-500/10 text-blue-200";
  return "border-amber-500/40 bg-amber-500/10 text-amber-200";
}

function scStatusBadge(status: SCStatus) {
  return businessStatusBadge(status);
}

function ocStatusBadge(status: OCStatus) {
  if (status === "ATRASADA") return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  if (status === "ENTREGUE") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  return "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
}

type OcPhase = "EM_ANALISE" | "APROVADA" | "REPROVADA" | "LANCADA";

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
};

function ocToPhase(status: OCStatus): OcPhase {
  if (status === "CANCELADA") return "REPROVADA";
  if (status === "CONFIRMADA" || status === "EM_PRODUCAO" || status === "EM_TRANSPORTE" || status === "ENTREGUE" || status === "ATRASADA") return "APROVADA";
  if (status === "ENVIADA_FORNECEDOR") return "LANCADA";
  return "EM_ANALISE";
}

function phaseToOcStatus(phase: OcPhase, current: OCStatus): OCStatus {
  if (phase === "REPROVADA") return "CANCELADA";
  if (phase === "LANCADA") return "ENVIADA_FORNECEDOR";
  if (phase === "EM_ANALISE") return "CRIADA";
  if (current === "ENTREGUE" || current === "ATRASADA") return current;
  return "CONFIRMADA";
}

function formatCompactCurrency(value: number) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(2)} Mi`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)} mil`;
  return formatCurrency(value);
}

function phaseColor(label: string) {
  if (label === "Aprovada") return GREEN;
  if (label === "Em Analise") return AMBER;
  if (label === "Reprovada") return RED;
  return BLUE;
}

function buildUnifiedRows(
  scs: PurchaseRequest[],
  ocs: PurchaseOrder[],
  setores: AppState["setores"],
  fornecedores: AppState["fornecedores"],
): UnifiedScOcRow[] {
  const scRows: UnifiedScOcRow[] = scs.map((sc) => ({
    id: sc.id,
    entity: "SC",
    numeroSC: sc.numeroSC,
    numeroOC: sc.numeroOCRelacionada ?? "-",
    setor: setores.find((setor) => setor.id === sc.setorId)?.nome ?? "-",
    statusKey: sc.status,
    statusLabel: SC_STATUS_LABEL[sc.status],
    fornecedor: fornecedores.find((fornecedor) => fornecedor.id === sc.fornecedorSugeridoId)?.nomeFantasia ?? "-",
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

function answerOperationalQuestion(question: string, context: AiAnswerContext) {
  const normalized = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (!normalized.trim()) {
    return "Pergunte sobre atrasos, fornecedor lider, setor com mais OCs, valor total ou distribuicao de status.";
  }

  if (normalized.includes("atras") || normalized.includes("urgente") || normalized.includes("risco")) {
    return context.delayedCount > 0
      ? `Existem ${context.delayedCount} OCs atrasadas e elas devem ser tratadas primeiro.`
      : "Nao existem OCs atrasadas no momento.";
  }

  if (normalized.includes("fornecedor") || normalized.includes("melhor fornecedor") || normalized.includes("lider")) {
    return `O fornecedor com maior concentracao financeira na carteira atual e ${context.topSupplier}.`;
  }

  if (normalized.includes("setor") || normalized.includes("onde esta") || normalized.includes("maior demanda")) {
    return `O setor com maior peso operacional de OCs no filtro atual e ${context.topSector}.`;
  }

  if (normalized.includes("status") || normalized.includes("fase") || normalized.includes("aprovad") || normalized.includes("analise")) {
    return `Distribuicao atual das OCs: ${context.phaseSummary}.`;
  }

  if (normalized.includes("valor") || normalized.includes("financeiro") || normalized.includes("carteira")) {
    return `O valor total da carteira de OCs filtrada e ${context.totalOcValue}.`;
  }

  if (normalized.includes("abertas") || normalized.includes("em curso") || normalized.includes("andamento")) {
    return `Existem ${context.openOcCount} OCs em curso no filtro atual.`;
  }

  return `Resumo rapido: ${context.phaseSummary}. Setor lider: ${context.topSector}. Fornecedor lider: ${context.topSupplier}. Valor total: ${context.totalOcValue}.`;
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
    return <div className="text-slate-300">Carregando sessao...</div>;
  }

  return (
    <div className="mx-auto mt-20 w-full max-w-md rounded-2xl border border-cyan-400/30 bg-slate-950/90 p-8 shadow-[0_0_40px_rgba(53,243,255,0.15)]">
      <h1 className="font-orbitron text-2xl text-cyan-200">PROCUREMENT CONTROL CENTER</h1>
      <p className="mt-2 text-sm text-slate-400">Login seguro por perfil para operacao do sistema.</p>
      <div className="mt-6 space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-200" placeholder="Email" />
        <input value={senha} type="password" onChange={(e) => setSenha(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-200" placeholder="Senha" />
        {erro ? <p className="text-xs text-rose-400">{erro}</p> : null}
        <button
          className="w-full rounded-lg bg-cyan-400/90 p-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          onClick={async () => {
            const result = await login(email, senha);
            if (!result.ok) setErro(result.message);
          }}
        >
          Entrar
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

  const dataset = useMemo(() => filterData(state, filters), [state, filters]);
  const kpis = useMemo(() => computeKpis(state, filters), [state, filters]);
  const monthly = useMemo(() => monthlySeries(state, filters), [state, filters]);
  const ranking = useMemo(() => supplierRanking(state, filters), [state, filters]);
  const statuses = useMemo(() => statusSeries(state, filters), [state, filters]);
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
  const ocByPhase = useMemo(() => {
    const order: OcPhase[] = ["EM_ANALISE", "APROVADA", "LANCADA", "REPROVADA"];
    const map = new Map<OcPhase, number>();
    dataset.ocFiltered.forEach((oc) => {
      const phase = ocToPhase(oc.status as OCStatus);
      map.set(phase, (map.get(phase) ?? 0) + 1);
    });
    return order.map((phase) => ({ status: OC_PHASE_LABEL[phase], total: map.get(phase) ?? 0 }));
  }, [dataset.ocFiltered]);
  const unifiedStatusCards = useMemo(() => {
    const counts = {
      aprovada: 0,
      emAnalise: 0,
      reprovada: 0,
      lancada: 0,
      atrasada: 0,
    };

    dataset.scFiltered.forEach((sc) => {
      if (sc.status === "APROVADA") {
        counts.aprovada += 1;
        return;
      }
      if (sc.status === "EM_ANALISE") {
        counts.emAnalise += 1;
        return;
      }
      if (sc.status === "REPROVADA") {
        counts.reprovada += 1;
        return;
      }
      counts.lancada += 1;
    });

    dataset.ocFiltered.forEach((oc) => {
      if (oc.status === "ATRASADA") {
        counts.atrasada += 1;
        return;
      }
      const phase = ocToPhase(oc.status as OCStatus);
      if (phase === "REPROVADA") {
        counts.reprovada += 1;
      } else if (phase === "LANCADA") {
        counts.lancada += 1;
      } else if (phase === "EM_ANALISE") {
        counts.emAnalise += 1;
      } else {
        counts.aprovada += 1;
      }
    });

    return counts;
  }, [dataset.scFiltered, dataset.ocFiltered]);
  const unifiedStatusPie = useMemo(
    () => [
      { status: "Aprovada", total: unifiedStatusCards.aprovada },
      { status: "Em Analise", total: unifiedStatusCards.emAnalise },
      { status: "Reprovada", total: unifiedStatusCards.reprovada },
      { status: "Lancada", total: unifiedStatusCards.lancada },
    ],
    [unifiedStatusCards],
  );
  const unifiedStatusEvolution = useMemo(() => {
    const map = new Map<string, { mes: string; aprovada: number; emAnalise: number; reprovada: number; lancada: number }>();

    dataset.scFiltered.forEach((sc) => {
      const key = sc.dataCriacao.slice(0, 7);
      if (!map.has(key)) map.set(key, { mes: key, aprovada: 0, emAnalise: 0, reprovada: 0, lancada: 0 });
      const bucket = map.get(key)!;

      if (sc.status === "REPROVADA") {
        bucket.reprovada += 1;
      } else if (sc.status === "LANCADA") {
        bucket.lancada += 1;
      } else if (sc.status === "EM_ANALISE") {
        bucket.emAnalise += 1;
      } else {
        bucket.aprovada += 1;
      }
    });

    dataset.ocFiltered.forEach((oc) => {
      const key = oc.dataOC.slice(0, 7);
      if (!map.has(key)) map.set(key, { mes: key, aprovada: 0, emAnalise: 0, reprovada: 0, lancada: 0 });
      const bucket = map.get(key)!;

      if (oc.status === "ATRASADA") {
        return;
      }

      const phase = ocToPhase(oc.status as OCStatus);
      if (phase === "REPROVADA") {
        bucket.reprovada += 1;
      } else if (phase === "LANCADA") {
        bucket.lancada += 1;
      } else if (phase === "EM_ANALISE") {
        bucket.emAnalise += 1;
      } else {
        bucket.aprovada += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [dataset.scFiltered, dataset.ocFiltered]);
  const latestRows = useMemo(() => unifiedRows.slice(0, 8), [unifiedRows]);
  const openOcCount = useMemo(() => dataset.ocFiltered.filter((oc) => !["ENTREGUE", "CANCELADA"].includes(oc.status)).length, [dataset.ocFiltered]);
  const alerts = useMemo(() => buildAlerts(state, filters), [state, filters]);
  const delayedOcs = useMemo(() => dataset.ocFiltered.filter((oc) => oc.status === "ATRASADA"), [dataset.ocFiltered]);
  const aiContext = useMemo<AiAnswerContext>(() => ({
    delayedCount: delayedOcs.length,
    topSupplier: ranking[0]?.fornecedor ?? "Sem fornecedor dominante",
    topSector: scOcBySector[0]?.setor ?? "Sem setor dominante",
    phaseSummary: ocByPhase.map((item) => `${item.status}: ${item.total}`).join(" | "),
    totalOcValue: formatCurrency(kpis.valorTotalOC),
    openOcCount,
  }), [delayedOcs.length, ranking, scOcBySector, ocByPhase, kpis.valorTotalOC, openOcCount]);
  const anosDisponiveis = useMemo(() => {
    const years = new Set<string>();
    state.scs.forEach((sc) => years.add(sc.dataCriacao.slice(0, 4)));
    state.ocs.forEach((oc) => years.add(oc.dataOC.slice(0, 4)));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [state.scs, state.ocs]);

  const selectedScRecord = useMemo(() => dataset.scFiltered.find((x) => x.id === selectedSC) ?? dataset.scFiltered[0], [dataset.scFiltered, selectedSC]);
  const timeline = useMemo(() => (selectedScRecord ? buildScTimeline(selectedScRecord, state.ocs) : []), [selectedScRecord, state.ocs]);

  if (!currentUser) {
    return <LoginCard />;
  }

  const canWrite = canEdit;

  const exportExcel = () => {
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataset.ocFiltered), "ENTREGAS");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([kpis]), "KPIS");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthly), "DADOS");

    XLSX.writeFile(wb, `procurement-control-center-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportExcel = async (file: File) => {
    const report: string[] = [];
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });

      const requiredSheets = ["SC", "OC", "FORNECEDORES", "SETORES"];
      requiredSheets.forEach((sheetName) => {
        if (!wb.SheetNames.includes(sheetName)) report.push(`Aba obrigatoria ausente: ${sheetName}`);
      });

      if (report.length > 0) {
        setImportReport(report);
        return;
      }

      const scRows = XLSX.utils.sheet_to_json<PurchaseRequest>(wb.Sheets.SC);
      const ocRows = XLSX.utils.sheet_to_json<PurchaseOrder>(wb.Sheets.OC);
      const fornecedoresRows = XLSX.utils.sheet_to_json<AppState["fornecedores"][number]>(wb.Sheets.FORNECEDORES);
      const setoresRows = XLSX.utils.sheet_to_json<AppState["setores"][number]>(wb.Sheets.SETORES);

      if (!scRows.every((r) => r.id && r.numeroSC && r.status)) report.push("SC: colunas id/numeroSC/status obrigatorias.");
      if (!ocRows.every((r) => r.id && r.numeroOC && r.status)) report.push("OC: colunas id/numeroOC/status obrigatorias.");

      const hasDuplicateSc = new Set(scRows.map((r) => r.numeroSC)).size !== scRows.length;
      const hasDuplicateOc = new Set(ocRows.map((r) => r.numeroOC)).size !== ocRows.length;
      if (hasDuplicateSc) report.push("Duplicidade detectada em numeroSC.");
      if (hasDuplicateOc) report.push("Duplicidade detectada em numeroOC.");

      if (report.length) {
        setImportReport(report);
        return;
      }

      const nextState: AppState = {
        setores: setoresRows,
        fornecedores: fornecedoresRows,
        scs: scRows,
        ocs: ocRows,
        auditoria: state.auditoria,
      };

      importAllData(nextState);
      setImportReport(["Importacao concluida com sucesso."]);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(53,243,255,.12),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(159,122,255,.10),transparent_30%),#04060b] text-slate-200">
      <div className="flex">
        <aside className={`${collapsedSidebar ? "w-[84px]" : "w-[290px]"} sticky top-0 h-screen border-r border-cyan-400/20 bg-slate-950/90 px-3 py-4 transition-all`}>
          <div className="mb-6 flex items-center justify-between rounded-lg border border-cyan-400/30 bg-slate-900/60 px-3 py-2">
            {!collapsedSidebar ? (
              <div>
                <p className="font-orbitron text-sm tracking-widest text-cyan-300">GRUPO AVG EMESA</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Control Center</p>
              </div>
            ) : null}
            <button onClick={() => setCollapsedSidebar(!collapsedSidebar)} className="rounded-md border border-slate-700 p-1 hover:border-cyan-400/70">
              {collapsedSidebar ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = module === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setModule(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-200"
                      : "border-transparent bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <Icon size={16} />
                  {!collapsedSidebar ? <span className="text-sm">{item.label}</span> : null}
                </button>
              );
            })}
          </nav>

          {!collapsedSidebar ? (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
              <p className="text-cyan-300">Usuario: {currentUser.nome}</p>
              <p>Perfil: {currentUser.role}</p>
              <div className="mt-3 space-y-2">
                <button onClick={exportExcel} className="w-full rounded-md border border-cyan-500/35 bg-cyan-500/10 py-1.5 text-cyan-100">
                  <Download size={12} className="mr-1 inline" /> Exportar Snapshot
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-cyan-500/25 bg-slate-950/70 p-2 text-[11px] leading-relaxed text-slate-400">
                <p className="text-cyan-200">Desenvolvido por Michel Almeida</p>
                <p>Empresa: Mina do Brumado</p>
                <p>Grupo AVG</p>
              </div>
              <button onClick={logout} className="mt-3 w-full rounded-md border border-rose-500/40 bg-rose-500/10 py-2 text-rose-200">Sair</button>
            </div>
          ) : null}
        </aside>

        <main className="flex-1 p-6">
          <header className="mb-4 rounded-2xl border border-cyan-400/25 bg-slate-950/75 p-5 shadow-[0_0_40px_rgba(53,243,255,0.09)] backdrop-blur-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Sistema Online</p>
                <span className="text-xs text-slate-500">v2.0.1</span>
              </div>
              <p className="border-y border-cyan-500/25 px-3 py-1 text-[11px] uppercase tracking-[0.34em] text-cyan-300/90">Controle • Supervisao • Resultados</p>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 md:flex">
                  <Search size={13} />
                  <span>Buscar SC, OC, Fornecedor...</span>
                </div>
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
                <h1 className="font-orbitron text-3xl text-white">SC / OC Enterprise Command</h1>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded-full border px-3 py-1 ${canWrite ? "border-emerald-400/45 bg-emerald-500/10 text-emerald-200" : "border-amber-400/45 bg-amber-500/10 text-amber-200"}`}>
                  {canWrite ? "Modo Edicao" : "Modo Visualizacao"}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-7">
              <FilterSelect
                label="Ano"
                value={filters.ano}
                onChange={(value) => setFilters({ ...filters, ano: value })}
                options={[{ label: "Todos", value: "" }, ...anosDisponiveis.map((ano) => ({ label: ano, value: ano }))]}
              />
              <FilterSelect
                label="Mes"
                value={filters.mes}
                onChange={(value) => setFilters({ ...filters, mes: value })}
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
                value={filters.setorId}
                onChange={(value) => setFilters({ ...filters, setorId: value })}
                options={[{ label: "Todos", value: "" }, ...state.setores.map((s) => ({ label: s.nome, value: s.id }))]}
              />
              <FilterSelect
                label="Fornecedor"
                value={filters.fornecedorId}
                onChange={(value) => setFilters({ ...filters, fornecedorId: value })}
                options={[{ label: "Todos", value: "" }, ...state.fornecedores.map((f) => ({ label: f.nomeFantasia, value: f.id }))]}
              />
              <FilterInput label="Responsavel" value={filters.responsavel} onChange={(value) => setFilters({ ...filters, responsavel: value })} placeholder="buscar" />
              <FilterInput label="SC" value={filters.sc} onChange={(value) => setFilters({ ...filters, sc: value })} placeholder="SC-" />
              <button className="rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm hover:border-cyan-300" onClick={() => setFilters(EMPTY_FILTERS)}>
                Limpar Filtros
              </button>
            </div>
          </header>

          {module === "DASHBOARD" ? (
            <section>
              <ModuleTitle title="Dashboard Executivo" subtitle="Visao tatica em tempo real" />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="VALOR TOTAL SC + OC" value={formatCompactCurrency(kpis.valorTotalSC + kpis.valorTotalOC)} note="Carteira financeira consolidada" color={GREEN} icon={BarChart3} />
                <KpiCard label="APROVADAS" value={String(unifiedStatusCards.aprovada)} note="SC/OC aprovadas" color={GREEN} icon={Shield} />
                <KpiCard label="EM ANALISE" value={String(unifiedStatusCards.emAnalise)} note="SC/OC aguardando decisao" color={AMBER} icon={Activity} />
                <KpiCard label="REPROVADAS" value={String(unifiedStatusCards.reprovada)} note="SC/OC canceladas ou recusadas" color={RED} icon={AlertTriangle} />
                <KpiCard label="LANCADAS" value={String(unifiedStatusCards.lancada)} note="SC/OC lancadas" color={BLUE} icon={ClipboardList} />
                <KpiCard label="ATRASADAS" value={String(unifiedStatusCards.atrasada)} note="OCs com atraso" color={RED} icon={Truck} />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Panel title="Status SC + OC">
                  <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr]">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={unifiedStatusPie} dataKey="total" nameKey="status" outerRadius={92} innerRadius={48}>
                          {unifiedStatusPie.map((entry) => (
                            <Cell key={entry.status} fill={phaseColor(entry.status)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 text-sm">
                      {unifiedStatusPie.map((entry) => (
                        <div key={`legend-status-${entry.status}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: phaseColor(entry.status) }} />
                            <span>{entry.status}</span>
                          </div>
                          <span className="font-semibold text-cyan-200">{entry.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel title="SC + OC por Setor">
                  <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr]">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={scOcBySector} dataKey="total" nameKey="setor" outerRadius={92} innerRadius={44}>
                          {scOcBySector.map((entry, index) => (
                            <Cell key={entry.setor} fill={[GREEN, AMBER, RED, BLUE][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 text-sm">
                      {scOcBySector.map((entry, index) => (
                        <div key={`legend-setor-${entry.setor}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: [GREEN, AMBER, RED, BLUE][index % 4] }} />
                            <span className="truncate">{entry.setor}</span>
                          </div>
                          <span className="font-semibold text-cyan-200">{entry.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Panel title="Assistente IA Operacional">
                  <OperationalAssistant context={aiContext} />
                </Panel>

                <Panel title="Evolucao de Status SC + OC">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={unifiedStatusEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="mes" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="aprovada" stroke={GREEN} strokeWidth={2} />
                      <Line type="monotone" dataKey="emAnalise" stroke={AMBER} strokeWidth={2} />
                      <Line type="monotone" dataKey="reprovada" stroke={RED} strokeWidth={2} />
                      <Line type="monotone" dataKey="lancada" stroke={BLUE} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Panel>
              </div>

              <div className="mt-4">
                <Panel title="Ultimas Movimentacoes SC / OC">
                  <div className="overflow-auto">
                    <table className="w-full table-fixed text-sm">
                      <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="w-[70px]">Tipo</th>
                          <th className="w-[150px]">SC</th>
                          <th className="w-[150px]">OC</th>
                          <th>Setor</th>
                          <th className="w-[140px]">Status</th>
                          <th>Fornecedor</th>
                          <th className="w-[140px] text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestRows.map((row) => (
                          <tr key={`${row.entity}-${row.id}`} className="border-t border-slate-800/90 transition hover:bg-slate-900/60">
                            <td className="py-2 font-semibold text-cyan-200">{row.entity}</td>
                            <td className="truncate pr-2">{row.numeroSC}</td>
                            <td className="truncate pr-2">{row.numeroOC}</td>
                            <td className="truncate pr-2">{row.setor}</td>
                            <td>
                              <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${businessStatusBadge(row.statusKey)}`}>{row.statusLabel}</span>
                            </td>
                            <td className="truncate pr-2">{row.fornecedor}</td>
                            <td className="text-right">{formatCurrency(row.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
            <UnifiedScOcModule
              scs={dataset.scFiltered}
              ocs={dataset.ocFiltered as PurchaseOrder[]}
              setores={state.setores}
              fornecedores={state.fornecedores}
              canWrite={canWrite}
              onCreateSC={createSC}
              onUpdateSC={updateSC}
              onDeleteSC={deleteSC}
              onCreateOC={createOC}
              onUpdateOC={updateOC}
              onDeleteOC={deleteOC}
              onPickTimeline={(id) => {
                setSelectedSC(id);
                setModule("ACOMPANHAMENTO");
              }}
            />
          ) : null}

          {module === "FORNECEDORES" ? (
            <SupplierModule fornecedores={dataset.fornecedoresAtivos} ranking={ranking} canWrite={canWrite} onCreate={createSupplier} onUpdate={updateSupplier} onDelete={deleteSupplier} />
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
                <MetricCell label="Tempo medio aprovacao" value={`${kpis.tempoMedioAprovacaoDias} dias`} />
                <MetricCell label="Tempo medio SC -> OC" value={`${kpis.tempoMedioSCparaOCDias} dias`} />
                <MetricCell label="Lead time medio" value={`${kpis.leadTimeMedioDias} dias`} />
                <MetricCell label="Taxa no prazo" value={`${kpis.taxaEntregaNoPrazo}%`} />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Panel title="Ranking de Fornecedores">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-400">
                      <tr>
                        <th>Fornecedor</th>
                        <th>OC</th>
                        <th>Valor</th>
                        <th>Atrasos</th>
                        <th>Prazo %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((r) => (
                        <tr key={r.fornecedorId} className="border-t border-slate-800">
                          <td className="py-2">{r.fornecedor}</td>
                          <td>{r.totalOC}</td>
                          <td>{formatCurrency(r.valorTotal)}</td>
                          <td className={r.atrasos > 0 ? "text-rose-300" : "text-emerald-300"}>{r.atrasos}</td>
                          <td>{r.taxaPrazo}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
                <Panel title="Status OC">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={statuses.ocByStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="status" stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={70} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="total" fill={CYAN} />
                    </BarChart>
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
                  <p className="mb-3 text-sm text-slate-300">Gera arquivo com abas: DASHBOARD, SC, OC, FORNECEDORES, ENTREGAS, KPIS e DADOS.</p>
                  <button onClick={exportExcel} className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-emerald-200">
                    Exportar para Excel
                  </button>
                </Panel>
                <Panel title="Importar Planilha">
                  <p className="mb-3 text-sm text-slate-300">Validacao de abas, colunas obrigatorias e duplicidades antes da carga.</p>
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
          <footer className="mt-6 rounded-lg border border-cyan-500/20 bg-slate-950/70 px-4 py-2 text-center text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
            Dados hoje • Decisoes melhores • Resultados amanha
          </footer>
        </main>
      </div>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-cyan-500/20 bg-slate-950/80 p-4 shadow-[0_0_22px_rgba(0,210,255,0.08)] ${className}`}>
      <p className="mb-3 border-b border-slate-800 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{title}</p>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  color: string;
  note?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="h-[102px] rounded-xl border bg-slate-950/80 p-2.5 xl:p-2" style={{ borderColor: `${color}66`, boxShadow: `0 0 18px ${color}16` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="mt-1 text-[30px] font-bold leading-none xl:text-[26px]" style={{ color }}>
        {value}
      </p>
      {note ? <p className="mt-1 line-clamp-1 text-[9px] text-slate-500 xl:text-[8px]">{note}</p> : null}
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

function FilterInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="rounded-lg border border-slate-700 bg-slate-900/90 px-2 py-2 text-xs transition focus-within:border-cyan-500/60 focus-within:shadow-[0_0_10px_rgba(0,210,255,0.15)]">
      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600" />
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
  onPickTimeline,
}: {
  scs: PurchaseRequest[];
  ocs: PurchaseOrder[];
  setores: AppState["setores"];
  fornecedores: AppState["fornecedores"];
  canWrite: boolean;
  onCreateSC: (payload: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  onUpdateSC: (id: string, payload: Partial<PurchaseRequest>) => Promise<void>;
  onDeleteSC: (id: string) => Promise<void>;
  onCreateOC: (payload: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  onUpdateOC: (id: string, payload: Partial<PurchaseOrder>) => Promise<void>;
  onDeleteOC: (id: string) => Promise<void>;
  onPickTimeline: (id: string) => void;
}) {
  const [message, setMessage] = useState("");
  const rows = useMemo(() => buildUnifiedRows(scs, ocs, setores, fornecedores), [scs, ocs, setores, fornecedores]);
  const [newSC, setNewSC] = useState<{
    numeroSC: string;
    solicitante: string;
    setorId: string;
    descricao: string;
    categoria: string;
    prioridade: PurchaseRequest["prioridade"];
    valorEstimado: number;
    fornecedorSugeridoId: string | null;
    justificativa: string;
    responsavel: string;
    observacoes: string;
  }>({
    numeroSC: "",
    solicitante: "",
    setorId: setores[0]?.id ?? "",
    descricao: "",
    categoria: "",
    prioridade: "MEDIA" as PurchaseRequest["prioridade"],
    valorEstimado: 0,
    fornecedorSugeridoId: fornecedores[0]?.id ?? null,
    justificativa: "",
    responsavel: "",
    observacoes: "",
  });
  const [newOc, setNewOc] = useState({
    numeroOC: "",
    linkedNumeroSC: scs[0]?.numeroSC ?? "",
    fornecedorNome: fornecedores[0]?.nomeFantasia ?? "",
    dataPrevistaEntrega: new Date().toISOString().slice(0, 10),
    valorOC: 0,
    setorId: setores[0]?.id ?? "",
    responsavel: "",
    condicaoPagamento: "30 dias",
    observacoes: "",
  });

  return (
    <section className="space-y-4">
      <ModuleTitle title="Central SC / OC" subtitle="Criacao e controle em uma unica operacao" />

      {canWrite ? (
        <Panel title="Criacao Integrada SC / OC">
          <div className="grid gap-2 md:grid-cols-4">
            <input className="field" placeholder="Numero SC" value={newSC.numeroSC} onChange={(e) => setNewSC({ ...newSC, numeroSC: e.target.value })} />
            <input className="field" placeholder="Numero OC" value={newOc.numeroOC} onChange={(e) => setNewOc({ ...newOc, numeroOC: e.target.value })} />
            <select className="field" value={newSC.setorId} onChange={(e) => {
              setNewSC({ ...newSC, setorId: e.target.value });
              setNewOc({ ...newOc, setorId: e.target.value });
            }}>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>{setor.nome}</option>
              ))}
            </select>
            <input
              className="field"
              list="fornecedores-oc-central"
              placeholder="Fornecedor (nome)"
              value={newOc.fornecedorNome}
              onChange={(e) => {
                const nome = e.target.value;
                setNewOc({ ...newOc, fornecedorNome: nome });
                const termo = nome.trim().toLowerCase();
                const matched =
                  fornecedores.find((fornecedor) => fornecedor.nomeFantasia.toLowerCase() === termo) ??
                  fornecedores.find((fornecedor) => fornecedor.nomeFantasia.toLowerCase().includes(termo));
                setNewSC((prev) => ({ ...prev, fornecedorSugeridoId: matched?.id ?? null }));
              }}
            />
            <datalist id="fornecedores-oc-central">
              {fornecedores.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.nomeFantasia} />
              ))}
            </datalist>
            <input className="field" placeholder="Solicitante" value={newSC.solicitante} onChange={(e) => setNewSC({ ...newSC, solicitante: e.target.value })} />
            <input className="field" placeholder="Responsavel" value={newOc.responsavel} onChange={(e) => {
              setNewOc({ ...newOc, responsavel: e.target.value });
              setNewSC({ ...newSC, responsavel: e.target.value });
            }} />
            <input className="field md:col-span-2" placeholder="Descricao da SC" value={newSC.descricao} onChange={(e) => setNewSC({ ...newSC, descricao: e.target.value })} />
            <input className="field" placeholder="Categoria" value={newSC.categoria} onChange={(e) => setNewSC({ ...newSC, categoria: e.target.value })} />
            <input className="field" type="date" value={newOc.dataPrevistaEntrega} onChange={(e) => setNewOc({ ...newOc, dataPrevistaEntrega: e.target.value })} />
            <input className="field" type="number" placeholder="Valor SC" value={newSC.valorEstimado} onChange={(e) => setNewSC({ ...newSC, valorEstimado: Number(e.target.value) })} />
            <input className="field" type="number" placeholder="Valor OC" value={newOc.valorOC} onChange={(e) => setNewOc({ ...newOc, valorOC: Number(e.target.value) })} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100"
              onClick={async () => {
                if (!newSC.numeroSC || !newSC.solicitante || !newSC.descricao) {
                  setMessage("Preencha Numero SC, Solicitante e Descricao da SC.");
                  return;
                }

                const fornecedorInformado = newOc.fornecedorNome.trim().toLowerCase();
                const matchedSupplier =
                  fornecedores.find((fornecedor) => fornecedor.nomeFantasia.toLowerCase() === fornecedorInformado) ??
                  fornecedores.find((fornecedor) => fornecedor.nomeFantasia.toLowerCase().includes(fornecedorInformado));
                const fornecedorSugeridoId = matchedSupplier?.id ?? newSC.fornecedorSugeridoId;

                try {
                  await onCreateSC({
                    numeroSC: newSC.numeroSC,
                    dataCriacao: new Date().toISOString().slice(0, 10),
                    solicitante: newSC.solicitante,
                    setorId: newSC.setorId,
                    descricao: newSC.descricao,
                    categoria: newSC.categoria,
                    prioridade: newSC.prioridade,
                    valorEstimado: newSC.valorEstimado,
                    fornecedorSugeridoId,
                    justificativa: newSC.justificativa,
                    status: "EM_ANALISE",
                    responsavel: newSC.responsavel,
                    dataAprovacao: null,
                    dataReprovacao: null,
                    motivoReprovacao: null,
                    dataLancamento: null,
                    numeroOCRelacionada: newOc.numeroOC || null,
                    observacoes: newSC.observacoes,
                    anexos: [],
                  });
                  setNewSC({ ...newSC, numeroSC: "", solicitante: "", descricao: "", valorEstimado: 0, justificativa: "", observacoes: "" });
                  setMessage("SC criada com sucesso.");
                } catch (error) {
                  setMessage((error as Error).message || "Falha ao criar SC.");
                }
              }}
            >
              Salvar SC
            </button>
            <button
              className="rounded-lg border border-blue-400/45 bg-blue-500/10 px-4 py-2 text-sm text-blue-100"
              onClick={async () => {
                const fornecedorInformado = newOc.fornecedorNome.trim();
                const matchedSupplier =
                  fornecedores.find((fornecedor) => fornecedor.nomeFantasia.toLowerCase() === fornecedorInformado.toLowerCase()) ??
                  fornecedores.find((fornecedor) => fornecedor.nomeFantasia.toLowerCase().includes(fornecedorInformado.toLowerCase()));
                const linkedSc = scs.find((sc) => sc.numeroSC.trim().toLowerCase() === newSC.numeroSC.trim().toLowerCase()) ?? scs.find((sc) => sc.numeroSC === newOc.linkedNumeroSC);
                if (!newOc.numeroOC || !linkedSc || !matchedSupplier || !newOc.setorId) {
                  setMessage("Para criar a OC informe Numero OC, Numero SC ja existente, Setor e Fornecedor por nome valido.");
                  return;
                }

                const today = new Date().toISOString().slice(0, 10);

                try {
                  await onCreateOC({
                    numeroOC: newOc.numeroOC,
                    scId: linkedSc.id,
                    fornecedorId: matchedSupplier.id,
                    dataOC: today,
                    dataEmissao: today,
                    dataPrevistaEntrega: newOc.dataPrevistaEntrega,
                    dataRealEntrega: null,
                    valorOC: newOc.valorOC,
                    setorId: newOc.setorId,
                    responsavel: newOc.responsavel,
                    status: "CRIADA",
                    condicaoPagamento: newOc.condicaoPagamento,
                    observacoes: newOc.observacoes,
                    anexos: [],
                  });
                  setNewOc({ ...newOc, numeroOC: "", valorOC: 0, observacoes: "" });
                  setMessage("OC criada com sucesso.");
                } catch (error) {
                  setMessage((error as Error).message || "Falha ao criar OC.");
                }
              }}
            >
              Salvar OC
            </button>
          </div>

          {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
        </Panel>
      ) : null}

      <Panel title="Lista de Acompanhamento SC / OC">
        <div className="overflow-auto">
          <table className="min-w-[1080px] w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="py-2">SC</th>
                <th>OC</th>
                <th>Setor</th>
                <th>Status</th>
                <th>Fornecedor</th>
                <th>Valor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const scRecord = row.entity === "SC" ? scs.find((item) => item.id === row.id) : scs.find((item) => item.numeroSC === row.numeroSC);
                const ocRecord = row.entity === "OC" ? ocs.find((item) => item.id === row.id) : ocs.find((item) => item.numeroOC === row.numeroOC);

                return (
                  <tr key={`${row.entity}-${row.id}`} className="border-t border-slate-800 transition hover:bg-slate-900/60">
                    <td className="py-2 pr-2 font-medium text-cyan-100">{row.numeroSC}</td>
                    <td className="pr-2 text-slate-200">{row.numeroOC}</td>
                    <td className="pr-2">{row.setor}</td>
                    <td>
                      <span className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium ${businessStatusBadge(row.statusKey)}`}>{row.statusLabel}</span>
                    </td>
                    <td className="pr-2">{row.fornecedor}</td>
                    <td className="pr-2 font-medium text-right text-emerald-300">{formatCurrency(row.valor)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {scRecord ? (
                          <button className="rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => onPickTimeline(scRecord.id)}>
                            Timeline
                          </button>
                        ) : null}
                        {canWrite && row.entity === "SC" && scRecord ? (
                          <select
                            className="field max-w-[140px] text-xs"
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
                        {canWrite && row.entity === "OC" && ocRecord ? (
                          <select
                            className="field max-w-[140px] text-xs"
                            value={ocToPhase(ocRecord.status as OCStatus)}
                            onChange={async (e) => {
                              const phase = e.target.value as OcPhase;
                              await onUpdateOC(ocRecord.id, { status: phaseToOcStatus(phase, ocRecord.status as OCStatus) });
                            }}
                          >
                            <option value="EM_ANALISE">Em Analise</option>
                            <option value="APROVADA">Aprovada</option>
                            <option value="REPROVADA">Reprovada</option>
                            <option value="LANCADA">Lancada</option>
                          </select>
                        ) : null}
                        {canWrite ? (
                          <button
                            className="rounded border border-rose-700 px-2 py-1 text-xs"
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

function OperationalAssistant({ context }: { context: AiAnswerContext }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(answerOperationalQuestion("", context));

  const ask = (value: string) => {
    setQuestion(value);
    setAnswer(answerOperationalQuestion(value, context));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          "Quais OCs estao atrasadas?",
          "Qual setor tem mais OCs?",
          "Quem e o fornecedor lider?",
          "Como esta a distribuicao dos status?",
        ].map((item) => (
          <button key={item} className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100" onClick={() => ask(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="field" placeholder="Pergunte algo obvio sobre a operacao" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100" onClick={() => ask(question)}>
          Analisar
        </button>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">{answer}</div>
    </div>
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
                status: "CRIADA",
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
                  <td>{fornecedores.find((f) => f.id === oc.fornecedorId)?.nomeFantasia ?? oc.fornecedorId}</td>
                  <td className={oc.status === "ATRASADA" ? "text-rose-300" : ""}>{OC_STATUS_LABEL[oc.status as OCStatus]}</td>
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
                            const nextStatus = phaseToOcStatus(phase, oc.status as OCStatus);
                            const payload: Partial<PurchaseOrder> = { status: nextStatus };
                            if (nextStatus === "ENTREGUE") payload.dataRealEntrega = new Date().toISOString().slice(0, 10);
                            await onUpdate(oc.id, payload);
                          }}
                        >
                          <option value="EM_ANALISE">Em Analise</option>
                          <option value="APROVADA">Aprovada</option>
                          <option value="REPROVADA">Reprovada</option>
                          <option value="LANCADA">Lancada</option>
                        </select>
                        <button className="rounded border border-emerald-700 px-2 py-1 text-xs" onClick={async () => await onUpdate(oc.id, { status: "ENTREGUE", dataRealEntrega: new Date().toISOString().slice(0, 10) })}>
                          Entregar
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
  onCreate: (payload: Omit<AppState["fornecedores"][number], "id" | "createdAt" | "updatedAt" | "deletedAt">) => void;
  onUpdate: (id: string, payload: Partial<AppState["fornecedores"][number]>) => void;
  onDelete: (id: string) => void;
}) {
  const [nome, setNome] = useState("");

  return (
    <section>
      <ModuleTitle title="Cadastro de Fornecedores" subtitle="Base estrategica" />
      {canWrite ? (
        <Panel title="Novo Fornecedor">
          <div className="flex gap-2">
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="field" placeholder="Nome fantasia" />
            <button
              className="rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"
              onClick={() => {
                if (!nome) return;
                onCreate({
                  codigo: `F${Math.round(Math.random() * 9999)}`,
                  razaoSocial: nome,
                  nomeFantasia: nome,
                  cnpj: "00.000.000/0001-00",
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
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((forn) => (
                <tr key={forn.id} className="border-t border-slate-800">
                  <td className="py-2">{forn.codigo}</td>
                  <td>{forn.nomeFantasia}</td>
                  <td>{forn.status}</td>
                  <td>
                    {canWrite ? (
                      <div className="flex gap-2">
                        <button className="rounded border border-amber-600 px-2 py-1 text-xs" onClick={() => onUpdate(forn.id, { status: forn.status === "ATIVO" ? "INATIVO" : "ATIVO" })}>
                          Alternar
                        </button>
                        <button className="rounded border border-rose-700 px-2 py-1 text-xs" onClick={() => onDelete(forn.id)}>
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
  onCreate: (payload: Omit<AppState["setores"][number], "id" | "createdAt" | "updatedAt" | "deletedAt">) => void;
  onUpdate: (id: string, payload: Partial<AppState["setores"][number]>) => void;
  onDelete: (id: string) => void;
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
              onClick={() => {
                if (!nome) return;
                onCreate({ nome, descricao: "", ativo: true });
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
                      <button className="rounded border border-amber-600 px-2 py-1 text-xs" onClick={() => onUpdate(setor.id, { ativo: !setor.ativo })}>
                        Alternar
                      </button>
                      <button className="rounded border border-rose-700 px-2 py-1 text-xs" onClick={() => onDelete(setor.id)}>
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
  onMove: (entity: "SC" | "OC", id: string, targetStatus: string) => void;
  canWrite: boolean;
}) {
  const columns = [
    { key: "EM_ANALISE", label: "EM ANALISE", kind: "SC" as const },
    { key: "APROVADA", label: "APROVADA", kind: "SC" as const },
    { key: "LANCADA", label: "LANCADA", kind: "SC" as const },
    { key: "CRIADA", label: "OC EMITIDA", kind: "OC" as const },
    { key: "CONFIRMADA", label: "CONFIRMADA", kind: "OC" as const },
    { key: "EM_TRANSPORTE", label: "EM TRANSPORTE", kind: "OC" as const },
    { key: "ENTREGUE", label: "ENTREGUE", kind: "OC" as const },
    { key: "ATRASADA", label: "ATRASADA", kind: "OC" as const },
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
            onDrop={(e) => {
              if (!canWrite) return;
              const payload = e.dataTransfer.getData("text/plain");
              const [entity, id] = payload.split(":");
              if (!entity || !id) return;
              onMove(entity as "SC" | "OC", id, col.key);
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
