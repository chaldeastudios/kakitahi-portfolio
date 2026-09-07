import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { getProducts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PRODUCTS } from "@/lib/products";
import { getSession } from "@/lib/auth/session";

/**
 * /checkout — one checkout for the whole cart, whatever is in it. The
 * catalogue is loaded here for display; every rule that decides what is
 * actually ordered is re-read inside the server action.
 */
export const metadata: Metadata = {
  title: "Checkout — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [products, session] = await Promise.all([
    withOdooFallback("getProducts", getProducts, PRODUCTS),
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
