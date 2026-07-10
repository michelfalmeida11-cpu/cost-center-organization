"use client";

import { useState, type ElementType } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  DollarSign,
  Droplet,
  FileText,
  HardDrive,
  LayoutDashboard,
  Presentation,
  Settings,
  Target,
  Truck,
  UserCircle,
  Zap,
} from "lucide-react";

const filterOptions = ["Todos", "Perfuração", "Desmonte", "Logística"];
const sidebarItems = [
  { label: "Dashboard Executivo", icon: LayoutDashboard, active: true },
  { label: "Custos Operacionais", icon: DollarSign },
  { label: "Equipamentos", icon: HardDrive },
  { label: "Diesel", icon: Droplet },
  { label: "Perfuração", icon: Target },
  { label: "Desmonte", icon: Zap },
  { label: "Logística", icon: Truck },
  { label: "Indicadores", icon: BarChart3 },
  { label: "Relatórios", icon: FileText },
  { label: "Apresentação Executiva", icon: Presentation },
  { label: "Configurações", icon: Settings },
];

const topKpis = [
  { label: "Custo Operacional Total", value: "R$ 8.764.520,45", trend: "+8,62%", trendColor: "oklch(0.65 0.20 145)", subtitle: "vs período anterior" },
  { label: "Custo por Tonelada", value: "R$ 12,58/t", trend: "-4,31%", trendColor: "oklch(0.65 0.22 25)", subtitle: "vs período anterior" },
  { label: "Custo por Metro Perfurado", value: "R$ 28,62/m", trend: "+6,12%", trendColor: "oklch(0.65 0.20 145)", subtitle: "vs período anterior" },
  { label: "Custo por Furo", value: "R$ 1.152,35/furo", trend: "-3,45%", trendColor: "oklch(0.65 0.20 145)", subtitle: "vs período anterior" },
  { label: "Consumo Diesel", value: "62.450 L", trend: "+5,21%", trendColor: "oklch(0.65 0.20 145)", subtitle: "vs período anterior" },
  { label: "Disponibilidade Física", value: "87,43%", trend: "+3,21%", trendColor: "oklch(0.65 0.20 145)", subtitle: "vs período anterior" },
];

const highlights = [
  { label: "Equipamentos", value: "R$ 3.156.280,50", meta: "36,02% do total", color: "oklch(0.65 0.20 145)" },
  { label: "Diesel", value: "R$ 1.872.450,00", meta: "21,37% do total", color: "oklch(0.75 0.20 185)" },
  { label: "Perfuração", value: "R$ 1.982.350,75", meta: "22,63% do total", color: "oklch(0.72 0.18 270)" },
  { label: "Desmonte", value: "R$ 1.134.250,20", meta: "12,94% do total", color: "oklch(0.74 0.20 45)" },
  { label: "Logística", value: "R$ 619.189,00", meta: "7,06% do total", color: "oklch(0.62 0.24 25)" },
];

const dieselMetrics = [
  { label: "Consumo Diesel S10", value: "42.650 L", trend: "+2,8%" },
  { label: "Consumo Diesel S500", value: "19.800 L", trend: "-1,2%" },
  { label: "Custo Diesel", value: "R$ 1.872.450", trend: "+5,2%" },
  { label: "Economia projetada", value: "R$ 125.900", trend: "+4,1%" },
];

const rankings = [
  { title: "Locação Escavadeira CAT 390", value: "R$ 856.250,00", color: "oklch(0.72 0.18 270)" },
  { title: "Diesel S10", value: "R$ 1.125.450,00", color: "oklch(0.75 0.20 185)" },
  { title: "Bits de Perfuração", value: "R$ 684.350,75", color: "oklch(0.65 0.20 145)" },
  { title: "ANFO", value: "R$ 456.270,20", color: "oklch(0.68 0.18 300)" },
  { title: "Transporte de Minério", value: "R$ 384.189,00", color: "oklch(0.62 0.24 25)" },
];

const operationMetrics = [
  { label: "Metros Perfurados", value: "22.350 m", trend: "+8,20%" },
  { label: "Quantidade de Furos", value: "172", trend: "+5,48%" },
  { label: "Toneladas Produzidas", value: "696.000 t", trend: "+6,21%" },
  { label: "Horas Trabalhadas", value: "8.325 h", trend: "+4,45%" },
  { label: "Horas Improdutivas", value: "1.058 h", trend: "-2,21%" },
  { label: "Disponibilidade Física", value: "87,43%", trend: "+3,21%" },
  { label: "MTBF", value: "245 h", trend: "+4,12%" },
  { label: "MTTR", value: "8,45 h", trend: "-6,23%" },
];

const alertItems = [
  { title: "CUSTO ACIMA DA META", description: "Equipamentos acima de 10% da meta mensal.", color: "oklch(0.65 0.22 25)" },
  { title: "DIESEL ACIMA DO PREVISTO", description: "Consumo 8% acima do previsto para o período.", color: "oklch(0.75 0.20 185)" },
  { title: "EQUIPAMENTO PARADO", description: "Perfuração ROC D65 parada há 6 horas.", color: "oklch(0.65 0.20 145)" },
];

const quickActions = ["Novo Registro", "Relatório PDF", "Exportar Excel", "Apresentação"];

function SidebarButton({ label, Icon, active }: { label: string; Icon: ElementType; active?: boolean }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm font-semibold transition ${active ? "bg-[rgba(56,107,231,0.18)] text-sky-200" : "text-slate-400 hover:bg-[#14284f] hover:text-white"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function DashboardPage() {
  const [equipamento, setEquipamento] = useState("Todos");
  const [centro, setCentro] = useState("Todos");
  const [setor, setSetor] = useState("Todos");

  const dateRange = "01/06/2025 até 30/06/2025";

  return (
    <div className="min-h-screen bg-[#071021] text-slate-100">
      <div className="grid min-h-screen grid-cols-[280px_1fr]">
        <aside className="flex flex-col bg-[#081226] border-r border-[#12203a] px-4 py-6">
          <div className="mb-8 rounded-[28px] border border-[#17315c] bg-[radial-gradient(circle_at_top_left,_rgba(103,169,255,0.18),transparent_55%)] p-5 shadow-[0_15px_45px_rgba(0,0,0,0.20)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-3xl border border-[#1f3565] bg-[#0f2144] text-sky-300 shadow-[0_0_20px_rgba(56,144,255,0.28)]">
                <span className="text-lg font-black">C</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Centro de Custo</p>
                <p className="font-semibold text-white">Operacionais</p>
              </div>
            </div>
            <div className="rounded-3xl border border-[#152c57] bg-[#091827] p-4">
              <p className="text-[10px] uppercase tracking-[0.33em] text-slate-500">Mina do Brumado</p>
              <p className="mt-3 text-sm font-semibold text-white">Dashboard Executivo</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarButton key={item.label} label={item.label} Icon={item.icon} active={item.active} />
            ))}
          </nav>

          <div className="mt-auto rounded-[32px] border border-[#13203b] bg-[#081428] p-5 text-[11px] text-slate-400 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <p className="mb-2 uppercase tracking-[0.24em] text-slate-500">Período Selecionado</p>
            <p className="font-semibold text-white">{dateRange}</p>
            <div className="mt-4 border-t border-[#12203a] pt-3 text-[10px] text-slate-500">
              Última atualização:<br />30/06/2025 18:45:32
            </div>
          </div>
        </aside>

        <main className="px-6 py-6">
          <header className="mb-6 rounded-[32px] border border-[#152553] bg-[#081528] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.15)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Dashboard Executivo</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Centro de Custos Operacionais</h1>
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-[#132a54] bg-[#09172c] p-3 shadow-[0_10px_50px_rgba(0,0,0,0.12)]">
                <Bell className="h-5 w-5 text-slate-300" />
                <div className="rounded-2xl bg-[#0e213f] px-3 py-2 text-sm text-slate-200">{dateRange}</div>
                <UserCircle className="h-8 w-8 rounded-full bg-[#12284d] p-1 text-slate-200" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 xl:grid-cols-[1fr_1fr_1fr]">
              {[
                { label: "Equipamento", value: equipamento, setter: setEquipamento },
                { label: "Centro de Custo", value: centro, setter: setCentro },
                { label: "Setor", value: setor, setter: setSetor },
              ].map((filter) => (
                <label key={filter.label} className="block">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{filter.label}</span>
                  <select
                    aria-label={filter.label}
                    value={filter.value}
                    onChange={(event) => filter.setter(event.target.value)}
                    className="mt-2 w-full rounded-3xl border border-[#1b3058] bg-[#091828] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400"
                  >
                    {filterOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[1.4fr_0.85fr]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topKpis.map((item) => (
                <div key={item.label} className="rounded-[32px] border border-[#1a2c52] bg-[#0b162c] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">{item.subtitle}</span>
                    <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ background: `${item.trendColor} / 0.12`, color: item.trendColor, borderColor: `${item.trendColor}33` }}>{item.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-[32px] border border-[#1a2c52] bg-[#0b162c] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.meta}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[36px] border border-[#1b2f56] bg-[#081225] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Consumo Diesel</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Economia de Diesel e Performance</h2>
                </div>
                <div className="rounded-3xl border border-[#152a52] bg-[#091227] px-4 py-3 text-sm text-slate-200">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Meta Atual</p>
                  <p className="mt-2 font-semibold text-white">-8,4% vs. previsão</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[28px] bg-[#09172f] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Diesel total</p>
                    <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-400">Atual</span>
                  </div>
                  <p className="mt-4 text-4xl font-semibold text-white">62.450 L</p>
                  <p className="mt-3 text-sm text-slate-400">Uso acumulado no período com eficiência de frota ajustada.</p>
                </div>
                <div className="rounded-[28px] bg-[#09172f] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Custo Diesel</p>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">R$ 1,87M</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="h-3 overflow-hidden rounded-full bg-[#0b1732]">
                      <div className="h-full w-3/4 rounded-full bg-[#69c2ff]" />
                    </div>
                    <div className="text-sm text-slate-300">
                      <p>Meta diária de consumo em 18% abaixo do histórico.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {dieselMetrics.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-[#15274f] bg-[#081427] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-200">{item.value}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">Variação {item.trend}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[36px] border border-[#1b2f56] bg-[#081225] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Indicadores de Operação</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Visão de Performance</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {operationMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-3xl border border-[#15274f] bg-[#081427] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{metric.label}</p>
                      <span className="text-sm font-semibold text-slate-200">{metric.trend}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-slate-100">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-[36px] border border-[#1b2f56] bg-[#081225] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Participação dos Custos</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Custo Total R$ 8.764.520,45</h2>
                </div>
                <div className="rounded-3xl border border-[#152a52] bg-[#091227] px-4 py-3 text-sm text-slate-200">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Período</p>
                  <p className="mt-2 font-semibold text-white">{dateRange}</p>
                </div>
              </div>

              <div className="mt-7 grid gap-6 xl:grid-cols-[280px_1fr] xl:items-center">
                <div className="relative mx-auto h-56 w-56 rounded-full bg-[#081228] p-5">
                  <div className="absolute inset-0 rounded-full bg-[conic-gradient(at_top,_#4f98ff_0deg,_#65b8ff_80deg,_#8c64ff_165deg,_#8fd775_250deg,_#4f98ff_360deg)]" />
                  <div className="absolute inset-14 rounded-full bg-[#081325]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-200">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Custo Total</span>
                    <span className="mt-3 text-sm font-semibold text-white">R$ 8,764M</span>
                  </div>
                </div>
                <div className="grid gap-3">
                  {highlights.slice(0, 5).map((item) => (
                    <div key={item.label} className="rounded-3xl border border-[#15274f] bg-[#081427] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{item.label}</span>
                        <span className="text-sm font-bold" style={{ color: item.color }}>{item.meta}</span>
                      </div>
                      <p className="mt-2 text-lg text-slate-200">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[36px] border border-[#1b2f56] bg-[#081225] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Top 5 Maiores Gastos</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Ranking de Gastos</h2>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {rankings.map((item, index) => (
                    <div key={item.title} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-200 truncate">{item.title}</span>
                        <span className="text-sm font-semibold text-white">{item.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#0b1732]">
                        <div className="h-full rounded-full" style={{ width: `${100 - index * 12}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[36px] border border-[#1b2f56] bg-[#081225] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Custo por Equipamento (R$)</p>
                <div className="mt-5 space-y-4">
                  {rankings.slice(0, 4).map((item, index) => (
                    <div key={item.title}>
                      <div className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>{item.title}</span>
                        <span className="font-semibold text-white">{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#0b1732]">
                        <div className="h-full rounded-full" style={{ width: `${94 - index * 15}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[36px] border border-[#1b2f56] bg-[#081225] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Alertas</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Principais riscos ativos</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {alertItems.map((alert) => (
                  <div key={alert.title} className="rounded-3xl border border-[rgba(255,255,255,0.08)] p-5" style={{ background: `${alert.color} / 0.12` }}>
                    <p className="text-sm font-semibold" style={{ color: alert.color }}>{alert.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{alert.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[36px] border border-[#1b2f56] bg-[#081225] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Ações Rápidas</p>
              <div className="mt-5 grid gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="rounded-3xl border border-[#12203a] bg-[#081329] px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-sky-500"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
