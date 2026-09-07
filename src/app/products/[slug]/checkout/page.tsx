import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageTemplate from "@/components/layout/PageTemplate";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { getProducts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PRODUCTS } from "@/lib/products";

/**
 * /products/[slug]/checkout — the three-step flow. The product is loaded
 * here, server-side, and the price is re-read again inside the server
 * action, so what the browser holds is only ever a copy for display.
 */
export const metadata: Metadata = {
  title: "Checkout — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await withOdooFallback("getProducts", getProducts, PRODUCTS);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <CheckoutFlow product={product} />
      </div>
    </PageTemplate>
  );
}
