"use client";

import React from "react";
import DashboardCard from "../dashboard/DashboardCard";
import Sparkline from "../dashboard/Sparkline";

export default function DetailCard({ item }: { item: any }) {
  const Icon = item.icon;
  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">{item.label}</p>
          <p className="mt-3 text-xl sm:text-2xl font-semibold text-white">{item.value}</p>
        </div>
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-3xl bg-[#0E1B34] text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: item.color }} />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-400">
        <span>Participação</span>
        <span className="font-semibold" style={{ color: item.color }}>{item.percent}</span>
      </div>
      <div className="mt-5 rounded-[16px] bg-[#0E1B34] p-3">
        <Sparkline data={item.series} color={item.color} />
      </div>
    </DashboardCard>
  );
}
