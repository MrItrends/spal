"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, animate as mAnimate } from "framer-motion";
import Link from "next/link";
import { Home } from "lucide-react";

const FF        = "var(--font-satoshi), system-ui, sans-serif";
const TILE_W    = 96;
const TILE_H    = 112;
const TILE_GAP  = 14;
const SNAP_R    = 90; // px — snap radius

// The 3 digits of "404" as separate draggable tiles
const TILES = [
  { id: 0, digit: "4" },
  { id: 1, digit: "0" },
  { id: 2, digit: "4" },
];

// ── Confetti ────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx     = canvas.getContext("2d")!;
    const COLORS  = ["#22C55E","#2563EB","#F97316","#8B5CF6","#FCD34D","#F472B6","#38BDF8"];
    const pieces  = Array.from({ length: 180 }, () => ({
      x:   Math.random() * canvas.width,
      y:  -20 - Math.random() * 120,
      vx:  (Math.random() - 0.5) * 5,
      vy:  1.5 + Math.random() * 3,
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      w:   5 + Math.random() * 9,
      h:   3 + Math.random() * 5,
      rot: Math.random() * 360,
      rv:  (Math.random() - 0.5) * 10,
    }));

    let raf: number;
    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.rot += p.rv;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (++frame < 280) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); };
  }, [active]);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[60]" />;
}

// ── Draggable tile ─────────────────────────────────────────────────────────
interface TileProps {
  tile: { id: number; digit: string };
  startX: number;
  startY: number;
  slotRects: React.MutableRefObject<(DOMRect | null)[]>;
  occupiedSlots: (number | null)[];       // tileId in each slot
  snappedSlot: number | null;             // which slot THIS tile is in
  onSnap: (tileId: number, slotIdx: number) => void;
  onUnsnap: (tileId: number) => void;
}

function DragTile({ tile, startX, startY, slotRects, occupiedSlots, snappedSlot, onSnap, onUnsnap }: TileProps) {
  const x   = useMotionValue(0);
  const y   = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);

  // Animate to the slot when snapped
  useEffect(() => {
    if (snappedSlot === null) return;
    const slotR = slotRects.current[snappedSlot];
    if (!slotR) return;
    const tx = slotR.left + slotR.width  / 2 - startX - TILE_W / 2;
    const ty = slotR.top  + slotR.height / 2 - startY - TILE_H / 2;
    mAnimate(x, tx, { type: "spring", stiffness: 420, damping: 32 });
    mAnimate(y, ty, { type: "spring", stiffness: 420, damping: 32 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snappedSlot]);

  function handleDragEnd() {
    if (!ref.current) return;
    const r   = ref.current.getBoundingClientRect();
    const cx  = r.left + r.width  / 2;
    const cy  = r.top  + r.height / 2;

    let bestSlot = -1;
    let bestDist = SNAP_R;

    slotRects.current.forEach((slotR, idx) => {
      if (!slotR) return;
      // Don't snap to a slot already occupied by a different tile
      if (occupiedSlots[idx] !== null && occupiedSlots[idx] !== tile.id) return;
      const sc = { x: slotR.left + slotR.width / 2, y: slotR.top + slotR.height / 2 };
      const d  = Math.hypot(cx - sc.x, cy - sc.y);
      if (d < bestDist) { bestDist = d; bestSlot = idx; }
    });

    if (bestSlot >= 0) {
      onSnap(tile.id, bestSlot);
    } else if (snappedSlot !== null) {
      // Dragged out of a slot — unsnap
      onUnsnap(tile.id);
    }
  }

  const locked = snappedSlot !== null;

  return (
    <motion.div
      ref={ref}
      drag={!locked}
      dragMomentum={false}
      style={{ x, y, position: "absolute", left: startX, top: startY,
               width: TILE_W, height: TILE_H, touchAction: "none",
               zIndex: locked ? 5 : 20, cursor: locked ? "default" : "grab" }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.10, zIndex: 30 }}
      animate={{ scale: locked ? [1, 1.06, 1] : 1 }}
      transition={{ duration: locked ? 0.3 : 0.15 }}
    >
      <div
        style={{
          width: "100%", height: "100%",
          borderRadius: 20,
          background: locked
            ? "linear-gradient(135deg, #22C55E 0%, #2563EB 100%)"
            : "linear-gradient(145deg, #1E3A5F 0%, #1E293B 60%, #0F172A 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: locked
            ? "0 0 0 2px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.30), 0 12px 40px rgba(0,0,0,0.5)"
            : "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.06)",
          transition: "background 0.45s, box-shadow 0.45s",
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: 54, fontWeight: 900, color: "#fff",
                       fontFamily: FF, lineHeight: 1,
                       textShadow: locked ? "0 0 20px rgba(255,255,255,0.4)" : "0 2px 8px rgba(0,0,0,0.4)" }}>
          {tile.digit}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function NotFound() {
  // slotRects[0..2] — measured after mount, updated on resize
  const slotRef0     = useRef<HTMLDivElement>(null);
  const slotRef1     = useRef<HTMLDivElement>(null);
  const slotRef2     = useRef<HTMLDivElement>(null);
  const slotRefs     = [slotRef0, slotRef1, slotRef2];
  const slotRectsRef = useRef<(DOMRect | null)[]>([null, null, null]);

  // Which tileId is in each slot (-1 means empty) — indexed by slot
  const [occupiedSlots, setOccupiedSlots] = useState<(number | null)[]>([null, null, null]);
  // Which slot each tile is in — indexed by tile.id
  const [tileSlot, setTileSlot]           = useState<(number | null)[]>([null, null, null]);

  const [startPositions, setStartPositions] = useState<{ x: number; y: number }[]>([]);
  const [solved, setSolved]                 = useState(false);
  const [confetti, setConfetti]             = useState(false);
  const [showHint, setShowHint]             = useState(true);

  // Measure slots and compute scatter positions
  const measureAll = useCallback(() => {
    slotRectsRef.current = slotRefs.map((r) => r.current?.getBoundingClientRect() ?? null);

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Scatter the 3 tiles away from the center cluster
    // Use positions that feel spread but stay within safe zone (not behind nav)
    const safeW = Math.min(vw, 480);
    const offsetX = (vw - safeW) / 2; // center offset for wide screens

    setStartPositions([
      { x: offsetX + safeW * 0.05,  y: vh * 0.09 },   // top-left  → "4"
      { x: offsetX + safeW * 0.32,  y: vh * 0.73 },   // bottom-mid → "0"
      { x: offsetX + safeW * 0.61,  y: vh * 0.06 },   // top-right → "4"
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    measureAll();
    window.addEventListener("resize", measureAll);
    return () => window.removeEventListener("resize", measureAll);
  }, [measureAll]);

  // Hide hint after 3 s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(t);
  }, []);

  function handleSnap(tileId: number, slotIdx: number) {
    setOccupiedSlots((prev) => {
      const next = [...prev];
      // Clear old slot if this tile was elsewhere
      const oldSlot = tileSlot[tileId];
      if (oldSlot !== null) next[oldSlot] = null;
      next[slotIdx] = tileId;
      return next;
    });
    setTileSlot((prev) => {
      const next = [...prev];
      // Clear old slot
      const oldSlot = prev[tileId];
      if (oldSlot !== null) {
        setOccupiedSlots((o) => { const a = [...o]; a[oldSlot] = null; return a; });
      }
      next[tileId] = slotIdx;
      return next;
    });

    // Check solved: slots 0→"4", 1→"0", 2→"4"
    // tileId 0,2 → digit "4"; tileId 1 → digit "0"
    // slot 0 needs a "4" tile (id 0 or 2), slot 1 needs a "0" tile (id 1), slot 2 needs a "4" tile (id 0 or 2)
    setTimeout(() => {
      setTileSlot((ts) => {
        setOccupiedSlots((os) => {
          const slot0digit = os[0] !== null ? TILES[os[0]].digit : null;
          const slot1digit = os[1] !== null ? TILES[os[1]].digit : null;
          const slot2digit = os[2] !== null ? TILES[os[2]].digit : null;
          const correct    = slot0digit === "4" && slot1digit === "0" && slot2digit === "4";

          // Also need all slots filled (no empty slot)
          const allFilled  = os[0] !== null && os[1] !== null && os[2] !== null;

          if (correct && allFilled) {
            setSolved(true);
            setTimeout(() => setConfetti(true), 200);
          }
          return os;
        });
        return ts;
      });
    }, 100);
  }

  function handleUnsnap(tileId: number) {
    setOccupiedSlots((prev) => {
      const next    = [...prev];
      const oldSlot = tileSlot[tileId];
      if (oldSlot !== null) next[oldSlot] = null;
      return next;
    });
    setTileSlot((prev) => { const next = [...prev]; next[tileId] = null; return next; });
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: "#0A0F1E" }}
    >
      <Confetti active={confetti} />

      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* SPAL wordmark */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <span style={{ fontFamily: FF, fontSize: 15, fontWeight: 800, letterSpacing: "0.15em",
                       color: "rgba(255,255,255,0.25)" }}>
          SPAL
        </span>
      </div>

      {/* Hint pill */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: showHint && !solved ? 1 : 0, y: showHint && !solved ? 0 : -8 }}
        transition={{ duration: 0.4 }}
        className="absolute z-10 top-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: FF }}>
            Drag the pieces to spell
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#22C55E", fontFamily: FF }}>
            4 0 4
          </span>
        </div>
      </motion.div>

      {/* Ghost slots — target zones */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: "38%", display: "flex", gap: TILE_GAP, zIndex: 2 }}
      >
        {["4", "0", "4"].map((digit, idx) => (
          <div
            key={idx}
            ref={slotRefs[idx]}
            style={{
              width:        TILE_W,
              height:       TILE_H,
              borderRadius: 20,
              border:       `2px dashed ${occupiedSlots[idx] !== null ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.12)"}`,
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              transition:   "border-color 0.3s",
              background:   occupiedSlots[idx] !== null ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ fontSize: 54, fontWeight: 900, fontFamily: FF,
                           color: occupiedSlots[idx] !== null ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)",
                           transition: "color 0.3s" }}>
              {digit}
            </span>
          </div>
        ))}
      </div>

      {/* Draggable tiles */}
      {startPositions.length === 3 && TILES.map((tile) => (
        <DragTile
          key={tile.id}
          tile={tile}
          startX={startPositions[tile.id].x}
          startY={startPositions[tile.id].y}
          slotRects={slotRectsRef}
          occupiedSlots={occupiedSlots}
          snappedSlot={tileSlot[tile.id]}
          onSnap={handleSnap}
          onUnsnap={handleUnsnap}
        />
      ))}

      {/* "You found the 404" label (always visible, subtle) */}
      {!solved && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 text-center z-10">
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.18)", fontFamily: FF, letterSpacing: "0.05em" }}>
            Page not found
          </p>
        </div>
      )}

      {/* Success overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={solved ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.34, 1.1, 0.64, 1] }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-20 px-5 pb-12 pt-8"
        style={{ pointerEvents: solved ? "auto" : "none" }}
      >
        <div className="rounded-3xl px-6 py-7 text-center"
          style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(20px)",
                   border: "1px solid rgba(34,197,94,0.25)",
                   boxShadow: "0 -4px 40px rgba(34,197,94,0.12), 0 20px 60px rgba(0,0,0,0.6)" }}>
          <motion.div
            animate={solved ? { rotate: [0, -10, 10, -6, 6, 0] } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ fontSize: 40, marginBottom: 8 }}
          >
            🎉
          </motion.div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: FF, marginBottom: 6 }}>
            You solved it!
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: FF,
                      lineHeight: 1.6, marginBottom: 24 }}>
            The page you were looking for doesn&apos;t exist,<br />
            but you cracked the puzzle. That counts.
          </p>
          <Link href="/home">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center gap-2.5"
              style={{ fontFamily: FF, background: "linear-gradient(135deg, #22C55E, #2563EB)",
                       boxShadow: "0 4px 24px rgba(34,197,94,0.35)" }}
            >
              <Home size={18} strokeWidth={2.2} />
              Take me home
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
