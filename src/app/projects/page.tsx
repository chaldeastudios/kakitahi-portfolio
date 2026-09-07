import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import ProjectGrid from "@/components/sections/ProjectGrid";
import Testimonials from "@/components/sections/Testimonials";
import Cta from "@/components/sections/Cta";

/**
 * /projects — Framer page ohMtTqn_g, Desktop frame jtvXP_V8A.
 *
 *   frame  backgroundColor /White, overflow clip, stack vertical,
 *          centred, gap 40px, padding 160px 20px
 *     Hero        (o_gdO0CcF) 2-column grid -> "Projects" (Heading 1)
 *     Projects    (EHcuJxcND) 2x2 grid of Project Cards
 *     Testmonials (ehdN1h4PP) the shared carousel
 *     Cta         (ECWjKnVyA) 100vh, the shared closing panel
 */
export const metadata: Metadata = {
  title: "Projects — Paige Holden",
  description:
    "Selected product design work: Vantage, Shelt, Contra and Folio.",
};

export default function ProjectsPage() {
  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title="Projects" />
        <ProjectGrid className="w-full" />
        <div className="w-full">
          <Testimonials />
        </div>
        <div className="w-full">
          <Cta />
        </div>
      </div>
    </PageTemplate>
  );
}
