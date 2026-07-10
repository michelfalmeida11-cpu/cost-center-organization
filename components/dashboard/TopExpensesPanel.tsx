"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import ChartTooltip from "./ChartTooltip";

export default function TopExpensesPanel({ data, onSelect, active }: { data: any[]; onSelect?: (label: string) => void; active?: string | null }) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">Top 5 Maiores Gastos</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Ranking de Gastos</h2>
        </div>
      </div>
      <div className="mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={170} axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} content={<ChartTooltip />} />
              <Bar dataKey="progress" radius={12} barSize={16} onClick={(payload: any) => onSelect?.(payload.label)}>
                {data.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} className={`${active === entry.label ? 'opacity-100' : 'opacity-70'}`} />
                ))}
              </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
