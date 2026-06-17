"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Cancel01Icon, Clock05Icon, ThumbsUpIcon, ThumbsDownIcon } from "hugeicons-react";
import { useSPALStore } from "@/store";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; timestamp: string; }
type SessionState = "idle" | "user-speaking" | "thinking" | "spal-speaking" | "ended";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s} secs` : `${s} secs`;
}

async function speakText(text: string): Promise<void> {
  const res = await fetch("/api/ai/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("TTS failed");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended  = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror  = () => { URL.revokeObjectURL(url); reject(); };
    audio.play().catch(reject);
  });
}

// ── Pulsing dots while SPAL speaks ───────────────────────────────────────────
function SpeakingIndicator() {
  const COLORS = ["#ED712E", "#2F63F5", "#8B3CFF"];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-3"
    >
      {COLORS.map((color, i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{ background: color }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

// ── Subtle animated background orbs (visible while SPAL speaks) ──────────────
function BackgroundOrbs({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          {[
            { size: 220, x: -60, y: 80,  color: "rgba(139,60,255,0.22)", delay: 0 },
            { size: 180, x: 180, y: 200, color: "rgba(47,99,245,0.18)",  delay: 0.4 },
            { size: 140, x: 80,  y: 380, color: "rgba(237,113,46,0.15)", delay: 0.8 },
          ].map((orb, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y, background: orb.color, filter: "blur(40px)" }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: [1, 1.15, 1], x: [0, 12, 0], y: [0, -8, 0] }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ opacity: { duration: 0.5 }, scale: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: orb.delay }, x: { duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: orb.delay }, y: { duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: orb.delay } }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AskSPALPage() {
  const router = useRouter();
  const { user } = useSPALStore();
  const name = user?.full_name ?? user?.business_name ?? "there";

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [session,   setSession]   = useState<SessionState>("idle");
  const [convId,    setConvId]    = useState<string | null>(null);
  const [feedback,  setFeedback]  = useState<"up" | "down" | null>(null);
  const [duration,  setDuration]  = useState(0);
  const [inputText, setInputText] = useState(""); // controlled input

  const startTimeRef  = useRef<number | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const inputRef      = useRef<HTMLInputElement>(null);

  // Pre-fill from insights "Ask SPAL" CTAs
  useEffect(() => {
    const prefill = sessionStorage.getItem("spal_ask_prefill");
    if (prefill) {
      sessionStorage.removeItem("spal_ask_prefill");
      setInputText(prefill);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, []);

  // Duration timer — starts on first message, stops on end
  useEffect(() => {
    if (messages.length === 1 && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 1000);
    }
  }, [messages]);

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  // ── Send message → get AI reply → speak it ────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || session === "thinking" || session === "spal-speaking" || session === "ended") return;

    const userMsg: Message = { role: "user", content: trimmed, timestamp: new Date().toISOString() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInputText("");
    setSession("thinking");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId: convId }),
      });
      const data = await res.json();
      if (!data.success) { setSession("idle"); return; }

      const aiMsg: Message = { role: "assistant", content: data.data.reply, timestamp: new Date().toISOString() };
      const allMsgs = [...updatedMsgs, aiMsg];
      setMessages(allMsgs);
      if (data.data.conversationId) setConvId(data.data.conversationId);

      // Speak SPAL's reply
      setSession("spal-speaking");
      await speakText(data.data.reply);
      setSession("idle");
    } catch {
      setSession("idle");
    }
  }, [messages, session, convId]);

  // ── Web Speech API — auto-stop on silence ─────────────────────────────────
  function startVoiceInput() {
    if (session !== "idle") return;
    const SpeechRecognition = window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript.trim()) sendMessage(transcript.trim());
    };
    recognition.onerror  = () => setSession("idle");
    recognition.onend    = () => {
      // onend fires after silence — if still in user-speaking, trigger send
      recognitionRef.current = null;
      if (session === "user-speaking") setSession("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setSession("user-speaking");
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setSession("idle");
  }

  // ── End session → save to history ─────────────────────────────────────────
  async function endSession() {
    stopTimer();
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setSession("ended");
    const finalDuration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    setDuration(finalDuration);

    // Update duration on conversation the chat API already created
    if (convId) {
      try {
        await fetch(`/api/conversations/${convId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration: finalDuration }),
        });
      } catch { /* silent */ }
    }
  }

  function handleSubmit() {
    if (inputText.trim()) sendMessage(inputText);
  }

  const isBusy = session === "thinking" || session === "spal-speaking";

  return (
    <div className="relative flex flex-col overflow-hidden" style={{ minHeight: "100%", background: "linear-gradient(180deg, #B57BFF 0%, #C89EFF 35%, #E8E0FF 65%, #F0EEF8 100%)" }}>

      {/* Animated background orbs when SPAL speaks */}
      <BackgroundOrbs active={session === "spal-speaking"} />

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-2">
        <button
          onClick={() => { if (messages.length > 0 && session !== "ended") endSession().then(() => router.back()); else router.back(); }}
          aria-label="Close"
          className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center active:scale-95 transition-transform shadow-sm"
        >
          <Cancel01Icon size={18} color="#0F172A" />
        </button>
        <button
          onClick={() => router.push("/ask/history")}
          aria-label="Chat history"
          className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center active:scale-95 transition-transform shadow-sm"
        >
          <Clock05Icon size={18} color="#0F172A" />
        </button>
      </div>

      {/* ── SPAL avatar + greeting ── */}
      <div className="relative z-10 flex flex-col items-center flex-1 justify-center px-8 text-center" style={{ paddingBottom: "160px" }}>
        <motion.div
          animate={session === "spal-speaking" ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={session === "spal-speaking" ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
          className="mb-6"
          style={{ filter: "drop-shadow(0 8px 24px rgba(139,60,255,0.35))" }}
        >
          <Image src="/spal-ai.webp" alt="SPAL" width={160} height={160} className="w-40 h-40 object-contain" priority />
        </motion.div>

        <p className="text-[15px] text-white/80 font-medium mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>
          Hello {name}
        </p>

        <AnimatePresence mode="wait">
          {session === "ended" ? (
            // "Voice chat has ended" card
            <motion.div
              key="ended"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-white rounded-2xl px-5 py-4 w-full max-w-[320px]"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <rect x="3" y="5" width="4" height="14" rx="2" fill="#8B3CFF" opacity="0.4" />
                    <rect x="8" y="3" width="4" height="18" rx="2" fill="#8B3CFF" opacity="0.7" />
                    <rect x="13" y="7" width="4" height="10" rx="2" fill="#8B3CFF" />
                    <rect x="18" y="9" width="3" height="6" rx="1.5" fill="#8B3CFF" opacity="0.5" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Voice chat has ended</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">You spoke for {fmtDuration(duration)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFeedback("up")}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: feedback === "up" ? "#DCFCE7" : "transparent" }}
                    aria-label="Thumbs up"
                  >
                    <ThumbsUpIcon size={16} color={feedback === "up" ? "#16A34A" : "#9CA3AF"} />
                  </button>
                  <button
                    onClick={() => setFeedback("down")}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: feedback === "down" ? "#FEE2E2" : "transparent" }}
                    aria-label="Thumbs down"
                  >
                    <ThumbsDownIcon size={16} color={feedback === "down" ? "#DC2626" : "#9CA3AF"} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : session === "spal-speaking" ? (
            // Pulsing dots while SPAL speaks
            <motion.div key="speaking" className="flex flex-col items-center gap-4">
              <SpeakingIndicator />
            </motion.div>
          ) : session === "thinking" ? (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-white/60"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </motion.div>
          ) : session === "user-speaking" ? (
            <motion.div key="user-speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <motion.div className="w-2 h-2 rounded-full bg-red-400"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              <span className="text-white text-[13px] font-medium">Listening…</span>
            </motion.div>
          ) : (
            <motion.h1
              key="prompt"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="font-bold text-spal-navy leading-snug"
              style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(24px,7vw,32px)" }}
            >
              What do you want to ask me about your business?
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input bar ── */}
      <div className="absolute left-0 right-0 z-20 px-5" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <div
          className="flex items-center gap-3 px-5 h-[60px] rounded-full"
          style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.4)" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Ask Anything..."
            disabled={isBusy || session === "ended"}
            className="flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-white/60 text-spal-navy disabled:opacity-40"
            style={{ fontFamily: "var(--font-satoshi)" }}
          />

          <AnimatePresence mode="wait">
            {session === "ended" ? null : isBusy ? null : inputText.trim() ? (
              // Send button when text is typed
              <motion.button key="send" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleSubmit}
                className="w-10 h-10 rounded-full bg-spal-navy flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                aria-label="Send">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.button>
            ) : session === "user-speaking" ? (
              // Tap to stop listening
              <motion.button key="mic-stop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={stopVoiceInput}
                className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-red-500 active:scale-90 transition-transform flex-shrink-0"
                aria-label="Stop listening">
                <div className="w-3 h-3 bg-white rounded-sm" />
                <span className="text-white text-[12px] font-bold">Stop</span>
              </motion.button>
            ) : (
              // Voice waveform icon
              <motion.button key="mic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={startVoiceInput}
                disabled={session !== "idle"}
                className="flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
                aria-label="Speak">
                <svg viewBox="0 0 36 24" fill="none" className="w-9 h-6">
                  {[3,7,11,15,19,23,27,31].map((x, i) => {
                    const hs = [8,14,20,24,22,16,10,6];
                    const h = hs[i];
                    return <rect key={x} x={x} y={(24-h)/2} width="3" height={h} rx="1.5" fill="rgba(255,255,255,0.7)" />;
                  })}
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Stop conversation button — only shown when session is active */}
        {messages.length > 0 && session !== "ended" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-3">
            <button
              onClick={endSession}
              className="flex items-center gap-2 h-9 px-5 rounded-full text-[13px] font-semibold active:scale-95 transition-transform"
              style={{ background: "rgba(255,255,255,0.25)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <div className="w-3 h-3 bg-white rounded-sm flex-shrink-0" />
              Stop
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
