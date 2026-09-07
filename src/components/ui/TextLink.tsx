"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

/**
 * TextLink — Framer component "Text-Link" (yPf1zNDj8).
 *
 * Read from a detached copy: padding 4px, holding an overflow-clipped
 * vertical stack with the label (Geist 500) and a second identical copy
 * parked at bottom:-15px. Hovering rolls the stack up so the parked copy
 * takes its place. There is no underline — the roll is the whole effect.
 */
const EASE = [0.44, 0, 0.56, 1] as const;
const DURATION = 0.4;

export default function TextLink({
  label,
  href,
  newTab = false,
}: {
  label: string;
  href: string;
  newTab?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isExternal = newTab || /^(https?:|mailto:|tel:)/.test(href);

  const inner = (
    <span className="relative block overflow-hidden p-1">
      <motion.span
        className="block"
        initial={false}
        animate={{ y: hovered ? "-100%" : "0%" }}
        transition={{ duration: DURATION, ease: EASE }}
      >
        <span className="t-body-s block whitespace-nowrap">{label}</span>
        <span className="t-body-s absolute top-full left-1 block whitespace-nowrap">
          {label}
        </span>
      </motion.span>
    </span>
  );

  const props = {
    // flex, not inline-block: an inline-block anchor gets baseline
    // leading below it, which made the wrapping RevealItem taller than the
    // link and left the nav sitting 3.5px above the header's centre line.
    className: "relative flex items-center text-black",
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };

  if (isExternal) {
    return (
      <a href={href} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} {...props}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} {...props}>
      {inner}
    </Link>
  );
}
