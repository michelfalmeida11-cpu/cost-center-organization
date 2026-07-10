"use client";

import { motion } from "framer-motion";
import React from "react";

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col justify-between rounded-[18px] border border-[#233754] bg-[#111C2E] p-4 md:p-[22px] shadow-[0_24px_80px_rgba(0,0,0,0.16)] transition duration-200 hover:bg-[#17263F]"
    >
      {children}
    </motion.div>
  );
}
