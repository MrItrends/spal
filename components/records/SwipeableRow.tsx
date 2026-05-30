"use client";

/**
 * SwipeableRow — Gmail-style swipe actions for record rows.
 *
 * Swipe LEFT  → reveals Edit  button (navy, right side)
 * Swipe RIGHT → reveals Delete button (red,  left side)
 *
 * Partial swipe (<70px) snaps back.
 * Past threshold (≥70px) locks open — tap the action button to confirm.
 * Full swipe (≥120px) triggers the action immediately without tapping.
 */

import { useRef } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit:   () => void;
  onDelete: () => void;
}

const REVEAL   = 72;   // px — how far to lock open when released past threshold
const TRIGGER  = 120;  // px — full-swipe auto-fires the action

export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const x = useMotionValue(0);

  // Left side (delete) — visible when x > 0
  const deleteWidth = useTransform(x, [0, REVEAL], [0, REVEAL]);
  const deleteBg    = useTransform(x, [0, REVEAL * 0.5, REVEAL], ["#FEE2E2", "#FCA5A5", "#EF4444"]);

  // Right side (edit) — visible when x < 0
  const editWidth   = useTransform(x, [-REVEAL, 0], [REVEAL, 0]);
  const editBg      = useTransform(x, [-REVEAL, -REVEAL * 0.5, 0], ["#0F172A", "#1e2d40", "#e5e7eb"]);

  function snapTo(target: number) {
    animate(x, target, { type: "spring", stiffness: 500, damping: 45, restDelta: 0.5 });
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x;

    if (offset > TRIGGER) {
      // Full right swipe → delete immediately
      snapTo(0);
      onDelete();
    } else if (offset < -TRIGGER) {
      // Full left swipe → edit immediately
      snapTo(0);
      onEdit();
    } else if (offset > REVEAL * 0.6) {
      // Partial right → lock delete panel open
      snapTo(REVEAL);
    } else if (offset < -REVEAL * 0.6) {
      // Partial left → lock edit panel open
      snapTo(-REVEAL);
    } else {
      // Small drag → snap back to center
      snapTo(0);
    }
  }

  function handleDeleteTap() {
    snapTo(0);
    setTimeout(onDelete, 180); // let snap start first
  }

  function handleEditTap() {
    snapTo(0);
    setTimeout(onEdit, 180);
  }

  return (
    <div className="relative overflow-hidden">

      {/* ── Delete panel (left side, revealed by right-swipe) ── */}
      <motion.div
        className="absolute left-0 inset-y-0 flex items-center justify-center gap-1.5 cursor-pointer"
        style={{ width: deleteWidth, background: deleteBg, minWidth: 0 }}
        onClick={handleDeleteTap}
      >
        <motion.div
          style={{ opacity: useTransform(x, [REVEAL * 0.4, REVEAL], [0, 1]) }}
          className="flex flex-col items-center gap-0.5"
        >
          <TrashIcon />
          <span className="text-white text-[10px] font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>
            Delete
          </span>
        </motion.div>
      </motion.div>

      {/* ── Edit panel (right side, revealed by left-swipe) ── */}
      <motion.div
        className="absolute right-0 inset-y-0 flex items-center justify-center gap-1.5 cursor-pointer"
        style={{ width: editWidth, background: editBg, minWidth: 0 }}
        onClick={handleEditTap}
      >
        <motion.div
          style={{ opacity: useTransform(x, [-REVEAL, -REVEAL * 0.4], [1, 0]) }}
          className="flex flex-col items-center gap-0.5"
        >
          <PencilIcon />
          <span className="text-white text-[10px] font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>
            Edit
          </span>
        </motion.div>
      </motion.div>

      {/* ── The draggable row ── */}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -TRIGGER * 1.2, right: TRIGGER * 1.2 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className="relative bg-white"
        // Prevent tap from firing during a swipe
        onTap={(e) => {
          if (Math.abs(x.get()) > 4) e.stopPropagation();
        }}
      >
        {children}
      </motion.div>

    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
