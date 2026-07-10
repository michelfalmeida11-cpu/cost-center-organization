"use client";

import React from "react";
import { motion } from "framer-motion";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "", ...props }: CardProps) {
  return (
    <motion.div
      whileHover={{ translateY: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`design-card ${className}`}
        {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

// Provide named export for compatibility with existing imports
export { Card };



