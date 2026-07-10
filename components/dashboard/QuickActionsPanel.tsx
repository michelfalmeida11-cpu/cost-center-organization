"use client";

import React from "react";
import { motion } from "framer-motion";

export default function QuickActionsPanel({ data }: { data: any[] }) {
  return (
    <div className="grid gap-4">
      {data.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            type="button"
            title={item.label}
            className="flex items-center gap-4 rounded-[18px] border border-[#233754] bg-[#111C2E] px-5 py-4 text-left text-sm font-semibold text-white shadow-[0_24px_80px_rgba(0,0,0,0.16)] transition duration-200 hover:bg-[#17263F]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0E1B34] text-slate-200">
              <Icon className="h-5 w-5" />
            </span>
            <span>{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
