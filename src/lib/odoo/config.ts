import "server-only";

/**
 * Central place for reading Odoo connection env vars. No values are
 * cached or persisted anywhere — every request re-reads process.env and
 * hits Odoo live. This module must only ever be imported from server-side
 * code (Server Components, Route Handlers, Server Actions).
 *
 * Pattern taken from the validated chaldeastudios/kilele_coffee reference
 * (lib/odoo/config.ts there) — a working Next.js + Odoo 19 integration,
 * live on Vercel, that this same account already runs.
 *
 * Read-only only: everything this site shows from Odoo is content
 * (services, case studies, journal entries), never a write path — so a
 * single read-scoped ODOO_API_KEY covers all of it. There is no lead- or
 * write-credential here the way kilele_coffee needs one for carts and
 * form submissions.
 */

export const ODOO_URL = (process.env.ODOO_URL ?? "").replace(/\/+$/, "");
export const ODOO_DB = process.env.ODOO_DB ?? "";
export const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";

export const isOdooConfigured = Boolean(ODOO_URL && ODOO_DB && ODOO_API_KEY);

export function requireOdooConfig() {
  const missing = [
    ["ODOO_URL", ODOO_URL],
    ["ODOO_DB", ODOO_DB],
    ["ODOO_API_KEY", ODOO_API_KEY],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    throw new Error(
      `Odoo is not configured — missing env var(s): ${missing.join(", ")}. See .env.example.`
    );
  }
}
