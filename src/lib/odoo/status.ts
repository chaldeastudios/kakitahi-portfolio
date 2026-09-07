import "server-only";
import { isOdooConfigured, ODOO_API_KEY, ODOO_DB, ODOO_URL } from "./config";
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

export async function runAllChecks(): Promise<CheckResult[]> {
  return Promise.all([
    checkServerReachable(),
    checkReadCredential(),
    checkCaseStudies(),
    checkJournal(),
  ]);
}
