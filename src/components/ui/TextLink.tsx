"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

/**
 * TextLink — Framer component "Text-Link" (yPf1zNDj8).
 *
 * NOTE: this component's internals could not be read — Framer's MCP returns
 * "Node is not a text node" for it. The hover treatment below is
 * RECONSTRUCTED from the design system's own idiom: the Button (which did
 * read) swaps its arrow by stacking two identical copies inside an
 * overflow-clipped box and translating them together. This applies the same
 * idiom on the vertical axis, which is the standard Framer nav-link roll.
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
    <span className="relative block overflow-hidden">
      <motion.span
        className="block"
        initial={false}
        animate={{ y: hovered ? "-100%" : "0%" }}
        transition={{ duration: DURATION, ease: EASE }}
      >
        <span className="t-body-s block whitespace-nowrap">{label}</span>
        <span className="t-body-s absolute top-full left-0 block whitespace-nowrap">
          {label}
        </span>
      </motion.span>

      {/* yellow underline wipe, left-anchored — same origin as the Button wipe */}
      <motion.span
        aria-hidden="true"
        className="absolute bottom-0 left-0 block h-px bg-yellow"
        initial={false}
        animate={{ width: hovered ? "100%" : "0%" }}
        transition={{ duration: DURATION, ease: EASE }}
      />
    </span>
  );

  const props = {
    className: "relative inline-block text-black",
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };

  if (isExternal) {
    return (
      <a
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        {...props}
      >
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
