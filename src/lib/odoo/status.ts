import "server-only";
import {
  isCheckoutConfigured,
  isOdooConfigured,
  CHECKOUT_SECRET,
  ODOO_API_KEY,
  ODOO_DB,
  ODOO_URL,
  ODOO_WRITE_API_KEY,
} from "./config";
import { callJson2 } from "./json2";

/**
 * Diagnostic checks for /status. Same shape as the validated
 * chaldeastudios/kilele_coffee reference (lib/odoo/status.ts there).
 */

export type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
  skipped?: boolean;
};

// Unauthenticated version/ping check via Odoo's classic JSON-RPC endpoint.
// Proves the box is reachable at all, independent of the API key.
async function checkServerReachable(): Promise<CheckResult> {
  const name = "Odoo server reachable (unauthenticated version check)";
  if (!ODOO_URL) {
    return { name, ok: false, skipped: true, detail: "ODOO_URL is not set" };
  }
  try {
    const res = await fetch(`${ODOO_URL}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: { service: "common", method: "version", args: [] },
      }),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      return { name, ok: false, detail: JSON.stringify(json.error ?? json) };
    }
    return { name, ok: true, detail: JSON.stringify(json.result) };
  } catch (err) {
    return { name, ok: false, detail: String(err) };
  }
}

async function checkReadCredential(): Promise<CheckResult> {
  const name = `Read API key can list published services (ODOO_API_KEY, db "${ODOO_DB || "?"}")`;
  if (!isOdooConfigured) {
    return { name, ok: false, skipped: true, detail: "ODOO_URL/ODOO_DB/ODOO_API_KEY not fully set" };
  }
  try {
    const rows = await callJson2<Array<{ id: number }>>(
      "product.template",
      "search_read",
      { domain: [["categ_id", "=", 7]], fields: ["id"], limit: 10 },
      ODOO_API_KEY
    );
    return { name, ok: true, detail: `OK — found ${rows.length} service product(s)` };
  } catch (err) {
    return { name, ok: false, detail: String(err) };
  }
}

async function checkCaseStudies(): Promise<CheckResult> {
  const name = "Read API key can list published case studies (blog.post, Portfolio blog)";
  if (!isOdooConfigured) {
    return { name, ok: false, skipped: true, detail: "ODOO_URL/ODOO_DB/ODOO_API_KEY not fully set" };
  }
  try {
    const rows = await callJson2<Array<{ id: number }>>(
      "blog.post",
      "search_read",
      { domain: [["blog_id", "=", 2]], fields: ["id"], limit: 10 },
      ODOO_API_KEY
    );
    return { name, ok: true, detail: `OK — found ${rows.length} case study post(s)` };
  } catch (err) {
    return { name, ok: false, detail: String(err) };
  }
}

async function checkJournal(): Promise<CheckResult> {
  const name = "Read API key can list published journal entries (blog.post, Our blog)";
  if (!isOdooConfigured) {
    return { name, ok: false, skipped: true, detail: "ODOO_URL/ODOO_DB/ODOO_API_KEY not fully set" };
  }
  try {
    const rows = await callJson2<Array<{ id: number }>>(
      "blog.post",
      "search_read",
      { domain: [["blog_id", "=", 1]], fields: ["id"], limit: 10 },
      ODOO_API_KEY
    );
    return { name, ok: true, detail: `OK — found ${rows.length} journal post(s)` };
  } catch (err) {
    return { name, ok: false, detail: String(err) };
  }
}

/**
 * Product media is the one thing the site serves as bytes rather than text,
 * through /api/odoo/media. If the read key can list products but cannot
 * read image_1920 off a product.image, every product gallery silently comes
 * up empty — so check the binary read specifically, not just the listing.
 */
async function checkProductMedia(): Promise<CheckResult> {
  const name = "Read API key can read product media (product.image → image_1920)";
  if (!isOdooConfigured) {
    return { name, ok: false, skipped: true, detail: "ODOO_URL/ODOO_DB/ODOO_API_KEY not fully set" };
  }
  try {
    const rows = await callJson2<Array<{ id: number }>>(
      "product.image",
      "search_read",
      { domain: [["product_tmpl_id.categ_id", "=", 8]], fields: ["id"], limit: 1 },
      ODOO_API_KEY
    );
    if (!rows.length) {
      return {
        name,
        ok: true,
        detail: "No eCommerce Media on any product yet — nothing to serve, nothing broken",
      };
    }
    const [image] = await callJson2<Array<{ id: number; image_1920: string | false }>>(
      "product.image",
      "read",
      { ids: [rows[0].id], fields: ["image_1920"] },
      ODOO_API_KEY
    );
    const bytes = typeof image?.image_1920 === "string" ? image.image_1920.length : 0;
    return bytes > 0
      ? { name, ok: true, detail: `OK — read image ${rows[0].id} (${bytes} base64 chars)` }
      : { name, ok: false, detail: `Image ${rows[0].id} came back empty` };
  } catch (err) {
    return { name, ok: false, detail: String(err) };
  }
}

/**
 * The checkout is the only write path on the site. It needs a key that can
 * write and a secret to sign download links with; without either it refuses
 * orders rather than half-completing them, which is correct but invisible.
 * This says so out loud.
 */
async function checkCheckout(): Promise<CheckResult> {
  const name = "Checkout can write orders (ODOO_WRITE_API_KEY + CHECKOUT_SECRET)";
  const missing = [
    !ODOO_WRITE_API_KEY && "ODOO_WRITE_API_KEY",
    !CHECKOUT_SECRET && "CHECKOUT_SECRET",
  ].filter(Boolean);

  if (!isCheckoutConfigured) {
    return { name, ok: false, skipped: true, detail: `Not set: ${missing.join(", ") || "Odoo"}` };
  }

  try {
    // A read with the *write* key: proves the credential is valid without
    // creating anything. The write itself is exercised by placing an order.
    const rows = await callJson2<Array<{ id: number }>>(
      "sale.order",
      "search_read",
      { domain: [], fields: ["id"], limit: 1 },
      ODOO_WRITE_API_KEY
    );
    const shared = ODOO_WRITE_API_KEY === ODOO_API_KEY;
    return {
      name,
      ok: true,
      detail: `OK — write key valid, sale.order reachable (${rows.length} sampled)${
        shared ? ". Note: same key as ODOO_API_KEY; a separate write-scoped key is safer" : ""
      }`,
    };
  } catch (err) {
    return { name, ok: false, detail: String(err) };
  }
}

export async function runAllChecks(): Promise<CheckResult[]> {
  return Promise.all([
    checkServerReachable(),
    checkReadCredential(),
    checkCaseStudies(),
    checkJournal(),
    checkProductMedia(),
    checkCheckout(),
  ]);
}
