import "server-only";
import { ODOO_WRITE_API_KEY, SITE_URL } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";
import { createDownloadToken } from "./signing";
import type { ConfirmedOrder } from "./orders";
import type { Product } from "@/lib/products";

/**
 * The order-confirmation email — sent once, the moment an order actually
 * becomes a sale (see notifyOrderConfirmed in ./orders, the one place both
 * the free and the Paystack-paid path end up). Table-based HTML, every
 * style inlined, because that's what survives being read in an email
 * client rather than a browser: Geist/Inter aren't loaded, so this falls
 * back to a system sans-serif stack, and the type sizes/weights/letter-
 * spacing below are the same values type-classes.css defines for
 * t-h3/t-h5/t-body/t-body-s/t-button, just written out as inline styles
 * instead of applied through a class no inbox will load.
 *
 * Sent through Odoo's own outgoing mail (mail.mail), not a separate email
 * provider — this deployment has no email-sending credentials of its own,
 * and doesn't need any: Odoo already has a working outgoing mail server
 * configured (see /status), so this is one more thing written to Odoo
 * rather than one more secret to hold.
 */

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const YELLOW = "rgb(255,221,0)";
const BORDER = "rgb(61,61,61)";
const HAIRLINE = "rgb(234,234,234)";

function formatMoney(value: number, currency: string): string {
  const amount = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return currency ? `${currency} ${amount}` : amount;
}

export type ReceiptItem = {
  title: string;
  quantity: number;
  /** Pre-tax — see the note on ConfirmedOrder.lines in ./orders for why. */
  lineSubtotal: number;
  /** Set only for a product with a file attached in Odoo — a direct download. */
  downloadUrl: string | null;
  deliverableName: string | null;
};

export type ReceiptEmailInput = {
  toName: string;
  toEmail: string;
  reference: string;
  amountTotal: number;
  amountUntaxed: number;
  currencyCode: string;
  items: ReceiptItem[];
  /** Where "sign in or create an account" leads — see notifyOrderConfirmed. */
  accountUrl: string;
};

function button(label: string, href: string): string {
  return (
    `<a href="${href}" target="_blank" rel="noopener noreferrer" ` +
    `style="display:block;background:#000;color:#fff;text-decoration:none;padding:14px 16px;` +
    `font-family:${FONT_STACK};font-weight:600;font-size:14px;line-height:1.2em;letter-spacing:-0.02em">` +
    `${label} &rarr;</a>`
  );
}

export function buildOrderConfirmationEmailHtml(input: ReceiptEmailInput): string {
  const { toName, reference, amountTotal, amountUntaxed, currencyCode, items, accountUrl } = input;
  const taxTotal = amountTotal - amountUntaxed;
  const downloadable = items.filter((i) => i.downloadUrl);
  const firstName = toName.trim().split(/\s+/)[0] || toName.trim();

  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="padding:14px 0;border-top:1px solid ${HAIRLINE};font-family:${FONT_STACK};` +
        `font-weight:500;font-size:15px;line-height:1.5em;letter-spacing:-0.03em">` +
        `${item.title}${item.quantity > 1 ? ` &times;${item.quantity}` : ""}</td>` +
        `<td align="right" style="padding:14px 0;border-top:1px solid ${HAIRLINE};font-family:${FONT_STACK};` +
        `font-weight:500;font-size:15px;line-height:1.5em;letter-spacing:-0.03em">` +
        `${formatMoney(item.lineSubtotal, currencyCode)}</td></tr>`
    )
    .join("");

  const taxRow =
    taxTotal > 0.005
      ? `<tr><td style="padding:14px 0;border-top:1px solid ${HAIRLINE};font-family:${FONT_STACK};` +
        `font-weight:500;font-size:15px;line-height:1.5em;letter-spacing:-0.03em">Tax</td>` +
        `<td align="right" style="padding:14px 0;border-top:1px solid ${HAIRLINE};font-family:${FONT_STACK};` +
        `font-weight:500;font-size:15px;line-height:1.5em;letter-spacing:-0.03em">` +
        `${formatMoney(taxTotal, currencyCode)}</td></tr>`
      : "";

  const downloadSection = downloadable.length
    ? `<tr><td style="padding:8px 24px 0">` +
      `<p style="margin:0 0 14px;font-family:${FONT_STACK};font-weight:500;font-size:15px;` +
      `line-height:1.5em;letter-spacing:-0.03em">` +
      `${downloadable.length > 1 ? "Your files are ready — download them below." : "Your file is ready — download it below."}` +
      `</p></td></tr>` +
      downloadable
        .map(
          (item) =>
            `<tr><td style="padding:0 24px 16px">` +
            button(`Download ${item.deliverableName ?? item.title}`, item.downloadUrl!) +
            `</td></tr>`
        )
        .join("")
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your order is confirmed</title>
</head>
<body style="margin:0;background:#eaeaea;font-family:${FONT_STACK}">
<div style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center" style="border-collapse:collapse;background:#fff;border:1px solid ${BORDER};max-width:600px;width:100%">
<tbody>

<tr><td style="background:#000;padding:20px 24px">
<span style="font-family:${FONT_STACK};font-weight:600;font-size:16px;color:#fff">Isaiah Kakitahi</span>
</td></tr>

<tr><td style="padding:32px 24px 8px">
<h1 style="margin:0;font-family:${FONT_STACK};font-weight:500;font-size:26px;line-height:1.2em;letter-spacing:-0.04em">Your order is confirmed</h1>
</td></tr>

<tr><td style="padding:0 24px 24px">
<p style="margin:0;font-family:${FONT_STACK};font-weight:500;font-size:15px;line-height:1.5em;letter-spacing:-0.03em">
Hi ${firstName || "there"} — thanks, this one's on the books. Here's what's on order ${reference}.
</p>
</td></tr>

<tr><td style="padding:0 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
<tbody>
${itemRows}
${taxRow}
<tr><td style="padding:16px 12px;background:${YELLOW};font-family:${FONT_STACK};font-weight:500;font-size:18px;line-height:1.4em;letter-spacing:-0.04em">Total paid</td>
<td align="right" style="padding:16px 12px;background:${YELLOW};font-family:${FONT_STACK};font-weight:500;font-size:18px;line-height:1.4em;letter-spacing:-0.04em">${formatMoney(amountTotal, currencyCode)}</td></tr>
</tbody>
</table>
</td></tr>

<tr><td style="height:24px;line-height:24px;font-size:0">&nbsp;</td></tr>
${downloadSection}

<tr><td style="padding:16px 24px 24px">
<p style="margin:0 0 14px;font-family:${FONT_STACK};font-weight:500;font-size:15px;line-height:1.5em;letter-spacing:-0.03em">
Everything on this order — digital or not — is also in your account, any time you want it again.
</p>
${button("Sign in or create an account", accountUrl)}
</td></tr>

<tr><td style="padding:16px 24px;border-top:1px solid ${HAIRLINE}">
<span style="font-family:${FONT_STACK};font-weight:500;font-size:13px;line-height:1.5em;letter-spacing:-0.01em;opacity:.6">
Order ${reference} &middot; Questions? Just reply to this email.
</span>
</td></tr>

</tbody>
</table>
</div>
</body>
</html>`;
}

/**
 * Writes the email straight into Odoo's own outgoing mail (mail.mail) and
 * sends it immediately — mail.mail.send() rather than leaving it for the
 * mail queue's cron, which can sit for up to an hour. Logged against the
 * order (model/res_id) so it shows in that sale.order's own chatter in
 * Odoo, the same as any other message on the record.
 *
 * Best-effort and silent on failure: a customer's order is genuinely
 * placed and confirmed the moment Odoo says so, independent of whether the
 * email that tells them about it happens to succeed — the order itself, in
 * their account, is the durable record either way.
 */
export async function sendOrderConfirmationEmail(
  order: ConfirmedOrder,
  catalogue: Product[]
): Promise<void> {
  if (!order.partnerEmail) return;

  const items: ReceiptItem[] = order.lines.map((line) => {
    const product = catalogue.find((p) => p.productId === line.productId);
    const downloadUrl = product?.deliverable
      ? `${SITE_URL}/api/download?token=${encodeURIComponent(
          createDownloadToken(order.reference, product.deliverable.attachmentId)
        )}`
      : null;
    return {
      title: product?.title ?? "Item",
      quantity: line.quantity,
      lineSubtotal: line.lineSubtotal,
      downloadUrl,
      deliverableName: product?.deliverable?.name ?? null,
    };
  });

  const accountUrl = `${SITE_URL}/account/login?next=${encodeURIComponent(
    `/account/orders/${order.reference}`
  )}`;

  const html = buildOrderConfirmationEmailHtml({
    toName: order.partnerName,
    toEmail: order.partnerEmail,
    reference: order.reference,
    amountTotal: order.amountTotal,
    amountUntaxed: order.amountUntaxed,
    currencyCode: order.currencyCode,
    items,
    accountUrl,
  });

  try {
    const createdMail = await callJson2<number | number[]>(
      "mail.mail",
      "create",
      {
        vals_list: [
          {
            subject: `Your order is confirmed — ${order.reference}`,
            email_to: order.partnerEmail,
            // The field mail.mail actually sends from is `body` (inherited
            // from mail.message, an html field) — not `body_html`, which
            // this model also has but which a live test confirmed stays
            // unrendered: create() accepts it silently, but send() reads
            // `body`, so a mail.mail written with only body_html set goes
            // out empty. See the "Booking a call" / order-confirmation
            // email note in README.md for how this was diagnosed.
            body: html,
            model: "sale.order",
            res_id: order.orderId,
          },
        ],
      },
      ODOO_WRITE_API_KEY
    );
    const mailId = Array.isArray(createdMail) ? createdMail[0] : createdMail;
    await callJson2("mail.mail", "send", { ids: [mailId] }, ODOO_WRITE_API_KEY);
  } catch (err) {
    console.warn("[email] could not send order confirmation for", order.reference, err);
  }
}
