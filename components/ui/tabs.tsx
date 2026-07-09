"use client";

import * as React from "react";

type TabsValue = string;

export function Tabs({
  defaultValue,
  value: valueProp,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: TabsValue;
  value?: TabsValue;
  onValueChange?: (v: TabsValue) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [internalValue, setInternalValue] = React.useState<TabsValue | undefined>(defaultValue);
  const value = valueProp ?? internalValue;

  return (
    <div className={className} data-tabs-root>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as any, {
          __tabsValue: value,
          __setValue: (v: TabsValue) => {
            setInternalValue(v);
            onValueChange?.(v);
          },
        });
      })}
    </div>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={className} data-tabs-list>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  asChild,
  children,
  className,
  ...props
}: {
  value: TabsValue;
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const internalProps: any = props;
  const active = internalProps.__tabsValue === value;

  const content = children;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      onClick={() => internalProps.__setValue(value)}
      className={
        className ??
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium"
      }
      {...(props as any)}
    >
      {content}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
  ...props
}: {
  value: TabsValue;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const internalProps: any = props;
  const active = internalProps.__tabsValue === value;
  if (!active) return null;

  return (
    <div role="tabpanel" className={className} {...(props as any)}>
      {children}
    </div>
  );
}


