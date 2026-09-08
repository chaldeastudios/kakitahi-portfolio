/**
 * Product types.
 *
 * ReplyFrame and Bernaum are Odoo content now (product.template records in
 * the "Chaldea Studios Products" category — see src/lib/odoo/content.ts
 * getProducts()), read live with no static fallback: a failed fetch
 * surfaces as the route's error.tsx rather than a stale placeholder
 * standing in for a real product — critically, the checkout treats
 * whatever this returns as real inventory (a real price, a real
 * productId), so a fake fallback isn't just visually stale, it's wrong to
 * sell against. This file used to also hold that placeholder data; it's
 * gone, and only the shape both the Odoo fetcher and the page components
 * share remains.
 *
 * Purchase rules are per-product and come from Odoo, not from code: a
 * product may be sellable or not (Odoo's own "Can be Sold"), may cap how
 * many a cart can hold, and may be limited to one order per customer.
 */

export type ProductImage = {
  src: string;
  alt: string;
};

/** The file a buyer is handed. Bernaum has one; ReplyFrame does not. */
export type ProductDeliverable = {
  /** ir.attachment id in Odoo. */
  attachmentId: number;
  name: string;
  sizeBytes: number;
};

export type Product = {
  slug: string;
  title: string;
  /** product.template id. */
  templateId: number;
  /** product.product id — what a sale.order line points at. 0 if none. */
  productId: number;
  /** "Framer Plugin", "Framer Template" — what kind of thing this is. */
  kind: string;
  /** The marketplace's own one-liner under the title. */
  tagline: string;
  /** Where it lives: "Framer Marketplace". */
  platform: string;
  /**
   * The base price, as Odoo's own list_price holds it — before tax. This is
   * what admin editing writes back to Odoo, so it stays the untaxed number
   * even where the rest of the site shows the taxed one.
   */
  priceValue: number;
  currency: string;
  /**
   * What a customer actually reads and actually pays — priceValue plus
   * taxRate, formatted. Never show priceValue alone where a customer can
   * see it: Paystack charges the taxed total, so anything less is a price
   * that changes partway through checkout.
   */
  priceLabel: string;
  /** The taxed number behind priceLabel — what the cart and checkout total. */
  priceInclTax: number;
  /**
   * The combined rate of every tax on this product that isn't already
   * folded into list_price (product.template.taxes_id, percentage taxes
   * only — see taxBreakdown() in lib/odoo/content.ts). 0 if none.
   */
  taxRate: number;
  /** e.g. "16% tax". Empty string if taxRate is 0. */
  taxLabel: string;
  license: string;
  published: string;
  updated: string;
  tags: string[];
  /** CTA wording on the marketplace, e.g. "Remix for Free". */
  linkLabel: string;
  /** The external URL the marketplace CTA opens. */
  link: string;
  /** Odoo's "Can be Sold" — false means link-only, no Add to Cart. */
  purchasable: boolean;
  /** Most a cart may hold of this. Digital goods default to 1. */
  maxQuantity: number;
  /** Refuse a second order of this by the same email. Defaults to true. */
  oncePerCustomer: boolean;
  /** Paragraphs, joined with a blank line. */
  description: string;
  highlights: string[];
  stat: { value: string; label: string } | null;
  /** The long-form listing: a heading, prose, and optionally a list. */
  sections: Array<{ heading: string; body: string; items: string[] }>;
  /** Odoo's eCommerce Media, served through /api/odoo/media. */
  images: ProductImage[];
  deliverable: ProductDeliverable | null;
};
