"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSPALStore } from "@/store";
import { ADVISORS, ADVISOR_ORDER } from "@/lib/advisors/config";
import { formatTime } from "@/lib/utils/dates";

interface Conversation {
  id: string;
  advisor_id: string;
  title: string | null;
  updated_at: string;
}

export default function LearnPage() {
  const { isPro } = useSPALStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/advisors/conversations")
      .then((r) => r.json())
      .then((d) => { if (d.success) setConversations(d.data); })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleteTarget(null);
    try {
      await fetch(`/api/advisors/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch { /* silent */ }
  }

  function openAdvisor(advisorId: string) {
    const advisor = ADVISORS[advisorId];
    if (!advisor) return;
    if (!advisor.isFree && !isPro) {
      router.push("/upgrade");
      return;
    }
    router.push(`/learn/${advisorId}`);
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-neutral-400 text-sm">Your</p>
        <h1 className="text-xl font-bold text-spal-navy font-[family-name:var(--font-poppins)]">
          Financial Advisors
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Get expert advice, anytime — in plain English.
        </p>
      </motion.div>

      {/* Advisor grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {ADVISOR_ORDER.map((id, i) => {
          const advisor = ADVISORS[id];
          const locked = !advisor.isFree && !isPro;
          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => openAdvisor(id)}
              className="relative flex flex-col items-start p-4 rounded-2xl border bg-white border-neutral-100 text-left active:scale-95 transition-transform"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              {/* Lock / Free badge */}
              {locked ? (
                <span className="absolute top-3 right-3 text-[10px] bg-spal-purple-50 text-spal-purple-600 border border-spal-purple-100 rounded-full px-2 py-0.5 font-bold">
                  Pro
                </span>
              ) : advisor.isFree ? (
                <span className="absolute top-3 right-3 text-[10px] bg-spal-green-50 text-spal-green-700 border border-spal-green-100 rounded-full px-2 py-0.5 font-bold">
                  Free
                </span>
              ) : null}

              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold mb-3 ${advisor.avatarColor} ${advisor.avatarTextColor}`}
              >
                {advisor.avatarLetter}
              </div>

              <p className="text-sm font-bold text-spal-navy leading-tight">{advisor.name}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{advisor.title}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Recent conversations */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="spal-section-label mb-2">Recent Conversations</p>

        {loadingConvs ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-neutral-50 rounded-2xl border border-neutral-100" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-neutral-50 rounded-2xl border border-neutral-100 px-4 py-6 text-center">
            <p className="text-sm text-neutral-400">No conversations yet.</p>
            <p className="text-xs text-neutral-300 mt-1">Tap an advisor above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const advisor = ADVISORS[conv.advisor_id];
              if (!advisor) return null;
              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-100 px-4 py-3"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <button
                    onClick={() => router.push(`/learn/${conv.advisor_id}?convId=${conv.id}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${advisor.avatarColor} ${advisor.avatarTextColor}`}>
                      {advisor.avatarLetter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-spal-navy truncate">
                        {conv.title ?? `Chat with ${advisor.name}`}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {advisor.name} · {formatTime(conv.updated_at)}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(conv.id)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-neutral-300 active:text-red-400 transition-colors"
                    aria-label="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Upgrade nudge for free users */}
      {!isPro && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => router.push("/upgrade")}
          className="w-full bg-gradient-to-r from-spal-purple to-spal-blue rounded-2xl p-4 text-left active:scale-95 transition-transform"
        >
          <p className="text-xs font-bold text-purple-200 uppercase tracking-wide mb-1">SPAL Pro</p>
          <p className="text-sm font-bold text-white">Unlock all 4 advisors →</p>
          <p className="text-xs text-purple-200 mt-0.5">Chioma, Emeka &amp; Fatima + unlimited chats</p>
        </motion.button>
      )}

      <div className="h-4" />

      {/* Delete confirmation overlay */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          onClick={() => setDeleteTarget(null)}
        >
          <div className="absolute inset-0 bg-spal-navy/40" />
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            className="relative z-10 bg-white rounded-t-3xl w-full max-w-md px-6 py-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-spal-navy text-center mb-1">
              Delete conversation?
            </h3>
            <p className="text-sm text-neutral-400 text-center mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-12 rounded-2xl bg-neutral-100 text-spal-navy text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
