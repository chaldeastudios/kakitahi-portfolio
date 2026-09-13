"use server";

import { findOrCreatePartner } from "@/lib/checkout/orders";

/**
 * The newsletter CTA's one action. No newsletter is actually sending yet
 * — this just finds-or-creates the res.partner for that email (the same
 * contact checkout/booking/sign-up would resolve to) and opts them in
 * (is_blacklisted: false), so the list is real and growing before there's
 * anything to send to it.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterResult = { ok: true } | { ok: false; error: string };

export async function subscribeToNewsletter(email: string): Promise<NewsletterResult> {
  const trimmed = email.trim();
  if (!EMAIL.test(trimmed)) {
    return { ok: false, error: "That email address doesn't look right." };
  }

  try {
    await findOrCreatePartner({
      // No name is collected here — the local part of the email is a
      // placeholder Odoo's own contact record can be corrected with
      // later, same as any lead with only an email to go on.
      name: trimmed.split("@")[0],
      email: trimmed,
      marketingOptIn: true,
    });
    return { ok: true };
  } catch (err) {
    console.warn("[newsletter] could not save signup:", err);
    return { ok: false, error: "Something went wrong — please try again in a moment." };
  }
}
