import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { fioriColors, fioriShadows } from "../theme";
import { clsx } from "../utils";


const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 h-11 text-[11px] font-mono font-bold transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "text-[oklch(0.08 0.014 240)]",
        success: "text-[oklch(0.08 0.014 240)]",
        warning: "text-[oklch(0.08 0.014 240)]",
        danger: "text-[oklch(0.08 0.014 240)]",
        ghost: "bg-transparent",
        outline: "bg-transparent",
      },
      size: {
        md: "px-4",
        sm: "h-10 px-3 rounded-xl",
        lg: "h-12 px-6 rounded-3xl",
        icon: "h-11 w-11 px-0 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    iconLeft?: React.ElementType;
    iconRight?: React.ElementType;
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  iconLeft: IconLeft,
  iconRight: IconRight,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  const v = buttonVariants({ variant, size });

  const styleByVariant: Record<string, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(180deg, color-mix(in oklch, ${fioriColors.primary} 88%, white 0%), color-mix(in oklch, ${fioriColors.primary} 72%, black 10%))`,
      border: `1px solid color-mix(in oklch, ${fioriColors.primary} 55%, transparent)`,
      boxShadow: fioriShadows?.glowPrimary,

    } as any,
    success: {
      background: `color-mix(in oklch, ${fioriColors.success} 70%, transparent)`,
      border: `1px solid color-mix(in oklch, ${fioriColors.success} 55%, transparent)`,
    },
    warning: {
      background: `color-mix(in oklch, ${fioriColors.warning} 70%, transparent)`,
      border: `1px solid color-mix(in oklch, ${fioriColors.warning} 55%, transparent)`,
    },
    danger: {
      background: `color-mix(in oklch, ${fioriColors.danger} 70%, transparent)`,
      border: `1px solid color-mix(in oklch, ${fioriColors.danger} 55%, transparent)`,
    },
    ghost: {
      background: "transparent",
      border: `1px solid transparent`,
    },
    outline: {
      background: "transparent",
      border: `1px solid ${fioriColors.border}`,
      color: fioriColors.text,
    },
  };

  return (
    <button
      className={clsx(v, className)}
      style={{
        ...styleByVariant[variant ?? "primary"],
      boxShadow: variant === "primary" ? fioriShadows.glowPrimary : undefined,

      }}
      disabled={disabled || loading}
      {...props}
    >
      {IconLeft ? <IconLeft className="h-4 w-4" /> : null}
      {loading ? <span className="animate-pulse">Loading...</span> : props.children}
      {IconRight ? <IconRight className="h-4 w-4" /> : null}
    </button>
  );
}

