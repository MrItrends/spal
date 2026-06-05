"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Receipt, CalendarClock, AlertCircle, Mic, Sparkles,
} from "lucide-react";
import { ADVISORS, type Advisor } from "@/lib/advisors/config";
import { formatCurrency } from "@/lib/utils/currency";

interface CoachSub {
  coach_id: string;
  active: boolean;
  renews_at: string | null;
}

interface PaymentRecord {
  id:         string;
  coach_id:   string;
  amount:     number;
  paid_at:    string;
  status:     "succeeded" | "failed" | "refunded";
  receipt_url?: string;
}

const SUBS_KEY     = "spal_coach_subs";
const PAYMENTS_KEY = "spal_payments";

export default function BillingPage() {
  const router = useRouter();
  const [subs, setSubs]         = useState<CoachSub[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    try { setSubs(JSON.parse(localStorage.getItem(SUBS_KEY) ?? "[]")); } catch {}
    try { setPayments(JSON.parse(localStorage.getItem(PAYMENTS_KEY) ?? "[]")); } catch {}
  }, []);

  const activeSubs = subs.filter((s) => s.active);

  // Coaches with renewal coming in <=7 days
  const dueSoon = activeSubs.filter((s) => {
    if (!s.renews_at) return false;
    const days = Math.floor((new Date(s.renews_at).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  });

  return (
    <div className="px-5 pt-6 pb-6 space-y-5" style={{ background: "#F8F7F4", minHeight: "100%" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "#EAE9E7" }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} strokeWidth={2} color="#0F172A" />
        </button>
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          Payment history
        </h1>
      </div>

      {/* Renewal notice */}
      {dueSoon.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}
        >
          <AlertCircle size={18} className="text-spal-orange flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-spal-orange-700" style={{ fontFamily: "var(--font-satoshi)" }}>
              Renewals coming up
            </p>
            <p className="text-[12px] text-neutral-600 mt-0.5 leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>
              {dueSoon.map((s) => ADVISORS[s.coach_id]?.name).filter(Boolean).join(", ")} renew{dueSoon.length === 1 ? "s" : ""} within 7 days.
            </p>
          </div>
        </motion.div>
      )}

      {/* Active coach subscriptions */}
      <Section title="Active coaches">
        {activeSubs.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={26} className="text-neutral-300" />}
            title="No active coach subscriptions"
            sub="When you subscribe to a voice masterclass coach, it'll show up here with its renewal date."
            cta="Browse coaches"
            onCta={() => router.push("/learn")}
          />
        ) : (
          <div className="space-y-2.5">
            {activeSubs.map((s) => {
              const c = ADVISORS[s.coach_id];
              if (!c) return null;
              return <ActiveCoachRow key={s.coach_id} coach={c} renewsAt={s.renews_at} />;
            })}
          </div>
        )}
      </Section>

      {/* Payment history */}
      <Section title="Receipts">
        {payments.length === 0 ? (
          <EmptyState
            icon={<Receipt size={26} className="text-neutral-300" />}
            title="No payments yet"
            sub="Receipts for every coach subscription you pay for will appear here."
          />
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const c = ADVISORS[p.coach_id];
              if (!c) return null;
              return <PaymentRow key={p.id} payment={p} coach={c} />;
            })}
          </div>
        )}
      </Section>

      <div className="h-3" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-[15px] font-bold text-spal-navy mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>
        {title}
      </p>
      {children}
    </motion.section>
  );
}

function ActiveCoachRow({ coach, renewsAt }: { coach: Advisor; renewsAt: string | null }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${coach.avatarColor} ${coach.avatarTextColor}`}>
        {coach.avatarLetter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-bold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
            {coach.name}
          </p>
          <Mic size={11} className="text-spal-navy/50" strokeWidth={2.2} />
        </div>
        <p className="text-[11.5px] text-neutral-500 truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
          {coach.title}
        </p>
        {renewsAt && (
          <div className="flex items-center gap-1 mt-1">
            <CalendarClock size={11} className="text-neutral-400" strokeWidth={2} />
            <span className="text-[11px] text-neutral-500" style={{ fontFamily: "var(--font-satoshi)" }}>
              Renews {new Date(renewsAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[13px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          {formatCurrency(coach.priceMonthly ?? 0)}
        </p>
        <p className="text-[10.5px] text-neutral-400">/ month</p>
      </div>
    </div>
  );
}

function PaymentRow({ payment, coach }: { payment: PaymentRecord; coach: Advisor }) {
  const statusColor = payment.status === "succeeded" ? "#16A34A"
                    : payment.status === "refunded"  ? "#6B7280"
                    : "#DC2626";
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${coach.avatarColor} ${coach.avatarTextColor}`}>
        {coach.avatarLetter}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
          {coach.name} — Voice masterclass
        </p>
        <p className="text-[11px] text-neutral-500">
          {new Date(payment.paid_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[13px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          {formatCurrency(payment.amount)}
        </p>
        <p className="text-[10.5px] font-semibold uppercase" style={{ color: statusColor, fontFamily: "var(--font-satoshi)" }}>
          {payment.status}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub, cta, onCta }: {
  icon: React.ReactNode; title: string; sub: string; cta?: string; onCta?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl px-6 py-8 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-spal-navy font-bold text-[14.5px]" style={{ fontFamily: "var(--font-satoshi)" }}>{title}</p>
      <p className="text-neutral-400 text-[12.5px] mt-1 leading-relaxed max-w-xs mx-auto" style={{ fontFamily: "var(--font-satoshi)" }}>
        {sub}
      </p>
      {cta && onCta && (
        <button
          onClick={onCta}
          className="mt-4 px-5 h-10 rounded-full bg-spal-navy text-white text-[12.5px] font-bold"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}
