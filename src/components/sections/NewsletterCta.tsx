"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { subscribeToNewsletter } from "@/app/newsletter/actions";

/**
 * NewsletterCta — a "coming soon" signup, in the same tagline/heading/
 * body grammar as Cta.tsx and the rest of the site, rather than a full
 * 100vh panel: this is a small aside along the way, not a destination.
 *
 * Nothing is sent to this list yet — see subscribeToNewsletter — but the
 * signup itself is real: it lands in Odoo as an ordinary opted-in contact,
 * so the list already exists and is growing by the time there's a first
 * issue to send.
 */

const inputClass =
  "t-body w-full border border-black bg-white px-4 py-3 text-black outline-none " +
  "transition-[box-shadow] duration-200 focus:shadow-[inset_0_-3px_0_0_var(--color-yellow)]";

export default function NewsletterCta() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await subscribeToNewsletter(email);
      if (!res.ok) return setError(res.error);
      setDone(true);
    });
  }

  return (
    <section className="flex w-full flex-col items-start gap-8 border-t border-border bg-offwhite p-6 desktop:p-10">
      <Reveal className="flex items-center gap-[6px]">
        <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
        <span className="t-tagline">Newsletter</span>
      </Reveal>

      <div className="flex w-full flex-col items-start gap-2 tablet:w-[75%] tablet:max-w-[560px]">
        <Reveal className="w-full" delay={0.06}>
          <h2 className="t-h3 w-full">A newsletter, soon.</h2>
        </Reveal>
        <Reveal className="w-full" delay={0.12}>
          <p className="t-body w-full text-lightblack">
            Not running yet — new projects, journal entries, the occasional product drop. Leave
            your email and I&apos;ll let you know the moment it&apos;s live.
          </p>
        </Reveal>
      </div>

      {done ? (
        <p className="t-body">You&apos;re on the list — I&apos;ll let you know when it&apos;s live.</p>
      ) : (
        <form onSubmit={submit} className="flex w-full flex-col gap-3 tablet:max-w-[480px] tablet:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={pending}
            className="flex shrink-0 items-center justify-center gap-[10px] bg-black px-6 py-4 text-white disabled:opacity-70"
          >
            <span className="t-button">{pending ? "Saving…" : "Notify me"}</span>
            {!pending && <ArrowRight color="rgb(255, 255, 255)" />}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="t-body border-l-[3px] border-yellow pl-3">
          {error}
        </p>
      )}
    </section>
  );
}
