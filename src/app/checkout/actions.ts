"use server";

import {
  alreadyOrderedProductIds,
  findOrCreatePartner,
  placeOrder as writeOrder,
  readOrderForConfirmation,
  verifyPaystackPayment,
  type OrderLine,
} from "@/lib/checkout/orders";
import { createDownloadToken } from "@/lib/checkout/signing";
import { getProducts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PRODUCTS, type Product } from "@/lib/products";
import { isCheckoutConfigured } from "@/lib/odoo/config";
import { getSession } from "@/lib/auth/session";

/**
 * The one server action behind the cart checkout.
 *
 * The browser sends slugs and quantities. Everything else — whether a
 * product may be sold, what it costs, how many one cart may hold, whether
 * this customer has already had it — is re-read here from Odoo. A tampered
 * cart can therefore change what someone asks for, never what they get or
 * what it costs.
 */

export type OrderedItem = {
  slug: string;
  title: string;
  kind: string;
  quantity: number;
  /** Signed, expiring link to this product's file, if it has one. */
  downloadUrl: string | null;
  deliverableName: string | null;
  /** Marketplace link, always. */
  link: string;
  linkLabel: string;
};

export type OrderResult =
  | {
      ok: true;
      confirmed: true;
      reference: string;
      email: string;
      items: OrderedItem[];
      /** Lines dropped because this customer already has them. */
      skipped: Array<{ title: string; reason: string }>;
      amountTotal: number;
      /** amountTotal before tax — the difference is shown as tax. */
      amountUntaxed: number;
      currency: string;
    }
  | {
      ok: true;
      confirmed: false;
      /** Everything the browser needs to open Paystack's own inline modal
       *  right here — no redirect to anywhere else. See CheckoutFlow. */
      orderId: number;
      reference: string;
      amountMinor: number;
      currencyCode: string;
      email: string;
      publicKey: string;
    }
  | { ok: false; error: string };

export type CartSubmission = {
  lines: Array<{ slug: string; quantity: number }>;
  name: string;
  email: string;
  context: string;
  marketingOptIn: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function placeOrder(input: CartSubmission): Promise<OrderResult> {
  // A signed-in customer's identity comes from the session cookie, not the
  // form: it is the one thing on this page they should not be able to
  // change, or one account could place orders against another's contact.
  const session = await getSession();
  const name = session?.name ?? input.name?.trim() ?? "";
  const email = session?.email ?? input.email?.trim() ?? "";

  if (name.length < 2) return { ok: false, error: "Please give a name we can address you by." };
  if (!EMAIL.test(email)) return { ok: false, error: "That email address doesn't look right." };
  if (!input.lines?.length) return { ok: false, error: "Your cart is empty." };

  const catalogue = await withOdooFallback("getProducts", getProducts, PRODUCTS);

  // Resolve the cart against the live catalogue, clamping every quantity to
  // the product's own limit and dropping anything that no longer exists or
  // is no longer for sale.
  const resolved = input.lines
    .map((line) => {
      const product = catalogue.find((p) => p.slug === line.slug);
      if (!product || !product.purchasable) return null;
      const quantity = Math.max(1, Math.min(Math.floor(line.quantity), product.maxQuantity));
      return { product, quantity };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (resolved.length === 0) {
    return { ok: false, error: "Nothing in your cart is available to order any more." };
  }

  // What this costs, from Odoo's price field — not from anything written
  // into a description, and not from anything the browser sent.
  const total = resolved.reduce((sum, r) => sum + r.product.priceValue * r.quantity, 0);
  const currency = resolved.find((r) => r.product.currency)?.product.currency ?? "";
  const isFree = total <= 0;

  // A local dry run, so the flow can be walked end to end without writing
  // to the real database. Never available in production.
  const dryRun =
    process.env.NODE_ENV !== "production" && process.env.CHECKOUT_DEV_STUB === "1";

  if (!dryRun && !isCheckoutConfigured) {
    return {
      ok: false,
      error:
        "Ordering is not available right now. Please use the marketplace link on the product page.",
    };
  }

  try {
    const partnerId = dryRun
      ? 0
      : session?.partnerId ??
        (await findOrCreatePartner({
          name,
          email,
          context: input.context,
          marketingOptIn: input.marketingOptIn,
        }));

    // "One per customer" is enforced here, against what Odoo says this
    // person has actually been given before — not against anything the
    // browser remembers, so clearing storage or switching device does not
    // get a second copy.
    const limited = resolved.filter((r) => r.product.oncePerCustomer);
    const alreadyHave = dryRun
      ? new Set<number>()
      : await alreadyOrderedProductIds(
          partnerId,
          limited.map((r) => r.product.productId)
        );

    const skipped: Array<{ title: string; reason: string }> = [];
    const toOrder = resolved.filter((r) => {
      if (r.product.oncePerCustomer && alreadyHave.has(r.product.productId)) {
        skipped.push({
          title: r.product.title,
          reason: "You already have this one — it's one per customer.",
        });
        return false;
      }
      return true;
    });

    if (toOrder.length === 0) {
      return {
        ok: false,
        error:
          "You already have everything in this cart. Check your earlier confirmation email, or get in touch and I'll re-send the files.",
      };
    }

    const lines: OrderLine[] = toOrder.map((r) => ({
      productId: r.product.productId,
      title: r.product.title,
      quantity: r.quantity,
    }));

    if (dryRun && !isFree) {
      return { ok: false, error: "The dev checkout stub only supports free orders." };
    }

    // A free order is confirmed on the spot. A priced one stays a draft in
    // Odoo, but the customer never sees that — see createPaystackTransaction
    // in lib/checkout/orders: this returns everything the browser needs to
    // open Paystack's own inline modal right here, on this page.
    const order = dryRun
      ? {
          reference: `S${String(Date.now()).slice(-5)}`,
          orderId: 0,
          partnerId: 0,
          amountTotal: total,
          amountUntaxed: total,
          confirmed: true,
          payment: null,
        }
      : await writeOrder(
          lines,
          { name, email, context: input.context, marketingOptIn: input.marketingOptIn },
          partnerId,
          isFree
        );

    if (order.confirmed) {
      const items: OrderedItem[] = toOrder.map((r) => ({
        slug: r.product.slug,
        title: r.product.title,
        kind: r.product.kind,
        quantity: r.quantity,
        downloadUrl: r.product.deliverable
          ? `/api/download?token=${encodeURIComponent(
              createDownloadToken(order.reference, r.product.deliverable.attachmentId)
            )}`
          : null,
        deliverableName: r.product.deliverable?.name ?? null,
        link: r.product.link,
        linkLabel: r.product.linkLabel,
      }));

      return {
        ok: true,
        confirmed: true,
        reference: order.reference,
        email,
        items,
        skipped,
        amountTotal: order.amountTotal,
        amountUntaxed: order.amountUntaxed,
        currency,
      };
    }

    if (!order.payment) {
      return {
        ok: false,
        error:
          "Your order is saved, but payment could not be started. Please try again, or get in touch and I'll sort out payment directly.",
      };
    }

    return {
      ok: true,
      confirmed: false,
      orderId: order.orderId,
      reference: order.payment.reference,
      amountMinor: order.payment.amountMinor,
      currencyCode: order.payment.currencyCode,
      email,
      publicKey: order.payment.publicKey,
    };
  } catch (err) {
    console.warn("[checkout] order failed:", err);
    return {
      ok: false,
      error: "Something went wrong placing that order. Please try again in a moment.",
    };
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The second half of a paid checkout: called once Paystack's own inline
 * modal reports success, to verify the payment and, only if that
 * verification actually says so, confirm the order and release the files.
 *
 * The modal's own callback is never treated as proof of payment — it is
 * only the cue to check. verifyPaystackPayment() re-fetches the transaction
 * from Paystack itself using the secret key (which lives only in this
 * deployment's environment, not in Odoo — see lib/checkout/paystack), and
 * readOrderForConfirmation() then reads back what actually happened, which
 * is the only thing this function trusts.
 *
 * That confirmation isn't always instant: the verify call to Paystack is a
 * network round trip, and the order can equally land as confirmed via
 * Paystack's webhook arriving a moment later rather than via this call at
 * all. Checking exactly once, immediately, caught that gap in testing — a
 * payment that had genuinely gone through still got told back "wasn't
 * confirmed", which is a worse outcome than a slower success screen. So
 * this gives it a few seconds and a few tries before it will actually
 * report a failure.
 */
export async function confirmPaystackPayment(
  orderId: number,
  reference: string
): Promise<OrderResult> {
  try {
    let order = await verifyPaystackPayment(reference, orderId).then(() =>
      readOrderForConfirmation(orderId)
    );

    for (let attempt = 0; !order?.confirmed && attempt < 5; attempt++) {
      await sleep(1500);
      order = await verifyPaystackPayment(reference, orderId).then(() =>
        readOrderForConfirmation(orderId)
      );
    }

    if (!order || !order.confirmed) {
      return {
        ok: false,
        error:
          "Payment wasn't confirmed yet. If you were charged, get in touch and I'll sort it out — nothing will be double-charged.",
      };
    }

    const catalogue = await withOdooFallback("getProducts", getProducts, PRODUCTS);
    const items: OrderedItem[] = order.lines.map((line) => {
      const product = catalogue.find((p: Product) => p.productId === line.productId);
      return {
        slug: product?.slug ?? "",
        title: product?.title ?? "Item",
        kind: product?.kind ?? "",
        quantity: line.quantity,
        downloadUrl: product?.deliverable
          ? `/api/download?token=${encodeURIComponent(
              createDownloadToken(order.reference, product.deliverable.attachmentId)
            )}`
          : null,
        deliverableName: product?.deliverable?.name ?? null,
        link: product?.link ?? "",
        linkLabel: product?.linkLabel ?? "View",
      };
    });

    return {
      ok: true,
      confirmed: true,
      reference: order.reference,
      email: order.partnerEmail,
      items,
      skipped: [],
      amountTotal: order.amountTotal,
      amountUntaxed: order.amountUntaxed,
      currency: order.currencyCode,
    };
  } catch (err) {
    console.warn("[checkout] payment verification failed:", err);
    return {
      ok: false,
      error:
        "Something went wrong confirming that payment. If you were charged, get in touch and I'll sort it out.",
    };
  }
}
