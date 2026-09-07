import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { CHECKOUT_SECRET } from "@/lib/odoo/config";

/**
 * The deliverable attached to a product (Bernaum's remix-link PDF) is a
 * private ir.attachment in Odoo. The download route fetches it with the
 * Odoo key, which means the route itself must decide who is allowed to ask.
 *
 * A completed checkout hands back a token: an HMAC over the order
 * reference, the attachment id and an expiry, signed with CHECKOUT_SECRET.
 * The download route recomputes it. Nothing is stored, so there is no
 * session or table to keep, and a link cannot be edited to reach a
 * different attachment — changing any field invalidates the signature.
 *
 * This is deliberately modest security for a deliberately modest asset:
 * the product is free and the same thing is one click away on the Framer
 * Marketplace. The point is that a private attachment is not simply open to
 * the internet, and that links expire.
 */

const TTL_MS = 1000 * 60 * 60 * 24 * 7; // a week

export type DownloadClaim = {
  order: string;
  attachmentId: number;
  expires: number;
};

function sign(payload: string): string {
  return createHmac("sha256", CHECKOUT_SECRET).update(payload).digest("base64url");
}

export function createDownloadToken(order: string, attachmentId: number): string {
  const expires = Date.now() + TTL_MS;
  const payload = `${order}.${attachmentId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the claim if the token is intact and unexpired, else null. */
export function readDownloadToken(token: string): DownloadClaim | null {
  if (!CHECKOUT_SECRET) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [order, rawId, rawExpires, signature] = parts;
  const attachmentId = Number(rawId);
  const expires = Number(rawExpires);
  if (!Number.isInteger(attachmentId) || !Number.isFinite(expires)) return null;

  const expected = sign(`${order}.${attachmentId}.${expires}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() > expires) return null;

  return { order, attachmentId, expires };
}
