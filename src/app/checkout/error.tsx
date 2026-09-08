"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Catches a checkout page that couldn't load the live catalogue even after
 * withOdooRetry's retries — Odoo Online's own rate limit (HTTP 429) is the
 * failure this exists for. Next.js's default error screen would otherwise
 * show here, which is generic and, worse, gives no way back to the cart
 * without losing it (the cart lives in localStorage, so it's still there
 * either way).
 *
 * Next.js requires error.tsx to be a Client Component, which rules out
 * PageTemplate — it's an async Server Component that reads the session for
 * the header. So this renders standalone rather than through it.
 */
export default function CheckoutError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.warn("[checkout] page failed to load:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden bg-white px-5">
      <Reveal
        className="flex w-full flex-col items-center gap-4 text-center tablet:w-[80%] desktop:w-[60%]"
        y={32}
        duration={0.85}
      >
        <h1 className="t-h2 w-full">Couldn&apos;t reach the store</h1>
        <p className="t-body opacity-70">
          The checkout couldn&apos;t load current prices just now. Your cart is still saved
          — please try again in a moment.
        </p>
      </Reveal>
      <Reveal delay={0.12} y={16} className="flex items-center gap-3">
        <Button label="Try again" href="/checkout" />
        <Button label="Back to cart" href="/cart" />
      </Reveal>
    </div>
  );
}
