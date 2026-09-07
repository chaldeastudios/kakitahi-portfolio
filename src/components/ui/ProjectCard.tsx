"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "./icons";

/**
 * ProjectCard — Framer component "Project Card" (zUVpU454J).
 *
 * Read from a detached copy — this is NOT a yellow-wipe button:
 *   root      backgroundColor /Off-white, border 1px /Black,
 *             gap 16px, padding 32px, stack vertical, align center
 *   Stack     border 1px /Border, overflow clip
 *     Frame35 1fr x 550px — the project image
 *   Frame38   horizontal, space-between, align center
 *     Frame36 vertical, gap 5px — Title (Inter Medium) + Sub-title (Geist 500)
 *     Frame37 horizontal, gap 4px — "View Project" + an 18x17 clipped frame
 *             holding two arrows: a white one parked at left:-18px and a
 *             black one visible at left:0, translating +18px together.
 */
const EASE = [0.44, 0, 0.56, 1] as const;

export default function ProjectCard({
  title,
  subtitle,
  image,
  href,
}: {
  title: string;
  subtitle: string;
  image?: string;
  href: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={href}
      className="flex w-full flex-col items-center gap-4 border border-black p-8"
      initial={false}
      animate={{
        backgroundColor: hovered ? "rgb(234, 234, 234)" : "rgb(244, 244, 244)",
      }}
      transition={{ duration: 0.32, ease: EASE }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {/* Image well */}
      <div className="w-full overflow-hidden border border-border">
        <motion.div
          className="h-[300px] w-full bg-lightgrey bg-cover bg-center desktop:h-[550px]"
          style={image ? { backgroundImage: `url("${image}")` } : undefined}
          initial={false}
          animate={{ scale: hovered ? 1.03 : 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>

      {/* Caption row */}
      <div className="flex w-full items-center justify-between gap-8">
        <div className="flex flex-col items-start gap-[5px]">
          <span className="t-h5">{title}</span>
          <span className="t-body">{subtitle}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="t-body">View Project</span>
          <span className="relative block h-[17px] w-[18px] overflow-hidden">
            <motion.span
              className="absolute inset-0 block"
              initial={false}
              animate={{ x: hovered ? 18 : 0 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <span className="absolute top-0 -left-[18px] block">
                <ArrowRight color="rgb(0, 0, 0)" />
              </span>
              <span className="absolute top-0 left-0 block">
                <ArrowRight color="rgb(0, 0, 0)" />
              </span>
            </motion.span>
          </span>
        </div>
      </div>
    </motion.a>
  );
}
