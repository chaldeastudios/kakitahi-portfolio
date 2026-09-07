"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

/**
 * FooterLink — Framer component "Footer Link" (IzeLy6whj).
 *
 * Read from a detached copy: width 360px, padding 14px 24px, stack
 * vertical / center / align start, holding an overflow-hidden stack with
 * the label (Geist 500) and a second identical copy parked at
 * bottom:-20px — the same vertical roll the Text-Link uses. No wipe, no
 * bullet marker.
 *
 * variant "inline" is the ZtBkierFB variant used for the two legal links
 * in the bottom bar, which sits inline with no row padding.
 */
const EASE = [0.44, 0, 0.56, 1] as const;
const DURATION = 0.4;

export default function FooterLink({
  label,
  href,
  newTab = false,
  variant = "row",
}: {
  label: string;
  href?: string;
  newTab?: boolean;
  variant?: "row" | "inline";
}) {
  const [hovered, setHovered] = useState(false);
  const isRow = variant === "row";

  const resolved =
    href && !/^(https?:|mailto:|tel:|\/|#)/.test(href) ? `https://${href}` : href;
  const isExternal = !!resolved && (newTab || /^(https?:|mailto:|tel:)/.test(resolved));

  const content = (
    <span className="relative block overflow-hidden">
      <motion.span
        className="block"
        initial={false}
        animate={{ y: hovered ? "-100%" : "0%" }}
        transition={{ duration: DURATION, ease: EASE }}
      >
        <span className={`${isRow ? "t-body" : "t-body-s"} block whitespace-nowrap`}>
          {label}
        </span>
        <span
          className={`${isRow ? "t-body" : "t-body-s"} absolute top-full left-0 block whitespace-nowrap`}
        >
          {label}
        </span>
      </motion.span>
    </span>
  );

  const className = isRow
    ? "flex w-full flex-col items-start justify-center overflow-hidden border-b border-border px-6 py-[14px] text-black"
    : "relative inline-block text-black";

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };

  if (!resolved) {
    return (
      <span className={className} {...handlers}>
        {content}
      </span>
    );
  }
  if (isExternal) {
    return (
      <a
        href={resolved}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        className={className}
        {...handlers}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={resolved} className={className} {...handlers}>
      {content}
    </Link>
  );
}
