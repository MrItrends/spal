"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Add01Icon, Restaurant01Icon, Alert02Icon } from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";
import { iconTint } from "@/lib/sales";
import type { InventoryItem } from "@/lib/types";

const FF = "var(--font-satoshi)";
const BG = "#EDF3E8";
const CARD_SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

// Menu: everything you sell, with its price and whether it's available.
// Backed by the same catalog as Inventory, so orders and stock stay in sync.
export default function MenuPage() {
  const router = useRouter();
  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await fetch("/api/inventory").then((r) => r.json());
      if (d.success) setItems(d.data?.items ?? []); else setError(true);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const sellable = items.filter((it) => (it.selling_price ?? 0) > 0);
    const map = new Map<string, InventoryItem[]>();
    sellable.forEach((it) => {
      const key = it.category?.trim() || "Menu";
      map.set(key, [...(map.get(key) ?? []), it]);
    });
    return [...map.entries()];
  }, [items]);

  return (
    <div className="min-h-full pb-32" style={{ background: BG, fontFamily: FF }}>
      <div className="px-5 pt-12 flex items-center justify-between">
        <h1 className="text-[26px] font-black text-spal-navy">Menu</h1>
        <button onClick={() => router.push("/inventory/add")} aria-label="Add to menu" className="h-12 px-5 rounded-full flex items-center gap-2 active:scale-95 transition-transform" style={{ background: "#22C55E" }}>
          <Add01Icon size={18} color="#fff" />
          <span className="text-white font-bold text-[14px]">Add Item</span>
        </button>
      </div>

      <div className="px-5 mt-5">
        {loading ? (
          <div className="space-y-2.5">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : error ? (
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={{ background: "#FEE0E1" }}>
            <Alert02Icon size={20} color="#DC2626" />
            <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your menu. Check your connection.</p>
            <button onClick={load} aria-label="Try again" className="h-12 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 active:scale-95">Try again</button>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl px-6 py-10 text-center" style={{ boxShadow: CARD_SHADOW }}>
            <p className="text-[16px] font-black text-spal-navy">Your menu is empty</p>
            <p className="text-[13px] text-neutral-400 mt-1">Add what you sell and its price. It shows up when you take orders.</p>
            <button onClick={() => router.push("/inventory/add")} aria-label="Add your first item" className="mt-5 h-12 px-6 rounded-full text-white font-bold text-[14px] active:scale-95" style={{ background: "#22C55E" }}>Add your first item</button>
          </div>
        ) : (
          groups.map(([cat, list]) => (
            <div key={cat} className="mb-6">
              <p className="text-[16px] font-black text-spal-navy mb-3">{cat}</p>
              <div className="space-y-2.5">
                {list.map((it) => {
                  const tint = iconTint(it.name);
                  const out = it.quantity <= 0;
                  return (
                    <button key={it.id} onClick={() => router.push(`/inventory/add?id=${it.id}`)} aria-label={`Edit ${it.name}`} className="w-full text-left bg-white rounded-2xl px-4 py-3.5 min-h-[68px] flex items-center gap-3 active:scale-[0.99] transition-transform" style={{ boxShadow: CARD_SHADOW }}>
                      <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint.bg }}>
                        <Restaurant01Icon size={20} color={tint.color} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-spal-navy truncate">{it.name}</p>
                        <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: out ? "#FEE0E1" : "#EAF7EE", color: out ? "#DC2626" : "#16A34A" }}>
                          {out ? "Finished" : "Available"}
                        </span>
                      </div>
                      <p className="text-[15px] font-black text-spal-navy flex-shrink-0">{formatCurrency(it.selling_price ?? 0)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
