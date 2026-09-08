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
import { resolveIdByName, resolveXmlId } from "./ids";

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
    const categoryId = await resolveIdByName(
      "product.category",
      "name",
      "Chaldea Studios Services",
      ODOO_API_KEY
    );
    const rows = await callJson2<Array<{ id: number }>>(
      "product.template",
      "search_read",
      { domain: [["categ_id", "=", categoryId]], fields: ["id"], limit: 10 },
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
    const blogId = await resolveIdByName("blog.blog", "name", "Portfolio", ODOO_API_KEY);
    const rows = await callJson2<Array<{ id: number }>>(
      "blog.post",
      "search_read",
      { domain: [["blog_id", "=", blogId]], fields: ["id"], limit: 10 },
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
    const blogId = await resolveIdByName("blog.blog", "name", "Our blog", ODOO_API_KEY);
    const rows = await callJson2<Array<{ id: number }>>(
      "blog.post",
      "search_read",
      { domain: [["blog_id", "=", blogId]], fields: ["id"], limit: 10 },
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
    const categoryId = await resolveIdByName(
      "product.category",
      "name",
      "Chaldea Studios Products",
      ODOO_API_KEY
    );
    const rows = await callJson2<Array<{ id: number }>>(
      "product.image",
      "search_read",
      { domain: [["product_tmpl_id.categ_id", "=", categoryId]], fields: ["id"], limit: 1 },
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
  const name = "Checkout can write orders (sale.order + res.partner)";
  const missing = [
    !ODOO_WRITE_API_KEY && "a write-capable API key",
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
        shared
          ? ". Using one key for reads and writes; a separate write-scoped key is safer but not required"
          : ""
      }`,
    };
  } catch (err) {
    return { name, ok: false, detail: String(err) };
  }
}

/**
 * Customer accounts are portal users in Odoo, and signing in asks Odoo
 * itself whether a password is right. Two things can be checked without
 * anyone's credentials: that the write key can see res.users at all, and
 * that the portal group this site puts customers in still exists.
 *
 * The credential check itself (common.authenticate) can only be exercised
 * by a real sign-in, so it is not simulated here.
 */
async function checkAccounts(): Promise<CheckResult> {
  const name = "Customer accounts (portal users, base.group_portal)";
  if (!isCheckoutConfigured) {
    return { name, ok: false, skipped: true, detail: "Checkout/accounts not configured" };
  }
  try {
    const [portalUsers, groupId] = await Promise.all([
      callJson2<Array<{ id: number }>>(
        "res.users",
        "search_read",
        { domain: [["share", "=", true]], fields: ["id"], limit: 5 },
        ODOO_WRITE_API_KEY
      ),
      resolveXmlId("base", "group_portal", ODOO_WRITE_API_KEY),
    ]);
    return {
      name,
      ok: true,
      detail: `OK — portal group present (id ${groupId}), ${portalUsers.length} customer account(s) sampled`,
    };
  } catch (err) {
    return { name, ok: false, detail: String(err) };
  }
}

/**
 * Odoo sends the order confirmation, and password resets would go the same
 * way. Neither works without an outgoing mail server, and this instance has
 * none — so say so here rather than letting it look like a silent success.
 */
async function checkOutgoingMail(): Promise<CheckResult> {
  const name = "Outgoing email (order confirmations, password resets)";
  if (!isOdooConfigured) {
    return { name, ok: false, skipped: true, detail: "Odoo not configured" };
  }
  try {
    const servers = await callJson2<Array<{ id: number; name: string }>>(
      "ir.mail_server",
      "search_read",
      { domain: [["active", "=", true]], fields: ["id", "name"], limit: 5 },
      ODOO_API_KEY
    );
    if (servers.length === 0) {
      return {
        name,
        ok: false,
        detail:
          "No outgoing mail server in Odoo — order confirmation emails fail, and password " +
          "resets are manual (Settings → Users → Change Password). The site itself works.",
      };
    }
    return { name, ok: true, detail: `OK — ${servers.length} mail server(s) configured` };
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
    checkAccounts(),
    checkOutgoingMail(),
  ]);
}
