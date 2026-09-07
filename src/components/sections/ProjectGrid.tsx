import ProjectCard from "@/components/ui/ProjectCard";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { PROJECTS, type Project } from "@/lib/projects";

/**
 * ProjectGrid — the Framer "Projects" grid (SPDqi3Js_): a 2-column,
 * 2-row grid of Project Cards that spans both columns of its parent.
 *
 * Shared by the home page's Works section and the /projects page, and
 * driven by the projects dataset so both stay in step.
 */
export default function ProjectGrid({
  projects = PROJECTS,
  className = "",
}: {
  projects?: Project[];
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
