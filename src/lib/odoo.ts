import "server-only";

/**
 * Odoo JSON-RPC client.
 *
 * Server-only — never import this from a "use client" component. It reads
 * credentials from environment variables and calls the live Odoo instance
 * directly, so it must never run in the browser.
 *
 * Required environment variables (see .env.example):
 *   ODOO_URL      Base URL of the Odoo instance, no trailing slash
 *                  (e.g. "https://kakitahi.odoo.com")
 *   ODOO_DB       Database name
 *   ODOO_LOGIN    The login of the user the API key belongs to
 *   ODOO_API_KEY  An API key for that user (Settings -> Account Security ->
 *                  New API Key in Odoo), used as the password for RPC auth
 *
 * NOT WIRED UP YET. This client is written and typed against Odoo's
 * standard JSON-RPC surface, but nothing in the app calls it yet — see
 * README.md "Odoo integration" for why, and what's needed to finish it.
 */

type JsonRpcParams = Record<string, unknown>;

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_LOGIN = process.env.ODOO_LOGIN;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

function requireConfig() {
  const missing = [
    ["ODOO_URL", ODOO_URL],
    ["ODOO_DB", ODOO_DB],
    ["ODOO_LOGIN", ODOO_LOGIN],
    ["ODOO_API_KEY", ODOO_API_KEY],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    throw new Error(
      `Odoo is not configured — missing env var(s): ${missing.join(", ")}. ` +
        "See .env.example."
    );
  }
}

async function rpcCall<T>(params: JsonRpcParams): Promise<T> {
  requireConfig();

  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params,
      id: Math.floor(Math.random() * 1e9),
    }),
    // This app is statically exported for most pages; callers that need
    // fresh content should pass their own revalidate via fetch options
    // upstream, or call this from a route handler / server action instead.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Odoo RPC HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.error) {
    const msg =
      json.error?.data?.message || json.error?.message || "Unknown Odoo RPC error";
    throw new Error(`Odoo RPC error: ${msg}`);
  }
  return json.result as T;
}

let cachedUid: number | null = null;

async function login(): Promise<number> {
  if (cachedUid !== null) return cachedUid;

  const uid = await rpcCall<number | false>({
    service: "common",
    method: "login",
    args: [ODOO_DB, ODOO_LOGIN, ODOO_API_KEY],
  });

  if (!uid) {
    throw new Error(
      "Odoo login failed — check ODOO_DB, ODOO_LOGIN and ODOO_API_KEY."
    );
  }
  cachedUid = uid;
  return uid;
}

async function executeKw<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: JsonRpcParams = {}
): Promise<T> {
  const uid = await login();
  return rpcCall<T>({
    service: "object",
    method: "execute_kw",
    args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs],
  });
}

export type OdooDomain = Array<
  [string, string, unknown] | "&" | "|" | "!"
>;

export async function odooSearchRead<T = Record<string, unknown>>(
  model: string,
  domain: OdooDomain = [],
  fields?: string[],
  opts: { limit?: number; offset?: number; order?: string } = {}
): Promise<T[]> {
  return executeKw<T[]>(model, "search_read", [domain], {
    fields,
    ...opts,
  });
}
