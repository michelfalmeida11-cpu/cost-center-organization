"use client";

import React, { useMemo, useState } from "react";

import {
  Process,
  getProcessRealized,
  getProcessBudgeted,
  formatBRL,
} from "@/lib/cost-centers";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";

type CenterId = Process["id"];

type CenterNode = {
  id: CenterId;
  name: string;
  realized: number;
  budgeted: number;
  share: number;
  varPct: number;
  fill: string;
};

type SortKey = "value" | "pct" | "name";

// Executivo/premium palette (coerente com o layout atual)
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
  processes,
}: {
  year?: number;
  month?: number | null;
  processes: Process[];
}) {
  const [activeId, setActiveId] = useState<CenterId | null>(processes[0]?.id ?? "LM");
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const factor = getPeriodFactor(year, month);
  const budgetFactor = month !== null ? month / 12 : year === 2026 ? 4 / 12 : 1;

  const { items, totalRealized, totalBudgeted } = useMemo(() => {
    const totalR = processes.reduce((a, p) => a + getProcessRealized(p), 0) * factor;
    const totalB = processes.reduce((a, p) => a + getProcessBudgeted(p), 0) * budgetFactor;

    const raw: CenterNode[] = processes.map((p) => {
      const realized = Math.round(getProcessRealized(p) * factor);
      const budgeted = Math.round(getProcessBudgeted(p) * budgetFactor);
      const share = pct(realized, Math.round(totalR));
      const varPct = getVariancePct(budgeted, realized);

      return {
        id: p.id,
        name: p.name ?? "Sem nome",
        realized,
        budgeted,
        share,
        varPct,
        fill: COLOR[p.id] ?? "oklch(0.55 0.05 240)",
      };
    });

    const sorted = (() => {
      if (sortKey === "value") return [...raw].sort((a, b) => b.realized - a.realized);
      if (sortKey === "pct") return [...raw].sort((a, b) => b.share - a.share);
      return [...raw].sort((a, b) => a.name.localeCompare(b.name));
    })();

    return {
      items: sorted,
      totalRealized: Math.round(totalR),
      totalBudgeted: Math.round(totalB),
    };
  }, [factor, budgetFactor, sortKey, processes]);

  const active = useMemo(() => {
    if (!activeId) return null;
    return items.find((i) => i.id === activeId) ?? null;
  }, [items, activeId]);

  const maiorCentro = useMemo(() => {
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.realized - a.realized)[0] ?? null;
  }, [items]);

  const overallVarPct = useMemo(
    () => getVariancePct(totalBudgeted, totalRealized),
    [totalBudgeted, totalRealized]
  );

  // Geometry
  const cx = 120;
  const cy = 120;
  const rOuter = 88;
  const rInner = 52;

  const arcs = useMemo(() => {
    let current = -90;
    const denom = items.reduce((a, it) => a + Math.max(0, it.share), 0) || 1;

    return items.map((it) => {
      const sweep = (Math.max(0, it.share) / denom) * 360;
      const startAngle = current;
      const endAngle = current + sweep;
      current = endAngle;
      return { id: it.id, arc: { startAngle, endAngle } as DonutArc };
    });
  }, [items]);

  const setActiveSafe = (id: CenterId) => setActiveId(id);

  return (
    <div
      className="w-full rounded-2xl p-4 sm:p-5"
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 14px 45px rgba(2, 6, 23, 0.08)",
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* Donut + Centro */}
        <div className="flex-1 lg:flex-[0_0_68%]">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,249,255,0.55) 100%)",
              border: `1px solid color-mix(in oklch, ${BORDER} 65%, transparent)`,
            }}
          >
            <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[430px]">
              <svg viewBox="0 0 240 240" className="w-full h-full block" role="img" aria-label="Distribuição do Custo Realizado">
                <defs>
                  <filter id="donutShadow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2.0" result="blur" />
                    <feOffset dx="0" dy="4" result="offsetBlur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.25" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="offsetBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <radialGradient id="donutSpec" cx="30%" cy="25%" r="70%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                    <stop offset="35%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>

                  <radialGradient id="donutEdge" cx="35%" cy="25%" r="80%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.88)" />
                    <stop offset="30%" stopColor="rgba(255,255,255,0.20)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>

                {arcs.map(({ id, arc }) => {
                  const it = items.find((x) => x.id === id);
                  if (!it) return null;

                  const isActive = id === activeId;
                  const path = donutSlicePath(cx, cy, rOuter, rInner, arc);

                  return (
                    <g key={id}>
                      <path
                        d={path}
                        fill={it.fill}
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth={1.15}
                        strokeLinejoin="round"
                        role="button"
                        tabIndex={0}
                        aria-label={`${it.name}: ${it.share.toFixed(1)}% (${formatBRL(it.realized)})`}
                        onMouseEnter={() => setActiveSafe(id)}
                        onFocus={() => setActiveSafe(id)}
                        onClick={() => setActiveSafe(id)}
                        style={{
                          cursor: "pointer",
                          transition: "transform 220ms ease, filter 220ms ease, opacity 220ms ease",
                          transformOrigin: `${cx}px ${cy}px`,
                          transform: isActive ? "translateY(-1.5px)" : "translateY(0px)",
                          opacity: isActive ? 1 : 0.92,
                          filter: isActive ? "url(#donutShadow)" : undefined,
                        }}
                      />
                      <path
                        d={path}
                        fill="url(#donutSpec)"
                        opacity={isActive ? 0.9 : 0.7}
                        style={{ pointerEvents: "none" }}
                      />
                      <path
                        d={path}
                        fill="url(#donutEdge)"
                        opacity={isActive ? 0.65 : 0.42}
                        style={{ pointerEvents: "none" }}
                      />
                    </g>
                  );
                })}

                <circle cx={cx} cy={cy} r={rInner} fill="#fff" stroke="rgba(2, 6, 23, 0.06)" strokeWidth={1.25} />
              </svg>

              {/* Centro inteligente (4 KPIs via cards abaixo, e 1 foco no centro) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div
                    className="text-[10px] font-mono uppercase tracking-[0.22em]"
                    style={{ color: MUTED }}
                  >
                    {active ? active.name : "Total"}
                  </div>
                  <div className="mt-1 text-[15px] sm:text-[16px] font-mono font-bold text-slate-900">
                    {active ? formatBRL(active.realized) : formatBRL(totalRealized)}
                  </div>
                  <div className="mt-2 text-[10px] font-mono" style={{ color: MUTED }}>
                    {active ? `${active.share.toFixed(1)}% do total` : ""}
                  </div>
                  <div className="mt-2">
                    {active ? <TrendBadge variancePct={active.varPct} /> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPIs abaixo do donut */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div
              className="rounded-xl border px-3 py-2"
              style={{ borderColor: `color-mix(in oklch, ${BORDER} 70%, transparent)` }}
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.20em]" style={{ color: MUTED }}>
                Total realizado
              </div>
              <div className="mt-1 text-[12px] font-mono font-bold text-slate-900">{formatBRL(totalRealized)}</div>
            </div>

            <div
              className="rounded-xl border px-3 py-2"
              style={{ borderColor: `color-mix(in oklch, ${BORDER} 70%, transparent)` }}
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.20em]" style={{ color: MUTED }}>
                Variação
              </div>
              <div className="mt-1">
                <TrendBadge variancePct={overallVarPct} />
              </div>
            </div>

            <div
              className="rounded-xl border px-3 py-2"
              style={{ borderColor: `color-mix(in oklch, ${BORDER} 70%, transparent)` }}
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.20em]" style={{ color: MUTED }}>
                Maior centro
              </div>
              <div className="mt-1 text-[12px] font-mono font-bold text-slate-900 truncate">{maiorCentro?.name ?? "—"}</div>
            </div>

            <div
              className="rounded-xl border px-3 py-2"
              style={{ borderColor: `color-mix(in oklch, ${BORDER} 70%, transparent)` }}
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.20em]" style={{ color: MUTED }}>
                Total de centros
              </div>
              <div className="mt-1 text-[12px] font-mono font-bold text-slate-900">{items.length}</div>
            </div>
          </div>

          {/* Header + sort */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: MUTED }}>
                Ranking inteligente
              </span>
              <span className="text-[12px] font-mono font-bold text-slate-900">{formatBRL(totalRealized)}</span>
            </div>

            <div className="flex items-center gap-1">
              {([
                { k: "value" as SortKey, label: "Valor" },
                { k: "pct" as SortKey, label: "%" },
                { k: "name" as SortKey, label: "Nome" },
              ] as const).map((x) => {
                const isSel = sortKey === x.k;
                return (
                  <button
                    key={x.k}
                    type="button"
                    onClick={() => setSortKey(x.k)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold transition"
                    style={{
                      background: isSel ? "oklch(0.75 0.20 185 / 0.12)" : "rgba(2,6,23,0.03)",
                      color: isSel ? "#0f172a" : "#334155",
                      border: `1px solid ${isSel ? "oklch(0.75 0.20 185 / 0.28)" : BORDER}`,
                    }}
                  >
                    {x.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ranking (8 itens, sem scroll interno) */}
        <div className="flex-1 lg:flex-[0_0_32%]">
          <div
            className="rounded-2xl p-3 sm:p-4 h-[320px] sm:h-[360px] lg:h-[430px] flex flex-col"
            style={{ border: `1px solid ${BORDER}`, background: "#fff" }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wide" style={{ color: "#111827" }}>
                  Ranking
                </p>
                <p className="text-[12px] font-semibold text-gray-900">Participação</p>
              </div>

              {active && (
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl"
                  style={{ background: `${active.fill}14` }}
                >
                  <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ background: active.fill }} />
                </span>
              )}
            </div>

            {/* sem overflow interno: layout em 4 linhas para caber */}
            <div className="mt-3 flex-1 grid grid-rows-4 gap-1.5">
              {items.map((it) => {
                const isActive = it.id === activeId;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setActiveSafe(it.id)}
                    onMouseEnter={() => setActiveSafe(it.id)}
                    onFocus={() => setActiveSafe(it.id)}
                    className="w-full text-left rounded-xl p-2 transition"
                    style={{
                      border: `1px solid ${isActive ? "oklch(0.75 0.20 185 / 0.28)" : BORDER}`,
                      background: isActive ? "rgba(2,6,23,0.03)" : "#ffffff",
                      boxShadow: isActive ? `0 0 0 3px ${it.fill}10` : "none",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-2 w-2 rounded-full mt-[2px]" style={{ background: it.fill }} />
                        <p className="text-[12px] font-semibold text-gray-900 truncate">{it.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-semibold font-mono text-gray-900 leading-none">{it.share.toFixed(1)}%</p>
                        <p className="text-[10px] font-mono leading-none mt-1" style={{ color: MUTED }}>
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

            <div className="mt-2">
              <p className="text-[10px] font-mono" style={{ color: MUTED }}>
                Clique no ranking ou no gráfico para sincronizar destaque.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


