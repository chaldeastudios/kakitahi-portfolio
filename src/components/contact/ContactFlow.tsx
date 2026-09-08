"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { submitBooking, refreshSlots, type BookingActionResult } from "@/app/contact/actions";
import type { Slot } from "@/lib/contact/booking";

/**
 * ContactFlow — books straight onto Isaiah's calendar: pick a time, say
 * who you are, done. No external scheduling tool in between — submitting
 * creates a real crm.lead and calendar.event in Odoo (see
 * lib/contact/booking.ts and app/contact/actions.ts).
 *
 * Same three-step grammar as CheckoutFlow (step markers, a sticky left
 * panel, black/yellow panels on the right) so this reads as part of the
 * same site rather than a bolted-on widget, but pinned to a single 100vh
 * panel that sits directly above the footer rather than flowing the page
 * taller — a scheduler is something you finish in one sitting on one
 * screen, not something to scroll a full page for. Each side scrolls
 * internally if its content ever needs more room than the viewport gives.
 *
 * Times are shown in whatever timezone the visitor's own browser reports
 * (Intl.DateTimeFormat / toLocaleString) rather than Isaiah's — the slot
 * list from the server is UTC ISO strings, timezone-neutral, and everyone
 * reads it in their own. That formatting only runs after mount: doing it
 * during the server render would format in whatever timezone the server
 * happens to run in (not the visitor's), and the mismatch between that and
 * the browser's own re-render is exactly what triggers a hydration error.
 */

const EASE = [0.44, 0, 0.56, 1] as const;

const STEPS = [
  { n: "01.", label: "Pick a time" },
  { n: "02.", label: "Your details" },
  { n: "03.", label: "Confirmed" },
] as const;

type Details = { name: string; email: string; phone: string; company: string; message: string };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex w-full flex-col items-start gap-2">
      <span className="t-button">{label}</span>
      {children}
      {hint && <span className="t-body-s text-lightblack">{hint}</span>}
    </label>
  );
}

const inputClass =
  "t-body w-full border border-black bg-white px-4 py-3 text-black outline-none " +
  "transition-[box-shadow] duration-200 focus:shadow-[inset_0_-3px_0_0_var(--color-yellow)]";

function groupByLocalDay(slots: Slot[]): Array<{ dayLabel: string; slots: Slot[] }> {
  const order: string[] = [];
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = new Date(slot.startIso).toDateString();
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(slot);
  }
  return order.map((key) => ({
    dayLabel: new Date(groups.get(key)![0].startIso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    slots: groups.get(key)!,
  }));
}

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function ContactFlow({
  initialSlots,
  account,
}: {
  initialSlots: Slot[];
  account?: { name: string; email: string };
}) {
  const [mounted, setMounted] = useState(false);
  const [slots, setSlots] = useState(initialSlots);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [details, setDetails] = useState<Details>({
    name: account?.name ?? "",
    email: account?.email ?? "",
    phone: "",
    company: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmedIso, setConfirmedIso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => setMounted(true), []);

  const days = useMemo(() => groupByLocalDay(slots), [slots]);
  const timezone = useMemo(
    () => (mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""),
    [mounted]
  );

  const set = <K extends keyof Details>(key: K, value: Details[K]) =>
    setDetails((d) => ({ ...d, [key]: value }));

  function pickSlot(slot: Slot) {
    setError(null);
    setSelected(slot);
    setStep(1);
  }

  async function doRefresh() {
    setRefreshing(true);
    setError(null);
    const fresh = await refreshSlots();
    setSlots(fresh);
    setSelected(null);
    setRefreshing(false);
  }

  function toReview(e: React.FormEvent) {
    e.preventDefault();
    if (details.name.trim().length < 2) return setError("Please give a name we can address you by.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
      return setError("That email address doesn't look right.");
    if (!selected) return setError("Please pick a time first.");
    setError(null);

    startTransition(async () => {
      const res: BookingActionResult = await submitBooking({
        startIso: selected.startIso,
        endIso: selected.endIso,
        ...details,
      });
      if (!res.ok) {
        setError(res.error);
        if (res.slotTaken) {
          setStep(0);
          void doRefresh();
        }
        return;
      }
      setConfirmedIso(res.startIso);
      setStep(2);
    });
  }

  return (
    <section
      id="book-a-call"
      className="flex w-full scroll-mt-12 flex-col border-t border-border tablet:h-screen tablet:flex-row"
    >
      {/* Left — where you are. Full-height split (h-full inside a shared
          h-screen row) only applies from tablet up: on mobile the section
          isn't height-capped at all, so this and the step panel below just
          stack and take their own natural height — h-full on both inside a
          forced h-screen would each try to claim the whole viewport,
          pushing the actual time picker entirely off-screen. */}
      <div className="flex w-full shrink-0 flex-col justify-between gap-10 border-b border-border bg-white p-6 tablet:h-full tablet:w-[380px] tablet:overflow-y-auto tablet:border-r tablet:border-b-0 desktop:p-10">
        <div className="flex flex-col items-start gap-10">
          <div className="flex flex-col items-start gap-3">
            <span className="t-tagline flex items-center gap-[6px]">
              <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
              Get In Touch
            </span>
            <h1 className="t-h2">Book a call</h1>
            <p className="t-body text-lightblack">
              Straight onto the calendar — no back-and-forth over email to find a time.
            </p>
          </div>

          <ol className="flex w-full flex-col items-start gap-3">
            {STEPS.map((s, i) => {
              const state = i === step ? "current" : i < step ? "done" : "todo";
              return (
                <li key={s.n} className="flex items-center gap-[6px]">
                  <span
                    aria-hidden="true"
                    className={`block h-[10px] w-[10px] shrink-0 ${
                      state === "todo" ? "border border-border bg-transparent" : "bg-yellow"
                    }`}
                  />
                  <span className="t-body-s">{s.n}</span>
                  <span className={`t-body ${state === "todo" ? "text-lightblack" : "text-black"}`}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {selected && step < 2 && (
          <div className="flex w-full flex-col items-start gap-2 border-t border-border pt-5">
            <span className="t-button">Selected time</span>
            <span className="t-body">
              {new Date(selected.startIso).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="t-body-s text-lightblack">
              {timeLabel(selected.startIso)}–{timeLabel(selected.endIso)}
              {timezone ? ` · ${timezone}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Right — the active step */}
      <div className="flex w-full flex-col items-start tablet:h-full tablet:overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {/* -------------------------------------------------- 01. time */}
            {step === 0 && (
              <div className="flex min-h-full w-full flex-col items-start gap-8 bg-offwhite p-6 desktop:p-10">
                <div className="flex w-full flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-[6px]">
                    <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
                    <h2 className="t-button">Pick a time</h2>
                  </div>
                  <button
                    type="button"
                    onClick={doRefresh}
                    disabled={refreshing}
                    className="t-body-s underline underline-offset-4 disabled:opacity-50"
                  >
                    {refreshing ? "Refreshing…" : "Refresh times"}
                  </button>
                </div>

                {!mounted ? (
                  <p className="t-body text-lightblack">Loading available times…</p>
                ) : days.length === 0 ? (
                  <div className="flex w-full flex-col items-start gap-3 border-l-[3px] border-yellow pl-3">
                    <p className="t-body max-w-[480px]">
                      Nothing open in the next couple of weeks. Reach out on{" "}
                      <a
                        href="https://linkedin.com/in/kakitahi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        LinkedIn
                      </a>{" "}
                      instead and we&apos;ll find a time directly.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="t-body-s text-lightblack">
                      Shown in your local time{timezone ? ` — ${timezone}` : ""}.
                    </p>
                    <div className="flex w-full flex-col items-start gap-8">
                      {days.map((day) => (
                        <div key={day.dayLabel} className="flex w-full flex-col items-start gap-3">
                          <span className="t-button">{day.dayLabel}</span>
                          <div className="flex w-full flex-wrap items-center gap-3">
                            {day.slots.map((slot) => (
                              <button
                                key={slot.startIso}
                                type="button"
                                onClick={() => pickSlot(slot)}
                                className="t-body border border-black px-4 py-3 text-black transition-colors duration-200 hover:bg-yellow"
                              >
                                {timeLabel(slot.startIso)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {error && (
                  <p role="alert" className="t-body border-l-[3px] border-yellow pl-3">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* ---------------------------------------------- 02. details */}
            {step === 1 && selected && (
              <form
                onSubmit={toReview}
                className="flex min-h-full w-full flex-col items-start gap-8 bg-black p-6 text-white desktop:p-10"
              >
                <div className="flex items-center gap-[6px]">
                  <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
                  <h2 className="t-button">Your details</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="t-body-s underline underline-offset-4"
                >
                  Change time
                </button>

                <div className="flex w-full max-w-[480px] flex-col gap-6">
                  <Field label="Name">
                    <input
                      className={inputClass}
                      value={details.name}
                      onChange={(e) => set("name", e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </Field>

                  <Field label="Email" hint="Where the confirmation goes.">
                    <input
                      className={inputClass}
                      type="email"
                      value={details.email}
                      onChange={(e) => set("email", e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </Field>

                  <Field label="Phone" hint="Optional.">
                    <input
                      className={inputClass}
                      type="tel"
                      value={details.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="Company" hint="Optional.">
                    <input
                      className={inputClass}
                      value={details.company}
                      onChange={(e) => set("company", e.target.value)}
                      autoComplete="organization"
                    />
                  </Field>

                  <Field label="What would you like to discuss?" hint="Optional, but it helps.">
                    <textarea
                      className={`${inputClass} min-h-[96px] resize-y`}
                      value={details.message}
                      onChange={(e) => set("message", e.target.value)}
                      rows={3}
                    />
                  </Field>
                </div>

                {error && (
                  <p role="alert" className="t-body border-l-[3px] border-yellow pl-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="t-button bg-yellow px-6 py-4 text-black disabled:opacity-70"
                >
                  {pending ? "Booking…" : "Confirm booking →"}
                </button>
              </form>
            )}

            {/* ----------------------------------------------- 03. done */}
            {step === 2 && confirmedIso && (
              <div className="flex min-h-full w-full flex-col items-start gap-8 bg-yellow p-6 desktop:p-10">
                <div className="flex items-center gap-[6px]">
                  <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-black" />
                  <h2 className="t-button">Confirmed</h2>
                </div>

                <div className="flex flex-col items-start gap-3">
                  <p className="t-h4 max-w-[520px]">You&apos;re on the calendar.</p>
                  <p className="t-body max-w-[480px]">
                    {new Date(confirmedIso).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    at {timeLabel(confirmedIso)}
                    {timezone ? ` (${timezone})` : ""}. A confirmation is on its way to{" "}
                    <strong>{details.email}</strong>.
                  </p>
                </div>

                <Link href="/" className="t-button bg-black px-6 py-4 text-white">
                  Back to homepage →
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
