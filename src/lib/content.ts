/**
 * Site copy — Isaiah Kakitahi.
 *
 * Sourced from the chaldeastudios/kakitahi repo (src/data/content.js, the
 * Studio/Home/Contact pages), which was itself built from a crawl of
 * kakitahi.com. Every claim here traces back to that material: the five
 * 2025 client projects, the four client quotes, the stats, the services,
 * and the bio. Nothing about the person or the business is invented.
 *
 * Each string is written to the same shape and roughly the same length as
 * the string it replaces, so the layout and component structure are
 * untouched.
 */

/**
 * No Contact entry here: the header already has a dedicated Contact
 * button (see Header.tsx) — a text link to the same destination next to
 * it would just be the same thing twice.
 */
export const NAV_LINKS = [
  { label: "About", href: "/#about", newTab: false },
  { label: "Services", href: "/#services", newTab: false },
  { label: "Projects", href: "/#works", newTab: false },
  { label: "Products", href: "/products", newTab: false },
  { label: "Journal", href: "/journal", newTab: false },
  { label: "Testimonial", href: "/#testimonials", newTab: false },
] as const;

export const HERO = {
  name: "Isaiah Kakitahi",
  intro:
    "I'm a designer and builder who works with founders, small businesses, and nonprofits. I turn scattered, half-built ideas into websites and brand systems that feel obvious to use. Five client projects in 2025. Two countries. I come in when the work has to hold up commercially, not just look right.",
  introCta: { label: "Get in Touch", href: "/#contact", newTab: false },
  clientsHeading:
    "I work with people who treat design as a business decision, not a coat of paint applied at the end.",
  clientsLabel: "Highly Experienced With:",
  /**
   * The core tools/stack, rendered as icon + wordmark tiles in the
   * marquee. `icon` keys into the ICON map in ClientMarquee.tsx.
   */
  clients: [
    { name: "Next.js", icon: "nextjs" },
    { name: "React.js", icon: "react" },
    { name: "Odoo", icon: "odoo" },
    { name: "Excel", icon: "excel" },
  ],
} as const;

export const ABOUT = {
  tagline: "About Isaiah Kakitahi",
  paragraphs: [
    "I started the way most self-taught practice starts — learning by doing, breaking things, fixing them, getting curious about why some things felt right and others didn't. Over time that curiosity turned into a real craft.",
    "I do this work independently, alongside a finance and marketing double major at Strathmore University. That second half taught me structure, limits, and trade-offs — how systems behave under pressure, and how people actually decide. Both carry into the work.",
    "Design isn't a big dramatic process for me. It's closer to paying attention: noticing when something feels cluttered, is trying too hard, or isn't saying quite enough. I'm most interested in work that doesn't shout — interfaces that move calmly, brands that don't overexplain themselves.",
  ],
} as const;

export const STATS = [
  { start: 0, end: 5, prefix: "", suffix: "+", label: "Client Projects Delivered in 2025" },
  { start: 0, end: 100, prefix: "", suffix: "%", label: "Positive Client Feedback" },
  { start: 0, end: 50, prefix: "", suffix: "+", label: "Users on ReplyFrame in Two Months" },
  { start: 0, end: 2, prefix: "", suffix: "", label: "Countries the Work Spans — Kenya & Uganda" },
] as const;

export const WORKS = {
  heading: "Works",
  description:
    "I work with people who treat design as a real function, not a final step. The ones who want someone who will tell them the truth about the idea, stay through the hard calls, and care about what ships, not just what was designed.",
  cta: { label: "View All Projects", href: "/projects", newTab: false },
  slogan: "Quality work speaks for itself.",
} as const;

/**
 * The Services section's fixed copy — heading, description, CTA. The
 * service listing itself (`items`) is not here: it is Odoo content
 * (src/lib/odoo/content.ts getServices()), read live and passed to
 * Services.tsx by the page with no static fallback. This used to also hold
 * a static `items` array kept as a fallback for a failed Odoo fetch; that's
 * gone — see error.tsx.
 */
export const SERVICES = {
  heading: "Services",
  description:
    "I don't offer packages. I take on work that has a real problem at the center of it and stay until it's solved. I've learned that the problem on the brief is rarely the actual problem. Here's where I tend to start.",
  cta: { label: "Book A Call", href: "/#contact", newTab: false },
} as const;

/**
 * The actual quotes now live in each project's own `.ks-testimonial` block
 * in Odoo (see parseTestimonial in src/lib/odoo/content.ts), read by
 * src/components/sections/Testimonials.tsx via its `projects` prop — kept
 * here is only the surrounding UI copy that isn't any one client's words.
 */
export const TESTIMONIALS = {
  tagline: "Testimonials",
  outro: "I want your testimonial to be listed here. Let's work together :)",
  cta: { label: "Book A Call", href: "/#contact", newTab: false },
} as const;

export const CTA = {
  tagline: "Get In Touch",
  heading: "Let's create something real together.",
  description:
    "Not sure where to start? That's what the first call is for. Bring the brief and we'll figure out the rest.",
  // /contact books straight into Isaiah's own calendar (a lead and a
  // calendar.event, created directly in Odoo) — see src/app/contact.
  button: { label: "Schedule A Call", href: "/contact", newTab: false },
  image: "https://framerusercontent.com/images/z8oIkjRrZgpvPdmwICKinITmNw.jpg",
} as const;

export const FOOTER = {
  heading: "Make your product stand out.",
  navLinks: [
    { label: "About", href: "/#about", newTab: false },
    { label: "Projects", href: "/#works", newTab: false },
    { label: "Services", href: "/#services", newTab: false },
      { label: "Products", href: "/products", newTab: false },
    { label: "Journal", href: "/journal", newTab: false },
    { label: "Testimonials", href: "/#testimonials", newTab: false },
    { label: "Contact", href: "/#contact", newTab: false },
  ],
  contactLinks: [
    { label: "Nairobi, Kenya", href: "", newTab: false },
    { label: "Kampala, Uganda", href: "", newTab: false },
    { label: "Strathmore University", href: "", newTab: false },
    { label: "LinkedIn", href: "https://linkedin.com/in/kakitahi", newTab: true },
    { label: "X / Twitter", href: "https://x.com/kakitahiisaiah", newTab: true },
  ],
  copyright: "Copyright © 2026 Isaiah Kakitahi. All Rights Reserved.",
  copyrightHref: "https://linkedin.com/in/kakitahi",
  legalLinks: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
  ],
} as const;

/**
 * The Hero's Image Slideshow frames — the four portraits, in the order
 * supplied. Drop the files in public/hero/ as 1.png .. 4.png; they cannot
 * be written from this session, so the paths are wired ahead of the files.
 */
export const SLIDESHOW_IMAGES = [
  "/hero/1.png",
  "/hero/2.png",
  "/hero/3.png",
  "/hero/4.png",
] as const;
