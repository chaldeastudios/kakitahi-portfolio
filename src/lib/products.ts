/**
 * Products dataset — the things anyone can pick up and use, as opposed to
 * the client work in src/lib/projects.ts and the services in
 * src/lib/content.ts. Both currently live on the Framer Marketplace and
 * both are free, so each product page ends in a direct link out rather
 * than a checkout.
 *
 * On paid products later: Odoo already carries a price on every one of
 * these records, and its own eCommerce module can take payment and deliver
 * a digital download. Nothing here forecloses that — the day a product
 * stops being free, `price` stops reading "Free" and the CTA points at the
 * Odoo shop instead of the marketplace. Until then a direct link is the
 * honest and much simpler thing.
 *
 * Odoo is the source of truth (product.template, category "Chaldea Studios
 * Products", id 8); this is the static fallback, kept identical to what
 * src/lib/odoo/content.ts parses out of those records.
 */

export type Product = {
  slug: string;
  title: string;
  /** "Framer Plugin", "Framer Template" — what kind of thing this is. */
  kind: string;
  /** Where it lives: "Framer Marketplace". */
  platform: string;
  /** "Free", or a price once one applies. */
  price: string;
  /** CTA wording, e.g. "Get the Plugin". */
  linkLabel: string;
  /** The external URL the CTA opens. */
  link: string;
  /** Paragraphs, joined with a blank line. */
  description: string;
  highlights: string[];
  stat: { value: string; label: string } | null;
  images: string[];
};

export const PRODUCTS: Product[] = [
  {
    slug: "replyframe",
    title: "ReplyFrame",
    kind: "Framer Plugin",
    platform: "Framer Marketplace",
    price: "Free",
    linkLabel: "Get the Plugin",
    link: "https://www.framer.com/marketplace/plugins/replyframe/",
    description:
      "A live comment-and-review plugin with its own SaaS-style backend, running in the Framer Marketplace. Reached 50+ users in its first two months live.\n\nInstall it from the Framer Marketplace and it drops into an existing Framer project — comments and reviews are stored and served by its own backend rather than a third-party embed, so the data stays yours and the styling stays inside your design system.",
    highlights: [
      "Live in the Framer Marketplace",
      "Own SaaS-style backend",
      "Comments and reviews on any Framer site",
      "50+ users in its first two months",
    ],
    stat: { value: "50+", label: "users on ReplyFrame in its first two months" },
    images: [],
  },
  {
    slug: "bernaum",
    title: "Bernaum",
    kind: "Framer Template",
    platform: "Framer Marketplace",
    price: "Free",
    linkLabel: "Get the Template",
    link: "https://www.framer.com/marketplace/templates/bernaum/",
    description:
      "A Framer template published on the Framer Marketplace, free to remix. Open it in Framer, replace the content with your own, and publish — no code, and no starting from an empty canvas.",
    highlights: [
      "Free on the Framer Marketplace",
      "Remix directly in Framer",
      "Responsive across desktop, tablet and phone",
    ],
    stat: null,
    images: [],
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/** Wraps around, so the last product points back at the first. */
export function getNextProduct(slug: string): Product {
  const i = PRODUCTS.findIndex((p) => p.slug === slug);
  return PRODUCTS[(i + 1) % PRODUCTS.length];
}
