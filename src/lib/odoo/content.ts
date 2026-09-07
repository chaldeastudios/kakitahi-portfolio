import "server-only";
import { cache } from "react";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { ODOO_API_KEY } from "./config";
import { callJson2 } from "./json2";
import type { Project, ProjectImage } from "@/lib/projects";

/**
 * Odoo-backed content fetchers — read-only, via the JSON-2 client in
 * ./json2.ts. Called fresh on every request; nothing here is cached.
 *
 * Every blog.post / product.template record this reads was written with a
 * predictable HTML shape: a sequence of <div data-section="..."> blocks
 * carrying the same fields the static datasets (src/lib/content.ts,
 * src/lib/projects.ts) use, so the parsing here is a straight extraction
 * rather than free-text scraping. That shape is also exactly what a
 * person editing the record in Odoo's own rich-text editor sees and can
 * safely add to.
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

// --------------------------------------------------------------- projects

function parseCaseStudy(
  html: string
): Omit<Project, "slug" | "title" | "subtitle" | "video" | "youtubeUrl"> {
  const $ = cheerio.load(html);

  const meta = $('[data-section="meta"]').first();
  const clientName = meta.attr("data-client") ?? "";
  const year = Number(meta.attr("data-year") ?? 0);
  const liveLink = meta.attr("data-live-link") ?? "";
  const services = (meta.attr("data-services") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const overview = paragraphs($('[data-section="overview"]').first());
  const problem = paragraphs($('[data-section="problem"]').first());
  const solution = paragraphs($('[data-section="solution"]').first());
  const result = paragraphs($('[data-section="result"]').first());

  const images: ProjectImage[] = [];
  $('[data-section="images"] img').each((_, img) => {
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

  return posts.map((post) => {
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
  const number = text($('[data-section="number"]').first());
  const description = paragraphs($('[data-section="description"]').first());

  const list: string[] = [];
  $('[data-section="highlights"] li').each((_, li) => {
    list.push(text(cheerio.load(li).root()));
  });

  const images: string[] = [];
  $('[data-section="images"] img').each((_, img) => {
    const src = $(img).attr("src");
    if (src) images.push(src);
  });

  const statEl = $('[data-section="stat"]').first();
  const stat =
    statEl.length && statEl.attr("data-value")
      ? { value: statEl.attr("data-value") ?? "", label: statEl.attr("data-label") ?? "" }
      : null;

  return { number, description, images, list, stat };
}

async function getProductsByCategory(categoryId: number): Promise<OdooService[]> {
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

  return products.map((p) => ({
    id: p.id,
    title: p.name,
    ...parseServiceDescription(p.description),
  }));
}

/** The four real service offerings, in their Odoo sequence. */
export async function getServices(): Promise<OdooService[]> {
  return getProductsByCategory(SERVICES_CATEGORY_ID);
}

/** Shipped products (ReplyFrame) — distinct from client services. */
export async function getProducts(): Promise<OdooService[]> {
  return getProductsByCategory(PRODUCTS_CATEGORY_ID);
}

// ----------------------------------------------------------------- journal

export type JournalPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  postedBy: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

function parseJournalPost(name: string, html: string): JournalPost {
  const $ = cheerio.load(html);
  const meta = $('[data-section="meta"]').first();
  const intro = paragraphs($('[data-section="intro"]').first());

  const sections: { heading: string; body: string }[] = [];
  $('[data-section="body"]').each((_, el) => {
    const $el = $(el);
    sections.push({
      heading: $el.attr("data-heading") ?? "",
      body: paragraphs($el),
    });
  });

  return {
    slug: slugify(name),
    title: name,
    category: meta.attr("data-category") ?? "",
    date: meta.attr("data-date") ?? "",
    postedBy: meta.attr("data-posted-by") ?? "",
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

  return posts.map((p) => parseJournalPost(p.name, p.content));
}

export async function getJournalPost(slug: string): Promise<JournalPost | undefined> {
  const all = await getJournalPosts();
  return all.find((p) => p.slug === slug);
}
