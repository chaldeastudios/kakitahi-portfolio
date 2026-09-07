"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { ArrowLeft, ArrowRightLarge, QuoteIcon } from "@/components/ui/icons";
import { TESTIMONIALS } from "@/lib/content";

/**
 * Testimonials — Framer component "Testmonials" (QH5AYZvOv).
 *
 * Structure read from a detached copy. It is a CAROUSEL showing one
 * testimonial at a time, not a grid:
 *
 *   root (4-col grid, border-top 1px /Border, overflow clip)
 *     Left (IFpz8cd7v)  358.5px, bg /White, vertical space-between
 *       TestimonialLabel (hwzQuKxCW) h 65px, padding 24px
 *         Tagline: 10x10 /Yellow square + "Testimonials"
 *       Arrows (Yi6Bc9b5D) h 50px, border-y 1px /Border, horizontal
 *         two 1fr cells; the left one has border-right 1px /Border,
 *         each holding a 24x24 arrow
 *     Middle (of2hJ8yEP) spans 2 columns, bg /White,
 *       border 0 1px 1px 1px, gap 120px, padding 32px 24px
 *       Content (XpdJBAgdM) gap 28px: 32x32 quote icon + the quote
 *       Client  (l3GwUnFE_) gap 16px: 60x60 client image, then
 *                           Name over Occupation
 *     CtaContainer (szCQkI6p7) 358.5px x 280px
 *       Cta (htNIAuloU) sticky top 48px, bg /White,
 *         border-bottom 1px /Border, padding 24px, space-between:
 *         the outro line, then the "Book A Call" Button
 */
const EASE = [0.44, 0, 0.56, 1] as const;

export default function Testimonials() {
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);
  const count = TESTIMONIALS.items.length;
  const item = TESTIMONIALS.items[index];

  const go = (step: number) =>
    setState(([i]) => [(i + step + count) % count, step]);

  return (
    <section
      id="testimonials"
      className="grid w-full grid-cols-1 overflow-clip border-t border-border desktop:grid-cols-4"
    >
      {/* Left — label + arrows */}
      <div className="flex flex-col justify-between bg-white desktop:h-[631px]">
        <div className="flex h-[65px] flex-col items-start overflow-hidden bg-white p-6">
          <div className="flex items-center gap-[6px]">
            <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
            <span className="t-body">{TESTIMONIALS.tagline}</span>
          </div>
        </div>

        <div className="flex h-[50px] items-center border-y border-border bg-white">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
            className="flex h-full flex-1 items-center justify-center border-r border-border bg-white transition-colors duration-300 hover:bg-yellow"
          >
            <ArrowLeft color="rgb(0, 0, 0)" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next testimonial"
            className="flex h-full flex-1 items-center justify-center bg-white transition-colors duration-300 hover:bg-yellow"
          >
            <ArrowRightLarge color="rgb(0, 0, 0)" />
          </button>
        </div>
      </div>

      {/* Middle — the active testimonial */}
      <div className="flex flex-col justify-between gap-16 overflow-hidden border-y border-border bg-white px-6 py-8 desktop:col-span-2 desktop:h-[631px] desktop:gap-[120px] desktop:border-x desktop:border-t-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            className="flex h-full flex-col justify-between gap-16 desktop:gap-[120px]"
            initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="flex flex-col items-start gap-7">
              <QuoteIcon color="rgb(0, 0, 0)" />
              <blockquote className="t-h4 w-full">{item.quote}</blockquote>
            </div>

            <figcaption className="flex flex-col items-start gap-4">
              <span
                aria-hidden="true"
                className="block h-[60px] w-[60px] shrink-0 bg-lightgrey bg-cover bg-center"
              />
              <span className="flex flex-col items-start">
                <span className="t-body">{item.name}</span>
                <span className="t-body opacity-70">{item.role}</span>
              </span>
            </figcaption>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right — sticky outro CTA */}
      <div className="flex flex-col items-start overflow-hidden desktop:h-[280px]">
        <div className="z-[1] flex h-[280px] w-full flex-col items-start justify-between gap-[10px] overflow-hidden border-b border-border bg-white p-6 desktop:sticky desktop:top-12">
          <p className="t-body">{TESTIMONIALS.outro}</p>
          <Button
            label={TESTIMONIALS.cta.label}
            href={TESTIMONIALS.cta.href}
            newTab={TESTIMONIALS.cta.newTab}
            fullWidth
          />
        </div>
      </div>
    </section>
  );
}
