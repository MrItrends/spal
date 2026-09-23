"use client";

import { useEffect } from "react";
import { useSPALStore } from "@spal/core/store";
import { useBusinessMode } from "@spal/core/hooks/useBusinessMode";
import { RetailDashboard } from "@/components/RetailDashboard";
import { PerishableDashboard } from "@/components/PerishableDashboard";

export default function HomePage() {
  const { user, activeBusiness, setActiveBusiness, setBusinesses } = useSPALStore();

  useEffect(() => {
    if (!user) return;
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length) {
          setBusinesses(d.data);
          const active = d.data.find((b: { id: string }) => b.id === user.active_business_id) ?? d.data[0];
          if (active && (!activeBusiness || activeBusiness.id !== active.id)) setActiveBusiness(active);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const { ready, perishable } = useBusinessMode();
  if (!ready) return null;

  return perishable ? <PerishableDashboard /> : <RetailDashboard />;
}
