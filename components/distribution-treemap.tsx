"use client";

import React, { useMemo, useState, useCallback } from "react";
import { ResponsiveContainer, Treemap } from "recharts";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { COST_CENTERS, getTotalRealized, getTotalBudgeted, formatBRL } from "@/lib/cost-centers";

type CenterId = (typeof COST_CENTERS)[number]["id"];

type CenterNode = {
  id: CenterId;
  name: string;
  realized: number;
  budgeted: number;
  share: number; // % of total realized
  varPct: number; // % variance (realizado - orcado) / orcado
  fill: string;
  value: number; // alias for treemap
};

type SortKey = "value" | "pct" | "name";

const COLOR = {
  LM: "oklch(0.75 0.20 185)",
  BEN: "oklch(0.68 0.20 145)",
  INS: "oklch(0.75 0.22 55)",
  MA: "oklch(0.70 0.20 155)",
  ADM: "oklch(0.72 0.20 295)",
  MAN: "oklch(0.74 0.20 190)",
  LOG: "oklch(0.76 0.20 45)",
  DEP: "oklch(0.55 0.05 240)",
} satisfies Record<CenterId, string>;

const BORDER = "oklch(0.18 0.018 240 / 0.35)";
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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
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

function TreemapTileLabel({
  x,
  y,
  width,
  height,
  payload,
}: any) {
  const node = payload as CenterNode;
  const show = width > 120 && height > 46;
  if (!show) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        ry={10}
        fill="transparent"
      />
      <text
        x={x + 10}
        y={y + 18}
        fontSize={12}
        fontWeight={700}
        fill="#0f172a"
        style={{ letterSpacing: "-0.01em" }}
      >
        {node.name}
      </text>
      <text
        x={x + 10}
        y={y + 36}
        fontSize={11}
        fontWeight={600}
        fill={"#111827"}
      >
        {formatBRL(node.realized)}
      </text>
      <text
        x={x + 10}
        y={y + height - 14}
        fontSize={10}
        fontWeight={700}
        fill={"#334155"}
      >
        {node.share.toFixed(1)}%
      </text>
    </g>
  );
}

export function DistributionChart({
  year = 2026,
  month = null,
}: {
  year?: number;
  month?: number | null;
}) {
  const [activeId, setActiveId] = useState<CenterId>("LM" as CenterId);
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const factor = getPeriodFactor(year, month);
  const budgetFactor = month !== null ? month / 12 : year === 2026 ? 4 / 12 : 1;

  const { items, totalRealized } = useMemo(() => {
    const totalR = Math.round(
      COST_CENTERS.reduce((a, c) => a + getTotalRealized(c), 0) * factor
    );

    const raw: CenterNode[] = COST_CENTERS.map((c) => {
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
        value: realized,
      };
    });

    const sorted = (() => {
      if (sortKey === "value") return [...raw].sort((a, b) => b.realized - a.realized);
      if (sortKey === "pct") return [...raw].sort((a, b) => b.share - a.share);
      return [...raw].sort((a, b) => a.name.localeCompare(b.name));
    })();

    return { items: sorted, totalRealized: totalR };
  }, [factor, budgetFactor, sortKey]);

  const active = useMemo(() => items.find((i) => i.id === activeId) ?? items[0], [items, activeId]);

  const treeData = useMemo(() => {
    return {
      name: "root",
      children: items.map((i) => ({ ...i })),
    };
  }, [items]);



  return (
    <div
      className="w-full rounded-2xl p-4 sm:p-5"
      style={{
        background: "#ffffff",
        border: `1px solid ${BORDER}`,
        boxShadow:
          "0 14px 45px rgba(2, 6, 23, 0.08), 0 0 0 1px rgba(255,255,255,0.65) inset",
      }}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* TREEMAP (premium, high-density) */}
        <div className="flex-1 lg:flex-[0_0_68%]">
          <div
            className="rounded-2xl overflow-hidden h-[320px] sm:h-[360px] lg:h-[430px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,249,255,0.65) 100%)",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.55) inset, 0 18px 55px rgba(2, 6, 23, 0.06)",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treeData as any}
                dataKey="value"
                ratio={4 / 3}
                stroke="rgba(255,255,255,0.98)"
                fill="transparent"
                strokeWidth={2}
                animationDuration={520}
                isAnimationActive
                onClick={(d: any) => {
                  const id = d?.payload?.id as CenterId | undefined;
                  if (id) setActiveId(id);
                }}
                // @ts-expect-error Recharts content typing for Treemap is incompatible with our payload shape.
                content={({ x, y, width, height, payload }: any) => {
                  const node = payload as CenterNode;
                  const isActive = node?.id === activeId;
                  const bg = node?.fill ?? "oklch(0.55 0.05 240)";

                  // Enforce premium density: render border/label only when there is enough real estate
                  const canRender = width > 40 && height > 28;
                  if (!canRender) return null;

                  return (
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={12}
                        ry={12}
                        fill="transparent"
                      />
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={12}
                        ry={12}
                        fill={bg}
                        opacity={isActive ? 0.22 : 0.14}
                        stroke={isActive ? "#0f172a" : "#ffffff"}
                        strokeOpacity={isActive ? 0.28 : 0.95}
                        strokeWidth={isActive ? 1.6 : 2}
                      />

                      <TreemapTileLabel
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        payload={node}
                      />
                    </g>
                  );
                }}
              />
            </ResponsiveContainer>
          </div>

          {/* Linha executiva compacta */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono uppercase tracking-wide"
                style={{ color: MUTED }}
              >
                Total realizado
              </span>
              <span className="text-[12px] font-mono font-bold" style={{ color: "#0f172a" }}>
                {formatBRL(totalRealized)}
              </span>
            </div>

            {/* Sort (minimal chrome) */}
            <div className="flex items-center gap-1">
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
                    className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold transition"
                    style={{
                      background: isSel
                        ? "oklch(0.75 0.20 185 / 0.12)"
                        : "rgba(2,6,23,0.03)",
                      color: isSel ? "#0f172a" : "#334155",
                      border: `1px solid ${
                        isSel ? "oklch(0.75 0.20 185 / 0.28)" : BORDER
                      }`,
                      boxShadow: isSel
                        ? "0 0 18px oklch(0.75 0.20 185 / 0.14)"
                        : "none",
                    }}
                    aria-pressed={isSel}
                  >
                    {x.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ranking lateral compact (sem card gigante) */}
        <div className="flex-1 lg:flex-[0_0_32%]">
          <div
            className="rounded-2xl p-3 sm:p-4 h-[320px] sm:h-[360px] lg:h-[430px] flex flex-col"
            style={{
              border: `1px solid ${BORDER}`,
              background:
                "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,249,255,0.65) 100%)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p
                  className="text-[10px] font-mono uppercase tracking-wide"
                  style={{ color: "#111827" }}
                >
                  Ranking
                </p>
                <p className="text-[12px] font-semibold text-gray-900">
                  Participação
                </p>
              </div>

              {active ? (
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl"
                  style={{ background: `${active.fill}14` }}
                >
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ background: active.fill }}
                  />
                </span>
              ) : null}
            </div>

            {active ? (
              <div
                className="mt-3 rounded-2xl p-3"
                style={{ background: "rgba(2,6,23,0.02)", border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-gray-900 truncate">
                      {active.name}
                    </p>
                    <p className="text-[11px] font-mono" style={{ color: MUTED }}>
                      {formatBRL(active.realized)} • {active.share.toFixed(1)}%
                    </p>
                  </div>
                  <TrendBadge variancePct={active.varPct} />
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex-1 overflow-hidden">
              <div className="flex flex-col gap-1.5 h-full">
                {items.slice(0, 7).map((it) => {
                  const isActive = it.id === activeId;
                  return (
                    <button
                      key={it.id}
                      onMouseEnter={() => setActiveId(it.id)}
                      className="w-full text-left rounded-xl p-2 transition"
                      style={{
                        border: `1px solid ${
                          isActive ? "oklch(0.75 0.20 185 / 0.28)" : BORDER
                        }`,
                        background: isActive ? "rgba(2,6,23,0.03)" : "#ffffff",
                        boxShadow: isActive
                          ? `0 0 18px ${it.fill}18`
                          : "none",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
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
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Micro-legend (no big “Insight”) */}
            <div className="mt-2">
              <p className="text-[10px] font-mono" style={{ color: MUTED }}>
                Participação total = percentual sobre o realizado do período.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


