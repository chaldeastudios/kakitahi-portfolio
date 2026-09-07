"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * Appear animations.
 *
 * Framer's default "Appear" transition on this project is a fade with a
 * short rise, on the same cubic-bezier(0.44, 0, 0.56, 1) the variant
 * changes use. Anything already in view when the page loads animates on
 * mount, so a refresh or a first navigation plays the entrance rather than
 * showing the page flat.
 *
 * IMPORTANT — sticky safety. A transform on an ANCESTOR of a
 * `position: sticky` element makes that ancestor the containing block, and
 * the sticky child then pins inside it instead of the viewport. This
 * layout leans on sticky in the Hero, About, Stats, Works, Services and
 * Testimonials sections, so never wrap a sticky element's ancestor in one
 * of these. Reveal the sticky element itself, or its descendants — both
 * are safe.
 */

export const EASE = [0.44, 0, 0.56, 1] as const;
const DISTANCE = 24;

/** A single element that fades and rises into place. */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = DISTANCE,
  duration = 0.7,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-6% 0px -6% 0px" }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  shown: (stagger: number = 0.08) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.05 },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: DISTANCE },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/**
 * A container whose RevealItem children come in one after another.
 * `onMount` plays the stagger as soon as the component mounts (used for
 * the header nav); otherwise it waits until the group scrolls into view.
 */
export function RevealGroup({
  children,
  className = "",
  stagger = 0.08,
  onMount = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  onMount?: boolean;
}) {
  return (
    <motion.div
      className={className}
      custom={stagger}
      variants={groupVariants}
      initial="hidden"
      {...(onMount
        ? { animate: "shown" }
        : {
            whileInView: "shown",
            viewport: { once: true, margin: "-6% 0px -6% 0px" },
          })}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
