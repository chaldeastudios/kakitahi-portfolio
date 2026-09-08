"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * The site's one error boundary — catches anything a page throws below the
 * root layout, which today means an Odoo request that failed and wasn't
 * caught closer to where it happened (an account page, for instance, shows
 * its own "can't reach your orders" state instead of landing here).
 *
 * This page used to be reachable only in theory: pages caught an Odoo
 * failure themselves and quietly rendered a static, stale copy of the
 * catalogue instead — free products with no images, case studies with no
 * photos — so a real outage looked like a working page with wrong content,
 * which is worse than an error, because nothing said anything was wrong.
 * This says so, plainly, instead.
 *
 * No PageTemplate here: Header and Footer read the signed-in session, which
 * is server-only, and an error boundary is required to be a Client
 * Component — it cannot await server data, so it can't render them. This is
 * deliberately minimal rather than broken.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <section className="flex h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden bg-white px-5">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-6 text-center">
        <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
        <h1 className="t-h3">This page couldn&apos;t load.</h1>
        <p className="t-body text-lightblack">
          Something didn&apos;t come back from the backend just now. It&apos;s usually
          temporary — try again in a moment, or check{" "}
          <Link href="/status" className="underline underline-offset-4">
            /status
          </Link>{" "}
          to see exactly what isn&apos;t reachable.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={reset} className="t-button bg-black px-6 py-4 text-white">
            Try again
          </button>
          <Link href="/" className="t-button underline underline-offset-4">
            Go to Homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
