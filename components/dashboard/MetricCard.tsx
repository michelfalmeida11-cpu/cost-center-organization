"use client";

import React from "react";
import DashboardCard from "../dashboard/DashboardCard";
import Sparkline from "../dashboard/Sparkline";

export default function MetricCard({ item, onSelect, active }: { item: any; onSelect?: (label: string) => void; active?: boolean }) {
  const Icon = item.icon;
  return (
    <DashboardCard className="h-[108px] p-4">
      <button type="button" onClick={() => onSelect?.(item.label)} className={`group flex h-full w-full items-center gap-4 text-left ${active ? 'ring-2 ring-sky-500/50 shadow-[0_0_0_2px_rgba(56,189,248,0.18)]' : 'hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(0,0,0,0.12)]'} transition-transform duration-200`}>
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 shadow-[0_16px_32px_rgba(56,189,248,0.18)]">
          <Icon className="h-5 w-5 text-white xl:h-6 xl:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 xl:text-[10px]">{item.label}</p>
          <p className="mt-1.5 text-[16px] font-semibold leading-tight text-white xl:text-[18px]">{item.value}</p>
          <div className="mt-1 flex items-center justify-between gap-3 text-[11px] xl:text-[11px]">
            <span className={`font-semibold ${item.positive ? 'text-emerald-400' : 'text-rose-400'}`}>{item.trend}</span>
            <span className="text-slate-500">vs período anterior</span>
          </div>
        </div>
      </button>
    </DashboardCard>
  );
}
