import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={
        "w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(20,184,166,0.35)] " +
        className
      }
      {...props}
    />
  )
})


