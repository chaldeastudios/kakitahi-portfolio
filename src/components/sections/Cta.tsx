import Button from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CTA } from "@/lib/content";

/**
 * Cta — Framer node "Cta" (tA3wzz2T_). Height 100vh, overflow clip,
 * contents centred.
 *
 *  Image (oeRzhYxib)   absolute, 100% x 105%, centerX 50% / centerY 48%,
 *                      locked, zIndex 1
 *  Stack (D7rOjB76q)   50% x 50%, centred, zIndex 1
 *    Stack (VNdrMDzBg) bg /Off-white, gap 32px, padding 32px 24px
 *      Frame21 (MiPZolpV5) sticky top 72px, gap 6px ->
 *        10x10 /Yellow square + "Get In Touch" (Tagline)
 *      Stack (pbVJYvsze)   width 75%, gap 10px ->
 *        Heading 3 + Body Normal
 *    Button "Schedule A Call" -> cal.com, opens in a new tab
 *  Four locked frames draw 1px /Light Grey rules over the image at the
 *  25% / 75% verticals and horizontals.
 */
export default function Cta() {
  return (
    <section
      id="contact"
      className="relative flex h-screen w-full items-center justify-center gap-[10px] overflow-hidden"
    >
      {/* Image — 100% x 105%, centred at 50% / 48% */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 z-[1] h-[105%] w-full -translate-x-1/2 -translate-y-1/2 bg-cover bg-center"
        style={{ top: "48%", backgroundImage: `url("${CTA.image}")` }}
      />

      {/* Decorative rules — 25% inset, 1px /Light Grey */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute inset-y-0 left-0 w-1/4 border-r border-lightgrey" />
        <div className="absolute inset-y-0 right-0 w-1/4 border-l border-lightgrey" />
        <div className="absolute inset-x-0 top-0 h-1/4 border-y border-lightgrey" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 border-y border-lightgrey" />
      </div>

      {/* Card — Stack D7rOjB76q is 50% x 50%, centred. The four locked
          frames put rules at the 25% and 75% verticals and horizontals, so
          the card's edges land exactly on those rules on all four sides. */}
      <div className="relative z-[1] flex h-1/2 w-[85%] flex-col items-center justify-center tablet:w-1/2">
        <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-hidden bg-offwhite px-6 py-8">
          <Reveal className="z-[1] flex items-center gap-[6px]" y={12}>
            <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
            <p className="t-tagline">{CTA.tagline}</p>
          </Reveal>
          <div className="flex w-full flex-col items-center justify-center gap-[10px] tablet:w-[75%]">
            <Reveal className="w-full" delay={0.06}>
              <h2 className="t-h3 w-full">{CTA.heading}</h2>
            </Reveal>
            <Reveal className="w-full" delay={0.12}>
              <p className="t-body w-full">{CTA.description}</p>
            </Reveal>
          </div>
        </div>

        <Button
          label={CTA.button.label}
          href={CTA.button.href}
          newTab={CTA.button.newTab}
          fullWidth
        />
      </div>

    </section>
  );
}
