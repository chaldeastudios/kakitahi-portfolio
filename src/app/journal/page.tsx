import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import JournalCard from "@/components/ui/JournalCard";
import Cta from "@/components/sections/Cta";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { getJournalPosts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { JOURNAL } from "@/lib/journal";

/**
 * /journal — the listing, built on the same frame as /projects
 * (Framer page ohMtTqn_g): the shared PageHero, then a 2-column grid of
 * cards, then the shared closing CTA. There is deliberately no journal
 * section on the home page; the header nav is the way in.
 *
 * Entries are read live from Odoo (blog "Our blog", id 1) and fall back
 * to src/lib/journal.ts if that fetch fails — see src/lib/odoo/safe.ts.
 */
export const metadata: Metadata = {
  title: "Journal — Isaiah Kakitahi",
  description:
    "Notes on design, finance, university and the work itself — an honest record of it as it happens, rather than a polished summary.",
};

export default async function JournalPage() {
  const posts = await withOdooFallback("getJournalPosts", getJournalPosts, JOURNAL);
  // Newest first here — the dataset and Odoo both return oldest first.
  const newestFirst = [...posts].reverse();

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title="Journal" />

        <RevealGroup
          className="grid w-full grid-cols-1 tablet:grid-cols-2"
          stagger={0.1}
        >
          {newestFirst.map((p) => (
            <RevealItem key={p.slug} className="flex">
              <JournalCard
                title={p.title}
                category={p.category}
                date={p.date}
                intro={p.intro}
                href={`/journal/${p.slug}`}
              />
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="w-full">
          <Cta />
        </div>
      </div>
    </PageTemplate>
  );
}
