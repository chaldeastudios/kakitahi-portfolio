import type { Metadata } from "next";
import { connection } from "next/server";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import ProductCard from "@/components/ui/ProductCard";
import Cta from "@/components/sections/Cta";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { getProducts } from "@/lib/odoo/content";

/**
 * /products — the things anyone can pick up and use, as opposed to the
 * client work at /projects. Same frame as that listing: the shared
 * PageHero, a 2-column grid of cards, the shared closing CTA.
 *
 * Read live from Odoo (product.template, category "Chaldea Studios
 * Products"), briefly cached — see CONTENT_CACHE_SECONDS in
 * src/lib/odoo/content.ts — with no static fallback: a failed fetch is
 * this route's error.tsx, not a stale catalogue with wrong prices.
 */
export const metadata: Metadata = {
  title: "Products — Isaiah Kakitahi",
  description:
    "ReplyFrame, a comment-and-review plugin with its own backend, and the Bernaum template — both free on the Framer Marketplace.",
};

export default async function ProductsPage() {
  // Excludes this page from build-time prerendering — see the same note
  // on app/page.tsx.
  await connection();
  const products = await getProducts();

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title="Products" />

        <RevealGroup className="grid w-full grid-cols-1 tablet:grid-cols-2" stagger={0.1}>
          {products.map((p) => (
            <RevealItem key={p.slug} className="flex">
              <ProductCard
                title={p.title}
                kind={p.kind}
                price={p.priceLabel}
                description={p.description.split("\n\n")[0]}
                href={`/products/${p.slug}`}
                image={p.images[0]}
              />
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="w-full">
          <Cta />
        </div>
      </div>
    </PageTemplate>
  );
}
