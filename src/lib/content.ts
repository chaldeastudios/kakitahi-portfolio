/**
 * Site copy — Isaiah Kakitahi / Chaldea Studios.
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

export const NAV_LINKS = [
  { label: "About", href: "/#about", newTab: false },
  { label: "Services", href: "/#services", newTab: false },
  { label: "Projects", href: "/#works", newTab: false },
  { label: "Archive", href: "/archive", newTab: false },
  { label: "Journal", href: "/journal", newTab: false },
  { label: "Testimonial", href: "/#testimonials", newTab: false },
  { label: "Contact", href: "/#contact", newTab: false },
] as const;

export const HERO = {
  name: "Isaiah Kakitahi",
  intro:
    "I'm a designer and builder who works with founders, small businesses, and nonprofits. I turn scattered, half-built ideas into websites and brand systems that feel obvious to use. Five client projects in 2025. Two countries. I come in when the work has to hold up commercially, not just look right.",
  introCta: { label: "Get in Touch", href: "/#contact", newTab: false },
  clientsHeading:
    "I work with people who treat design as a business decision, not a coat of paint applied at the end.",
  clientsLabel: "Among My Clients:",
  /**
   * The five real 2025 clients. The template marqueed logo images; no logo
   * files exist for these clients, so the same marquee carries their
   * wordmarks as text instead of inventing or borrowing marks.
   */
  clients: [
    { name: "KariKari" },
    { name: "Southside Akwana Records" },
    { name: "Veridian Tech Co." },
    { name: "Kaktus Limited" },
    { name: "Karitas Karisimbi Foundation" },
  ],
} as const;

export const ABOUT = {
  tagline: "About Isaiah Kakitahi",
  paragraphs: [
    "I started the way most self-taught practice starts — learning by doing, breaking things, fixing them, getting curious about why some things felt right and others didn't. Over time that curiosity turned into a real craft.",
    "I run Chaldea Studios alongside a finance and marketing double major at Strathmore University. That second half taught me structure, limits, and trade-offs — how systems behave under pressure, and how people actually decide. Both carry into the work.",
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

const IMG = "https://framerusercontent.com/images/";

/** Shape shared by the static SERVICES.items entries and Odoo's OdooService
 *  fetcher (src/lib/odoo/content.ts), so Services.tsx can render either. */
export type ServiceItem = {
  number: string;
  title: string;
  description: string;
  images: readonly string[];
  list: readonly string[];
};

export const SERVICES = {
  heading: "Services",
  description:
    "I don't offer packages. I take on work that has a real problem at the center of it and stay until it's solved. I've learned that the problem on the brief is rarely the actual problem. Here's where I tend to start.",
  cta: { label: "Book A Call", href: "/#contact", newTab: false },
  items: [
    {
      number: "01.",
      title: "Website Design & Development",
      description:
        "Every site is scoped individually — layout, content architecture, responsiveness, and performance — whether that's a simple personal-brand page or a full CMS-driven build. Structurally clean, and built to stay that way after handover.",
      images: [
        IMG + "qSbP5d1N7frJ767lfsDA5zMlCQ.png",
        IMG + "Fpyp5QZCMdQE8XvNXoNPjxl3U.png",
        IMG + "utlrkOA0ZrqeRmJ9SZTbFsPVg8.png",
        IMG + "J2P6nMgtq4X7USnFotPtPhZOus.png",
      ],
      list: [
        "Layout and content architecture",
        "Responsive and mobile passes",
        "CMS structure clients can actually run",
        "Performance and QA before launch",
      ],
    },
    {
      number: "02.",
      title: "Brand & Visual Identity",
      description:
        "Logo, colour, type, and tone worked out together, so a brand reads as one coherent thing across a website, its socials, and everything else it touches. Considered rather than templated.",
      images: [
        IMG + "zFLkW6oOjRSoMVej6nE4gfRWdo.png",
        IMG + "l6wmIAMt9QPZoQMIvJIxkWHcyTc.png",
        IMG + "9XTL9szQaMBytrDBH2H4JqPw3k.png",
        IMG + "6DZyEJB7smR8ziOorwtLvNSnU4.png",
      ],
      list: [
        "Logo and wordmark systems",
        "Colour and type direction",
        "Tone of voice and naming",
        "Applied across site and socials",
      ],
    },
    {
      number: "03.",
      title: "Automation & AI-Enabled Systems",
      description:
        "Custom integrations, APIs, payment logic, and AI agents. ReplyFrame — a comment-and-review plugin with its own SaaS-style backend — runs live in the Framer Marketplace, and AI risk-assessment tooling is in delivery for a boutique advisory firm.",
      images: [
        IMG + "pNLypb7Wpxof64WLy9dLPDO4xnc.png",
        IMG + "RQ0zdd8V10J8K276Dap2nvaw6k.png",
        IMG + "IbJRMYSgT67BYxkR59babBrdY.png",
        IMG + "o2549oWvSGPuCj5iGLzKY0DgBlY.png",
      ],
      list: [
        "API and third-party integrations",
        "Booking and data-driven logic",
        "AI-assisted internal tooling",
        "Products shipped, not experiments",
      ],
    },
    {
      number: "04.",
      title: "Design Partnership",
      description:
        "An ongoing retainer for people who need continuous support across more than one site rather than a single delivery — new sections, priority turnaround, and someone who already knows the system instead of relearning it each time.",
      images: [
        IMG + "kFRYEnVn5bWeRYEoW3AlrlcPg2M.png",
        IMG + "E7rZMWfeggYeBUCpYDelsmUaQs.png",
        IMG + "OdjLuEU2YaCfWTn79Uv23EHizs.png",
        IMG + "n5vta4ihBQLaipun8N4fbZQcJ0.png",
      ],
      list: [
        "Continuous iteration, not one delivery",
        "Priority turnaround",
        "Support across multiple sites",
        "Scope agreed monthly, upfront",
      ],
    },
  ],
} as const;

export const TESTIMONIALS = {
  tagline: "Testimonials",
  items: [
    {
      quote:
        "We have had the pleasure of working with Chaldea Studios across several projects, including our e-commerce site and multiple business websites. Their creativity, technical expertise, and willingness to listen and adapt were key to bringing our visions to life. Finding a partner who combines design excellence with genuine collaboration is rare.",
      name: "Saddiq Mwai",
      role: "KariKari",
    },
    {
      quote:
        "Collaborating with Chaldea Studios was a pure joy! They paid attention to our needs and transformed our concepts into a breathtaking actuality. Their ideas and originality in their designs sincerely distinguish them.",
      name: "Sonia Kentaro",
      role: "Founder, Veridian Tech Co.",
    },
    {
      quote:
        "Isaiah really understood what Southside Akwana Records is about. He took our vision and turned it into a brand that feels authentic, sharp, and confident.",
      name: "Steven Clement",
      role: "Southside Akwana Records",
    },
    {
      quote:
        "I really appreciate the way it feels very open-ended, letting different kinds of people explore as much as they feel curious, with a little something for everyone. It's honestly genius, I'm grateful for this collaboration.",
      name: "John Muhumuza",
      role: "Managing Director, Kaktus Limited",
    },
    {
      quote:
        "What truly stood out was their responsiveness and commitment to getting every detail just right — no request was ever too small, and every piece of feedback was welcomed with a positive attitude. They translated our ideas into beautifully designed, functional websites that perfectly reflect our brands.",
      name: "Saddiq Mwai",
      role: "Karitas Karisimbi Foundation",
    },
  ],
  outro: "I want your testimonial to be listed here. Let's work together :)",
  cta: { label: "Book A Call", href: "/#contact", newTab: false },
} as const;

export const CTA = {
  tagline: "Get In Touch",
  heading: "Let's create something real together.",
  description:
    "Not sure where to start? That's what the first call is for. Bring the brief and we'll figure out the rest.",
  button: { label: "Schedule A Call", href: "https://linkedin.com/in/kakitahi", newTab: true },
  image: "https://framerusercontent.com/images/z8oIkjRrZgpvPdmwICKinITmNw.jpg",
} as const;

export const FOOTER = {
  heading: "Make your product stand out.",
  navLinks: [
    { label: "About", href: "/#about", newTab: false },
    { label: "Projects", href: "/#works", newTab: false },
    { label: "Services", href: "/#services", newTab: false },
    { label: "Archive", href: "/archive", newTab: false },
    { label: "Journal", href: "/journal", newTab: false },
    { label: "Testimonials", href: "/#testimonials", newTab: false },
    { label: "Contact", href: "/#contact", newTab: false },
  ],
  contactLinks: [
    { label: "Nairobi, Kenya", href: "", newTab: false },
    { label: "Kampala, Uganda", href: "", newTab: false },
    { label: "Strathmore University", href: "", newTab: false },
    { label: "Chaldea Studios", href: "", newTab: false },
    { label: "LinkedIn", href: "https://linkedin.com/in/kakitahi", newTab: true },
    { label: "X / Twitter", href: "https://x.com/kakitahiisaiah", newTab: true },
  ],
  copyright:
    "Copyright © 2026 Isaiah Kakitahi. All Rights Reserved. Built by Chaldea Studios.",
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
