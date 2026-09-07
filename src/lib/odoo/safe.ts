import "server-only";

/**
 * Wraps an Odoo fetch with a static fallback.
 *
 * The reference (chaldeastudios/kilele_coffee) is a throwaway test whose
 * whole point is proving the live connection, so it shows raw errors and
 * has no fallback data at all. This site is a real portfolio that already
 * works from the static datasets in src/lib/content.ts and
 * src/lib/projects.ts — those stay in the repo as the fallback rather than
 * letting a Vercel-Odoo hiccup blank a real person's homepage. Odoo is
 * still the source of truth: this only governs what happens on the rare
 * request where reaching it fails.
 *
 * Failures are logged server-side (visible in Vercel's function logs) and
 * never surfaced to the visitor — /status is the page for diagnosing a
 * misconfigured or unreachable connection directly.
 */
export async function withOdooFallback<T>(
  label: string,
  fetchLive: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fetchLive();
  } catch (err) {
    console.warn(`[odoo] ${label} failed, using static fallback:`, err);
    return fallback;
  }
}
