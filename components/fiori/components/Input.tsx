"use client";

import React from "react";
import { fioriColors } from "../theme";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", style, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={className + " w-full rounded-2xl h-11 px-4 text-[11px] font-mono outline-none focus:ring-2 transition"}
      style={{
        background: "color-mix(in oklch, var(--fiori-cards) 75%, transparent)",
        border: `1px solid ${fioriColors.border}`,
        color: fioriColors.text,
        boxShadow: "0 0 0 0 transparent",
        ...(style || {}),
      }}
      {...props}
    />
  );
});

