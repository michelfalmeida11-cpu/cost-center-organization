"use client";

import React from "react";

export default function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ background: 'rgba(9, 20, 35, 0.96)', border: '1px solid rgba(255,255,255,0.08)', padding: 14, borderRadius: 16, color: '#fff', minWidth: 180, boxShadow: '0 18px 50px rgba(0,0,0,0.24)' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: i === payload.length - 1 ? 0 : 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: p.stroke || p.color }} />
            <div style={{ fontSize: 13, color: '#E7F0FB' }}>{p.name ?? p.dataKey}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#FFFFFF' }}>{p.value}</div>
        </div>
      ))}
    </div>
  );
}
