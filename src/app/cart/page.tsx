import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import CartView from "@/components/cart/CartView";
import { getProducts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PRODUCTS } from "@/lib/products";

/**
 * /cart — the cart holds slugs and quantities in the browser; the whole
 * catalogue is fetched here, live, and the two are resolved together. So a
 * price, a title or a purchase rule shown in the cart is always the one
 * Odoo holds right now, not whatever was true when the item was added.
 */
export const metadata: Metadata = {
  title: "Cart — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const products = await withOdooFallback("getProducts", getProducts, PRODUCTS);

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title="Cart" />
        <CartView products={products} />
      </div>
    </PageTemplate>
  );
}
