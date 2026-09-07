import PageTemplate from "@/components/layout/PageTemplate";
import Button from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/**
 * 404 — Framer page "/404" (d1SGW9a9N), Desktop frame ZJJk1FbAT.
 *
 *   frame  backgroundColor white (this page does NOT use the pattern ground)
 *   Stack (gaVhvLwwa) 1fr x 100vh, backgroundColor rgb(255,255,255),
 *     overflow clip, gap 32px, padding 0 20px, vertical, centred
 *     Stack (MggpUonTJ) width 60%, centred, overflow clip
 *       "404" (Geist 500)
 *     Button (QzlIIoHno) "Go to Homepage" -> "/"
 *
 * Next.js renders this automatically for any route with no match, so
 * unknown paths land here.
 */
export const metadata = {
  title: "404 — Paige Holden",
  description: "That page could not be found.",
};

export default function NotFound() {
  return (
    <PageTemplate ground="white">
      <section className="flex h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden bg-white px-5">
        <Reveal className="flex w-[60%] items-center justify-center overflow-hidden" y={32} duration={0.85}>
          <h1 className="t-h1 w-full text-center">404</h1>
        </Reveal>
        <Reveal delay={0.12} y={16}>
          <Button label="Go to Homepage" href="/" />
        </Reveal>
      </section>
    </PageTemplate>
  );
}
