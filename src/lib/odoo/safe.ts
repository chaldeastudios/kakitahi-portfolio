import "server-only";
import { OdooJson2Error } from "./json2";

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

/**
 * Retries an Odoo fetch instead of falling back — for the one class of call
 * where a stale static price is worse than a slow response: pricing a
 * checkout. withOdooFallback's static datasets exist to keep a read-only
 * page from going blank on a hiccup, but silently charging (or showing) a
 * price that isn't Odoo's current one is a correctness bug, not a
 * degraded page. Odoo Online's own API rate limit (HTTP 429) is the
 * failure this exists for — it's transient, so a short backoff usually
 * clears it — but any other error is retried too, on the same reasoning
 * that a slow real answer beats a fast wrong one here.
 *
 * Exhausts its retries by re-throwing the last error rather than
 * returning a fallback value; the caller (checkout) turns that into an
 * honest "try again" rather than completing an order at the wrong price.
 */
export async function withOdooRetry<T>(
  label: string,
  fetchLive: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fetchLive();
    } catch (err) {
      lastErr = err;
      if (attempt < attempts - 1) {
        const delayMs = 500 * 2 ** attempt;
        console.warn(
          `[odoo] ${label} failed (attempt ${attempt + 1}/${attempts}), retrying in ${delayMs}ms:`,
          err
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  console.warn(`[odoo] ${label} failed after ${attempts} attempts:`, lastErr);
  throw lastErr instanceof Error
    ? lastErr
    : new OdooJson2Error(0, lastErr);
}
