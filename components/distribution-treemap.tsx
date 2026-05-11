"use client";

import React, { useMemo, useState } from "react";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import {
  COST_CENTERS,
  getTotalRealized,
  getTotalBudgeted,
  formatBRL,
} from "@/lib/cost-centers";

type CenterId = (typeof COST_CENTERS)[number]["id"];

type CenterNode = {
  id: CenterId;
  name: string;
  realized: number;
  budgeted: number;
  share: number;
  varPct: number;
  fill: string;
  value: number;
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

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

type DonutArc = {
  startAngle: number;
  endAngle: number;
};

function donutSlicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  arc: DonutArc
) {
  const { startAngle, endAngle } = arc;

  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);

  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  // Outer arc (start -> end) then inner arc (end -> start) to close.
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

export function DistributionChart({
  year = 2026,
  month = null,
}: {
  year?: number;
  month?: number | null;
}) {
  const [activeId, setActiveId] = useState<CenterId>("LM");
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const factor = getPeriodFactor(year, month);
  const budgetFactor =
    month !== null ? month / 12 : year === 2026 ? 4 / 12 : 1;

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
        name: c.name ?? "Sem nome",
        realized,
        budgeted,
        share,
        varPct,
        fill: COLOR[c.id as CenterId] ?? "oklch(0.55 0.05 240)",
        value: realized,
      };
    });

    const sorted = (() => {
      if (sortKey === "value") {
        return [...raw].sort((a, b) => b.realized - a.realized);
      }
      if (sortKey === "pct") {
        return [...raw].sort((a, b) => b.share - a.share);
      }
      return [...raw].sort((a, b) => a.name.localeCompare(b.name));
    })();

    return { items: sorted, totalRealized: totalR };
  }, [factor, budgetFactor, sortKey]);

  const active = useMemo(
    () => items.find((i) => i.id === activeId) ?? items[0],
    [items, activeId]
  );

  // Donut geometry (fixed canvas; container scales via viewBox)
  const cx = 120;
  const cy = 120;
  const rOuter = 86;
  const rInner = 52;

  const arcs = useMemo(() => {
    let current = -90; // start at top
    const safeTotal = items.reduce((a, it) => a + Math.max(0, it.share), 0);
    const denom = safeTotal > 0 ? safeTotal : 1;

    return items.map((it) => {
      const sweep = (Math.max(0, it.share) / denom) * 360;
      const startAngle = current;
      const endAngle = current + sweep;
      current = endAngle;
      return {
        id: it.id,
        arc: { startAngle, endAngle },
      };
    });
  }, [items]);

  return (
    <div
      className="w-full rounded-2xl p-4 sm:p-5"
      style={{
        background: "#ffffff",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 14px 45px rgba(2, 6, 23, 0.08)",
      }}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Donut */}
        <div className="flex-1 lg:flex-[0_0_68%]">
          <div
            className="rounded-2xl overflow-hidden h-[320px] sm:h-[360px] lg:h-[430px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,249,255,0.65) 100%)",
            }}
          >
            <div className="relative w-full h-full">
              <svg
                viewBox="0 0 240 240"
                className="w-full h-full"
                role="img"
                aria-label="Distribuição do Custo Realizado"
                style={{
                  display: "block",
                }}
              >
                <defs>
                  {/* Subtle global shadow */}
                  <filter
                    id="donutShadow"
                    x="-40%"
                    y="-40%"
                    width="180%"
                    height="180%"
                  >
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                    <feOffset dx="0" dy="4" result="offsetBlur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.25" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="offsetBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Soft specular gradient used for front faces */}
                  <radialGradient id="specular" cx="30%" cy="25%" r="70%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                    <stop offset="35%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>

                {/* 4D extrusion layers */}
                {(() => {
                  const layers = 6;
                  const depthStep = 2.6;

                  return new Array(layers).fill(0).map((_, layerIdx) => {
                    const dy = layerIdx * depthStep;
                    const alpha = 0.55 - layerIdx * 0.06;

                    return (
                      <g
                        key={`layer-${layerIdx}`}
                        transform={`translate(0 ${dy})`}
                        opacity={alpha}
                      >
                        {arcs.map(({ id, arc }) => {
                          const it = items.find((x) => x.id === id);
                          if (!it) return null;
                          const isActive = id === activeId;

                          const rO = rOuter;
                          const rI = rInner;
                          const path = donutSlicePath(cx, cy, rO, rI, arc);

                          return (
                            <path
                              key={`${id}-${layerIdx}`}
                              d={path}
                              fill={it.fill}
                              stroke="rgba(255,255,255,0.28)"
                              strokeWidth={0.8}
                              strokeLinejoin="round"
                              filter={isActive ? "url(#donutShadow)" : undefined}
                            />
                          );
                        })}
                      </g>
                    );
                  });
                })()}

                {/* Front face */}
                {arcs.map(({ id, arc }) => {
                  const it = items.find((x) => x.id === id);
                  if (!it) return null;
                  const isActive = id === activeId;

                  const path = donutSlicePath(cx, cy, rOuter, rInner, arc);

                  // Connected segments illusion via tiny separators at stroke.
                  return (
                    <path
                      key={`front-${id}`}
                      d={path}
                      fill={it.fill}
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth={1.1}
                      strokeLinejoin="round"
                      style={{
                        cursor: "pointer",
                        transition: "transform 260ms ease, filter 260ms ease, opacity 260ms ease",
                        transformOrigin: `${cx}px ${cy}px`,
                        transform: isActive ? "translateY(-1px)" : "translateY(0px)",
                        filter: isActive ? "url(#donutShadow)" : undefined,
                        opacity: isActive ? 1 : 0.92,
                      }}
                      onMouseEnter={() => setActiveId(id)}
                      onFocus={() => setActiveId(id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${it.name}: ${it.share.toFixed(1)}% (${formatBRL(it.realized)})`}
                    />
                  );
                })}

                {/* Specular overlay for premium look */}
                <g style={{ pointerEvents: "none" }}>
                  {arcs.map(({ id, arc }) => {
                    const it = items.find((x) => x.id === id);
                    if (!it) return null;
                    const path = donutSlicePath(cx, cy, rOuter, rInner, arc);
                    return (
                      <path
                        key={`spec-${id}`}
                        d={path}
                        fill="url(#specular)"
                        opacity={id === activeId ? 0.95 : 0.75}
                      />
                    );
                  })}
                </g>

                {/* Center hole border refinement */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={rInner}
                  fill="white"
                  stroke="rgba(2,6,23,0.08)"
                  strokeWidth={1}
                />
              </svg>

              {/* Minimal center label (integrated, not a floating card) */}
              <div
                className="absolute inset-0 flex items-center justify-center flex-col"
                style={{
                  pointerEvents: "none",
                }}
              >
                <div className="text-center">
                  <div
                    className="text-[10px] font-mono uppercase tracking-wide"
                    style={{ color: MUTED, letterSpacing: "0.12em" }}
                  >
                    Total Realizado
                  </div>
                  <div className="mt-1 text-[14px] sm:text-[15px] font-mono font-bold text-slate-900">
                    {formatBRL(totalRealized)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono uppercase tracking-wide"
                style={{ color: MUTED }}
              >
                Total realizado
              </span>
              <span className="text-[12px] font-mono font-bold text-slate-900">
                {formatBRL(totalRealized)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[
                { k: "value" as SortKey, label: "Valor" },
                { k: "pct" as SortKey, label: "%" },
                { k: "name" as SortKey, label: "Nome" },
              ].map((x) => {
                const isSel = sortKey === x.k;
                return (
                  <button
                    key={x.k}
                    type="button"
                    onClick={() => setSortKey(x.k)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold transition"
                    style={{
                      background: isSel
                        ? "oklch(0.75 0.20 185 / 0.12)"
                        : "rgba(2,6,23,0.03)",
                      color: isSel ? "#0f172a" : "#334155",
                      border: `1px solid ${
                        isSel
                          ? "oklch(0.75 0.20 185 / 0.28)"
                          : BORDER
                      }`,
                    }}
                  >
                    {x.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ranking (all 8 cards) */}
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
                <p className="text-[12px] font-semibold text-gray-900">Participação</p>
              </div>

              {active && (
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl"
                  style={{ background: `${active.fill}14` }}
                >
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ background: active.fill }}
                  />
                </span>
              )}
            </div>

            <div className="mt-3 flex-1 overflow-hidden">
              <div
                className="flex flex-col gap-1.5"
                style={{
                  maxHeight: "100%",
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {items.map((it) => {
                  const isActive = it.id === activeId;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onMouseEnter={() => setActiveId(it.id)}
                      onFocus={() => setActiveId(it.id)}
                      className="w-full text-left rounded-xl p-2 transition"
                      style={{
                        border: `1px solid ${
                          isActive
                            ? "oklch(0.75 0.20 185 / 0.28)"
                            : BORDER
                        }`,
                        background: isActive ? "rgba(2,6,23,0.03)" : "#ffffff",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="inline-flex h-2 w-2 rounded-full mt-[2px]"
                            style={{ background: it.fill }}
                          />
                          <p className="text-[12px] font-semibold text-gray-900 truncate">
                            {it.name}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[12px] font-semibold font-mono text-gray-900 leading-none">
                            {it.share.toFixed(1)}%
                          </p>
                          <p
                            className="text-[10px] font-mono leading-none mt-1"
                            style={{ color: MUTED }}
                          >
                            {formatBRL(it.realized)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-1">
                        <TrendBadge variancePct={it.varPct} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2">
              <p className="text-[10px] font-mono" style={{ color: MUTED }}>
                Participação total baseada no realizado do período.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

