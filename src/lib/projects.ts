/**
 * Project types.
 *
 * The five 2025 client case studies these describe are Odoo content now
 * (blog.post records in the "Portfolio" blog, tagged "Case Study" — see
 * src/lib/odoo/content.ts getCaseStudies()), read live with no static
 * fallback: a failed fetch surfaces as the route's error.tsx rather than a
 * stale, imageless placeholder standing in for a real case study. This file
 * used to also hold that placeholder data; it's gone, and only the shape
 * both the Odoo fetcher and the page components share remains.
 */

export type ProjectImage = {
  src: string;
  alt: string;
};

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  clientName: string;
  year: number;
  liveLink: string;
  services: string[];
  shortOverview: string;
  problem: string;
  solution: string;
  result: string;
  images: ProjectImage[];
  video: string | null;
  youtubeUrl: string | null;
};
