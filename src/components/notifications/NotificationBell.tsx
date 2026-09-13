"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "@/components/ui/icons";
import { getMyNotifications, markMyNotificationsRead } from "@/app/notifications/actions";
import type { PartnerNotification } from "@/lib/notifications";

/**
 * The header's notification bell. Only ever rendered for a signed-in
 * account (see Header.tsx) — there is no notification inbox for an
 * anonymous visitor, since a notification only means something once
 * someone can come back and read it.
 *
 * History shows up the first time someone opens it, not just what arrives
 * after: getMyNotifications() reads everything Odoo has ever recorded for
 * that partner (see lib/notifications.ts), so an order confirmed before
 * they had an account is still there once they sign up with the same
 * email and Odoo resolves them to the same contact.
 *
 * Opening the panel marks everything currently unread as read — the same
 * "opening it clears the badge" convention as most notification bells —
 * rather than requiring a separate dismiss action per item.
 */
function timeAgo(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(`${iso.replace(" ", "T")}Z`).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(`${iso.replace(" ", "T")}Z`).toLocaleDateString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<PartnerNotification[]>([]);

  useEffect(() => {
    getMyNotifications().then((res) => {
      setItems(res);
      setLoaded(true);
    });
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      const ids = items.filter((n) => !n.isRead).map((n) => n.id);
      setItems((cur) => cur.map((n) => ({ ...n, isRead: true })));
      await markMyNotificationsRead(ids);
    }
  }

  return (
    <div className="relative flex h-full items-center">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative flex h-full items-center gap-[6px] px-3 text-black"
      >
        <BellIcon color="rgb(0, 0, 0)" />
        {unreadCount > 0 && (
          <span className="absolute top-[10px] right-1 block h-[8px] w-[8px] rounded-full bg-yellow" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-0 flex max-h-[420px] w-[340px] flex-col overflow-y-auto border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-4">
            <span className="t-button">Notifications</span>
          </div>

          {!loaded ? (
            <p className="t-body-s p-4 text-lightblack">Loading…</p>
          ) : items.length === 0 ? (
            <p className="t-body-s p-4 text-lightblack">Nothing yet.</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className="flex flex-col gap-1 border-b border-border p-4 last:border-b-0">
                {n.subject && <span className="t-body">{n.subject}</span>}
                {n.body && <span className="t-body-s text-lightblack">{n.body}</span>}
                <span className="t-body-s text-lightblack">{timeAgo(n.date)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
