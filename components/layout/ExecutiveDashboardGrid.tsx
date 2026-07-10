"use client";

import React from "react";

export default function ExecutiveDashboardGrid({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050A15] text-slate-100">
      <div className="mx-auto min-h-screen max-w-[2040px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="grid min-h-screen gap-6 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:flex flex-col gap-6 rounded-[32px] border border-white/10 bg-[#071224] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.26)] xl:p-7">{aside}</aside>
          <main className="w-full">
            <div className="grid gap-6 2xl:gap-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
