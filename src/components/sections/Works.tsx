import Button from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import ProjectCard from "@/components/ui/ProjectCard";
import { WORKS } from "@/lib/content";

/**
 * Works — Framer node "Works" (lZbF1iErZ). 2-column grid, rows fit.
 *
 *  Heading (l0OzAzC5T)  minHeight 300px, bg /Light Grey,
 *                       border-top 1px /Border, padding 24px,
 *                       gridFillHeight false -> sticky "Works" (Heading 2)
 *  WorksDescription (CbyxEiG4l)  h 314px, nested 2-column grid
 *    Description (plxERtL8o) bg /White, border 1px /Border, padding 24px,
 *                            vertical space-between -> Body Normal + Button
 *    Slogan (PYbt14H_B)      bg /Yellow, border 1px /Border, padding 24px,
 *                            justify end -> Heading 5
 *  Projects (SPDqi3Js_)  2x2 grid, gridColumnSpan 2 -> Project Cards
 */
export default function Works() {
  return (
    <section id="works" className="grid w-full grid-cols-1 tablet:grid-cols-2">
      {/* Heading */}
      <div className="flex min-h-[300px] flex-col items-start self-start overflow-hidden border-t border-border bg-lightgrey p-6">
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
      <RevealGroup
        className="grid grid-cols-1 tablet:col-span-2 tablet:grid-cols-2"
        stagger={0.1}
      >
        {WORKS.projects.map((p) => (
          <RevealItem key={p.slug} className="flex">
            <ProjectCard
              title={p.title}
              subtitle={p.subtitle}
              image={p.image}
              href={`/projects/${p.slug}`}
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
