"use client";

import React, { Suspense } from "react";

import { FioriSidebar, type FioriSidebarMenuItem } from "./layout/FioriSidebar";
import { FioriHeader } from "./layout/FioriHeader";
import { FioriFooter } from "./layout/FioriFooter";
import { fioriColors } from "./theme";
import type { BreadcrumbItem } from "./layout/FioriBreadcrumb";


export function AppShell({
  title,
  breadcrumbItems,
  brandLabel,
  brandImageSrc,
  menus,
  activeKey,
  footer,
  children,
}: {
  title: string;
  breadcrumbItems: BreadcrumbItem[];
  brandLabel: string;
  brandImageSrc: string;
  menus: FioriSidebarMenuItem[];
  activeKey: string;
  footer: {
    version: string;
    environmentLabel: string;
    userLabel: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ background: fioriColors.background, color: fioriColors.text }}
    >
      <div className="flex">
        <FioriSidebar
          menus={menus}
          activeKey={activeKey}
          brandLabel={brandLabel}
          brandImageSrc={brandImageSrc}
          footer={footer}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <FioriHeader title={title} breadcrumbItems={breadcrumbItems} />

          <main className="flex-1 px-4 sm:px-6 py-6">
            <Suspense
              fallback={
                <div
                  className="rounded-xl p-6"
                  style={{ background: fioriColors.cards, border: `1px solid ${fioriColors.border}` }}
                >
                  Loading...
                </div>

              }
            >
              {children}
            </Suspense>
          </main>

          <FioriFooter
            version={footer.version}
            userLabel={footer.userLabel}
            databaseLabel="Postgres"
            environmentLabel={footer.environmentLabel}
            year={new Date().getFullYear()}
          />
        </div>
      </div>
    </div>
  );
}

