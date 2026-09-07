import Header from "./Header";
import Footer from "./Footer";
import Cursor from "@/components/ui/Cursor";

/**
 * PageTemplate — the Framer page template: the div that houses the Header
 * and the Footer, sitting on the site's forward-slash pattern ground.
 *
 * The page frame itself (Desktop WQLkyLRf1 / Tablet AxUn6pB1S / Phone
 * oN6wMQVRI) carries the pattern background and clips its overflow, so the
 * pattern shows through wherever a section does not paint its own colour.
 */
export default function PageTemplate({
  children,
  ground = "pattern",
}: {
  children: React.ReactNode;
  /** The 404 page's frame is plain /White rather than the pattern ground. */
  ground?: "pattern" | "white";
}) {
  return (
    <div
      className={`relative min-h-screen w-full overflow-x-clip ${
        ground === "pattern" ? "pattern-ground" : "bg-white"
      }`}
    >
      <Cursor />
      <Header />
      <main className="w-full">{children}</main>
      <Footer />
    </div>
  );
}
