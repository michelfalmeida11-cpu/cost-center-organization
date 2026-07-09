import React from "react";
import { fioriCardStyle, fioriGlowPrimaryStyle } from "../utils";
import { fioriColors } from "../theme";

type CardTone = "primary" | "default";

export function Card({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: CardTone }) {
  const baseStyle = fioriCardStyle();
  const toneStyle = tone === "primary" ? fioriGlowPrimaryStyle() : null;

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        ...(toneStyle || {}),
        ...(props.style || {}),
        color: props.style?.color ?? fioriColors.text,
      }}
      {...props}
    />
  );
}


