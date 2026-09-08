import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Paystack, called directly — no Odoo module in between.
 *
 * Odoo Online (the Enterprise instance this site now reads from) cannot
 * install custom Python modules, so the payment_paystack Odoo addon (still
 * running against the self-hosted database, untouched) is no longer on the
 * path a live payment takes here. This is its site-side replacement: the
 * inline widget opens with only a public key and an amount (see
 * createPaystackTransaction in ./orders), and everything that decides
 * whether money actually moved happens here, against Paystack's own API,
 * using a secret key that lives only in this deployment's environment.
 *
 * The reference embeds the order id (`kakitahi-<orderId>-<uuid>`) rather
 * than relying solely on Paystack's metadata field to carry it — metadata
 * is attached by the client-side widget and echoed back by Paystack, which
 * is one more thing that could go missing or be tampered with in transit.
 * The reference itself is what Paystack's /transaction/verify and webhook
 * payloads always carry, and parseOrderIdFromReference is also how
 * verifyPaystackPayment (see ./orders) checks that a given reference
 * actually belongs to the order it's being used to confirm.
 */

export const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY ?? "";
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? "";

export const isPaystackConfigured = Boolean(PAYSTACK_PUBLIC_KEY && PAYSTACK_SECRET_KEY);

export function paystackReference(orderId: number): string {
  return `kakitahi-${orderId}-${randomUUID()}`;
}

export function parseOrderIdFromReference(reference: string): number | null {
  const match = /^kakitahi-(\d+)-/.exec(reference);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type PaystackVerifyResult = {
  status: string;
  /** Minor units (kobo/cents/pesewas — ×100), exactly as Paystack returns it. */
  amount: number;
  currency: string;
  reference: string;
};

/**
 * Asks Paystack itself what a transaction actually did. Never trust a
 * browser callback or a webhook body on its own — this is the one call
 * that can't be forged, because it requires the secret key.
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResult | null> {
  if (!PAYSTACK_SECRET_KEY) return null;
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        cache: "no-store",
      }
    );
    const body = (await res.json()) as {
      status?: boolean;
      data?: { status: string; amount: number; currency: string; reference: string };
    };
    if (!res.ok || !body.status || !body.data) return null;
    return {
      status: body.data.status,
      amount: body.data.amount,
      currency: body.data.currency,
      reference: body.data.reference,
    };
  } catch (err) {
    console.warn("[paystack] verify call failed:", err);
    return null;
  }
}

/**
 * Paystack signs every webhook body with HMAC-SHA512 over the raw request
 * body, keyed by the secret key, hex-encoded in the x-paystack-signature
 * header. Constant-time compare so a webhook can't be forged by an
 * attacker who can measure response timing.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!PAYSTACK_SECRET_KEY || !signatureHeader) return false;
  const expected = createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const gotBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== gotBuf.length) return false;
  return timingSafeEqual(expectedBuf, gotBuf);
}
