import PageTemplate from "@/components/layout/PageTemplate";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Stats from "@/components/sections/Stats";
import Works from "@/components/sections/Works";
import Services from "@/components/sections/Services";
import Testimonials from "@/components/sections/Testimonials";
import Cta from "@/components/sections/Cta";
import { getCaseStudies, getServices } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PROJECTS } from "@/lib/projects";
import { SERVICES, type ServiceItem } from "@/lib/content";

/**
 * Home ("/") — section order transcribed from the Framer page's Desktop
 * frame (WQLkyLRf1): Hero, About, Stats, Works, Services, Testmonials, Cta.
 * No section is omitted or reordered.
 *
 * Works' project grid and the Services list are read live from Odoo (see
 * README "Odoo integration"), each falling back to the static dataset if
 * the live fetch fails for any reason — see src/lib/odoo/safe.ts for why.
 * A no-store fetch inside those calls opts this route out of static
 * rendering; see the README for that trade-off.
 */
export default async function Home() {
  const [projects, services] = await Promise.all([
    withOdooFallback("getCaseStudies", getCaseStudies, PROJECTS),
    withOdooFallback<readonly ServiceItem[]>("getServices", getServices, SERVICES.items),
  ]);

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
