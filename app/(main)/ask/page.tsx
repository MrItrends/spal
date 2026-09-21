"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft01Icon, Folder01Icon, MessageAdd01Icon, PlusSignSquareIcon,
  Mic01Icon, SentIcon,
} from "hugeicons-react";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";

const SUGGESTIONS = [
  "What is the price of rice in Kubwa?",
  "How much did I make in 2025?",
  "What is the price of tomatoes in Lagos?",
];

interface Msg { role: "user" | "assistant"; content: string }

export default function AskPage() {
  return <Suspense><AskInner /></Suspense>;
}

function AskInner() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Honor a prefilled prompt set by other screens (Insights, Home orb, etc.).
  useEffect(() => {
    try {
      const pre = sessionStorage.getItem("spal_ask_prefill");
      if (pre) { sessionStorage.removeItem("spal_ask_prefill"); send(pre); }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationId }),
      });
      const d = await res.json();
      if (d.success) {
        setMessages((m) => [...m, { role: "assistant", content: d.data.reply }]);
        if (d.data.conversationId) setConversationId(d.data.conversationId);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't answer that. Please try again." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong. Please check your connection." }]);
    } finally { setSending(false); }
  }

  async function toggleMic() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) return;
        const fd = new FormData();
        fd.append("audio", blob, "voice.webm");
        try {
          const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
          const d = await res.json();
          if (d.success && d.data.text) setInput((prev) => (prev ? prev + " " : "") + d.data.text);
        } catch { /* ignore */ }
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch { setRecording(false); }
  }

  function newChat() { setMessages([]); setConversationId(null); setInput(""); }

  const empty = messages.length === 0 && !sending;

  return (
    <div className="flex flex-col" style={{ background: BG, fontFamily: FF, height: "100dvh" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { window.location.href = "/home"; }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
            <ArrowLeft01Icon size={20} color="#0F172A" />
          </button>
          <h1 className="text-[22px] font-black text-spal-navy tracking-wide" style={{ fontFamily: FF }}>ASK SPAL</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => { window.location.href = "/ask/folders"; }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Chat folders">
            <Folder01Icon size={19} color="#0F172A" />
          </button>
          <button onClick={() => { window.location.href = "/ask/history"; }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Chat history">
            <MessageAdd01Icon size={19} color="#0F172A" />
          </button>
        </div>
      </div>

      {/* Body */}
      {empty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <Image src="/spal-ai.webp" alt="SPAL" width={140} height={140} className="w-32 h-32 object-contain" priority />
          <p className="text-[24px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>Start your first Conversation</p>
          <p className="text-[15px] text-neutral-500 mt-1.5 max-w-[300px]" style={{ fontFamily: FF }}>Ask SPAL anything you&apos;d like to know about your business</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed"
                style={{ fontFamily: FF, background: m.role === "user" ? "#22C55E" : "#fff",
                  color: m.role === "user" ? "#fff" : "#0F172A", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions (empty only) */}
      {empty && (
        <div className="px-5 space-y-3 mb-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="w-full text-left bg-white rounded-2xl px-5 py-4 text-[15px] font-medium text-spal-navy active:scale-[0.99] transition-transform"
              style={{ fontFamily: FF, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pt-2 pb-safe">
        <div className="flex items-center gap-2 rounded-full bg-white px-3"
          style={{ height: 60, border: "2px solid #C9B8F0", boxShadow: "0 6px 24px rgba(139,92,246,0.15)" }}>
          <button className="w-9 h-9 flex items-center justify-center flex-shrink-0" aria-label="Add">
            <PlusSignSquareIcon size={24} color="#6B7280" />
          </button>
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="Ask Anything.."
            className="flex-1 bg-transparent outline-none text-[16px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }}
          />
          <button onClick={toggleMic} className="w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90" aria-label="Voice to text">
            <Mic01Icon size={22} color={recording ? "#DC2626" : "#6B7280"} />
          </button>
          <button onClick={() => send(input)} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: input.trim() ? "#22C55E" : "#D6DDD2" }} aria-label="Send">
            <SentIcon size={18} color="#fff" />
          </button>
        </div>
        <AnimatePresence>
          {recording && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-[12.5px] font-semibold mt-2" style={{ color: "#DC2626", fontFamily: FF }}>
              Listening… tap the mic to stop
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
