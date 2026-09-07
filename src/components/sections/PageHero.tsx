import { Reveal } from "@/components/ui/Reveal";
import type { ReactNode } from "react";

/**
 * PageHero — the hero shared by /projects (o_gdO0CcF) and
 * /projects/[slug] (VtIQJn1I8). Both are the same construction:
 *
 *   Hero      100% wide, 2-column grid
 *     Left    sticky top 48px, zIndex 1, overflow clip
 *       Frame sticky top 48px, 1fr x 380px, backgroundColor /White,
 *             border 0 1px 1px 0 /Border, padding 20px 0 20px 20px,
 *             stack vertical, distribution END, align start
 *         Stack 82% wide -> the title (Heading 1) at 100%
 *     Right   stack vertical
 *       Frame 1fr x 380px, border-bottom 1px /Border
 *       ...any extra panels the detail page stacks underneath
 */
export default function PageHero({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="grid w-full grid-cols-1 tablet:grid-cols-2">
      {/* Left — the design nests two sticky levels: the column fills the
          grid row (height 1fr) and the 380px panel sticks inside it at
          top 48px, so the title stays pinned while the right column
          scrolls past. */}
      <div className="z-[1] tablet:h-full">
        <div className="flex h-[380px] w-full flex-col items-start justify-end gap-[10px] border-r border-b border-border bg-white py-5 pl-5 tablet:sticky tablet:top-12">
          <Reveal
            className="flex w-[82%] items-center justify-center overflow-hidden"
            y={32}
            duration={0.85}
          >
            <h1 className="t-h1 w-full">{title}</h1>
          </Reveal>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-start">
        <div className="hidden h-[380px] w-full border-b border-border tablet:block" />
        {children}
      </div>
    </section>
  );
}
