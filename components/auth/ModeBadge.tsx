"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export function ModeBadge() {
  const { role, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-mono text-gray-600" style={{ background: "oklch(0.12 0.018 240 / 0.08)", border: "1px solid oklch(0.12 0.018 240 / 0.18)" }}>
        Carregando...
      </span>
    );
  }

  const isAdmin = role === "ADMIN";
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-mono font-bold"
      style={{
        color: isAdmin ? "oklch(0.65 0.20 145)" : "oklch(0.45 0.03 220)",
        background: isAdmin ? "oklch(0.65 0.20 145 / 0.12)" : "oklch(0.12 0.018 240 / 0.08)",
        border: isAdmin ? "1px solid oklch(0.65 0.20 145 / 0.25)" : "1px solid oklch(0.12 0.018 240 / 0.18)",
      }}
    >
      {isAdmin ? "Administrador" : "Somente leitura"}
    </span>
  );
}

