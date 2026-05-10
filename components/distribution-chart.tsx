"use client";

import React, { useMemo, useState, useCallback } from "react";
import { ResponsiveContainer } from "recharts";
import { DistributionChart as DistributionTreemap } from "@/components/distribution-treemap";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import {
  COST_CENTERS,
  getTotalRealized,
  getTotalBudgeted,
  formatBRL,
} from "@/lib/cost-centers";

type CenterId = (typeof COST_CENTERS)[number]["id"];

type SortKey = "value" | "pct" | "name";

// Índices oficiais (Depreciação sempre por último)
const ORDER: CenterId[] = [
  "LM" as CenterId,
  "BEN" as CenterId,
  "INS" as CenterId,
  "MA" as CenterId,
  "ADM" as CenterId,
  "MAN" as CenterId,
  "LOG" as CenterId,
  "DEP" as CenterId,
];

// Cores executivas (coerentes com o dashboard atual)
const COLOR = {
  LM: "oklch(0.75 0.20 185)", // teal-ish
  BEN: "oklch(0.68 0.20 145)", // green-cyan
  INS: "oklch(0.75 0.22 55)",  // yellow-miner
  MA: "oklch(0.70 0.20 155)",  // green
  ADM: "oklch(0.72 0.20 295)", // purple
  MAN: "oklch(0.74 0.20 190)", // ciano metálico
  LOG: "oklch(0.76 0.20 45)",  // blue petróleo (aprox)
  DEP: "oklch(0.55 0.05 240)", // grafite
} satisfies Record<CenterId, string>;

const BORDER = "oklch(0.18 0.018 240 / 0.35)";
const CARD = "hsl(var(--card))";
const MUTED = "oklch(0.42 0.03 220)";

function getPeriodFactor(year: number, month: number | null): number {
  if (month !== null) return month / 12;
  if (year === 2026) return 4 / 12;
  return 1;
}

function pct(n: number, d: number) {
  if (d <= 0) return 0;
  return (n / d) * 100;
}

function getVariancePct(budgeted: number, realized: number) {
  if (budgeted === 0) return 0;
  return ((realized - budgeted) / budgeted) * 100;
}

function TrendBadge({ variancePct }: { variancePct: number }) {
  const over = variancePct > 0.5;
  const under = variancePct < -0.5;
  const Icon = over ? TrendingUp : under ? TrendingDown : Minus;
  const color = over
    ? "oklch(0.65 0.22 25)"
    : under
      ? "oklch(0.68 0.22 145)"
      : "oklch(0.48 0.03 220)";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold"
      style={{
        color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 28%, transparent)`,
      }}
    >
      <Icon className="h-3 w-3" />
      {variancePct > 0 ? "+" : ""}
      {variancePct.toFixed(1)}%
    </span>
  );
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtShortPercent(p: number) {
  if (!isFinite(p)) return "0%";
  return `${p.toFixed(0)}%`;
}

export function DistributionChart({
  year = 2026,
  month = null,
}: {
  year?: number;
  month?: number | null;
}) {
  return (
    <DistributionTreemap year={year} month={month} />
  );
}


