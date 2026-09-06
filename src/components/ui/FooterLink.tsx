"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

/**
 * FooterLink — Framer component "Footer Link" (IzeLy6whj).
 *
 * Two variants are referenced by the Footer:
 *   v9d6R1wSg — the stacked list rows (full-width, bordered, padded)
 *   ZtBkierFB — the inline legal links in the bottom bar
 *
 * Internals unreadable via MCP ("Node is not a text node"); the hover is
 * RECONSTRUCTED to match the design system's left-anchored wipe.
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
  const hasHref = Boolean(href);

  const resolved =
    href && !/^(https?:|mailto:|tel:|\/|#)/.test(href) ? `https://${href}` : href;
  const isExternal =
    !!resolved && (newTab || /^(https?:|mailto:|tel:)/.test(resolved));

  const content = (
    <>
      {isRow && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 z-0 bg-yellow"
          initial={false}
          animate={{ width: hovered ? "100%" : "0%" }}
          transition={{ duration: DURATION, ease: EASE }}
        />
      )}
      <span className="relative z-[1] flex items-center gap-2">
        {isRow && (
          <motion.span
            aria-hidden="true"
            className="block h-[10px] w-[10px] shrink-0 bg-yellow"
            initial={false}
            animate={{ backgroundColor: hovered ? "rgb(0,0,0)" : "rgb(255,221,0)" }}
            transition={{ duration: DURATION, ease: EASE }}
          />
        )}
        <span className={isRow ? "t-body" : "t-body-s"}>{label}</span>
      </span>
      {!isRow && (
        <motion.span
          aria-hidden="true"
          className="absolute bottom-0 left-0 block h-px bg-black"
          initial={false}
          animate={{ width: hovered ? "100%" : "0%" }}
          transition={{ duration: DURATION, ease: EASE }}
        />
      )}
    </>
  );

  const className = isRow
    ? "relative flex w-full items-center overflow-hidden border-b border-border px-6 py-[14px] text-black"
    : "relative inline-block text-black";

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };

  if (!hasHref) {
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
    <Link href={resolved!} className={className} {...handlers}>
      {content}
    </Link>
  );
}
