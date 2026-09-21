"use client";

/**
 * ClientMarquee — the client row inside the Hero's yellow panel (Framer
 * node Frame13, tEk_My_jb: horizontal, gap 40px, overflow clip, tiles at
 * 85.465 x 49 and opacity 0.8).
 *
 * Now carries the core stack (Next.js, React.js, Odoo, Excel) as
 * icon + wordmark tiles instead of client names. Every icon shares the
 * same 24x24 viewBox and stroke weight so the row reads at a uniform
 * height regardless of glyph. The track is rendered twice and translated
 * by exactly -50%, so the seam lands on an identical frame and the loop
 * is invisible.
 */
type IconName = "nextjs" | "react" | "odoo" | "excel";

function Icon({ name }: { name: IconName }) {
  switch (name) {
    case "nextjs":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.4" />
          <text x="12" y="16" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="currentColor">
            N
          </text>
        </svg>
      );
    case "react":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="2.1" fill="currentColor" />
          <ellipse cx="12" cy="12" rx="10" ry="4.3" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="12" cy="12" rx="10" ry="4.3" stroke="currentColor" strokeWidth="1.2" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.3" stroke="currentColor" strokeWidth="1.2" transform="rotate(120 12 12)" />
        </svg>
      );
    case "odoo":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="15.5" cy="15.5" r="3" fill="currentColor" />
        </svg>
      );
    case "excel":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
          <rect x="3" y="2.5" width="14" height="19" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13 2.5v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M6.5 10.5 12.5 18M12.5 10.5 6.5 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function ClientMarquee({
  clients,
}: {
  clients: readonly { name: string; icon: IconName }[];
}) {
  const track = [...clients, ...clients];

  return (
    <div
      className="marquee-mask relative w-full overflow-hidden"
      role="img"
      aria-label={`Highly experienced with: ${clients.map((c) => c.name).join(", ")}`}
    >
      <div className="marquee-track flex w-max items-center gap-10">
        {track.map((c, i) => (
          <span
            key={`${c.name}-${i}`}
            aria-hidden="true"
            className="t-h6 flex h-[49px] min-w-[85.465px] shrink-0 items-center gap-2 whitespace-nowrap opacity-80"
          >
            <Icon name={c.icon} />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}
