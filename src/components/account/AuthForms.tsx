"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signInAction, signUpAction, type AuthResult } from "@/app/account/actions";

/**
 * Sign in and create an account, on one page with two modes.
 *
 * Two modes rather than two pages because the difference is one field: a
 * customer who has already ordered has a contact in Odoo but no login, and
 * sending them bouncing between /login and /register to find that out is
 * the worst part of most shop sign-ins. Creating an account attaches a
 * login to the contact their orders already point at, so the history is
 * there the moment they get in.
 *
 * The site's own furniture throughout: /Off-white panel, hairline borders,
 * the 10px /Yellow marker, and inputs that take a yellow underline on focus
 * rather than a browser outline.
 */

const inputClass =
  "t-body w-full border border-black bg-white px-4 py-3 text-black outline-none " +
  "transition-[box-shadow] duration-200 focus:shadow-[inset_0_-3px_0_0_var(--color-yellow)]";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex w-full flex-col items-start gap-2">
      <span className="t-button">{label}</span>
      {children}
      {hint && <span className="t-body-s text-lightblack">{hint}</span>}
    </label>
  );
}

export default function AuthForms({ next }: { next?: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const router = useRouter();

  const [signInState, doSignIn, signInPending] = useActionState<AuthResult | null, FormData>(
    signInAction,
    null
  );
  const [signUpState, doSignUp, signUpPending] = useActionState<AuthResult | null, FormData>(
    signUpAction,
    null
  );

  const state = mode === "in" ? signInState : signUpState;
  const pending = mode === "in" ? signInPending : signUpPending;

  // The action sets the cookie; the router refresh is what makes the rest
  // of the app — the header, the account page — see it.
  useEffect(() => {
    if (state?.ok) {
      router.replace(next && next.startsWith("/") ? next : "/account");
      router.refresh();
    }
  }, [state, router, next]);

  return (
    <section className="grid w-full grid-cols-1 tablet:grid-cols-2">
      {/* Left — what this is for */}
      <div className="z-[1] tablet:h-full">
        <div className="flex min-h-[380px] w-full flex-col justify-between gap-10 border-r border-b border-border bg-white p-6 tablet:sticky tablet:top-12">
          <div className="flex flex-col items-start gap-6">
            <h1 className="t-h2">{mode === "in" ? "Sign in" : "Create account"}</h1>
            <p className="t-body max-w-[420px]">
              Your account is where your orders live: what you have, when you got it, and the
              files that came with it.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 border-t border-border pt-5">
            <span className="t-body-s">
              {mode === "in" ? "Ordered before but never set a password?" : "Already have a login?"}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
              className="t-button underline underline-offset-4"
            >
              {mode === "in" ? "Create an account" : "Sign in instead"}
            </button>
          </div>
        </div>
      </div>

      {/* Right — the form */}
      <div className="flex flex-col items-start">
        <form
          key={mode}
          action={mode === "in" ? doSignIn : doSignUp}
          className="flex min-h-[380px] w-full flex-col items-start gap-8 border-b border-border bg-offwhite p-6 desktop:p-10"
        >
          <div className="flex items-center gap-[6px]">
            <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
            <h2 className="t-button">{mode === "in" ? "Your details" : "New account"}</h2>
          </div>

          <div className="flex w-full max-w-[520px] flex-col gap-6">
            {mode === "up" && (
              <Field label="Name">
                <input className={inputClass} name="name" autoComplete="name" required />
              </Field>
            )}

            <Field
              label="Email"
              hint={
                mode === "up"
                  ? "Use the address you ordered with and your past orders come with you."
                  : undefined
              }
            >
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password" hint={mode === "up" ? "At least 10 characters." : undefined}>
              <input
                className={inputClass}
                name="password"
                type="password"
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                required
              />
            </Field>
          </div>

          {state && !state.ok && (
            <p role="alert" className="t-body max-w-[520px] border-l-[3px] border-yellow pl-3">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="t-button bg-black px-6 py-4 text-white disabled:opacity-70"
          >
            {pending
              ? mode === "in"
                ? "Signing in…"
                : "Creating…"
              : mode === "in"
                ? "Sign in →"
                : "Create account →"}
          </button>

          {mode === "in" && (
            <p className="t-body-s max-w-[520px] text-lightblack">
              Forgotten your password? Email me and I&apos;ll reset it — self-service resets need
              an outgoing mail server, which this shop doesn&apos;t have configured yet.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
