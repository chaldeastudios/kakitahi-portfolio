/**
 * Products dataset — the things anyone can pick up and use, as opposed to
 * the client work in src/lib/projects.ts and the services in
 * src/lib/content.ts. Both currently live on the Framer Marketplace and
 * both are free, so each product page ends in a direct link out rather
 * than a checkout.
 *
 * Purchase rules are per-product and come from Odoo, not from code: a
 * product may be sellable or not (Odoo's own "Can be Sold"), may cap how
 * many a cart can hold, and may be limited to one order per customer. The
 * defaults suit a digital good — one per cart, one per customer, and no
 * inventory, because these products are non-storable services in Odoo and
 * there is nothing to run out of. A product added to Odoo tomorrow picks
 * all of this up without a deploy.
 *
 * On paid products later: Odoo already carries a price on every one of
 * these records, and its own eCommerce module can take payment and deliver
 * a digital download. Nothing here forecloses that — the day a product
 * stops being free, `price` stops reading "Free" and the checkout grows a
 * payment step rather than placing a silent zero-price order.
 *
 * Odoo is the source of truth (product.template, category "Chaldea Studios
 * Products", id 8); this is the static fallback, kept identical to what
 * src/lib/odoo/content.ts parses out of those records.
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
   * The price as Odoo holds it. `priceValue` is the number the checkout
   * decides on; `priceLabel` is the same thing as a customer reads it.
   * Both come from product.template.list_price on every request — change
   * the price in Odoo and the next page view charges it.
   */
  priceValue: number;
  currency: string;
  priceLabel: string;
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

export const PRODUCTS: Product[] = [
  {
    slug: "replyframe",
    title: "ReplyFrame",
    templateId: 26,
    productId: 26,
    kind: "Framer Plugin",
    tagline: "Free Comments & Reviews",
    platform: "Framer Marketplace",
    priceValue: 0,
    currency: "KES",
    priceLabel: "Free",
    license: "Limited",
    published: "Aug 14, 2026",
    updated: "Aug 14, 2026",
    tags: ["Utilities", "CMS", "Integrations"],
    linkLabel: "Open Plugin",
    link: "https://www.framer.com/marketplace/plugins/replyframe/",
    purchasable: true,
    maxQuantity: 1,
    oncePerCustomer: true,
    description:
      "ReplyFrame is a powerful, embeddable comment and review system built specifically for Framer websites. Add discussions, collect feedback, and display social proof — without subscriptions, paywalls, or limits.\n\nDesigned for creators, founders, and indie builders, ReplyFrame makes it effortless to bring engagement to any page.",
    highlights: [
      "Optimized for Framer",
      "Easy to embed",
      "Designed for real-world usage",
      "Clean, minimal interface",
      "Built for creators",
    ],
    stat: { value: "50+", label: "users on ReplyFrame in its first two months" },
    sections: [
      {
        heading: "Add Comments to Any Framer Page",
        body: "With ReplyFrame, you can:\n\nAll in minutes. No external platforms required.",
        items: [
          "Embed a fully featured comment section",
          "Collect written feedback and star ratings",
          "Enable threaded replies",
          "Allow users to like comments",
          "Moderate discussions from a simple management interface",
        ],
      },
      {
        heading: "Built for Performance & Reliability",
        body: "ReplyFrame is designed to be:\n\nEach project runs independently, ensuring your comment system remains stable and reliable as your site grows.",
        items: ["Fast and lightweight", "Secure and isolated per project", "Easy to install and manage"],
      },
      {
        heading: "Free, Simple, and Unlimited",
        body: "There are:\n\nReplyFrame gives you a complete comment and review solution — free.",
        items: ["No subscriptions", "No usage limits", "No forced branding", "No hidden tiers"],
      },
      {
        heading: "Perfect For",
        body: "If you're looking for a free comment system for Framer or a review plugin for Framer websites, ReplyFrame delivers a clean, modern solution built specifically for the Framer ecosystem.",
        items: [
          "SaaS landing pages",
          "Portfolio sites",
          "Product launches",
          "Community projects",
          "Digital storefronts",
          "Content-driven websites",
        ],
      },
    ],
    images: [],
    deliverable: null,
  },
  {
    slug: "bernaum",
    title: "Bernaum",
    templateId: 28,
    productId: 28,
    kind: "Framer Template",
    tagline: "Personal & Ecommerce Template",
    platform: "Framer Marketplace",
    priceValue: 0,
    currency: "KES",
    priceLabel: "Free",
    license: "Limited",
    published: "",
    updated: "Sep 1, 2026",
    tags: ["Portfolio"],
    linkLabel: "Remix for Free",
    link: "https://www.framer.com/marketplace/templates/bernaum/",
    purchasable: true,
    maxQuantity: 1,
    oncePerCustomer: true,
    description:
      "Whether you're an artist, designer, or creative professional, this template gives you the tools to present your work beautifully and manage your content with ease. From smooth animations to a powerful CMS, every feature is built to enhance your portfolio's visual impact while keeping navigation intuitive for visitors.\n\nThis template also features the free ReplyFrame Comments & Reviews plugin for engaging blog posts and ecommerce pages.",
    highlights: [
      "Powerful CMS you can run without touching code",
      "Smooth appear effects, overlays and text effects",
      "Portfolio and ecommerce pages in one template",
      "ReplyFrame comments and reviews built in",
    ],
    stat: null,
    sections: [
      {
        heading: "Features",
        body: "",
        items: [
          "Appear Effects — Bring your portfolio to life with subtle animations that draw attention to your work without overwhelming it. Perfect for showcasing artwork or projects in an engaging way.",
          "Overlays & Modals — Highlight key pieces or provide additional context through pop-up image galleries, project details, or video embeds.",
          "Slideshows/Tickers — Share multiple works or client testimonials in a compact space with smooth, interactive carousels.",
          "Sticky Scrolling — Keep navigation or key calls-to-action in view as visitors explore your work, ensuring easy access to important sections like “Contact” or “Portfolio.”",
          "CMS — Effortlessly manage and update projects, blog posts, or exhibitions without touching code. Ideal for artists who frequently add new work.",
          "Site Search — Allow visitors to quickly find specific projects, articles, or portfolio categories.",
          "Forms — Make it easy for potential clients, collaborators, or fans to get in touch through customizable contact or commission request forms.",
          "Layout Templates — Start with a polished, consistent structure designed to showcase creative work while remaining fully customizable to your style.",
          "Text Effects — Add personality to your headlines and project titles with subtle animations or stylized typography.",
          "Code Components — Extend your site's functionality with custom interactive elements or integrations tailored to your creative needs.",
        ],
      },
    ],
    images: [],
    // Mirrors the file actually attached to product.template 28 in Odoo.
    // The bytes only exist there, so a download still needs a live
    // connection — but the page knows there is something to hand over.
    deliverable: {
      attachmentId: 1322,
      name: "Ruby Bernaum Remix Link.pdf",
      sizeBytes: 9269882,
    },
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
