import Button from "@/components/ui/Button";
import ImageSlideshow from "@/components/ui/ImageSlideshow";
import { SERVICES } from "@/lib/content";

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
 */
export default function Services() {
  return (
    <section id="services" className="grid w-full grid-cols-1 tablet:grid-cols-2">
      {/* Heading */}
      <div className="flex flex-col items-start gap-[10px]">
        <div className="z-[1] flex w-full flex-col items-start gap-10 overflow-hidden border-y border-lightblack bg-offwhite p-6 tablet:sticky tablet:top-[47px] desktop:items-end">
          <h2 className="t-h2 w-full">{SERVICES.heading}</h2>
          <div className="flex flex-col items-start gap-6">
            <p className="t-body desktop:w-[350px]">{SERVICES.description}</p>
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
        {SERVICES.items.map((item) => (
          <div
            key={item.title}
            className="flex w-full flex-col items-start gap-20 overflow-hidden border-b border-white px-6 py-10"
          >
            <div className="flex w-full flex-col items-start justify-between gap-10 desktop:flex-row desktop:gap-[81px]">
              <div className="flex shrink-0 items-center gap-[6px]">
                <span className="t-body-s">{item.number}</span>
                <h3 className="t-h3">{item.title}</h3>
              </div>
              <p className="t-body w-full desktop:max-w-[350px]">{item.description}</p>
            </div>

            <div className="flex w-full flex-col items-start justify-between gap-10 desktop:flex-row desktop:items-end desktop:gap-[81px]">
              <ImageSlideshow
                images={item.images}
                className="h-[180px] w-full shrink-0 desktop:w-[240px]"
              />
              <div className="flex w-full flex-col items-start gap-2 desktop:max-w-[350px]">
                {item.list.map((li) => (
                  <div key={li} className="flex w-full items-center gap-2 overflow-hidden">
                    <span
                      aria-hidden="true"
                      className="block h-[10px] w-[10px] shrink-0 bg-yellow"
                    />
                    <span className="t-body">{li}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
