"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ActiveDot({ cx, cy, r, fill }: any) {
  const radius = r || 4;
  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill={fill || '#fff'} stroke="rgba(255,255,255,0.06)" />
      <motion.circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(59,130,246,0.32)"
        strokeWidth={2}
        initial={{ r: radius, opacity: 0.6 }}
        animate={{ r: radius + 10, opacity: 0 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
      />
    </g>
  );
}
