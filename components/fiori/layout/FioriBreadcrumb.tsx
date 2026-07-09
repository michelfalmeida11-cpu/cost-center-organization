import React from "react";
import type { ReactNode } from "react";

import { fioriColors } from "../theme";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

function Crumb({ item }: { item: BreadcrumbItem }) {
  if (item.href) {
    return (
      <a
        href={item.href}
        className="text-[11px] font-mono hover:opacity-90 transition-opacity"
        style={{ color: fioriColors.text }}
      >
        {item.label}
      </a>
    );
  }

  return (
    <span
      className="text-[11px] font-mono"
      style={{ color: "color-mix(in oklch, var(--fiori-text) 78%, white 22%)" }}
    >
      {item.label}
    </span>
  );
}

export function FioriBreadcrumb({
  items,
  rightSlot,
}: {
  items: BreadcrumbItem[];
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={`${item.label}-${idx}`}> 
              <Crumb item={item} />
              {!isLast && (
                <span
                  aria-hidden
                  className="text-[12px] leading-none"
                  style={{ color: "color-mix(in oklch, var(--fiori-border) 75%, transparent)" }}
                >
                  ›
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

