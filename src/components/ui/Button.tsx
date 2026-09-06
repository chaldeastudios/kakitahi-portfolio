"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

/**
 * Button — transcribed from Framer component "Button" (gvRRv8Sb0).
 *
 * Structure from the Framer XML (Variant1 / QLQOyPLaz):
 *   - root:      minWidth 180px, backgroundColor /Black, borderRadius 0,
 *                padding 14px, stack horizontal, space-between, gap 20px
 *   - Rectangle3: absolute, left -1px, top 0, bottom 0, width 0px,
 *                backgroundColor /Yellow, zIndex 0
 *                -> this is the wipe: width animates 0 -> 100% on hover,
 *                   anchored to the left edge (hence left:-1px, to cover
 *                   the 1px seam).
 *   - Frame:     18x17, overflow clip, holding two stacked arrow copies —
 *                one at left:-18px (parked off-canvas left) and one at
 *                left:0 (visible). Both translate +18px on hover, so the
 *                visible arrow exits right while the parked one enters.
 */

const ARROW = (
  <svg width="18" height="17" viewBox="0 0 18 17" fill="none" aria-hidden="true">
    <path
      d="M3 8.5h12M10.5 4l4.5 4.5-4.5 4.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

export type ButtonProps = {
  label: string;
  href: string;
  newTab?: boolean;
  className?: string;
  fullWidth?: boolean;
};

/** Framer's variant transition. */
const EASE = [0.44, 0, 0.56, 1] as const;
const DURATION = 0.5;

export default function Button({
  label,
  href,
  newTab = false,
  className = "",
  fullWidth = false,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  // Framer links like "cal.com" have no protocol; normalise so they resolve.
  const isExternal = newTab || /^(https?:|mailto:|tel:)/.test(href) || !href.startsWith("/");
  const resolved =
    isExternal && !/^(https?:|mailto:|tel:)/.test(href) ? `https://${href}` : href;

  const inner = (
    <>
      {/* Rectangle3 — the yellow wipe */}
      <motion.span
        aria-hidden="true"
        className="absolute top-0 bottom-0 -left-px z-0 bg-yellow"
        initial={false}
        animate={{ width: hovered ? "calc(100% + 1px)" : "0%" }}
        transition={{ duration: DURATION, ease: EASE }}
      />

      {/* Label */}
      <motion.span
        className="t-button relative z-[1] whitespace-nowrap"
        initial={false}
        animate={{ color: hovered ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)" }}
        transition={{ duration: DURATION, ease: EASE }}
      >
        {label}
      </motion.span>

      {/* Arrow frame — 18x17, overflow clip */}
      <motion.span
        className="relative z-[1] block h-[17px] w-[18px] shrink-0 overflow-hidden"
        initial={false}
        animate={{ color: hovered ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)" }}
        transition={{ duration: DURATION, ease: EASE }}
      >
        <motion.span
          className="absolute inset-0 block"
          initial={false}
          animate={{ x: hovered ? 18 : 0 }}
          transition={{ duration: DURATION, ease: EASE }}
        >
          {/* parked off-canvas left (left:-18px) */}
          <span className="absolute top-0 -left-[18px] block">{ARROW}</span>
          {/* visible (left:0) */}
          <span className="absolute top-0 left-0 block">{ARROW}</span>
        </motion.span>
      </motion.span>
    </>
  );

  const classes = [
    "group relative inline-flex items-center justify-between gap-5 overflow-hidden",
    "bg-black p-[14px] rounded-none",
    fullWidth ? "w-full" : "min-w-[180px]",
    className,
  ].join(" ");

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };

  if (isExternal) {
    return (
      <a
        href={resolved}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        className={classes}
        {...handlers}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={resolved} className={classes} {...handlers}>
      {inner}
    </Link>
  );
}
