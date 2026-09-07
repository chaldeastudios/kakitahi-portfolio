import "server-only";
import { cache } from "react";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { ODOO_API_KEY } from "./config";
import { callJson2 } from "./json2";
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

const CASE_STUDY_TAG_ID = 1; // blog.tag "Case Study"
const PORTFOLIO_BLOG_ID = 2; // blog.blog "Portfolio"
const JOURNAL_BLOG_ID = 1; // blog.blog "Our blog"
const SERVICES_CATEGORY_ID = 7; // product.category "Chaldea Studios Services"
const PRODUCTS_CATEGORY_ID = 8; // product.category "Chaldea Studios Products"

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
 * succeeds, returns records, and parses to nothing at all. Without this,
 * withOdooFallback sees no error and renders empty sections. Throwing means
 * a structurally broken record falls back to the static dataset — and says
 * why in the server log — instead of blanking a section of the live site.
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
  const posts = await callJson2<
    Array<{ id: number; name: string; subtitle: string; content: string }>
  >(
    "blog.post",
    "search_read",
    {
      domain: [
        ["blog_id", "=", PORTFOLIO_BLOG_ID],
        ["tag_ids", "in", [CASE_STUDY_TAG_ID]],
        ["is_published", "=", true],
      ],
      fields: ["id", "name", "subtitle", "content"],
      order: "id asc",
    },
    ODOO_API_KEY
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
  price: string;
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
  const products = await callJson2<Array<{ id: number; name: string; description: string }>>(
    "product.template",
    "search_read",
    {
      domain: [["categ_id", "=", categoryId]],
      fields: ["id", "name", "description"],
      order: "id asc",
    },
    ODOO_API_KEY
  );

  const parsed = products.map((p) => ({
    id: p.id,
    title: p.name,
    ...parseServiceDescription(p.description),
  }));

  // Only the description is required of every record: .ks-number is a
  // services-list affordance the standalone products (ReplyFrame) don't
  // carry, and .ks-stat is optional throughout.
  assertParsed(label, parsed.length > 0 && parsed.every((s) => s.description.length > 0));
  return parsed;
}

/** The real service offerings, in their Odoo sequence. */
export async function getServices(): Promise<OdooService[]> {
  return getProductsByCategory("getServices", SERVICES_CATEGORY_ID);
}

// --------------------------------------------------------------- products

/**
 * Where the browser fetches an Odoo binary. Odoo only serves /web/image/
 * publicly for published records, and these products are not published on
 * the Odoo website — so images go through this site's own proxy, which
 * reads them with the server-side key. See app/api/odoo/media/route.ts.
 */
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
  const parsed = await getProductsByCategory("getProducts", PRODUCTS_CATEGORY_ID);
  const templateIds = parsed.map((p) => p.id);

  // Three things live outside the description field and have to be asked
  // for separately: the sellable variant (an order line takes a
  // product.product, not a template), the eCommerce Media gallery, and any
  // file attached to the product — the thing a buyer is handed.
  const [variants, media, attachments] = await Promise.all([
    callJson2<Array<{ id: number; product_tmpl_id: [number, string]; sale_ok: boolean }>>(
      "product.product",
      "search_read",
      {
        domain: [["product_tmpl_id", "in", templateIds]],
        fields: ["id", "product_tmpl_id", "sale_ok"],
      },
      ODOO_API_KEY
    ),
    callJson2<Array<{ id: number; name: string; product_tmpl_id: [number, string] }>>(
      "product.image",
      "search_read",
      {
        domain: [["product_tmpl_id", "in", templateIds]],
        fields: ["id", "name", "product_tmpl_id"],
        order: "sequence asc, id asc",
      },
      ODOO_API_KEY
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
      ODOO_API_KEY
    ),
  ]);

  const products = parsed.map((p) => {
    const variant = variants.find((v) => v.product_tmpl_id?.[0] === p.id);
    const gallery = media.filter((m) => m.product_tmpl_id?.[0] === p.id);
    const file = attachments.find((a) => a.res_id === p.id);

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
  const posts = await callJson2<Array<{ id: number; name: string; content: string }>>(
    "blog.post",
    "search_read",
    {
      domain: [
        ["blog_id", "=", JOURNAL_BLOG_ID],
        ["is_published", "=", true],
      ],
      fields: ["id", "name", "content"],
      order: "post_date asc",
    },
    ODOO_API_KEY
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
