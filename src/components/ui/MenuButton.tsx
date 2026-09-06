"use client";

import { motion } from "motion/react";

/**
 * MenuButton — Framer component "Menu Button" (CoNamPj_s).
 *
 * Internals unreadable via MCP ("Node is not a text node"). RECONSTRUCTED as
 * a two-bar hamburger that crosses into an X, sized to the 48px header and
 * using the project's zero-radius, hard-edged language. It drives the
 * Header's "TabletClosed" variant (vi34TG9Km, 390px wide), which is the
 * collapsed nav the Framer project defines for the small breakpoint.
 */
export default function MenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  const EASE = [0.44, 0, 0.56, 1] as const;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="relative flex h-12 w-12 shrink-0 items-center justify-center border-l border-border"
    >
      <span className="relative block h-[10px] w-[18px]">
        <motion.span
          className="absolute left-0 block h-[1.5px] w-full bg-black"
          initial={false}
          animate={open ? { top: 4, rotate: 45 } : { top: 0, rotate: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        />
        <motion.span
          className="absolute left-0 block h-[1.5px] w-full bg-black"
          initial={false}
          animate={open ? { top: 4, rotate: -45 } : { top: 9, rotate: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        />
      </span>
    </button>
  );
}
