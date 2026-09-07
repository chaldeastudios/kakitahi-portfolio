"use client";

import { motion } from "motion/react";

/**
 * MenuButton — Framer component "Menu Button" (CoNamPj_s).
 *
 * Read from a detached copy: backgroundColor /Yellow, padding 14px,
 * stack horizontal / space-between / center, containing
 *   - an overflow-clipped stack with "Menu" (Geist 600) and, parked at
 *     bottom:-18px, "Close" — a vertical roll between the two labels
 *   - a 20x16 frame with two 16x2 /Black bars, one at top:5px and one at
 *     bottom:5px
 */
const EASE = [0.44, 0, 0.56, 1] as const;

export default function MenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="flex h-12 shrink-0 items-center justify-between gap-3 bg-yellow px-[14px] text-black"
    >
      {/* Menu / Close roll */}
      <span className="relative block h-[18px] overflow-hidden">
        <motion.span
          className="block"
          initial={false}
          animate={{ y: open ? -18 : 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <span className="t-button block h-[18px] leading-[18px]">Menu</span>
          <span className="t-button block h-[18px] leading-[18px]">Close</span>
        </motion.span>
      </span>

      {/* 20x16 frame, two 16x2 bars */}
      <span className="relative block h-4 w-5">
        <motion.span
          className="absolute left-1/2 block h-[2px] w-4 bg-black"
          initial={false}
          animate={open ? { top: 7, x: "-50%", rotate: 45 } : { top: 5, x: "-50%", rotate: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        />
        <motion.span
          className="absolute left-1/2 block h-[2px] w-4 bg-black"
          initial={false}
          animate={open ? { bottom: 7, x: "-50%", rotate: -45 } : { bottom: 5, x: "-50%", rotate: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        />
      </span>
    </button>
  );
}
