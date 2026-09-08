"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Catches a checkout page that couldn't reach Odoo — the one place on the
 * site where the root error.tsx's generic wording isn't quite right: the
 * cart lives in localStorage, not on this page, so a checkout that fails
 * to load has not lost anything, and it's worth saying so plainly rather
 * than leaving that as an assumption someone has to make on a failure
 * screen.
 *
 * Next.js requires error.tsx to be a Client Component, which rules out
 * PageTemplate — it's an async Server Component that reads the session for
 * the header — so this renders standalone rather than through it, same as
 * the root error.tsx.
 */
export default function CheckoutError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[checkout] page failed to load:", error);
  }, [error]);

  return (
    <section className="flex h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden bg-white px-5">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-6 text-center">
        <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
        <h1 className="t-h3">Couldn&apos;t reach the store.</h1>
        <p className="t-body text-lightblack">
          Current prices didn&apos;t load just now — usually temporary. Your cart is still
          saved; nothing was ordered or charged.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/checkout" className="t-button bg-black px-6 py-4 text-white">
            Try again
          </Link>
          <Link href="/cart" className="t-button underline underline-offset-4">
            Back to cart
          </Link>
        </div>
      </div>
    </section>
  );
}
