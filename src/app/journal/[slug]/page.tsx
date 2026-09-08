import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import Cta from "@/components/sections/Cta";
import { Reveal } from "@/components/ui/Reveal";
import { getJournalPosts } from "@/lib/odoo/content";
import type { JournalPost } from "@/lib/journal";

/**
 * /journal/[slug] — one entry, on the same frame as a project case study
 * (Framer page yYdS2aTdj): the sticky PageHero title beside a /Yellow
 * opening panel and a /Black meta panel, then the body, then "Next Entry"
 * and the shared CTA.
 *
 * Where a case study runs its body as three sticky Problem/Solution/Result
 * panels against a column of images, an entry is prose with no imagery, so
 * the body is a single measured reading column instead — the same borders,
 * markers and type, set at a width that stays readable over long passages.
 *
 * No generateStaticParams: the valid slugs are live Odoo content. Entries
 * are cached briefly (see CONTENT_CACHE_SECONDS in
 * src/lib/odoo/content.ts) with no static fallback — a failed fetch is
 * this route's error.tsx, and an unknown slug still 404s via notFound().
 */

/**
 * connection() excludes this route from build-time prerendering — see the
 * same note on app/page.tsx.
 */
async function loadEntries(): Promise<JournalPost[]> {
  await connection();
  return getJournalPosts();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entries = await loadEntries();
  const entry = entries.find((p) => p.slug === slug);
  if (!entry) return { title: "Entry not found — Isaiah Kakitahi" };
  return {
    title: `${entry.title} — Journal — Isaiah Kakitahi`,
    description: entry.intro,
  };
}

/** One row of the black meta panel — same construction as a case study's. */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-6 overflow-hidden border-b border-border pb-[14px] desktop:gap-24">
      <span className="t-body shrink-0">{label}</span>
      <span className="t-body text-right desktop:max-w-[300px]">{value}</span>
    </div>
  );
}

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entries = await loadEntries();
  const entry = entries.find((p) => p.slug === slug);
  if (!entry) notFound();

  const i = entries.findIndex((p) => p.slug === slug);
  const next = entries[(i + 1) % entries.length];

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title={entry.title}>
          {/* Opening line */}
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden border-b border-l border-border bg-yellow p-6">
            <Reveal className="w-full">
              <p className="t-h4 w-full">{entry.intro}</p>
            </Reveal>
          </div>

          {/* Meta */}
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden bg-black p-6 text-white">
            <MetaRow label="Category" value={entry.category} />
            <MetaRow label="Date" value={entry.date} />
            <MetaRow label="Posted By" value={entry.postedBy} />
          </div>
        </PageHero>

        {/* Body */}
        <article className="flex w-full flex-col items-center bg-white">
          {entry.sections.map((section, index) => (
            <section
              key={`${section.heading}-${index}`}
              className="flex w-full justify-center border-b border-border px-5 py-16 desktop:px-6 desktop:py-20"
            >
              <div className="flex w-full max-w-[760px] flex-col items-start gap-6">
                <Reveal className="flex items-center gap-[6px]" y={12}>
                  <span
                    aria-hidden="true"
                    className="block h-[10px] w-[10px] shrink-0 bg-yellow"
                  />
                  <h2 className="t-h4">{section.heading}</h2>
                </Reveal>
                <Reveal className="flex w-full flex-col gap-5" y={20}>
                  {section.body.split("\n\n").map((para, p) => (
                    <p key={p} className="t-body-l w-full">
                      {para}
                    </p>
                  ))}
                </Reveal>
              </div>
            </section>
          ))}
        </article>

        {/* Next entry */}
        <section className="flex w-full items-center justify-center gap-[10px] bg-offwhite p-20">
          <span className="flex-1" />
          <Link href={`/journal/${next.slug}`} className="t-body-l">
            Next Entry: {next.title}
          </Link>
        </section>

        <div className="w-full">
          <Cta />
        </div>
      </div>
    </PageTemplate>
  );
}
