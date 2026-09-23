"use client";

import { useEffect } from "react";
import { useSPALStore } from "@spal/core/store";

/** Repopulates the store from the server on mount, same as the mobile app's UserHydration. */
export function UserHydration() {
  const { setUser } = useSPALStore();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data.success && data.data) setUser(data.data);
          else setUser(null);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
