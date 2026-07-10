"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { DollarSign } from "lucide-react";

export default function CostSharePanel({ data, total, visible = new Set(), onToggle }: { data: any[]; total: string; visible?: Set<string>; onToggle?: (name: string) => void }) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">Participação dos Custos</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Custo Total</h2>
        </div>
        <div className="rounded-3xl border border-[#233754] bg-[#0E1B34] px-4 py-2 text-sm text-slate-200">{total}</div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[240px_1fr]">
        <div className="relative h-72 w-full rounded-[24px] bg-[#0E1B34] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),transparent_55%)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-100">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">CUSTO TOTAL</p>
            <p className="mt-3 text-4xl font-semibold">R$ 8.764M</p>
          </div>
          <div className="absolute left-5 top-5 rounded-full bg-[#111C2E] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
            <DollarSign className="h-6 w-6 text-[#3B82F6]" />
          </div>
          <div className="absolute right-4 bottom-4 w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} outerRadius={48} paddingAngle={2}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid gap-4">
          {data.map((item) => (
            <button key={item.name} type="button" onClick={() => onToggle?.(item.name)} className={`rounded-[18px] border border-[#233754] bg-[#0E1B34] p-4 text-left ${!visible.has(item.name) ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <p className="text-sm text-slate-200">{item.name}</p>
                <span className="ml-auto text-sm font-semibold text-white">{item.value}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
