import "server-only";

/**
 * Thin client for Odoo 19's "External JSON-2 API" (POST /json/2/<model>/<method>,
 * `Authorization: bearer <api_key>` header, no session/login required).
 * https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
 *
 * Copied verbatim in shape from the validated chaldeastudios/kilele_coffee
 * reference (lib/odoo/json2.ts there), which runs this same client against
 * a live self-hosted Odoo 19 instance in production on Vercel.
 *
 * Called server-side only.
 *
 * Every call is uncached by default (`cache: "no-store"`) — pass
 * `revalidateSeconds` to opt a specific call into Next's fetch cache
 * instead (see content.ts). Odoo Online (this site's current backend,
 * following the move off a self-hosted instance) enforces its own
 * platform-level rate limit on this API per source address, on top of
 * anything this app does — a self-hosted Odoo box has no such limit, so
 * this never mattered until the migration. Read-only content that rarely
 * changes (services, case studies, products, journal entries, the id
 * lookups in ./ids.ts) opts into a short cache to keep this site's request
 * volume under that limit; anything checkout- or account-scoped (an order,
 * a partner, a payment) stays uncached because it has to be correct on
 * every request, not because caching it would be unsafe on its own.
 *
 * A 429 from Odoo is retried a couple of times with a short backoff: it's
 * Odoo's edge rejecting the request outright, before any business logic
 * runs, so — unlike a timeout or a 5xx — it's always safe to retry, read or
 * write alike, without any risk of double-submitting anything.
 */

import { ODOO_DB, ODOO_URL } from "./config";

export class OdooJson2Error extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      typeof body === "object" && body && "message" in (body as Record<string, unknown>)
        ? String((body as Record<string, unknown>).message)
        : `Odoo JSON-2 API request failed with HTTP ${status}`;
    super(message);
    this.name = "OdooJson2Error";
    this.status = status;
    this.body = body;
  }
}

const RATE_LIMIT_RETRY_DELAYS_MS = [500, 1500];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callJson2<T>(
  model: string,
  method: string,
  args: Record<string, unknown>,
  apiKey: string,
  /**
   * Seconds to let Next's fetch cache serve this exact call (same model,
   * method, args and key) before re-fetching. Omit to keep the request
   * live on every call — the right default for anything that has to be
   * correct per-request.
   */
  revalidateSeconds?: number
): Promise<T> {
  if (!ODOO_URL) throw new Error("ODOO_URL is not set");

  const url = `${ODOO_URL}/json/2/${model}/${method}`;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${apiKey}`,
        ...(ODOO_DB ? { "X-Odoo-Database": ODOO_DB } : {}),
      },
      body: JSON.stringify(args),
      ...(revalidateSeconds !== undefined
        ? { next: { revalidate: revalidateSeconds } }
        : { cache: "no-store" as const }),
    });

    if (res.status === 429 && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length) {
      await sleep(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
      continue;
    }

    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!res.ok) {
      throw new OdooJson2Error(res.status, body);
    }

    return body as T;
  }
}
