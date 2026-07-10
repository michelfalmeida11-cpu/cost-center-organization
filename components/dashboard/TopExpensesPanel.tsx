"use client";

import React from "react";
import DashboardCard from "./DashboardCard";

export default function TopExpensesPanel({ data, onSelect, active }: { data: any[]; onSelect?: (label: string) => void; active?: string | null }) {
  return (
    <DashboardCard className="h-[340px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.1667em] text-slate-400">Top 5 Maiores Gastos</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Ranking de Gastos</h2>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {data.map((item) => (
          <button key={item.label} type="button" onClick={() => onSelect?.(item.label)} className="block w-full text-left">
            <div className="flex items-center justify-between gap-3 text-[13px] text-white">
              <span className="truncate text-slate-200">{item.label}</span>
              <span className="font-medium text-slate-200">{item.value}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#0F1B2D]">
              <div
                className="h-full rounded-full transition-opacity"
                style={{
                  width: `${item.progress}%`,
                  background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)`,
                  opacity: active && active !== item.label ? 0.45 : 1,
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}
