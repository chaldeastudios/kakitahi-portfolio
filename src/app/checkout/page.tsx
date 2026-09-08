import type { Metadata } from "next";
import { connection } from "next/server";
import PageTemplate from "@/components/layout/PageTemplate";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { getProducts } from "@/lib/odoo/content";
import { getSession } from "@/lib/auth/session";

/**
 * /checkout — one checkout for the whole cart, whatever is in it. The
 * catalogue is loaded here for display; every rule that decides what is
 * actually ordered is re-read inside the server action. No static
 * fallback: a failed fetch is this route's error.tsx rather than a
 * checkout page quietly built against stale, wrongly-priced products.
 */
export const metadata: Metadata = {
  title: "Checkout — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // Excludes this page from build-time prerendering — see the same note
  // on app/page.tsx.
  await connection();
  const [products, session] = await Promise.all([getProducts(), getSession()]);

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <CheckoutFlow
          products={products}
          account={session ? { name: session.name, email: session.email } : undefined}
        />
      </div>
    </PageTemplate>
  );
}
