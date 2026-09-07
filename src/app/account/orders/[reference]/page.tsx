import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import { getSession } from "@/lib/auth/session";
import { getOrderForPartnerSafe } from "@/lib/odoo/orders";
import { createDownloadToken } from "@/lib/checkout/signing";

/**
 * /account/orders/[reference] — one order.
 *
 * The reference in the URL is matched inside the set this partner owns, so
 * guessing someone else's reference finds nothing rather than finding
 * theirs. A cancelled order still renders — it is part of the record — but
 * its downloads don't, because a cancelled order is not a sale.
 */
export const metadata: Metadata = {
  title: "Order — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

function formatDate(value: string): string {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/account/login?next=/account/orders/${encodeURIComponent(reference)}`);
  }

  const { order, failed } = await getOrderForPartnerSafe(
    session.partnerId,
    decodeURIComponent(reference)
  );

  // Only 404 when Odoo actually answered and this order is not theirs.
  if (!order && !failed) notFound();

  if (!order) {
    return (
      <PageTemplate>
        <div className="flex w-full flex-col items-center gap-0 p-0">
          <PageHero title="Order">
            <div className="flex min-h-[340px] w-full flex-col items-start justify-center gap-6 border-b border-l border-border bg-yellow p-6">
              <p className="t-h4 max-w-[520px]">
                Your orders can&apos;t be reached at the moment.
              </p>
              <p className="t-body max-w-[520px]">
                Nothing is lost — this is a connection problem, not a missing order. Try again in
                a minute.
              </p>
              <Link href="/account" className="t-button underline underline-offset-4">
                Back to your account
              </Link>
            </div>
          </PageHero>
        </div>
      </PageTemplate>
    );
  }

  const fulfilled = order.state === "sale" || order.state === "done";

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title={order.reference}>
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-10 overflow-hidden border-b border-l border-border bg-yellow p-6">
            <div className="flex flex-col items-start gap-3">
              <span className="t-button">Status</span>
              <p className="t-h4">{order.status}</p>
              <p className="t-body">
                {fulfilled
                  ? "Everything on this order is yours. The files are below."
                  : order.state === "cancel"
                    ? "This order was cancelled, so nothing on it is available to download."
                    : "This order hasn't been confirmed yet."}
              </p>
            </div>
            <Link href="/account" className="t-button underline underline-offset-4">
              All orders
            </Link>
          </div>

          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-10 overflow-hidden bg-black p-6 text-white">
            <div className="flex w-full flex-col gap-[14px]">
              <div className="flex w-full items-center justify-between gap-6 border-b border-border pb-[14px]">
                <span className="t-body">Order</span>
                <span className="t-body">{order.reference}</span>
              </div>
              <div className="flex w-full items-center justify-between gap-6 border-b border-border pb-[14px]">
                <span className="t-body">Placed</span>
                <span className="t-body">{formatDate(order.date)}</span>
              </div>
              <div className="flex w-full items-center justify-between gap-6 border-b border-border pb-[14px]">
                <span className="t-body">Items</span>
                <span className="t-body">
                  {order.lines.reduce((n, l) => n + l.quantity, 0)}
                </span>
              </div>
              <div className="flex w-full items-center justify-between gap-6 pb-[14px]">
                <span className="t-body">Total</span>
                <span className="t-body">
                  {order.amountTotal === 0
                    ? "Free"
                    : `${order.amountTotal.toFixed(2)} ${order.currency}`}
                </span>
              </div>
            </div>
          </div>
        </PageHero>

        {/* The lines */}
        <section className="flex w-full flex-col items-start gap-8 border-b border-border bg-white p-6 desktop:p-10">
          <div className="flex items-center gap-[6px]">
            <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
            <h2 className="t-button">What&apos;s on this order</h2>
          </div>

          <div className="flex w-full flex-col gap-8">
            {order.lines.map((line) => {
              const product = line.product;
              const downloadUrl =
                fulfilled && product?.deliverable
                  ? `/api/download?token=${encodeURIComponent(
                      createDownloadToken(order.reference, product.deliverable.attachmentId)
                    )}`
                  : null;

              return (
                <article
                  key={line.id}
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
                      Qty {line.quantity} ·{" "}
                      {line.priceSubtotal === 0 ? "Free" : line.priceSubtotal.toFixed(2)}
                      {product?.oncePerCustomer
                        ? " · One per customer"
                        : product
                          ? " · Can be ordered again"
                          : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {downloadUrl && (
                      <a
                        href={downloadUrl}
                        download
                        className="t-button bg-black px-5 py-3 text-white"
                      >
                        Download {product?.deliverable?.name ?? "file"} ↓
                      </a>
                    )}
                    {product && fulfilled && (
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
        </section>
      </div>
    </PageTemplate>
  );
}
