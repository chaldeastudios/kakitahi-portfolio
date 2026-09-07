"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/lib/cart/CartProvider";
import type { Product } from "@/lib/products";

/**
 * The cart's contents.
 *
 * The cart itself stores only slugs and quantities; this receives the full
 * product list, live from Odoo, and resolves against it. That has a useful
 * consequence: a product withdrawn or unpublished in Odoo simply stops
 * resolving, and the line is dropped rather than carried to a checkout that
 * would fail — so the cart can never be more current than the database.
 *
 * Quantity controls appear only where the product actually allows more than
 * one. For a template capped at one, a stepper that can only ever say "1"
 * is noise, so it says "1" and offers Remove.
 */
const EASE = [0.44, 0, 0.56, 1] as const;

export default function CartView({ products }: { products: Product[] }) {
  const { lines, setQuantity, remove, ready, clear } = useCart();

  const resolved = lines
    .map((line) => {
      const product = products.find((p) => p.slug === line.slug);
      return product ? { product, quantity: Math.min(line.quantity, product.maxQuantity) } : null;
    })
    .filter((x): x is { product: Product; quantity: number } => x !== null);

  const itemCount = resolved.reduce((n, r) => n + r.quantity, 0);
  const allFree = resolved.every((r) => r.product.price.toLowerCase() === "free");

  if (!ready) {
    return (
      <div className="flex min-h-[340px] w-full items-center border-b border-border bg-offwhite p-6 desktop:p-10">
        <span className="t-body">Loading your cart…</span>
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className="flex min-h-[340px] w-full flex-col items-start justify-center gap-6 border-b border-border bg-offwhite p-6 desktop:p-10">
        <p className="t-h4 max-w-[520px]">Your cart is empty.</p>
        <p className="t-body max-w-[520px]">
          Everything in the shop is free — a plugin and a template, with more to come.
        </p>
        <Link href="/products" className="t-button bg-black px-6 py-4 text-white">
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <AnimatePresence initial={false}>
        {resolved.map(({ product, quantity }) => (
          <motion.article
            key={product.slug}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex w-full items-start gap-6 overflow-hidden border-b border-border bg-white p-6 desktop:p-10"
          >
            {product.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].src}
                alt={product.images[0].alt}
                className="hidden h-[90px] w-[120px] shrink-0 border border-border bg-lightgrey object-cover tablet:block"
              />
            )}

            <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
              <span className="t-body-s">{product.kind}</span>
              <Link href={`/products/${product.slug}`} className="t-h5">
                {product.title}
              </Link>
              {product.oncePerCustomer && (
                <span className="t-body-s text-lightblack">One per customer</span>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-3">
              <span className="t-body">{product.price}</span>

              {product.maxQuantity > 1 ? (
                <div className="flex items-center border border-black">
                  <button
                    type="button"
                    onClick={() => setQuantity(product.slug, quantity - 1, product.maxQuantity)}
                    className="t-body px-3 py-1"
                    aria-label={`One fewer ${product.title}`}
                  >
                    −
                  </button>
                  <span className="t-body min-w-[28px] text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(product.slug, quantity + 1, product.maxQuantity)}
                    disabled={quantity >= product.maxQuantity}
                    className="t-body px-3 py-1 disabled:opacity-40"
                    aria-label={`One more ${product.title}`}
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="t-body-s">Qty 1</span>
              )}

              <button
                type="button"
                onClick={() => remove(product.slug)}
                className="t-body-s underline underline-offset-4"
              >
                Remove
              </button>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>

      {/* Summary */}
      <div className="flex w-full flex-col items-start gap-8 border-b border-border bg-black p-6 text-white desktop:p-10">
        <div className="flex w-full max-w-[560px] flex-col gap-[14px]">
          <div className="flex w-full items-baseline justify-between gap-6 border-b border-border pb-[14px]">
            <span className="t-body">Items</span>
            <span className="t-body">{itemCount}</span>
          </div>
          <div className="flex w-full items-baseline justify-between gap-6 pt-2">
            <span className="t-h5">Total</span>
            <span className="t-h5">{allFree ? "Free" : "See checkout"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/checkout" className="t-button bg-yellow px-6 py-4 text-black">
            Checkout →
          </Link>
          <Link href="/products" className="t-button underline underline-offset-4">
            Keep browsing
          </Link>
          <button
            type="button"
            onClick={clear}
            className="t-body-s underline underline-offset-4 opacity-70"
          >
            Empty cart
          </button>
        </div>
      </div>
    </div>
  );
}
