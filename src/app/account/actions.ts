"use server";

import { redirect } from "next/navigation";
import { AuthError, signIn, signUp } from "@/lib/auth/accounts";
import { clearSession, setSession } from "@/lib/auth/session";
import { isCheckoutConfigured } from "@/lib/odoo/config";

/**
 * Sign in, sign up, sign out. Errors come back as text to show, never as a
 * thrown 500 — a wrong password is an ordinary thing to happen.
 */

export type AuthResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInAction(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL.test(email)) return { ok: false, error: "That email address doesn't look right." };
  if (!password) return { ok: false, error: "Please enter your password." };
  if (!isCheckoutConfigured) {
    return { ok: false, error: "Accounts aren't available right now. Please try again later." };
  }

  try {
    const account = await signIn(email, password);
    await setSession(account);
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    console.warn("[auth] sign-in failed:", err);
    return { ok: false, error: "Could not sign in just now. Please try again in a moment." };
  }
}

export async function signUpAction(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { ok: false, error: "Please give a name we can address you by." };
  if (!EMAIL.test(email)) return { ok: false, error: "That email address doesn't look right." };
  // Length is the only rule worth enforcing here; Odoo applies whatever
  // password policy the database is configured with on top of it.
  if (password.length < 10) {
    return { ok: false, error: "Please use a password of at least 10 characters." };
  }
  if (!isCheckoutConfigured) {
    return { ok: false, error: "Accounts aren't available right now. Please try again later." };
  }

  try {
    const account = await signUp(name, email, password);
    await setSession(account);
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    console.warn("[auth] sign-up failed:", err);
    return { ok: false, error: "Could not create that account just now. Please try again." };
  }
}

export async function signOutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}
