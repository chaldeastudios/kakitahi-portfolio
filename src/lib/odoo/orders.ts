import "server-only";
import { ODOO_WRITE_API_KEY } from "./config";
import { callJson2 } from "./json2";
import { getProducts } from "./content";
import { withOdooFallback } from "./safe";
import { PRODUCTS, type Product } from "@/lib/products";

/**
 * A customer's own order history, read straight out of Odoo.
 *
 * Every query here is scoped to one partner id, and that id comes from the
 * signed session cookie — never from anything the browser asked for. So a
 * customer cannot read another customer's orders by changing a number in a
 * URL: the order reference in the path is matched *within* the set this
 * partner owns, and an order that isn't theirs simply isn't found.
 *
 * Lines are joined back to the site's own product records by product id, so
 * an order row can link to the product page, know whether that product can
 * be bought again, and offer its download. A line whose product is no
 * longer in the catalogue still shows — you bought it, it stays on your
 * record — it just has nothing to link to.
 */

export type OrderLineView = {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  priceSubtotal: number;
  /** The catalogue product, when the line still matches one. */
  product: Product | null;
};

export type OrderView = {
  id: number;
  reference: string;
  /** Odoo's own state: draft / sent / sale / done / cancel. */
  state: string;
  /** That state as something a customer would say. */
  status: string;
  date: string;
  amountTotal: number;
  currency: string;
  lines: OrderLineView[];
};

/** Odoo's states, in customer words. */
function describeState(state: string): string {
  switch (state) {
    case "draft":
    case "sent":
      return "Pending";
    case "sale":
      return "Confirmed";
    case "done":
      return "Complete";
    case "cancel":
      return "Cancelled";
    default:
      return state;
  }
}

type OrderRow = {
  id: number;
  name: string;
  state: string;
  date_order: string;
  amount_total: number;
  currency_id: [number, string] | false;
  order_line: number[];
};

type LineRow = {
  id: number;
  order_id: [number, string];
  product_id: [number, string] | false;
  name: string;
  product_uom_qty: number;
  price_subtotal: number;
};

/**
 * Every order this partner has placed, newest first. Cancelled orders are
 * included deliberately: "where did my order go" is exactly the question an
 * order history exists to answer.
 */
export async function getOrdersForPartner(partnerId: number): Promise<OrderView[]> {
  if (!partnerId) return [];
  return readOrders(partnerId);
}

/**
 * The same read, but never throwing: the account pages use this so an Odoo
 * outage shows "can't reach your orders" on an otherwise working page
 * rather than a 500 that reads, to the person, as being logged out.
 */
export async function getOrdersForPartnerSafe(
  partnerId: number
): Promise<{ orders: OrderView[]; failed: boolean }> {
  try {
    return { orders: await getOrdersForPartner(partnerId), failed: false };
  } catch (err) {
    console.warn("[odoo] could not read orders:", err);
    return { orders: [], failed: true };
  }
}

async function readOrders(partnerId: number): Promise<OrderView[]> {

  const orders = await callJson2<OrderRow[]>(
    "sale.order",
    "search_read",
    {
      domain: [["partner_id", "=", partnerId]],
      fields: ["id", "name", "state", "date_order", "amount_total", "currency_id", "order_line"],
      order: "date_order desc, id desc",
      limit: 100,
    },
    ODOO_WRITE_API_KEY
  );

  if (orders.length === 0) return [];

  const [lines, catalogue] = await Promise.all([
    callJson2<LineRow[]>(
      "sale.order.line",
      "search_read",
      {
        domain: [["order_id", "in", orders.map((o) => o.id)]],
        fields: ["id", "order_id", "product_id", "name", "product_uom_qty", "price_subtotal"],
        order: "id asc",
        limit: 500,
      },
      ODOO_WRITE_API_KEY
    ),
    withOdooFallback("getProducts", getProducts, PRODUCTS),
  ]);

  return orders.map((order) => ({
    id: order.id,
    reference: order.name,
    state: order.state,
    status: describeState(order.state),
    date: order.date_order,
    amountTotal: order.amount_total,
    currency: Array.isArray(order.currency_id) ? order.currency_id[1] : "",
    lines: lines
      .filter((l) => l.order_id?.[0] === order.id)
      .map((l) => {
        const productId = Array.isArray(l.product_id) ? l.product_id[0] : 0;
        return {
          id: l.id,
          productId,
          name: Array.isArray(l.product_id) ? l.product_id[1] : l.name,
          quantity: l.product_uom_qty,
          priceSubtotal: l.price_subtotal,
          product: catalogue.find((p) => p.productId === productId) ?? null,
        };
      }),
  }));
}

/**
 * One order, but only if this partner owns it.
 *
 * `failed` separates the two ways this can come back empty, because they
 * mean opposite things to the person reading: "that order isn't yours"
 * deserves a 404, while "Odoo didn't answer" must not — telling someone
 * their order does not exist because of an outage is the wrong answer.
 */
export async function getOrderForPartnerSafe(
  partnerId: number,
  reference: string
): Promise<{ order: OrderView | null; failed: boolean }> {
  const { orders, failed } = await getOrdersForPartnerSafe(partnerId);
  if (failed) return { order: null, failed: true };
  return { order: orders.find((o) => o.reference === reference) ?? null, failed: false };
}

/**
 * The product ids this partner owns on a placed order — what the product
 * pages use to say "you have this" and to hide Add to Cart on anything
 * limited to one per customer.
 */
export async function getOwnedProductIds(partnerId: number): Promise<Set<number>> {
  if (!partnerId) return new Set();
  try {
    return await readOwnedProductIds(partnerId);
  } catch (err) {
    // A public product page must render whether or not Odoo answers this.
    console.warn("[odoo] could not read owned products:", err);
    return new Set();
  }
}

async function readOwnedProductIds(partnerId: number): Promise<Set<number>> {

  const lines = await callJson2<Array<{ product_id: [number, string] | false }>>(
    "sale.order.line",
    "search_read",
    {
      domain: [
        ["order_id.partner_id", "=", partnerId],
        ["order_id.state", "in", ["sale", "done"]],
      ],
      fields: ["product_id"],
      limit: 500,
    },
    ODOO_WRITE_API_KEY
  );

  return new Set(
    lines.map((l) => (Array.isArray(l.product_id) ? l.product_id[0] : 0)).filter(Boolean)
  );
}
