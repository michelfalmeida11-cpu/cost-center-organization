"use client";

import type { ReactNode } from "react";
import { Presence } from "@/components/fiori/motion";

interface MotionPresenceProps {
  children: ReactNode;
}

export default function MotionPresence({
  children,
}: MotionPresenceProps) {
  return <Presence>{children}</Presence>;
}