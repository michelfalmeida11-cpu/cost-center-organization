"use client";

import React from "react";
import Card from "@/components/ui/card";

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardCard({ children, className, ...props }: DashboardCardProps) {
  return (
    <Card className={`h-full overflow-hidden rounded-[18px] border border-white/5 bg-[#111C2E] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-0.5 ${className ?? ""}`} {...props}>
      {children}
    </Card>
  );
}
