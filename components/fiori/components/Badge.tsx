import React from "react";
import { fioriColors } from "../theme";

export function Badge({
  children,
  tone = "primary",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral" | "info";

  className?: string;
}) {
  const color =
    tone === "info"
      ? fioriColors.primary
      : tone === "success"

      ? fioriColors.success
      : tone === "warning"
      ? fioriColors.warning
      : tone === "danger"
      ? fioriColors.danger
      : tone === "neutral"
      ? "color-mix(in oklch, var(--fiori-border) 70%, transparent)"
      : fioriColors.primary;

  return (
    <span
      className={"inline-flex items-center rounded-full px-3 py-1 text-[10px] font-mono font-bold " + className}
      style={{
        color: tone === "neutral" ? fioriColors.text : color,
        background: `color-mix(in oklch, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 35%, transparent)`,
      }}
    >

      {children}
    </span>
  );
}

