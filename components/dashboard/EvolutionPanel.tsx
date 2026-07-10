"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import ApexChart from "./ApexChart";
import type { ApexOptions } from "apexcharts";

export default function EvolutionPanel({ data, activeMetric }: { data: any[]; activeMetric?: string | null }) {
  const series = [
    { name: "Equipamentos", data: data.map((item) => item.Equipamentos) },
    { name: "Diesel", data: data.map((item) => item.Diesel) },
    { name: "Perfuração", data: data.map((item) => item.Perfuração) },
    { name: "Desmonte", data: data.map((item) => item.Desmonte) },
    { name: "Logística", data: data.map((item) => item.Logística) },
  ];
  const options: ApexOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, background: "transparent" },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#2F80ED", "#FFC928", "#25D5F2", "#A855F7", "#38D26F"],
    dataLabels: { enabled: false },
    markers: { size: 3, strokeWidth: 0, hover: { size: 5 } },
    grid: { borderColor: "rgba(255,255,255,.05)", strokeDashArray: 4 },
    legend: { position: "bottom", horizontalAlign: "center", labels: { colors: "#94A3B8" } },
    xaxis: {
      categories: data.map((item) => item.month),
      labels: { style: { colors: "#94A3B8", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: "#94A3B8", fontSize: "12px" } },
    },
    tooltip: { theme: "dark" },
  };

  return (
    <DashboardCard className="h-[340px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.1667em] text-slate-400">Evolução Mensal</p>
          <h2 className="mt-3 text-xl font-semibold text-white">Evolução Mensal dos Custos (R$)</h2>
        </div>
      </div>
      <div className="mt-5 h-[270px] 2xl:h-[282px]">
        <ApexChart type="line" height="100%" series={series} options={options} />
      </div>
    </DashboardCard>
  );
}
