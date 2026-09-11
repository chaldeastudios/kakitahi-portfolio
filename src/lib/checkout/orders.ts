import "server-only";
import { ODOO_WRITE_API_KEY, isCheckoutConfigured } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";
import { getProducts } from "@/lib/odoo/content";
import type { Product } from "@/lib/products";
import {
  isPaystackConfigured,
  paystackReference,
  parseOrderIdFromReference,
  verifyPaystackTransaction,
  PAYSTACK_PUBLIC_KEY,
} from "./paystack";
import { sendOrderConfirmationEmail } from "./receipt-email";

/**
 * The Odoo side of the cart checkout.
 *
 * Everything here is driven by whatever the cart resolved to — any number
 * of lines, any product, nothing named in code. Adding a product to Odoo is
 * the whole of adding it to the shop.
 *
 * A free order is confirmed on the spot: action_confirm() right after
 * create, same turn. A priced order gets the same sale.order, but stays a
 * draft until it is actually paid — see createPaystackTransaction() and
 * verifyPaystackPayment() below for how that happens without ever routing
 * the customer through Odoo's own order/portal page first.
 *
 * Either way it ends up an ordinary confirmed sale.order against an
 * ordinary res.partner, exactly what a paid order would be, so Sales
 * reporting, the mailing lists in Email Marketing, and any automation on
 * sale.order see a free download and a paid one alike.
 *
 * Inventory is deliberately not consulted. These are non-storable service
 * products in Odoo — there is no stock to check and nothing to run out of.
 *
 * Paystack itself is not an Odoo module here. Odoo Online (this site's
 * Enterprise backend) can't install custom Python code, so payment_paystack
 * — still running, unmodified, against the self-hosted database — is no
 * longer on the live path. What's below talks to Paystack's own API
 * directly (see ./paystack) and confirms the sale.order the same way a free
 * order is confirmed, once Paystack itself says the money moved.
 */

export type CheckoutDetails = {
  name: string;
  email: string;
  /** Free-text "what are you building?" — stored on the order, not required. */
  context?: string;
  /** Explicit opt-in. False means the partner is left as it was. */
  marketingOptIn: boolean;
};

/** One line as the server resolved it — never as the browser described it. */
export type OrderLine = {
  productId: number;
  title: string;
  quantity: number;
};

export type PlacedOrder = {
  /** Odoo's own order reference, e.g. "S00011". */
  reference: string;
  orderId: number;
  partnerId: number;
  /** What Odoo priced it at, once its own pricelist had its say. */
  amountTotal: number;
  /** amountTotal before tax — the difference is what the confirmation shows as tax. */
  amountUntaxed: number;
  /** False when a payment is still needed. */
  confirmed: boolean;
  /**
   * Everything the browser needs to open Paystack's own inline payment
   * modal directly on this page. Present only on an unconfirmed, priced
   * order. See createPaystackTransaction().
   */
  payment: PaystackPaymentInit | null;
};

/** What the browser needs to open Paystack's inline modal for one order. */
export type PaystackPaymentInit = {
  /** The payment.transaction reference; Paystack echoes it back on success. */
  reference: string;
  /** The amount in Paystack's minor unit (kobo/cents/pesewas — always ×100). */
  amountMinor: number;
  currencyCode: string;
  /** Paystack's public key. Not a secret — safe in the browser. */
  publicKey: string;
};

type PartnerRow = { id: number };

const CURRENCY_MINOR_UNITS = 100;

/**
 * Prepares what the browser needs to open Paystack's inline modal for this
 * order — no redirect, no Odoo write, nothing that has to exist anywhere
 * before the modal opens. The reference alone is enough: it encodes the
 * order id (see paystackReference()), which is what lets verification and
 * the webhook find their way back to this order later without any record
 * of the attempt having to be created up front.
 */
async function createPaystackTransaction(
  orderId: number,
  amountTotal: number
): Promise<PaystackPaymentInit | null> {
  if (!isPaystackConfigured) return null;
  try {
    const [order] = await callJson2<Array<{ currency_id: [number, string] | false }>>(
      "sale.order",
      "read",
      { ids: [orderId], fields: ["currency_id"] },
      ODOO_WRITE_API_KEY
    );
    if (!order?.currency_id) return null;
    const [, currencyCode] = order.currency_id;

    return {
      reference: paystackReference(orderId),
      amountMinor: Math.round(amountTotal * CURRENCY_MINOR_UNITS),
      currencyCode,
      publicKey: PAYSTACK_PUBLIC_KEY,
    };
  } catch (err) {
    console.warn("[paystack] could not prepare a payment for order", orderId, err);
    return null;
  }
}

/**
 * Asks Paystack itself whether this payment went through and, if it did,
 * confirms the order — the same action_confirm a free order gets, just
 * gated on Paystack's word instead of nothing.
 *
 * Three things have to hold before an order is confirmed, none of them
 * taken on trust from the caller:
 *
 *   - the reference has to verify as "success" against Paystack's API,
 *     using the secret key, which is the only way to know money actually
 *     moved (a browser callback or an unauthenticated webhook body is not
 *     enough on its own);
 *   - the reference's own embedded order id has to match the orderId this
 *     call was given, so a reference that succeeded for someone else's
 *     order can't be replayed against this one;
 *   - the amount Paystack verified has to match what Odoo says this order
 *     actually costs, so a tampered client-side amount can't buy an
 *     underpriced order.
 *
 * Called from both paths that can learn a payment succeeded: the browser's
 * own callback (checkout/actions.ts) and the Paystack webhook, so a closed
 * tab still ends in a confirmed order. Both are best-effort by design —
 * whether the order is actually confirmed is always checked afterwards by
 * reading it back, never by trusting that this call merely completed.
 */
export async function verifyPaystackPayment(reference: string, orderId: number): Promise<void> {
  if (!isPaystackConfigured) return;
  if (parseOrderIdFromReference(reference) !== orderId) {
    console.warn("[paystack] reference does not belong to this order:", reference, orderId);
    return;
  }
  try {
    const verification = await verifyPaystackTransaction(reference);
    if (!verification || verification.status !== "success") return;

    const [order] = await callJson2<Array<{ id: number; state: string; amount_total: number }>>(
      "sale.order",
      "read",
      { ids: [orderId], fields: ["id", "state", "amount_total"] },
      ODOO_WRITE_API_KEY
    );
    // Already confirmed (the browser callback and the webhook can both
    // land) or the order no longer exists — either way, nothing to do.
    if (!order || order.state === "sale" || order.state === "done") return;

    const expectedMinor = Math.round(order.amount_total * CURRENCY_MINOR_UNITS);
    if (verification.amount !== expectedMinor) {
      console.warn(
        "[paystack] amount mismatch for order",
        orderId,
        "— expected",
        expectedMinor,
        "got",
        verification.amount
      );
      return;
    }

    try {
      await callJson2("sale.order", "action_confirm", { ids: [orderId] }, ODOO_WRITE_API_KEY);
    } catch {
      await callJson2(
        "sale.order",
        "write",
        { ids: [orderId], vals: { state: "sale" } },
        ODOO_WRITE_API_KEY
      );
    }
    await notifyOrderConfirmed(orderId);
  } catch (err) {
    console.warn("[paystack] verify failed for order", orderId, err);
  }
}

export type ConfirmedOrder = {
  orderId: number;
  reference: string;
  confirmed: boolean;
  amountTotal: number;
  /** amountTotal before tax. */
  amountUntaxed: number;
  currencyCode: string;
  partnerName: string;
  partnerEmail: string;
  /** Pre-tax — the lines sum to amountUntaxed, same as amountTotal breaks
   *  down into amountUntaxed + tax. Showing a tax-inclusive line next to a
   *  separate tax row would double the tax the moment someone adds them up. */
  lines: Array<{ productId: number; quantity: number; lineSubtotal: number }>;
};

/** Re-reads an order after a payment attempt, to see what actually happened. */
export async function readOrderForConfirmation(orderId: number): Promise<ConfirmedOrder | null> {
  const [order] = await callJson2<
    Array<{
      name: string;
      state: string;
      amount_total: number;
      amount_untaxed: number;
      currency_id: [number, string] | false;
      partner_id: [number, string] | false;
    }>
  >(
    "sale.order",
    "read",
    {
      ids: [orderId],
      fields: ["name", "state", "amount_total", "amount_untaxed", "currency_id", "partner_id"],
    },
    ODOO_WRITE_API_KEY
  );
  if (!order || !order.partner_id) return null;

  const [partner] = await callJson2<Array<{ name: string | false; email: string | false }>>(
    "res.partner",
    "read",
    { ids: [order.partner_id[0]], fields: ["name", "email"] },
    ODOO_WRITE_API_KEY
  );

  const orderLines = await callJson2<
    Array<{ product_id: [number, string] | false; product_uom_qty: number; price_subtotal: number }>
  >(
    "sale.order.line",
    "search_read",
    {
      domain: [["order_id", "=", orderId]],
      fields: ["product_id", "product_uom_qty", "price_subtotal"],
      limit: 200,
    },
    ODOO_WRITE_API_KEY
  );

  return {
    orderId,
    reference: order.name,
    confirmed: order.state === "sale" || order.state === "done",
    amountTotal: order.amount_total,
    amountUntaxed: order.amount_untaxed,
    currencyCode: Array.isArray(order.currency_id) ? order.currency_id[1] : "",
    partnerName: partner?.name || "",
    partnerEmail: partner?.email || "",
    lines: orderLines
      .filter((l): l is typeof l & { product_id: [number, string] } => Array.isArray(l.product_id))
      .map((l) => ({
        productId: l.product_id[0],
        quantity: l.product_uom_qty,
        lineSubtotal: l.price_subtotal,
      })),
  };
}

/**
 * The one call site both confirmation paths share — a free order
 * confirming itself in placeOrder() below, and a paid one confirming in
 * verifyPaystackPayment() above — so the confirmation email is sent
 * exactly once, from exactly one place, regardless of which path actually
 * got there. Re-reads the order rather than trusting the caller's own
 * copy of it, since it needs the full shape (lines, partner) that neither
 * caller already has in hand.
 *
 * Best-effort: an email that fails to send is a real gap worth knowing
 * about (hence the console.warn deep in sendOrderConfirmationEmail), but
 * it is never a reason to fail an order that Odoo has already confirmed.
 *
 * The order read and the catalogue read are two separate try/catches, not
 * one Promise.all: the catalogue is only used to add titles and download
 * links to an email that's going out either way, so a catalogue fetch that
 * fails on its own (Odoo Online's rate limit is a real, observed cause —
 * see the README "Odoo integration" trade-off note) degrades to a plainer
 * email instead of silently cancelling it outright.
 */
async function notifyOrderConfirmed(orderId: number): Promise<void> {
  let order: ConfirmedOrder | null;
  try {
    order = await readOrderForConfirmation(orderId);
  } catch (err) {
    console.warn("[checkout] could not read order for confirmation email", orderId, err);
    return;
  }
  if (!order || !order.confirmed) return;

  let catalogue: Product[] = [];
  try {
    catalogue = await getProducts();
  } catch (err) {
    console.warn(
      "[checkout] could not load the catalogue for the confirmation email — sending it without item titles/download links",
      orderId,
      err
    );
  }

  await sendOrderConfirmationEmail(order, catalogue);
}

/** Find the contact for this email, or make one. */
export async function findOrCreatePartner(details: CheckoutDetails): Promise<number> {
  const email = details.email.trim().toLowerCase();

  const existing = await callJson2<PartnerRow[]>(
    "res.partner",
    "search_read",
    { domain: [["email", "=ilike", email]], fields: ["id"], limit: 1 },
    ODOO_WRITE_API_KEY
  );

  if (existing.length) {
    // Don't overwrite a name someone may have curated in Odoo; only ever
    // relax the opt-out, and only when they have just asked for it.
    if (details.marketingOptIn) {
      await callJson2(
        "res.partner",
        "write",
        { ids: [existing[0].id], vals: { is_blacklisted: false } },
        ODOO_WRITE_API_KEY
      ).catch(() => undefined);
    }
    return existing[0].id;
  }

  const created = await callJson2<number | number[]>(
    "res.partner",
    "create",
    {
      vals_list: [
        {
          name: details.name.trim(),
          email,
          company_type: "person",
          comment: details.context?.trim() || false,
        },
      ],
    },
    ODOO_WRITE_API_KEY
  );

  return Array.isArray(created) ? created[0] : created;
}

/**
 * Which of these products this partner has already been given, on any order
 * that was actually placed (draft quotations don't count; cancelled ones
 * don't either).
 *
 * This is the enforcement point for "one per customer". It is a live query
 * rather than anything held on the site, so it holds however the person
 * comes back — new device, cleared storage, a different browser — because
 * the identity that matters is the email, and the record is Odoo's.
 */
export async function alreadyOrderedProductIds(
  partnerId: number,
  productIds: number[]
): Promise<Set<number>> {
  if (!partnerId || productIds.length === 0) return new Set();

  const lines = await callJson2<Array<{ product_id: [number, string] | false }>>(
    "sale.order.line",
    "search_read",
    {
      domain: [
        ["order_id.partner_id", "=", partnerId],
        ["order_id.state", "in", ["sale", "done"]],
        ["product_id", "in", productIds],
      ],
      fields: ["product_id"],
      limit: 200,
    },
    ODOO_WRITE_API_KEY
  );

  return new Set(
    lines.map((l) => (Array.isArray(l.product_id) ? l.product_id[0] : 0)).filter(Boolean)
  );
}

/**
 * Places the order. `productId` is a product.product id.
 *
 * Two things here are deliberate:
 *
 * Lines carry no price. Odoo computes each one from the product and the
 * customer's pricelist, which is the only way a price change in Odoo can be
 * the price actually charged. A price sent from here would be a copy, and a
 * copy is exactly how a product ends up billed at yesterday's number.
 *
 * `confirm` is false for anything that has to be paid for. A confirmed
 * order is a sale: it releases the downloads and counts as revenue. An
 * unpaid order must stay a quotation until the money arrives, so the site
 * creates it and leaves it there.
 */
export async function placeOrder(
  lines: OrderLine[],
  details: CheckoutDetails,
  partnerId: number,
  confirm: boolean
): Promise<PlacedOrder> {
  if (!isCheckoutConfigured) {
    throw new Error(
      "Checkout is not configured — needs ODOO_URL, ODOO_DB and a key that can write."
    );
  }
  if (lines.length === 0) throw new Error("Nothing to order.");

  const note = [
    details.context?.trim() ? `What they're building: ${details.context.trim()}` : "",
    `Marketing opt-in: ${details.marketingOptIn ? "yes" : "no"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const created = await callJson2<number | number[]>(
    "sale.order",
    "create",
    {
      vals_list: [
        {
          partner_id: partnerId,
          origin: `kakitahi.com — ${lines.map((l) => l.title).join(", ")}`,
          note,
          // No price_unit: Odoo prices the line itself.
          order_line: lines.map((l) => [
            0,
            0,
            { product_id: l.productId, product_uom_qty: l.quantity },
          ]),
        },
      ],
    },
    ODOO_WRITE_API_KEY
  );

  const orderId = Array.isArray(created) ? created[0] : created;

  // Confirm only a free order. A draft order is a quotation, not a sale,
  // and would not reach reporting or the mailing automation this record
  // exists for — but confirming an unpaid one would hand over the goods.
  if (confirm) {
    try {
      await callJson2("sale.order", "action_confirm", { ids: [orderId] }, ODOO_WRITE_API_KEY);
    } catch {
      await callJson2(
        "sale.order",
        "write",
        { ids: [orderId], vals: { state: "sale" } },
        ODOO_WRITE_API_KEY
      );
    }
    await notifyOrderConfirmed(orderId);
  }

  const [order] = await callJson2<
    Array<{ id: number; name: string; amount_total: number; amount_untaxed: number }>
  >(
    "sale.order",
    "read",
    { ids: [orderId], fields: ["id", "name", "amount_total", "amount_untaxed"] },
    ODOO_WRITE_API_KEY
  );

  const amountTotal = order?.amount_total ?? 0;

  return {
    reference: order?.name ?? `SO-${orderId}`,
    orderId,
    partnerId,
    amountTotal,
    amountUntaxed: order?.amount_untaxed ?? amountTotal,
    confirmed: confirm,
    payment:
      confirm || amountTotal <= 0 ? null : await createPaystackTransaction(orderId, amountTotal),
  };
}
