"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * ImageSlideshow — Framer component "Image Slideshow" (D1hQeRBgs).
 *
 * Built as four variants (WDtZ2YkFV, OXswfTwVY, u9aeRnhXz, ykS5qsfgj) that
 * the component cycles through on a timer. The bound images come from the
 * caller: on the home page the Services instances use their CMS item's
 * Image 1-4, and the Hero instance uses its own four frames.
 *
 * Used at 100x100 (Hero) and 240x180 (Services).
 */
export default function ImageSlideshow({
  images,
  interval = 2600,
  className = "",
}: {
  images: readonly string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), interval);
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
          transition={{ duration: 0.7, ease: [0.44, 0, 0.56, 1] }}
        />
      </AnimatePresence>
    </div>
  );
}
