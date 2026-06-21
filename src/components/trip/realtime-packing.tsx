"use client";

import { useEffect } from "react";
import { createClient, isDemoMode } from "@/lib/supabase/client";

interface RealtimePackingProps {
  tripId: string;
  onUpdate: () => void;
}

export function RealtimePacking({ tripId, onUpdate }: RealtimePackingProps) {
  useEffect(() => {
    if (isDemoMode()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`packing-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "packing_items",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, onUpdate]);

  return null;
}
