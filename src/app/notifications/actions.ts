"use server";

import { getSession } from "@/lib/auth/session";
import {
  listNotifications,
  markNotificationsRead,
  type PartnerNotification,
} from "@/lib/notifications";

/**
 * The header bell's two server actions. Both re-derive the partner from
 * the signed, HttpOnly session cookie rather than trusting anything the
 * client sends — a signed-in visitor can only ever read or mark read
 * their own notifications.
 */

export async function getMyNotifications(): Promise<PartnerNotification[]> {
  const session = await getSession();
  if (!session) return [];
  try {
    return await listNotifications(session.partnerId);
  } catch (err) {
    console.warn("[notifications] could not load notifications", err);
    return [];
  }
}

export async function markMyNotificationsRead(ids: number[]): Promise<void> {
  const session = await getSession();
  if (!session || ids.length === 0) return;

  // Only ever mark read notifications this session's own partner actually
  // has — never trust the id list itself as proof of ownership.
  const mine = await listNotifications(session.partnerId, 100);
  const mineIds = new Set(mine.map((n) => n.id));
  const allowed = ids.filter((id) => mineIds.has(id));
  await markNotificationsRead(allowed);
}
