"use client";

import React from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { motion } from "framer-motion";

export default function Sparkline({ data, color }: { data: number[]; color: string }) {
  const sparkData = data.map((value, index) => ({ x: index, y: value }));
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={sparkData}>
          <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
