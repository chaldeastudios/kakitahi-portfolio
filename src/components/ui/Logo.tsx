import Link from "next/link";

/**
 * Logo — Framer component "Logo" (ypmlYQd0q), Variant1 (K327xd1Ms).
 *
 * From a detached copy: backgroundColor /Black, height 48px, padding
 * 5px 10px, link "/", holding a single image 20px tall — a solid black
 * tile carrying the monogram.
 *
 * The source mark is a raster image, so the MCP cannot expose its glyphs
 * or metrics. The type below is set to land the mark at the same 20px
 * height inside the 48px tile, in the project's own Geist at 600.
 */
export default function Logo() {
  return (
    <Link
      href="/"
      className="flex h-12 shrink-0 items-center justify-center bg-black px-[10px] py-[5px]"
      aria-label="Isaiah Kakitahi — home"
    >
      <span
        className="block text-white"
        style={{
          fontFamily: "var(--font-geist), system-ui, sans-serif",
          fontWeight: 600,
          fontSize: "26px",
          lineHeight: "20px",
          letterSpacing: "-0.04em",
        }}
      >
        IK.
      </span>
    </Link>
  );
}
