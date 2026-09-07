"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "@/components/ui/icons";
import { useCart } from "@/lib/cart/CartProvider";

/**
 * Add to Cart — the Framer Button's construction (gvRRv8Sb0): the /Yellow
 * wipe from the left edge and the two-arrow swap, so it is the same object
 * as every other primary action on the site.
 *
 * It flips to "In your cart · View cart" once the product is in, rather
 * than letting someone add the same template four times and only find out
 * at checkout. The cap it enforces is the product's own maxQuantity from
 * Odoo, not a number written here.
 */
const EASE = [0.44, 0, 0.56, 1] as const;
const DURATION = 0.5;

export default function AddToCart({
  slug,
  maxQuantity,
  purchasable,
  className = "",
}: {
  slug: string;
  maxQuantity: number;
  purchasable: boolean;
  className?: string;
}) {
  const { add, has, ready } = useCart();
  const [hovered, setHovered] = useState(false);

  if (!purchasable) return null;

  const inCart = ready && has(slug);

  if (inCart) {
    return (
      <div className={`flex flex-wrap items-center gap-4 ${className}`}>
        <span className="t-button flex items-center gap-[6px]">
          <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
          In your cart
        </span>
        <Link href="/cart" className="t-button underline underline-offset-4">
          View cart
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => add(slug, maxQuantity)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`relative flex min-w-[180px] items-center justify-between gap-5 overflow-hidden bg-black p-[14px] text-left ${className}`}
    >
      <motion.span
        aria-hidden="true"
        className="absolute top-0 bottom-0 -left-px z-0 bg-yellow"
        initial={false}
        animate={{ width: hovered ? "calc(100% + 1px)" : "0%" }}
        transition={{ duration: DURATION, ease: EASE }}
      />
      <motion.span
        className="t-button relative z-[1]"
        initial={false}
        animate={{ color: hovered ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)" }}
        transition={{ duration: DURATION, ease: EASE }}
      >
        Add to Cart
      </motion.span>
      <span className="relative z-[1] block h-[17px] w-[18px] overflow-hidden">
        <motion.span
          className="absolute inset-0 block"
          initial={false}
          animate={{ x: hovered ? 18 : 0 }}
          transition={{ duration: DURATION, ease: EASE }}
        >
          <span className="absolute top-0 -left-[18px] block">
            <ArrowRight color="rgb(0, 0, 0)" />
          </span>
          <span className="absolute top-0 left-0 block">
            <ArrowRight color="rgb(255, 255, 255)" />
          </span>
        </motion.span>
      </span>
    </button>
  );
}
