import Header from "./Header";
import Footer from "./Footer";
import Cursor from "@/components/ui/Cursor";
import { getSession } from "@/lib/auth/session";

/**
 * PageTemplate — the Framer page template: the div that houses the Header
 * and the Footer, sitting on the site's forward-slash pattern ground.
 *
 * The page frame itself (Desktop WQLkyLRf1 / Tablet AxUn6pB1S / Phone
 * oN6wMQVRI) carries the pattern background and clips its overflow, so the
 * pattern shows through wherever a section does not paint its own colour.
 */
export default async function PageTemplate({
  children,
  ground = "pattern",
}: {
  children: React.ReactNode;
  /** The 404 page's frame is plain /White rather than the pattern ground. */
  ground?: "pattern" | "white";
}) {
  // Read once here, for the header. Every page already renders through this
  // template, so nothing else has to think about it.
  const session = await getSession();

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-clip ${
        ground === "pattern" ? "pattern-ground" : "bg-white"
      }`}
    >
      <Cursor />
      <Header account={session ? { name: session.name, email: session.email } : undefined} />
      <main className="w-full">{children}</main>
      <Footer />
    </div>
  );
}
