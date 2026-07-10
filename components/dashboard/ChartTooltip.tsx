"use client";

import React from "react";

export default function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ background: '#0F1B2A', border: '1px solid #233754', padding: 12, borderRadius: 12, color: '#fff', minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: p.stroke || p.color }} />
            <div style={{ fontSize: 13 }}>{p.name ?? p.dataKey}</div>
          </div>
          <div style={{ fontWeight: 700 }}>{p.value}</div>
        </div>
      ))}
    </div>
  );
}
