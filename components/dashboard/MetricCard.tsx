"use client";

import React from "react";
import DashboardCard from "../dashboard/DashboardCard";
import Sparkline from "../dashboard/Sparkline";

export default function MetricCard({ item, onSelect, active }: { item: any; onSelect?: (label: string) => void; active?: boolean }) {
  const Icon = item.icon;
  return (
    <DashboardCard>
      <button type="button" onClick={() => onSelect?.(item.label)} className={`w-full text-left ${active ? 'ring-2 ring-sky-500' : ''}`}>
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-3xl shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            style={{ background: item.gradient }}
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="grow">
            <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl sm:text-4xl font-semibold text-white">{item.value}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className={`text-sm font-semibold ${item.positive ? "text-emerald-400" : "text-rose-400"}`}>{item.trend}</span>
          <span className="text-sm text-slate-500">vs período anterior</span>
        </div>

        <div className="mt-5 rounded-[16px] bg-[#0E1B34] p-3">
          <Sparkline data={item.sparkline} color={item.color} />
        </div>
      </button>
    </DashboardCard>
  );
}
