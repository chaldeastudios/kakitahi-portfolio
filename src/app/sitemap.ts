import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { SITE_URL } from "@/lib/odoo/config";
import { getCaseStudies, getJournalPosts, getProducts } from "@/lib/odoo/content";

/**
 * /sitemap.xml — Next's built-in sitemap convention (this file, run
 * through Next's own renderer, is the whole implementation; there is no
 * route.ts). Static marketing pages plus every live case study, journal
 * entry and product slug, read fresh from Odoo on each request the same
 * way the pages themselves do — a case study added in Odoo appears here
 * with no deploy, the same "Odoo is the source of truth" rule the rest of
 * the site already follows (see the Odoo integration section of README.md).
 *
 * Deliberately excludes anything not meant for a search result: /cart,
 * /checkout, /account*, /admin, /status, and every /api route.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Excludes this route from build-time prerendering — same reason
  // app/page.tsx and the listing pages call this: Odoo isn't reachable at
  // build time, only per-request in a deployed environment.
  await connection();

  const [projects, journalPosts, products] = await Promise.all([
    getCaseStudies(),
    getJournalPosts(),
    getProducts(),
  ]);

  const staticRoutes = ["/", "/projects", "/journal", "/products", "/contact"];

  return [
    ...staticRoutes.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${p.slug}` })),
    ...journalPosts.map((p) => ({ url: `${SITE_URL}/journal/${p.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}` })),
  ];
}
