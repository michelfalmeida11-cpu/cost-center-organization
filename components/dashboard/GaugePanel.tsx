"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { Gauge } from "lucide-react";

export default function GaugePanel({ stats, value }: { stats: any[]; value: number }) {
  const gaugeData = [{ name: "Consumido", value: Math.round((value / (stats[1]?.valueNumber || 100000)) * 100) }];
  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">Consumo Diesel</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Gauge e Status</h2>
        </div>
        <Gauge className="h-6 w-6 text-slate-200" />
      </div>
      <div className="mt-6 flex items-center justify-center">
        <div className="relative h-56 w-56 rounded-full bg-[#0E1B34] shadow-[inset_0_0_0_6px_rgba(59,130,246,0.16)]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={gaugeData} startAngle={210} endAngle={-30}>
              <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "#0B1221" }} fill="#FACC15" />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-100">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Atual</p>
            <p className="mt-2 text-4xl font-semibold">{value.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Litros</p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[16px] bg-[#0E1B34] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111C2E]" style={{ color: item.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
