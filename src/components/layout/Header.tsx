"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import TextLink from "@/components/ui/TextLink";
import Button from "@/components/ui/Button";
import MenuButton from "@/components/ui/MenuButton";
import TimezoneClock from "@/components/ui/TimezoneClock";
import { ClockIcon } from "@/components/ui/icons";
import CartButton from "@/components/cart/CartButton";
import AccountButton from "@/components/account/AccountButton";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { NAV_LINKS } from "@/lib/content";

/**
 * Header — Framer component "Header" (ZXssPGx1d).
 *
 * Desktop variant (sr1SpoX1P) transcribed verbatim:
 *   height 48px, backgroundColor /White, border-bottom 1px /Border,
 *   stack horizontal / space-between / center.
 *   Left group  : Logo (colour rgb(0,0,0)) then the six Text-Links.
 *   Divider     : 1px wide, full height, /Border, centred, zIndex 2.
 *   Right group : Time (SimpleTimezoneClock America/New_York + "NYC")
 *                 then the Contact Button (minWidth 150px -> /contact,
 *                 the booking flow — see src/app/contact).
 *   A "StopScroll" node (toggle false) locks page scroll — wired here to
 *   the open mobile menu.
 *
 * Tablet (ieIDB0RBt) and TabletClosed (vi34TG9Km, 390px) variants exist in
 * the project but their children are not exposed by the MCP; the collapsed
 * nav below is reconstructed from those variants' frames.
 *
 * Three departures from the Framer header, all about fitting the nav in
 * the left half without crossing the centre divider, or about not saying
 * "Contact" twice:
 *
 *   - Archive is gone. It pointed at a page that never existed and 404'd,
 *     and dropping it is what makes room for Products and Journal, which
 *     are real.
 *   - The full nav switches on at 1440px — the width of the Framer canvas —
 *     rather than the 1200px desktop breakpoint. Seven links plus the logo
 *     clear the divider at 1440 but not below it, so under that the
 *     collapsed menu, which lists every one of them, takes over.
 *   - NAV_LINKS carries no Contact entry (see lib/content.ts): the button
 *     to its right already goes there, so a text link to the same place
 *     would just be it twice.
 *
 * The cart and the account link sit in the right-hand group at every
 * breakpoint, including the collapsed one: a cart you cannot see is a cart
 * you forget you filled, and an account you cannot reach is one you forget
 * you have.
 */
export default function Header({
  account,
}: {
  /** Read server-side in PageTemplate; undefined when signed out. */
  account?: { name: string; email: string };
} = {}) {
  const [open, setOpen] = useState(false);
  const EASE = [0.44, 0, 0.56, 1] as const;

  // "StopScroll" — lock the page while the collapsed menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-12 w-full border-b border-border bg-white">
      <div className="relative flex h-full w-full items-center justify-between">
        {/* Left: logo + nav */}
        <div className="flex h-full items-center">
          <Logo />
          <RevealGroup
            className="ml-[45px] hidden items-center gap-5 min-[1440px]:flex"
            stagger={0.06}
            onMount
          >
            {NAV_LINKS.map((l) => (
              <RevealItem key={l.label}>
                <TextLink label={l.label} href={l.href} newTab={l.newTab} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* Divider — 1px, full height, centred, zIndex 2 */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-1/2 z-[2] hidden h-full w-px bg-border min-[1440px]:block"
        />

        {/* Right: clock + contact button */}
        <div className="flex h-full items-center">
          <div className="mr-[60px] hidden items-center gap-1 tablet:flex">
            <ClockIcon color="rgb(0, 0, 0)" />
            <TimezoneClock timezone="America/New_York" textColor="rgb(0, 0, 0)" />
            <span className="t-body-s">NYC</span>
          </div>
          <AccountButton name={account?.name} email={account?.email} />
          <CartButton />
          <div className="hidden h-full min-[1440px]:block">
            <Button label="Contact" href="/contact" className="h-full min-w-[150px]" />
          </div>
          <div className="min-[1440px]:hidden">
            <MenuButton open={open} onClick={() => setOpen((v) => !v)} />
          </div>
        </div>
      </div>

      {/* Collapsed nav overlay — Header "TabletClosed" variant */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-x-0 top-12 bottom-0 z-40 flex flex-col border-t border-border bg-white min-[1440px]:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <nav className="flex flex-col">
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="t-h4 flex items-center gap-[6px] border-b border-border px-6 py-5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.05 + i * 0.05 }}
                >
                  <span className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
                  {l.label}
                </motion.a>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-4 p-6">
              <div className="flex items-center gap-1">
                <ClockIcon color="rgb(0, 0, 0)" />
                <TimezoneClock timezone="America/New_York" textColor="rgb(0, 0, 0)" />
                <span className="t-body-s">NYC</span>
              </div>
              <Button label="Contact" href="/contact" fullWidth />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
