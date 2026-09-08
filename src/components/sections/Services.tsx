import Button from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import ImageSlideshow from "@/components/ui/ImageSlideshow";
import { SERVICES } from "@/lib/content";
import type { OdooService } from "@/lib/odoo/content";

/**
 * Services — Framer node "Services" (V5BQzUvm0). 2-column grid.
 *
 *  Heading (iS2D0AiCm)
 *    Frame (UEkAeC2BA) sticky top 47px, bg /Off-white,
 *      border-top + border-bottom 1px /Light-Black, gap 40px, padding 24px,
 *      stackAlignment end -> "Services" (Heading 2) then Frame59:
 *        description (Body Normal, width 350px) + Button "Book A Call"
 *  Services (ZYK9y42OI) bg /Black, border-bottom 1px /Border
 *    Service (u0ejZWR9o) border-bottom 1px /White, gap 80px,
 *      padding 40px 24px
 *      Stack (bdunViZ_6)   horizontal, gap 81px, space-between, align start
 *        ServiceTitle: "01." (Body S) + "Product Design" (Heading 3)
 *        description (Body Normal, maxWidth 350px)
 *      ImagesList (t062PuIO2) horizontal, gap 81px, space-between, align end
 *        ImageSlideshow 240x180 + List (maxWidth 350px, gap 8px)
 *          each row: 10x10 /Yellow square + label (Geist 500)
 *
 * `items` is supplied live from Odoo (src/lib/odoo/content.ts
 * getServices()) by the page — see app/page.tsx. No static fallback: a
 * failed fetch is this route's error.tsx, not a stale placeholder list.
 */
export default function Services({ items }: { items: OdooService[] }) {
  return (
    <section id="services" className="grid w-full grid-cols-1 tablet:grid-cols-2">
      {/* Heading */}
      <div className="flex flex-col items-start gap-[10px]">
        <div className="z-[1] flex w-full flex-col items-start gap-10 overflow-hidden border-y border-lightblack bg-offwhite p-6 tablet:sticky tablet:top-[47px] desktop:items-end">
          <Reveal className="w-full" y={28} duration={0.8}>
            <h2 className="t-h2 w-full">{SERVICES.heading}</h2>
          </Reveal>
          <div className="flex flex-col items-start gap-6">
            <Reveal>
              <p className="t-body desktop:w-[350px]">{SERVICES.description}</p>
            </Reveal>
            <Button
              label={SERVICES.cta.label}
              href={SERVICES.cta.href}
              newTab={SERVICES.cta.newTab}
            />
          </div>
        </div>
      </div>

      {/* Services list */}
      <div className="flex w-full flex-col justify-center border-b border-border bg-black text-white">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex w-full flex-col items-start gap-20 overflow-hidden border-b border-white px-6 py-10"
          >
            {/* Title beside description.

                The title used to be shrink-0 with a flexible description,
                so a long title ("Automation & AI-Enabled Systems") ran the
                width of the row and squeezed the description into a narrow
                ribbon. Now the description holds the 350px column the
                Framer frame specifies and never shrinks, and the title is
                capped at 420px so it wraps to two or three words a line
                rather than growing without limit.

                The pair only sits side by side from 1440px — the width of
                the Framer canvas this was drawn on. Between 1200 and 1440
                the right column is too narrow to carry a Heading 3 beside a
                350px paragraph without starving one of them, so they stack
                there instead, as they already do on tablet and phone. */}
            <Reveal className="flex w-full flex-col items-start justify-between gap-10 min-[1440px]:flex-row min-[1440px]:gap-[81px]">
              <div className="flex items-baseline gap-[6px] min-[1440px]:max-w-[420px]">
                <span className="t-body-s shrink-0">{item.number}</span>
                <h3 className="t-h3 text-balance">{item.title}</h3>
              </div>
              <p className="t-body w-full min-[1440px]:w-[350px] min-[1440px]:shrink-0">
                {item.description}
              </p>
            </Reveal>

            <div className="flex w-full flex-col items-start justify-between gap-10 desktop:flex-row desktop:items-end desktop:gap-[81px]">
              <ImageSlideshow
                images={item.images}
                className="h-[180px] w-full shrink-0 desktop:w-[240px]"
              />
              <RevealGroup
                className="flex w-full flex-col items-start gap-2 desktop:max-w-[350px]"
                stagger={0.07}
              >
                {item.list.map((li) => (
                  <RevealItem key={li} className="flex w-full items-center gap-2 overflow-hidden">
                    <span
                      aria-hidden="true"
                      className="block h-[10px] w-[10px] shrink-0 bg-yellow"
                    />
                    <span className="t-body">{li}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
