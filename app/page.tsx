"use client";

import { useState, type ElementType } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  BellSimple,
  CalendarBlank,
  CraneTower,
  CurrencyDollar,
  FilePdf,
  GasPump,
  Hammer,
  MagnifyingGlass,
  MicrosoftExcelLogo,
  PlusCircle,
  PresentationChart,
  ShieldCheck,
  Truck as PhosphorTruck,
  UserCircle,
} from "@phosphor-icons/react";
import {
  Activity,
  BarChart3,
  Bomb,
  Clock,
  Download,
  Drill,
  FileText,
  Gauge,
  LayoutDashboard,
  Settings,
  Target,
  Truck,
  Zap,
} from "lucide-react";

import DashboardCard from "../components/dashboard/DashboardCard";
import Sparkline from "../components/dashboard/Sparkline";
import MetricCard from "../components/dashboard/MetricCard";
import DetailCard from "../components/dashboard/DetailCard";
import CostSharePanel from "../components/dashboard/CostSharePanel";
import EvolutionPanel from "../components/dashboard/EvolutionPanel";
import TopExpensesPanel from "../components/dashboard/TopExpensesPanel";
import GaugePanel from "../components/dashboard/GaugePanel";
import IndicatorPanel from "../components/dashboard/IndicatorPanel";
import RankingPanel from "../components/dashboard/RankingPanel";
import AlertPanel from "../components/dashboard/AlertPanel";
import QuickActionsPanel from "../components/dashboard/QuickActionsPanel";
import ExecutiveDashboardGrid from "../components/layout/ExecutiveDashboardGrid";

const filterOptions = ["Todos", "Perfuração", "Desmonte", "Logística"];
const sidebarItems = [
  { label: "Dashboard Executivo", icon: LayoutDashboard, href: "/" },
  { label: "Administração", icon: LayoutDashboard, href: "/administracao" },
  { label: "Custos Operacionais", icon: CurrencyDollar, href: "/" },
  { label: "Equipamentos", icon: CraneTower, href: "/operacao" },
  { label: "Diesel", icon: GasPump, href: "/suprimentos" },
  { label: "Perfuração", icon: Hammer, href: "/operacao" },
  { label: "Desmonte", icon: Hammer, href: "/operacao" },
  { label: "Logística", icon: PhosphorTruck, href: "/operacao" },
  { label: "Indicadores", icon: BarChart3, href: "/operacao" },
  { label: "Relatórios", icon: FileText, href: "/" },
  { label: "Apresentação Executiva", icon: PresentationChart, href: "/suprimentos" },
  { label: "Configurações", icon: Settings, href: "/administracao" },
];

const topKpis = [
  {
    label: "Custo Operacional",
    value: "R$ 8.764.520,45",
    trend: "+8,62%",
    positive: true,
    icon: CurrencyDollar,
    gradient: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
    sparkline: [22, 29, 28, 32, 38, 45],
    color: "#3B82F6",
    baseline: 8764520.45,
    unit: "currency",
  },
  {
    label: "Custo por Tonelada",
    value: "R$ 12,58/t",
    trend: "-4,31%",
    positive: false,
    icon: BarChart3,
    gradient: "linear-gradient(135deg, #94A3B8 0%, #CBD5E1 100%)",
    sparkline: [14, 16, 15, 14, 13, 12],
    color: "#94A3B8",
    baseline: 12.58,
    unit: "per_t",
  },
  {
    label: "Custo por Metro",
    value: "R$ 28,62/m",
    trend: "+6,12%",
    positive: true,
    icon: Hammer,
    gradient: "linear-gradient(135deg, #22D3EE 0%, #0EA5E9 100%)",
    sparkline: [18, 20, 22, 24, 26, 28],
    color: "#22D3EE",
    baseline: 28.62,
    unit: "per_m",
  },
  {
    label: "Custo por Furo",
    value: "R$ 1.152,35/furo",
    trend: "-3,45%",
    positive: false,
    icon: Target,
    gradient: "linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)",
    sparkline: [11, 12, 12, 11, 10, 10],
    color: "#2DD4BF",
    baseline: 1152.35,
    unit: "currency",
  },
  {
    label: "Consumo Diesel",
    value: "62.450 L",
    trend: "+5,21%",
    positive: true,
    icon: GasPump,
    gradient: "linear-gradient(135deg, #FACC15 0%, #F59E0B 100%)",
    sparkline: [51, 52, 54, 58, 61, 62],
    color: "#FACC15",
    baseline: 62450,
    unit: "liters",
  },
  {
    label: "Disponibilidade Física",
    value: "87,43%",
    trend: "+3,21%",
    positive: true,
    icon: ShieldCheck,
    gradient: "linear-gradient(135deg, #A855F7 0%, #8B5CF6 100%)",
    sparkline: [80, 82, 84, 85, 86, 87],
    color: "#A855F7",
    baseline: 87.43,
    unit: "percent",
  },
];

const detailCards = [
  {
    label: "Equipamentos",
    value: "R$ 3.156.280,50",
    percent: "36,02%",
    icon: CraneTower,
    color: "#3B82F6",
    series: [24, 28, 31, 29, 34, 36],
  },
  {
    label: "Diesel",
    value: "R$ 1.872.450,00",
    percent: "21,37%",
    icon: GasPump,
    color: "#FACC15",
    series: [18, 20, 22, 20, 23, 25],
  },
  {
    label: "Perfuração",
    value: "R$ 1.982.350,75",
    percent: "22,63%",
    icon: Hammer,
    color: "#22D3EE",
    series: [21, 20, 23, 24, 29, 27],
  },
  {
    label: "Desmonte",
    value: "R$ 1.134.250,20",
    percent: "12,94%",
    icon: Bomb,
    color: "#A855F7",
    series: [12, 14, 13, 15, 16, 14],
  },
  {
    label: "Logística",
    value: "R$ 619.189,00",
    percent: "7,06%",
    icon: PhosphorTruck,
    color: "#4ADE80",
    series: [9, 11, 10, 12, 13, 14],
  },
];

const costShareData = [
  { name: "Equipamentos", value: 36.02, color: "#3B82F6" },
  { name: "Diesel", value: 21.37, color: "#FACC15" },
  { name: "Perfuração", value: 22.63, color: "#22D3EE" },
  { name: "Desmonte", value: 12.94, color: "#A855F7" },
  { name: "Logística", value: 7.06, color: "#4ADE80" },
];

const monthlyEvolutionData = [
  { month: "Jan", Equipamentos: 6.1, Diesel: 5.4, Perfuração: 4.8, Desmonte: 3.6, Logística: 2.8 },
  { month: "Fev", Equipamentos: 6.8, Diesel: 5.9, Perfuração: 5.2, Desmonte: 3.9, Logística: 3.1 },
  { month: "Mar", Equipamentos: 7.2, Diesel: 6.2, Perfuração: 5.6, Desmonte: 4.1, Logística: 3.4 },
  { month: "Abr", Equipamentos: 7.9, Diesel: 6.6, Perfuração: 6.0, Desmonte: 4.3, Logística: 3.6 },
  { month: "Mai", Equipamentos: 8.4, Diesel: 7.0, Perfuração: 6.4, Desmonte: 4.7, Logística: 3.9 },
  { month: "Jun", Equipamentos: 8.8, Diesel: 7.5, Perfuração: 6.8, Desmonte: 5.0, Logística: 4.1 },
];

const topExpenses = [
  { label: "Locação Escavadeira CAT 390", value: "R$ 856.250,00", color: "#3B82F6", progress: 100 },
  { label: "Diesel S10", value: "R$ 1.125.450,00", color: "#FACC15", progress: 92 },
  { label: "Bits de Perfuração", value: "R$ 684.350,75", color: "#22D3EE", progress: 76 },
  { label: "ANFO", value: "R$ 456.270,20", color: "#A855F7", progress: 58 },
  { label: "Transporte de Minério", value: "R$ 384.189,00", color: "#4ADE80", progress: 45 },
];

const gaugeStats = [
  { label: "Consumido", value: "62.450 L", icon: GasPump, color: "#FACC15" },
  { label: "Meta", value: "100.000 L", icon: Gauge, color: "#3B82F6" },
  { label: "Estoque", value: "37.550 L", icon: PhosphorTruck, color: "#4ADE80" },
  { label: "Custo Médio", value: "R$ 6,02/L", icon: CurrencyDollar, color: "#94A3B8" },
];

const indicatorCards = [
  { label: "Metros Perfurados", value: "22.350 m", trend: "+7,82%", icon: Hammer, color: "#3B82F6" },
  { label: "Quantidade de Furos", value: "172", trend: "+5,48%", icon: Target, color: "#94A3B8" },
  { label: "Toneladas Produzidas", value: "696.000 t", trend: "+6,21%", icon: PhosphorTruck, color: "#22D3EE" },
  { label: "Horas Trabalhadas", value: "8.325 h", trend: "+4,45%", icon: Clock, color: "#A855F7" },
  { label: "Horas Improdutivas", value: "1.058 h", trend: "-2,21%", icon: BellSimple, color: "#F97316" },
  { label: "Disponibilidade Física", value: "87,43%", trend: "+3,21%", icon: ShieldCheck, color: "#A855F7" },
  { label: "MTBF", value: "245 h", trend: "+4,12%", icon: Gauge, color: "#4ADE80" },
  { label: "MTTR", value: "8,45 h", trend: "-6,23%", icon: Bomb, color: "#F87171" },
  { label: "Produtividade", value: "83,6 t/h", trend: "+5,32%", icon: Activity, color: "#38BDF8" },
];

const rankingItems = [
  { label: "Perfuratriz ROC D65", value: "R$ 1.245.350,00", color: "#3B82F6", progress: 98 },
  { label: "Escavadeira CAT 390", value: "R$ 1.125.450,00", color: "#FACC15", progress: 92 },
  { label: "Caminhão Volvo FMX 540", value: "R$ 856.250,00", color: "#22D3EE", progress: 76 },
  { label: "Carregadeira CAT 980", value: "R$ 654.320,00", color: "#A855F7", progress: 63 },
  { label: "Compressor Atlas Copco XATS", value: "R$ 456.270,00", color: "#4ADE80", progress: 52 },
];

const alertItems = [
  { label: "CUSTO ACIMA DA META", description: "Equipamentos acima de 10% da meta mensal.", icon: Bomb, color: "#F87171", bg: "#5F1721" },
  { label: "DIESEL ACIMA DO PREVISTO", description: "Consumo 8% acima do previsto para o período.", icon: GasPump, color: "#FACC15", bg: "#4D3C07" },
  { label: "EQUIPAMENTO PARADO", description: "Perfuração ROC D65 parada há 6 horas.", icon: BellSimple, color: "#FB923C", bg: "#4B1F0C" },
  { label: "DENTRO DA META", description: "Todos os indicadores dentro dos parâmetros.", icon: ShieldCheck, color: "#4ADE80", bg: "#0F2E18" },
];

const quickActions = [
  { label: "Novo Registro", icon: PlusCircle },
  { label: "Relatório PDF", icon: FilePdf },
  { label: "Exportar Excel", icon: MicrosoftExcelLogo },
  { label: "Apresentação", icon: PresentationChart },
];

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

// Dashboard primitives extracted to components/dashboard/

// Panels extracted to components/dashboard; they are imported above and receive data via props.

function SidebarButton({ label, Icon, active, href, onClick }: { label: string; Icon: ElementType; active?: boolean; href?: string; onClick?: () => void }) {
  const baseClass = `group relative flex h-12 w-full items-center gap-3 rounded-[12px] border border-transparent px-4 text-left text-[14px] font-medium transition duration-200 ${active ? 'border-[#2F80ED]/25 bg-[linear-gradient(90deg,rgba(47,128,237,0.28),rgba(37,213,242,0.08))] text-white shadow-[0_0_24px_rgba(47,128,237,0.22)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`;
  const iconClass = active ? 'text-[#7CCBFF]' : 'text-slate-400 group-hover:text-white';

  const content = (
    <>
      <span className={`flex h-5 w-5 flex-none items-center justify-center ${active ? 'text-[#7CCBFF]' : ''}`}>
        <Icon size={20} weight="regular" className={iconClass} strokeWidth={1.9} />
      </span>
      <span className="truncate">{label}</span>
      {active ? <span className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-[#2F80ED]" /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClass} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {content}
    </button>
  );
}

export default function DashboardPage() {
  const [equipamento, setEquipamento] = useState("Todos");
  const [centro, setCentro] = useState("Todos");
  const [setor, setSetor] = useState("Todos");
  const [activeTab, setActiveTab] = useState("Dashboard Executivo");
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [activeExpense, setActiveExpense] = useState<string | null>(null);
  const [visibleCostShare, setVisibleCostShare] = useState<Set<string>>(new Set(costShareData.map((d) => d.name)));
  const dateRange = "01/06/2025 até 30/06/2025";
  const pageTitle = "Dashboard Executivo";

  function handleKpiSelect(label: string) {
    setActiveMetric((prev) => (prev === label ? null : label));
  }

  function handleExpenseSelect(label: string) {
    setActiveExpense((prev) => (prev === label ? null : label));
  }

  function handleToggleCostShare(name: string) {
    setVisibleCostShare((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function formatCurrencyBR(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(value);
  }

  function formatPercent(value: number) {
    return `${(value * 100).toFixed(2).replace('.', ',')}%`;
  }

  const seriesMap: Record<string, string | null> = {
    'Custo Operacional': null,
    'Custo por Tonelada': 'Equipamentos',
    'Custo por Metro': 'Perfuração',
    'Custo por Furo': 'Perfuração',
    'Consumo Diesel': 'Diesel',
    'Disponibilidade Física': null,
  };

  // If an active metric is selected, compute the percent change from the
  // last two months for the metric's mapped series (if any) and apply that
  // change to all KPI baselines so the dashboard shows a global filtered view.
  const derivedTopKpis = (() => {
    if (!activeMetric) return topKpis;
    const seriesKey = seriesMap[activeMetric];
    if (!seriesKey) {
      // No mapped series: fallback to recomputing only the selected KPI
      return topKpis.map((kpi) => {
        if (kpi.label !== activeMetric) return kpi;
        const len = monthlyEvolutionData.length;
        if (len < 2) return kpi;
        const last = (monthlyEvolutionData[len - 1] as any)[kpi.label] ?? null;
        const prev = (monthlyEvolutionData[len - 2] as any)[kpi.label] ?? null;
        if (last == null || prev == null || prev === 0) return kpi;
        const change = (last - prev) / prev;
        const newNumeric = (kpi.baseline ?? 0) * (1 + change);
        const newKpi = { ...kpi } as any;
        if (kpi.unit === 'currency') newKpi.value = formatCurrencyBR(newNumeric);
        else if (kpi.unit === 'per_t' || kpi.unit === 'per_m') newKpi.value = `R$ ${(newNumeric).toFixed(2)}`;
        else if (kpi.unit === 'liters') newKpi.value = `${Math.round(newNumeric).toLocaleString('pt-BR')} L`;
        else if (kpi.unit === 'percent') newKpi.value = `${newNumeric.toFixed(2).replace('.', ',')}%`;
        newKpi.trend = change >= 0 ? `+${(change * 100).toFixed(2).replace('.', ',')}%` : `${(change * 100).toFixed(2).replace('.', ',')}%`;
        newKpi.positive = change >= 0;
        return newKpi;
      });
    }

    const len = monthlyEvolutionData.length;
    if (len < 2) return topKpis;
    const last = (monthlyEvolutionData[len - 1] as any)[seriesKey] ?? null;
    const prev = (monthlyEvolutionData[len - 2] as any)[seriesKey] ?? null;
    if (last == null || prev == null || prev === 0) return topKpis;
    const change = (last - prev) / prev;

    return topKpis.map((kpi) => {
      if (kpi.baseline == null) return kpi;
      const newNumeric = (kpi.baseline ?? 0) * (1 + change);
      const newKpi = { ...kpi } as any;
      if (kpi.unit === 'currency') newKpi.value = formatCurrencyBR(newNumeric);
      else if (kpi.unit === 'per_t' || kpi.unit === 'per_m') newKpi.value = `R$ ${(newNumeric).toFixed(2)}`;
      else if (kpi.unit === 'liters') newKpi.value = `${Math.round(newNumeric).toLocaleString('pt-BR')} L`;
      else if (kpi.unit === 'percent') newKpi.value = `${newNumeric.toFixed(2).replace('.', ',')}%`;
      newKpi.trend = change >= 0 ? `+${(change * 100).toFixed(2).replace('.', ',')}%` : `${(change * 100).toFixed(2).replace('.', ',')}%`;
      newKpi.positive = change >= 0;
      return newKpi;
    });
  })();

  return (
    <ExecutiveDashboardGrid
      aside={(
        <>
          <div className="rounded-[18px] border border-white/5 bg-[#08111F] p-4">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2F80ED]/20 bg-[#10233F] text-sky-300">
                <span className="text-lg font-semibold">C</span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Centro de</p>
                <p className="text-[24px] font-bold leading-none text-white">CUSTOS OPERACIONAIS</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Mineração</p>
              </div>
            </div>
            <div className="rounded-[12px] border border-white/5 bg-[#0B1627] p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Mina do Brumado</p>
              <p className="mt-2 text-sm font-medium text-white">Dashboard Executivo</p>
            </div>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <SidebarButton
                key={item.label}
                label={item.label}
                Icon={item.icon}
                active={activeTab === item.label}
                onClick={() => setActiveTab(item.label)}
              />
            ))}
          </nav>

          <div className="mt-auto rounded-[12px] border border-white/5 bg-[#0B1627] p-4 text-[11px] text-slate-400">
            <p className="mb-2 uppercase tracking-[0.24em] text-slate-500">Período Selecionado</p>
            <p className="font-semibold text-white">{dateRange}</p>
            <div className="mt-4 border-t border-white/5 pt-3 text-[10px] text-slate-500">
              Última atualização:<br />30/06/2025 18:45:32
            </div>
          </div>
        </>
      )}
    >
      <div className="grid gap-6 2xl:gap-8">
        <section className="rounded-[18px] border border-white/5 bg-[#08111F] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="flex min-h-[72px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-[0.333em] text-slate-500">Dashboard Executivo</p>
              <h1 className="mt-1 text-5xl font-bold leading-none text-white">{pageTitle}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[220px_140px_140px_140px_auto] xl:items-center">
              <div className="flex h-11 items-center gap-3 rounded-[12px] border border-white/5 bg-[#0F1B2D] px-4">
                <CalendarBlank size={18} weight="regular" className="text-slate-300" />
                <span className="text-sm text-slate-200">{dateRange}</span>
              </div>
              {[
                { label: "Equipamento", value: equipamento, setter: setEquipamento },
                { label: "Centro de Custo", value: centro, setter: setCentro },
                { label: "Setor", value: setor, setter: setSetor },
              ].map((filter) => (
                <label key={filter.label} className="block">
                  <div className="relative flex h-11 items-center rounded-[12px] border border-white/5 bg-[#0F1B2D] px-4">
                    <select aria-label={filter.label} value={filter.value} onChange={(event) => filter.setter(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
                      {filterOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <MagnifyingGlass size={16} weight="regular" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </label>
              ))}
              <div className="flex h-11 items-center justify-end gap-4 rounded-[12px] px-1">
                <BellSimple size={18} weight="regular" className="text-slate-400" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1B2D] text-[12px] font-medium text-slate-200">
                  MA
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-12">
          {derivedTopKpis.map((item) => (
            <div key={item.label} className="col-span-12 sm:col-span-6 xl:col-span-2">
              <MetricCard item={item} onSelect={handleKpiSelect} active={activeMetric === item.label} />
            </div>
          ))}
        </section>

        <section className="grid auto-rows-fr grid-cols-1 gap-5 xl:grid-cols-5">
          {detailCards.map((item) => (
            <div key={item.label} className="col-span-1">
              <DetailCard item={item} />
            </div>
          ))}
        </section>

        <section className="grid auto-rows-fr grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="col-span-12 xl:col-span-5 2xl:col-span-4">
            <CostSharePanel data={costShareData} total={"R$ 8.764.520,45"} visible={visibleCostShare} onToggle={handleToggleCostShare} />
          </div>
          <div className="col-span-12 xl:col-span-5 2xl:col-span-5">
            <EvolutionPanel data={monthlyEvolutionData} />
          </div>
          <div className="col-span-12 xl:col-span-2 2xl:col-span-3">
            <TopExpensesPanel data={topExpenses} onSelect={handleExpenseSelect} active={activeExpense} />
          </div>
        </section>

        <section className="grid auto-rows-fr grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="col-span-12 xl:col-span-4 2xl:col-span-3">
            <GaugePanel stats={gaugeStats} value={62450} />
          </div>
          <div className="col-span-12 xl:col-span-4 2xl:col-span-5">
            <IndicatorPanel data={indicatorCards} />
          </div>
          <div className="col-span-12 xl:col-span-4 2xl:col-span-4">
            <RankingPanel data={rankingItems} />
          </div>
        </section>

        <section className="grid auto-rows-fr grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="col-span-12 xl:col-span-8 2xl:col-span-7">
            <AlertPanel data={alertItems} />
          </div>
          <div className="col-span-12 xl:col-span-4 2xl:col-span-5">
            <DashboardCard className="h-[191px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">Ações Rápidas</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Ações Rápidas</h2>
                </div>
              </div>
              <div className="mt-6">
                <QuickActionsPanel data={quickActions} />
              </div>
            </DashboardCard>
          </div>
        </section>
      </div>
    </ExecutiveDashboardGrid>
  );
}