"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft01Icon, Delete02Icon, PencilEdit02Icon, Tick01Icon } from "hugeicons-react";

interface Conversation {
  id: string;
  title: string;
  messages: { role: string; content: string; timestamp: string }[];
  duration: number;
  created_at: string;
  updated_at: string;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function fmtDuration(secs: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Swipeable card ─────────────────────────────────────────────────────────
function ConvCard({
  conv,
  onDelete,
  onRename,
  onClick,
}: {
  conv: Conversation;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onClick: () => void;
}) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -40], [1, 0]);
  const [swiped, setSwiped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conv.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const msgCount = conv.messages?.length ?? 0;
  const previewMsg = conv.messages?.find(m => m.role === "user")?.content ?? "";
  const preview = previewMsg.length > 60 ? previewMsg.slice(0, 60) + "…" : previewMsg;

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(conv.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function commitEdit() {
    if (draft.trim() && draft.trim() !== conv.title) onRename(draft.trim());
    setEditing(false);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3">
      {/* Delete action behind */}
      <motion.div
        style={{ opacity: deleteOpacity, background: "#FEE2E2" }}
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center rounded-r-2xl"
      >
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Delete"
        >
          <Delete02Icon size={18} color="#fff" />
        </button>
      </motion.div>

      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -40) setSwiped(true);
          else { x.set(0); setSwiped(false); }
        }}
        onClick={() => { if (!swiped) onClick(); else { x.set(0); setSwiped(false); } }}
        className="relative bg-white rounded-2xl px-4 py-4 cursor-pointer active:bg-neutral-50 transition-colors"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-start gap-3">
          {/* Purple icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#F3EEFF" }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M10 2C6.13 2 3 4.91 3 8.5c0 2.1 1.06 3.97 2.72 5.2L5 16l2.5-1.25c.8.2 1.62.25 2.5.25C14.87 15 18 12.09 18 8.5S14.87 2 10 2z" fill="#8B3CFF" opacity="0.25"/>
              <circle cx="7" cy="8.5" r="1.2" fill="#8B3CFF"/>
              <circle cx="10" cy="8.5" r="1.2" fill="#8B3CFF"/>
              <circle cx="13" cy="8.5" r="1.2" fill="#8B3CFF"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
                  className="flex-1 text-[14px] font-bold text-spal-navy bg-transparent outline-none border-b-2 pb-0.5"
                  style={{ borderColor: "#8B3CFF", fontFamily: "var(--font-satoshi)" }}
                />
                <button onClick={commitEdit} className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center active:scale-90 transition-transform">
                  <Tick01Icon size={14} color="#8B3CFF" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold text-spal-navy leading-snug truncate flex-1" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {conv.title || "Untitled chat"}
                </p>
                <button onClick={startEdit} className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform opacity-50 hover:opacity-100">
                  <PencilEdit02Icon size={13} color="#6B7280" />
                </button>
              </div>
            )}
            {preview && <p className="text-[12.5px] text-neutral-400 mt-0.5 truncate">{preview}</p>}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11.5px] text-neutral-400">{fmtTime(conv.updated_at)}</span>
              {msgCount > 0 && <span className="text-[11.5px] text-neutral-400">{msgCount} message{msgCount !== 1 ? "s" : ""}</span>}
              {conv.duration > 0 && <span className="text-[11.5px] text-neutral-400">{fmtDuration(conv.duration)}</span>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AskHistoryPage() {
  const router = useRouter();
  const [convs, setConvs]     = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then(r => r.json())
      .then(d => { if (d.success) setConvs(d.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setConvs(c => c.filter(x => x.id !== id));
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  }

  async function handleRename(id: string, title: string) {
    setConvs(c => c.map(x => x.id === id ? { ...x, title } : x));
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "#EEF3E9" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
            style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
            aria-label="Back"
          >
            <ArrowLeft01Icon size={18} color="#0F172A" />
          </button>
          <div>
            <h1 className="text-[22px] font-black text-spal-navy leading-tight" style={{ fontFamily: "var(--font-satoshi)" }}>
              Chat History
            </h1>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              {loading ? "Loading…" : convs.length === 0 ? "No chats yet" : `${convs.length} conversation${convs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Tip */}
        {!loading && convs.length > 0 && (
          <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-4 py-2.5 mb-4">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3.5a.75.75 0 110 1.5.75.75 0 010-1.5zM10 9a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 9z" fill="#8B3CFF" />
            </svg>
            <p className="text-[12px] text-purple-700">Swipe left on a chat to delete it</p>
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-5 pb-32">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-[80px] bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                <path d="M20 4C11.16 4 4 10.82 4 19c0 4.2 1.84 7.98 4.8 10.65L8 34l4.5-2.25C14.5 32.56 17.2 33 20 33c8.84 0 16-6.82 16-14S28.84 4 20 4z" fill="#8B3CFF" opacity="0.15"/>
                <circle cx="14" cy="19" r="2" fill="#8B3CFF" opacity="0.5"/>
                <circle cx="20" cy="19" r="2" fill="#8B3CFF" opacity="0.7"/>
                <circle cx="26" cy="19" r="2" fill="#8B3CFF"/>
              </svg>
            </div>
            <p className="text-[17px] font-bold text-spal-navy mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>No chats yet</p>
            <p className="text-[14px] text-neutral-400 max-w-[240px]">Start a conversation with SPAL from the quick menu</p>
            <button
              onClick={() => router.push("/ask")}
              className="mt-5 h-11 px-6 rounded-full text-white text-[14px] font-bold active:scale-95 transition-transform"
              style={{ background: "#8B3CFF", fontFamily: "var(--font-satoshi)" }}
            >
              Chat with SPAL
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {convs.map((conv, i) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <ConvCard
                  conv={conv}
                  onDelete={() => handleDelete(conv.id)}
                  onRename={(t) => handleRename(conv.id, t)}
                  onClick={() => router.push(`/ask/history/${conv.id}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
