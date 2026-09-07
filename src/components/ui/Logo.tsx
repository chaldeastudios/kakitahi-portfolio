import Link from "next/link";

/**
 * Logo — Framer component "Logo" (ypmlYQd0q), Variant1 (K327xd1Ms).
 *
 * Read from a detached copy: backgroundColor /Black, height 48px,
 * padding 5px 10px, link "/", holding a single 20px-tall image — i.e. a
 * solid black tile carrying the "pH" monogram rather than the full name.
 */
export default function Logo() {
  return (
    <Link
      href="/"
      className="flex h-12 shrink-0 items-center justify-center bg-black px-[10px] py-[5px]"
      aria-label="Paige Holden — home"
    >
      <span
        className="block leading-none text-white"
        style={{
          fontFamily: "var(--font-geist), system-ui, sans-serif",
          fontWeight: 600,
          fontSize: "20px",
          letterSpacing: "-0.05em",
        }}
      >
        pH
      </span>
    </Link>
  );
}
