import "server-only";
import { ODOO_WRITE_API_KEY } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";

/**
 * The in-app notification bell's data layer — Odoo's own chatter, not a
 * new model. notifyPartner() posts a message on a partner's own
 * res.partner record, addressed to themselves; that creates a mail.message
 * plus a mail.notification row for them, which listNotifications() reads
 * straight back.
 *
 * Deliberately independent of whatever Odoo's own notification_type
 * decides (inbox vs email): this instance has no outgoing mail server
 * configured yet (see lib/auth/accounts.ts), so an 'email' notification
 * just sits in an exception state — but the mail.notification row still
 * exists and is_read is still a plain field, so the bell works today and
 * needs no changes once SMTP is fixed.
 *
 * Only a signed-in account's own partnerId (from the session cookie) is
 * ever passed in here — there is no notification inbox for an anonymous
 * visitor, by design.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Posts a notification to this partner's own chatter. Never throws — a
 *  failure here should never break the checkout/booking flow it rides
 *  along with. */
export async function notifyPartner(
  partnerId: number,
  subject: string,
  body: string
): Promise<void> {
  if (!partnerId) return;
  try {
    await callJson2(
      "res.partner",
      "message_post",
      {
        ids: [partnerId],
        subject,
        body: `<p>${escapeHtml(body)}</p>`,
        message_type: "comment",
        subtype_xmlid: "mail.mt_comment",
        partner_ids: [partnerId],
      },
      ODOO_WRITE_API_KEY
    );
  } catch (err) {
    console.warn("[notifications] could not notify partner", partnerId, err);
  }
}

export type PartnerNotification = {
  /** mail.notification id — what markNotificationsRead() takes. */
  id: number;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
};

type NotificationRow = {
  id: number;
  is_read: boolean;
  mail_message_id: [number, string] | false;
};

type MessageRow = {
  id: number;
  subject: string | false;
  body: string | false;
  date: string | false;
};

/** This partner's notifications, newest first — everything Odoo has ever
 *  recorded for them, not just what arrived after they signed up for the
 *  bell, so history shows up the first time someone signs in too. */
export async function listNotifications(
  partnerId: number,
  limit = 30
): Promise<PartnerNotification[]> {
  if (!partnerId) return [];

  const notifs = await callJson2<NotificationRow[]>(
    "mail.notification",
    "search_read",
    {
      domain: [["res_partner_id", "=", partnerId]],
      fields: ["is_read", "mail_message_id"],
      order: "id desc",
      limit,
    },
    ODOO_WRITE_API_KEY
  );
  if (notifs.length === 0) return [];

  const messageIds = [
    ...new Set(
      notifs
        .map((n) => (Array.isArray(n.mail_message_id) ? n.mail_message_id[0] : 0))
        .filter(Boolean)
    ),
  ];

  const messages = await callJson2<MessageRow[]>(
    "mail.message",
    "search_read",
    { domain: [["id", "in", messageIds]], fields: ["subject", "body", "date"] },
    ODOO_WRITE_API_KEY
  );
  const byId = new Map(messages.map((m) => [m.id, m]));

  return notifs
    .map((n): PartnerNotification | null => {
      const msgId = Array.isArray(n.mail_message_id) ? n.mail_message_id[0] : 0;
      const message = byId.get(msgId);
      if (!message) return null;
      return {
        id: n.id,
        subject: message.subject || "",
        body: stripHtml(message.body || ""),
        date: message.date || "",
        isRead: n.is_read,
      };
    })
    .filter((n): n is PartnerNotification => n !== null);
}

/** Marks one or more of this partner's own notifications read. Never
 *  throws — a failed mark-as-read shouldn't surface as a page error. */
export async function markNotificationsRead(notificationIds: number[]): Promise<void> {
  if (notificationIds.length === 0) return;
  try {
    await callJson2(
      "mail.notification",
      "write",
      { ids: notificationIds, vals: { is_read: true } },
      ODOO_WRITE_API_KEY
    );
  } catch (err) {
    console.warn("[notifications] could not mark notifications read", err);
  }
}
