"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "./icons";

/**
 * JournalCard — the journal's counterpart to ProjectCard (zUVpU454J),
 * built on the same construction so the two listings read as one family:
 * /Off-white ground, 1px /Black border, 32px padding, and the same
 * two-arrow swap on hover (a black arrow leaves to the right while its
 * twin arrives from the left, both translating +18px together).
 *
 * The one departure is the well. A project card's well holds the project
 * image; a journal entry has none, so the well holds the entry's opening
 * line instead, over the category and date. Same box, same border, same
 * hover — text where the image would be.
 */
const EASE = [0.44, 0, 0.56, 1] as const;

export default function JournalCard({
  title,
  category,
  date,
  intro,
  href,
}: {
  title: string;
  category: string;
  date: string;
  intro: string;
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
      {/* Text well — where a project card carries its image */}
      <div className="flex min-h-[220px] w-full flex-col items-start gap-6 border border-border bg-white p-6">
        <div className="flex items-center gap-[6px]">
          <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
          <span className="t-body-s">{category}</span>
        </div>
        <p className="t-body-l w-full">{intro}</p>
      </div>

      {/* Caption row */}
      <div className="flex w-full items-center justify-between gap-8">
        <div className="flex flex-col items-start gap-[5px]">
          <span className="t-h5">{title}</span>
          <span className="t-body">{date}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="t-body">Read Entry</span>
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
