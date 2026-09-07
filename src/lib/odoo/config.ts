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
 * Two credentials, because there are now two kinds of traffic:
 *
 *   ODOO_API_KEY        read-only. Everything the site *shows* from Odoo —
 *                       services, case studies, journal entries, products,
 *                       product media. This is the key on the hot path of
 *                       every page render.
 *   ODOO_WRITE_API_KEY  write. Only the product checkout uses it, to create
 *                       the customer and the sale order. Falls back to
 *                       ODOO_API_KEY so the flow still works on a single-key
 *                       setup, but a separate, write-scoped key is the right
 *                       configuration: it keeps the key that renders every
 *                       public page unable to write anything. This is the
 *                       same split kilele_coffee makes for its carts and
 *                       form submissions.
 *
 * CHECKOUT_SECRET signs download links (see src/lib/checkout/signing.ts) so
 * the deliverable attached to a product can only be fetched by someone who
 * actually completed a checkout. It is not an Odoo credential.
 */

export const ODOO_URL = (process.env.ODOO_URL ?? "").replace(/\/+$/, "");
export const ODOO_DB = process.env.ODOO_DB ?? "";
export const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";

/** Write-scoped key for the checkout; falls back to the read key. */
export const ODOO_WRITE_API_KEY =
  process.env.ODOO_WRITE_API_KEY ?? process.env.ODOO_API_KEY ?? "";

/**
 * Signs download links. Not an Odoo credential, and not something the
 * deployment has to be given separately: absent an explicit value it
 * derives from the write key, which is already a long server-only secret.
 * Setting CHECKOUT_SECRET explicitly is still better — it lets the Odoo key
 * be rotated without invalidating every outstanding download link, and vice
 * versa — but the checkout works with just the three Odoo variables.
 */
export const CHECKOUT_SECRET =
  process.env.CHECKOUT_SECRET ||
  (process.env.ODOO_WRITE_API_KEY ?? process.env.ODOO_API_KEY ?? "");

export const isOdooConfigured = Boolean(ODOO_URL && ODOO_DB && ODOO_API_KEY);

/**
 * The checkout needs a key that can write. With a single admin key set as
 * ODOO_API_KEY that is already satisfied — ODOO_WRITE_API_KEY falls back to
 * it, and CHECKOUT_SECRET derives from it — so a working read setup is a
 * working checkout, and a separate write key is a hardening step rather
 * than a prerequisite.
 */
export const isCheckoutConfigured = Boolean(
  isOdooConfigured && ODOO_WRITE_API_KEY && CHECKOUT_SECRET
);

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
