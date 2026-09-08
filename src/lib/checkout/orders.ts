import "server-only";
import { randomUUID } from "node:crypto";
import { ODOO_URL, ODOO_WRITE_API_KEY, isCheckoutConfigured } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";

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
 * Opens a Paystack payment.transaction for this order and returns what the
 * browser needs to pay it — no redirect, no Odoo portal page in between.
 *
 * There is no quotation step here on purpose: this site never sends anyone
 * to Odoo's own order/portal view. The transaction is created directly
 * (`create` — an ordinary public method), Paystack's own inline widget
 * takes the payment right on this page using only the public key (not a
 * secret), and a later verify call is what confirms it — see
 * verifyPaystackPayment() and the `/payment/paystack/return` controller in
 * odoo/addons/payment_paystack, which holds the one copy of the secret key
 * and is the only thing that decides whether money actually moved.
 *
 * The transaction still needs to exist in Odoo *before* the modal opens:
 * verification works by looking up a payment.transaction by reference, so
 * the reference handed to Paystack's widget has to be one Odoo already
 * knows about.
 */
async function createPaystackTransaction(
  orderId: number,
  partnerId: number,
  amountTotal: number
): Promise<PaystackPaymentInit | null> {
  try {
    const [order] = await callJson2<Array<{ currency_id: [number, string] | false }>>(
      "sale.order",
      "read",
      { ids: [orderId], fields: ["currency_id"] },
      ODOO_WRITE_API_KEY
    );
    if (!order?.currency_id) return null;
    const [currencyId, currencyCode] = order.currency_id;

    const [provider] = await callJson2<Array<{ id: number; paystack_public_key: string | false }>>(
      "payment.provider",
      "search_read",
      {
        domain: [
          ["code", "=", "paystack"],
          ["state", "in", ["enabled", "test"]],
        ],
        fields: ["id", "paystack_public_key"],
        limit: 1,
      },
      ODOO_WRITE_API_KEY
    );
    if (!provider?.paystack_public_key) return null;

    // The specific payment method recorded against the transaction barely
    // matters here — Paystack's own widget handles method choice (card,
    // M-Pesa, bank transfer, ...) on its side regardless of this value.
    // It only has to be *a* method Odoo already links to this provider.
    const [method] = await callJson2<Array<{ id: number }>>(
      "payment.method",
      "search_read",
      { domain: [["code", "=", "card"]], fields: ["id"], limit: 1 },
      ODOO_WRITE_API_KEY
    );
    if (!method) return null;

    const reference = `kakitahi-${randomUUID()}`;

    await callJson2(
      "payment.transaction",
      "create",
      {
        vals_list: [
          {
            provider_id: provider.id,
            payment_method_id: method.id,
            reference,
            amount: amountTotal,
            currency_id: currencyId,
            partner_id: partnerId,
            operation: "online_redirect",
            sale_order_ids: [[6, 0, [orderId]]],
          },
        ],
      },
      ODOO_WRITE_API_KEY
    );

    return {
      reference,
      amountMinor: Math.round(amountTotal * CURRENCY_MINOR_UNITS),
      currencyCode,
      publicKey: provider.paystack_public_key,
    };
  } catch (err) {
    console.warn("[odoo] could not open a Paystack transaction:", err);
    return null;
  }
}

/**
 * Tells Odoo to verify a Paystack payment and, if it is genuine, apply it.
 *
 * This is a plain GET against the module's own public controller
 * (`/payment/paystack/return`, auth='public') — the exact route Paystack's
 * hosted redirect would have hit, just called directly instead of via a
 * browser navigation. It re-fetches the transaction from Paystack itself
 * using the secret key (which lives only in Odoo) rather than trusting
 * whatever the browser's success callback said, and — because the
 * transaction carries this order in `sale_order_ids` — Odoo's own
 * payment/sale bridge (`_check_amount_and_confirm_order`) confirms the
 * order the moment the transaction reaches "done".
 *
 * This call's own success or failure is not the verdict: whether the order
 * actually got confirmed is checked separately afterwards, by reading it
 * back — never by trusting that this request merely completed.
 */
export async function verifyPaystackPayment(reference: string): Promise<void> {
  if (!ODOO_URL) return;
  try {
    const res = await fetch(
      `${ODOO_URL}/payment/paystack/return?reference=${encodeURIComponent(reference)}`,
      { method: "GET", redirect: "manual", cache: "no-store" }
    );
    // A redirect (Odoo's controller always sends one, success or not) means
    // the request was actually handled; anything else means it wasn't, and
    // whatever confirms the order next is whatever Paystack's webhook does
    // on its own — this is best-effort, not the only path to confirmation.
    if (res.status < 300 || res.status >= 400) {
      console.warn("[odoo] Paystack verify call returned unexpected status:", res.status);
    }
  } catch (err) {
    console.warn("[odoo] Paystack verify call failed:", err);
  }
}

export type ConfirmedOrder = {
  reference: string;
  confirmed: boolean;
  amountTotal: number;
  /** amountTotal before tax. */
  amountUntaxed: number;
  currencyCode: string;
  partnerEmail: string;
  lines: Array<{ productId: number; quantity: number }>;
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

  const [partner] = await callJson2<Array<{ email: string | false }>>(
    "res.partner",
    "read",
    { ids: [order.partner_id[0]], fields: ["email"] },
    ODOO_WRITE_API_KEY
  );

  const orderLines = await callJson2<Array<{ product_id: [number, string] | false; product_uom_qty: number }>>(
    "sale.order.line",
    "search_read",
    {
      domain: [["order_id", "=", orderId]],
      fields: ["product_id", "product_uom_qty"],
      limit: 200,
    },
    ODOO_WRITE_API_KEY
  );

  return {
    reference: order.name,
    confirmed: order.state === "sale" || order.state === "done",
    amountTotal: order.amount_total,
    amountUntaxed: order.amount_untaxed,
    currencyCode: Array.isArray(order.currency_id) ? order.currency_id[1] : "",
    partnerEmail: partner?.email || "",
    lines: orderLines
      .filter((l): l is typeof l & { product_id: [number, string] } => Array.isArray(l.product_id))
      .map((l) => ({ productId: l.product_id[0], quantity: l.product_uom_qty })),
  };
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
      confirm || amountTotal <= 0
        ? null
        : await createPaystackTransaction(orderId, partnerId, amountTotal),
  };
}
