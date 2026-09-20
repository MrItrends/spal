"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search01Icon, Notification03Icon, QrCode01Icon, CubeIcon, Store01Icon,
  Package01Icon, PlusSignIcon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import type { InventoryItem } from "@/lib/types";

const BG     = "#EEF3E9";
const IMG_BG = "#ECECF7";
const FF     = "var(--font-satoshi)";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
const price = (it: InventoryItem) => it.selling_price ?? it.cost_price ?? 0;
const isLow = (it: InventoryItem) => it.quantity > 0 && it.quantity <= it.low_stock_threshold;
function stockProgress(it: InventoryItem) {
  if (it.initial_stock && it.initial_stock > 0) {
    const sold = Math.max(0, it.initial_stock - it.quantity);
    return { label: `${sold}/${it.initial_stock} sold`, fill: Math.min(1, sold / it.initial_stock), tone: "sold" as const };
  }
  const fill = it.quantity <= 0 ? 0 : Math.min(1, Math.max(0.06, it.quantity / (it.low_stock_threshold * 5 || 20)));
  return { label: `${it.quantity} ${it.unit} left`, fill, tone: "stock" as const };
}

export default function StockPage() {
  const { user, activeBusiness } = useSPALStore();
  const businessName = activeBusiness?.business_name || user?.business_name || "Your Store";

  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const catScroller = useRef<HTMLDivElement>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      const d = await res.json();
      if (d.success) setItems(d.data.items ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((it) => { if (it.category) counts.set(it.category, (counts.get(it.category) ?? 0) + 1); });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const filtered = activeCat ? items.filter((it) => it.category === activeCat) : items;

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: BG }}>
        <div className="w-6 h-6 rounded-full border-2 border-spal-green border-t-transparent animate-spin" />
      </div>
    );
  }

  const Header = (
    <>
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#D9C7B8" }}>
          {user?.avatar_url
            ? <Image src={user.avatar_url} alt="" width={44} height={44} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[16px] font-black text-white">{businessName.charAt(0)}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-neutral-500" style={{ fontFamily: FF }}>{greeting()}</p>
          <p className="text-[18px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{businessName}</p>
        </div>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Search"><Search01Icon size={19} color="#6B7280" /></button>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Notifications"><Notification03Icon size={19} color="#6B7280" /></button>
      </div>
      <div className="px-5 pt-1 pb-4 flex items-center gap-2.5">
        <div className="flex-1 flex items-center gap-2.5 bg-white/70 rounded-2xl px-4" style={{ height: 52 }}>
          <Search01Icon size={18} color="#9CA3AF" />
          <input placeholder="Search products by name or SKU..." className="flex-1 bg-transparent outline-none text-[14px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
        </div>
        <button className="rounded-2xl flex items-center justify-center active:scale-95" style={{ background: "#22C55E", height: 52, width: 52 }} aria-label="Scan"><QrCode01Icon size={22} color="#fff" /></button>
      </div>
    </>
  );

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-full" style={{ background: BG, fontFamily: FF }}>
        {Header}
        <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "28vh" }}>
          <CubeIcon size={54} color="#9AA3AF" strokeWidth={1.4} />
          <p className="text-[22px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>No item in inventory</p>
          <p className="text-[15px] text-neutral-500 mt-1" style={{ fontFamily: FF }}>Add your first stock</p>
          <button onClick={() => { window.location.href = "/inventory/add"; }}
            className="mt-6 h-13 px-6 rounded-full flex items-center gap-2.5 text-white font-black text-[16px] active:scale-[0.98] transition-transform"
            style={{ background: "#22C55E", fontFamily: FF, height: 56 }}>
            <Store01Icon size={20} color="#fff" /> Add Inventory
          </button>
        </div>
      </div>
    );
  }

  // Categories carousel — chunk into pages of 3 folder cards; last page ends with "View More".
  const pageSize = 3;
  const pages = Math.max(1, Math.ceil((categories.length + 1) / pageSize));

  return (
    <>
      <div className="min-h-full pb-32" style={{ background: BG, fontFamily: FF }}>
        {Header}

        {categories.length > 0 && (
          <div className="mb-2">
            <h2 className="px-5 text-[26px] font-black text-spal-navy mb-3" style={{ fontFamily: FF }}>Categories</h2>
            <div
              ref={catScroller}
              onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden px-5"
              style={{ scrollbarWidth: "none", gap: 14 }}
            >
              {categories.map((c) => {
                const on = activeCat === c.name;
                return (
                  <button key={c.name} onClick={() => setActiveCat(on ? null : c.name)}
                    className="snap-start shrink-0 text-left active:scale-[0.98] transition-transform" style={{ width: 168 }}>
                    <div className="w-14 h-3 rounded-t-xl -mb-1 ml-1" style={{ background: on ? "#22C55E" : "#fff" }} />
                    <div className="rounded-2xl rounded-tl-none px-4 py-5" style={{ background: on ? "#22C55E" : "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <p className="text-[19px] font-black leading-tight" style={{ fontFamily: FF, color: on ? "#fff" : "#0F172A" }}>{c.name}</p>
                      <p className="text-[14px] mt-1" style={{ fontFamily: FF, color: on ? "rgba(255,255,255,0.85)" : "#9CA3AF" }}>{c.count} Item{c.count !== 1 ? "s" : ""}</p>
                    </div>
                  </button>
                );
              })}
              {/* View More */}
              <button onClick={() => setActiveCat(null)}
                className="snap-start shrink-0 text-left active:scale-[0.98] transition-transform" style={{ width: 168 }}>
                <div className="w-14 h-3 rounded-t-xl -mb-1 ml-1" style={{ background: "#16A34A" }} />
                <div className="rounded-2xl rounded-tl-none px-4 py-5" style={{ background: "#22C55E" }}>
                  <PlusSignIcon size={26} color="#fff" />
                  <p className="text-[19px] font-black leading-tight mt-1 text-white" style={{ fontFamily: FF }}>View More</p>
                  <p className="text-[14px] mt-0.5" style={{ fontFamily: FF, color: "rgba(255,255,255,0.85)" }}>Click for More</p>
                </div>
              </button>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {Array.from({ length: pages }).map((_, i) => (
                  <span key={i} className="rounded-full transition-all" style={{ width: i === page ? 16 : 7, height: 7, background: i === page ? "#22C55E" : "#CBD5C0" }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product grid */}
        <div className="px-5 mt-4 grid grid-cols-2 gap-3.5">
          {filtered.map((it) => {
            const low = isLow(it);
            const prog = stockProgress(it);
            return (
              <div key={it.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                {low && (
                  <div className="text-center py-1.5" style={{ background: "#FEE0E1" }}>
                    <span className="text-[12px] font-bold" style={{ fontFamily: FF, color: "#DC2626" }}>Stock is getting low</span>
                  </div>
                )}
                <div className="m-2.5 rounded-xl flex items-center justify-center" style={{ background: IMG_BG, height: 120 }}>
                  {it.image_url
                    ? <Image src={it.image_url} alt={it.name} width={120} height={120} className="h-[104px] w-auto object-contain" />
                    : <Package01Icon size={38} color="#B7B7D6" />}
                </div>
                <div className="px-3 pb-3.5">
                  <p className="text-[16px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{it.name}</p>
                  <p className="text-[14px] font-medium text-neutral-400 mt-0.5" style={{ fontFamily: FF }}>{formatCurrency(price(it))}</p>
                  <p className="text-[13px] font-semibold mt-2" style={{ fontFamily: FF, color: prog.tone === "sold" ? "#16A34A" : "#6B7280" }}>{prog.label}</p>
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "#DCEBD6" }}>
                    <div className="h-full rounded-full" style={{ width: `${prog.fill * 100}%`, background: "#16A34A" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Add Inventory */}
      <AnimatePresence>
        <motion.button
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={() => { window.location.href = "/inventory/add"; }}
          className="fixed right-4 left-auto flex items-center gap-2.5 h-14 px-6 rounded-full text-white font-black text-[16px] active:scale-95 transition-transform z-40"
          style={{ background: "#22C55E", fontFamily: FF, bottom: "calc(var(--bottom-nav-h, 88px) + 8px)", boxShadow: "0 8px 24px rgba(34,197,94,0.4)" }}
        >
          <Store01Icon size={20} color="#fff" /> Add Inventory
        </motion.button>
      </AnimatePresence>
    </>
  );
}
