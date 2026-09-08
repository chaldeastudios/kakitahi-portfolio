import "server-only";
import { cache } from "react";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { ODOO_API_KEY } from "./config";
import { callJson2 } from "./json2";
import { resolveIdByName } from "./ids";
import type { Project, ProjectImage } from "@/lib/projects";
import type { JournalPost } from "@/lib/journal";
import type { Product } from "@/lib/products";

/**
 * Odoo-backed content fetchers — read-only, via the JSON-2 client in
 * ./json2.ts. Called fresh on every request; nothing here is cached beyond
 * a single render (see getCaseStudies).
 *
 * Every blog.post / product.template record this reads was written with a
 * predictable HTML shape, so parsing is a straight extraction rather than
 * free-text scraping. That shape is also exactly what a person editing the
 * record in Odoo's own rich-text editor sees and can safely add to.
 *
 * ── Why classes and not data-attributes ──────────────────────────────────
 * Odoo sanitises every HTML field on write. On this instance (Odoo 19) it
 * strips data-* attributes off <div> and <ul> elements silently: a record
 * written as <div data-section="number">01.</div> reads back as
 * <div>01.</div>. Nothing errors; the write returns success and the field
 * simply loses its markers. class, id, style and title all survive intact,
 * as do <section>, <footer>, <ul>/<li> and HTML comments.
 *
 * So all structure is carried by ks-* class names, and every *value* lives
 * in visible content (a <li>, a <span>) rather than an attribute. That has
 * a second benefit: someone editing a service in Odoo's own editor can see
 * and change the client name or the stat, because it's text on the page,
 * not an invisible attribute they'd have to open the code view to reach.
 *
 * The shapes:
 *   service   .ks-number · .ks-description>p · ul.ks-highlights>li
 *             .ks-stat > span.ks-stat-value + span.ks-stat-label
 *             .ks-images>img[src][alt]
 *   product   the service shape, plus repeated .ks-body > h3 + p… + ul>li,
 *             optional li.ks-max-quantity and li.ks-once-per-customer,
 *             and ul.ks-meta > li.ks-kind|.ks-tagline|.ks-platform|.ks-price
 *                              |.ks-license|.ks-published|.ks-updated
 *                              |.ks-tags|.ks-link-label|.ks-live-link
 *             Its gallery and its deliverable are NOT in the description:
 *             they are Odoo's own eCommerce Media (product.image) and the
 *             file attached to the product (ir.attachment).
 *   case study ul.ks-meta > li.ks-client|.ks-year|.ks-live-link|.ks-services
 *             .ks-overview · .ks-problem · .ks-solution · .ks-result
 *             .ks-testimonial > p… + footer>span.ks-name+span.ks-role
 *             .ks-images>img[src][alt]
 *   journal   ul.ks-meta > li.ks-category|.ks-date|.ks-author
 *             .ks-intro · repeated .ks-body > h3 + p…
 */

const CASE_STUDY_TAG_NAME = "Case Study"; // blog.tag
const PORTFOLIO_BLOG_NAME = "Portfolio"; // blog.blog
const JOURNAL_BLOG_NAME = "Our blog"; // blog.blog
const SERVICES_CATEGORY_NAME = "Chaldea Studios Services"; // product.category
const PRODUCTS_CATEGORY_NAME = "Chaldea Studios Products"; // product.category

/**
 * How long a fetch here may be served from Next's cache before Odoo is
 * asked again. Odoo Online (this site's backend since the move off a
 * self-hosted instance) enforces its own platform-level rate limit on this
 * API — a limit a self-hosted box never had, so nothing here needed caching
 * before. Everything on this page is read-only content a visitor cannot
 * change (services, case studies, products, journal entries), so a short
 * cache costs at most this many seconds of staleness after an edit in Odoo,
 * in exchange for cutting this site's request volume by roughly the number
 * of visits that land inside one window. See callJson2 in ./json2.ts.
 */
const CONTENT_CACHE_SECONDS = 60;

/** Resolves one of the names above against ODOO_API_KEY. See ./ids.ts. */
const resolveId = (model: string, nameField: string, name: string) =>
  resolveIdByName(model, nameField, name, ODOO_API_KEY);

function text($el: cheerio.Cheerio<AnyNode>): string {
  return $el.text().trim().replace(/\s+/g, " ");
}

function paragraphs($section: cheerio.Cheerio<AnyNode>): string {
  const parts: string[] = [];
  $section.find("p").each((_, p) => {
    parts.push(text(cheerio.load(p).root()));
  });
  return parts.join("\n\n");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Guards against the failure mode that hid the sanitiser bug: a fetch that
 * succeeds, returns records, and parses to nothing at all. Without this, a
 * structurally broken record renders as an empty section rather than as
 * the error it actually is. Throwing here means it surfaces the same way
 * any other Odoo failure does — as the calling route's error.tsx, with the
 * reason in the server log — instead of a page that looks fine but is
 * quietly missing content.
 */
function assertParsed(label: string, ok: boolean): void {
  if (!ok) {
    throw new Error(
      `[odoo] ${label}: records fetched but parsed empty — the ks-* markup ` +
        `is missing or was stripped. See src/lib/odoo/content.ts.`
    );
  }
}

// --------------------------------------------------------------- projects

function parseCaseStudy(
  html: string
): Omit<Project, "slug" | "title" | "subtitle" | "video" | "youtubeUrl"> {
  const $ = cheerio.load(html);

  const clientName = text($(".ks-meta .ks-client").first());
  const year = Number(text($(".ks-meta .ks-year").first())) || 0;
  const liveLink = text($(".ks-meta .ks-live-link").first());
  const services = text($(".ks-meta .ks-services").first())
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const overview = paragraphs($(".ks-overview").first());
  const problem = paragraphs($(".ks-problem").first());
  const solution = paragraphs($(".ks-solution").first());
  const result = paragraphs($(".ks-result").first());

  const images: ProjectImage[] = [];
  $(".ks-images img").each((_, img) => {
    const $img = $(img);
    images.push({ src: $img.attr("src") ?? "", alt: $img.attr("alt") ?? "" });
  });

  return {
    clientName,
    year,
    liveLink,
    services,
    shortOverview: overview,
    problem,
    solution,
    result,
    images,
  };
}

/**
 * All published project case studies, in Odoo id order.
 *
 * Wrapped in React's cache() so a single page render that calls this from
 * both generateMetadata and the page component (the detail page does)
 * shares one Odoo round trip instead of two. Only dedupes within a single
 * request — every new page view still fetches live.
 */
export const getCaseStudies = cache(async (): Promise<Project[]> => {
  const [blogId, tagId] = await Promise.all([
    resolveId("blog.blog", "name", PORTFOLIO_BLOG_NAME),
    resolveId("blog.tag", "name", CASE_STUDY_TAG_NAME),
  ]);
  const posts = await callJson2<
    Array<{ id: number; name: string; subtitle: string; content: string }>
  >(
    "blog.post",
    "search_read",
    {
      domain: [
        ["blog_id", "=", blogId],
        ["tag_ids", "in", [tagId]],
        ["is_published", "=", true],
      ],
      fields: ["id", "name", "subtitle", "content"],
      order: "id asc",
    },
    ODOO_API_KEY,
    CONTENT_CACHE_SECONDS
  );

  const projects = posts.map((post) => {
    const slug = slugify(post.name);
    const parsed = parseCaseStudy(post.content);
    return {
      slug,
      title: post.name,
      subtitle: post.subtitle,
      video: null,
      youtubeUrl: null,
      ...parsed,
    };
  });

  assertParsed(
    "getCaseStudies",
    projects.length > 0 && projects.every((p) => p.shortOverview.length > 0)
  );
  return projects;
});

export async function getCaseStudy(slug: string): Promise<Project | undefined> {
  const all = await getCaseStudies();
  return all.find((p) => p.slug === slug);
}

export async function getNextCaseStudy(slug: string): Promise<Project> {
  const all = await getCaseStudies();
  const i = all.findIndex((p) => p.slug === slug);
  return all[(i + 1) % all.length];
}

// --------------------------------------------------------------- services

export type OdooService = {
  id: number;
  number: string;
  title: string;
  description: string;
  images: string[];
  list: string[];
  stat: { value: string; label: string } | null;
  /** Product-only meta; empty on a service. See getProducts(). */
  kind: string;
  tagline: string;
  platform: string;
  /** The ks-meta label, if a record still carries one. Products ignore it
   *  in favour of Odoo's list_price — see getProducts(). */
  price: string;
  /** Odoo's own price field, and the currency it is in. */
  priceValue: number;
  currency: string;
  license: string;
  published: string;
  updated: string;
  tags: string[];
  linkLabel: string;
  link: string;
  maxQuantity: number;
  oncePerCustomer: boolean;
  sections: Array<{ heading: string; body: string; items: string[] }>;
};

function parseServiceDescription(html: string) {
  const $ = cheerio.load(html);
  const number = text($(".ks-number").first());
  const description = paragraphs($(".ks-description").first());

  const list: string[] = [];
  $(".ks-highlights li").each((_, li) => {
    list.push(text(cheerio.load(li).root()));
  });

  const images: string[] = [];
  $(".ks-images img").each((_, img) => {
    const src = $(img).attr("src");
    if (src) images.push(src);
  });

  const value = text($(".ks-stat .ks-stat-value").first());
  const stat = value ? { value, label: text($(".ks-stat .ks-stat-label").first()) } : null;

  // Only the products carry a ks-meta block; services parse these empty.
  const kind = text($(".ks-meta .ks-kind").first());
  const tagline = text($(".ks-meta .ks-tagline").first());
  const platform = text($(".ks-meta .ks-platform").first());
  const price = text($(".ks-meta .ks-price").first());
  const license = text($(".ks-meta .ks-license").first());
  const published = text($(".ks-meta .ks-published").first());
  const updated = text($(".ks-meta .ks-updated").first());
  const tags = text($(".ks-meta .ks-tags").first())
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const linkLabel = text($(".ks-meta .ks-link-label").first());
  const link = text($(".ks-meta .ks-live-link").first());

  // Purchase rules, with defaults that suit a digital good: you can hold
  // one, and you only ever need one. A product overrides either in Odoo by
  // adding <li class="ks-max-quantity">3</li> or
  // <li class="ks-once-per-customer">no</li> to its ks-meta list. Nothing
  // here is per-product in code, so a product added to Odoo tomorrow gets
  // the same rules without a deploy.
  const rawMaxQty = Number(text($(".ks-meta .ks-max-quantity").first()));
  const maxQuantity = Number.isInteger(rawMaxQty) && rawMaxQty > 0 ? rawMaxQty : 1;
  const oncePerCustomer =
    text($(".ks-meta .ks-once-per-customer").first()).toLowerCase() !== "no";

  // Long-form listing copy, same .ks-body shape the journal entries use:
  // a heading, prose, and optionally a list.
  const sections: Array<{ heading: string; body: string; items: string[] }> = [];
  $(".ks-body").each((_, el) => {
    const $el = $(el);
    const items: string[] = [];
    $el.find("li").each((_, li) => {
      items.push(text(cheerio.load(li).root()));
    });
    sections.push({
      heading: text($el.find("h3").first()),
      body: paragraphs($el),
      items,
    });
  });

  return {
    number,
    description,
    images,
    list,
    stat,
    kind,
    tagline,
    platform,
    price,
    license,
    published,
    updated,
    tags,
    linkLabel,
    link,
    maxQuantity,
    oncePerCustomer,
    sections,
  };
}

async function getProductsByCategory(
  label: string,
  categoryId: number
): Promise<OdooService[]> {
  const products = await callJson2<
    Array<{
      id: number;
      name: string;
      description: string;
      list_price: number;
      currency_id: [number, string] | false;
    }>
  >(
    "product.template",
    "search_read",
    {
      // list_price and currency_id are the point: the price a customer pays
      // is Odoo's price field, read live, not a string written into the
      // description. Change it in Odoo and the next request charges it.
      domain: [["categ_id", "=", categoryId]],
      fields: ["id", "name", "description", "list_price", "currency_id"],
      order: "id asc",
    },
    ODOO_API_KEY,
    CONTENT_CACHE_SECONDS
  );

  const parsed = products.map((p) => ({
    id: p.id,
    title: p.name,
    priceValue: p.list_price ?? 0,
    currency: Array.isArray(p.currency_id) ? p.currency_id[1] : "",
    ...parseServiceDescription(p.description),
  }));

  // Only the description is required of every record: .ks-number is a
  // services-list affordance the standalone products (ReplyFrame) don't
  // carry, and .ks-stat is optional throughout.
  assertParsed(label, parsed.length > 0 && parsed.every((s) => s.description.length > 0));

  // Odoo's own record id is not a reliable display order — the same
  // reason ids.ts resolves ids by name instead of trusting one database's
  // numbering: a migration has no obligation to hand out ids in the order
  // records were originally created, and search_read's "id asc" just
  // happened to read as alphabetical order once this ran against a
  // different Odoo instance. Each service already carries its own "01."
  // style number in the description (.ks-number) — that's the order this
  // list is actually meant to show, so sort by it. A record with no
  // number (the standalone products, which don't carry .ks-number) keeps
  // its place in whatever order search_read returned.
  return parsed
    .map((s, i) => ({ s, i, n: leadingNumber(s.number) }))
    .sort((a, b) => {
      if (a.n === null || b.n === null) {
        if (a.n === null && b.n === null) return a.i - b.i;
        return a.n === null ? 1 : -1;
      }
      return a.n - b.n;
    })
    .map(({ s }) => s);
}

/** "01." -> 1, "2" -> 2, "" or unparseable -> null. */
function leadingNumber(label: string): number | null {
  const match = /^(\d+)/.exec(label.trim());
  return match ? Number(match[1]) : null;
}

/** The real service offerings, in their Odoo sequence. */
export async function getServices(): Promise<OdooService[]> {
  const categoryId = await resolveId("product.category", "name", SERVICES_CATEGORY_NAME);
  return getProductsByCategory("getServices", categoryId);
}

// --------------------------------------------------------------- products

/**
 * Where the browser fetches an Odoo binary. Odoo only serves /web/image/
 * publicly for published records, and these products are not published on
 * the Odoo website — so images go through this site's own proxy, which
 * reads them with the server-side key. See app/api/odoo/media/route.ts.
 */
/**
 * A price as a customer reads it. Zero is "Free" — not "0.00 KES", which
 * reads like a broken page rather than a gift.
 */
function formatPrice(value: number, currency: string): string {
  if (!value || value <= 0) return "Free";
  const amount = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return currency ? `${currency} ${amount}` : amount;
}

type TaxRow = { id: number; amount: number; amount_type: string; price_include: boolean };

/**
 * A product's list_price is what checkout charges before tax — Paystack
 * charges Odoo's amount_total, which is list_price plus whatever
 * product.template.taxes_id adds. Showing list_price alone anywhere a
 * customer can see it is exactly how a price quietly grows between the
 * product page and the payment modal, so every display price folds this
 * in instead.
 *
 * Only percentage taxes not already included in list_price are summed —
 * the one case this store actually has (Kenya's 16% VAT). A fixed-amount
 * tax, a tax group, or one already included in the price is left out of
 * the number rather than risk stating a wrong one.
 */
function taxBreakdown(taxIds: number[], taxes: TaxRow[]): { rate: number; label: string } {
  const applicable = taxIds
    .map((id) => taxes.find((t) => t.id === id))
    .filter(
      (t): t is TaxRow => Boolean(t) && t!.amount_type === "percent" && !t!.price_include
    );

  const rate = applicable.reduce((sum, t) => sum + t.amount, 0);
  return { rate, label: rate > 0 ? `${rate}% tax` : "" };
}

function mediaUrl(model: string, id: number, field = "image_1920"): string {
  return `/api/odoo/media?model=${encodeURIComponent(model)}&id=${id}&field=${field}`;
}

/**
 * Shipped products — ReplyFrame and the Bernaum template — as distinct
 * from the client services above. They share the product.template model
 * and the same ks-* body, and add a ks-meta block: what kind of thing it
 * is, where it lives, what it costs and where to get it.
 *
 * Price is parsed even though both products are free today, so the day one
 * isn't, the page says so without a code change (and can point at Odoo's
 * own shop instead of the marketplace).
 */
export const getProducts = cache(async (): Promise<Product[]> => {
  const categoryId = await resolveId("product.category", "name", PRODUCTS_CATEGORY_NAME);
  const parsed = await getProductsByCategory("getProducts", categoryId);
  const templateIds = parsed.map((p) => p.id);

  // Four things live outside the description field and have to be asked
  // for separately: the sellable variant (an order line takes a
  // product.product, not a template), the eCommerce Media gallery, any
  // file attached to the product — the thing a buyer is handed — and
  // which taxes apply, since list_price alone is not what checkout charges.
  const [variants, media, attachments, taxLinks] = await Promise.all([
    callJson2<Array<{ id: number; product_tmpl_id: [number, string]; sale_ok: boolean }>>(
      "product.product",
      "search_read",
      {
        domain: [["product_tmpl_id", "in", templateIds]],
        fields: ["id", "product_tmpl_id", "sale_ok"],
      },
      ODOO_API_KEY,
      CONTENT_CACHE_SECONDS
    ),
    callJson2<Array<{ id: number; name: string; product_tmpl_id: [number, string] }>>(
      "product.image",
      "search_read",
      {
        domain: [["product_tmpl_id", "in", templateIds]],
        fields: ["id", "name", "product_tmpl_id"],
        order: "sequence asc, id asc",
      },
      ODOO_API_KEY,
      CONTENT_CACHE_SECONDS
    ),
    callJson2<
      Array<{ id: number; name: string; res_id: number; mimetype: string; file_size: number }>
    >(
      "ir.attachment",
      "search_read",
      {
        domain: [
          ["res_model", "=", "product.template"],
          ["res_id", "in", templateIds],
          ["mimetype", "not like", "image/"],
        ],
        fields: ["id", "name", "res_id", "mimetype", "file_size"],
        order: "id asc",
      },
      ODOO_API_KEY,
      CONTENT_CACHE_SECONDS
    ),
    callJson2<Array<{ id: number; taxes_id: number[] }>>(
      "product.template",
      "search_read",
      { domain: [["id", "in", templateIds]], fields: ["id", "taxes_id"] },
      ODOO_API_KEY,
      CONTENT_CACHE_SECONDS
    ),
  ]);

  const allTaxIds = Array.from(new Set(taxLinks.flatMap((t) => t.taxes_id)));
  const taxes = allTaxIds.length
    ? await callJson2<TaxRow[]>(
        "account.tax",
        "read",
        { ids: allTaxIds, fields: ["id", "amount", "amount_type", "price_include"] },
        ODOO_API_KEY,
        CONTENT_CACHE_SECONDS
      )
    : [];

  const products = parsed.map((p) => {
    const variant = variants.find((v) => v.product_tmpl_id?.[0] === p.id);
    const gallery = media.filter((m) => m.product_tmpl_id?.[0] === p.id);
    const file = attachments.find((a) => a.res_id === p.id);
    const taxIds = taxLinks.find((t) => t.id === p.id)?.taxes_id ?? [];
    const { rate: taxRate, label: taxLabel } = taxBreakdown(taxIds, taxes);
    const priceInclTax = Math.round(p.priceValue * (1 + taxRate / 100) * 100) / 100;

    return {
      slug: slugify(p.title),
      title: p.title,
      templateId: p.id,
      // The variant is what a sale.order line points at. Falling back to the
      // template id would silently create an order against the wrong record,
      // so a product with no variant carries 0 and the checkout refuses it.
      productId: variant?.id ?? 0,
      kind: p.kind,
      tagline: p.tagline,
      platform: p.platform,
      price: p.price,
      license: p.license,
      published: p.published,
      updated: p.updated,
      tags: p.tags,
      linkLabel: p.linkLabel || "View on the Marketplace",
      link: p.link,
      priceValue: p.priceValue,
      currency: p.currency,
      // Tax-inclusive: the number Paystack actually charges, so it's the
      // one shown wherever a customer reads a price.
      priceLabel: formatPrice(priceInclTax, p.currency),
      priceInclTax,
      taxRate,
      taxLabel,
      // Odoo's own "Can be Sold" decides whether a product can be ordered
      // here at all — untick it there and the product still has a page and
      // a marketplace link, but no Add to Cart.
      purchasable: Boolean(variant?.sale_ok) && variant!.id > 0,
      maxQuantity: p.maxQuantity,
      oncePerCustomer: p.oncePerCustomer,
      description: p.description,
      highlights: p.list,
      stat: p.stat,
      sections: p.sections,
      // Media comes from Odoo's own eCommerce Media, served through the
      // image proxy so a private record still renders without the API key
      // ever reaching the browser.
      images: gallery.map((m) => ({
        src: mediaUrl("product.image", m.id),
        alt: `${p.title} — ${m.name.replace(/\.[a-z0-9]+$/i, "")}`,
      })),
      // Bernaum has a remix-link PDF attached; ReplyFrame has none, and is
      // delivered by the marketplace link alone.
      deliverable: file
        ? { attachmentId: file.id, name: file.name, sizeBytes: file.file_size }
        : null,
    };
  });

  // A product without somewhere to get it is not a product page.
  assertParsed("getProducts", products.every((p) => p.link.length > 0));
  return products;
});

export async function getProduct(slug: string): Promise<Product | undefined> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug);
}

// ----------------------------------------------------------------- journal

function parseJournalPost(name: string, html: string): JournalPost {
  const $ = cheerio.load(html);
  const intro = paragraphs($(".ks-intro").first());

  const sections: { heading: string; body: string }[] = [];
  $(".ks-body").each((_, el) => {
    const $el = $(el);
    sections.push({
      heading: text($el.find("h3").first()),
      body: paragraphs($el),
    });
  });

  return {
    slug: slugify(name),
    title: name,
    category: text($(".ks-meta .ks-category").first()),
    date: text($(".ks-meta .ks-date").first()),
    postedBy: text($(".ks-meta .ks-author").first()),
    intro,
    sections,
  };
}

/** All published journal entries, oldest first (matches the source order). */
export async function getJournalPosts(): Promise<JournalPost[]> {
  const blogId = await resolveId("blog.blog", "name", JOURNAL_BLOG_NAME);
  const posts = await callJson2<Array<{ id: number; name: string; content: string }>>(
    "blog.post",
    "search_read",
    {
      domain: [
        ["blog_id", "=", blogId],
        ["is_published", "=", true],
      ],
      fields: ["id", "name", "content"],
      order: "post_date asc",
    },
    ODOO_API_KEY,
    CONTENT_CACHE_SECONDS
  );

  const parsed = posts.map((p) => parseJournalPost(p.name, p.content));
  assertParsed(
    "getJournalPosts",
    parsed.length > 0 && parsed.every((p) => p.intro.length > 0 && p.sections.length > 0)
  );
  return parsed;
}

export async function getJournalPost(slug: string): Promise<JournalPost | undefined> {
  const all = await getJournalPosts();
  return all.find((p) => p.slug === slug);
}
