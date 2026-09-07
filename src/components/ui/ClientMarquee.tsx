"use client";

/**
 * ClientMarquee — the client-logo row inside the Hero's yellow "Clients"
 * panel (Framer node Frame13, tEk_My_jb: horizontal, gap 40px, overflow
 * clip, nine logos at 85.465 x 49 and opacity 0.8).
 *
 * The row scrolls continuously and wraps from the last logo back to the
 * first. The track is rendered twice and translated by exactly -50%, so
 * the seam lands on an identical frame and the loop is invisible. A mask
 * fades the row out against the yellow ground at both edges.
 */
export default function ClientMarquee({
  logos,
}: {
  logos: readonly { name: string; src: string }[];
}) {
  const track = [...logos, ...logos];

  return (
    <div
      className="marquee-mask relative w-full overflow-hidden"
      role="img"
      aria-label={`Client logos: ${logos.map((l) => l.name).join(", ")}`}
    >
      <div className="marquee-track flex w-max items-center gap-10">
        {track.map((logo, i) => (
          <span
            key={`${logo.name}-${i}`}
            aria-hidden="true"
            className="block h-[49px] w-[85.465px] shrink-0 bg-contain bg-center bg-no-repeat opacity-80"
            style={{ backgroundImage: `url("${logo.src}")` }}
          />
        ))}
      </div>
    </div>
  );
}
