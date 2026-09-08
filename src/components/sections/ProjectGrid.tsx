import ProjectCard from "@/components/ui/ProjectCard";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import type { Project } from "@/lib/projects";

/**
 * ProjectGrid — the Framer "Projects" grid (SPDqi3Js_): a 2-column,
 * 2-row grid of Project Cards that spans both columns of its parent.
 *
 * Shared by the home page's Works section and the /projects page, both of
 * which supply `projects` live from Odoo. No static fallback: a failed
 * fetch is the route's error.tsx, not a stale placeholder grid.
 */
export default function ProjectGrid({
  projects,
  className = "",
}: {
  projects: Project[];
  className?: string;
}) {
  return (
    <RevealGroup
      className={`grid grid-cols-1 tablet:grid-cols-2 ${className}`}
      stagger={0.1}
    >
      {projects.map((p) => (
        <RevealItem key={p.slug} className="flex">
          <ProjectCard
            title={p.title}
            subtitle={p.subtitle}
            image={p.images[0]?.src}
            href={`/projects/${p.slug}`}
          />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
