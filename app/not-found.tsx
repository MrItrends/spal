"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Home } from "lucide-react";

const COLS    = 4;
const ROWS    = 3;
const TOTAL   = COLS * ROWS;          // 12 tiles
const INFO    = 5;                    // original index of the "PAGE NOT FOUND" cell
const FF      = "var(--font-satoshi), system-ui, sans-serif";

// ── helpers ──────────────────────────────────────────────────────────────────
function shuffleArr(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function solved(cells: number[]) {
  return cells.every((v, i) => v === i);
}

function makeShuffle(): number[] {
  let a: number[];
  do { a = shuffleArr(Array.from({ length: TOTAL }, (_, i) => i)); }
  while (solved(a));
  return a;
}

// ── Canvas confetti ──────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const c   = ref.current; if (!c) return;
    c.width   = window.innerWidth;
    c.height  = window.innerHeight;
    const ctx = c.getContext("2d")!;
    const CLR = ["#22C55E","#2563EB","#F97316","#8B5CF6","#FCD34D","#F472B6","#38BDF8"];
    const ps  = Array.from({ length: 220 }, () => ({
      x:   Math.random() * c.width, y: -30 - Math.random() * 120,
      vx:  (Math.random() - 0.5) * 6, vy: 2 + Math.random() * 3.5,
      col: CLR[Math.floor(Math.random() * CLR.length)],
      w:   5 + Math.random() * 9, h: 3 + Math.random() * 5,
      rot: Math.random() * 360,   rv: (Math.random() - 0.5) * 12,
    }));
    let raf: number; let f = 0;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.065; p.rot += p.rv;
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.col; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      }
      if (++f < 310) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, c.width, c.height);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[60]" />;
}

// ── Single grid cell ─────────────────────────────────────────────────────────
interface CellProps {
  tileIdx:   number;   // which original tile occupies this position
  cellW:     number;
  cellH:     number;
  gridW:     number;
  gridH:     number;
  fontSize:  number;
  selected:  boolean;
  flash:     boolean;
  onClick:   () => void;
}

function Cell({ tileIdx, cellW, cellH, gridW, gridH, fontSize, selected, flash, onClick }: CellProps) {
  const col    = tileIdx % COLS;
  const row    = Math.floor(tileIdx / COLS);
  const isInfo = tileIdx === INFO;

  return (
    <motion.div
      onClick={onClick}
      animate={{ scale: selected ? 0.96 : 1 }}
      transition={{ duration: 0.12 }}
      style={{
        width:    cellW,
        height:   cellH,
        position: "relative",
        overflow: "hidden",
        cursor:   "pointer",
        boxSizing: "border-box",
        // Grid line between cells: right + bottom border except last col/row
        border: "1px solid rgba(255,255,255,0.07)",
        outline: selected
          ? "2px solid #22C55E"
          : "none",
        outlineOffset: "-2px",
        background: selected ? "rgba(34,197,94,0.06)" : "transparent",
        transition: "background 0.15s",
        zIndex: selected ? 2 : 1,
      }}
    >
      {/* 404 text — positioned so this cell shows the right slice */}
      <div
        style={{
          position:       "absolute",
          left:           -col * cellW,
          top:            -row * cellH + (gridH - fontSize * 0.72) / 2,
          width:          gridW,
          pointerEvents:  "none",
          userSelect:     "none",
        }}
      >
        <span
          style={{
            display:     "block",
            fontSize:    fontSize,
            fontWeight:  900,
            color:       "#FFFFFF",
            fontFamily:  FF,
            letterSpacing: "-0.03em",
            lineHeight:  0.72,
            textAlign:   "center",
            whiteSpace:  "nowrap",
          }}
        >
          404
        </span>
      </div>

      {/* Green flash when correctly placed */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            style={{ position: "absolute", inset: 0,
                     background: "rgba(34,197,94,0.28)", pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>

      {/* Selected glow overlay */}
      {selected && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                      boxShadow: "inset 0 0 20px rgba(34,197,94,0.25)" }} />
      )}

      {/* Info overlay — "PAGE NOT FOUND" cell */}
      {isInfo && (
        <div
          style={{
            position:      "absolute", inset: 0,
            background:    "rgba(9,14,27,0.91)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            display:       "flex",
            flexDirection: "column",
            alignItems:    "flex-start",
            justifyContent:"center",
            padding:       "0 16px",
            pointerEvents: "none",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                      color: "#22C55E", fontFamily: FF, marginBottom: 8,
                      textTransform: "uppercase" }}>
            Error 404
          </p>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#fff",
                      fontFamily: FF, lineHeight: 1.25, margin: 0 }}>
            PAGE<br />NOT FOUND
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function NotFound() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dims,     setDims]     = useState({ w: 0, h: 0 });
  const [cells,    setCells]    = useState<number[]>(() => makeShuffle());
  const [selected, setSelected] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [flashSet, setFlashSet] = useState<Set<number>>(new Set());

  const measure = useCallback(() => {
    if (!gridRef.current) return;
    const r = gridRef.current.getBoundingClientRect();
    setDims({ w: r.width, h: r.height });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const cellW    = dims.w / COLS;
  const cellH    = dims.h / ROWS;
  // Make "404" wide enough to span the grid; clamp so it doesn't dwarf the grid height
  const fontSize = dims.w > 0 ? Math.min(dims.w * 0.58, dims.h * 0.62) : 200;

  function handleTap(posIdx: number) {
    if (isSolved) return;

    if (selected === null) {
      setSelected(posIdx);
      return;
    }

    if (selected === posIdx) {
      setSelected(null);
      return;
    }

    // Swap
    const next = [...cells];
    [next[selected], next[posIdx]] = [next[posIdx], next[selected]];
    setCells(next);
    setSelected(null);

    if (solved(next)) {
      const all = new Set<number>(Array.from({ length: TOTAL }, (_, i) => i));
      setFlashSet(all);
      setTimeout(() => setFlashSet(new Set()), 1200);
      setIsSolved(true);
      setTimeout(() => setConfetti(true), 350);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0A0F1C" }}>
      <Confetti active={confetti} />

      {/* SPAL wordmark */}
      <div className="absolute top-5 left-5 z-10 pointer-events-none">
        <span style={{ fontFamily: FF, fontSize: 12, fontWeight: 800,
                       letterSpacing: "0.18em", color: "rgba(255,255,255,0.18)" }}>
          SPAL
        </span>
      </div>

      {/* Hint pill */}
      <AnimatePresence>
        {!isSolved && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="absolute top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none whitespace-nowrap"
          >
            <div style={{ padding: "5px 14px", borderRadius: 999,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: FF }}>
                Tap two tiles to swap
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Puzzle grid */}
      <div
        ref={gridRef}
        className="flex-1"
        style={{
          display:             "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows:    `repeat(${ROWS}, 1fr)`,
          // Outer border
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {dims.w > 0 && cells.map((tileIdx, posIdx) => (
          <Cell
            key={posIdx}
            tileIdx={tileIdx}
            cellW={cellW}
            cellH={cellH}
            gridW={dims.w}
            gridH={dims.h}
            fontSize={fontSize}
            selected={selected === posIdx}
            flash={flashSet.has(posIdx)}
            onClick={() => handleTap(posIdx)}
          />
        ))}
      </div>

      {/* Success panel */}
      <AnimatePresence>
        {isSolved && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
            className="absolute bottom-0 left-0 right-0 z-20"
          >
            {/* Gradient scrim */}
            <div style={{ height: 64, background: "linear-gradient(to bottom, transparent, #0A0F1C)" }} />
            <div style={{ background: "#0A0F1C", padding: "0 20px 40px" }}>
              <div className="max-w-[480px] mx-auto text-center">
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", fontFamily: FF, marginBottom: 14 }}>
                  You solved it — now let&apos;s get you back.
                </p>
                <Link href="/home">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full h-14 rounded-2xl text-[15px] font-semibold text-white flex items-center justify-center gap-2.5"
                    style={{
                      fontFamily: FF,
                      background: "linear-gradient(135deg, #22C55E 0%, #2563EB 100%)",
                      boxShadow:  "0 4px 28px rgba(34,197,94,0.35)",
                    }}
                  >
                    <Home size={18} strokeWidth={2.2} />
                    Take me home
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
