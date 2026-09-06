import Link from "next/link";

/**
 * Logo — Framer component "Logo" (ypmlYQd0q).
 * Variant1: height 48px, padding 5px 10px, link "/", holds a 20px-tall image.
 * The Header passes colour rgb(0, 0, 0).
 */
export default function Logo({ color = "rgb(0, 0, 0)" }: { color?: string }) {
  return (
    <Link
      href="/"
      className="flex h-12 items-center justify-center px-[10px] py-[5px]"
      aria-label="Paige Holden — home"
    >
      <svg height="20" viewBox="0 0 96 20" fill="none" aria-hidden="true">
        <text
          x="0"
          y="15"
          fill={color}
          style={{
            font: "600 16px var(--font-geist), system-ui, sans-serif",
            letterSpacing: "-0.04em",
          }}
        >
          Paige Holden
        </text>
      </svg>
    </Link>
  );
}
