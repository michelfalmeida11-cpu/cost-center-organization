"use client";

import React from "react";
import DashboardCard from "../dashboard/DashboardCard";
import Sparkline from "../dashboard/Sparkline";

export default function DetailCard({ item }: { item: any }) {
  const Icon = item.icon;
  return (
    <DashboardCard className="h-full min-h-[260px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">{item.label}</p>
          <p className="mt-4 text-2xl font-semibold leading-tight text-white">{item.value}</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#0E1B34] text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <Icon className="h-6 w-6" style={{ color: item.color }} />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 rounded-[18px] bg-[#091623] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <p className="text-sm text-slate-400">Participação</p>
        <span className="text-sm font-semibold" style={{ color: item.color }}>{item.percent}</span>
      </div>
      <div className="mt-6 rounded-[22px] bg-[#0B1830] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <Sparkline data={item.series} color={item.color} />
      </div>
    </DashboardCard>
  );
}
