"use client";

import React from "react";
import DashboardCard from "./DashboardCard";

export default function AlertPanel({ data }: { data: any[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {data.map((item) => {
        const Icon = item.icon;
        return (
          <DashboardCard key={item.label} className="!p-6" style={{ background: item.bg, borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-start gap-4 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 shadow-[0_20px_35px_rgba(0,0,0,0.16)]">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-slate-200">{item.label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-100">{item.description}</p>
              </div>
            </div>
          </DashboardCard>
        );
      })}
    </div>
  );
}
