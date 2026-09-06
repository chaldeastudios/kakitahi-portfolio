"use client";

import { motion } from "motion/react";
import Button from "@/components/ui/Button";
import { TESTIMONIALS } from "@/lib/content";

/**
 * Testimonials — Framer component "Testmonials" (QH5AYZvOv), variant
 * oJZ4m09e4 as instanced on the home page.
 *
 * The component's internals are not readable via the MCP ("Node is not a
 * text node"), but every bound prop IS known from the page XML: five
 * quote / name / role triples, an outro line, and a "Book A Call" button
 * pointing at /#contact. All of that copy is transcribed verbatim.
 *
 * The LAYOUT below is RECONSTRUCTED in the project's language — 1px
 * /Border hairlines, zero radius, yellow markers, alternating white and
 * off-white tiles — with a scroll-reveal on each card.
 */
const EASE = [0.44, 0, 0.56, 1] as const;

export default function Testimonials() {
  return (
    <section id="testimonials" className="w-full border-b border-border bg-white">
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3">
        {TESTIMONIALS.items.map((t, i) => (
          <motion.figure
            key={`${t.name}-${i}`}
            className={`flex flex-col justify-between gap-20 border-r border-b border-border p-6 ${
              i % 2 === 0 ? "bg-white" : "bg-offwhite"
            }`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.6, ease: EASE, delay: (i % 3) * 0.08 }}
          >
            <blockquote className="t-body-l">{t.quote}</blockquote>
            <figcaption className="flex items-center gap-[6px]">
              <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
              <span className="t-h6">{t.name}</span>
              <span className="t-body-s opacity-70">— {t.role}</span>
            </figcaption>
          </motion.figure>
        ))}

        {/* Outro tile */}
        <motion.div
          className="flex flex-col justify-between gap-20 border-r border-b border-border bg-yellow p-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.16 }}
        >
          <p className="t-h4">{TESTIMONIALS.outro}</p>
          <Button
            label={TESTIMONIALS.cta.label}
            href={TESTIMONIALS.cta.href}
            newTab={TESTIMONIALS.cta.newTab}
            fullWidth
          />
        </motion.div>
      </div>
    </section>
  );
}
