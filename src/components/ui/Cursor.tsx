"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Cursor — Framer component "Cursor" (zpR_3aOkh).
 *
 * Variants read from the MCP: Desktop / Tablet / Phone (padding 4px, gap
 * 10px) and Hover (padding 4.36px, gap 10.91px) — exactly 1.09x, so the
 * hover state is a 1.09 scale-up. The variant's inner content is not
 * exposed; a solid square dot is used, matching the project's hard-edged,
 * zero-radius language.
 *
 * Pointer-devices only; disabled for touch and reduced motion.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 45, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 900, damping: 45, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as HTMLElement | null;
      setHovering(Boolean(el?.closest("a, button, [role='button'], input, textarea")));
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999] hidden lg:block"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="bg-black"
        style={{ width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
        animate={{ scale: hovering ? 1.09 : 1 }}
        transition={{ duration: 0.25, ease: [0.44, 0, 0.56, 1] }}
      />
    </motion.div>
  );
}
