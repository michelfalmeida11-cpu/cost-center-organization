"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ApexChart({
  type,
  series,
  options,
  height,
}: {
  type: "line" | "donut" | "radialBar";
  series: any;
  options: ApexOptions;
  height: number | string;
}) {
  return <ReactApexChart type={type} series={series} options={options} height={height} />;
}
