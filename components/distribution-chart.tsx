"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
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
  LM: "hsl(var(--chart-1))",
  BEN: "hsl(var(--chart-2))",
  INS: "hsl(var(--chart-3))",
  MA: "hsl(var(--chart-4))",
  ADM: "hsl(var(--chart-5))",
  LOG: "hsl(var(--primary))",
  DEP: "hsl(var(--secondary))",
};

function toHex(color: string): string {
  // Tailwind hsl to hex fallback
  if (color.startsWith('hsl(var(')) return color;
  // old oklch map if needed
  const MAP = {
    "#00c4b0": "#00c4b0",
    "#22c55e": "#22c55e",
    // ... 
  };
  return color;
}

type SortKey = "value" | "name" | "pct" | "variance";

function getPeriodFactor(year: number, month: number | null): number {
  if (month !== null) return month / 12;
  if (year === 2026) return 4 / 12;
  return 1;
}

// Active sector renderer
const renderActiveShape = (props: any) => {
  const {
    cx, cy,
    innerRadius, outerRadius,
    startAngle, endAngle,
    fill,
    payload,
    percent,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 13}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.35}
      />
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill={fill}
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={10}
        fill="hsl(var(--muted-foreground))"
      >
        {formatBRL(payload.value)}
      </text>
      <text
        x={cx}
        y={cy + 19}
        textAnchor="middle"
        fontSize={11}
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const factor = getPeriodFactor(year, month);
  const budgetFactor = month !== null ? month / 12 : year === 2026 ? 4 / 12 : 1;

  const totalRealized = Math.round(
    COST_CENTERS.reduce((a, c) => a + getTotalRealized(c), 0) * factor
  );

  const totalBudgeted = Math.round(
    COST_CENTERS.reduce((a, c) => a + getTotalBudgeted(c), 0) * budgetFactor
  );

  const rawData = useMemo(() =>
    COST_CENTERS.map(c => {
      const realized = Math.round(getTotalRealized(c) * factor);
      const budgeted = Math.round(getTotalBudgeted(c) * budgetFactor);

      return {
        id: c.id,
        name: c.name,
        value: realized,
        budgeted,
        pct: totalRealized > 0 ? (realized / totalRealized) * 100 : 0,
        varPct: budgeted > 0 ? ((realized - budgeted) / budgeted) * 100 : 0,
        fill: toHex(AREA_COLORS[c.id] ?? "hsl(var(--muted))"),
        isOver: realized > budgeted,
      };
    }),
    [factor, budgetFactor, totalRealized]
  );

  const sortedData = useMemo(() => {
    const d = [...rawData];
    if (sortKey === "value") d.sort((a, b) => b.value - a.value);
    if (sortKey === "name") d.sort((a, b) => a.name.localeCompare(b.name));
    if (sortKey === "pct") d.sort((a, b) => b.pct - a.pct);
    if (sortKey === "variance") d.sort((a, b) => b.varPct - a.varPct);
    return d;
  }, [rawData, sortKey]);

  const globalVarPct =
    totalBudgeted > 0
      ? ((totalRealized - totalBudgeted) / totalBudgeted) * 100
      : 0;

  return (
    <div className="rounded-xl p-6 shadow-lg border" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", boxShadow: "0 8px 32px hsl(0 0% 0% / 0.12)" }}>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {sortedData.map((entry, i) => (
                <linearGradient key={`glow-${i}`} id={`glow-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={entry.fill} stopOpacity="1"/>
                  <stop offset="50%" stopColor={entry.fill} stopOpacity="0.8"/>
                  <stop offset="100%" stopColor={entry.fill} stopOpacity="0.6"/>
                </linearGradient>
              ))}
              <radialGradient id="inner-glow" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4"/>
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>
            <Pie
              data={sortedData}
              cx={150}
              cy={150}
              innerRadius={70}
              outerRadius={95}
              dataKey="value"
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index as number)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#glow-${index})`} stroke="hsl(var(--foreground))" strokeWidth={2}/>
              ))}
            </Pie>
            <Sector cx={150} cy={150} innerRadius={0} outerRadius={70} startAngle={0} endAngle={360} fill="url(#inner-glow)"/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between mt-6 p-3 bg-muted/50 rounded-lg">
        <span className="text-xs font-semibold text-muted-foreground">Ordenar:</span>
        <div className="flex gap-1">
          {(['value', 'pct', 'name', 'variance'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className="px-3 py-1.5 text-xs font-mono rounded-md transition-all capitalize"
              style={{
                backgroundColor: sortKey === key ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                color: sortKey === key ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
              }}
            >
              {key === 'pct' ? '%' : key === 'variance' ? 'Var' : key === 'value' ? 'Valor' : 'Nome'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
