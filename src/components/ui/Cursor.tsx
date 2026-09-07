"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Cursor — Framer component "Cursor" (zpR_3aOkh).
 *
 * A div holding a 14x14 pointer SVG (white fill, black stroke, round
 * joins). Variants:
 *   Desktop / Tablet / Phone — padding 4px, glyph unrotated
 *   Hover (desktop only)     — padding 4.36px, glyph rotated 45deg
 *
 * The glyph's tip sits at (0,0) of its own viewBox, so the wrapper is
 * offset by the padding to keep the tip on the real pointer position.
 * Pointer-devices only; disabled for touch and reduced motion.
 */
const EASE = [0.44, 0, 0.56, 1] as const;

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 1200, damping: 50, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 1200, damping: 50, mass: 0.3 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as HTMLElement | null;
      setHovering(
        Boolean(el?.closest("a, button, [role='button'], input, textarea, select"))
      );
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999]"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="flex items-center justify-center"
        initial={false}
        animate={{ padding: hovering ? 4.36 : 4 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{ marginLeft: -4, marginTop: -4 }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="none"
          overflow="visible"
          initial={false}
          animate={{ rotate: hovering ? 45 : 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <path
            d="M 4.56 14 L 0 0 L 14 4.786 L 7.954 7.715 Z"
            fill="rgb(255, 255, 255)"
            stroke="rgb(0,0,0)"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}
