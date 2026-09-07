"use client";

import { useEffect, useState } from "react";

/**
 * ImageSlideshow — Framer component "Image Slideshow" (D1hQeRBgs).
 *
 * Built as four variants (WDtZ2YkFV, OXswfTwVY, u9aeRnhXz, ykS5qsfgj) that
 * the component cycles through on a timer. The bound images come from the
 * caller: on the home page the Services instances use their CMS item's
 * Image 1-4, and the Hero instance uses its own four frames.
 *
 * The frame swap is an instant cut, not a fade/cross-dissolve — one image
 * replaces the previous one directly, no transition between them.
 *
 * Used by the Hero at 150x150 desktop / 135 tablet / 110 phone, and by
 * Services at 240x180.
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
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${images[index]}")` }}
      />
    </div>
  );
}
