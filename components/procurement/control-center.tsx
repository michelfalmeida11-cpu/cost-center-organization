"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  Filter,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield,
  Truck,
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
  sectorSeries,
  statusSeries,
  supplierRanking,
} from "@/lib/procurement/data";
import { AppState, OCStatus, PurchaseOrder, PurchaseRequest, SCStatus } from "@/lib/procurement/types";

const NAV: Array<{ id: AppModule; label: string; icon: React.ElementType }> = [
  { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
  { id: "SC", label: "SC - Solicitacoes", icon: ClipboardList },
  { id: "OC", label: "OC - Ordens", icon: Truck },
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
  const bySector = useMemo(() => sectorSeries(state, filters), [state, filters]);
  const ranking = useMemo(() => supplierRanking(state, filters), [state, filters]);
  const statuses = useMemo(() => statusSeries(state, filters), [state, filters]);
  const alerts = useMemo(() => buildAlerts(state, filters), [state, filters]);

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
                <p className="font-orbitron text-sm tracking-widest text-cyan-300">PCC CORE</p>
                <p className="text-[10px] text-slate-500">Cyberpunk Enterprise</p>
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
              <button onClick={logout} className="mt-3 w-full rounded-md border border-rose-500/40 bg-rose-500/10 py-2 text-rose-200">Sair</button>
            </div>
          ) : null}
        </aside>

        <main className="flex-1 p-6">
          <header className="mb-4 rounded-2xl border border-cyan-400/25 bg-slate-950/75 p-5 shadow-[0_0_40px_rgba(53,243,255,0.09)] backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">PROCUREMENT CONTROL CENTER</p>
                <h1 className="font-orbitron text-3xl text-white">SC / OC Enterprise Command</h1>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded-full border px-3 py-1 ${canWrite ? "border-emerald-400/45 bg-emerald-500/10 text-emerald-200" : "border-amber-400/45 bg-amber-500/10 text-amber-200"}`}>
                  {canWrite ? "Modo Edicao" : "Modo Visualizacao"}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
              <FilterInput label="Ano" value={filters.ano} onChange={(value) => setFilters({ ...filters, ano: value })} placeholder="2026" />
              <FilterInput label="Mes" value={filters.mes} onChange={(value) => setFilters({ ...filters, mes: value })} placeholder="07" />
              <FilterInput label="Setor" value={filters.setorId} onChange={(value) => setFilters({ ...filters, setorId: value })} placeholder="id setor" />
              <FilterInput label="Fornecedor" value={filters.fornecedorId} onChange={(value) => setFilters({ ...filters, fornecedorId: value })} placeholder="id fornecedor" />
              <button className="rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm hover:border-cyan-300" onClick={() => setFilters(EMPTY_FILTERS)}>
                Limpar Filtros
              </button>
            </div>
          </header>

          {module === "DASHBOARD" ? (
            <section>
              <ModuleTitle title="Dashboard Executivo" subtitle="Visao em tempo real" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="SC TOTAL" value={String(kpis.totalSC)} color={CYAN} icon={ClipboardList} />
                <KpiCard label="OC TOTAL" value={String(kpis.totalOC)} color={BLUE} icon={Truck} />
                <KpiCard label="VALOR TOTAL" value={formatCurrency(kpis.valorTotalOC)} color={GREEN} icon={BarChart3} />
                <KpiCard label="ENTREGAS ATRASADAS" value={String(kpis.entregasAtrasadas)} color={RED} icon={AlertTriangle} />
                <KpiCard label="EM ANALISE" value={String(kpis.emAnalise)} color={AMBER} icon={Activity} />
                <KpiCard label="APROVADAS" value={String(kpis.aprovadas)} color={GREEN} icon={Shield} />
                <KpiCard label="REPROVADAS" value={String(kpis.reprovadas)} color={RED} icon={AlertTriangle} />
                <KpiCard label="LANCADAS" value={String(kpis.lancadas)} color={PURPLE} icon={ClipboardList} />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Panel title="SC x OC por Mes">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="mes" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="totalSC" stroke={CYAN} strokeWidth={2} />
                      <Line type="monotone" dataKey="totalOC" stroke={PURPLE} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Panel>
                <Panel title="Valor por Setor">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={bySector}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="setor" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="valorOC" fill={BLUE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
                <Panel title="Status SC">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={statuses.scByStatus} dataKey="total" nameKey="status" outerRadius={90}>
                        {statuses.scByStatus.map((entry, index) => (
                          <Cell key={entry.status} fill={[CYAN, GREEN, RED, PURPLE][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Panel>
                <Panel title="Alertas Criticos">
                  <div className="space-y-2">
                    {alerts.slice(0, 8).map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-lg border p-2 text-sm ${
                          alert.nivel === "CRITICO"
                            ? "border-rose-500/40 bg-rose-500/10"
                            : alert.nivel === "ATENCAO"
                              ? "border-amber-500/40 bg-amber-500/10"
                              : "border-cyan-500/40 bg-cyan-500/10"
                        }`}
                      >
                        <p className="font-semibold">{alert.tipo}</p>
                        <p className="text-slate-300">{alert.mensagem}</p>
                      </div>
                    ))}
                    {alerts.length === 0 ? <p className="text-sm text-emerald-200">Sem alertas no momento.</p> : null}
                  </div>
                </Panel>
              </div>
            </section>
          ) : null}

          {module === "SC" ? (
            <ScModule
              scs={dataset.scFiltered}
              setores={state.setores}
              fornecedores={state.fornecedores}
              canWrite={canWrite}
              onCreate={createSC}
              onUpdate={updateSC}
              onDelete={deleteSC}
              onPickTimeline={(id) => {
                setSelectedSC(id);
                setModule("ACOMPANHAMENTO");
              }}
            />
          ) : null}

          {module === "OC" ? (
            <OcModule
              ocs={dataset.ocFiltered as PurchaseOrder[]}
              scs={state.scs}
              fornecedores={state.fornecedores}
              setores={state.setores}
              canWrite={canWrite}
              onCreate={createOC}
              onUpdate={updateOC}
              onDelete={deleteOC}
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
        </main>
      </div>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950/75 p-4 ${className}`}>
      <p className="mb-3 text-sm font-semibold text-cyan-200">{title}</p>
      {children}
    </div>
  );
}

function KpiCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border bg-slate-950/70 p-4" style={{ borderColor: `${color}66`, boxShadow: `0 0 30px ${color}22` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="mt-2 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
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
    <label className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs">
      <span className="text-slate-400">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full bg-transparent text-sm text-slate-200 outline-none" />
    </label>
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
  onCreate: (payload: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "deletedAt">) => void;
  onUpdate: (id: string, payload: Partial<PurchaseRequest>) => void;
  onDelete: (id: string) => void;
  onPickTimeline: (id: string) => void;
}) {
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
            onClick={() => {
              if (!newSC.numeroSC || !newSC.solicitante) return;
              onCreate({
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
            }}
          >
            Criar SC
          </button>
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
                          <button className="rounded border border-emerald-700 px-2 py-1 text-xs" onClick={() => onUpdate(sc.id, { status: "APROVADA", dataAprovacao: new Date().toISOString().slice(0, 10) })}>
                            Aprovar
                          </button>
                          <button className="rounded border border-rose-700 px-2 py-1 text-xs" onClick={() => onDelete(sc.id)}>
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
  onCreate: (payload: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">) => void;
  onUpdate: (id: string, payload: Partial<PurchaseOrder>) => void;
  onDelete: (id: string) => void;
}) {
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
            <input className="field" placeholder="SC ID" value={newOc.scId} onChange={(e) => setNewOc({ ...newOc, scId: e.target.value })} />
            <input className="field" placeholder="Fornecedor ID" value={newOc.fornecedorId} onChange={(e) => setNewOc({ ...newOc, fornecedorId: e.target.value })} />
            <input className="field" type="number" placeholder="Valor" value={newOc.valorOC} onChange={(e) => setNewOc({ ...newOc, valorOC: Number(e.target.value) })} />
            <input className="field" type="date" value={newOc.dataPrevistaEntrega} onChange={(e) => setNewOc({ ...newOc, dataPrevistaEntrega: e.target.value })} />
            <input className="field" placeholder="Setor ID" value={newOc.setorId} onChange={(e) => setNewOc({ ...newOc, setorId: e.target.value })} />
            <input className="field" placeholder="Responsavel" value={newOc.responsavel} onChange={(e) => setNewOc({ ...newOc, responsavel: e.target.value })} />
            <input className="field" placeholder="Condicao" value={newOc.condicaoPagamento} onChange={(e) => setNewOc({ ...newOc, condicaoPagamento: e.target.value })} />
          </div>
          <button
            className="mt-3 rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"
            onClick={() => {
              if (!newOc.numeroOC || !newOc.scId || !newOc.fornecedorId) return;
              const today = new Date().toISOString().slice(0, 10);
              onCreate({
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
            }}
          >
            Criar OC
          </button>
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
                        <button className="rounded border border-emerald-700 px-2 py-1 text-xs" onClick={() => onUpdate(oc.id, { status: "ENTREGUE", dataRealEntrega: new Date().toISOString().slice(0, 10) })}>
                          Entregar
                        </button>
                        <button className="rounded border border-rose-700 px-2 py-1 text-xs" onClick={() => onDelete(oc.id)}>
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
