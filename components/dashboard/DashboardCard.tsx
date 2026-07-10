"use client";

import React from "react";
import Card from "@/components/ui/card";

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardCard({ children, className, ...props }: DashboardCardProps) {
  return (
    <Card className={`h-full min-h-[240px] overflow-hidden rounded-[28px] border border-white/10 bg-[#081425] p-5 md:p-6 shadow-[0_28px_100px_rgba(0,0,0,0.26)] transition duration-200 ${className ?? ""}`} {...props}>
      {children}
    </Card>
  );
}
