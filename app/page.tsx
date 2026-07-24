"use client";

import { ProcurementControlCenter } from "@/components/procurement/control-center";
import { ProcurementProvider } from "@/context/ProcurementContext";

export default function HomePage() {
  return (
    <ProcurementProvider>
      <ProcurementControlCenter />
    </ProcurementProvider>
  );
}
