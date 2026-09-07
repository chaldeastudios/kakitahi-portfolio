"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "@/components/ui/icons";
import { placeOrder, type OrderResult } from "@/app/checkout/actions";
import { useCart } from "@/lib/cart/CartProvider";
import type { Product } from "@/lib/products";

/**
 * CheckoutFlow — the three steps between a full cart and having the goods.
 *
 * The site's own grammar throughout, because a checkout that looks like a
 * different website is where people stop trusting it: the 2-column split
 * with a sticky panel on the left, hairline /Border rules, the 10px /Yellow
 * marker, the /Black and /Yellow panels, and the same Body/Heading scale.
 * Nothing rounded, nothing shadowed, no colour outside the palette.
 *
 * What is new is only what a checkout needs: a step marker so you always
 * know where you are, a review you can go back from, and a confirmation
 * that hands over the goods rather than promising an email. Steps are
 * numbered "01. / 02. / 03." — the numbering the Services list uses — so it
 * reads as part of the site.
 *
 * A free cart has no payment step: what the flow collects is who you are,
 * so the order is a real record rather than an anonymous download. A priced
 * cart places the same order as a quotation and then hands the customer to
 * Odoo's own portal page for it, where the Paystack provider takes the
 * payment. Odoo confirms the order when the money lands, and that is what
 * releases the files — this site never sees a card. Either way the cart is
 * emptied only after the server has answered, so a failure leaves it intact.
 */

const EASE = [0.44, 0, 0.56, 1] as const;

const STEPS = [
  { n: "01.", label: "Your details" },
  { n: "02.", label: "Review order" },
  { n: "03.", label: "Confirmation" },
] as const;

type Details = { name: string; email: string; context: string; marketingOptIn: boolean };

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

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex w-full items-baseline justify-between gap-6 border-b border-border pb-[14px]">
      <span className="t-body shrink-0">{label}</span>
      <span className="t-body text-right">{value}</span>
    </div>
  );
}

export default function CheckoutFlow({
  products,
  account,
}: {
  products: Product[];
  /** Set when someone is signed in; their identity is then not editable. */
  account?: { name: string; email: string };
}) {
  const { lines, clear, ready } = useCart();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<Details>({
    name: account?.name ?? "",
    email: account?.email ?? "",
    context: "",
    marketingOptIn: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<OrderResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLElement>(null);

  // Each step replaces the panel in place, so without this you land on the
  // new step already scrolled past its top — most visibly on the
  // confirmation, where the order reference is what you came for.
  useEffect(() => {
    if (step === 0) return;
    root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const set = <K extends keyof Details>(key: K, value: Details[K]) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const cart = lines
    .map((line) => {
      const product = products.find((p) => p.slug === line.slug);
      return product ? { product, quantity: Math.min(line.quantity, product.maxQuantity) } : null;
    })
    .filter((x): x is { product: Product; quantity: number } => x !== null);

  const itemCount = cart.reduce((n, c) => n + c.quantity, 0);
  const total = cart.reduce((sum, c) => sum + c.product.priceValue * c.quantity, 0);
  const currency = cart.find((c) => c.product.currency)?.product.currency ?? "";
  const totalLabel = total === 0 ? "Free" : `${currency} ${total.toLocaleString("en-GB")}`;

  function toReview(e: React.FormEvent) {
    e.preventDefault();
    if (details.name.trim().length < 2) return setError("Please give a name we can address you by.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
      return setError("That email address doesn't look right.");
    setError(null);
    setStep(1);
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({
        lines: cart.map((c) => ({ slug: c.product.slug, quantity: c.quantity })),
        ...details,
      });
      if (res.ok) {
        // A priced order hands back Odoo's portal payment page; the cart is
        // cleared first so coming back from payment doesn't find it full.
        if (res.paymentUrl) {
          clear();
          window.location.href = res.paymentUrl;
          return;
        }
        setResult(res);
        setStep(2);
        clear();
      } else {
        setError(res.error);
      }
    });
  }

  // An empty cart has nothing to check out — unless an order just came
  // back, in which case the cart is empty precisely because it worked.
  if (ready && cart.length === 0 && !result) {
    return (
      <section className="flex min-h-[380px] w-full flex-col items-start justify-center gap-6 border-b border-border bg-offwhite p-6 desktop:p-10">
        <h1 className="t-h2">Checkout</h1>
        <p className="t-body max-w-[520px]">
          There is nothing in your cart yet.
        </p>
        <Link href="/products" className="t-button bg-black px-6 py-4 text-white">
          Browse products →
        </Link>
      </section>
    );
  }

  return (
    <section ref={root} className="grid w-full scroll-mt-12 grid-cols-1 tablet:grid-cols-2">
      {/* Left — where you are, and what you're getting */}
      <div className="z-[1] tablet:h-full">
        <div className="flex min-h-[380px] w-full flex-col justify-between gap-10 border-r border-b border-border bg-white p-6 tablet:sticky tablet:top-12">
          <div className="flex flex-col items-start gap-10">
            <h1 className="t-h2">Checkout</h1>

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
                    {state === "current" && <span className="sr-only">(current step)</span>}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* The cart, small, so it stays in view through every step */}
          <div className="flex w-full flex-col items-start gap-3 border-t border-border pt-5">
            {(result
              ? result.items
              : cart.map((c) => ({
                  title: c.product.title,
                  kind: c.product.kind,
                  quantity: c.quantity,
                }))
            ).map(
              (item) => (
                <div key={item.title} className="flex w-full items-baseline justify-between gap-4">
                  <span className="t-body">{item.title}</span>
                  <span className="t-body-s shrink-0">×{item.quantity}</span>
                </div>
              )
            )}
            {!result && (
              <span className="t-body-s text-lightblack">
                {itemCount} item{itemCount === 1 ? "" : "s"} · {totalLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right — the active step */}
      <div className="flex flex-col items-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {/* ---------------------------------------------- 01. details */}
            {step === 0 && (
              <form
                onSubmit={toReview}
                className="flex min-h-[380px] w-full flex-col items-start gap-8 border-b border-border bg-offwhite p-6 desktop:p-10"
              >
                <div className="flex items-center gap-[6px]">
                  <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
                  <h2 className="t-button">Your details</h2>
                </div>

                <p className="t-body max-w-[520px]">
                  {total === 0
                    ? "There is nothing to pay. This is so the order is a real record, and so I know who is using what I make."
                    : "You'll be taken to a secure payment page. Your files are released the moment the payment clears."}
                  {!account && (
                    <>
                      {" "}
                      <Link href="/account/login?next=/checkout" className="underline underline-offset-4">
                        Sign in
                      </Link>{" "}
                      if you have an account, and this order joins the rest.
                    </>
                  )}
                </p>

                <div className="flex w-full max-w-[520px] flex-col gap-6">
                  {account ? (
                    // Signed in: the identity is the session's, and the
                    // server uses that rather than anything posted here.
                    <div className="flex w-full flex-col items-start gap-2 border-l-[3px] border-yellow pl-3">
                      <span className="t-button">Ordering as</span>
                      <span className="t-body">{account.name}</span>
                      <span className="t-body-s text-lightblack">{account.email}</span>
                    </div>
                  ) : (
                    <>
                      <Field label="Name">
                        <input
                          className={inputClass}
                          value={details.name}
                          onChange={(e) => set("name", e.target.value)}
                          autoComplete="name"
                          required
                        />
                      </Field>

                      <Field label="Email" hint="Where the order confirmation goes.">
                        <input
                          className={inputClass}
                          type="email"
                          value={details.email}
                          onChange={(e) => set("email", e.target.value)}
                          autoComplete="email"
                          required
                        />
                      </Field>
                    </>
                  )}

                  <Field label="What are you building?" hint="Optional.">
                    <textarea
                      className={`${inputClass} min-h-[96px] resize-y`}
                      value={details.context}
                      onChange={(e) => set("context", e.target.value)}
                      rows={3}
                    />
                  </Field>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-[3px] h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none border border-black bg-white checked:bg-yellow"
                      checked={details.marketingOptIn}
                      onChange={(e) => set("marketingOptIn", e.target.checked)}
                    />
                    <span className="t-body">
                      Email me when I ship something new. No more than occasionally, and you can
                      unsubscribe from any of it.
                    </span>
                  </label>
                </div>

                {error && (
                  <p role="alert" className="t-body border-l-[3px] border-yellow pl-3">
                    {error}
                  </p>
                )}

                <button type="submit" className="t-button bg-black px-6 py-4 text-white">
                  Review order →
                </button>
              </form>
            )}

            {/* ----------------------------------------------- 02. review */}
            {step === 1 && (
              <div className="flex min-h-[380px] w-full flex-col items-start gap-8 border-b border-border bg-black p-6 text-white desktop:p-10">
                <div className="flex items-center gap-[6px]">
                  <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
                  <h2 className="t-button">Review order</h2>
                </div>

                <div className="flex w-full max-w-[560px] flex-col gap-[14px]">
                  {cart.map(({ product, quantity }) => (
                    <SummaryRow
                      key={product.slug}
                      label={`${product.title} ×${quantity}`}
                      value={product.priceLabel}
                    />
                  ))}
                  <SummaryRow label="Name" value={details.name} />
                  <SummaryRow label="Email" value={details.email} />
                  <SummaryRow
                    label="Product updates"
                    value={details.marketingOptIn ? "Yes, email me" : "No thanks"}
                  />
                  <div className="flex w-full items-baseline justify-between gap-6 pt-2">
                    <span className="t-h5">Total</span>
                    <span className="t-h5">{totalLabel}</span>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="t-body border-l-[3px] border-yellow pl-3">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={pending}
                    className="t-button bg-yellow px-6 py-4 text-black disabled:opacity-70"
                  >
                    {pending
                      ? total === 0
                        ? "Placing order…"
                        : "Opening payment…"
                      : total === 0
                        ? "Place order →"
                        : `Pay ${totalLabel} →`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    disabled={pending}
                    className="t-button underline underline-offset-4 disabled:opacity-70"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------- 03. confirmation */}
            {step === 2 && result && (
              <div className="flex min-h-[380px] w-full flex-col items-start gap-8 border-b border-border bg-yellow p-6 desktop:p-10">
                <div className="flex items-center gap-[6px]">
                  <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-black" />
                  <h2 className="t-button">Confirmed</h2>
                </div>

                <div className="flex flex-col items-start gap-3">
                  <p className="t-h4 max-w-[560px]">
                    {result.confirmed
                      ? `Order ${result.reference} is placed.`
                      : `Order ${result.reference} is reserved.`}
                  </p>
                  <p className="t-body max-w-[520px]">
                    {result.confirmed ? (
                      <>
                        It is on file against {result.email}. Nothing was charged — the order
                        exists so this is on the record rather than an anonymous download. Your
                        files are below; you don&apos;t have to wait for an email to get them.
                      </>
                    ) : (
                      <>
                        It is held against {result.email} for{" "}
                        <strong>
                          {result.currency} {result.amountTotal.toLocaleString("en-GB")}
                        </strong>
                        . Nothing has been charged yet and nothing is released yet — I&apos;ll be
                        in touch with payment details, and the moment payment clears the files
                        appear in your account.
                      </>
                    )}
                  </p>
                  <p className="t-body max-w-[520px]">
                    {account ? (
                      <>
                        It&apos;s in{" "}
                        <Link href="/account" className="underline underline-offset-4">
                          your account
                        </Link>{" "}
                        too, with everything else you own.
                      </>
                    ) : (
                      <>
                        <Link
                          href="/account/login"
                          className="underline underline-offset-4"
                        >
                          Create an account
                        </Link>{" "}
                        with this same email and this order — and its files — will be waiting
                        there.
                      </>
                    )}
                  </p>
                </div>

                {result.skipped.length > 0 && (
                  <div className="flex w-full max-w-[560px] flex-col gap-2 border-l-[3px] border-black pl-3">
                    {result.skipped.map((s) => (
                      <p key={s.title} className="t-body">
                        <strong>{s.title}</strong> wasn&apos;t added — {s.reason}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex w-full max-w-[620px] flex-col gap-6">
                  {result.items.map((item) => (
                    <div
                      key={item.slug}
                      className="flex w-full flex-col items-start gap-3 border-b border-black/20 pb-5"
                    >
                      <div className="flex w-full items-baseline justify-between gap-4">
                        <span className="t-h5">{item.title}</span>
                        <span className="t-body-s">{item.kind}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {item.downloadUrl && (
                          <a
                            href={item.downloadUrl}
                            className="t-button bg-black px-6 py-4 text-white"
                            download
                          >
                            Download {item.deliverableName ?? "your file"} ↓
                          </a>
                        )}
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="t-button flex items-center gap-[3px] border border-black px-6 py-4 text-black"
                        >
                          {item.linkLabel}
                          <ArrowUpRight color="rgb(0, 0, 0)" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/products" className="t-body underline underline-offset-4">
                  Back to products
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
