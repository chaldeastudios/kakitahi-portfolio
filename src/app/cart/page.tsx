import type { Metadata } from "next";
import { connection } from "next/server";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import CartView from "@/components/cart/CartView";
import { getProducts } from "@/lib/odoo/content";

/**
 * /cart — the cart holds slugs and quantities in the browser; the whole
 * catalogue is fetched here, live, and the two are resolved together. So a
 * price, a title or a purchase rule shown in the cart is always the one
 * Odoo holds right now, not whatever was true when the item was added. No
 * static fallback: a failed fetch is this route's error.tsx rather than a
 * cart quietly priced against stale data.
 */
export const metadata: Metadata = {
  title: "Cart — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  // Excludes this page from build-time prerendering — see the same note
  // on app/page.tsx.
  await connection();
  const products = await getProducts();

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title="Cart" />
        <CartView products={products} />
      </div>
    </PageTemplate>
  );
}
