"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * ImageSlideshow — Framer component "Image Slideshow" (D1hQeRBgs).
 *
 * The component is built as four variants (WDtZ2YkFV, OXswfTwVY, u9aeRnhXz,
 * ykS5qsfgj), each a 95x95 frame — i.e. a variant-cycling slideshow. The
 * images bound to each variant are not exposed by the MCP, so the caller
 * supplies them; the cycling behaviour and the four-frame cadence are
 * transcribed.
 *
 * Used on the home page at 100x100 (Hero) and 240x180 (Services).
 */
export default function ImageSlideshow({
  images,
  interval = 2000,
  className = "",
}: {
  images: string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      interval
    );
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className={`relative overflow-hidden bg-lightgrey ${className}`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${images[index]}")` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.44, 0, 0.56, 1] }}
        />
      </AnimatePresence>
    </div>
  );
}
