import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { ABOUT } from "@/lib/content";

/**
 * About — Framer node "About" (fXiIc3wVW). 2-column grid,
 * border-bottom 1px /Border.
 *
 *  Left (NF8W7OjRv)  bg /Off-white, border-right 1px /Border,
 *                    padding 24px 24px 180px 24px
 *    Tagline (m8H4eZiBo) sticky top 72px, gap 6px ->
 *      10x10 /Yellow square + the About tagline (Tagline style)
 *  Right (Gwd4jUdU5)
 *    Frame (SMALEuFDC)          h 100px spacer
 *    AboutDescription (VSVGx9nhy) bg /White, gap 24px, padding 24px 20px
 *                                 -> three Heading 3 paragraphs
 *    Frame18 (Xx0M8RK6b)        h 180px, bg /White
 */
export default function About() {
  return (
    <section
      id="about"
      className="grid w-full grid-cols-1 border-b border-border tablet:grid-cols-2"
    >
      {/* Left */}
      <div className="flex flex-col items-start overflow-hidden border-b border-border bg-offwhite px-6 pt-6 pb-6 tablet:border-r tablet:border-b-0 tablet:pb-[180px]">
        <div className="z-[1] flex items-center gap-[6px] tablet:sticky tablet:top-[72px]">
          <Reveal className="flex items-center gap-[6px]" y={12}>
            <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
            <p className="t-tagline">{ABOUT.tagline}</p>
          </Reveal>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-start">
        <div className="hidden h-[100px] w-full tablet:block" />

        <RevealGroup
          className="flex w-full flex-col items-start gap-6 overflow-hidden bg-white px-5 py-6"
          stagger={0.12}
        >
          {ABOUT.paragraphs.map((p, i) => (
            <RevealItem key={i} className="w-full">
              <p className="t-h3 w-full">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="h-[180px] w-full bg-white" />
      </div>
    </section>
  );
}
