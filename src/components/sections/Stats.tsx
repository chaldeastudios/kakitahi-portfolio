import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { STATS } from "@/lib/content";

/**
 * Stats — Framer node "Stats" (SQ6RHzoc0). 4-column grid, overflow clip.
 *
 * Each tile is 340px tall and sticky at top 48px, but the columns carry
 * increasing top padding — 0 / 240 / 480 / 720px — so as the section
 * scrolls the four tiles arrive and pin in a staggered cascade. That
 * padding IS the animation; it is transcribed exactly.
 *
 *   Stat1 (ywTMuJYyF) bg /Yellow,     border 0 1px 1px 0
 *   Stat2 (Ee7x98iMC) bg /Black,      pad-top 240px
 *   Stat3 (BZBs7TbvW) bg /Light Grey, border 1px, pad-top 480px
 *   Stat4 (WqSiNkjGO) bg /Border,     border 1px 0 1px 1px, pad-top 720px
 */
const TILES = [
  {
    wrapper: "desktop:pt-0",
    tile: "bg-yellow border-r border-b border-border",
    text: "text-black",
  },
  {
    wrapper: "desktop:pt-[240px]",
    tile: "bg-black",
    text: "text-white",
  },
  {
    wrapper: "desktop:pt-[480px]",
    tile: "bg-lightgrey border border-border",
    text: "text-black",
  },
  {
    wrapper: "desktop:pt-[720px]",
    tile: "bg-border border-y border-l border-border",
    text: "text-white",
  },
];

export default function Stats() {
  return (
    <section className="grid w-full grid-cols-1 overflow-clip tablet:grid-cols-2 desktop:grid-cols-4">
      {STATS.map((s, i) => {
        const t = TILES[i];
        return (
          <div key={s.label} className={`flex flex-col items-start ${t.wrapper}`}>
            <div
              className={`flex h-[340px] w-full flex-col items-start justify-between gap-[10px] overflow-hidden px-5 py-6 desktop:sticky desktop:top-12 ${t.tile} ${t.text}`}
            >
              <AnimatedCounter
                start={s.start}
                end={s.end}
                prefix={s.prefix}
                suffix={s.suffix}
                decimals={0}
                commas
              />
              <p className="t-body-l w-full">{s.label}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
