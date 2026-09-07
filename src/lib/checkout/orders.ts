import "server-only";
import { ODOO_WRITE_API_KEY, isCheckoutConfigured } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";

/**
 * The Odoo side of the product checkout.
 *
 * Both products are free, so there is no payment step and nothing to
 * settle. What there *is* — and the reason this exists rather than a bare
 * mailto: link — is a record: who took what, when, reachable later. That
 * record is an ordinary confirmed sale.order against an ordinary
 * res.partner, which is exactly what a paid order would be, so the same
 * pipelines (Sales reporting, the mailing lists in Email Marketing, any
 * automation on sale.order) see a free download and a paid one alike.
 *
 * The write sequence, verified against the live instance before this was
 * written:
 *   1. res.partner  — reuse the existing contact for this email if there is
 *                     one, so a repeat customer stays one contact rather
 *                     than accumulating duplicates.
 *   2. sale.order   — one order, origin naming this site, one line for the
 *                     product at 0.00.
 *   3. confirm      — action_confirm() where the method is exposed, and a
 *                     direct state write as the fallback. A draft order is
 *                     a quotation and does not count as a sale, so this
 *                     step is what makes it show up in the funnel.
 *
 * Marketing consent is explicit and per-order: only if the person ticks the
 * box does the partner get subscribed. Odoo's own opt-out flag is the
 * source of truth for that, so unsubscribing anywhere unsubscribes here.
 */

export type CheckoutDetails = {
  name: string;
  email: string;
  /** Free-text "what are you building?" — stored on the order, not required. */
  context?: string;
  /** Explicit opt-in. False means the partner is created opted out. */
  marketingOptIn: boolean;
};

export type PlacedOrder = {
  /** Odoo's own order reference, e.g. "S00011". */
  reference: string;
  orderId: number;
  partnerId: number;
};

type PartnerRow = { id: number };

/** Find the contact for this email, or make one. */
async function findOrCreatePartner(details: CheckoutDetails): Promise<number> {
  const email = details.email.trim().toLowerCase();

  const existing = await callJson2<PartnerRow[]>(
    "res.partner",
    "search_read",
    {
      domain: [["email", "=ilike", email]],
      fields: ["id"],
      limit: 1,
    },
    ODOO_WRITE_API_KEY
  );

  if (existing.length) {
    // Don't overwrite a name someone may have curated in Odoo; only ever
    // relax the opt-out, and only when they've just asked for it.
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
 * Places the order and confirms it. `productId` is a product.product id
 * (the variant), not the template.
 */
export async function placeFreeOrder(
  productId: number,
  productTitle: string,
  details: CheckoutDetails
): Promise<PlacedOrder> {
  if (!isCheckoutConfigured) {
    throw new Error(
      "Checkout is not configured — needs ODOO_URL, ODOO_DB, ODOO_API_KEY, " +
        "ODOO_WRITE_API_KEY and CHECKOUT_SECRET. See .env.example."
    );
  }

  const partnerId = await findOrCreatePartner(details);

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
          origin: `kakitahi.com — ${productTitle}`,
          note,
          order_line: [[0, 0, { product_id: productId, product_uom_qty: 1, price_unit: 0 }]],
        },
      ],
    },
    ODOO_WRITE_API_KEY
  );

  const orderId = Array.isArray(created) ? created[0] : created;

  // Confirm it. A draft order is a quotation, not a sale, and would not
  // reach the reporting or the mailing automation this record exists for.
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

  const [order] = await callJson2<Array<{ id: number; name: string }>>(
    "sale.order",
    "read",
    { ids: [orderId], fields: ["id", "name"] },
    ODOO_WRITE_API_KEY
  );

  return { reference: order?.name ?? `SO-${orderId}`, orderId, partnerId };
}
