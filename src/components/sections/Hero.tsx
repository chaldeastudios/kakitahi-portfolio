import Button from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import ImageSlideshow from "@/components/ui/ImageSlideshow";
import ClientMarquee from "@/components/ui/ClientMarquee";
import { HERO, SLIDESHOW_IMAGES } from "@/lib/content";

/**
 * Hero — Framer node "Hero" (rhEu4w2pB). 2-column grid.
 *
 *  Left (u9t4qEWPh)  sticky top 48px, zIndex 1
 *    Content (EzzCb_Qnf) sticky top 48px, h 380px, bg /White,
 *      border 0 1px 1px 0 /Border, padding 20px 0 20px 20px,
 *      vertical space-between
 *      - Image (jYTcFQY6x)  padding 0 20px, justify end -> ImageSlideshow 100x100
 *      - Stack (c80e7bdfs)  width 82% -> "Paige Holden", Geist 500
 *  Right (p4tK2ndtY)
 *    Frame10 (dUyJLCaCW)  h 380px, border-bottom 1px /Border
 *    Intro  (zRYQQVdNt)   minHeight 340px, bg /Black, gap 80px, padding 24px
 *    Clients(R7zIVhMzB)   minHeight 340px, bg /Yellow,
 *                         border 0 0 1px 1px /Border, gap 80px, padding 24px
 */
export default function Hero() {
  return (
    <section id="hero" className="grid w-full grid-cols-1 tablet:grid-cols-2">
      {/* Left */}
      <div className="relative z-[1] tablet:sticky tablet:top-12 tablet:self-start">
        <div className="flex h-[380px] flex-col items-start justify-between border-r border-b border-border bg-white py-5 pl-5">
          <Reveal className="flex w-full items-center justify-end px-5" y={16}>
            <ImageSlideshow
              images={SLIDESHOW_IMAGES}
              className="h-[100px] w-[100px]"
            />
          </Reveal>
          <Reveal className="flex w-[82%] items-center justify-center overflow-hidden" y={32} duration={0.85}>
            <h1 className="t-h1 w-full">{HERO.name}</h1>
          </Reveal>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-start">
        {/* Frame10 — spacer that carries the hairline */}
        <div className="hidden h-[380px] w-full border-b border-border tablet:block" />

        {/* Intro */}
        <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden bg-black p-6">
          <Reveal className="w-full">
            <p className="t-h4 w-full text-white">{HERO.intro}</p>
          </Reveal>
          <Button
            label={HERO.introCta.label}
            href={HERO.introCta.href}
            newTab={HERO.introCta.newTab}
            fullWidth
            className="min-w-[150px]"
          />
        </div>

        {/* Clients */}
        <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-20 overflow-hidden border-b border-l border-border bg-yellow p-6">
          <Reveal className="w-full">
            <p className="t-h4 w-full">{HERO.clientsHeading}</p>
          </Reveal>

          <div className="flex w-full flex-col items-start gap-6">
            <Reveal y={14}>
              <p className="t-h6">{HERO.clientsLabel}</p>
            </Reveal>
            <ClientMarquee logos={HERO.clients} />
          </div>
        </div>
      </div>
    </section>
  );
}
