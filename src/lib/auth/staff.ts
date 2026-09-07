import "server-only";
import { redirect } from "next/navigation";
import { getSession, type Session } from "./session";

/**
 * The gate on everything under /admin.
 *
 * Staff is not a role this site invents: it is Odoo's own distinction
 * between an internal user and a portal one, read at sign-in and carried in
 * the signed session cookie. Forging it would mean forging the cookie,
 * which needs the server secret.
 *
 * Every admin action calls this again on the server before it writes.
 * Hiding a button is presentation; this is the actual permission.
 */
export async function requireStaff(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/account/login?next=/admin");
  if (!session.isStaff) redirect("/account");
  return session;
}

/** Same check, for actions: throws rather than redirecting. */
export async function assertStaff(): Promise<Session> {
  const session = await getSession();
  if (!session?.isStaff) throw new Error("Not permitted.");
  return session;
}
