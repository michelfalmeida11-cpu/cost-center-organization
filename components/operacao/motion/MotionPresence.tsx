"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";

export function MotionPresence({ children }: { children: React.ReactNode }) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}

