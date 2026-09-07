import Link from "next/link";
import Wordmark from "./Wordmark";

/**
 * Logo — Framer component "Logo" (ypmlYQd0q), Variant1 (K327xd1Ms).
 *
 * From a detached copy: backgroundColor /Black, height 48px, padding
 * 5px 10px, link "/", holding a single image 20px tall with a
 * width of "fit-image" — so the tile is as wide as the mark plus its
 * padding.
 *
 * That image is the Kakitahi wordmark, drawn here as vector rather than
 * raster: 20px tall, white on the black tile, at the mark's own ~5:1
 * ratio (so ~100px wide, tile ~120px).
 */
export default function Logo() {
  return (
    <Link
      href="/"
      className="flex h-12 shrink-0 items-center justify-center bg-black px-[10px] py-[5px] text-white"
      aria-label="Isaiah Kakitahi — home"
    >
      <Wordmark className="block h-5 w-auto" />
    </Link>
  );
}
