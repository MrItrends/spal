"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore, type User } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AchievementsSection } from "@/components/gamification/AchievementsSection";
import {
  Pencil, X, User, Mail, Phone, MessageSquare, Bell, BellOff,
  Store, Coins, Zap, ChevronRight, Camera, Flame, Check,
} from "lucide-react";

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

type SheetType = "name" | "business" | "whatsapp" | "currency" | "notifications" | "add-email" | "add-phone" | null;

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
                    <User size={22} strokeWidth={2} color="#fff" />
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
            <StatItem value={user?.streak_days != null && user.streak_days > 7 ? "Active" : "Growing"} label="Status" />
            <StatItem
              value={<Check size={20} strokeWidth={2.5} color="#22C55E" className="inline" />}
              label="Verified"
            />
          </div>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card padding="none">
          {([
            {
              icon:    <User size={18} strokeWidth={2} color="#0F172A" />,
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
              label:   "Add phone number",
              hint:    "Sign in with phone too",
              sheet:   "add-phone" as SheetType,
            }] : [{
              icon:    <Phone size={18} strokeWidth={2} color="#0F172A" />,
              label:   "Phone number",
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

      {/* Subscription row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card padding="none">
          <button
            onClick={() => router.push("/upgrade")}
            className="w-full flex items-center gap-3 px-4 py-4 active:bg-neutral-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-spal-purple-50 flex items-center justify-center flex-shrink-0">
              <Zap size={18} strokeWidth={2} color="#8B5CF6" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-spal-navy">Subscription</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isPro ? "SPAL Pro — all features unlocked" : "Free plan — upgrade to unlock advisors"}
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
  onSave: (updates: Record<string, string | null>) => Promise<string | null>;
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
  const title   = isEmail ? "Add email address" : "Add phone number";
  const valid   = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
    : /^\+?\d{7,15}$/.test(contact.trim().replace(/[\s\-().]/g, ""));

  async function handleSendCode() {
    setLoading(true); setError(null);
    const body = isEmail ? { email: contact.trim().toLowerCase() } : { phone: contact.trim() };
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
              : "Add your phone number so you can also sign in with it. We'll send a code to confirm."}
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
            Send verification code
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
    <Sheet open={open} onClose={onClose} title="Notifications">
      <div className="space-y-4">
        {isDenied ? (
          <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3">
            <BellOff size={20} strokeWidth={2} color="#DC2626" className="mt-0.5 flex-shrink-0" />
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

