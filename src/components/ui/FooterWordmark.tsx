import { Reveal } from "./Reveal";
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "./Wordmark";

/**
 * FooterWordmark — the full-width mark that closes the footer, in the
 * 350px /White block the Framer footer holds after the copyright row
 * (node fwobZhATP). Replaces the liquid gradient that stood there.
 *
 * The letterforms are a window rather than a shape: the wordmark clips a
 * field of /Yellow slashes drifting across a /Black ground. Those slashes
 * are the site's own background pattern — 15deg-rotated bars, the same
 * angle as public/pattern.svg — so the motion reads as the page texture
 * passing behind the name rather than a new effect bolted on.
 *
 * The loop is seamless: bars sit on a fixed 90-unit pitch and the group
 * travels exactly one pitch, so each bar lands where its neighbour began.
 * Pure CSS on a single transform — no JS, nothing per-frame but
 * compositing. Hovering quickens it; reduced motion stops it dead.
 */

const VIEW_W = 1286;
const VIEW_H = 257;

/** Bar pitch in user units. The sweep animates by exactly this. */
const PITCH = 90;
const BAR_W = 19;

/** Enough bars to cover the mark plus a pitch of overrun at each end. */
const BARS = Array.from({ length: 21 }, (_, i) => -200 + i * PITCH);

export default function FooterWordmark() {
  return (
    <Reveal className="w-full bg-white" y={28} duration={0.9}>
      <div className="wordmark-field w-full">
        <svg
          viewBox={WORDMARK_VIEWBOX}
          className="block h-auto w-full"
          role="img"
          aria-label="Kakitahi"
        >
          <defs>
            <clipPath id="footer-wordmark-clip">
              <path d={WORDMARK_PATH} />
            </clipPath>
          </defs>

          <g clipPath="url(#footer-wordmark-clip)">
            {/* Ground */}
            <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="rgb(0, 0, 0)" />

            {/* The drifting slash field */}
            <g className="wordmark-sweep">
              {BARS.map((x) => (
                <rect
                  key={x}
                  x={x}
                  y={-130}
                  width={BAR_W}
                  height={520}
                  fill="rgb(255, 221, 0)"
                  transform={`rotate(15 ${x + BAR_W / 2} ${VIEW_H / 2})`}
                />
              ))}
            </g>
          </g>
        </svg>
      </div>
    </Reveal>
  );
}
