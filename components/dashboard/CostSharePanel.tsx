"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { DollarSign } from "lucide-react";

export default function CostSharePanel({ data, total, visible = new Set(), onToggle }: { data: any[]; total: string; visible?: Set<string>; onToggle?: (name: string) => void }) {
  return (
    <DashboardCard className="h-full min-h-[340px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-[0.24em] text-slate-400">Participação dos Custos</p>
          <h2 className="mt-3 text-xl font-semibold text-white">Custo Total</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-3xl border border-[#233754] bg-[#0E1B34] px-4 py-2 text-sm text-slate-200">{total}</div>
      </div>

      <div className="mt-5 grid h-[268px] gap-5 xl:grid-cols-[276px_1fr] 2xl:grid-cols-[292px_1fr]">
        <div className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[#0A162A] p-5">
          <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),transparent_40%)]" />
          <div className="relative z-10 flex flex-col items-center justify-center text-center text-slate-100">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#111C2E] shadow-[0_20px_40px_rgba(0,0,0,0.20)]">
              <DollarSign className="h-6 w-6 text-sky-400" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">CUSTO TOTAL</p>
            <p className="mt-4 text-4xl font-semibold">R$ 8.764M</p>
            <p className="mt-2 text-sm text-slate-500">Base consolidada por centro</p>
          </div>
          <div className="absolute right-4 bottom-4 h-[31px] w-[31px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={29} outerRadius={52} paddingAngle={3}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid h-full content-between gap-2.5">
          {data.map((item) => (
            <button key={item.name} type="button" onClick={() => onToggle?.(item.name)} className={`flex items-center justify-between gap-4 rounded-[18px] border border-[#233754] bg-[#0E1B34] p-4 ${!visible.has(item.name) ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: item.color }} />
                <span className="text-sm text-slate-200">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-white">{item.value}%</span>
            </button>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
