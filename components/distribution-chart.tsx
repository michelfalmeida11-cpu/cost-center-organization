"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  COST_CENTERS,
  getTotalRealized,
  getTotalBudgeted,
  formatBRL,
} from "@/lib/cost-centers";

// ── Distinct color per process ────────────────────────────────
const AREA_COLORS: Record<string, string> = {
  LM:  "oklch(0.72 0.20 185)",   // cyan-teal
  BEN: "oklch(0.68 0.22 145)",   // green
  INS: "oklch(0.72 0.20 55)",    // amber
  MA:  "oklch(0.65 0.18 160)",   // emerald
  ADM: "oklch(0.70 0.20 295)",   // violet
  LOG: "oklch(0.68 0.20 220)",   // blue (distinct from amber)
  DEP: "oklch(0.62 0.10 240)",   // slate-blue
};

// Convert oklch string to hex-compatible for Recharts SVG fill
function toHex(oklch: string): string {
  // Map each key to a safe hex for SVG rendering
  const MAP: Record<string, string> = {
    "oklch(0.72 0.20 185)": "#00c4b0",
    "oklch(0.68 0.22 145)": "#22c55e",
    "oklch(0.72 0.20 55)":  "#f59e0b",
    "oklch(0.65 0.18 160)": "#10b981",
    "oklch(0.70 0.20 295)": "#a855f7",
    "oklch(0.68 0.20 220)": "#3b82f6",
    "oklch(0.62 0.10 240)": "#64748b",
  };
  return MAP[oklch] ?? "#64748b";
}

type SortKey = "value" | "name" | "pct" | "variance";

function getPeriodFactor(year: number, month: number | null): number {
  if (month !== null) return month / 12;
  if (year === 2026) return 4 / 12;
  return 1;
}

// Active sector — renders expanded slice with inner label, NO external card
const renderActiveShape = (props: Record<string, unknown>) => {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle,
    fill, payload, percent,
  } = props as {
    cx: number; cy: number;
    innerRadius: number; outerRadius: number;
    startAngle: number; endAngle: number;
    fill: string;
    payload: { name: string; value: number };
    percent: number;
  };

  return (
    <g>
      {/* Expanded outer slice */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={1}
      />
      {/* Subtle glow ring */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 13}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.35}
      />
      {/* Center label — name */}
      <text
        x={cx} y={cy - 14}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        fontWeight={700}
        fill={fill}
      >
        {payload.name}
      </text>
      {/* Center label — value */}
      <text
        x={cx} y={cy + 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fontFamily="ui-monospace, monospace"
        fill="#94a3b8"
      >
        {formatBRL(payload.value)}
      </text>
      {/* Center label — pct */}
      <text
        x={cx} y={cy + 19}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        fontWeight={700}
        fill={fill}
      >
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
};

export function DistributionChart({
  year = 2026,
  month = null,
}: {
  year?: number;
  month?: number | null;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [sortKey, setSortKey]         = useState<SortKey>("value");

  const factor       = getPeriodFactor(year, month);
  const budgetFactor = month !== null ? month / 12 : year === 2026 ? 4 / 12 : 1;

  const totalRealized = Math.round(
    COST_CENTERS.reduce((a, c) => a + getTotalRealized(c), 0) * factor
  );
  const totalBudgeted = Math.round(
    COST_CENTERS.reduce((a, c) => a + getTotalBudgeted(c), 0) * budgetFactor
  );

  const rawData = useMemo(
    () =>
      COST_CENTERS.map(c => {
        const realized = Math.round(getTotalRealized(c) * factor);
        const budgeted = Math.round(getTotalBudgeted(c) * budgetFactor);
        const varPct   = budgeted > 0 ? ((realized - budgeted) / budgeted) * 100 : 0;
        return {
          id:      c.id,
          name:    c.name,
          value:   realized,
          budgeted,
          pct:     totalRealized > 0 ? (realized / totalRealized) * 100 : 0,
          varPct,
          color:   AREA_COLORS[c.id] ?? "oklch(0.60 0.08 240)",
          fill:    toHex(AREA_COLORS[c.id] ?? "oklch(0.60 0.08 240)"),
          isOver:  realized > budgeted,
        };
      }),
    [factor, budgetFactor, totalRealized]
  );

  const sortedData = useMemo(() => {
    const d = [...rawData];
    if (sortKey === "value")         d.sort((a, b) => b.value - a.value);
    else if (sortKey === "name")     d.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "pct")      d.sort((a, b) => b.pct - a.pct);
    else if (sortKey === "variance") d.sort((a, b) => b.varPct - a.varPct);
    return d;
  }, [rawData, sortKey]);

  const globalVarPct =
    totalBudgeted > 0
      ? ((totalRealized - totalBudgeted) / totalBudgeted) * 100
      : 0;

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSortKey(k)}
      className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded transition-all"
      style={{
        color:      sortKey === k ? "#0f172a" : "var(--muted-foreground)",
        background: sortKey === k ? "#3b82f6" : "var(--secondary)",
        border:     `1px solid ${sortKey === k ? "#3b82f6" : "var(--border)"}`,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-4"
      style={{
        background: "var(--card)",
        border:     "1px solid #3b82f630",
        boxShadow:  "0 0 28px #3b82f610",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-[2px] w-5 rounded-full bg-blue-500" />
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-blue-500">
              Distribuição do Custo Realizado
            </h3>
          </div>
          <p className="text-[10px] font-mono pl-7 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {month !== null
              ? `Mês ${month}/${year}`
              : year === 2026
              ? `Jan – Abr ${year} (YTD)`
              : `Jan – Dez ${year} (YTD)`}
            &nbsp;·&nbsp;{sortedData.length} processos
          </p>
        </div>

        {/* Totals pill */}
        <div
          className="flex items-center gap-4 rounded-lg px-4 py-2 shrink-0"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Realizado</p>
            <p className="text-sm font-bold font-mono tabular-nums" style={{ color: "var(--foreground)" }}>
              {formatBRL(totalRealized)}
            </p>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border)" }} />
          <div>
            <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Orçado</p>
            <p className="text-sm font-mono tabular-nums" style={{ color: "var(--muted-foreground)" }}>
              {formatBRL(totalBudgeted)}
            </p>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border)" }} />
          <div>
            <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Variação</p>
            <p
              className="text-sm font-bold font-mono tabular-nums"
              style={{ color: globalVarPct > 0 ? "#ef4444" : globalVarPct < 0 ? "#22c55e" : "var(--muted-foreground)" }}
            >
              {globalVarPct > 0 ? "+" : ""}{globalVarPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* ── Sort controls ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Ordenar:</span>
        <SortBtn k="value" label="Valor" />
        <SortBtn k="pct" label="%" />
        <SortBtn k="variance" label="Desvio" />
        <SortBtn k="name" label="A–Z" />
      </div>

      {/* ── PIE CHART + LEGEND side by side ── */}
      <div className="flex flex-col sm:flex-row items-start gap-4">

        {/* Pie */}
        <div className="w-full sm:w-[220px] shrink-0" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                dataKey="value"
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape as Parameters<typeof Pie>[0]["activeShape"]}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                strokeWidth={1}
                stroke="var(--card)"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.id}`}
                    fill={entry.fill}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                  />
                ))}
              </Pie>
              {/* No Tooltip — info shown in center via activeShape */}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend table */}
        <div className="flex-1 min-w-0 flex flex-col gap-0">
          {/* Column headers */}
          <div
            className="grid text-[8px] font-mono uppercase tracking-widest pb-1 mb-1"
            style={{
              gridTemplateColumns: "1fr 100px 44px 64px",
              color:               "var(--muted-foreground)",
              borderBottom:        "1px solid var(--border)",
            }}
          >
            <span>Processo</span>
            <span>Realizado</span>
            <span className="text-right">%</span>
            <span className="text-right">Desvio</span>
          </div>

          {/* Rows */}
          {sortedData.map((entry, i) => {
            const isActive = activeIndex === i;
            const varColor = Math.abs(entry.varPct) < 1
              ? "var(--muted-foreground)"
              : entry.isOver ? "#ef4444" : "#22c55e";
            const VarIcon = entry.isOver ? TrendingUp : TrendingDown;

            return (
              <div
                key={entry.id}
                className="grid items-center py-1.5 px-1 rounded cursor-default transition-all"
                style={{
                  gridTemplateColumns: "1fr 100px 44px 64px",
                  background: isActive
                    ? `${entry.fill}18`
                    : "transparent",
                  border: `1px solid ${isActive ? entry.fill + "44" : "transparent"}`,
                }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {/* Name + dot */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="shrink-0 w-2 h-2 rounded-full"
                    style={{
                      background: entry.fill,
                      boxShadow: isActive ? `0 0 5px ${entry.fill}` : "none",
                    }}
                  />
                  <span
                    className="text-[10px] font-mono truncate"
                    style={{ color: isActive ? "var(--foreground)" : "var(--muted-foreground)" }}
                  >
                    {entry.name}
                  </span>
                </div>

                {/* Realized */}
                <span
                  className="text-[10px] font-mono tabular-nums font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {formatBRL(entry.value)}
                </span>

                {/* % */}
                <span
                  className="text-[10px] font-bold font-mono text-right tabular-nums"
                  style={{ color: entry.fill }}
                >
                  {entry.pct.toFixed(1)}%
                </span>

                {/* Variance */}
                <div className="flex items-center justify-end gap-0.5">
                  {Math.abs(entry.varPct) >= 1 && (
                    <VarIcon className="h-3 w-3 shrink-0" style={{ color: varColor }} />
                  )}
                  {Math.abs(entry.varPct) < 1 && (
                    <Minus className="h-3 w-3 shrink-0" style={{ color: varColor }} />
                  )}
                  <span
                    className="text-[10px] font-mono tabular-nums"
                    style={{ color: varColor }}
                  >
                    {entry.isOver ? "+" : ""}{entry.varPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}

          {/* Total row */}
          <div
            className="grid items-center pt-1.5 mt-1 px-1"
            style={{
              gridTemplateColumns: "1fr 100px 44px 64px",
              borderTop:           "1px solid var(--border)",
            }}
          >
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-blue-500">Total</span>
            <span className="text-[10px] font-bold font-mono tabular-nums" style={{ color: "var(--foreground)" }}>
              {formatBRL(totalRealized)}
            </span>
            <span className="text-[10px] font-bold font-mono text-right text-blue-500">100%</span>
            <div className="flex items-center justify-end gap-0.5">
              {globalVarPct > 0
                ? <TrendingUp className="h-3 w-3 text-red-500" />
                : globalVarPct < 0
                ? <TrendingDown className="h-3 w-3 text-green-500" />
                : <Minus className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
              }
              <span
                className="text-[10px] font-mono font-semibold tabular-nums"
                style={{ color: globalVarPct > 0 ? "#ef4444" : globalVarPct < 0 ? "#22c55e" : "var(--muted-foreground)" }}
              >
                {globalVarPct > 0 ? "+" : ""}{globalVarPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
