import React from "react";
import { fioriColors } from "../theme";

export function Typography({
  children,
  className = "",
  color,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  color?: string;
}) {
  return (
    <span
      {...props}
      className={"font-mono " + className}
      style={{ color: color ?? fioriColors.text }}
    >
      {children}
    </span>
  );
}

