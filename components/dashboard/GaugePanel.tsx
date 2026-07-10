"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { Gauge } from "lucide-react";

export default function GaugePanel({ stats, value }: { stats: any[]; value: number }) {
  const totalLiters = Number(String(stats[1]?.value).replace(/\D/g, "")) || 100000;
  const gaugeData = [{ name: "Consumido", value: Math.round((value / totalLiters) * 100) }];
  return (
    <DashboardCard className="min-h-[340px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Consumo Diesel</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Diesel e Indicadores</h2>
        </div>
        <Gauge className="h-6 w-6 text-slate-200" />
      </div>
      <div className="mt-6 flex items-center justify-center">
        <div className="relative h-60 w-60 rounded-full bg-[#0B1630] shadow-[inset_0_0_0_8px_rgba(56,189,248,0.08)]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="64%" outerRadius="96%" data={gaugeData} startAngle={210} endAngle={-30}>
              <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "#08101F" }} fill="#FACC15" />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-100">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Atual</p>
            <p className="mt-2 text-4xl font-semibold">{value.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Litros</p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[18px] border border-[#233754] bg-[#09161F] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0D1A2F] text-white" style={{ color: item.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400">{item.label}</p>
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
