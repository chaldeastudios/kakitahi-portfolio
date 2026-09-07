import "server-only";
import { ODOO_DB, ODOO_URL, ODOO_WRITE_API_KEY } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";

/**
 * Customer accounts, held in Odoo as ordinary portal users.
 *
 * Odoo owns the identity. A customer here is a res.users in the Portal
 * group (base.group_portal, id 10) attached to the res.partner their orders
 * already point at — the same partner the checkout creates. So signing up
 * does not make a second copy of anyone: it gives the contact that already
 * exists a way to log in, and their history is there the moment they do.
 *
 * Odoo also owns the password. This code never sees a stored password and
 * never stores a hash: sign-up hands the chosen password to Odoo, and
 * sign-in asks Odoo whether a password is right, through the same
 * unauthenticated /jsonrpc endpoint the status page already pings. There is
 * no password material in this database or in this codebase.
 *
 * One consequence worth knowing: password *reset* needs email, and this
 * Odoo instance has no outgoing mail server configured — every mail.mail on
 * it is in an exception state with "Connection refused". Until an SMTP
 * server is set up, a forgotten password is reset from Odoo (Settings →
 * Users → the customer → Change Password) rather than self-served. The
 * sign-in page says so rather than offering a link that would go nowhere.
 */

const PORTAL_GROUP_ID = 10; // base.group_portal, confirmed on this instance

export type Account = {
  uid: number;
  partnerId: number;
  email: string;
  name: string;
};

export class AuthError extends Error {}

/**
 * Ask Odoo whether these credentials are good. Returns the user id.
 *
 * `common.authenticate` is Odoo's session-less credential check — the same
 * service as the `common.version` call on the status page, so it needs no
 * key and no session of its own.
 */
async function authenticateWithOdoo(login: string, password: string): Promise<number> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service: "common", method: "authenticate", args: [ODOO_DB, login, password, {}] },
    }),
    cache: "no-store",
  });

  const body = (await res.json()) as { result?: number | false; error?: unknown };
  if (body.error) throw new AuthError("Odoo refused the sign-in request.");
  if (!body.result) throw new AuthError("That email and password don't match.");
  return body.result;
}

type UserRow = {
  id: number;
  login: string;
  partner_id: [number, string] | false;
  share: boolean;
  active: boolean;
};

async function readUser(uid: number): Promise<UserRow | null> {
  const [user] = await callJson2<UserRow[]>(
    "res.users",
    "read",
    { ids: [uid], fields: ["id", "login", "partner_id", "share", "active"] },
    ODOO_WRITE_API_KEY
  );
  return user ?? null;
}

/** Sign in. Throws AuthError with something sayable on any failure. */
export async function signIn(email: string, password: string): Promise<Account> {
  const login = email.trim().toLowerCase();
  const uid = await authenticateWithOdoo(login, password);

  const user = await readUser(uid);
  if (!user || !user.active || !Array.isArray(user.partner_id)) {
    throw new AuthError("That account isn't set up for the shop.");
  }

  // Only ever let portal customers in here. An internal Odoo user signing
  // in through the shop would be a staff account on a customer surface,
  // which is not what this is for.
  if (!user.share) {
    throw new AuthError(
      "That's a staff account — sign in to Odoo directly rather than through the shop."
    );
  }

  return {
    uid: user.id,
    partnerId: user.partner_id[0],
    email: user.login,
    name: user.partner_id[1],
  };
}

/**
 * Create a portal login. Reuses the existing contact for this email — the
 * one the checkout made — so a customer who ordered first and signed up
 * afterwards finds their order already waiting.
 */
export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<Account> {
  const login = email.trim().toLowerCase();

  const existingUsers = await callJson2<Array<{ id: number }>>(
    "res.users",
    "search_read",
    { domain: [["login", "=ilike", login]], fields: ["id"], limit: 1 },
    ODOO_WRITE_API_KEY
  );
  if (existingUsers.length) {
    throw new AuthError("There's already an account with that email — sign in instead.");
  }

  const partners = await callJson2<Array<{ id: number; name: string }>>(
    "res.partner",
    "search_read",
    { domain: [["email", "=ilike", login]], fields: ["id", "name"], limit: 1 },
    ODOO_WRITE_API_KEY
  );

  const vals: Record<string, unknown> = {
    name: name.trim(),
    login,
    email: login,
    // Odoo 19 renamed this from groups_id; portal is what keeps the account
    // a customer rather than a staff seat.
    group_ids: [[6, 0, [PORTAL_GROUP_ID]]],
  };
  if (partners.length) vals.partner_id = partners[0].id;

  const created = await callJson2<number | number[]>(
    "res.users",
    "create",
    { vals_list: [vals] },
    ODOO_WRITE_API_KEY
  );
  const uid = Array.isArray(created) ? created[0] : created;

  // Set the password in its own write: Odoo hashes it on the way in, and
  // this way the value never travels as part of a record-creation payload
  // that might be logged alongside other fields.
  await callJson2(
    "res.users",
    "write",
    { ids: [uid], vals: { password } },
    ODOO_WRITE_API_KEY
  );

  const user = await readUser(uid);
  if (!user || !Array.isArray(user.partner_id)) {
    throw new AuthError("The account was created but could not be read back.");
  }

  return { uid, partnerId: user.partner_id[0], email: login, name: user.partner_id[1] };
}
