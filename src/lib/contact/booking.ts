import "server-only";
import { ODOO_WRITE_API_KEY } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";
import { findOrCreatePartner } from "@/lib/checkout/orders";

/**
 * A minimal booking scheduler against Odoo's own CRM and Calendar apps —
 * both already installed and reachable with the write key (confirmed live
 * via the Odoo MCP connector), so this needs no extra module, self-hosted
 * or otherwise: it's the same crm.lead/calendar.event any staff user sees
 * in Odoo's own UI. There is no self-serve Appointments app installed on
 * this instance, so the slot picker below is a small, direct replacement:
 * generate business-hours slots, drop any that overlap an existing
 * calendar.event, and on booking create a crm.lead (the same "someone
 * wants to talk" record any inbound lead would be) and a calendar.event
 * tied to it (calendar.event.opportunity_id -> crm.lead), so "read the
 * lead" and "see the meeting" are the same click in Odoo.
 *
 * Business hours are fixed to Africa/Nairobi, Isaiah's own timezone (see
 * lib/auth/session.ts). Kenya has never observed daylight saving time, so
 * the UTC+3 offset used throughout this file is safe to hardcode rather
 * than reach for a timezone library — something that would stop being
 * true the moment this scheduler needed a second, DST-observing timezone.
 */

const BUSINESS_TZ_OFFSET_HOURS = 3; // Africa/Nairobi, fixed UTC+3, no DST
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 17;
const SLOT_MINUTES = 30;
// ~8 weeks — enough for a calendar with prev/next month navigation (see
// ContactFlow.tsx) to actually have somewhere to go, rather than running
// out after a week and a half.
const LOOKAHEAD_BUSINESS_DAYS = 40;
const MIN_LEAD_HOURS = 2; // no booking starting less than 2 hours from now

export type Slot = {
  /** UTC, ISO-8601 — what's sent to the browser and back. */
  startIso: string;
  endIso: string;
};

/** "now", with its UTC fields re-read as if they were Nairobi's wall clock. */
function nowShiftedToNairobi(): Date {
  return new Date(Date.now() + BUSINESS_TZ_OFFSET_HOURS * 60 * 60 * 1000);
}

/** Odoo's own datetime string format: UTC, "YYYY-MM-DD HH:MM:SS". */
function toOdooDatetime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Every bookable slot in the lookahead window, business-hours only,
 * weekdays only, at least MIN_LEAD_HOURS from now — before checking
 * what's already on the calendar. Pure and synchronous on purpose, so
 * getAvailableSlots() and isSlotStillAvailable() can share it without
 * either one needing to re-derive "what could this slot even be".
 */
function candidateSlots(): Slot[] {
  const slots: Slot[] = [];
  const earliestStartMs = Date.now() + MIN_LEAD_HOURS * 60 * 60 * 1000;
  const nairobiNow = nowShiftedToNairobi();

  // Midnight of "today" in Nairobi, encoded as UTC fields on a shifted
  // Date — the same trick nowShiftedToNairobi() uses, so every date
  // computed from here stays in that shifted frame until converted back.
  const dayCursor = new Date(
    Date.UTC(nairobiNow.getUTCFullYear(), nairobiNow.getUTCMonth(), nairobiNow.getUTCDate())
  );

  let businessDaysFound = 0;
  let daysScanned = 0;
  const maxDaysToScan = LOOKAHEAD_BUSINESS_DAYS * 3; // covers weekends generously

  while (businessDaysFound < LOOKAHEAD_BUSINESS_DAYS && daysScanned < maxDaysToScan) {
    const weekday = dayCursor.getUTCDay(); // 0 Sun .. 6 Sat, of the Nairobi date
    if (weekday !== 0 && weekday !== 6) {
      for (
        let minutes = BUSINESS_START_HOUR * 60;
        minutes < BUSINESS_END_HOUR * 60;
        minutes += SLOT_MINUTES
      ) {
        const nairobiWallClock = new Date(
          Date.UTC(dayCursor.getUTCFullYear(), dayCursor.getUTCMonth(), dayCursor.getUTCDate(), 0, minutes)
        );
        const startMs = nairobiWallClock.getTime() - BUSINESS_TZ_OFFSET_HOURS * 60 * 60 * 1000;
        if (startMs < earliestStartMs) continue;
        const endMs = startMs + SLOT_MINUTES * 60 * 1000;
        slots.push({
          startIso: new Date(startMs).toISOString(),
          endIso: new Date(endMs).toISOString(),
        });
      }
      businessDaysFound++;
    }
    dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    daysScanned++;
  }

  return slots;
}

function overlaps(a: { start: string; stop: string }, slot: Slot): boolean {
  return new Date(a.start).getTime() < new Date(slot.endIso).getTime() &&
    new Date(a.stop).getTime() > new Date(slot.startIso).getTime();
}

/** Every candidate slot that doesn't collide with an existing calendar.event. */
export async function getAvailableSlots(): Promise<Slot[]> {
  const candidates = candidateSlots();
  if (candidates.length === 0) return [];

  const rangeStart = candidates[0].startIso;
  const rangeEnd = candidates[candidates.length - 1].endIso;

  const busy = await callJson2<Array<{ start: string; stop: string }>>(
    "calendar.event",
    "search_read",
    {
      domain: [
        ["start", "<", toOdooDatetime(new Date(rangeEnd))],
        ["stop", ">", toOdooDatetime(new Date(rangeStart))],
      ],
      fields: ["start", "stop"],
      limit: 500,
    },
    ODOO_WRITE_API_KEY
  );

  return candidates.filter((slot) => !busy.some((b) => overlaps(b, slot)));
}

/**
 * Re-checked right before actually booking — the list a visitor is looking
 * at could be a few minutes stale, and two people can be looking at the
 * same open slot at once. This is what keeps the second one from double
 * booking rather than just trusting the click.
 */
export async function isSlotStillAvailable(startIso: string, endIso: string): Promise<boolean> {
  const busy = await callJson2<Array<{ id: number }>>(
    "calendar.event",
    "search_read",
    {
      domain: [
        ["start", "<", toOdooDatetime(new Date(endIso))],
        ["stop", ">", toOdooDatetime(new Date(startIso))],
      ],
      fields: ["id"],
      limit: 1,
    },
    ODOO_WRITE_API_KEY
  );
  return busy.length === 0;
}

export type BookingInput = {
  startIso: string;
  endIso: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
};

export type BookingResult = {
  leadId: number;
  eventId: number;
  startIso: string;
};

/**
 * Books the call: a crm.lead (so this is a real lead in the pipeline, not
 * just an entry on a calendar) and a calendar.event tied to it via
 * opportunity_id, with the visitor as an attendee. Reuses
 * findOrCreatePartner from the checkout — the same "find this email, or
 * make a contact for it" logic applies to a lead's contact as much as a
 * customer's.
 */
export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const partnerId = await findOrCreatePartner({
    name: input.name,
    email: input.email,
    context: input.message,
    marketingOptIn: false,
  });

  const description =
    [
      input.company?.trim() ? `Company: ${input.company.trim()}` : "",
      input.message?.trim() ? `What they'd like to discuss: ${input.message.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n") || false;

  const createdLead = await callJson2<number | number[]>(
    "crm.lead",
    "create",
    {
      vals_list: [
        {
          name: `Discovery call — ${input.name}`,
          type: "lead",
          contact_name: input.name,
          email_from: input.email,
          phone: input.phone?.trim() || false,
          partner_id: partnerId,
          description,
        },
      ],
    },
    ODOO_WRITE_API_KEY
  );
  const leadId = Array.isArray(createdLead) ? createdLead[0] : createdLead;

  const createdEvent = await callJson2<number | number[]>(
    "calendar.event",
    "create",
    {
      vals_list: [
        {
          name: `Call with ${input.name}`,
          start: toOdooDatetime(new Date(input.startIso)),
          stop: toOdooDatetime(new Date(input.endIso)),
          opportunity_id: leadId,
          partner_ids: [[6, 0, [partnerId]]],
          description,
        },
      ],
    },
    ODOO_WRITE_API_KEY
  );
  const eventId = Array.isArray(createdEvent) ? createdEvent[0] : createdEvent;

  return { leadId, eventId, startIso: input.startIso };
}
