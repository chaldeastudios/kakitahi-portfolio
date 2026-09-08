"use server";

import {
  createBooking,
  getAvailableSlots,
  isSlotStillAvailable,
  type Slot,
} from "@/lib/contact/booking";

/**
 * The two server actions behind /contact's booking flow: refreshing the
 * slot list (in case the page has been open a while) and actually booking
 * one, re-checked against Odoo one more time first — see
 * isSlotStillAvailable in lib/contact/booking.ts for why the click alone
 * isn't trusted.
 */

export type BookingFormInput = {
  startIso: string;
  endIso: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};

export type BookingActionResult =
  | { ok: true; startIso: string }
  | { ok: false; error: string; slotTaken?: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitBooking(input: BookingFormInput): Promise<BookingActionResult> {
  const name = input.name.trim();
  const email = input.email.trim();

  if (name.length < 2) return { ok: false, error: "Please give a name we can address you by." };
  if (!EMAIL.test(email)) return { ok: false, error: "That email address doesn't look right." };
  if (!input.startIso || !input.endIso) {
    return { ok: false, error: "Please pick a time first." };
  }

  try {
    const stillFree = await isSlotStillAvailable(input.startIso, input.endIso);
    if (!stillFree) {
      return {
        ok: false,
        slotTaken: true,
        error: "That time was just taken by someone else — please pick another.",
      };
    }

    const result = await createBooking({
      startIso: input.startIso,
      endIso: input.endIso,
      name,
      email,
      phone: input.phone.trim() || undefined,
      company: input.company.trim() || undefined,
      message: input.message.trim() || undefined,
    });

    return { ok: true, startIso: result.startIso };
  } catch (err) {
    console.warn("[contact] booking failed:", err);
    return {
      ok: false,
      error: "Something went wrong booking that call. Please try again in a moment.",
    };
  }
}

export async function refreshSlots(): Promise<Slot[]> {
  try {
    return await getAvailableSlots();
  } catch (err) {
    console.warn("[contact] could not refresh available times:", err);
    return [];
  }
}
