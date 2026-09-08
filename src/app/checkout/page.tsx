import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { getProducts } from "@/lib/odoo/content";
import { withOdooRetry } from "@/lib/odoo/safe";
import { getSession } from "@/lib/auth/session";

/**
 * /checkout — one checkout for the whole cart, whatever is in it. The
 * catalogue is loaded here for display; every rule that decides what is
 * actually ordered is re-read inside the server action.
 *
 * Unlike a read-only page, this one shows a price the customer is about to
 * pay — falling back to the static dataset here means showing (and, absent
 * the same fix in the checkout action, charging) a price that isn't Odoo's
 * current one, which is worse than a retry. See withOdooRetry.
 */
export const metadata: Metadata = {
  title: "Checkout — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [products, session] = await Promise.all([
    withOdooRetry("getProducts", getProducts),
    getSession(),
  ]);

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
