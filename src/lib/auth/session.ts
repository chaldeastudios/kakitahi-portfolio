import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { CHECKOUT_SECRET } from "@/lib/odoo/config";

/**
 * The signed-in session.
 *
 * A cookie, not a table: it carries the Odoo partner id, the user id and
 * the email, signed with the same server secret the download links use.
 * Nothing about a session is stored anywhere, so there is no session table
 * to grow, expire or leak, and signing out is genuinely just dropping the
 * cookie.
 *
 * The cookie is HttpOnly (script can never read it), SameSite=Lax (so it
 * survives a normal link into the site but not a cross-site form post) and
 * Secure in production. It is an identity claim only — every page still
 * reads that customer's real orders from Odoo, so a session can say who you
 * are but never what you own.
 */

const COOKIE = "ks_session";
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // a month

export type Session = {
  partnerId: number;
  uid: number;
  email: string;
  name: string;
  /**
   * True for an internal Odoo user — the opposite of Odoo's `share` flag.
   * It is the only thing that opens /admin, and it is decided at sign-in
   * from Odoo's own record, then carried in the signed cookie. A customer
   * cannot grant it to themselves: forging it would need the server secret.
   */
  isStaff: boolean;
  expires: number;
};

function sign(payload: string): string {
  return createHmac("sha256", CHECKOUT_SECRET).update(payload).digest("base64url");
}

function encode(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): Session | null {
  if (!CHECKOUT_SECRET) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!session?.partnerId || !session.email) return null;
    if (Date.now() > session.expires) return null;
    return session;
  } catch {
    return null;
  }
}

/** Whoever is signed in on this request, or null. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  return raw ? decode(raw) : null;
}

export async function setSession(
  session: Omit<Session, "expires">
): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, encode({ ...session, expires: Date.now() + TTL_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
