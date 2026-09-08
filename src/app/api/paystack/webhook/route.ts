import { NextResponse } from "next/server";
import { verifyPaystackPayment } from "@/lib/checkout/orders";
import { parseOrderIdFromReference, verifyPaystackWebhookSignature } from "@/lib/checkout/paystack";

/**
 * Paystack's own notification of a payment — the path that confirms an
 * order even if the customer closes the tab before the inline modal's
 * success callback fires (see openPaystackModal in CheckoutFlow, and
 * confirmPaystackPayment in checkout/actions.ts, which is the same
 * verify-then-confirm triggered by the browser instead of by Paystack).
 *
 * The signature header is checked before anything else — a POST here with
 * no valid x-paystack-signature is not from Paystack, whatever it claims.
 * Only `charge.success` is acted on; everything else (failed charges,
 * refunds, subscription events) is acknowledged and ignored, since nothing
 * on this site listens for them.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const reference = event.data.reference;
    const orderId = parseOrderIdFromReference(reference);
    if (orderId) {
      await verifyPaystackPayment(reference, orderId).catch((err) =>
        console.warn("[paystack webhook] verify failed:", err)
      );
    }
  }

  // Paystack only cares that this returned 2xx; the actual outcome is
  // whatever verifyPaystackPayment did, checked independently by anyone
  // polling the order rather than by anything in this response.
  return NextResponse.json({ ok: true });
}
