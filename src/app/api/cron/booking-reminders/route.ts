import { NextResponse } from "next/server";
import { ODOO_WRITE_API_KEY } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";
import { resolveIdByName } from "@/lib/odoo/ids";
import { notifyPartner } from "@/lib/notifications";

/**
 * A GitHub Actions workflow (.github/workflows/booking-reminders.yml,
 * every 10 minutes) hits this to send a "your call starts soon"
 * notification 20 minutes before a booked call — not Vercel's own Cron,
 * since this project is on Vercel's Hobby plan, which only allows a
 * once-a-day schedule.
 *
 * The window is 15-25 minutes out rather than exactly 20, so a 10-minute
 * cadence (plus GitHub Actions' own scheduling slack) can't ever skip an
 * event that lands between two runs. Once reminded, an event is tagged
 * with the "Reminder Sent" calendar.event.type
 * (created once, by name — see lib/odoo/ids.ts on why by-name rather than
 * a hardcoded id) so the next run's domain filter excludes it; there is no
 * separate "reminded" field to add on a database this site can't extend
 * with custom code.
 *
 * Only events created by the /contact booking flow are in scope
 * (opportunity_id set — see createBooking in lib/contact/booking.ts),
 * not just any meeting on the calendar.
 */

const REMINDER_TAG_NAME = "Reminder Sent";
const WINDOW_START_MIN = 15;
const WINDOW_END_MIN = 25;

function toOdooDatetime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

type UpcomingEvent = {
  id: number;
  name: string;
  partner_ids: number[];
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const reminderTagId = await resolveIdByName(
      "calendar.event.type",
      "name",
      REMINDER_TAG_NAME,
      ODOO_WRITE_API_KEY
    );

    const now = Date.now();
    const windowStart = toOdooDatetime(new Date(now + WINDOW_START_MIN * 60_000));
    const windowEnd = toOdooDatetime(new Date(now + WINDOW_END_MIN * 60_000));

    const events = await callJson2<UpcomingEvent[]>(
      "calendar.event",
      "search_read",
      {
        domain: [
          ["start", ">=", windowStart],
          ["start", "<", windowEnd],
          ["opportunity_id", "!=", false],
          ["categ_ids", "not in", [reminderTagId]],
        ],
        fields: ["name", "partner_ids"],
        limit: 100,
      },
      ODOO_WRITE_API_KEY
    );

    for (const event of events) {
      for (const partnerId of event.partner_ids) {
        await notifyPartner(
          partnerId,
          "Your call starts soon",
          `"${event.name}" starts in about 20 minutes.`
        );
      }
      await callJson2(
        "calendar.event",
        "write",
        { ids: [event.id], vals: { categ_ids: [[4, reminderTagId]] } },
        ODOO_WRITE_API_KEY
      ).catch((err) => console.warn("[booking-reminders] could not tag event reminded", event.id, err));
    }

    return NextResponse.json({ ok: true, remindersSent: events.length });
  } catch (err) {
    console.warn("[booking-reminders] run failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
