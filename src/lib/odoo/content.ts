import "server-only";
import { cache } from "react";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { ODOO_API_KEY } from "./config";
import { callJson2 } from "./json2";
import type { Project, ProjectImage } from "@/lib/projects";
import type { JournalPost } from "@/lib/journal";

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

  return { number, description, images, list, stat };
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

/** Shipped products (ReplyFrame) — distinct from client services. */
export async function getProducts(): Promise<OdooService[]> {
  return getProductsByCategory("getProducts", PRODUCTS_CATEGORY_ID);
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
