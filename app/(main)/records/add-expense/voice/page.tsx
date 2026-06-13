"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Square } from "lucide-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";

const BG = "#F7F9F5";
const fontFamily = "var(--font-satoshi)";

type Status = "idle" | "recording" | "processing" | "done";

interface ParsedItem {
  type: string;
  description: string;
  amount: number;
  category: string;
}

const BAR_COUNT = 20;

export default function VoiceExpensePage() {
  const router = useRouter();
  const { bumpRecordSaved } = useSPALStore();

  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>(Array(BAR_COUNT).fill(8));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const barTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (barTimerRef.current) clearInterval(barTimerRef.current);
    };
  }, []);

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      setStatus("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      barTimerRef.current = setInterval(() => {
        setBarHeights(Array.from({ length: BAR_COUNT }, () => 4 + Math.random() * 28));
      }, 120);
    } catch {
      alert("Microphone access denied. Please allow microphone access.");
    }
  }

  async function stopRecording() {
    if (!mediaRecorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (barTimerRef.current) clearInterval(barTimerRef.current);
    setBarHeights(Array(BAR_COUNT).fill(8));
    setStatus("processing");

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      try {
        const fd = new FormData();
        fd.append("audio", blob, "recording.webm");
        const tRes = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
        const tData = await tRes.json();
        const text = tData.text ?? tData.transcript ?? "";
        setTranscript(text);

        if (text) {
          const pRes = await fetch("/api/ai/parse-record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          const pData = await pRes.json();
          const parsed: ParsedItem[] = pData.data ?? pData.records ?? [];
          setItems(parsed.filter((it) => it.type === "expense"));
        }
        setStatus("done");
      } catch {
        setStatus("idle");
      }
    };
    mediaRecorderRef.current.stop();
  }

  function toggleRecording() {
    if (status === "idle" || status === "done") startRecording();
    else if (status === "recording") stopRecording();
  }

  async function handleSave() {
    const expenseItems = items.filter((it) => it.type === "expense");
    if (expenseItems.length === 0 || saving) return;
    setSaving(true);
    try {
      const responses = await Promise.all(
        expenseItems.map((it) =>
          fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "expense",
              amount: it.amount,
              description: it.description,
              category: it.category ?? "Expenses",
              input_method: "voice",
              record_date: new Date().toISOString().slice(0, 10),
            }),
          })
        )
      );
      const failed = responses.find((r) => !r.ok);
      if (failed) {
        const err = await failed.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${failed.status}`);
      }
      bumpRecordSaved();
      router.refresh();
      router.push("/home");
    } catch {
      setSaving(false);
    }
  }

  const statusText =
    status === "idle" ? "Tap to start recording"
    : status === "recording" ? `● Recording...  ${formatTime(elapsed)}`
    : status === "processing" ? "SPAL is processing..."
    : "Done! Review below";

  const expenseItems = items.filter((it) => it.type === "expense");

  return (
    <div className="min-h-full pb-36" style={{ background: BG, fontFamily }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(15,23,42,0.06)" }}
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <span className="text-[16px] font-semibold text-spal-navy" style={{ fontFamily }}>Voice Entry</span>
      </div>

      <div className="px-5">
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily }}>Just talk naturally</h1>
        <p className="text-[13px] text-neutral-500 mt-1 leading-relaxed" style={{ fontFamily }}>
          Say what you spent, how much and what for. SPAL does the rest
        </p>

        {/* Sound wave */}
        <div className="mt-8 flex items-center justify-center gap-[3px] h-12">
          {barHeights.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: h }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="rounded-full"
              style={{ width: 3, background: status === "recording" ? "#F97316" : "#D1D5DB" }}
            />
          ))}
        </div>

        {/* Mic button */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="relative">
            {status === "recording" && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(249,115,22,0.25)" }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <button
              onClick={toggleRecording}
              disabled={status === "processing"}
              className="relative w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              style={{ background: "#F97316", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}
              aria-label={status === "recording" ? "Stop recording" : "Start recording"}
            >
              {status === "recording"
                ? <Square size={28} strokeWidth={2} color="#fff" fill="#fff" />
                : <Mic size={28} strokeWidth={2} color="#fff" />}
            </button>
          </div>

          <p
            className="text-[13px] font-medium text-center"
            style={{ fontFamily, color: status === "recording" ? "#F97316" : status === "processing" ? "#F97316" : "#6B7280" }}
          >
            {statusText}
          </p>
        </div>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-2xl px-4 py-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-2" style={{ fontFamily }}>
                Live Transcript
              </p>
              <p className="text-[13px] text-spal-navy leading-relaxed" style={{ fontFamily }}>{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extracted items */}
        <AnimatePresence>
          {expenseItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase mb-3" style={{ fontFamily }}>
                SPAL is extracting
              </p>
              <div className="space-y-2.5">
                {expenseItems.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3"
                    style={{
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      border: i === 0 ? "1.5px solid #F97316" : "1.5px solid transparent",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFF3E0" }}>
                      <span className="text-lg">🧾</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-spal-navy truncate" style={{ fontFamily }}>{item.description}</p>
                      <span
                        className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "#FFF7ED", color: "#C2410C" }}
                      >
                        {item.category ?? "Expenses"}
                      </span>
                    </div>
                    <p className="text-[15px] font-bold flex-shrink-0" style={{ fontFamily, color: "#F97316" }}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed CTA */}
      <AnimatePresence>
        {expenseItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-6 pt-3"
            style={{ background: "linear-gradient(to top, #F7F9F5 80%, transparent)" }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ fontFamily, background: "#F97316" }}
            >
              {saving ? "Saving..." : `Save ${expenseItems.length} ${expenseItems.length === 1 ? "expense" : "expenses"}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
