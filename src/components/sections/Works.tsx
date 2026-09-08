import Button from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import ProjectGrid from "./ProjectGrid";
import { WORKS } from "@/lib/content";
import type { Project } from "@/lib/projects";

/**
 * Works — Framer node "Works" (lZbF1iErZ). 2-column grid, rows fit.
 *
 *  Heading (l0OzAzC5T)  minHeight 300px, bg /Light Grey, padding 24px,
 *                       sticky "Works" (Heading 2). The Framer spec calls
 *                       this border-top only with gridFillHeight false, but
 *                       transcribed as `self-start` that left the taller
 *                       WorksDescription row exposing the page's pattern
 *                       ground in the gap below it — this stretches to fill
 *                       the row instead (which is what makes the sticky
 *                       title have anywhere to stick within) and takes a
 *                       full border so it reads as a card on every side.
 *  WorksDescription (CbyxEiG4l)  h 314px, nested 2-column grid
 *    Description (plxERtL8o) bg /White, border 1px /Border, padding 24px,
 *                            vertical space-between -> Body Normal + Button
 *    Slogan (PYbt14H_B)      bg /Yellow, border 1px /Border, padding 24px,
 *                            justify end -> Heading 5
 *  Projects (SPDqi3Js_)  2x2 grid, gridColumnSpan 2 -> Project Cards
 *
 * `projects` is supplied live from Odoo (src/lib/odoo/content.ts
 * getCaseStudies()) by the page — see app/page.tsx. No static fallback: a
 * failed fetch is this route's error.tsx, not a stale placeholder grid.
 */
export default function Works({ projects }: { projects: Project[] }) {
  return (
    <section id="works" className="grid w-full grid-cols-1 tablet:grid-cols-2">
      {/* Heading */}
      <div className="flex min-h-[300px] flex-col items-start overflow-hidden border border-border bg-lightgrey p-6">
        <div className="flex w-full items-center justify-center tablet:sticky tablet:top-12">
          <Reveal className="z-[1] w-full" y={28} duration={0.8}>
            <h2 className="t-h2 w-full">{WORKS.heading}</h2>
          </Reveal>
        </div>
      </div>

      {/* WorksDescription */}
      <div className="grid grid-cols-1 desktop:h-[314px] desktop:grid-cols-2">
        <div className="flex h-full flex-col items-start justify-between gap-[10px] overflow-hidden border border-border bg-white p-6">
          <Reveal className="w-full">
            <p className="t-body w-full">{WORKS.description}</p>
          </Reveal>
          <Button
            label={WORKS.cta.label}
            href={WORKS.cta.href}
            newTab={WORKS.cta.newTab}
            fullWidth
          />
        </div>

        <div className="flex h-full flex-col items-start justify-end gap-[10px] overflow-hidden border border-border bg-yellow p-6">
          <Reveal className="w-full">
            <p className="t-h5 w-full">{WORKS.slogan}</p>
          </Reveal>
        </div>
      </div>

      {/* Projects — spans both columns */}
      <ProjectGrid projects={projects} className="tablet:col-span-2" />

    </section>
  );
}
