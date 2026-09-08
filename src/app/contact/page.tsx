import type { Metadata } from "next";
import { connection } from "next/server";
import PageTemplate from "@/components/layout/PageTemplate";
import ContactFlow from "@/components/contact/ContactFlow";
import { getAvailableSlots } from "@/lib/contact/booking";
import { getSession } from "@/lib/auth/session";

/**
 * /contact — the header's Contact button (and the homepage's own "Schedule
 * A Call" panel) both end here now, instead of at an external calendar
 * tool. One 100vh panel, right above the footer: pick a time, say who you
 * are, and it's a real crm.lead and calendar.event in Odoo — see
 * lib/contact/booking.ts.
 */
export const metadata: Metadata = {
  title: "Contact — Isaiah Kakitahi",
  description:
    "Book a call directly on Isaiah's calendar — pick a time, share a little context, and it's on the books.",
};

export default async function ContactPage() {
  // Excludes this page from build-time prerendering — see the same note
  // on app/page.tsx. Slot availability is also just not something that
  // should ever be baked into a static build.
  await connection();
  const [slots, session] = await Promise.all([getAvailableSlots(), getSession()]);

  return (
    <PageTemplate>
      <ContactFlow
        initialSlots={slots}
        account={session ? { name: session.name, email: session.email } : undefined}
      />
    </PageTemplate>
  );
}
