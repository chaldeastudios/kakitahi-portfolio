/**
 * Journal types.
 *
 * The entries these describe are Odoo content now (blog.post records in
 * the "Our blog" blog — see src/lib/odoo/content.ts getJournalPosts()),
 * read live with no static fallback: a failed fetch surfaces as the
 * route's error.tsx rather than a stale placeholder entry. This file used
 * to also hold that placeholder data; it's gone, and only the shape both
 * the Odoo fetcher and the page components share remains.
 *
 * The type lives here rather than in the Odoo layer because that layer
 * imports "server-only"; keeping the shape here lets client components and
 * pages import it freely.
 */

export type JournalSection = {
  heading: string;
  body: string;
};

export type JournalPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  postedBy: string;
  intro: string;
  sections: JournalSection[];
};
