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
      className="rounded-xl px-5 py-4"
      style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
    >
            <div className="flex flex-col gap-4">
        {/* Calendar icon + label */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="h-3.5 w-3.5" style={{ color: ACCENT }} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.20em]" style={{ color: ACCENT }}>
            Período
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-[1px]" style={{ background: BORDER }} />

        {/* Year buttons */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono uppercase tracking-widest mr-1" style={{ color: "oklch(0.38 0.025 220)" }}>Ano</span>
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{
                color: year === y ? "oklch(0.08 0.014 240)" : "oklch(0.50 0.03 220)",
              background: year === y ? ACCENT : "var(--secondary)",
              border: `1px solid ${year === y ? ACCENT : BORDER}`,
                boxShadow: year === y ? `0 0 12px oklch(0.75 0.20 185 / 0.35)` : "none",
              }}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-[1px]" style={{ background: BORDER }} />

        {/* Month buttons — grid 6×2 on mobile, row on wider */}
        <div className="flex flex-wrap gap-1 flex-1 justify-start">
          <span className="text-[9px] font-mono uppercase tracking-widest self-center mr-1" style={{ color: "oklch(0.38 0.025 220)" }}>Mês</span>
          {/* "Todos" / YTD pill */}
          <button
            onClick={() => setMonth(null)}
            className="text-[10px] font-mono font-bold px-3 py-1 rounded-lg transition-all duration-150"
            style={{
              color: month === null ? "oklch(0.08 0.014 240)" : "oklch(0.50 0.03 220)",
              background: month === null ? "oklch(0.68 0.18 300)" : "var(--secondary)",
              border: `1px solid ${month === null ? "oklch(0.68 0.18 300)" : BORDER}`,
              boxShadow: month === null ? "0 0 12px oklch(0.68 0.18 300 / 0.35)" : "none",
            }}
          >
            YTD
          </button>
          {MONTHS.map(m => {
            const isSel = month === m.n;
            const disabled = false;
            return (
              <button
                key={m.n}
                onClick={() => setMonth(m.n)}
                disabled={disabled}
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all duration-150"
                style={{
                  color: disabled
                    ? "oklch(0.28 0.02 240)"
                    : isSel
                    ? "oklch(0.08 0.014 240)"
                    : "oklch(0.55 0.03 220)",
                  background: isSel ? ACCENT : "var(--secondary)",
                  border: `1px solid ${isSel ? ACCENT : BORDER}`,
                  boxShadow: isSel ? `0 0 10px oklch(0.75 0.20 185 / 0.30)` : "none",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.30 : 1,
                  pointerEvents: disabled ? "none" : "auto",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Current selection pill */}
        <div
          className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5"
          style={{ background: "oklch(0.75 0.20 185 / 0.10)", border: `1px solid oklch(0.75 0.20 185 / 0.30)` }}
        >
          <ChevronDown className="h-3 w-3" style={{ color: ACCENT }} />
          <span className="text-[10px] font-mono font-bold" style={{ color: ACCENT }}>
            {month === null
              ? `YTD ${year}`
              : `${MONTHS[month - 1].label} / ${year}`}
          </span>
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
