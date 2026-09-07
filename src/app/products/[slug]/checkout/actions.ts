"use server";

import { placeFreeOrder } from "@/lib/checkout/orders";
import { createDownloadToken } from "@/lib/checkout/signing";
import { getProducts } from "@/lib/odoo/content";
import { withOdooFallback } from "@/lib/odoo/safe";
import { PRODUCTS } from "@/lib/products";
import { isCheckoutConfigured } from "@/lib/odoo/config";

/**
 * The one server action behind the checkout. Everything the browser sends
 * is re-read from Odoo here — the product, its price, its deliverable — so
 * a tampered form can only change the name and email it submits, never what
 * it is ordering or what that costs.
 */

export type OrderResult =
  | {
      ok: true;
      reference: string;
      /** Signed, expiring link to the deliverable. Null when there is none. */
      downloadUrl: string | null;
      deliverableName: string | null;
      email: string;
    }
  | { ok: false; error: string };

export type OrderInput = {
  slug: string;
  name: string;
  email: string;
  context: string;
  marketingOptIn: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";

  if (name.length < 2) return { ok: false, error: "Please give a name we can address you by." };
  if (!EMAIL.test(email)) return { ok: false, error: "That email address doesn't look right." };

  const products = await withOdooFallback("getProducts", getProducts, PRODUCTS);
  const product = products.find((p) => p.slug === input.slug);
  if (!product) return { ok: false, error: "That product no longer exists." };

  // Every product here is free today. If one ever isn't, this is the line
  // that has to change — and it should change to a payment step, not to a
  // silent zero-price order.
  if (product.price.toLowerCase() !== "free") {
    return {
      ok: false,
      error: `${product.title} is no longer free, and this checkout cannot take payment yet.`,
    };
  }

  // A local dry run, so the flow can be walked end to end without writing
  // to the real database. Never available in production, and never on
  // unless someone deliberately sets the flag.
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
    const order = dryRun
      ? { reference: `S${String(Date.now()).slice(-5)}`, orderId: 0, partnerId: 0 }
      : await placeFreeOrder(product.productId, product.title, {
          name,
          email,
          context: input.context,
          marketingOptIn: input.marketingOptIn,
        });

    // The token is minted the same way in a dry run; only the order behind
    // it is fake. That keeps the confirmation screen honest about what a
    // real one looks like.
    const deliverable = product.deliverable;
    const downloadUrl = deliverable
      ? `/api/download?token=${encodeURIComponent(
          createDownloadToken(order.reference, deliverable.attachmentId)
        )}`
      : null;

    return {
      ok: true,
      reference: order.reference,
      downloadUrl,
      deliverableName: deliverable?.name ?? null,
      email,
    };
  } catch (err) {
    console.warn("[checkout] order failed:", err);
    return {
      ok: false,
      error: "Something went wrong placing that order. Please try again in a moment.",
    };
  }
}
