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
 * Called server-side only. Every call goes straight to Odoo — nothing here
 * is cached, stored, or reused across requests.
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

export async function callJson2<T>(
  model: string,
  method: string,
  args: Record<string, unknown>,
  apiKey: string
): Promise<T> {
  if (!ODOO_URL) throw new Error("ODOO_URL is not set");

  const url = `${ODOO_URL}/json/2/${model}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${apiKey}`,
      ...(ODOO_DB ? { "X-Odoo-Database": ODOO_DB } : {}),
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });

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
