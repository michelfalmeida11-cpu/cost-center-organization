"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import { Building2, Fuel, Hammer, LayoutDashboard, Settings, Truck, Drill, Bomb, FileText, Gauge, Wrench } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { useRealtimeRefresh } from "@/components/erp/useRealtimeRefresh";
import {
  getCostBySource,
  getDashboardKpis,
  getMonthlyEvolution,
  listCompanies,
  listCostCenters,
  listEquipments,
  listSectors,
} from "@/lib/erp/service";
import type { ChartPoint, DashboardFilters, DashboardKpis, EvolutionPoint } from "@/lib/erp/types";

const menu = [
  { label: "Dashboard Executivo", href: "/", icon: LayoutDashboard },
  { label: "Administracao", href: "/administracao", icon: Building2 },
  { label: "Custos Operacionais", href: "/custos-operacionais", icon: Gauge },
  { label: "Equipamentos", href: "/equipamentos", icon: Wrench },
  { label: "Diesel", href: "/diesel", icon: Fuel },
  { label: "Perfuracao", href: "/perfuracao", icon: Drill },
  { label: "Desmonte", href: "/desmonte", icon: Bomb },
  { label: "Logistica", href: "/logistica", icon: Truck },
  { label: "Indicadores", href: "/indicadores", icon: Hammer },
  { label: "Relatorios", href: "/relatorios", icon: FileText },
  { label: "Configuracoes", href: "/configuracoes", icon: Settings },
];

const kpiBase: DashboardKpis = {
  custo_operacional_total: 0,
  custo_por_tonelada: 0,
  custo_por_metro_perfurado: 0,
  custo_por_furo: 0,
  consumo_diesel: 0,
  disponibilidade_fisica: 0,
};

function currency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

function number(v: number, max = 2) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: max }).format(v || 0);
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [kpis, setKpis] = useState<DashboardKpis>(kpiBase);
  const [sourceData, setSourceData] = useState<ChartPoint[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionPoint[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [costCenters, setCostCenters] = useState<Array<{ id: string; name: string; sector: string | null }>>([]);
  const [equipments, setEquipments] = useState<Array<{ id: string; name: string }>>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kpisResult, sourcesResult, evolutionResult] = await Promise.all([
        getDashboardKpis(filters),
        getCostBySource(filters),
        getMonthlyEvolution(filters),
      ]);

      setKpis(kpisResult);
      setSourceData(sourcesResult);
      setEvolutionData(evolutionResult);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useRealtimeRefresh(refreshAll);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    async function loadFilterData() {
      try {
        const [companiesData, costCentersData, equipmentsData, sectorsData] = await Promise.all([
          listCompanies(),
          listCostCenters(filters.companyId),
          listEquipments(filters.companyId),
          listSectors(filters.companyId),
        ]);

        setCompanies(companiesData);
        setCostCenters(costCentersData);
        setEquipments(equipmentsData);
        setSectors(sectorsData);
      } catch (error) {
        console.error(error);
      }
    }

    loadFilterData();
  }, [filters.companyId]);

  const pieColors = useMemo(
    () => ["#38bdf8", "#22d3ee", "#14b8a6", "#4ade80", "#facc15", "#fb7185"],
    []
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(21,94,117,0.24),_transparent_55%),linear-gradient(180deg,#020617,#0f172a)]">
      <DashboardHeader />
      <main className="mx-auto grid max-w-screen-2xl gap-6 px-4 py-6 lg:grid-cols-[260px,1fr]">
        <aside className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
          <nav className="space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-cyan-300"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <select className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" value={filters.companyId ?? ""} onChange={(e) => setFilters((prev) => ({ ...prev, companyId: e.target.value || undefined }))}>
                <option value="">Empresa</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
              <input className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="date" value={filters.startDate ?? ""} onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value || undefined }))} />
              <input className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="date" value={filters.endDate ?? ""} onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value || undefined }))} />
              <select className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" value={filters.costCenterId ?? ""} onChange={(e) => setFilters((prev) => ({ ...prev, costCenterId: e.target.value || undefined }))}>
                <option value="">Centro de Custo</option>
                {costCenters.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </select>
              <select className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" value={filters.equipmentId ?? ""} onChange={(e) => setFilters((prev) => ({ ...prev, equipmentId: e.target.value || undefined }))}>
                <option value="">Equipamento</option>
                {equipments.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </select>
              <select className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" value={filters.sector ?? ""} onChange={(e) => setFilters((prev) => ({ ...prev, sector: e.target.value || undefined }))}>
                <option value="">Setor</option>
                {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard title="Custo Operacional Total" value={currency(kpis.custo_operacional_total)} />
            <KpiCard title="Custo por Tonelada" value={`${currency(kpis.custo_por_tonelada)}/t`} />
            <KpiCard title="Custo por Metro Perfurado" value={`${currency(kpis.custo_por_metro_perfurado)}/m`} />
            <KpiCard title="Custo por Furo" value={`${currency(kpis.custo_por_furo)}/furo`} />
            <KpiCard title="Consumo Diesel" value={`${number(kpis.consumo_diesel, 3)} L`} />
            <KpiCard title="Disponibilidade Fisica" value={`${number(kpis.disponibilidade_fisica)}%`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">Composicao de Custos por Fonte</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="label" outerRadius={110} label>
                      {sourceData.map((entry, index) => (
                        <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => currency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">Evolucao Mensal por Modulo</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip formatter={(v: number) => currency(v)} />
                    <Legend />
                    <Line dataKey="custo" stroke="#38bdf8" name="Custos" />
                    <Line dataKey="diesel" stroke="#facc15" name="Diesel" />
                    <Line dataKey="perfuracao" stroke="#22d3ee" name="Perfuracao" />
                    <Line dataKey="desmonte" stroke="#fb7185" name="Desmonte" />
                    <Line dataKey="logistica" stroke="#4ade80" name="Logistica" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">Comparativo por Fonte</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip formatter={(v: number) => currency(v)} />
                  <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {loading ? <p className="mt-2 text-xs text-slate-400">Atualizando em tempo real...</p> : null}
          </article>
        </section>
      </main>
    </div>
  );
}
