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
 * The products are free, so there is no payment step and nothing to settle.
 * What there *is* — and the reason this exists rather than a bare download
 * link — is a record: who took what, when, reachable later. That record is
 * an ordinary confirmed sale.order against an ordinary res.partner, exactly
 * what a paid order would be, so Sales reporting, the mailing lists in
 * Email Marketing, and any automation on sale.order see a free download and
 * a paid one alike.
 *
 * The write sequence, verified against the live instance:
 *   1. res.partner  — reuse the existing contact for this email, so a
 *                     repeat customer stays one contact.
 *   2. history      — what this customer has already been given, which is
 *                     what makes "one per customer" enforceable.
 *   3. sale.order   — one order, one line per cart line, at 0.00.
 *   4. confirm      — action_confirm(), with a direct state write as the
 *                     fallback. A draft order is a quotation and does not
 *                     count as a sale, so this is what puts it in the funnel.
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
  /** False when it is a quotation awaiting payment. */
  confirmed: boolean;
  /**
   * Odoo's own portal page for this order, where it can be paid. Present
   * only on an unconfirmed, priced order. See paymentUrlFor().
   */
  paymentUrl: string | null;
};

type PartnerRow = { id: number };

type AccessTokenRow = { id: number; access_token: string | false };

/**
 * Where a customer pays for an unconfirmed order.
 *
 * Payment is Odoo's job, not this site's: the Paystack provider lives in
 * Odoo (see odoo/addons/payment_paystack), so the customer is handed to
 * Odoo's own portal page for their order, which offers whichever providers
 * are enabled and confirms the order itself once the money lands. Nothing
 * here holds a payment credential or decides whether a payment succeeded.
 *
 * The portal URL needs the order's access token. Odoo's own portal.mixin
 * generates one lazily via `_portal_ensure_token()` — but that method's
 * leading underscore marks it private, and Odoo's RPC layer refuses to
 * call any method starting with `_` from outside the process
 * (odoo/service/model.py: get_public_method raises "Private methods ...
 * cannot be called remotely"). That was silently caught below and turned
 * into a missing payment link on every priced order.
 *
 * So the same effect — a token exists, one way or another — is reproduced
 * here with only public methods (`read`, `write`), generating the token in
 * the exact same format `_portal_ensure_token` itself would.
 */
async function paymentUrlFor(orderId: number): Promise<string | null> {
  if (!ODOO_URL) return null;
  try {
    const [row] = await callJson2<AccessTokenRow[]>(
      "sale.order",
      "read",
      { ids: [orderId], fields: ["access_token"] },
      ODOO_WRITE_API_KEY
    );

    let accessToken = row?.access_token || "";
    if (!accessToken) {
      accessToken = randomUUID();
      await callJson2(
        "sale.order",
        "write",
        { ids: [orderId], vals: { access_token: accessToken } },
        ODOO_WRITE_API_KEY
      );
    }

    return `${ODOO_URL}/my/orders/${orderId}?access_token=${encodeURIComponent(accessToken)}`;
  } catch (err) {
    console.warn("[odoo] could not build a payment link:", err);
    return null;
  }
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

  const [order] = await callJson2<Array<{ id: number; name: string; amount_total: number }>>(
    "sale.order",
    "read",
    { ids: [orderId], fields: ["id", "name", "amount_total"] },
    ODOO_WRITE_API_KEY
  );

  const amountTotal = order?.amount_total ?? 0;

  return {
    reference: order?.name ?? `SO-${orderId}`,
    orderId,
    partnerId,
    amountTotal,
    confirmed: confirm,
    paymentUrl: confirm || amountTotal <= 0 ? null : await paymentUrlFor(orderId),
  };
}
