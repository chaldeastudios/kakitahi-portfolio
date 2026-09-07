/**
 * LiquidGradient — the animated block the Framer Footer holds after the
 * copyright row (node fwobZhATP: width 1fr, height 350px,
 * backgroundColor /White, overflow clip, contents centred). The node is
 * empty in the MCP's XML because the gradient itself is an effect the
 * plugin does not serialise, so the motion is built here from the
 * project's palette: /Yellow over /White with /Light Grey and /Black.
 *
 * Six oversized, heavily blurred blobs drift and scale on different
 * durations, so they never resynchronise and the field keeps folding
 * through itself. Pure CSS — no JS, no paint per frame beyond compositing.
 */
export default function LiquidGradient() {
  return (
    <div
      aria-hidden="true"
      className="liquid relative h-[350px] w-full overflow-hidden bg-white"
    >
      <span className="liquid-blob liquid-blob-1" />
      <span className="liquid-blob liquid-blob-2" />
      <span className="liquid-blob liquid-blob-3" />
      <span className="liquid-blob liquid-blob-4" />
      <span className="liquid-blob liquid-blob-5" />
      <span className="liquid-blob liquid-blob-6" />
      <span className="liquid-veil" />
    </div>
  );
}
