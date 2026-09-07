"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "./icons";

/**
 * ProductCard — the products listing's card, on ProjectCard's construction
 * (zUVpU454J): /Off-white ground, 1px /Black border, 32px padding, and the
 * same two-arrow swap on hover.
 *
 * A product that has eCommerce Media in Odoo shows it, exactly as a project
 * card shows its project image. One that doesn't — ReplyFrame, today — puts
 * what someone needs in order to judge it in that same space instead: what
 * kind of thing it is, what it does, and what it costs.
 */
const EASE = [0.44, 0, 0.56, 1] as const;

export default function ProductCard({
  title,
  kind,
  price,
  description,
  href,
  image,
}: {
  title: string;
  kind: string;
  price: string;
  description: string;
  href: string;
  /** Lead image from Odoo's eCommerce Media, if the product has one. */
  image?: { src: string; alt: string };
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
      {image ? (
        <div className="w-full overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={image.src}
            alt={image.alt}
            className="h-[300px] w-full bg-lightgrey object-cover desktop:h-[420px]"
            initial={false}
            animate={{ scale: hovered ? 1.03 : 1 }}
            transition={{ duration: 0.7, ease: EASE }}
          />
        </div>
      ) : (
        <div className="flex min-h-[220px] w-full flex-col items-start justify-between gap-6 border border-border bg-white p-6">
          <div className="flex w-full flex-col items-start gap-6">
            <div className="flex items-center gap-[6px]">
              <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
              <span className="t-body-s">{kind}</span>
            </div>
            <p className="t-body-l w-full">{description}</p>
          </div>
          {price && <span className="t-body-s">{price}</span>}
        </div>
      )}

      <div className="flex w-full items-center justify-between gap-8">
        <div className="flex flex-col items-start gap-[5px]">
          <span className="t-h5">{title}</span>
          <span className="t-body">{kind}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="t-body">View Product</span>
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
