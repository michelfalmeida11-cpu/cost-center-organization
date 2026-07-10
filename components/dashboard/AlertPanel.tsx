"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AlertPanel({ data }: { data: any[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
      {data.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="rounded-[18px] border border-[#233754] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.16)]"
            style={{ background: item.bg }}
          >
            <div className="flex items-center gap-4 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-200">{item.label}</p>
                <p className="mt-2 text-sm text-slate-100">{item.description}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
