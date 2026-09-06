"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

/**
 * ProjectCard — Framer component "Project Card" (zUVpU454J), variant
 * eahsTMejN as instanced on the home page.
 *
 * Internals unreadable via MCP ("Node is not a text node"). The two bound
 * props ARE known from the page XML: BjgCsOPqE = title, dJZVG1RFy =
 * category. The card sits in the Works section's 2-column grid.
 *
 * RECONSTRUCTED using the project's established language: 1px /Border
 * hairlines, zero radius, a yellow marker, and the same left-anchored wipe
 * and image scale used elsewhere in the system.
 */
export default function ProjectCard({
  title,
  category,
  image,
  href = "/projects",
}: {
  title: string;
  category: string;
  image?: string;
  href?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const EASE = [0.44, 0, 0.56, 1] as const;

  return (
    <Link
      href={href}
      className="group relative block border-r border-b border-border bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-lightgrey">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={image ? { backgroundImage: `url("${image}")` } : undefined}
          initial={false}
          animate={{ scale: hovered ? 1.04 : 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>

      <div className="relative flex items-center justify-between overflow-hidden border-t border-border p-6">
        <motion.span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 z-0 bg-yellow"
          initial={false}
          animate={{ width: hovered ? "100%" : "0%" }}
          transition={{ duration: 0.5, ease: EASE }}
        />
        <span className="relative z-[1] flex items-center gap-[6px]">
          <span className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
          <span className="t-h4">{title}</span>
        </span>
        <span className="t-body-s relative z-[1]">{category}</span>
      </div>
    </Link>
  );
}
