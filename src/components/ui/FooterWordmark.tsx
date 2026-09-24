import { Reveal } from "./Reveal";
import { WORDMARK_PATHS, WORDMARK_TRANSFORM, WORDMARK_VIEWBOX } from "./Wordmark";

/**
 * FooterWordmark — the full-width mark that closes the footer, in the
 * 350px /White block the Framer footer holds after the copyright row
 * (node fwobZhATP). Replaces the liquid gradient that stood there.
 *
 * Plain solid /Black wordmark for now — no animation. Used to clip a
 * drifting field of /Yellow slashes; that's been pulled pending a
 * replacement treatment.
 */
export default function FooterWordmark() {
  return (
    <Reveal className="w-full bg-white" y={28} duration={0.9}>
      <div className="w-full">
        <svg
          viewBox={WORDMARK_VIEWBOX}
          className="block h-auto w-full"
          role="img"
          aria-label="Kakitahi"
        >
          <g transform={WORDMARK_TRANSFORM} fill="rgb(0, 0, 0)" stroke="none">
            {WORDMARK_PATHS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </svg>
      </div>
    </Reveal>
  );
}
