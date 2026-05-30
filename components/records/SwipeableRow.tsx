"use client";

/**
 * SwipeableRow — Gmail-style swipe actions for record rows.
 *
 * Swipe LEFT  → reveals Edit  button (navy, right side)
 * Swipe RIGHT → reveals Delete button (red,  left side)
 */

import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { Trash2, Pencil } from "lucide-react";

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit:   () => void;
  onDelete: () => void;
}

const REVEAL  = 72;
const TRIGGER = 120;

export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const x = useMotionValue(0);

  const deleteWidth = useTransform(x, [0, REVEAL], [0, REVEAL]);
  const deleteBg    = useTransform(x, [0, REVEAL * 0.5, REVEAL], ["#FEE2E2", "#FCA5A5", "#EF4444"]);
  const editWidth   = useTransform(x, [-REVEAL, 0], [REVEAL, 0]);
  const editBg      = useTransform(x, [-REVEAL, -REVEAL * 0.5, 0], ["#0F172A", "#1e2d40", "#e5e7eb"]);

  function snapTo(target: number) {
    animate(x, target, { type: "spring", stiffness: 500, damping: 45, restDelta: 0.5 });
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x;
    if      (offset >  TRIGGER)        { snapTo(0); onDelete(); }
    else if (offset < -TRIGGER)        { snapTo(0); onEdit(); }
    else if (offset >  REVEAL * 0.6)   { snapTo(REVEAL); }
    else if (offset < -REVEAL * 0.6)   { snapTo(-REVEAL); }
    else                               { snapTo(0); }
  }

  return (
    <div className="relative overflow-hidden">

      {/* Delete panel — left side */}
      <motion.div
        className="absolute left-0 inset-y-0 flex items-center justify-center gap-1.5 cursor-pointer"
        style={{ width: deleteWidth, background: deleteBg, minWidth: 0 }}
        onClick={() => { snapTo(0); setTimeout(onDelete, 180); }}
      >
        <motion.div
          style={{ opacity: useTransform(x, [REVEAL * 0.4, REVEAL], [0, 1]) }}
          className="flex flex-col items-center gap-0.5"
        >
          <Trash2 size={18} color="white" strokeWidth={2} />
          <span className="text-white text-[10px] font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>Delete</span>
        </motion.div>
      </motion.div>

      {/* Edit panel — right side */}
      <motion.div
        className="absolute right-0 inset-y-0 flex items-center justify-center gap-1.5 cursor-pointer"
        style={{ width: editWidth, background: editBg, minWidth: 0 }}
        onClick={() => { snapTo(0); setTimeout(onEdit, 180); }}
      >
        <motion.div
          style={{ opacity: useTransform(x, [-REVEAL, -REVEAL * 0.4], [1, 0]) }}
          className="flex flex-col items-center gap-0.5"
        >
          <Pencil size={18} color="white" strokeWidth={2} />
          <span className="text-white text-[10px] font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>Edit</span>
        </motion.div>
      </motion.div>

      {/* Draggable row */}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -TRIGGER * 1.2, right: TRIGGER * 1.2 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className="relative bg-white"
        onTap={(e) => { if (Math.abs(x.get()) > 4) e.stopPropagation(); }}
      >
        {children}
      </motion.div>

    </div>
  );
}
