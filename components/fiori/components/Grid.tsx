import React from "react";

export function Grid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={"grid gap-4 " + className}>{children}</div>;
}

