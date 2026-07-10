"use client";

import React from "react";

export default function ExecutiveDashboardGrid({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070D17] text-slate-100">
      <div className="mx-auto min-h-screen max-w-[1920px] px-0 lg:pl-[260px]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col gap-5 border-r border-white/5 bg-[#08111F] px-4 pb-6 pt-[22px] lg:flex">
          {aside}
        </aside>
        <main className="w-full p-6">
          <div className="grid gap-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
