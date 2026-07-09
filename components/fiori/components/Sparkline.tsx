"use client";

import React from "react";
import { fioriColors } from "../theme";

export function Sparkline({
  data,
  stroke = fioriColors.primary,
  fill = "rgba(0,184,255,0.12)",
  height = 34,
}: {
  data: number[];
  stroke?: string;
  fill?: string;
  height?: number;
}) {
  const width = 160;
  const pad = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1e-9, max - min);

  function x(i: number) {
    if (data.length <= 1) return pad;
    return pad + (i * (width - pad * 2)) / (data.length - 1);
  }

  function y(v: number) {
    const t = (v - min) / range;
    return height - pad - t * (height - pad * 2);
  }

  const d = data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");

  const area = `${d} L ${x(data.length - 1).toFixed(2)} ${(height - pad).toFixed(
    2
  )} L ${x(0).toFixed(2)} ${(height - pad).toFixed(2)} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Sparkline"
      className="block"
    >
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

