import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import Cta from "@/components/sections/Cta";
import AddToCart from "@/components/cart/AddToCart";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/icons";
import { getProducts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PRODUCTS, getProduct, getNextProduct, type Product } from "@/lib/products";
import { getSession } from "@/lib/auth/session";
import { getOwnedProductIds } from "@/lib/odoo/orders";
import { createDownloadToken } from "@/lib/checkout/signing";

/**
 * /products/[slug] — one product, on the case study's frame (Framer page
 * yYdS2aTdj): the sticky title beside a /Yellow opening panel and a /Black
 * meta panel, then the gallery, the listing, and "Next Product".
 *
 * A case study's meta panel ends in "Live Link" pointing at the client's
 * site. A product's ends in the price and Add to Cart, because the thing
 * you want from this page is the thing itself. Adding it to the cart rather
 * than linking straight out is what makes it an order: the product is free
 * either way, but an order is on the record and the person can be told when
 * it changes. The marketplace link stays alongside for anyone who would
 * rather just go.
 *
 * Whether the button appears at all, and how many a cart may hold, come
 * from the product record in Odoo — see src/lib/products.ts.
 *
 * Imagery is Odoo's own eCommerce Media, served through /api/odoo/media.
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
    title: `${product.title} — ${product.tagline || product.kind} — Isaiah Kakitahi`,
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

  // What a signed-in customer already owns changes what this page offers:
  // a template limited to one per customer becomes "you have this, here it
  // is" rather than a buy button they'd be refused at checkout, while a
  // product that can be bought again keeps its Add to Cart and simply says
  // so. Signed out, none of this runs and the page is the public one.
  const session = await getSession();
  const owned = session ? await getOwnedProductIds(session.partnerId) : new Set<number>();
  const isOwned = owned.has(product.productId);
  const ownedDownloadUrl =
    isOwned && product.deliverable
      ? `/api/download?token=${encodeURIComponent(
          createDownloadToken(`owned-${product.productId}`, product.deliverable.attachmentId)
        )}`
      : null;
  const [opening, ...rest] = product.description.split("\n\n");
  const [lead, ...gallery] = product.images;

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title={product.title}>
          {/* Opening */}
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden border-b border-l border-border bg-yellow p-6">
            <Reveal className="flex w-full flex-col items-start gap-6">
              {product.tagline && <span className="t-button">{product.tagline}</span>}
              <p className="t-h4 w-full">{opening}</p>
            </Reveal>
          </div>

          {/* Meta */}
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-10 overflow-hidden bg-black p-6 text-white">
            <div className="flex w-full flex-col gap-[14px]">
              <MetaRow label="Type">
                <span className="t-body">{product.kind}</span>
              </MetaRow>
              <MetaRow label="Available On">
                <span className="t-body">{product.platform}</span>
              </MetaRow>
              {product.license && (
                <MetaRow label="Licence">
                  <span className="t-body">{product.license}</span>
                </MetaRow>
              )}
              {product.updated && (
                <MetaRow label="Updated">
                  <span className="t-body">{product.updated}</span>
                </MetaRow>
              )}
              <MetaRow label="Price">
                <span className="t-body">{product.price}</span>
              </MetaRow>
            </div>

            <div className="flex w-full flex-col items-start gap-4">
              {isOwned && (
                <div className="flex w-full flex-col items-start gap-3 border-l-[3px] border-yellow pl-3">
                  <span className="t-button">You have this</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {ownedDownloadUrl && (
                      <a
                        href={ownedDownloadUrl}
                        download
                        className="t-button bg-yellow px-5 py-3 text-black"
                      >
                        Download {product.deliverable?.name ?? "your file"} ↓
                      </a>
                    )}
                    <Link href="/account" className="t-body underline underline-offset-4">
                      See it in your account
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                {/* One per customer and already owned: there is nothing to
                    add, and offering it would only be refused at checkout. */}
                {!(isOwned && product.oncePerCustomer) && (
                  <AddToCart
                    slug={product.slug}
                    maxQuantity={product.maxQuantity}
                    purchasable={product.purchasable}
                  />
                )}
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[3px] overflow-hidden"
                >
                  <span className="t-body">{product.linkLabel}</span>
                  <ArrowUpRight color="rgb(255, 255, 255)" />
                </a>
              </div>
            </div>
          </div>
        </PageHero>

        {/* Lead image — Odoo eCommerce Media */}
        {lead && (
          <Reveal className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lead.src}
              alt={lead.alt}
              className="h-[320px] w-full border-b border-border bg-lightgrey object-cover desktop:h-[600px]"
            />
          </Reveal>
        )}

        {/* About beside what you get */}
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

            {isOwned && product.oncePerCustomer ? (
              <Link href="/account" className="t-button bg-black px-6 py-4 text-white">
                You have this — open your account →
              </Link>
            ) : (
              <AddToCart
                slug={product.slug}
                maxQuantity={product.maxQuantity}
                purchasable={product.purchasable}
              />
            )}
          </div>
        </section>

        {/* The rest of the gallery */}
        {gallery.length > 0 && (
          <section className="grid w-full grid-cols-1 border-b border-border tablet:grid-cols-2">
            {gallery.map((im, n) => (
              <Reveal key={im.src} className="w-full" delay={n * 0.06}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={im.src}
                  alt={im.alt}
                  className="aspect-[4/3] w-full border-r border-b border-border bg-lightgrey object-cover"
                />
              </Reveal>
            ))}
          </section>
        )}

        {/* The listing itself */}
        {product.sections.length > 0 && (
          <article className="flex w-full flex-col items-center bg-white">
            {product.sections.map((section, n) => (
              <section
                key={`${section.heading}-${n}`}
                className="flex w-full justify-center border-b border-border px-5 py-16 desktop:px-6 desktop:py-20"
              >
                <div className="flex w-full max-w-[760px] flex-col items-start gap-6">
                  <Reveal className="flex items-center gap-[6px]" y={12}>
                    <span
                      aria-hidden="true"
                      className="block h-[10px] w-[10px] shrink-0 bg-yellow"
                    />
                    <h2 className="t-h4">{section.heading}</h2>
                  </Reveal>

                  {section.body && (
                    <Reveal className="flex w-full flex-col gap-5" y={20}>
                      {section.body.split("\n\n").map((para, k) => (
                        <p key={k} className="t-body-l w-full">
                          {para}
                        </p>
                      ))}
                    </Reveal>
                  )}

                  {section.items.length > 0 && (
                    <RevealGroup className="flex w-full flex-col items-start gap-3" stagger={0.05}>
                      {section.items.map((item) => (
                        <RevealItem key={item} className="flex w-full items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-[7px] block h-[10px] w-[10px] shrink-0 bg-yellow"
                          />
                          <span className="t-body">{item}</span>
                        </RevealItem>
                      ))}
                    </RevealGroup>
                  )}
                </div>
              </section>
            ))}
          </article>
        )}

        {/* Tags */}
        {product.tags.length > 0 && (
          <section className="flex w-full flex-wrap items-center gap-3 border-b border-border bg-offwhite px-6 py-8">
            <span className="t-body-s">Tags</span>
            {product.tags.map((t) => (
              <span key={t} className="t-body-s border border-border px-3 py-1">
                {t}
              </span>
            ))}
          </section>
        )}

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
