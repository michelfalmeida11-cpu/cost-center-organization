"use client";

import React from "react";
import { motion } from "framer-motion";

export default function QuickActionsPanel({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {data.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            type="button"
            title={item.label}
            className="flex h-12 items-center gap-3 rounded-[12px] border border-white/5 bg-[#0F1B2D] px-4 text-left text-[13px] font-medium text-white transition duration-200 hover:bg-white/5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#111C2E] text-slate-200">
              <Icon className="h-[22px] w-[22px]" />
            </span>
            <span>{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
