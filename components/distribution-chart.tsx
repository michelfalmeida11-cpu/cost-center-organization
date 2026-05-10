"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
} from "recharts";
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
  const [activeId, setActiveId] = useState<CenterId | null>("LM" as CenterId);
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const factor = getPeriodFactor(year, month);
  const budgetFactor = month !== null ? month / 12 : year === 2026 ? 4 / 12 : 1;

  const data = useMemo(() => {
    const totalR = Math.round(
      COST_CENTERS.reduce((a, c) => a + getTotalRealized(c), 0) * factor
    );
    const totalB = Math.round(
      COST_CENTERS.reduce((a, c) => a + getTotalBudgeted(c), 0) * budgetFactor
    );

    const raw = COST_CENTERS.map((c) => {
      const realized = Math.round(getTotalRealized(c) * factor);
      const budgeted = Math.round(getTotalBudgeted(c) * budgetFactor);
      const share = pct(realized, totalR);
      const varPct = getVariancePct(budgeted, realized);

      return {
        id: c.id as CenterId,
        name: c.name,
        realized,
        budgeted,
        share,
        varPct,
        fill: COLOR[c.id as CenterId] ?? "oklch(0.55 0.05 240)",
      };
    });

    // Ordenação: mantém ordem oficial por padrão; permite sort alternar.
    const ordered = [...raw].sort((a, b) => {
      const ia = ORDER.indexOf(a.id);
      const ib = ORDER.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      return a.id.localeCompare(b.id);
    });

    const sorted = (() => {
      if (sortKey === "value") return [...ordered].sort((a, b) => b.realized - a.realized);
      if (sortKey === "pct") return [...ordered].sort((a, b) => b.share - a.share);
      return [...ordered].sort((a, b) => a.name.localeCompare(b.name));
    })();

    const active = activeId ? raw.find((r) => r.id === activeId) ?? raw[0] : raw[0];

    return {
      totalRealized: totalR,
      totalBudgeted: totalB,
      globalVarPct: totalB > 0 ? getVariancePct(totalB, totalR) : 0,
      items: sorted,
      active,
      activeShare: active ? active.share : 0,
    };
  }, [factor, budgetFactor, sortKey, activeId]);

  const donutCenterText = useMemo(() => {
    const active = data.active;
    const activeVar = active ? getVariancePct(active.budgeted, active.realized) : 0;
    return {
      total: data.totalRealized,
      totalCenters: ORDER.length,
      indicatorLabel: active ? active.name : "—",
      indicatorVar: activeVar,
    };
  }, [data]);

  const onSelect = useCallback(
    (id: CenterId) => {
      setActiveId(id);
    },
    [setActiveId]
  );

  // Tooltip custom (premium, consistente)
  const TooltipLayer = useCallback(
    ({ entry }: { entry: (typeof data.items)[number] }) => {
      const comparison = entry.budgeted > 0
        ? getVariancePct(entry.budgeted, entry.realized)
        : 0;
      const over = comparison > 0.5;

      return (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "#ffffff",
            border: `1px solid ${BORDER}`,
            boxShadow:
              "0 18px 55px rgba(2, 6, 23, 0.18), 0 0 0 1px rgba(255,255,255,0.6) inset",
            minWidth: 260,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="inline-flex h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: entry.fill, boxShadow: `0 0 18px ${entry.fill}55` }}
              />
              <p className="text-[12px] font-semibold text-gray-900 truncate">{entry.name}</p>
            </div>
            <span
              className="text-[12px] font-mono font-bold"
              style={{ color: over ? "oklch(0.65 0.22 25)" : "oklch(0.68 0.22 145)" }}
            >
              {over ? "+" : ""}{comparison.toFixed(1)}%
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wide" style={{ color: "#374151" }}>
                Realizado
              </p>
              <p className="text-[13px] font-semibold font-mono text-gray-900">{formatBRL(entry.realized)}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wide" style={{ color: "#374151" }}>
                Participação
              </p>
              <p className="text-[13px] font-semibold font-mono text-gray-900">{entry.share.toFixed(1)}%</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-mono uppercase tracking-wide" style={{ color: "#374151" }}>
                Orçamento vs Realizado
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[12px] font-mono" style={{ color: "#111827" }}>
                  {formatBRL(entry.budgeted)}
                </span>
                <span className="text-[12px] font-mono" style={{ color: over ? "oklch(0.65 0.22 25)" : "oklch(0.68 0.22 145)" }}>
                  {formatBRL(entry.realized)}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    },
    []
  );

  // Para não usar biblioteca extra e ficar 100% fiel ao Recharts, a tooltip premium será renderizada via legenda (hover)
  // e o hover do donut controla activeId.

  const active = data.active;

  const centerLabelColor = active ? active.fill : COLOR.DEP;

  const donutItems = data.items;

  // Recharts <Pie> usa values numéricos. Garantimos que "realized" seja number.
  const pieData = donutItems.map((d) => ({
    ...d,
    realized: Number(d.realized),
    budgeted: Number(d.budgeted),
    share: Number(d.share),
    varPct: Number(d.varPct),
  }));

  return (

    <div
      className="w-full rounded-xl p-5"
      style={{
        background: "#ffffff",
        border: `1px solid ${BORDER}`,
        boxShadow:
          "0 14px 45px rgba(2, 6, 23, 0.08), 0 0 0 1px rgba(255,255,255,0.65) inset",
      }}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* LEFT: DONUT */}
        <div className="flex-1 lg:flex-[0_0_55%]">
          <div className="relative rounded-2xl p-3" style={{ background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(236,253,245,0.35) 100%)" }}>
            <div className="relative" style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {donutItems.map((d, i) => (
                      <linearGradient
                        key={`g-${d.id}-${i}`}
                        id={`g-${d.id}-${i}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={d.fill} stopOpacity={1} />
                        <stop offset="45%" stopColor={d.fill} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={d.fill} stopOpacity={0.65} />
                      </linearGradient>
                    ))}
                    <radialGradient id="hud-glow" cx="50%" cy="50%" r="70%">
                      <stop offset="0%" stopColor={centerLabelColor} stopOpacity={0.28} />
                      <stop offset="45%" stopColor={centerLabelColor} stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </radialGradient>
                  </defs>

                  {/* fundo */}
                  <Sector
                    cx={0}
                    cy={0}
                    innerRadius={0}
                    outerRadius={160}
                    startAngle={0}
                    endAngle={360}
                    fill="url(#hud-glow)"
                  />

                  <Pie
                    data={pieData}
                    dataKey="realized"

                    cx="50%"
                    cy="50%"
                    innerRadius={86}
                    outerRadius={128}
                    paddingAngle={4}
                    cornerRadius={8}
                    isAnimationActive
                    animationDuration={650}
                    activeIndex={active ? donutItems.findIndex((x) => x.id === active.id) : 0}
                    activeShape={(props: any) => {
                      const {
                        cx,
                        cy,
                        innerRadius,
                        outerRadius,
                        startAngle,
                        endAngle,
                        fill,
                        payload,
                      } = props;

                      const r2 = clamp(outerRadius + 8, 0, 9999);

                      return (
                        <g>
                          <Sector
                            cx={cx}
                            cy={cy}
                            innerRadius={innerRadius + 2}
                            outerRadius={r2}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={fill}
                          />
                          <Sector
                            cx={cx}
                            cy={cy}
                            innerRadius={outerRadius - 2}
                            outerRadius={outerRadius + 18}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={fill}
                            opacity={0.16}
                          />
                        </g>
                      );
                    }}
                    onMouseEnter={(_, index) => {
                      const item = donutItems[index as number];
                      if (item) onSelect(item.id);
                    }}
                    onMouseLeave={() => {
                      // mantém o último selecionado (enterprise behavior)
                    }}
                  >
                    {donutItems.map((d) => {
                      const isActive = active?.id === d.id;
                      return (
                        <Cell
                          key={d.id}
                          fill={`url(#g-${d.id}-${donutItems.findIndex((x) => x.id === d.id)})`}
                          stroke="#ffffff"
                          strokeWidth={2}
                          style={{
                            transition: "transform 220ms ease, filter 220ms ease",
                            transformOrigin: "center",
                            transform: isActive ? "scale(1.015)" : "scale(1)",
                            filter: isActive ? `drop-shadow(0 0 14px ${d.fill}55)` : "none",
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center panel */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="text-center rounded-2xl px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    border: `1px solid ${BORDER}`,
                    boxShadow: `0 0 0 1px rgba(255,255,255,0.7) inset, 0 12px 30px rgba(2,6,23,0.06)`,
                    backdropFilter: "blur(4px)",
                    width: "58%",
                    maxWidth: 300,
                  }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-wide font-semibold" style={{ color: "#374151" }}>
                    Total realizado
                  </p>
                  <p className="text-[20px] font-semibold font-mono text-gray-900 mt-1 leading-none">
                    {formatBRL(donutCenterText.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* ranking overlay (small hint) */}
            <div className="mt-3 flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ background: active?.fill ?? COLOR.DEP, boxShadow: `0 0 18px ${(active?.fill ?? COLOR.DEP)}55` }} />
                <p className="text-[12px] font-semibold text-gray-900">{active?.name ?? "—"}</p>
              </div>
              <p className="text-[12px] font-mono font-semibold" style={{ color: "#111827" }}>
                {active ? active.share.toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: ANALYTICS */}
        <div className="flex-1 lg:flex-[0_0_45%]">
          <div className="rounded-2xl p-4" style={{ border: `1px solid ${BORDER}`, background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,249,255,0.65) 100%)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wide" style={{ color: "#111827" }}>
                  Painel executivo
                </p>
                <p className="text-[12px] font-semibold text-gray-900">Ranking por participação</p>
              </div>

              <div className="flex gap-2">
                {([
                  { k: "value", label: "Valor" },
                  { k: "pct", label: "%" },
                  { k: "name", label: "Nome" },
                ] as const).map((x) => {
                  const isSel = sortKey === x.k;
                  return (
                    <button
                      key={x.k}
                      onClick={() => setSortKey(x.k)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition"
                      style={{
                        background: isSel ? "oklch(0.75 0.20 185 / 0.12)" : "rgba(2,6,23,0.04)",
                        color: isSel ? "#0f172a" : "#334155",
                        border: `1px solid ${isSel ? "oklch(0.75 0.20 185 / 0.28)" : BORDER}`,
                        boxShadow: isSel ? "0 0 18px oklch(0.75 0.20 185 / 0.18)" : "none",
                      }}
                    >
                      {x.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              {active && (
                <div className="mb-3">
                  <div className="rounded-2xl p-3" style={{ background: "rgba(2,6,23,0.02)", border: `1px solid ${BORDER}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex h-3 w-3 rounded-full" style={{ background: active.fill, boxShadow: `0 0 18px ${active.fill}55` }} />
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-gray-900 truncate">{active.name}</p>
                          <p className="text-[11px] font-mono" style={{ color: MUTED }}>
                            {formatBRL(active.realized)} • {active.share.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <TrendBadge variancePct={active.varPct} />
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: "#374151" }}>
                          Orçado
                        </span>
                        <span className="text-[11px] font-mono font-semibold" style={{ color: "#111827" }}>
                          {formatBRL(active.budgeted)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(2,6,23,0.06)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${clamp(active.share, 0, 100)}%`,
                            background: active.fill,
                            boxShadow: `0 0 18px ${active.fill}55`,
                            transition: "width 420ms ease",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {data.items.slice(0, 8).map((it, idx) => {
                  const isActive = active?.id === it.id;
                  return (
                    <button
                      key={it.id}
                      onMouseEnter={() => onSelect(it.id)}
                      className="w-full text-left rounded-2xl p-2 transition"
                      style={{
                        border: `1px solid ${isActive ? "oklch(0.75 0.20 185 / 0.28)" : BORDER}`,
                        background: isActive ? "rgba(2,6,23,0.03)" : "#ffffff",
                        boxShadow: isActive ? `0 0 18px ${it.fill}20` : "none",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="inline-flex h-2 w-2 rounded-full mt-[2px]"
                            style={{ background: it.fill, boxShadow: `0 0 14px ${it.fill}55` }}
                          />
                          <p className="text-[12px] font-semibold text-gray-900 truncate">
                            {it.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-semibold font-mono text-gray-900 leading-none">
                            {it.share.toFixed(1)}%
                          </p>
                          <p className="text-[10px] font-mono leading-none mt-1" style={{ color: MUTED }}>
                            {formatBRL(it.realized)}
                          </p>
                        </div>
                      </div>

                      <div
                        className="mt-2 h-[6px] rounded-full overflow-hidden"
                        style={{ background: "rgba(2,6,23,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${clamp(it.share, 0, 100)}%`,
                            background: it.fill,
                            transition: "width 420ms ease",
                            boxShadow: `0 0 14px ${it.fill}55`,
                          }}
                        />
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: "#374151" }}>
                          Var.
                        </span>
                        <span
                          className="text-[11px] font-mono font-bold"
                          style={{
                            color:
                              it.varPct >= 0
                                ? "oklch(0.65 0.22 25)"
                                : "oklch(0.68 0.22 145)",
                          }}
                        >
                          {it.varPct >= 0 ? "+" : ""}{it.varPct.toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Tooltip premium via painel lateral (enterprise-like) */}
                <div className="mt-3">
                  <div className="rounded-2xl p-3" style={{ border: `1px solid ${BORDER}`, background: "rgba(2,6,23,0.02)" }}>
                    <p className="text-[11px] font-mono uppercase tracking-wide" style={{ color: "#111827" }}>
                      Insight
                    </p>
                    <p className="text-[12px] font-semibold text-gray-900 mt-1">
                      {active ? `A fatia ${active.name} lidera com ${active.share.toFixed(1)}% do custo realizado.` : "—"}
                    </p>
                    <p className="text-[11px] font-mono mt-2" style={{ color: MUTED }}>
                      Comparação: orçamento {active ? formatBRL(active.budgeted) : "—"} → realizado {active ? formatBRL(active.realized) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* mobile: stacks naturally due flex-col */}
      <div className="mt-4 hidden lg:block" />
    </div>
  );
}

