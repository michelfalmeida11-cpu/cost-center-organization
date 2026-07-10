"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_TABLES = [
  "erp_operational_costs",
  "erp_diesel_entries",
  "erp_drilling_entries",
  "erp_blasting_entries",
  "erp_logistics_entries",
  "erp_equipments",
  "erp_cost_centers",
];

export function useRealtimeRefresh(onRefresh: () => void, tables: string[] = DEFAULT_TABLES) {
  useEffect(() => {
    const channel = supabase.channel(`erp-realtime-${tables.join("-")}`);

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => onRefresh()
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh, tables]);
}
