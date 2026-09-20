"use client";

import { Suspense, useEffect } from "react";
import { useSPALStore } from "@/store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { RestaurantHome } from "@/components/home/RestaurantHome";

/**
 * Home is dynamic by business type. Each type gets its own tailored home
 * (a restaurant cares about menu, a kiosk about inventory, etc.).
 * Restaurant/bar is built; other types fall back to it until their own
 * variants land.
 */
function HomeInner() {
  const { user, activeBusiness, setActiveBusiness, setBusinesses } = useSPALStore();
  usePushNotifications(user?.id);

  // Bootstrap businesses so the active one (and its type) is known.
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
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const type = activeBusiness?.business_type ?? user?.business_type;

  switch (type) {
    case "food_seller":
    case "bar_owner":
    default:
      return <RestaurantHome />;
  }
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
