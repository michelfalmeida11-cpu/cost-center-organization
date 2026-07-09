"use client";

import React from "react";

export function Fade({
  children,
  className,
  duration = 0.18,
  y = 0,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  y?: number;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: 1,
        transform: `translateY(${y}px)`,
        transition: `opacity ${duration}s ease, transform ${duration}s ease`,
      }}
    >
      {children}
    </div>
  );
}

export function HoverScale({
  children,
  scale = 1.01,
  className,
}: {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        transition: "transform 180ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = `scale(${scale})`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "scale(1)";
      }}
    >
      {children}
    </div>
  );
}

export function Skeleton({
  className,
  height,
  width,
}: {
  className?: string;
  height?: string | number;
  width?: string | number;
}) {
  return (
    <div
      className={className}
      style={{
        height,
        width,
        borderRadius: 14,
        background: "rgba(35, 53, 80, 0.55)",
        animation: "bb-fiori-skeleton 1.2s ease-in-out infinite",
      }}
    />
  );
}

export function Presence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

