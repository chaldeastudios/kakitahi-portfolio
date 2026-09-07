import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import Cta from "@/components/sections/Cta";
import Button from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/icons";
import { getProducts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PRODUCTS, getProduct, getNextProduct, type Product } from "@/lib/products";

/**
 * /products/[slug] — one product, on the case study's frame (Framer page
 * yYdS2aTdj): the sticky title beside a /Yellow opening panel and a /Black
 * meta panel, then the detail, then "Next Product" and the shared CTA.
 *
 * A case study's meta panel ends in "Live Link" pointing at the client's
 * site; a product's ends in the place you actually get the thing. Both
 * products are free today, so that is a direct link to the Framer
 * Marketplace rather than a checkout — see src/lib/products.ts on what
 * changes if one stops being free.
 */

async function loadProducts(): Promise<Product[]> {
  return withOdooFallback("getProducts", getProducts, PRODUCTS);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const products = await loadProducts();
  const product = products.find((p) => p.slug === slug) ?? getProduct(slug);
  if (!product) return { title: "Product not found — Isaiah Kakitahi" };
  return {
    title: `${product.title} — Isaiah Kakitahi`,
    description: product.description.split("\n\n")[0],
  };
}

/** One row of the black meta panel — same construction as a case study's. */
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-6 overflow-hidden border-b border-border pb-[14px] desktop:gap-24">
      <span className="t-body shrink-0">{label}</span>
      {children}
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await loadProducts();
  const product = products.find((p) => p.slug === slug) ?? getProduct(slug);
  if (!product) notFound();

  const i = products.findIndex((p) => p.slug === slug);
  const next = i >= 0 ? products[(i + 1) % products.length] : getNextProduct(slug);
  const [opening, ...rest] = product.description.split("\n\n");

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title={product.title}>
          {/* Opening */}
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden border-b border-l border-border bg-yellow p-6">
            <Reveal className="w-full">
              <p className="t-h4 w-full">{opening}</p>
            </Reveal>
          </div>

          {/* Meta */}
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden bg-black p-6 text-white">
            <MetaRow label="Type">
              <span className="t-body">{product.kind}</span>
            </MetaRow>
            <MetaRow label="Available On">
              <span className="t-body">{product.platform}</span>
            </MetaRow>
            <MetaRow label="Price">
              <span className="t-body">{product.price}</span>
            </MetaRow>
            <MetaRow label="Get It">
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[3px] overflow-hidden"
              >
                <span className="t-body">{product.linkLabel}</span>
                <ArrowUpRight color="rgb(255, 255, 255)" />
              </a>
            </MetaRow>
          </div>
        </PageHero>

        {/* Detail — the rest of the description beside what you get */}
        <section className="grid w-full grid-cols-1 bg-white desktop:grid-cols-2">
          <div className="flex flex-col items-start gap-6 border-r border-b border-border p-6 desktop:p-10">
            <Reveal className="flex items-center gap-[6px]" y={12}>
              <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
              <h2 className="t-button">About</h2>
            </Reveal>
            <Reveal className="flex w-full flex-col gap-5" y={20}>
              {(rest.length ? rest : [opening]).map((para, n) => (
                <p key={n} className="t-body-l w-full">
                  {para}
                </p>
              ))}
            </Reveal>
          </div>

          <div className="flex flex-col items-start justify-between gap-10 border-b border-border bg-offwhite p-6 desktop:p-10">
            <div className="flex w-full flex-col items-start gap-6">
              <Reveal className="flex items-center gap-[6px]" y={12}>
                <span
                  aria-hidden="true"
                  className="block h-[10px] w-[10px] shrink-0 bg-yellow"
                />
                <h2 className="t-button">What You Get</h2>
              </Reveal>
              <RevealGroup className="flex w-full flex-col items-start gap-2" stagger={0.07}>
                {product.highlights.map((h) => (
                  <RevealItem key={h} className="flex w-full items-center gap-2 overflow-hidden">
                    <span
                      aria-hidden="true"
                      className="block h-[10px] w-[10px] shrink-0 bg-yellow"
                    />
                    <span className="t-body">{h}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>

            {product.stat && (
              <Reveal className="flex flex-col items-start gap-1" y={16}>
                <span className="t-h2">{product.stat.value}</span>
                <span className="t-body">{product.stat.label}</span>
              </Reveal>
            )}

            <Button label={product.linkLabel} href={product.link} newTab />
          </div>
        </section>

        {/* Next product */}
        <section className="flex w-full items-center justify-center gap-[10px] bg-offwhite p-20">
          <span className="flex-1" />
          <Link href={`/products/${next.slug}`} className="t-body-l">
            Next Product: {next.title}
          </Link>
        </section>

        <div className="w-full">
          <Cta />
        </div>
      </div>
    </PageTemplate>
  );
}
