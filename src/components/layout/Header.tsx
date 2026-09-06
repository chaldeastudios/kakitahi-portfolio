"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import TextLink from "@/components/ui/TextLink";
import Button from "@/components/ui/Button";
import MenuButton from "@/components/ui/MenuButton";
import TimezoneClock from "@/components/ui/TimezoneClock";
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
 *                 then the Contact Button (minWidth 150px -> /#contact).
 *   A "StopScroll" node (toggle false) locks page scroll — wired here to
 *   the open mobile menu.
 *
 * Tablet (ieIDB0RBt) and TabletClosed (vi34TG9Km, 390px) variants exist in
 * the project but their children are not exposed by the MCP; the collapsed
 * nav below is reconstructed from those variants' frames.
 */
export default function Header() {
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
          <Logo color="rgb(0, 0, 0)" />
          <nav className="ml-[45px] hidden items-center gap-5 desktop:flex">
            {NAV_LINKS.map((l) => (
              <TextLink key={l.label} label={l.label} href={l.href} newTab={l.newTab} />
            ))}
          </nav>
        </div>

        {/* Divider — 1px, full height, centred, zIndex 2 */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-1/2 z-[2] hidden h-full w-px bg-border desktop:block"
        />

        {/* Right: clock + contact button */}
        <div className="flex h-full items-center">
          <div className="mr-[60px] hidden items-center gap-1 tablet:flex">
            <TimezoneClock timezone="America/New_York" textColor="rgb(0, 0, 0)" />
            <span className="t-body-s">NYC</span>
          </div>
          <div className="hidden h-full desktop:block">
            <Button label="Contact" href="/#contact" className="h-full min-w-[150px]" />
          </div>
          <div className="desktop:hidden">
            <MenuButton open={open} onClick={() => setOpen((v) => !v)} />
          </div>
        </div>
      </div>

      {/* Collapsed nav overlay — Header "TabletClosed" variant */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-x-0 top-12 bottom-0 z-40 flex flex-col border-t border-border bg-white desktop:hidden"
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
                <TimezoneClock timezone="America/New_York" textColor="rgb(0, 0, 0)" />
                <span className="t-body-s">NYC</span>
              </div>
              <Button label="Contact" href="/#contact" fullWidth />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
