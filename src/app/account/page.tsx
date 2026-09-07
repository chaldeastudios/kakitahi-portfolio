import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import { signOutAction } from "./actions";
import { getSession } from "@/lib/auth/session";
import { getOrdersForPartnerSafe, type OrderView } from "@/lib/odoo/orders";
import { createDownloadToken } from "@/lib/checkout/signing";

/**
 * /account — everything this customer has, in one place.
 *
 * Two halves, because they answer two different questions. "Your things" is
 * the one people come back for: every product they own, with its download
 * and its link, gathered across every order so nobody has to remember which
 * order a file came in. "Orders" is the record: reference, date, status,
 * what was on it.
 *
 * Everything is read for the partner id on the session cookie. No order
 * belonging to anyone else can be reached from here, whatever the URL says.
 */
export const metadata: Metadata = {
  title: "Your account — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

function formatDate(value: string): string {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Distinct products across every placed order, newest acquisition first. */
function ownedProducts(orders: OrderView[]) {
  const seen = new Map<
    number,
    { line: OrderView["lines"][number]; order: OrderView }
  >();
  for (const order of orders) {
    if (order.state !== "sale" && order.state !== "done") continue;
    for (const line of order.lines) {
      if (!seen.has(line.productId)) seen.set(line.productId, { line, order });
    }
  }
  return [...seen.values()];
}

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/account/login?next=/account");

  const { orders, failed } = await getOrdersForPartnerSafe(session.partnerId);
  const owned = ownedProducts(orders);

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title="Your account">
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-10 overflow-hidden border-b border-l border-border bg-yellow p-6">
            <div className="flex flex-col items-start gap-2">
              <span className="t-button">Signed in as</span>
              <p className="t-h4">{session.name}</p>
              <p className="t-body">{session.email}</p>
            </div>
            <form action={signOutAction}>
              <button type="submit" className="t-button underline underline-offset-4">
                Sign out
              </button>
            </form>
          </div>

          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-10 overflow-hidden bg-black p-6 text-white">
            <div className="flex w-full flex-col gap-[14px]">
              <div className="flex w-full items-center justify-between gap-6 border-b border-border pb-[14px]">
                <span className="t-body">Orders</span>
                <span className="t-body">{orders.length}</span>
              </div>
              <div className="flex w-full items-center justify-between gap-6 border-b border-border pb-[14px]">
                <span className="t-body">Products owned</span>
                <span className="t-body">{owned.length}</span>
              </div>
            </div>
            <Link href="/products" className="t-button underline underline-offset-4">
              Browse products
            </Link>
          </div>
        </PageHero>

        {/* Your things — what you own, and how to get it */}
        <section className="flex w-full flex-col items-start gap-8 border-b border-border bg-white p-6 desktop:p-10">
          <div className="flex items-center gap-[6px]">
            <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
            <h2 className="t-button">Your things</h2>
          </div>

          {failed ? (
            <p className="t-body max-w-[520px]">
              Your orders can&apos;t be reached at the moment. Nothing is lost — try again in a
              minute.
            </p>
          ) : owned.length === 0 ? (
            <p className="t-body max-w-[520px]">
              Nothing yet. Everything in the shop is free — have a look at what&apos;s there.
            </p>
          ) : (
            <div className="flex w-full flex-col gap-8">
              {owned.map(({ line, order }) => {
                const product = line.product;
                // A fresh, signed link each time this page renders, tied to
                // the order it came on and good for a week.
                const downloadUrl = product?.deliverable
                  ? `/api/download?token=${encodeURIComponent(
                      createDownloadToken(order.reference, product.deliverable.attachmentId)
                    )}`
                  : null;

                return (
                  <article
                    key={line.productId}
                    className="flex w-full flex-col items-start gap-4 border-b border-border pb-8 tablet:flex-row tablet:items-center"
                  >
                    {product?.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].src}
                        alt={product.images[0].alt}
                        className="h-[90px] w-[120px] shrink-0 border border-border bg-lightgrey object-cover"
                      />
                    )}

                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                      <span className="t-body-s">{product?.kind ?? "Product"}</span>
                      {product ? (
                        <Link href={`/products/${product.slug}`} className="t-h5">
                          {product.title}
                        </Link>
                      ) : (
                        <span className="t-h5">{line.name}</span>
                      )}
                      <span className="t-body-s text-lightblack">
                        From order{" "}
                        <Link
                          href={`/account/orders/${encodeURIComponent(order.reference)}`}
                          className="underline underline-offset-4"
                        >
                          {order.reference}
                        </Link>{" "}
                        · {formatDate(order.date)}
                        {product?.oncePerCustomer ? " · One per customer" : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          download
                          className="t-button bg-black px-5 py-3 text-white"
                        >
                          Download ↓
                        </a>
                      )}
                      {product && (
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="t-button border border-black px-5 py-3 text-black"
                        >
                          {product.linkLabel}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Orders — the record */}
        <section className="flex w-full flex-col items-start gap-8 border-b border-border bg-offwhite p-6 desktop:p-10">
          <div className="flex items-center gap-[6px]">
            <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
            <h2 className="t-button">Orders</h2>
          </div>

          {failed ? (
            <p className="t-body max-w-[520px]">Couldn&apos;t load your orders just now.</p>
          ) : orders.length === 0 ? (
            <p className="t-body max-w-[520px]">No orders yet.</p>
          ) : (
            <div className="flex w-full flex-col">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${encodeURIComponent(order.reference)}`}
                  className="flex w-full flex-col gap-2 border-b border-border py-5 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-8"
                >
                  <span className="t-h5 shrink-0">{order.reference}</span>
                  <span className="t-body min-w-0 flex-1 truncate">
                    {order.lines.map((l) => l.name).join(", ")}
                  </span>
                  <span className="t-body-s shrink-0">{formatDate(order.date)}</span>
                  <span className="t-button flex shrink-0 items-center gap-[6px]">
                    <span
                      aria-hidden="true"
                      className={`block h-[10px] w-[10px] shrink-0 ${
                        order.state === "cancel" ? "border border-black" : "bg-yellow"
                      }`}
                    />
                    {order.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTemplate>
  );
}
