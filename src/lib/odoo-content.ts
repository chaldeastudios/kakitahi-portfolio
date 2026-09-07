import "server-only";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { odooSearchRead } from "./odoo";
import type { Project, ProjectImage } from "./projects";

/**
 * Odoo-backed content fetchers.
 *
 * NOT WIRED UP YET — see README.md "Odoo integration". Nothing in the app
 * calls these yet; src/lib/content.ts and src/lib/projects.ts remain the
 * live data source until a working Odoo connection is confirmed.
 *
 * Every blog.post / product.template record this reads was written with a
 * predictable HTML shape: a sequence of <div data-section="..."> blocks
 * carrying the same fields the static datasets use, so the parsing here is
 * a straight extraction rather than free-text scraping. That shape is also
 * exactly what a person editing the record in Odoo's own rich-text editor
 * sees and can safely add to.
 */

const CASE_STUDY_TAG_ID = 1; // blog.tag "Case Study"
const PORTFOLIO_BLOG_ID = 2; // blog.blog "Portfolio"
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

/** Parse one project case study's `content` HTML into a Project record. */
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

/** All published project case studies, newest first. */
export async function getCaseStudies(): Promise<Project[]> {
  const posts = await odooSearchRead<{
    id: number;
    name: string;
    subtitle: string;
    content: string;
    website_url: string;
  }>(
    "blog.post",
    [
      ["blog_id", "=", PORTFOLIO_BLOG_ID],
      ["tag_ids", "in", [CASE_STUDY_TAG_ID]],
      ["is_published", "=", true],
    ],
    ["name", "subtitle", "content", "website_url"],
    { order: "id asc" }
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
}

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

function parseServiceDescription(html: string): {
  number: string;
  description: string;
  images: string[];
  list: string[];
  stat: { value: string; label: string } | null;
} {
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

/** The four real service offerings, in their Odoo sequence. */
export async function getServices(): Promise<OdooService[]> {
  const products = await odooSearchRead<{
    id: number;
    name: string;
    description: string;
  }>(
    "product.template",
    [["categ_id", "=", SERVICES_CATEGORY_ID]],
    ["name", "description"],
    { order: "id asc" }
  );

  return products.map((p) => ({
    id: p.id,
    title: p.name,
    ...parseServiceDescription(p.description),
  }));
}

/** The ReplyFrame product record (the "Products" line, distinct from services). */
export async function getProducts(): Promise<OdooService[]> {
  const products = await odooSearchRead<{
    id: number;
    name: string;
    description: string;
  }>(
    "product.template",
    [["categ_id", "=", PRODUCTS_CATEGORY_ID]],
    ["name", "description"],
    { order: "id asc" }
  );

  return products.map((p) => ({
    id: p.id,
    title: p.name,
    ...parseServiceDescription(p.description),
  }));
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
  const posts = await odooSearchRead<{ id: number; name: string; content: string }>(
    "blog.post",
    [
      ["blog_id", "=", 1], // "Our blog"
      ["is_published", "=", true],
    ],
    ["name", "content"],
    { order: "post_date asc" }
  );

  return posts.map((p) => parseJournalPost(p.name, p.content));
}

export async function getJournalPost(slug: string): Promise<JournalPost | undefined> {
  const all = await getJournalPosts();
  return all.find((p) => p.slug === slug);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
