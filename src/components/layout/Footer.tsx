import FooterLink from "@/components/ui/FooterLink";
import FooterWordmark from "@/components/ui/FooterWordmark";
import { Reveal } from "@/components/ui/Reveal";
import { FOOTER } from "@/lib/content";

/**
 * Footer — Framer component "Footer" (carqf7q3G), Desktop variant yUbVuuEIG.
 *
 * Transcribed structure:
 *   root      : backgroundColor /White, border-top + border-bottom 1px /Border
 *   Frame87   : 2-col grid, border-bottom 1px /Border
 *     Frame83 : padding 24px — "Make your product stand out." (Heading 3)
 *     Frame82 : 2-col grid
 *       Frame81 : border-left 1px — 6 nav Footer Links (variant v9d6R1wSg)
 *       Frame80 : 360x282, border-left 1px — 6 contact Footer Links
 *   Frame84   : 2-col grid, border-bottom 1px, backgroundColor /White
 *     Frame86 : padding 14px 24px — copyright (Body S), linked
 *     Frame85 : border-left 1px, padding 14px 24px, justify end, gap 19px —
 *               Privacy Policy + Terms & Conditions (variant ZtBkierFB)
 *   Stack     : h 350px, backgroundColor /White, overflow clip — the
 *               animated liquid gradient that closes the footer
 */
export default function Footer() {
  return (
    <footer className="w-full border-y border-border bg-white">
      {/* Frame87 */}
      <div className="grid grid-cols-1 border-b border-border tablet:grid-cols-2">
        {/* Frame83 */}
        <div className="flex items-start p-6">
          <Reveal y={20}>
            <h2 className="t-h3">{FOOTER.heading}</h2>
          </Reveal>
        </div>

        {/* Frame82 */}
        <div className="grid grid-cols-1 tablet:grid-cols-2">
          {/* Frame81 — nav links */}
          <div className="flex flex-col border-t border-border tablet:border-t-0 tablet:border-l">
            {FOOTER.navLinks.map((l, i) => (
              <FooterLink
                key={`${l.label}-${i}`}
                label={l.label}
                href={l.href}
                newTab={l.newTab}
                variant="row"
              />
            ))}
          </div>

          {/* Frame80 — contact links */}
          <div className="flex flex-col border-t border-border bg-white tablet:border-t-0 tablet:border-l">
            {FOOTER.contactLinks.map((l, i) => (
              <FooterLink
                key={`${l.label}-${i}`}
                label={l.label}
                href={l.href || undefined}
                newTab={l.newTab}
                variant="row"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Frame84 */}
      <div className="grid grid-cols-1 border-b border-border bg-white tablet:grid-cols-2">
        {/* Frame86 */}
        <div className="flex items-center px-6 py-[14px]">
          <a
            href={FOOTER.copyrightHref}
            target="_blank"
            rel="noopener noreferrer"
            className="t-body-s"
          >
            {FOOTER.copyright}
          </a>
        </div>

        {/* Frame85 */}
        <div className="flex items-center justify-start gap-[19px] border-t border-border px-6 py-[14px] tablet:justify-end tablet:border-t-0 tablet:border-l">
          {FOOTER.legalLinks.map((l) => (
            <FooterLink key={l.label} label={l.label} href={l.href} variant="inline" />
          ))}
        </div>
      </div>

      {/* Stack (fwobZhATP) — the full-width wordmark below the copyright */}
      <FooterWordmark />
    </footer>
  );
}
