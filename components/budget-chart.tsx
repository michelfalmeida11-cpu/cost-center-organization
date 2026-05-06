"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { COST_CENTERS, getTotalBudgeted, getTotalRealized, formatBRL } from "@/lib/cost-centers";

const COLORS: Record<string, string> = {
  LM:  "oklch(0.75 0.20 185)",
  BEN: "oklch(0.68 0.20 145)",
  INS: "oklch(0.72 0.22 55)",
  MA:  "oklch(0.68 0.20 155)",
  ADM: "oklch(0.70 0.20 295)",
  LOG: "oklch(0.74 0.20 45)",
  DEP: "oklch(0.58 0.06 240)",
};

function fmtShort(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return `R$${v}`;
}

// ── Custom tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const orc  = payload.find((p: any) => p.dataKey === "Orçado");
  const real = payload.find((p: any) => p.dataKey === "Realizado");
  if (!orc || !real) return null;
  const diff    = real.value - orc.value;
  const diffPct = orc.value > 0 ? ((diff / orc.value) * 100).toFixed(1) : "0.0";
  const over    = diff > 0;

  return (
      <div
        className="rounded-xl p-4 text-xs font-mono"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 8px 32px hsl(0 0% 0% / 0.12)",
          minWidth: 240,
        }}
      >
      <p
        className="font-bold text-[12px] uppercase tracking-widest pb-2.5 mb-2.5"
        style={{ color: "oklch(0.92 0.02 200)", borderBottom: "1px solid oklch(0.18 0.020 240)" }}
      >
        {label}
      </p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span style={{ color: "oklch(0.50 0.03 220)" }}>Orçado</span>
          <span className="font-semibold text-[12px]" style={{ color: "oklch(0.72 0.04 230)" }}>{formatBRL(orc.value)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: "oklch(0.50 0.03 220)" }}>Realizado</span>
          <span className="font-semibold text-[12px]" style={{ color: over ? "oklch(0.62 0.24 25)" : "oklch(0.68 0.22 145)" }}>
            {formatBRL(real.value)}
          </span>
        </div>
        <div
          className="flex justify-between items-center pt-2"
          style={{ borderTop: "1px solid oklch(0.18 0.020 240)" }}
        >
          <span style={{ color: "oklch(0.50 0.03 220)" }}>Variação</span>
          <span className="font-bold text-[12px]" style={{ color: over ? "oklch(0.62 0.24 25)" : "oklch(0.68 0.22 145)" }}>
            {over ? "+" : ""}{formatBRL(diff)}
            <span className="ml-1.5 text-[10px]">({over ? "+" : ""}{diffPct}%)</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: "oklch(0.50 0.03 220)" }}>Execução</span>
          <span className="font-bold text-[12px]" style={{ color: over ? "oklch(0.62 0.24 25)" : "oklch(0.75 0.20 185)" }}>
            {orc.value > 0 ? ((real.value / orc.value) * 100).toFixed(1) : "0.0"}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Custom Y-axis label — full name + execution % ─────────────
const CustomYTick = ({ x, y, payload }: any) => {
  const item = payload?.value ? null : null;
  return (
    <g transform={`translate(${x},${y})`}>
          <text
            x={-8}
            y={0}
            dy={4}
            textAnchor="end"
            fill="hsl(var(--foreground))"
            fontFamily="ui-monospace, monospace"
            fontSize={11}
            fontWeight={500}
          >
        {payload.value}
      </text>
    </g>
  );
};

function getPeriodFactor(year: number, month: number | null): number {
  if (month !== null) return month / 12;
  if (year === 2026) return 4 / 12;
  return 1;
}

export function BudgetChart({ year = 2026, month = null }: { year?: number; month?: number | null }) {
  const factor = getPeriodFactor(year, month);
  const budgetFactor = month !== null ? month / 12 : (year === 2026 ? 4 / 12 : 1);

  const data = COST_CENTERS.map(c => {
    const orc  = Math.round(getTotalBudgeted(c) * budgetFactor);
    const real = Math.round(getTotalRealized(c) * factor);
    return {
      name:      c.name,
      Orçado:    orc,
      Realizado: real,
      color:     COLORS[c.id] ?? "oklch(0.60 0.08 240)",
      over:      real > orc,
      exec:      orc > 0 ? ((real / orc) * 100).toFixed(0) + "%" : "—",
    };
  });

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        boxShadow: "0 4px 20px hsl(0 0% 0% / 0.08)",
      }}
    >
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 mb-5">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-3 rounded-sm"
            style={{ background: "transparent", border: "1.5px solid oklch(0.75 0.20 185 / 0.60)" }}
          />
          <span className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.03 220)" }}>Orçado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded-sm" style={{ background: "oklch(0.75 0.20 185 / 0.85)" }} />
          <span className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.03 220)" }}>Realizado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: "oklch(0.62 0.24 25 / 0.85)" }} />
          <span className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.03 220)" }}>Realizado acima do orçado</span>
        </div>
        <div className="ml-auto text-[9px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.38 0.03 220)" }}>
          Passe o mouse para detalhes
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          layout="vertical"
          data={data}
          barCategoryGap="30%"
          barGap={3}
          margin={{ top: 0, right: 90, bottom: 0, left: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="oklch(0.75 0.20 185 / 0.05)"
            horizontal={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={148}
            tick={<CustomYTick />}
            axisLine={false}
            tickLine={false}
          />
          <XAxis
            type="number"
            tickFormatter={v => fmtShort(v)}
            tick={{ fontSize: 9, fill: "oklch(0.40 0.03 220)", fontFamily: "ui-monospace, monospace" }}
            axisLine={{ stroke: "oklch(0.22 0.025 240)" }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(0.75 0.20 185 / 0.04)" }} />

          {/* Orçado — translucent outline bar */}
          <Bar dataKey="Orçado" radius={[0, 3, 3, 0]}>
            {data.map((d, i) => (
            <Cell
                key={`o-${i}`}
                fill="transparent"
                stroke={d.color}
                strokeWidth={1.5}
                strokeOpacity={0.75}
              />
            ))}
          </Bar>

          {/* Realizado — solid filled bar with value label */}
          <Bar dataKey="Realizado" radius={[0, 3, 3, 0]}>
            {data.map((d, i) => (
              <Cell
                key={`r-${i}`}
                fill={d.over ? "oklch(0.62 0.24 25)" : d.color}
                fillOpacity={0.85}
              />
            ))}
            <LabelList
              dataKey="Realizado"
              position="right"
              formatter={(v: number) => fmtShort(v)}
              style={{
                fontSize: 10,
                fontFamily: "ui-monospace, monospace",
                fill: "oklch(0.60 0.03 220)",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
