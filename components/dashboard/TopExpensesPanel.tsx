"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import ChartTooltip from "./ChartTooltip";

export default function TopExpensesPanel({ data, onSelect, active }: { data: any[]; onSelect?: (label: string) => void; active?: string | null }) {
  return (
    <DashboardCard className="h-full min-h-[340px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Top 5 Maiores Gastos</p>
          <h2 className="mt-3 text-xl font-semibold text-white">Ranking de Gastos</h2>
        </div>
      </div>
      <div className="mt-5 h-[270px] 2xl:h-[282px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={176} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, letterSpacing: '0.01em' }} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<ChartTooltip />} />
            <Bar dataKey="progress" radius={16} barSize={18} onClick={(payload: any) => onSelect?.(payload.label)}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} opacity={active && active !== entry.label ? 0.5 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
