"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { KpiSummary } from "@/components/kpi-summary";
import { BudgetChart } from "@/components/budget-chart";
import { DistributionChart } from "@/components/distribution-chart";
import { CostCenterPanel } from "@/components/cost-center-panel";
import { PROCESSES } from "@/lib/cost-centers"; // used in hero banner stats
import { Activity, Cpu, Database, Shield, Calendar, ChevronDown } from "lucide-react";
import { ModeEditionButton } from "@/components/auth/ModeEditionButton";
import { AuthModal } from "@/components/auth/AuthModal";



// ── Period selector data ────────────────────────────────────
const YEARS = [2024, 2025, 2026];
const MONTHS = [
  { n: 1, label: "Jan" }, { n: 2, label: "Fev" }, { n: 3, label: "Mar" },
  { n: 4, label: "Abr" }, { n: 5, label: "Mai" }, { n: 6, label: "Jun" },
  { n: 7, label: "Jul" }, { n: 8, label: "Ago" }, { n: 9, label: "Set" },
  { n: 10, label: "Out" }, { n: 11, label: "Nov" }, { n: 12, label: "Dez" },
];

const ACCENT = "oklch(0.75 0.20 185)";
const BORDER = "var(--border)";
const SURFACE = "var(--card)";

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{
        background: `color-mix(in oklch, ${color} 8%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 25%, transparent)`,
      }}
    >
      <Icon className="h-3 w-3 shrink-0" style={{ color }} />
      <span className="text-[10px] font-mono" style={{ color: "oklch(0.45 0.03 220)" }}>{label}</span>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ── Period Filter Bar ────────────────────────────────────────
function PeriodFilter({
  year, setYear, month, setMonth,
}: {
  year: number; setYear: (y: number) => void;
  month: number | null; setMonth: (m: number | null) => void;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
    >
      <div className="flex flex-col gap-2">
        {/* Calendar icon + label */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="h-3.5 w-3.5" style={{ color: ACCENT }} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.20em]" style={{ color: ACCENT }}>
            Período
          </span>
        </div>

        {/* Toolbar row: ANO (segmented) + MÊS (compact dropdown) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Year segmented control */}
          <div className="inline-flex items-center rounded-xl p-1"
            style={{
              background: "color-mix(in oklch, var(--secondary) 70%, transparent)",
              border: `1px solid color-mix(in oklch, ${ACCENT} 22%, transparent)`,
            }}
          >
            <span className="hidden sm:inline-block mr-2 text-[9px] font-mono uppercase tracking-widest"
              style={{ color: "oklch(0.38 0.025 220)" }}
            >
              Ano
            </span>
            <div className="flex items-center gap-1">
              {YEARS.map((y) => {
                const selected = year === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className="min-w-[56px] h-9 rounded-lg px-3 text-[11px] font-mono font-bold transition-all duration-150"
                    style={{
                      color: selected ? "oklch(0.08 0.014 240)" : "oklch(0.55 0.03 220)",
                      background: selected ? ACCENT : "transparent",
                      border: `1px solid ${selected ? ACCENT : "color-mix(in oklch, var(--border) 90%, transparent)"}`,
                      boxShadow: selected ? `0 0 10px oklch(0.75 0.20 185 / 0.25)` : "none",
                      paddingTop: 0,
                      paddingBottom: 0,
                    }}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month dropdown */}
          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
            <span className="text-[9px] font-mono uppercase tracking-widest hidden sm:block" style={{ color: "oklch(0.38 0.025 220)" }}>
              Mês
            </span>

            <div className="relative">
              <select
                aria-label="Selecionar mês"
                value={month === null ? "YTD" : String(month)}
                onChange={(e) => {
                  const v = e.target.value;
                  setMonth(v === "YTD" ? null : Number(v));
                }}
                className="appearance-none rounded-xl px-3 h-9 text-[11px] font-mono font-bold transition-all duration-150"
                style={{
                  background: "var(--card)",
                  border: `1px solid ${month === null ? "oklch(0.68 0.18 300)" : BORDER}`,
                  color: month === null ? "oklch(0.08 0.014 240)" : "oklch(0.55 0.03 220)",
                  boxShadow: month === null ? "0 0 12px oklch(0.68 0.18 300 / 0.18)" : "none",
                  paddingRight: 34,
                  minWidth: 162,
                }}
              >
                <option value="YTD">YTD {year}</option>
                {MONTHS.map((m) => (
                  <option key={m.n} value={String(m.n)}>
                    {m.label} {year}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <ChevronDown className="h-4 w-4" style={{ color: ACCENT }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Section heading ─────────────────────────────────────────
function SectionHeading({ label, sub, color = ACCENT }: { label: string; sub?: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-4 w-[3px] rounded-full" style={{ background: color }} />
      <div>
        <span className="text-[10px] font-mono font-bold tracking-[0.20em] uppercase block" style={{ color }}>
          {label}
        </span>
        {sub && <span className="text-[10px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function DashboardPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState<number | null>(null); // null = YTD

  const totalGroups = PROCESSES.reduce((a, p) => a + p.groups.length, 0);
  const totalSubGroups = PROCESSES.reduce((a, p) => a + p.groups.reduce((b, g) => b + g.subGroups.length, 0), 0);

  const periodLabel = month === null
    ? `YTD — Jan / ${year === 2026 ? "Abr" : "Dez"} ${year}`
    : `${MONTHS[month - 1].label} / ${year}`;

  const topSpends = PROCESSES.flatMap((p) =>
    p.groups.flatMap((g) =>
      g.subGroups.map((s) => ({
        id: s.id,
        label: s.name,
        group: p.name,
        value: s.realized,
      }))
    )
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

        {/* ── Hero banner ─────────────────────────────────── */}
        <div
          className="rounded-xl px-6 py-5 relative overflow-hidden cp-grid-bg"
          style={{
            background: "var(--card)",
            border: `1px solid oklch(0.75 0.20 185 / 0.22)`,
            boxShadow: "0 0 50px oklch(0.75 0.20 185 / 0.08)",
          }}
        >
          <div className="absolute -top-12 -left-12 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, oklch(0.75 0.20 185 / 0.10) 0%, transparent 70%)" }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-[2px] w-8" style={{ background: `linear-gradient(90deg, ${ACCENT}, transparent)` }} />
                <span className="text-[9px] font-mono font-bold tracking-[0.28em] uppercase" style={{ color: ACCENT }}>
                  Controle Operacional — Grupo AVG
                </span>
              </div>
              <h1 className="text-xl font-bold font-mono tracking-wide leading-tight"
                style={{ color: "oklch(0.93 0.02 195)", textShadow: "0 0 20px oklch(0.75 0.20 185 / 0.28)" }}>
                Centro de Custo — Mina do Brumado
              </h1>
              <p className="text-[11px] font-mono mt-1.5" style={{ color: "oklch(0.45 0.03 220)" }}>
                Processo &rsaquo; Grupo &rsaquo; Subgrupo &ensp;&bull;&ensp;
                {PROCESSES.length} processos &bull; {totalGroups} grupos &bull; {totalSubGroups} subgrupos &ensp;&bull;&ensp;
                <span style={{ color: ACCENT }}>{periodLabel}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="Sistema" value="ONLINE" icon={Activity} color="oklch(0.65 0.20 145)" />
              <StatusBadge label="Processos" value={String(PROCESSES.length)} icon={Database} color={ACCENT} />
              <StatusBadge label="Subgrupos" value={String(totalSubGroups)} icon={Cpu} color="oklch(0.68 0.18 300)" />
              <StatusBadge label="Edição" value="ATIVA" icon={Shield} color="oklch(0.70 0.22 55)" />
            </div>
          </div>
        </div>

        {/* ── Period filter ────────────────────────────────── */}
        <PeriodFilter year={year} setYear={setYear} month={month} setMonth={setMonth} />

        <section aria-label="Resumo Executivo" className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
                Custo Operacional Total
              </p>
              <p className="mt-3 text-3xl font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>
                R$ 8.764.520,45
              </p>
              <p className="text-[10px] font-mono mt-3" style={{ color: "oklch(0.45 0.03 220)" }}>
                Total do período atual com tendência positiva.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "oklch(0.65 0.20 145 / 0.12)", color: "oklch(0.65 0.20 145)" }}>
                +8,62% vs período anterior
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
                Custo por tonelada
              </p>
              <p className="mt-3 text-3xl font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>
                R$ 12,58/t
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "oklch(0.65 0.20 145 / 0.12)", color: "oklch(0.65 0.20 145)" }}>
                -4,31% vs período anterior
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
                Consumo Diesel
              </p>
              <p className="mt-3 text-3xl font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>
                62.450 L
              </p>
              <p className="text-[10px] font-mono mt-3" style={{ color: "oklch(0.45 0.03 220)" }}>
                Consumo 5,21% abaixo do previsto.
              </p>
            </div>

            <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
                Disponibilidade Física
              </p>
              <p className="mt-3 text-3xl font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>
                87,43%
              </p>
              <p className="text-[10px] font-mono mt-3" style={{ color: "oklch(0.45 0.03 220)" }}>
                +3,21% vs período anterior.
              </p>
            </div>
          </div>

          <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
              Destaques Operacionais
            </p>
            <div className="mt-4 grid gap-3">
              {[
                { label: "Equipamentos", value: "R$ 3.156.280,50", rate: "36,02% do total" },
                { label: "Diesel", value: "R$ 1.872.450,00", rate: "21,37% do total" },
                { label: "Perfuração", value: "R$ 1.982.350,75", rate: "22,63% do total" },
                { label: "Desmonte", value: "R$ 1.134.250,20", rate: "12,94% do total" },
                { label: "Logística", value: "R$ 619.189,00", rate: "7,06% do total" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl p-4" style={{ background: "oklch(0.105 0.017 240)", border: "1px solid oklch(0.20 0.02 240)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "oklch(0.42 0.03 220)" }}>{item.label}</p>
                  <p className="mt-3 text-lg font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>{item.value}</p>
                  <p className="text-[9px] font-mono mt-2" style={{ color: "oklch(0.45 0.03 220)" }}>{item.rate}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── KPIs ────────────────────────────────────────── */}
        <section aria-label="KPIs Principais">
          <SectionHeading
            label="KPIs Principais"
            sub={`Indicadores de desempenho — ${periodLabel}`}
            color={ACCENT}
          />
          <KpiSummary year={year} month={month} />
        </section>

        {/* ── Charts ──────────────────────────────────────── */}
        <section aria-label="Análise Orçamentária" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <SectionHeading label="Orçado vs. Realizado" sub="Por processo — valores em R$" color="oklch(0.70 0.22 55)" />
            <BudgetChart year={year} month={month} />
          </div>
          <div>
            <SectionHeading label="Distribuição do Custo Realizado" sub="Participação percentual por processo" color="oklch(0.68 0.18 300)" />
            <DistributionChart year={year} month={month} />
          </div>
        </section>

        <section aria-label="Painel de Ações e Alertas" className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-4">
          <div>
            <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>
                    Centro de Custo — Detalhamento
                  </h2>
                  <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.45 0.03 220)" }}>
                    Processos, grupos e subgrupos com edição online, alertas e comparativos.
                  </p>
                </div>
                <div className="hidden md:block">
                  <ModeEditionButton />
                </div>
              </div>
              <AuthModal />
              <CostCenterPanel />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
                    Top 5 Maiores Gastos
                  </p>
                  <h3 className="mt-2 text-xl font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>
                    Ranking de subgrupos
                  </h3>
                </div>
              </div>
              <div className="space-y-3">
                {topSpends.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold font-mono truncate" style={{ color: "oklch(0.94 0.018 195)" }}>{item.label}</p>
                      <p className="text-[10px] font-mono truncate" style={{ color: "oklch(0.45 0.03 220)" }}>{item.group}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono" style={{ color: ACCENT }}>
                        {item.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: "oklch(0.45 0.03 220)" }}>#{index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
                    Alertas
                  </p>
                  <h3 className="mt-2 text-xl font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>
                    Principais riscos ativos
                  </h3>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl p-4" style={{ background: "oklch(0.68 0.22 55 / 0.12)", border: `1px solid oklch(0.68 0.22 55 / 0.25)` }}>
                  <p className="text-[11px] font-bold font-mono" style={{ color: "oklch(0.68 0.22 55)" }}>CUSTO ACIMA DA META</p>
                  <p className="text-[10px] font-mono mt-2" style={{ color: "oklch(0.45 0.03 220)" }}>
                    Equipamentos acima de 10% da meta mensal.
                  </p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: "oklch(0.75 0.20 185 / 0.12)", border: `1px solid oklch(0.75 0.20 185 / 0.25)` }}>
                  <p className="text-[11px] font-bold font-mono" style={{ color: ACCENT }}>DIESEL ACIMA DO PREVISTO</p>
                  <p className="text-[10px] font-mono mt-2" style={{ color: "oklch(0.45 0.03 220)" }}>
                    Consumo 8% acima do previsto para o período.
                  </p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: "oklch(0.65 0.20 145 / 0.12)", border: `1px solid oklch(0.65 0.20 145 / 0.25)` }}>
                  <p className="text-[11px] font-bold font-mono" style={{ color: "oklch(0.65 0.20 145)" }}>EQUIPAMENTO PARADO</p>
                  <p className="text-[10px] font-mono mt-2" style={{ color: "oklch(0.45 0.03 220)" }}>
                    Perfuração ROC D65 parada há 6 horas.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
                    Ações Rápidas
                  </p>
                  <h3 className="mt-2 text-xl font-bold font-mono" style={{ color: "oklch(0.94 0.018 195)" }}>
                    Operações instantâneas
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {["Novo Registro", "Relatório PDF", "Exportar Excel", "Apresentação"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="rounded-2xl border border-[oklch(0.75_0.20_185/0.3)] px-4 py-3 text-left font-mono text-sm font-semibold transition hover:bg-[oklch(0.75_0.20_185/0.08)]"
                    style={{ color: "oklch(0.75 0.20 185)" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Centro de Custo — Detalhamento ──────────────── */}
        <section aria-label="Centro de Custo — Detalhamento">
          <div className="flex items-center justify-between gap-4">
            <SectionHeading
              label="Centro de Custo — Detalhamento"
              sub="Processo › Grupo › Subgrupo · Todos os campos editáveis online"
              color="oklch(0.72 0.18 270)"
            />
            <div className="hidden md:flex">
              <ModeEditionButton />
            </div>
          </div>

          <AuthModal />
          <CostCenterPanel />
        </section>


        {/* ── Footer ──────────────────────────────────────── */}

        <footer
          className="rounded-xl px-6 py-5 mt-1"
          style={{ background: "var(--card)", border: `1px solid ${BORDER}` }}
        >
          <div
            className="h-[1px] w-full mb-4"
            style={{ background: "linear-gradient(90deg, transparent, oklch(0.75 0.20 185 / 0.38), transparent)" }}
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono font-bold tracking-widest"
                style={{ color: ACCENT, textShadow: "0 0 10px oklch(0.75 0.20 185 / 0.45)" }}>
                MINA DO BRUMADO
              </span>
              <span className="text-[11px] font-mono" style={{ color: "oklch(0.40 0.025 220)" }}>
                Grupo AVG — Sistema de Gestão de Centro de Custo &nbsp;·&nbsp; v4.1.0
              </span>
              <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.68 0.18 300)" }}>
                Desenvolvido por Michel Almeida
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-mono" style={{ color: "oklch(0.40 0.025 220)" }}>
                Período ativo:{" "}
                <span style={{ color: ACCENT }}>{periodLabel}</span>
              </span>
              <span className="text-[10px] font-mono" style={{ color: "oklch(0.40 0.025 220)" }}>
                Atualizado:{" "}
                <span style={{ color: ACCENT }}>
                  {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  {" "}{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
