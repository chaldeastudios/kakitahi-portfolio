"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

/**
 * AnimatedCounter — the "Animated Number Counter" instances in the Stats row.
 *
 * Props transcribed from the Framer XML: start, end, decimals, commas,
 * prefix, suffix, tag "p". Counts up once when scrolled into view.
 * (The text style on these nodes is not exposed by the MCP; Heading 1 is
 * used, which matches the 340px stat tile at the desktop breakpoint.)
 */
export default function AnimatedCounter({
  start = 0,
  end,
  decimals = 0,
  commas = true,
  prefix = "",
  suffix = "",
  className = "",
}: {
  start?: number;
  end: number;
  decimals?: number;
  commas?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (!inView) return;

    if (typeof window !== "undefined") {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        setValue(end);
        return;
      }
    }

    const duration = 1800;
    let raf = 0;
    let startedAt: number | null = null;

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const t = Math.min((now - startedAt) / duration, 1);
      // easeOutExpo — the settle Framer's counters use
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, start, end]);

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: commas,
  });

  return (
    <p ref={ref} className={`t-h1 ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </p>
  );
}
