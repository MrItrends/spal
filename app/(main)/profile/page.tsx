"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore, type User } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AchievementsSection } from "@/components/gamification/AchievementsSection";

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

type SheetType = "business" | "whatsapp" | "currency" | "notifications" | null;

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, isPro } = useSPALStore();
  const [signingOut,    setSigningOut]    = useState(false);
  const [activeSheet,   setActiveSheet]   = useState<SheetType>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

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
  async function saveProfile(updates: Record<string, string | null>): Promise<string | null> {
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
      <h1 className="text-xl font-bold text-spal-navy font-[family-name:var(--font-poppins)]">
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
                    "👤"
                  )
                )}
              </div>
              {/* Camera overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                {avatarLoading
                  ? <span className="text-white text-xs animate-pulse">…</span>
                  : <span className="text-white text-base">📷</span>
                }
              </div>
            </label>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-spal-navy text-base truncate">
                {user?.full_name ?? user?.business_name ?? "Your Account"}
              </p>
              <p className="text-sm text-neutral-400 truncate">
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
            <StatItem value={`${user?.streak_days ?? 0}🔥`} label="Day streak" />
            <StatItem value={user?.streak_days != null && user.streak_days > 7 ? "Active" : "Growing"} label="Status" />
            <StatItem value="✓" label="Verified" />
          </div>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card padding="none">
          {[
            {
              icon:    "📱",
              label:   "WhatsApp reports",
              hint:    user?.whatsapp_number ? `Sending to ${user.whatsapp_number}` : "Set up weekly reports",
              sheet:   "whatsapp" as SheetType,
            },
            {
              icon:    "🔔",
              label:   "Notifications",
              hint:    "Daily reminders to track",
              sheet:   "notifications" as SheetType,
            },
            {
              icon:    "🏪",
              label:   "Business details",
              hint:    user?.business_name ?? "Add your business name",
              sheet:   "business" as SheetType,
            },
            {
              icon:    "💱",
              label:   "Currency",
              hint:    user?.currency ?? "NGN",
              sheet:   "currency" as SheetType,
            },
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={() => setActiveSheet(item.sheet)}
              className={`w-full flex items-center gap-3 px-4 py-4 active:bg-neutral-50 transition-colors ${
                i < arr.length - 1 ? "border-b border-neutral-50" : ""
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-spal-navy">{item.label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{item.hint}</p>
              </div>
              <span className="text-neutral-300 text-lg">›</span>
            </button>
          ))}
        </Card>
      </motion.div>

      {/* Subscription row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card padding="none">
          <button
            onClick={() => router.push("/upgrade")}
            className="w-full flex items-center gap-3 px-4 py-4 active:bg-neutral-50 transition-colors"
          >
            <span className="text-xl">⚡</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-spal-navy">Subscription</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isPro ? "SPAL Pro — all features unlocked ✓" : "Free plan — upgrade to unlock advisors"}
              </p>
            </div>
            {isPro ? (
              <span className="text-xs bg-spal-green-50 text-spal-green-700 border border-spal-green-100 rounded-full px-2 py-0.5 font-bold">Pro</span>
            ) : (
              <span className="text-xs text-spal-purple font-semibold">Upgrade →</span>
            )}
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

      {/* ── Bottom Sheets ─────────────────────────────────────────── */}

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
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-bold text-spal-navy font-[family-name:var(--font-poppins)]">{value}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
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
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl z-[60] shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-neutral-200 rounded-full" />
            </div>
            <div className="px-5 pb-8 pt-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-spal-navy font-[family-name:var(--font-poppins)]">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
                >
                  ✕
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

// ── Business details sheet ─────────────────────────────────────────────────

function BusinessDetailsSheet({ open, user, onClose, onSave }: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (updates: Record<string, string | null>) => Promise<string | null>;
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
    <Sheet open={open} onClose={onClose} title="🏪 Business details">
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
    <Sheet open={open} onClose={onClose} title="📱 WhatsApp reports">
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
    <Sheet open={open} onClose={onClose} title="💱 Currency">
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

// ── Notifications sheet ────────────────────────────────────────────────────

const NOTIF_PREF_KEY = "spal_notifications_enabled";

function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [enabled,    setEnabled]    = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [requesting, setRequesting] = useState(false);

  // Load saved preference + live browser permission on open
  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem(NOTIF_PREF_KEY) === "true";
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      setEnabled(false);
    } else {
      setPermission(Notification.permission);
      // Only enabled if both saved pref is true AND browser allows
      setEnabled(saved && Notification.permission === "granted");
    }
  }, [open]);

  async function handleToggle() {
    if (enabled) {
      // Turn off — just update local preference (can't revoke browser permission)
      setEnabled(false);
      localStorage.setItem(NOTIF_PREF_KEY, "false");
      return;
    }

    // Turn on — request browser permission if not yet granted
    if (typeof Notification === "undefined") return;

    if (Notification.permission === "granted") {
      setEnabled(true);
      localStorage.setItem(NOTIF_PREF_KEY, "true");
      return;
    }

    if (Notification.permission === "denied") return; // can't request again

    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        setEnabled(true);
        localStorage.setItem(NOTIF_PREF_KEY, "true");
      }
    } finally {
      setRequesting(false);
    }
  }

  const isDenied = permission === "denied";

  return (
    <Sheet open={open} onClose={onClose} title="🔔 Notifications">
      <div className="space-y-4">
        {isDenied ? (
          <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">🚫</span>
            <div>
              <p className="text-sm font-semibold text-red-600">Notifications blocked</p>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                You&apos;ve blocked notifications for SPAL. To enable them, open your
                browser settings and allow notifications for this site.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-spal-blue-50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-spal-blue mb-1">Stay on track</p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Get a quick nudge each evening to log your sales and keep your streak going.
            </p>
          </div>
        )}

        <button
          onClick={!isDenied ? handleToggle : undefined}
          disabled={requesting || isDenied}
          className="w-full flex items-center justify-between px-4 h-14 bg-neutral-50 rounded-2xl border-2 border-neutral-100 active:bg-neutral-100 transition-colors disabled:opacity-60 disabled:cursor-default"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-spal-navy">Daily reminders</p>
            <p className="text-xs text-neutral-400">
              {requesting ? "Requesting permission…" : "Evening nudge at 8 PM"}
            </p>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${enabled ? "bg-spal-green" : "bg-neutral-200"}`}>
            <motion.div
              animate={{ x: enabled ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"
            />
          </div>
        </button>

        <Button fullWidth variant="secondary" onClick={onClose}>
          {enabled ? "Done ✓" : "Close"}
        </Button>
      </div>
    </Sheet>
  );
}
