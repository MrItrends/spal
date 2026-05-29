"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore } from "@/store";

type VoiceState = "idle" | "recording" | "transcribing";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "How much did I make today?",
  "What was my biggest expense this week?",
  "Explain my profit to me",
  "How can I spend less?",
];

export default function AskSPALPage() {
  const { user } = useSPALStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const bottomRef          = useRef<HTMLDivElement>(null);
  const inputRef           = useRef<HTMLInputElement>(null);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const chunksRef          = useRef<Blob[]>([]);
  const streamRef          = useRef<MediaStream | null>(null);
  const name = user?.full_name ?? user?.business_name ?? "there";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (data.data.conversationId) setConversationId(data.data.conversationId);
    } catch {
      setError("Can't reach SPAL right now. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  // ── Voice input: tap-to-toggle recording ──────────────────────────────────
  async function handleVoiceTap() {
    if (voiceState === "recording") { stopRecording(); return; }
    if (voiceState !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1000) { setVoiceState("idle"); return; }
        setVoiceState("transcribing");
        try {
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          const res  = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.success && data.data?.text?.trim()) {
            sendMessage(data.data.text.trim());
          }
        } catch { /* silent */ }
        finally { setVoiceState("idle"); }
      };
      mr.start(250);
      setVoiceState("recording");
    } catch {
      setError("Microphone access denied.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }

  function cancelRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setVoiceState("idle");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-spal-bg border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-spal-green rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            S
          </div>
          <div>
            <h1 className="text-base font-bold text-spal-navy font-[family-name:var(--font-poppins)] leading-tight">
              Ask SPAL
            </h1>
            <p className="text-xs text-spal-green font-medium">● Online</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scroll-container px-4 py-4">
        {messages.length === 0 ? (
          <EmptyChat name={name} onPrompt={sendMessage} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 bg-spal-green rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mb-0.5">
                      S
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-spal-blue text-white rounded-br-md"
                        : "bg-white text-spal-navy rounded-bl-md shadow-sm border border-neutral-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-end gap-2"
              >
                <div className="w-7 h-7 bg-spal-green rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                  S
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-neutral-100">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-xs text-red-400 bg-red-50 rounded-xl px-4 py-2 inline-block">
                  {error}
                </p>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar — swaps to recording UI when voice is active */}
      <AnimatePresence mode="wait">
        {voiceState === "recording" ? (
          <motion.div key="rec" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white border-t border-neutral-100 px-5 pt-4 pb-safe pb-5 flex-shrink-0">
            <div className="flex flex-col items-center gap-3">
              {/* Waveform bars */}
              <div className="flex items-end gap-[3px] h-6">
                {[0.5, 0.9, 0.6, 1, 0.7, 0.9, 0.5, 0.6, 0.8].map((h, i) => (
                  <motion.div key={i} className="w-[3px] bg-spal-green rounded-full"
                    animate={{ scaleY: [h, 0.2, h] }}
                    transition={{ duration: 0.6 + (i % 3) * 0.1, repeat: Infinity, delay: i * 0.06 }}
                    style={{ height: "100%", transformOrigin: "bottom" }} />
                ))}
              </div>
              <p className="text-sm font-medium text-neutral-500">Listening… tap stop when done</p>
              <div className="flex gap-3 w-full">
                <button onClick={cancelRecording}
                  className="flex-1 h-11 rounded-2xl bg-neutral-100 text-neutral-500 text-sm font-semibold">
                  Cancel
                </button>
                <button onClick={stopRecording}
                  className="flex-1 h-11 rounded-2xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-sm" /> Stop
                </button>
              </div>
            </div>
          </motion.div>
        ) : voiceState === "transcribing" ? (
          <motion.div key="trans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white border-t border-neutral-100 px-5 pt-3 pb-safe pb-5 flex-shrink-0">
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-spal-green border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-400">Transcribing…</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 bg-white border-t border-neutral-100 pb-safe flex-shrink-0">
            <div className="flex items-center gap-2 bg-neutral-50 rounded-2xl px-3 h-12 border border-neutral-200 focus-within:border-spal-blue transition-colors">
              {/* Mic button */}
              <motion.button onClick={handleVoiceTap} disabled={loading} whileTap={{ scale: 0.88 }}
                className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 disabled:opacity-30">
                <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </motion.button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about your sales, profit, expenses..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-spal-navy placeholder:text-neutral-300 outline-none disabled:opacity-60"
              />
              <motion.button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} whileTap={{ scale: 0.9 }}
                className="w-8 h-8 bg-spal-blue rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity active:scale-95"
                aria-label="Send">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EmptyChat({ name, onPrompt }: { name: string; onPrompt: (s: string) => void }) {
  return (
    <div className="flex flex-col h-full py-4">
      {/* SPAL greeting */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="w-16 h-16 bg-spal-green rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-md"
        >
          S
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-bold text-spal-navy font-[family-name:var(--font-poppins)]">
            Hey {name}! 👋
          </h2>
          <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
            Ask me anything about your sales,
            <br />
            expenses, or how to grow your business.
          </p>
        </motion.div>
      </div>

      {/* Suggested prompts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wide mb-3">
          Try asking...
        </p>
        <div className="space-y-2.5">
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPrompt(prompt)}
              className="w-full text-left bg-white rounded-2xl px-4 py-3.5 text-sm text-spal-navy font-medium shadow-sm border border-neutral-100 active:bg-neutral-50 transition-colors"
            >
              <span className="mr-2">💬</span>{prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
