"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Cancel01Icon, Clock05Icon, ThumbsUpIcon, ThumbsDownIcon } from "hugeicons-react";
import { useSPALStore } from "@/store";

interface Message { role: "user" | "assistant"; content: string; timestamp: string; }
type SessionState = "idle" | "listening" | "thinking" | "spal-speaking" | "ended";

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s} secs` : `${s} secs`;
}

// ── Gemini-style ambient orbs ─────────────────────────────────────────────────
function AmbientOrbs({ speaking }: { speaking: boolean }) {
  const orbs = [
    { color: "#8B3CFF", size: 360, x: "0%",  y: "5%",  dur: 9,  delay: 0   },
    { color: "#2F63F5", size: 300, x: "55%", y: "0%",  dur: 11, delay: 2   },
    { color: "#ED712E", size: 240, x: "10%", y: "55%", dur: 8,  delay: 1   },
    { color: "#22C55E", size: 220, x: "65%", y: "50%", dur: 10, delay: 3   },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y, background: orb.color, filter: "blur(80px)" }}
          animate={{
            x: [0, 28, -18, 12, 0],
            y: [0, -22, 28, -10, 0],
            scale: speaking ? [1.0, 1.35, 1.05, 1.2, 1.0] : [0.55, 0.7, 0.6, 0.65, 0.55],
            opacity: speaking ? [0.55, 0.8, 0.6, 0.7, 0.55] : [0.16, 0.26, 0.18, 0.22, 0.16],
          }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
        />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AskSPALPage() {
  const router = useRouter();
  const { user } = useSPALStore();
  const name = user?.full_name ?? user?.business_name ?? "there";

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [session,   setSession]   = useState<SessionState>("idle");
  const [convId,    setConvId]    = useState<string | null>(null);
  const [feedback,  setFeedback]  = useState<"up" | "down" | null>(null);
  const [duration,  setDuration]  = useState(0);
  const [inputText, setInputText] = useState("");
  const [chatActive, setChatActive] = useState(false); // voice loop running

  // Refs — so async callbacks always see latest values without re-creating
  const endedRef          = useRef(false);
  const chatActiveRef     = useRef(false);
  const sessionRef        = useRef<SessionState>("idle");
  const messagesRef       = useRef<Message[]>([]);
  const convIdRef         = useRef<string | null>(null);
  const recognitionRef    = useRef<any>(null);
  const pendingTranscript = useRef<string | null>(null);
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRef         = useRef(false); // user is typing → pause the mic loop
  const audioCtxRef       = useRef<AudioContext | null>(null);
  const audioSourceRef    = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef      = useRef<number | null>(null);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  // Keep refs in sync with state
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { chatActiveRef.current = chatActive; }, [chatActive]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { convIdRef.current = convId; }, [convId]);

  function setSessionSync(s: SessionState) { sessionRef.current = s; setSession(s); }

  // Duration timer
  useEffect(() => {
    if (messages.length === 1 && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 1000);
    }
  }, [messages]);

  // ── Audio ────────────────────────────────────────────────────────────────────
  function ensureAudioCtx(): AudioContext {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }

  // Short UI tones for tactile feedback: a rising "open" cue, a softer "close" cue.
  function playCue(kind: "start" | "stop") {
    try {
      const ctx = ensureAudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      if (kind === "start") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      } else {
        osc.frequency.setValueAtTime(560, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.14);
      }
      // gentle attack + decay so it never clicks or feels harsh
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch { /* audio not available — ignore */ }
  }

  function stopAudio() {
    try { audioSourceRef.current?.stop(); } catch { /* already ended */ }
    audioSourceRef.current = null;
  }

  async function speakText(text: string): Promise<void> {
    const ctx = ensureAudioCtx();
    const res = await fetch("/api/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (endedRef.current) return;          // ended while TTS was fetching
    if (!res.ok) throw new Error("TTS failed");
    const buf = await res.arrayBuffer();
    if (endedRef.current) return;          // ended while reading body
    await ctx.resume();
    const decoded = await ctx.decodeAudioData(buf);
    if (endedRef.current) return;          // ended while decoding — don't play
    return new Promise((resolve) => {
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(ctx.destination);
      src.onended = () => { audioSourceRef.current = null; resolve(); };
      audioSourceRef.current = src;
      src.start(0);
    });
  }

  // ── Speech recognition (interim results + manual silence detection) ─────────
  // We run a continuous recognizer and use our own 1.1s silence timer so SPAL
  // replies fast — much quicker than the browser's built-in end-of-speech delay.
  const startRecognition = useCallback(() => {
    if (endedRef.current || !chatActiveRef.current || typingRef.current) return;
    if (recognitionRef.current) return; // one recognizer at a time
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;   // fire as the user speaks
    r.maxAlternatives = 1;
    r.continuous = true;       // keep one session; we decide when to submit

    const clearSilence = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    };

    // Stop recognizer after a short pause → onend submits the transcript
    const armSilence = () => {
      clearSilence();
      silenceTimerRef.current = setTimeout(() => {
        try { r.stop(); } catch { /* already stopped */ }
      }, 850);
    };

    r.onresult = (e: any) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0]?.transcript ?? "";
      }
      if (full.trim()) {
        pendingTranscript.current = full.trim();
        armSilence(); // reset the silence countdown on every new word
      }
    };

    r.onerror = (e: any) => {
      clearSilence();
      recognitionRef.current = null;
      if (endedRef.current) return;
      // no-speech / aborted = just silence, keep listening
      if (chatActiveRef.current && !typingRef.current) setTimeout(startRecognition, 200);
      else if (!typingRef.current) setSessionSync("idle");
    };

    r.onend = () => {
      clearSilence();
      recognitionRef.current = null;
      if (endedRef.current) return;

      const transcript = pendingTranscript.current;
      pendingTranscript.current = null;

      if (transcript) {
        // Got speech — send to SPAL (mic restarts after SPAL responds)
        sendAndRespond(transcript);
      } else if (chatActiveRef.current && !typingRef.current) {
        // Pure silence, no words — restart mic to keep listening
        setTimeout(startRecognition, 150);
      } else if (!typingRef.current) {
        setSessionSync("idle");
      }
    };

    recognitionRef.current = r;
    setSessionSync("listening");
    try { r.start(); } catch { /* already started */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send user message → AI → TTS → restart mic ────────────────────────────
  const sendAndRespond = useCallback(async (text: string) => {
    if (endedRef.current) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date().toISOString() };
    const updated = [...messagesRef.current, userMsg];
    setMessages(updated); messagesRef.current = updated;
    setSessionSync("thinking");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: convIdRef.current }),
      });
      const data = await res.json();
      if (endedRef.current) return;
      if (!data.success) { setSessionSync("listening"); if (chatActiveRef.current) startRecognition(); return; }

      const aiMsg: Message = { role: "assistant", content: data.data.reply, timestamp: new Date().toISOString() };
      const all = [...updated, aiMsg];
      setMessages(all); messagesRef.current = all;
      if (data.data.conversationId) { setConvId(data.data.conversationId); convIdRef.current = data.data.conversationId; }

      if (endedRef.current) return;
      setSessionSync("spal-speaking");
      await speakText(data.data.reply);

      if (endedRef.current) return;
      // After SPAL speaks, restart mic for seamless loop
      if (chatActiveRef.current) {
        setTimeout(startRecognition, 300);
      } else {
        setSessionSync("idle");
      }
    } catch {
      if (!endedRef.current) {
        if (chatActiveRef.current) { setSessionSync("listening"); setTimeout(startRecognition, 500); }
        else setSessionSync("idle");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRecognition]);

  // ── Reset everything for a brand-new conversation ─────────────────────────
  function resetForNewChat() {
    endedRef.current = false;
    chatActiveRef.current = false;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    startTimeRef.current = null;
    pendingTranscript.current = null;
    convIdRef.current = null;
    messagesRef.current = [];
    setMessages([]);
    setConvId(null);
    setFeedback(null);
    setDuration(0);
    setChatActive(false);
    setSessionSync("idle");
  }

  // ── Activate voice mode ───────────────────────────────────────────────────
  function activateVoice() {
    if (endedRef.current) resetForNewChat();
    ensureAudioCtx(); // unlock audio on user gesture
    playCue("start");
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 1000);
    }
    chatActiveRef.current = true;
    setChatActive(true);
    startRecognition();
  }

  // ── Typing pauses the mic so it doesn't auto-submit voice over your text ───
  function pauseForTyping() {
    typingRef.current = true;
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    pendingTranscript.current = null;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (sessionRef.current === "listening") setSessionSync("idle");
  }

  function resumeFromTyping() {
    if (!typingRef.current) return;
    typingRef.current = false;
    if (chatActiveRef.current && !endedRef.current) startRecognition();
  }

  // ── Text send ─────────────────────────────────────────────────────────────
  function handleTextSend() {
    const text = inputText.trim();
    if (!text) return;
    if (endedRef.current) resetForNewChat();
    ensureAudioCtx();
    setInputText("");
    typingRef.current = false; // sendAndRespond will restart the mic when done
    chatActiveRef.current = true;
    setChatActive(true);
    sendAndRespond(text);
  }

  // ── End session ───────────────────────────────────────────────────────────
  async function endSession() {
    playCue("stop");
    endedRef.current = true;
    chatActiveRef.current = false;
    setChatActive(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    stopAudio();
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    const dur = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    setDuration(dur);
    setSessionSync("ended");

    if (convIdRef.current) {
      try {
        await fetch(`/api/conversations/${convIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration: dur }),
        });
      } catch { /* silent */ }
    }
  }

  const isEnded    = session === "ended";
  const isListening = session === "listening";
  const isSpeaking  = session === "spal-speaking";
  const isThinking  = session === "thinking";

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden z-40"
      style={{ background: "linear-gradient(160deg, #ECD5FF 0%, #C9A8FF 18%, #B8D0FF 48%, #D0E9FF 72%, #EAF4FF 100%)" }}
    >
      <AmbientOrbs speaking={isSpeaking} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-2">
        <button
          onClick={() => { if (!isEnded && messages.length > 0) endSession().then(() => router.back()); else router.back(); }}
          aria-label="Close"
          className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <Cancel01Icon size={18} color="#121212" />
        </button>
        <button
          onClick={() => router.push("/ask/history")}
          aria-label="Chat history"
          className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <Clock05Icon size={18} color="#121212" />
        </button>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center flex-1 justify-center px-8 text-center" style={{ paddingBottom: "140px" }}>
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={isSpeaking ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
          className="mb-5"
        >
          <Image src="/spal-ai.webp" alt="SPAL" width={160} height={160} className="w-36 h-36 object-contain" priority />
        </motion.div>

        <p className="text-[15px] font-semibold mb-3" style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}>
          Hello {name}
        </p>

        <AnimatePresence mode="wait">
          {isEnded ? (
            <motion.div key="ended" initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className="relative bg-white/75 backdrop-blur-sm rounded-2xl px-5 py-4 w-full max-w-[300px]"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <button onClick={resetForNewChat} aria-label="Dismiss"
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                <Cancel01Icon size={13} color="#6B7280" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <rect x="3" y="5" width="4" height="14" rx="2" fill="#8B3CFF" opacity="0.4"/>
                    <rect x="8" y="3" width="4" height="18" rx="2" fill="#8B3CFF" opacity="0.7"/>
                    <rect x="13" y="7" width="4" height="10" rx="2" fill="#8B3CFF"/>
                    <rect x="18" y="9" width="3" height="6" rx="1.5" fill="#8B3CFF" opacity="0.5"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold" style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}>Voice chat has ended</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">You spoke for {fmtDuration(duration)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFeedback("up")} aria-label="Thumbs up"
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: feedback === "up" ? "#DCFCE7" : "transparent" }}>
                    <ThumbsUpIcon size={15} color={feedback === "up" ? "#16A34A" : "#9CA3AF"} />
                  </button>
                  <button onClick={() => setFeedback("down")} aria-label="Thumbs down"
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: feedback === "down" ? "#FEE2E2" : "transparent" }}>
                    <ThumbsDownIcon size={15} color={feedback === "down" ? "#DC2626" : "#9CA3AF"} />
                  </button>
                </div>
              </div>
            </motion.div>

          ) : isSpeaking ? (
            <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              {["#ED712E", "#2F63F5", "#8B3CFF"].map((c, i) => (
                <motion.div key={i} className="w-3 h-3 rounded-full" style={{ background: c }}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22 }} />
              ))}
            </motion.div>

          ) : isThinking ? (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(18,18,18,0.25)" }}
                  animate={{ opacity: [0.25, 0.8, 0.25] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </motion.div>

          ) : isListening ? (
            <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-full px-4 py-2">
              <motion.div className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
              <span className="text-[13px] font-medium" style={{ color: "#121212" }}>Listening…</span>
            </motion.div>

          ) : (
            <motion.h1 key="prompt" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="font-bold leading-snug"
              style={{ color: "#121212", fontFamily: "var(--font-satoshi)", fontSize: "clamp(22px,6.5vw,30px)" }}>
              What do you want to ask me about your business?
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar — always present so a new chat can start right after one ends */}
      {(
        <div className="absolute left-0 right-0 z-20 px-5" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
          <div
            className="flex items-center gap-3 px-4 h-[60px] rounded-full"
            style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.8)" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onFocus={pauseForTyping}
              onBlur={() => { if (!inputText.trim()) resumeFromTyping(); }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleTextSend(); } }}
              placeholder="Ask Anything..."
              className="flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-neutral-400"
              style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}
            />

            <AnimatePresence mode="wait">
              {inputText.trim() ? (
                // Send button when typing
                <motion.button key="send"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleTextSend}
                  className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                  style={{ background: "#8B3CFF" }} aria-label="Send">
                  <svg fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </motion.button>

              ) : chatActive ? (
                // Red stop square — ends entire conversation
                <motion.button key="stop"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={endSession}
                  className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                  aria-label="End conversation">
                  <div className="w-4 h-4 rounded-sm bg-white" />
                </motion.button>

              ) : (
                // Waveform mic — tap to start voice chat
                <motion.button key="mic"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={activateVoice}
                  className="flex-shrink-0 active:scale-90 transition-transform" aria-label="Start voice chat">
                  <svg viewBox="0 0 36 24" fill="none" className="w-9 h-6">
                    {[3,7,11,15,19,23,27,31].map((x, i) => {
                      const hs = [8,14,20,24,22,16,10,6];
                      return <rect key={x} x={x} y={(24-hs[i])/2} width="3" height={hs[i]} rx="1.5" fill="rgba(18,18,18,0.35)" />;
                    })}
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
