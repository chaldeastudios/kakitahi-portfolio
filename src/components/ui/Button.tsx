"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "./icons";

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

      {/* Arrow frame — 18x17, overflow clip. The parked copy is black
          (it lands on the yellow wipe); the visible copy is white (it sits
          on the black ground). Both translate +18px together. */}
      <span className="relative z-[1] block h-[17px] w-[18px] shrink-0 overflow-hidden">
        <motion.span
          className="absolute inset-0 block"
          initial={false}
          animate={{ x: hovered ? 18 : 0 }}
          transition={{ duration: DURATION, ease: EASE }}
        >
          <span className="absolute top-0 -left-[18px] block">
            <ArrowRight color="rgb(0, 0, 0)" />
          </span>
          <span className="absolute top-0 left-0 block">
            <ArrowRight color="rgb(255, 255, 255)" />
          </span>
        </motion.span>
      </span>

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
