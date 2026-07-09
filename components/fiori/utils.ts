import type { ReactNode } from "react";
import { fioriColors } from "./theme";

export function clsx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function fioriBorderStyle(opacity = 0.5) {
  return `1px solid color-mix(in oklch, ${fioriColors.border} ${Math.round(opacity * 100)}%, transparent)`;
}

export function fioriCardStyle() {
  return {
    background: fioriColors.cards,
    border: `1px solid color-mix(in oklch, ${fioriColors.border} 55%, transparent)`,
    boxShadow: "0 0 0 1px rgba(35, 53, 80, 0.20), 0 18px 80px rgba(0,0,0,0.20)",
  } as const;
}

export function fioriGlowPrimaryStyle() {
  return {
    boxShadow: "0 0 0 1px rgba(0,184,255,0.22), 0 0 28px rgba(0,184,255,0.12)",
  } as const;
}

export function ensureReactNode(children: ReactNode) {
  return children;
}

