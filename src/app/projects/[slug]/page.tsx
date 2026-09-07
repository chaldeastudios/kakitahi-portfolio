import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import Cta from "@/components/sections/Cta";
import ProjectVideos from "@/components/ui/ProjectVideos";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/icons";
import { PROJECTS, getProject, getNextProject } from "@/lib/projects";

/**
 * /projects/[slug] — Framer page yYdS2aTdj, Desktop frame ifiBoypAh.
 *
 *   frame  backgroundColor /White, overflow clip, stack vertical,
 *          centred, gap 160px, padding 140px 20px
 *     Hero    (VtIQJn1I8) 2-column grid
 *       Left  sticky 380px title panel (see PageHero)
 *       Right 380px hairline spacer, then
 *         Overview (kgOblyA5S) minHeight 340, /Yellow,
 *                  border 0 0 1px 1px, gap 80, padding 24 -> Heading 4
 *         Meta     (qRY1YUIh5) minHeight 340, /Black, gap 80, padding 24,
 *                  space-between; four rows, each border-bottom 1px
 *                  /Border, padding-bottom 14, horizontal space-between,
 *                  gap 96: Client, Year, Services Provided (maxWidth
 *                  300px) and Live Link -> "Visit Website" + an 18x19
 *                  white arrow-up-right, opening in a new tab
 *     Videos3 (GsBvva0lJ) the upload and the YouTube player
 *     Image1  (JUoa8cnzk) 100% x 600px
 *     Grid    (KD9JM_JuU) 3-column
 *       sticky 1-col/3-row stack (P4JF8r68R, top 48px):
 *         Problem  /Off-white + /Yellow marker, CMS/Body L (Black)
 *         Solution /Black     + /White  marker, CMS/Body L (White)
 *         Result   /Yellow    + /Light-Black marker, CMS/Body L (Black)
 *         each 1px right border /Border, minHeight 300, gap 40, padding 24
 *       Image23 (qA9PLvFtI) spans 2 columns -> Images 2, 3 and 4 stacked
 *     Grid    (Czd_bq7z8) 100% x 600px, 2-column -> Images 5 and 6
 *     Image7  (euKa_7X6H) 100% x 600px
 *     Next    (VCGQoePZm) /Off-white, padding 80px -> "Next Project: ..."
 *             (Body L), linking to the next entry
 *     Cta     (laNB0WumW) 100vh, the shared closing panel
 */

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found — Paige Holden" };
  return {
    title: `${project.title} — Paige Holden`,
    description: project.shortOverview,
  };
}

/** One row of the black meta panel. */
function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-6 overflow-hidden border-b border-border pb-[14px] desktop:gap-24">
      <span className="t-body shrink-0">{label}</span>
      {children}
    </div>
  );
}

/** One of the three sticky Problem / Solution / Result panels. */
function StoryPanel({
  marker,
  label,
  body,
  panel,
  text,
}: {
  marker: string;
  label: string;
  body: string;
  panel: string;
  text: string;
}) {
  return (
    <div
      className={`flex min-h-[300px] w-full flex-col items-start gap-10 overflow-hidden border-r border-border p-6 ${panel} ${text}`}
    >
      <Reveal className="z-[1] flex items-center gap-[6px]" y={12}>
        <span aria-hidden="true" className={`block h-[10px] w-[10px] shrink-0 ${marker}`} />
        <span className="t-button">{label}</span>
      </Reveal>
      <Reveal className="w-full">
        <p className="t-body-l w-full">{body}</p>
      </Reveal>
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(slug);
  const [img1, img2, img3, img4, img5, img6, img7] = project.images;

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-40 px-5 py-[140px]">
        {/* Hero */}
        <PageHero title={project.title}>
          {/* Overview */}
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden border-b border-l border-border bg-yellow p-6">
            <Reveal className="w-full">
              <p className="t-h4 w-full">{project.shortOverview}</p>
            </Reveal>
          </div>

          {/* Meta */}
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden bg-black p-6 text-white">
            <MetaRow label="Client">
              <span className="t-body">{project.clientName}</span>
            </MetaRow>
            <MetaRow label="Year">
              <span className="t-body">{project.year}</span>
            </MetaRow>
            <MetaRow label="Services Provided">
              <span className="t-body text-right desktop:max-w-[300px]">
                {project.services.join(", ")}
              </span>
            </MetaRow>
            <MetaRow label="Live Link">
              <a
                href={project.liveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[3px] overflow-hidden"
              >
                <span className="t-body">Visit Website</span>
                <ArrowUpRight color="rgb(255, 255, 255)" />
              </a>
            </MetaRow>
          </div>
        </PageHero>

        {/* Videos */}
        <ProjectVideos
          video={project.video}
          youtubeUrl={project.youtubeUrl}
          title={project.title}
        />

        {/* Image 1 */}
        {img1 && (
          <Reveal className="w-full">
            <div
              role="img"
              aria-label={img1.alt || `${project.title} — image 1`}
              className="h-[600px] w-full bg-lightgrey bg-cover bg-center"
              style={{ backgroundImage: `url("${img1.src}")` }}
            />
          </Reveal>
        )}

        {/* Problem / Solution / Result beside images 2-4 */}
        <section className="grid w-full grid-cols-1 bg-white desktop:grid-cols-3">
          <div className="flex flex-col self-start desktop:sticky desktop:top-12">
            <StoryPanel
              marker="bg-yellow"
              label="The Problem"
              body={project.problem}
              panel="bg-offwhite"
              text="text-black"
            />
            <StoryPanel
              marker="bg-white"
              label="The solution"
              body={project.solution}
              panel="bg-black"
              text="text-white"
            />
            <StoryPanel
              marker="bg-lightblack"
              label="The result"
              body={project.result}
              panel="bg-yellow"
              text="text-black"
            />
          </div>

          <div className="flex flex-col desktop:col-span-2">
            {[img2, img3, img4].filter(Boolean).map((im, i) => (
              <Reveal key={im.src} className="w-full" delay={i * 0.06}>
                <div
                  role="img"
                  aria-label={im.alt || `${project.title} — image ${i + 2}`}
                  className="aspect-[4/3] w-full bg-lightgrey bg-cover bg-center"
                  style={{ backgroundImage: `url("${im.src}")` }}
                />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Images 5 and 6 — Grid Czd_bq7z8: 100% x 600px, 2 columns.
            Image5 (yIOgjOJrb) is 600px wide in its column; Image6
            (w5MIcNODJ) is 715px and aligned to the end, so it bleeds
            slightly past its column against the clipped parent. */}
        <section className="grid w-full grid-cols-1 overflow-hidden desktop:h-[600px] desktop:grid-cols-2">
          {img5 && (
            <Reveal className="h-full w-full">
              <div
                role="img"
                aria-label={img5.alt || `${project.title} — image 5`}
                className="h-[320px] w-full max-w-full bg-lightgrey bg-cover bg-center desktop:h-[600px] desktop:w-[600px]"
                style={{ backgroundImage: `url("${img5.src}")` }}
              />
            </Reveal>
          )}
          {img6 && (
            <Reveal className="h-full w-full" delay={0.08}>
              <div
                role="img"
                aria-label={img6.alt || `${project.title} — image 6`}
                className="ml-auto h-[320px] w-full max-w-full bg-lightgrey bg-cover bg-center desktop:h-[600px] desktop:w-[715px]"
                style={{ backgroundImage: `url("${img6.src}")` }}
              />
            </Reveal>
          )}
        </section>

        {/* Image 7 */}
        {img7 && (
          <Reveal className="w-full">
            <div
              role="img"
              aria-label={img7.alt || `${project.title} — image 7`}
              className="h-[600px] w-full overflow-hidden bg-lightgrey bg-cover bg-center"
              style={{ backgroundImage: `url("${img7.src}")` }}
            />
          </Reveal>
        )}

        {/* Next project */}
        <section className="flex w-full items-center justify-center gap-[10px] bg-offwhite p-20">
          <span className="flex-1" />
          <Link href={`/projects/${next.slug}`} className="t-body-l">
            Next Project: {next.title}
          </Link>
        </section>

        {/* CTA */}
        <div className="w-full">
          <Cta />
        </div>
      </div>
    </PageTemplate>
  );
}
