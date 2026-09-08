"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { submitBooking, refreshSlots, type BookingActionResult } from "@/app/contact/actions";
import type { Slot } from "@/lib/contact/booking";

/**
 * ContactFlow — books straight onto Isaiah's calendar: pick a date, pick a
 * time, say who you are, done. No external scheduling tool in between —
 * submitting creates a real crm.lead and calendar.event in Odoo (see
 * lib/contact/booking.ts and app/contact/actions.ts).
 *
 * Step 01 is a calendar (pick a date) beside that date's own time list —
 * one date's times, not every open day's times poured into one long
 * scroll. A date with nothing open — a weekend, or a day Isaiah has
 * blocked by putting a busy calendar.event across business hours in Odoo
 * — just isn't clickable; there is no separate "blocked day" concept to
 * manage here, since a full day with no free slot already renders that
 * way on its own.
 *
 * Same three-step grammar as CheckoutFlow (step markers, a sticky left
 * panel, black/yellow panels on the right) so this reads as part of the
 * same site rather than a bolted-on widget, but pinned to a single 100vh
 * panel that sits directly above the footer rather than flowing the page
 * taller — a scheduler is something you finish in one sitting on one
 * screen, not something to scroll a full page for. Each side scrolls
 * internally if its content ever needs more room than the viewport gives.
 *
 * Times (and the calendar's own "today") are read in whatever timezone
 * the visitor's own browser reports (Intl.DateTimeFormat / toLocaleString)
 * rather than Isaiah's — the slot list from the server is UTC ISO
 * strings, timezone-neutral, and everyone reads it in their own. That
 * formatting only runs after mount: doing it during the server render
 * would format in whatever timezone the server happens to run in (not the
 * visitor's), and the mismatch between that and the browser's own
 * re-render is exactly what triggers a hydration error.
 */

const EASE = [0.44, 0, 0.56, 1] as const;

const STEPS = [
  { n: "01.", label: "Pick a time" },
  { n: "02.", label: "Your details" },
  { n: "03.", label: "Confirmed" },
] as const;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

/** Local calendar date ("Tue Sep 09 2026"-style) -> that day's slots, in
 *  the order the server returned them (chronological, since candidateSlots
 *  in lib/contact/booking.ts generates them in order). Map insertion order
 *  is preserved, so the first/last key are the earliest/latest open date. */
function groupSlotsByLocalDate(slots: Slot[]): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = new Date(slot.startIso).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(slot);
  }
  return map;
}

/** One calendar month as a 7-wide grid, null for the leading blank cells. */
function monthGridCells(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = new Array(first.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

const dateKey = (d: Date) => d.toDateString();
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
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
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
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

  const slotsByDate = useMemo(() => groupSlotsByLocalDate(slots), [slots]);
  const availableDateKeys = useMemo(() => Array.from(slotsByDate.keys()), [slotsByDate]);
  const timezone = useMemo(
    () => (mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""),
    [mounted]
  );

  // Defaults to the earliest open date, once the client has resolved what
  // "today" actually is — see the file header on why this waits for mount.
  useEffect(() => {
    if (!mounted || availableDateKeys.length === 0) return;
    setSelectedDateKey((cur) => (cur && slotsByDate.has(cur) ? cur : availableDateKeys[0]));
    setViewMonth((cur) => cur ?? new Date(availableDateKeys[0]));
  }, [mounted, availableDateKeys, slotsByDate]);

  const earliestDate = availableDateKeys.length ? new Date(availableDateKeys[0]) : null;
  const latestDate = availableDateKeys.length
    ? new Date(availableDateKeys[availableDateKeys.length - 1])
    : null;
  const canGoPrevMonth = Boolean(
    viewMonth && earliestDate && !sameMonth(viewMonth, earliestDate) && viewMonth > earliestDate
  );
  const canGoNextMonth = Boolean(
    viewMonth && latestDate && !sameMonth(viewMonth, latestDate) && viewMonth < latestDate
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

  const selectedDaySlots = selectedDateKey ? (slotsByDate.get(selectedDateKey) ?? []) : [];

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
                ) : availableDateKeys.length === 0 ? (
                  <div className="flex w-full flex-col items-start gap-3 border-l-[3px] border-yellow pl-3">
                    <p className="t-body max-w-[480px]">
                      Nothing open in the next couple of months. Reach out on{" "}
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

                    <div className="flex w-full flex-col items-start gap-10 tablet:flex-row">
                      {/* Calendar */}
                      <div className="flex w-full flex-col items-start gap-4 tablet:w-[320px] tablet:shrink-0">
                        <div className="flex w-full items-center justify-between">
                          <span className="t-h5">
                            {viewMonth?.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="Previous month"
                              disabled={!canGoPrevMonth}
                              onClick={() =>
                                setViewMonth((m) => (m ? new Date(m.getFullYear(), m.getMonth() - 1, 1) : m))
                              }
                              className="flex h-8 w-8 items-center justify-center border border-black disabled:opacity-30"
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              aria-label="Next month"
                              disabled={!canGoNextMonth}
                              onClick={() =>
                                setViewMonth((m) => (m ? new Date(m.getFullYear(), m.getMonth() + 1, 1) : m))
                              }
                              className="flex h-8 w-8 items-center justify-center border border-black disabled:opacity-30"
                            >
                              ›
                            </button>
                          </div>
                        </div>

                        <div className="grid w-full grid-cols-7 gap-1">
                          {WEEKDAY_LABELS.map((w) => (
                            <span key={w} className="t-body-s py-1 text-center text-lightblack">
                              {w}
                            </span>
                          ))}
                          {viewMonth &&
                            monthGridCells(viewMonth.getFullYear(), viewMonth.getMonth()).map((cell, i) => {
                              if (!cell) return <span key={`blank-${i}`} aria-hidden="true" />;
                              const key = dateKey(cell);
                              const available = slotsByDate.has(key);
                              const isSelected = key === selectedDateKey;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  disabled={!available}
                                  onClick={() => setSelectedDateKey(key)}
                                  className={`t-body-s aspect-square w-full transition-colors duration-150 ${
                                    isSelected
                                      ? "bg-yellow text-black"
                                      : available
                                        ? "border border-black bg-white text-black hover:bg-yellow"
                                        : "text-lightblack opacity-40"
                                  }`}
                                >
                                  {cell.getDate()}
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Times for the selected date */}
                      <div className="flex w-full flex-1 flex-col items-start gap-3">
                        <span className="t-button">
                          {selectedDateKey
                            ? new Date(selectedDateKey).toLocaleDateString(undefined, {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })
                            : "Pick a date"}
                        </span>
                        {selectedDaySlots.length === 0 ? (
                          <p className="t-body-s text-lightblack">Nothing open this day.</p>
                        ) : (
                          <div className="flex w-full flex-wrap items-start gap-3">
                            {selectedDaySlots.map((slot) => (
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
                        )}
                      </div>
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
