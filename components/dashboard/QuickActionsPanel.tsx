"use client";

import React from "react";
import { motion } from "framer-motion";

export default function QuickActionsPanel({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {data.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.label}
            whileHover={{ translateY: -2, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            type="button"
            title={item.label}
            className="flex h-full min-h-[100px] items-center gap-4 rounded-[20px] border border-white/10 bg-[#081A2C] px-5 py-4 text-left text-sm font-semibold text-white shadow-[0_30px_90px_rgba(0,0,0,0.18)] transition duration-200 hover:bg-white/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0F2141] text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
              <Icon className="h-5 w-5" />
            </span>
            <span>{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
