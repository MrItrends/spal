"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore, type User } from "@/store";
import type { Business } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AchievementsSection } from "@/components/gamification/AchievementsSection";
import { enablePushNotifications, disablePushNotifications } from "@/hooks/usePushNotifications";
import {
  Pencil, X, User as UserIcon, Mail, Phone, MessageSquare, Bell, BellOff,
  Store, Coins, Receipt, ChevronRight, Camera, Flame, Check, AlertCircle,
  BookOpen, MessageCircle, Table2, LayoutGrid, FileText, FolderInput,
  Plus, Archive, Building2,
} from "lucide-react";
import type { TrackingMethod } from "@/store";

const BIZ_TYPE_COLORS: Record<string, string> = {
  food_seller:    "#22C55E",
  bar_owner:      "#F97316",
  fashion_vendor: "#8B5CF6",
  salon:          "#2563EB",
  kiosk:          "#22C55E",
  market_trader:  "#F97316",
  other:          "#A1A1AA",
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  food_seller:    "Food Seller",
  bar_owner:      "Bar Owner",
  fashion_vendor: "Fashion Vendor",
  salon:          "Salon Owner",
  kiosk:          "Kiosk Owner",
  market_trader:  "Market Trader",
  other:          "Business Owner",
};

const CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", label: "Ghanaian Cedi",  symbol: "₵" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "USD", label: "US Dollar",      symbol: "$" },
  { code: "GBP", label: "British Pound",  symbol: "£" },
];

type SheetType = "name" | "business" | "whatsapp" | "currency" | "notifications" | "add-email" | "add-phone" | "tracking-methods" | "biz-options" | null;

const TRACKING_METHOD_LABELS: Partial<Record<TrackingMethod, string>> = {
  notebook:      "Notebook",
  whatsapp:      "WhatsApp",
  excel:         "Excel",
  google_sheets: "Google Sheets",
  notes_app:     "Notes App",
  receipts:      "Receipts",
  nothing:       "Other",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, activeBusiness, setActiveBusiness, businesses, setBusinesses } = useSPALStore();
  const [signingOut,    setSigningOut]    = useState(false);
  const [activeSheet,   setActiveSheet]   = useState<SheetType>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [switchingBiz,  setSwitchingBiz]  = useState<string | null>(null);
  const [bizToManage,   setBizToManage]   = useState<Business | null>(null);
  const [switchToast,   setSwitchToast]   = useState<string | null>(null);

  // Business health (last 7 days)
  const [health, setHealth] = useState<"loading" | "profitable" | "breaking-even" | "spending-more" | "no-data">("loading");

  const fetchHealth = useCallback(async () => {
    try {
      const end   = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const res  = await fetch(`/api/records?start_date=${fmt(start)}&end_date=${fmt(end)}&limit=200`);
      const data = await res.json();
      if (!data.success || !data.data?.length) { setHealth("no-data"); return; }
      const records: Array<{ type: string; amount: number }> = data.data;
      const sales    = records.filter(r => r.type === "sale").reduce((s, r) => s + Number(r.amount), 0);
      const expenses = records.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
      const profit   = sales - expenses;
      if (profit >  sales * 0.05) setHealth("profitable");
      else if (profit < -sales * 0.05) setHealth("spending-more");
      else setHealth("breaking-even");
    } catch {
      setHealth("no-data");
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  useEffect(() => {
    fetch("/api/businesses")
      .then(r => r.json())
      .then(d => { if (d.success) setBusinesses(d.data ?? []); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function switchBusiness(biz: Business) {
    if (biz.id === activeBusiness?.id || switchingBiz) return;
    setSwitchingBiz(biz.id);
    try {
      await fetch("/api/user/active-business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: biz.id }),
      });
      setActiveBusiness(biz);
      setSwitchToast(biz.business_name);
      setTimeout(() => setSwitchToast(null), 2500);
    } catch { /* silent */ } finally {
      setSwitchingBiz(null);
    }
  }

  async function archiveBusiness(biz: Business) {
    try {
      await fetch(`/api/businesses/${biz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });
      const remaining = businesses.filter(b => b.id !== biz.id);
      setBusinesses(remaining);
      setActiveSheet(null);
      setBizToManage(null);
      // If we archived the active business, switch to the first remaining one
      if (activeBusiness?.id === biz.id && remaining.length > 0) {
        switchBusiness(remaining[0]);
      }
    } catch { /* silent */ }
  }

  // Verified = name + business details + at least one contact (phone or whatsapp)
  const isVerified = !!(
    user?.full_name &&
    user?.business_name &&
    (user?.phone_number || user?.whatsapp_number)
  );

  const businessLabel = user?.business_type
    ? BUSINESS_TYPE_LABELS[user.business_type] ?? "Business"
    : "Business";

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarLoading(true);
    try {
      // Compress to 160×160 JPEG via Canvas (keeps it ~5-10 KB)
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width  = 160;
      canvas.height = 160;
      const ctx = canvas.getContext("2d")!;

      // Crop to square (centre)
      const size = Math.min(bitmap.width, bitmap.height);
      const sx   = (bitmap.width  - size) / 2;
      const sy   = (bitmap.height - size) / 2;
      ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, 160, 160);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const err = await saveProfile({ avatar_url: dataUrl });
      if (err) console.error("Avatar save error:", err);
    } catch (err) {
      console.error("Avatar compress error:", err);
    } finally {
      setAvatarLoading(false);
      // Reset input so the same file can be re-selected if needed
      e.target.value = "";
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch { /* continue regardless */ } finally {
      logout();
      router.push("/login");
    }
  }

  // Returns null on success, error string on failure
  async function saveProfile(updates: Record<string, unknown>): Promise<string | null> {
    try {
      const res  = await fetch("/api/user/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && user) {
        setUser({ ...user, ...data.data });
        return null; // success
      }
      return data.error ?? "Something went wrong. Please try again.";
    } catch (e) {
      console.error("saveProfile error:", e);
      return "Network error. Please check your connection.";
    }
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">
        Profile
      </h1>

      {/* User card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="md">
          <div className="flex items-center gap-4">
            {/* Tappable avatar */}
            <label className="relative w-14 h-14 flex-shrink-0 cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={avatarLoading}
              />
              {/* Avatar image or initials */}
              <div className="w-14 h-14 bg-spal-green rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  avatarLoading ? (
                    <span className="text-sm animate-pulse">…</span>
                  ) : (
                    user?.full_name?.[0]?.toUpperCase() ??
                    user?.business_name?.[0]?.toUpperCase() ??
                    <UserIcon size={22} strokeWidth={2} color="#fff" />
                  )
                )}
              </div>
              {/* Camera overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                {avatarLoading
                  ? <span className="text-white text-xs animate-pulse">…</span>
                  : <Camera size={16} strokeWidth={2} color="#fff" />
                }
              </div>
            </label>

            <div className="flex-1 min-w-0">
              <button
                onClick={() => setActiveSheet("name")}
                className="flex items-center gap-1.5 group text-left w-full"
              >
                <p className="font-bold text-spal-navy text-base truncate">
                  {user?.full_name ?? user?.business_name ?? "Tap to set your name"}
                </p>
                <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                  <PencilMiniIcon />
                </span>
              </button>
              <p className="text-sm text-neutral-400 truncate mt-0.5">
                {user?.email ?? user?.phone_number ?? ""}
              </p>
              <div className="mt-1.5">
                <Badge label={businessLabel} color="green" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card padding="md">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
            Your progress
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <StatItem
              value={
                <span className="inline-flex items-center gap-1">
                  {user?.streak_days ?? 0}
                  <Flame size={16} strokeWidth={2} color="#F97316" />
                </span>
              }
              label="Day streak"
            />
            <HealthStatItem health={health} />
            <VerifiedStatItem verified={isVerified} onFix={() => setActiveSheet("business")} />
          </div>
        </Card>
      </motion.div>

      {/* My Businesses */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card padding="none">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-spal-navy">My Businesses</p>
            <button
              onClick={() => router.push("/add-business")}
              className="flex items-center gap-1 active:opacity-70 transition-opacity"
            >
              <Plus size={14} strokeWidth={2.5} color="#22C55E" />
              <span className="text-[13px] font-semibold" style={{ color: "#22C55E" }}>Add business</span>
            </button>
          </div>
          <div className="pb-2">
            {businesses.map((biz, i) => {
              const isActive  = biz.id === activeBusiness?.id;
              const typeColor = BIZ_TYPE_COLORS[biz.business_type] ?? "#22C55E";
              return (
                <div
                  key={biz.id}
                  className={`flex items-center gap-3 px-4 py-3 active:bg-neutral-50 transition-colors ${i < businesses.length - 1 ? "border-b border-neutral-50" : ""}`}
                >
                  {/* Coloured initial */}
                  <button
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    onClick={() => switchBusiness(biz)}
                    disabled={!!switchingBiz}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[15px] font-bold"
                      style={{ background: typeColor }}
                    >
                      {biz.business_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-spal-navy truncate">{biz.business_name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">{BUSINESS_TYPE_LABELS[biz.business_type] ?? "Business"}</p>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#22C55E" }}>
                        <Check size={11} strokeWidth={3} color="#fff" />
                      </div>
                    )}
                    {switchingBiz === biz.id && (
                      <div className="w-5 h-5 rounded-full border-2 border-spal-green border-t-transparent animate-spin flex-shrink-0" />
                    )}
                  </button>
                  {/* Options */}
                  <button
                    onClick={() => { setBizToManage(biz); setActiveSheet("biz-options"); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 flex-shrink-0 active:bg-neutral-200 transition-colors ml-1"
                    aria-label="Business options"
                  >
                    <ChevronRight size={15} strokeWidth={2} className="text-neutral-400" />
                  </button>
                </div>
              );
            })}
            {businesses.length === 0 && (
              <div className="px-4 py-3 flex items-center gap-2 text-neutral-400">
                <Building2 size={16} strokeWidth={1.5} />
                <span className="text-[13px]">No businesses yet</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card padding="none">
          {([
            {
              icon:    <UserIcon size={18} strokeWidth={2} color="#0F172A" />,
              label:   "Your name",
              hint:    user?.full_name ? user.full_name : "Tap to set your name",
              sheet:   "name" as SheetType,
            },
            ...(!user?.email ? [{
              icon:    <Mail size={18} strokeWidth={2} color="#2563EB" />,
              label:   "Add email address",
              hint:    "Sign in with email too",
              sheet:   "add-email" as SheetType,
            }] : []),
            ...(!user?.phone_number ? [{
              icon:    <Phone size={18} strokeWidth={2} color="#2563EB" />,
              label:   "Business phone",
              hint:    "Add your business contact number",
              sheet:   "add-phone" as SheetType,
            }] : [{
              icon:    <Phone size={18} strokeWidth={2} color="#0F172A" />,
              label:   "Business phone",
              hint:    user.phone_number!,
              sheet:   "add-phone" as SheetType,
            }]),
            {
              icon:    <MessageSquare size={18} strokeWidth={2} color="#16A34A" />,
              label:   "WhatsApp reports",
              hint:    user?.whatsapp_number ? `Sending to ${user.whatsapp_number}` : "Set up weekly reports",
              sheet:   "whatsapp" as SheetType,
            },
            {
              icon:    <Bell size={18} strokeWidth={2} color="#8B5CF6" />,
              label:   "Notifications",
              hint:    "Daily reminders to track",
              sheet:   "notifications" as SheetType,
            },
            {
              icon:    <Store size={18} strokeWidth={2} color="#F97316" />,
              label:   "Business details",
              hint:    user?.business_name ?? "Add your business name",
              sheet:   "business" as SheetType,
            },
            {
              icon:    <Coins size={18} strokeWidth={2} color="#16A34A" />,
              label:   "Currency",
              hint:    user?.currency ?? "NGN",
              sheet:   "currency" as SheetType,
            },
            {
              icon:    <FolderInput size={18} strokeWidth={2} color="#2563EB" />,
              label:   "Record tracking methods",
              hint:    (() => {
                const methods = ((user as unknown as { tracking_methods?: TrackingMethod[] })?.tracking_methods ?? [])
                  .filter(m => m !== "nothing");
                return methods.length > 0
                  ? methods.map(m => TRACKING_METHOD_LABELS[m] ?? m).join(", ")
                  : "How do you currently track records?";
              })(),
              sheet:   "tracking-methods" as SheetType,
            },
          ] as { icon: React.ReactNode; label: string; hint: string; sheet: SheetType }[]).map((item, i, arr) => (
            <button
              key={item.label}
              onClick={() => setActiveSheet(item.sheet)}
              className={`w-full flex items-center gap-3 px-4 py-4 active:bg-neutral-50 transition-colors ${
                i < arr.length - 1 ? "border-b border-neutral-50" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-spal-navy">{item.label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{item.hint}</p>
              </div>
              <ChevronRight size={18} strokeWidth={2} className="text-neutral-300" />
            </button>
          ))}
        </Card>
      </motion.div>

      {/* Payment history row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card padding="none">
          <button
            onClick={() => router.push("/billing")}
            className="w-full flex items-center gap-3 px-4 py-4 active:bg-neutral-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-spal-purple-50 flex items-center justify-center flex-shrink-0">
              <Receipt size={18} strokeWidth={2} color="#8B5CF6" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-spal-navy">Payment history</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Coach subscriptions, receipts and renewals
              </p>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="text-neutral-300" />
          </button>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Card padding="md">
          <AchievementsSection />
        </Card>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card padding="md">
          <div className="text-center">
            <p className="text-sm font-bold text-spal-navy">SPAL v1.0</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Spending · Profiting · Analysing · Looping
            </p>
            <p className="text-xs text-neutral-300 mt-2">
              Your AI business companion for everyday entrepreneurs
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Sign out */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Button
          variant="ghost"
          fullWidth
          loading={signingOut}
          onClick={handleSignOut}
          className="!text-red-500 !font-semibold"
        >
          Sign out
        </Button>
      </motion.div>

      <div className="h-4" />

      {/* ── Switch toast ──────────────────────────────────────────── */}
      <AnimatePresence>
        {switchToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-2xl shadow-lg"
            style={{ background: "#0F172A" }}
          >
            <p className="text-white text-[13px] font-semibold whitespace-nowrap">
              Switched to {switchToast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Business options sheet ─────────────────────────────────── */}
      <Sheet
        open={activeSheet === "biz-options"}
        onClose={() => { setActiveSheet(null); setBizToManage(null); }}
        title={bizToManage?.business_name ?? "Business"}
      >
        {bizToManage && (
          <div className="space-y-3 pb-4">
            <p className="text-[13px] text-neutral-400">
              {BUSINESS_TYPE_LABELS[bizToManage.business_type] ?? "Business"}
            </p>
            <button
              onClick={() => {
                setActiveSheet(null);
                setBizToManage(null);
                router.push(`/add-business/rename?id=${bizToManage.id}&name=${encodeURIComponent(bizToManage.business_name)}`);
              }}
              className="w-full flex items-center gap-3 px-4 py-4 bg-neutral-50 rounded-xl text-left active:bg-neutral-100 transition-colors"
            >
              <Pencil size={18} strokeWidth={2} color="#0F172A" />
              <span className="text-[14px] font-semibold text-spal-navy">Rename business</span>
            </button>
            {businesses.length > 1 && (
              <button
                onClick={() => archiveBusiness(bizToManage)}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left active:bg-red-50 transition-colors"
                style={{ border: "1.5px solid #FEE2E2" }}
              >
                <Archive size={18} strokeWidth={2} color="#EF4444" />
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: "#EF4444" }}>Archive business</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">Your data is kept — you can restore it later</p>
                </div>
              </button>
            )}
          </div>
        )}
      </Sheet>

      {/* ── Bottom Sheets ─────────────────────────────────────────── */}

      <NameSheet
        open={activeSheet === "name"}
        user={user}
        onClose={() => setActiveSheet(null)}
        onSave={async (updates) => {
          const err = await saveProfile(updates);
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <BusinessDetailsSheet
        open={activeSheet === "business"}
        user={user}
        onClose={() => setActiveSheet(null)}
        onSave={async (updates) => {
          const err = await saveProfile(updates);
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <WhatsAppSheet
        open={activeSheet === "whatsapp"}
        current={user?.whatsapp_number ?? ""}
        onClose={() => setActiveSheet(null)}
        onSave={async (number) => {
          const err = await saveProfile({ whatsapp_number: number || null });
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <CurrencySheet
        open={activeSheet === "currency"}
        current={user?.currency ?? "NGN"}
        onClose={() => setActiveSheet(null)}
        onSave={async (code) => {
          const err = await saveProfile({ currency: code });
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <NotificationsSheet
        open={activeSheet === "notifications"}
        onClose={() => setActiveSheet(null)}
      />

      <AddContactSheet
        open={activeSheet === "add-email" || activeSheet === "add-phone"}
        type={activeSheet === "add-email" ? "email" : "phone"}
        onClose={() => setActiveSheet(null)}
        onSaved={(updatedUser) => { setUser(updatedUser as User); setActiveSheet(null); }}
      />

      <TrackingMethodsSheet
        open={activeSheet === "tracking-methods"}
        currentMethods={((user as unknown as { tracking_methods?: TrackingMethod[] })?.tracking_methods ?? [])
          .filter(m => m !== "nothing")}
        onClose={() => setActiveSheet(null)}
        onSave={async (methods) => {
          const err = await saveProfile({ tracking_methods: methods });
          if (!err) setActiveSheet(null);
          return err;
        }}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PencilMiniIcon() {
  return <Pencil size={13} strokeWidth={2.2} color="#A1A1AA" />;
}

function StatItem({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="text-xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">{value}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}

const HEALTH_CONFIG = {
  "profitable":    { label: "Profitable",   color: "#22C55E", dot: "#22C55E" },
  "breaking-even": { label: "Even",         color: "#F59E0B", dot: "#F59E0B" },
  "spending-more": { label: "Overspending", color: "#EF4444", dot: "#EF4444" },
  "no-data":       { label: "No data yet",  color: "#A1A1AA", dot: "#A1A1AA" },
  "loading":       { label: "…",            color: "#D4D4D8", dot: "#D4D4D8" },
} as const;

function HealthStatItem({ health }: { health: keyof typeof HEALTH_CONFIG }) {
  const cfg = HEALTH_CONFIG[health];
  return (
    <div>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <motion.div
          animate={health !== "loading" ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: cfg.dot }}
        />
        <p
          className="text-[15px] font-bold leading-tight font-[family-name:var(--font-satoshi)]"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </p>
      </div>
      <p className="text-xs text-neutral-400">Business health</p>
      <p className="text-[10px] text-neutral-300 mt-0.5">Last 7 days</p>
    </div>
  );
}

function VerifiedStatItem({ verified, onFix }: { verified: boolean; onFix: () => void }) {
  return (
    <div>
      {verified ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          className="flex justify-center mb-0.5"
        >
          <Check size={22} strokeWidth={2.5} color="#22C55E" />
        </motion.div>
      ) : (
        <button onClick={onFix} className="flex justify-center w-full mb-0.5" aria-label="Complete profile">
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ delay: 1, duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
          >
            <AlertCircle size={20} strokeWidth={2} color="#F59E0B" />
          </motion.div>
        </button>
      )}
      <p className="text-xs text-neutral-400">Verified</p>
      {!verified && (
        <button onClick={onFix} className="text-[10px] font-semibold mt-0.5" style={{ color: "#F59E0B" }}>
          Complete profile
        </button>
      )}
    </div>
  );
}

// ── Sheet wrapper ──────────────────────────────────────────────────────────

function Sheet({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 sheet-backdrop z-[55]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl z-[60] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90dvh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-neutral-200 rounded-full" />
            </div>

            {/* Scroll zone fills remaining height — reliable iOS momentum scroll */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-3"
              style={{
                WebkitOverflowScrolling: "touch",
                paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 flex-shrink-0"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Name sheet ────────────────────────────────────────────────────────────

function NameSheet({ open, user, onClose, onSave }: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<string | null>;
}) {
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [saving, setSaving]     = useState(false);
  const [error,  setError]      = useState<string | null>(null);

  useEffect(() => {
    if (open) { setFullName(user?.full_name ?? ""); setError(null); }
  }, [open, user?.full_name]);

  async function handleSave() {
    if (!fullName.trim()) { setError("Please enter your name."); return; }
    setSaving(true);
    setError(null);
    const err = await onSave({ full_name: fullName.trim() });
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Your name">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
            Full name
          </label>
          <input
            type="text"
            placeholder="e.g. Amaka Okonkwo"
            value={fullName}
            onChange={e => { setFullName(e.target.value); setError(null); }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            className={`w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors ${
              error ? "border-red-300 focus:border-red-400" : "border-neutral-100 focus:border-spal-blue"
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
        <Button fullWidth loading={saving} onClick={handleSave} disabled={!fullName.trim()}>
          Save name
        </Button>
      </div>
    </Sheet>
  );
}

// ── Business details sheet ─────────────────────────────────────────────────

function BusinessDetailsSheet({ open, user, onClose, onSave }: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<string | null>;
}) {
  const [fullName,     setFullName]     = useState(user?.full_name     ?? "");
  const [businessName, setBusinessName] = useState(user?.business_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFullName(user?.full_name ?? "");
      setBusinessName(user?.business_name ?? "");
      setError(null);
    }
  }, [open, user?.full_name, user?.business_name]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await onSave({
      full_name:     fullName.trim()     || null,
      business_name: businessName.trim() || null,
    });
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Business details">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
            Your name
          </label>
          <input
            type="text"
            placeholder="e.g. Amaka Okonkwo"
            value={fullName}
            onChange={e => { setFullName(e.target.value); setError(null); }}
            className="w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus:border-spal-blue text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
            Business name
          </label>
          <input
            type="text"
            placeholder="e.g. Amaka's Kitchen"
            value={businessName}
            onChange={e => { setBusinessName(e.target.value); setError(null); }}
            className="w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus:border-spal-blue text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors"
          />
        </div>
        {error && <p className="text-xs text-red-500 text-center -mt-1">{error}</p>}
        <Button fullWidth loading={saving} onClick={handleSave} disabled={!fullName.trim() && !businessName.trim()}>
          Save details ✓
        </Button>
      </div>
    </Sheet>
  );
}

// ── WhatsApp sheet ─────────────────────────────────────────────────────────

function WhatsAppSheet({ open, current, onClose, onSave }: {
  open: boolean;
  current: string;
  onClose: () => void;
  onSave: (number: string) => Promise<string | null>;
}) {
  const [number, setNumber] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (open) { setNumber(current); setError(null); }
  }, [open, current]);

  async function handleSave() {
    const trimmed = number.trim();
    if (!trimmed) { setError("Please enter a WhatsApp number."); return; }
    setSaving(true);
    setError(null);
    const err = await onSave(trimmed);
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="WhatsApp reports">
      <div className="space-y-4">
        <p className="text-sm text-neutral-500 leading-relaxed">
          We&apos;ll send your weekly business summary to this WhatsApp number every Sunday.
        </p>
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
            WhatsApp number
          </label>
          <input
            type="tel"
            placeholder="+234 801 234 5678"
            value={number}
            onChange={e => { setNumber(e.target.value); setError(null); }}
            className={`w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors ${
              error ? "border-red-300 focus:border-red-400" : "border-neutral-100 focus:border-spal-blue"
            }`}
          />
          {error
            ? <p className="text-xs text-red-500 mt-2">{error}</p>
            : <p className="text-xs text-neutral-400 mt-2">Include country code, e.g. +234 for Nigeria</p>
          }
        </div>
        <Button fullWidth loading={saving} onClick={handleSave}>
          Save number ✓
        </Button>
        {current && (
          <button
            onClick={async () => { await onSave(""); }}
            className="w-full h-11 text-sm text-red-400 font-medium rounded-full bg-red-50"
          >
            Remove WhatsApp number
          </button>
        )}
      </div>
    </Sheet>
  );
}

// ── Currency sheet ─────────────────────────────────────────────────────────

function CurrencySheet({ open, current, onClose, onSave }: {
  open: boolean;
  current: string;
  onClose: () => void;
  onSave: (code: string) => Promise<string | null>;
}) {
  const [selected, setSelected] = useState(current);
  const [saving, setSaving]     = useState(false);
  const [error,  setError]      = useState<string | null>(null);

  useEffect(() => {
    if (open) { setSelected(current); setError(null); }
  }, [open, current]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await onSave(selected);
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Currency">
      <div className="space-y-4">
        <div className="space-y-2">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setSelected(c.code)}
              className={`w-full flex items-center justify-between px-4 h-14 rounded-2xl border-2 transition-all ${
                selected === c.code
                  ? "border-spal-green bg-spal-green-50"
                  : "border-neutral-100 bg-neutral-50"
              }`}
            >
              <div className="text-left">
                <span className="text-sm font-semibold text-spal-navy">{c.code}</span>
                <span className="text-xs text-neutral-400 ml-2">{c.label}</span>
              </div>
              <span className={`text-lg font-bold ${selected === c.code ? "text-spal-green" : "text-neutral-300"}`}>
                {c.symbol}
              </span>
            </button>
          ))}
        </div>
        {error && <p className="text-xs text-red-500 text-center -mt-1">{error}</p>}
        <Button fullWidth loading={saving} onClick={handleSave}>
          Save currency ✓
        </Button>
      </div>
    </Sheet>
  );
}

// ── Add Contact sheet (link email or phone to existing account) ────────────

function AddContactSheet({ open, type, onClose, onSaved }: {
  open:     boolean;
  type:     "email" | "phone";
  onClose:  () => void;
  onSaved:  (user: unknown) => void;
}) {
  const [step,    setStep]    = useState<"enter" | "verify">("enter");
  const [contact, setContact] = useState("");
  const [otp,     setOtp]     = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (open) { setStep("enter"); setContact(""); setOtp(["","","","","",""]); setError(null); } }, [open]);

  const isEmail = type === "email";
  const title   = isEmail ? "Add email address" : "Add business phone";
  const valid   = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
    : /^\+?\d{7,15}$/.test(contact.trim().replace(/[\s\-().]/g, ""));

  async function handleSendCode() {
    setLoading(true); setError(null);

    // PHONE: no OTP — save directly to user profile as business contact info.
    if (!isEmail) {
      const cleaned = contact.trim();
      const res  = await fetch("/api/user/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone_number: cleaned }),
      });
      const data = await res.json();
      setLoading(false);
      if (!data.success) { setError(data.error ?? "Couldn't save phone number."); return; }
      onSaved(data.data);
      return;
    }

    // EMAIL: still uses OTP for verified sign-in addition.
    const body = { email: contact.trim().toLowerCase() };
    const res  = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error ?? "Failed to send code."); return; }
    setStep("verify");
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) return;
    setLoading(true); setError(null);
    const contactVal = isEmail ? contact.trim().toLowerCase() : contact.trim();
    const res  = await fetch("/api/profile/add-contact", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, contact: contactVal, token: code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error ?? "Wrong code."); setOtp(["","","","","",""]); inputRefs.current[0]?.focus(); return; }
    onSaved(data.data.user);
  }

  function handleOtpChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (n.every(d => d) && v) { const joined = n.join(""); if (joined.length === 6) { const newOtp = n; setTimeout(() => { const code = newOtp.join(""); if (code.length === 6) handleVerifyDirect(code); }, 0); } }
  }

  async function handleVerifyDirect(code: string) {
    setLoading(true); setError(null);
    const contactVal = isEmail ? contact.trim().toLowerCase() : contact.trim();
    const res  = await fetch("/api/profile/add-contact", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, contact: contactVal, token: code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error ?? "Wrong code."); setOtp(["","","","","",""]); inputRefs.current[0]?.focus(); return; }
    onSaved(data.data.user);
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {step === "enter" ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 leading-relaxed">
            {isEmail
              ? "Add your email so you can also sign in with it. We'll send a code to confirm."
              : "Save your business phone for receipts, WhatsApp reports, and contact details."}
          </p>
          <input
            type={isEmail ? "email" : "tel"}
            inputMode={isEmail ? "email" : "numeric"}
            placeholder={isEmail ? "you@example.com" : "+234 801 234 5678"}
            value={contact}
            onChange={e => { setContact(e.target.value); setError(null); }}
            className="w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus:border-spal-blue text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors"
            autoCapitalize="none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button fullWidth loading={loading} disabled={!valid} onClick={handleSendCode}>
            {isEmail ? "Send verification code" : "Save phone number"}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-neutral-500">
            Enter the 6-digit code sent to <strong className="text-spal-navy">{contact}</strong>
          </p>
          <div className="flex justify-center gap-2">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus(); }}
                className={`w-11 h-13 text-center text-xl font-bold rounded-2xl border-2 text-spal-navy outline-none transition-all ${d ? "border-spal-green bg-spal-green-50" : "border-neutral-200"} focus:border-spal-blue`}
                style={{ height: "52px" }}
              />
            ))}
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <Button fullWidth loading={loading} disabled={otp.some(d => !d)} onClick={handleVerify}>
            Confirm &amp; link {isEmail ? "email" : "phone"}
          </Button>
          <button className="w-full text-center text-sm text-neutral-400 py-1" onClick={() => setStep("enter")}>
            ← Change {isEmail ? "email" : "number"}
          </button>
        </div>
      )}
    </Sheet>
  );
}

// ── Tracking Methods sheet ────────────────────────────────────────────────

const TRACKING_METHODS_LIST: Array<{
  key:    TrackingMethod;
  label:  string;
  sub:    string;
  icon:   React.ReactNode;
  accent: string;
}> = [
  { key: "notebook",      label: "Notebook",      sub: "You write in a physical notebook",         icon: <BookOpen       size={20} strokeWidth={2} />, accent: "#22C55E" },
  { key: "whatsapp",      label: "WhatsApp",      sub: "You message yourself or save notes there", icon: <MessageCircle  size={20} strokeWidth={2} />, accent: "#25D366" },
  { key: "excel",         label: "Excel",         sub: "You track in a spreadsheet",               icon: <Table2         size={20} strokeWidth={2} />, accent: "#217346" },
  { key: "google_sheets", label: "Google Sheets", sub: "You use Google Sheets",                    icon: <LayoutGrid     size={20} strokeWidth={2} />, accent: "#2563EB" },
  { key: "notes_app",     label: "Notes App",     sub: "You use a phone notes app",                icon: <FileText       size={20} strokeWidth={2} />, accent: "#F59E0B" },
  { key: "receipts",      label: "Receipts",      sub: "You keep paper receipts or photos",        icon: <Receipt        size={20} strokeWidth={2} />, accent: "#F97316" },
];

function TrackingMethodsSheet({ open, currentMethods, onClose, onSave }: {
  open:           boolean;
  currentMethods: TrackingMethod[];
  onClose:        () => void;
  onSave:         (methods: TrackingMethod[]) => Promise<string | null>;
}) {
  const [selected, setSelected] = useState<Set<TrackingMethod>>(new Set(currentMethods));
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (open) { setSelected(new Set(currentMethods)); setError(null); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(m: TrackingMethod) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }

  async function handleSave() {
    if (!selected.size) { setError("Pick at least one method."); return; }
    setSaving(true);
    setError(null);
    const err = await onSave(Array.from(selected));
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="How I track records">
      <div className="space-y-3">
        <p className="text-sm text-neutral-500 leading-relaxed">
          Tell SPAL how you currently manage your records. This helps us show you the right import options.
        </p>
        {TRACKING_METHODS_LIST.map(m => {
          const isOn = selected.has(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className="w-full flex items-center gap-4 bg-neutral-50 rounded-2xl px-4 py-3.5 text-left transition-all duration-150"
              style={{
                border:    isOn ? `1.5px solid ${m.accent}` : "1.5px solid transparent",
                boxShadow: isOn ? `0 0 0 3px ${m.accent}18` : "none",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${m.accent}14`, color: m.accent }}
              >
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-spal-navy">{m.label}</p>
                <p className="text-[11.5px] text-neutral-400 mt-0.5">{m.sub}</p>
              </div>
              <div
                className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
                style={{
                  border:     isOn ? `2px solid ${m.accent}` : "2px solid #D4D4D8",
                  background: isOn ? m.accent : "transparent",
                }}
              >
                {isOn && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <Button fullWidth loading={saving} onClick={handleSave} disabled={!selected.size}>
          Save {selected.size > 0 ? `(${selected.size} selected)` : ""} ✓
        </Button>
      </div>
    </Sheet>
  );
}

// ── Notifications sheet ────────────────────────────────────────────────────

function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [enabled,    setEnabled]    = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      setEnabled(false);
    } else {
      const perm = Notification.permission;
      setPermission(perm);
      setEnabled(perm === "granted");
    }
  }, [open]);

  async function handleEnable() {
    setRequesting(true);
    const result = await enablePushNotifications();
    setRequesting(false);
    if (result === "granted") {
      setPermission("granted");
      setEnabled(true);
    } else if (result === "denied") {
      setPermission("denied");
    }
  }

  async function handleDisable() {
    setEnabled(false);
    await disablePushNotifications();
  }

  const isDenied    = permission === "denied";
  const unsupported = permission === "unsupported";

  return (
    <Sheet open={open} onClose={onClose} title="Notifications">
      <div className="space-y-4">
        {isDenied ? (
          <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3">
            <BellOff size={20} strokeWidth={2} color="#DC2626" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-600">Notifications blocked</p>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                You&apos;ve blocked SPAL notifications in your browser. To fix this,
                open your browser settings, find this site, and set notifications to &quot;Allow&quot;.
                Then come back and turn them on here.
              </p>
            </div>
          </div>
        ) : unsupported ? (
          <div className="bg-neutral-50 rounded-2xl p-4 flex items-start gap-3">
            <BellOff size={20} strokeWidth={2} color="#A1A1AA" className="mt-0.5 flex-shrink-0" />
            <p className="text-sm text-neutral-500 leading-relaxed">
              Push notifications aren&apos;t supported on this browser. Try installing
              SPAL on your home screen for the best experience.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-spal-blue mb-1">Stay on track</p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              SPAL will nudge you at 9 AM and 7 PM on days you haven&apos;t logged anything —
              so you never miss a record.
            </p>
          </div>
        )}

        {!unsupported && (
          <button
            onClick={enabled ? handleDisable : handleEnable}
            disabled={requesting || isDenied}
            className="w-full flex items-center justify-between px-4 h-14 bg-neutral-50 rounded-2xl border-2 border-neutral-100 active:bg-neutral-100 transition-colors disabled:opacity-60 disabled:cursor-default"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-spal-navy">Daily reminders</p>
              <p className="text-xs text-neutral-400">
                {requesting ? "Setting up…" : enabled ? "Tap to turn off" : "Tap to turn on"}
              </p>
            </div>
            {requesting ? (
              <div className="w-5 h-5 rounded-full border-2 border-spal-green border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <div className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${enabled ? "bg-spal-green" : "bg-neutral-200"}`}>
                <motion.div
                  animate={{ x: enabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"
                />
              </div>
            )}
          </button>
        )}

        <Button fullWidth variant="secondary" onClick={onClose}>
          {enabled ? "Done ✓" : "Close"}
        </Button>
      </div>
    </Sheet>
  );
}

