import { connection } from "next/server";
import PageTemplate from "@/components/layout/PageTemplate";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Stats from "@/components/sections/Stats";
import Works from "@/components/sections/Works";
import Services from "@/components/sections/Services";
import Testimonials from "@/components/sections/Testimonials";
import Cta from "@/components/sections/Cta";
import { getCaseStudies, getServices } from "@/lib/odoo/content";

/**
 * Home ("/") — section order transcribed from the Framer page's Desktop
 * frame (WQLkyLRf1): Hero, About, Stats, Works, Services, Testmonials, Cta.
 * No section is omitted or reordered.
 *
 * Works' project grid and the Services list are read live from Odoo (see
 * README "Odoo integration") and cached briefly there (see
 * CONTENT_CACHE_SECONDS in src/lib/odoo/content.ts) rather than served from
 * a static fallback: a failed fetch surfaces as this route's error.tsx
 * instead of silently swapping in stale placeholder content.
 *
 * connection() excludes this page from build-time prerendering — without
 * it, `next build` tries to fetch Odoo at build time to produce a static
 * shell, and a build run without Odoo reachable (no env vars, a network
 * hiccup) fails outright instead of just rendering dynamically once
 * deployed. The Odoo fetches below still cache themselves (their own
 * next.revalidate), independent of this.
 */
export default async function Home() {
  await connection();
  const [projects, services] = await Promise.all([getCaseStudies(), getServices()]);

  return (
    <PageTemplate>
      <Hero />
      <About />
      <Stats />
      <Works projects={projects} />
      <Services items={services} />
      <Testimonials />
      <Cta />
    </PageTemplate>
  );
}
