"use client";

import { useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  CheckCircle2, BarChart3, Pickaxe, ArrowLeftRight, X, Minus,
} from "lucide-react";
import {
  formatBRL, getGrandTotals, Process,
  getProcessRealized, getProcessBudgeted,
} from "@/lib/cost-centers";

/** Returns a 0-1 factor to scale annual realized values by period */
function periodFactor(year: number, month: number | null): number {
  // YTD 2026 = 4 months out of 12
  // YTD other years = full year
  if (month !== null) return month / 12;
  if (year === 2026) return 4 / 12;
  return 1;
}

function getKpiData(year: number, month: number | null, processes: Process[]) {
  const factor = periodFactor(year, month);
  // Scale budgeted proportionally too (monthly budget = annual/12)
  const budgetFactor = month !== null ? month / 12 : (year === 2026 ? 4 / 12 : 1);

  const rawBudgeted = processes.reduce((a, p) => a + getProcessBudgeted(p), 0);
  const rawRealized = processes.reduce((a, p) => a + getProcessRealized(p), 0);
  const budgeted = Math.round(rawBudgeted * budgetFactor);
  const realized = Math.round(rawRealized * factor);
  const variance = realized - budgeted;
  const variancePct = budgeted > 0 ? ((realized - budgeted) / budgeted) * 100 : 0;
  const executionPct = budgeted > 0 ? (realized / budgeted) * 100 : 0;
  const overBudget = processes.filter(p =>
    Math.round(getProcessRealized(p) * factor) > Math.round(getProcessBudgeted(p) * budgetFactor)
  ).length;
  const saldo = budgeted - realized;

  const prodIds = ["LM", "BEN"];
  const custoProdR = Math.round(processes.filter(p => prodIds.includes(p.id)).reduce((a, p) => a + getProcessRealized(p), 0) * factor);
  const custoProdB = Math.round(processes.filter(p => prodIds.includes(p.id)).reduce((a, p) => a + getProcessBudgeted(p), 0) * budgetFactor);
  const custoProdPct = realized > 0 ? (custoProdR / realized) * 100 : 0;
  const custoProdVar = custoProdB > 0 ? ((custoProdR - custoProdB) / custoProdB) * 100 : 0;

  const movIds = ["LOG", "INS"];
  const movR = Math.round(processes.filter(p => movIds.includes(p.id)).reduce((a, p) => a + getProcessRealized(p), 0) * factor);
  const movB = Math.round(processes.filter(p => movIds.includes(p.id)).reduce((a, p) => a + getProcessBudgeted(p), 0) * budgetFactor);
  const movVar = movB > 0 ? ((movR - movB) / movB) * 100 : 0;
  const movExec = movB > 0 ? (movR / movB) * 100 : 0;

  return {
    budgeted, realized, variance, variancePct, executionPct, overBudget, saldo,
    custoProdR, custoProdB, custoProdPct, custoProdVar,
    movR, movB, movVar, movExec, factor, budgetFactor,
  };
}

// ─── Detail Modal ─────────────────────────────────────────────
interface ModalData {
  title: string;
  color: string;
  mainValue: string;
  metrics: { label: string; value: string; highlight?: boolean }[];
  breakdown: { name: string; budgeted: number; realized: number }[];
}

function DetailModal({ data, onClose }: { data: ModalData; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2,6,18,0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden"
        style={{
          background: "oklch(0.09 0.016 240)",
          border: `1px solid ${data.color}`,
          boxShadow: `0 0 60px color-mix(in oklch, ${data.color} 25%, transparent), 0 32px 80px rgba(0,0,0,0.65)`,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{
            background: `color-mix(in oklch, ${data.color} 8%, transparent)`,
            borderBottom: `1px solid color-mix(in oklch, ${data.color} 22%, transparent)`,
          }}
        >
          <div>
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.24em] mb-1" style={{ color: data.color }}>
              {data.title}
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: "oklch(0.94 0.018 195)" }}>
              {data.mainValue}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "oklch(0.38 0.03 220)", border: "1px solid oklch(0.20 0.02 240)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.15 0.015 240)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Metrics */}
          <div className="px-6 py-4 border-b" style={{ borderColor: "oklch(0.16 0.018 240)" }}>
            <div className="grid grid-cols-2 gap-3">
              {data.metrics.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg px-4 py-3"
                  style={{ background: "oklch(0.075 0.012 240)", border: "1px solid oklch(0.17 0.018 240)" }}
                >
                  <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.40 0.03 220)" }}>
                    {m.label}
                  </p>
                  <p
                    className="text-[13px] font-bold font-mono tabular-nums"
                    style={{ color: m.highlight ? data.color : "oklch(0.84 0.02 200)" }}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          {data.breakdown.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.20em] mb-3" style={{ color: "oklch(0.35 0.025 220)" }}>
                Breakdown por Processo
              </p>
              <div className="space-y-2">
                {data.breakdown.map((row, i) => {
                  const r = row.realized;
                  const b = row.budgeted;
                  const pct = b > 0 ? ((r / b) * 100) : 0;
                  const over = r > b;
                  const barW = Math.min(pct, 110);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono" style={{ color: "oklch(0.65 0.03 220)" }}>{row.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono tabular-nums" style={{ color: "oklch(0.82 0.02 200)" }}>
                            {formatBRL(r)}
                          </span>
                          <span
                            className="text-[9px] font-mono font-bold w-14 text-right"
                            style={{ color: over ? "oklch(0.62 0.24 25)" : "oklch(0.65 0.20 145)" }}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-[3px] rounded-full" style={{ background: "oklch(0.16 0.016 240)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(barW, 100)}%`,
                            background: over ? "oklch(0.62 0.24 25)" : data.color,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card — compact horizontal layout ─────────────────────
interface KpiCardData {
  id: string;
  label: string;
  value: string;
  meta: string;
  badge: string;
  badgeOk: boolean;
  barPct: number;
  color: string;
  Icon: React.ElementType;
  TrendIcon: React.ElementType;
  modal: ModalData;
}

function KpiCard({ kpi, onClick }: { kpi: KpiCardData; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative w-full text-left rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: hovered ? "oklch(0.125 0.020 240)" : "oklch(0.105 0.017 240)",
        border: `1px solid ${hovered ? kpi.color : `color-mix(in oklch, ${kpi.color} 28%, oklch(0.20 0.02 240))`}`,
        boxShadow: hovered ? `0 0 20px color-mix(in oklch, ${kpi.color} 18%, transparent)` : "none",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${kpi.color}, transparent 70%)`, opacity: hovered ? 1 : 0.5 }} />

      <div className="px-5 py-4 flex items-center gap-4">
        {/* Icon box */}
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: `color-mix(in oklch, ${kpi.color} 10%, transparent)`,
            border: `1px solid color-mix(in oklch, ${kpi.color} 24%, transparent)`,
          }}
        >
          <kpi.Icon className="h-5 w-5" style={{ color: kpi.color }} />
        </div>

        {/* Center — label + value */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: `color-mix(in oklch, ${kpi.color} 80%, oklch(0.60 0.04 220))` }}>
            {kpi.label}
          </p>
          <p className="text-lg font-bold font-mono tabular-nums leading-none" style={{ color: "oklch(0.94 0.018 195)" }}>
            {kpi.value}
          </p>
          <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: "oklch(0.44 0.03 220)" }}>
            {kpi.meta}
          </p>
        </div>

        {/* Right — badge + trend + bar */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <kpi.TrendIcon className="h-3 w-3" style={{ color: kpi.badgeOk ? "oklch(0.65 0.20 145)" : "oklch(0.65 0.22 25)" }} />
            <span
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider"
              style={{
                color: kpi.badgeOk ? "oklch(0.65 0.20 145)" : "oklch(0.65 0.22 25)",
                background: kpi.badgeOk ? "oklch(0.65 0.20 145 / 0.10)" : "oklch(0.65 0.22 25 / 0.10)",
                border: `1px solid ${kpi.badgeOk ? "oklch(0.65 0.20 145 / 0.25)" : "oklch(0.65 0.22 25 / 0.25)"}`,
              }}
            >
              {kpi.badge}
            </span>
          </div>
          {/* Mini progress */}
          <div className="w-20 h-[3px] rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.018 240)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(kpi.barPct, 100)}%`,
                background: kpi.color,
                transition: "width 0.7s ease",
              }}
            />
          </div>
          <p className="text-[8px] font-mono" style={{ color: "oklch(0.30 0.02 220)" }}>
            {kpi.barPct.toFixed(0)}%
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────
export function KpiSummary({ year = 2026, month = null, processes }: { year?: number; month?: number | null; processes: Process[] }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const d = getKpiData(year, month, processes);

  const kpis: KpiCardData[] = [
    {
      id: "orcado",
      label: "Orçamento Total",
      value: formatBRL(d.budgeted),
      meta: `${processes.length} processos · exercício ${year}`,
      badge: "BASE",
      badgeOk: true,
      barPct: 100,
      color: "oklch(0.75 0.20 185)",
      Icon: DollarSign,
      TrendIcon: Minus,
      modal: {
        title: "Orçamento Total 2026",
        color: "oklch(0.75 0.20 185)",
        mainValue: formatBRL(d.budgeted),
        metrics: [
          { label: "Processos Ativos", value: `${processes.length}` },
          { label: "Período", value: month !== null ? `Mês ${month}/${year}` : year === 2026 ? `Jan – Abr ${year}` : `Jan – Dez ${year}` },
          { label: "Saldo Disponível", value: formatBRL(d.saldo), highlight: true },
          { label: "% Executado", value: `${d.executionPct.toFixed(1)}%` },
        ],
        breakdown: processes.map(p => ({ name: p.name, budgeted: Math.round(getProcessBudgeted(p) * d.budgetFactor), realized: Math.round(getProcessRealized(p) * d.factor) })),
      },
    },
    {
      id: "realizado",
      label: "Realizado Acumulado",
      value: formatBRL(d.realized),
      meta: `${d.executionPct.toFixed(1)}% do orçamento · saldo ${formatBRL(d.saldo)}`,
      badge: d.executionPct > 100 ? "ACIMA" : "OK",
      badgeOk: d.executionPct <= 100,
      barPct: d.executionPct,
      color: d.executionPct > 100 ? "oklch(0.62 0.24 25)" : "oklch(0.65 0.20 145)",
      Icon: BarChart3,
      TrendIcon: d.executionPct > 100 ? TrendingUp : TrendingDown,
      modal: {
        title: "Realizado Acumulado",
        color: d.executionPct > 100 ? "oklch(0.62 0.24 25)" : "oklch(0.65 0.20 145)",
        mainValue: formatBRL(d.realized),
        metrics: [
          { label: "Total Orçado", value: formatBRL(d.budgeted) },
          { label: "% de Execução", value: `${d.executionPct.toFixed(2)}%`, highlight: true },
          { label: "Saldo Disponível", value: formatBRL(d.saldo) },
          { label: "Status", value: d.executionPct > 100 ? "Acima do Orçamento" : "Dentro do Orçamento" },
        ],
        breakdown: processes.map(p => ({ name: p.name, budgeted: Math.round(getProcessBudgeted(p) * d.budgetFactor), realized: Math.round(getProcessRealized(p) * d.factor) })),
      },
    },
    {
      id: "variacao",
      label: "Variação Orçamentária",
      value: `${d.variancePct > 0 ? "+" : ""}${d.variancePct.toFixed(2)}%`,
      meta: `${d.variance > 0 ? "Excesso de" : "Economia de"} ${formatBRL(Math.abs(d.variance))}`,
      badge: d.variance > 0 ? "DESVIO" : "ECONOMIA",
      badgeOk: d.variance <= 0,
      barPct: Math.min(Math.abs(d.variancePct), 100),
      color: d.variance > 0 ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.20 145)",
      Icon: d.variance > 0 ? TrendingUp : TrendingDown,
      TrendIcon: d.variance > 0 ? TrendingUp : TrendingDown,
      modal: {
        title: "Variação Orçamentária",
        color: d.variance > 0 ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.20 145)",
        mainValue: `${d.variancePct > 0 ? "+" : ""}${d.variancePct.toFixed(2)}%`,
        metrics: [
          { label: "Variação Absoluta", value: `${d.variance > 0 ? "+" : ""}${formatBRL(d.variance)}`, highlight: true },
          { label: "Total Orçado", value: formatBRL(d.budgeted) },
          { label: "Total Realizado", value: formatBRL(d.realized) },
          { label: "Resultado", value: d.variance > 0 ? "Acima do Orçamento" : "Abaixo do Orçamento" },
        ],
        breakdown: processes.map(p => {
          const b = getProcessBudgeted(p);
          const r = getProcessRealized(p);
          return { name: p.name, budgeted: b, realized: r };
        }),
      },
    },
    {
      id: "alertas",
      label: "Alertas de Desvio",
      value: `${d.overBudget} / ${processes.length}`,
      meta: d.overBudget > 0 ? `${d.overBudget} processo(s) com excesso` : "Todos os processos dentro do limite",
      badge: d.overBudget > 0 ? "ALERTA" : "NORMAL",
      badgeOk: d.overBudget === 0,
      barPct: processes.length > 0 ? ((processes.length - d.overBudget) / processes.length) * 100 : 0,
      color: d.overBudget > 0 ? "oklch(0.72 0.22 55)" : "oklch(0.65 0.20 145)",
      Icon: d.overBudget > 0 ? AlertTriangle : CheckCircle2,
      TrendIcon: d.overBudget > 0 ? TrendingUp : Minus,
      modal: {
        title: "Alertas de Desvio",
        color: d.overBudget > 0 ? "oklch(0.72 0.22 55)" : "oklch(0.65 0.20 145)",
        mainValue: `${d.overBudget} processo(s) em desvio`,
        metrics: [
          { label: "Processos em Desvio", value: `${d.overBudget}`, highlight: d.overBudget > 0 },
          { label: "Processos Conformes", value: `${processes.length - d.overBudget}` },
          { label: "Taxa de Conformidade", value: `${processes.length > 0 ? (((processes.length - d.overBudget) / processes.length) * 100).toFixed(0) : "0"}%` },
          { label: "Total de Processos", value: `${processes.length}` },
        ],
        breakdown: processes.filter(p => getProcessRealized(p) > getProcessBudgeted(p))
          .map(p => ({ name: p.name, budgeted: getProcessBudgeted(p), realized: getProcessRealized(p) })),
      },
    },
    {
      id: "operacao",
      label: "Custo por Operação",
      value: formatBRL(d.custoProdR),
      meta: `${d.custoProdPct.toFixed(1)}% do total · Lavra + Beneficiamento`,
      badge: d.custoProdVar > 0 ? "DESVIO" : "OK",
      badgeOk: d.custoProdVar <= 0,
      barPct: d.custoProdPct,
      color: "oklch(0.72 0.18 270)",
      Icon: Pickaxe,
      TrendIcon: d.custoProdVar > 0 ? TrendingUp : TrendingDown,
      modal: {
        title: "Custo por Operação",
        color: "oklch(0.72 0.18 270)",
        mainValue: formatBRL(d.custoProdR),
        metrics: [
          { label: "Realizado (Lavra+Ben.)", value: formatBRL(d.custoProdR), highlight: true },
          { label: "Orçado (Lavra+Ben.)", value: formatBRL(d.custoProdB) },
          { label: "Variação", value: `${d.custoProdVar > 0 ? "+" : ""}${d.custoProdVar.toFixed(2)}%` },
          { label: "% do Custo Total", value: `${d.custoProdPct.toFixed(1)}%` },
        ],
        breakdown: processes.filter(p => ["LM", "BEN"].includes(p.id))
          .map(p => ({ name: p.name, budgeted: getProcessBudgeted(p), realized: getProcessRealized(p) })),
      },
    },
    {
      id: "movimentacao",
      label: "Movimentação",
      value: formatBRL(d.movR),
      meta: `${d.movExec.toFixed(1)}% exec. · Logística + Insumos`,
      badge: d.movVar > 0 ? "DESVIO" : "OK",
      badgeOk: d.movVar <= 0,
      barPct: d.movExec,
      color: "oklch(0.74 0.20 45)",
      Icon: ArrowLeftRight,
      TrendIcon: d.movVar > 0 ? TrendingUp : TrendingDown,
      modal: {
        title: "Movimentação",
        color: "oklch(0.74 0.20 45)",
        mainValue: formatBRL(d.movR),
        metrics: [
          { label: "Realizado (Log.+Ins.)", value: formatBRL(d.movR), highlight: true },
          { label: "Orçado (Log.+Ins.)", value: formatBRL(d.movB) },
          { label: "Variação %", value: `${d.movVar > 0 ? "+" : ""}${d.movVar.toFixed(2)}%` },
          { label: "% Execução", value: `${d.movExec.toFixed(1)}%` },
        ],
        breakdown: processes.filter(p => ["LOG", "INS"].includes(p.id))
          .map(p => ({ name: p.name, budgeted: getProcessBudgeted(p), realized: getProcessRealized(p) })),
      },
    },
  ];

  const activeKpi = kpis.find(k => k.id === activeModal);

  return (
    <>
      {/* 2-column grid — 3 cards per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map(kpi => (
          <KpiCard key={kpi.id} kpi={kpi} onClick={() => setActiveModal(kpi.id)} />
        ))}
      </div>

      {activeModal && activeKpi && (
        <DetailModal data={activeKpi.modal} onClose={() => setActiveModal(null)} />
      )}
    </>
  );
}
