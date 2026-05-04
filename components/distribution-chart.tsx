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
  LM: "oklch(0.72 0.20 185)",
  BEN: "oklch(0.68 0.22 145)",
  INS: "oklch(0.72 0.20 55)",
  MA: "oklch(0.65 0.18 160)",
  ADM: "oklch(0.70 0.20 295)",
  LOG: "oklch(0.68 0.20 220)",
  DEP: "oklch(0.62 0.10 240)",
};

function toHex(oklch: string): string {
  const MAP: Record<string, string> = {
    "oklch(0.72 0.20 185)": "#00c4b0",
    "oklch(0.68 0.22 145)": "#22c55e",
    "oklch(0.72 0.20 55)": "#f59e0b",
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
        fill="#94a3b8"
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
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
        fill: toHex(AREA_COLORS[c.id] ?? "oklch(0.60 0.08 240)"),
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
    <div className="rounded-lg p-5">
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              dataKey="value"
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {sortedData.map((entry) => (
                <Cell key={entry.id} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}