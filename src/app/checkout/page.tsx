import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { getProducts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PRODUCTS } from "@/lib/products";

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
  const products = await withOdooFallback("getProducts", getProducts, PRODUCTS);

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <CheckoutFlow products={products} />
      </div>
    </PageTemplate>
  );
}
