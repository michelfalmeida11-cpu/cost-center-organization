"use client";

import React from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { motion } from "framer-motion";

export default function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const sparkData = data.map((value, index) => ({ x: index, y: value }));
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
          <Line type="monotone" dataKey="y" stroke={color} strokeWidth={3} dot={false} strokeLinecap="round" />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
