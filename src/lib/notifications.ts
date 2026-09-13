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

/**
 * This partner's notifications, newest first — but only ever our own,
 * never Odoo's own system chatter (gamification badges, "you've
 * installed N apps", onboarding tips, "Powered by Odoo" branding, and so
 * on), which is everything else a signed-in staff/portal user's partner
 * record accumulates over time in Odoo.
 *
 * notifyPartner() always posts as a plain comment directly on the
 * partner's own res.partner record (model="res.partner", res_id=that
 * partner) — nothing Odoo generates on its own lands there, so scoping
 * to exactly that (model + res_id + message_type="comment") is what
 * isolates "ours" without having to blocklist every kind of system
 * message Odoo might ever send. History still shows up the first time
 * someone signs in, not just what arrives after — this reads everything
 * matching that shape, not just what's unread.
 */
export async function listNotifications(
  partnerId: number,
  limit = 30
): Promise<PartnerNotification[]> {
  if (!partnerId) return [];

  const messages = await callJson2<MessageRow[]>(
    "mail.message",
    "search_read",
    {
      domain: [
        ["model", "=", "res.partner"],
        ["res_id", "=", partnerId],
        ["message_type", "=", "comment"],
      ],
      fields: ["subject", "body", "date"],
      order: "id desc",
      limit,
    },
    ODOO_WRITE_API_KEY
  );
  if (messages.length === 0) return [];

  const notifs = await callJson2<NotificationRow[]>(
    "mail.notification",
    "search_read",
    {
      domain: [
        ["res_partner_id", "=", partnerId],
        ["mail_message_id", "in", messages.map((m) => m.id)],
      ],
      fields: ["is_read", "mail_message_id"],
    },
    ODOO_WRITE_API_KEY
  );
  const notifByMessageId = new Map(
    notifs.map((n) => [Array.isArray(n.mail_message_id) ? n.mail_message_id[0] : 0, n])
  );

  return messages.map((m): PartnerNotification => {
    const notif = notifByMessageId.get(m.id);
    return {
      // Falls back to the message id on the rare notification-less
      // message (e.g. the partner un-followed themselves) so the row
      // still renders; markNotificationsRead() simply no-ops on an id
      // that isn't a real mail.notification.
      id: notif?.id ?? m.id,
      subject: m.subject || "",
      body: stripHtml(m.body || ""),
      date: m.date || "",
      isRead: notif?.is_read ?? true,
    };
  });
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
