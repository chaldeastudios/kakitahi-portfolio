import PageTemplate from "@/components/layout/PageTemplate";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Stats from "@/components/sections/Stats";
import Works from "@/components/sections/Works";
import Services from "@/components/sections/Services";
import Testimonials from "@/components/sections/Testimonials";
import Cta from "@/components/sections/Cta";

/**
 * Home ("/") — section order transcribed from the Framer page's Desktop
 * frame (WQLkyLRf1): Hero, About, Stats, Works, Services, Testmonials, Cta.
 * No section is omitted or reordered.
 */
export default function Home() {
  return (
    <PageTemplate>
      <Hero />
      <About />
      <Stats />
      <Works />
      <Services />
      <Testimonials />
      <Cta />
    </PageTemplate>
  );
}
