"use client";

/**
 * ClientMarquee — the client row inside the Hero's yellow panel (Framer
 * node Frame13, tEk_My_jb: horizontal, gap 40px, overflow clip, tiles at
 * 85.465 x 49 and opacity 0.8).
 *
 * The template marqueed logo images. No logo files exist for these five
 * real clients, so the same marquee carries their wordmarks as text —
 * identical track, gap, duration and edge fades, only the tile content
 * differs. Tiles are min-width rather than fixed so longer names
 * ("Karitas Karisimbi Foundation") are not clipped.
 *
 * The track is rendered twice and translated by exactly -50%, so the seam
 * lands on an identical frame and the loop is invisible.
 */
export default function ClientMarquee({
  clients,
}: {
  clients: readonly { name: string }[];
}) {
  const track = [...clients, ...clients];

  return (
    <div
      className="marquee-mask relative w-full overflow-hidden"
      role="img"
      aria-label={`Clients: ${clients.map((c) => c.name).join(", ")}`}
    >
      <div className="marquee-track flex w-max items-center gap-10">
        {track.map((c, i) => (
          <span
            key={`${c.name}-${i}`}
            aria-hidden="true"
            className="t-h6 flex h-[49px] min-w-[85.465px] shrink-0 items-center whitespace-nowrap opacity-80"
          >
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}
