/**
 * All copy transcribed verbatim from the Framer project's home page ("/").
 * Do not paraphrase — these strings are word-for-word from the design.
 */

export const NAV_LINKS = [
  { label: "About", href: "/#about", newTab: false },
  { label: "Services", href: "/#services", newTab: false },
  { label: "Projects", href: "/#works", newTab: false },
  { label: "Archive", href: "/archive", newTab: false },
  { label: "Testimonial", href: "/#testimonials", newTab: false },
  { label: "Contact", href: "/#contact", newTab: false },
] as const;

export const HERO = {
  name: "Paige Holden",
  intro:
    "I'm a product designer who works with early-stage companies and scaling teams. I turn complicated, half-finished experiences into products that feel obvious to use. Eight years in. Thirty-four products shipped. I come in when the stakes are real and the margin for bad UX is zero.",
  introCta: { label: "Get in Touch", href: "/#contact", newTab: false },
  clientsHeading:
    "I work with companies that treat design as a business decision, not a polish pass at the end.",
  clientsLabel: "Among My Clients:",
  clients: [
    { name: "Adobe", src: "https://framerusercontent.com/images/rhY4zGUtguHySsyEdimoMc.png" },
    { name: "Amd", src: "https://framerusercontent.com/images/OcPsR3Y3aLmxf3wdicdZWQfkw.png" },
    { name: "Behance", src: "https://framerusercontent.com/images/wiDLGZ2swAuv0l3XTTum7ApyI.png" },
    { name: "Airbnb", src: "https://framerusercontent.com/images/FOQtP3aT2DdlVCJGVkCwz2XEvVE.png" },
    { name: "Meta", src: "https://framerusercontent.com/images/xDg4cRgjhnVRgRyUGDAyw13UcUc.png" },
    { name: "Netflix", src: "https://framerusercontent.com/images/4KMLmk96nR1W7YrLBXmJMpXzPg.png" },
    { name: "Microsoft", src: "https://framerusercontent.com/images/oupiINRnsljpNWM4A2RRmYAo0Sk.png" },
    { name: "Openai", src: "https://framerusercontent.com/images/wnpTJQySboVNbyTBzHBlP8iw.png" },
    { name: "Google", src: "https://framerusercontent.com/images/X6uGDbqRvdEl9JCeRjccn49Sg.png" },
  ],
} as const;

export const ABOUT = {
  tagline: "About Paige Holden",
  paragraphs: [
    "I started doing this because most product teams hire designers too late and ask them to fix something that was already decided. I got good at coming in earlier.",
    "I've spent eight years embedded in product teams, mostly at the point where something works but nobody knows how to use it yet. That gap between functional and intuitive is where I do my best work.",
    "I don't hand off decks and disappear. I sit in the research, the edge cases, the handoff, and the post-launch cleanup. The founders I work with tend to come back not because the first project went well, but because they stopped wanting to do it without me.",
  ],
} as const;

export const STATS = [
  { start: 0, end: 34, prefix: "", suffix: "+", label: "Products Shipped Since 2018" },
  { start: 0, end: 8, prefix: "", suffix: "+", label: "Years of Experience" },
  { start: 0, end: 3, prefix: "$", suffix: "M+", label: "Fundings for the startups" },
  { start: 0, end: 99, prefix: "", suffix: "%", label: "Client Satisfaction Rate" },
] as const;

export const WORKS = {
  heading: "Works",
  description:
    "I work with companies that treat design as a real function, not a final step. The ones that want someone who will tell them the truth about their product, stay through the hard calls, and care about what ships, not just what was designed.",
  cta: { label: "View All Projects", href: "/projects", newTab: false },
  slogan: "Quality work speaks for itself.",
  /** The four items of the Framer "Projects" CMS collection (vUcj716Ux). */
  projects: [
    {
      slug: "vantage",
      title: "Vantage",
      subtitle: "B2B Analytics Dashboard",
      image: "https://framerusercontent.com/images/zrUsOCnxIW0avr3aOCVa3baytA.jpg",
    },
    {
      slug: "shelt",
      title: "Shelt",
      subtitle: "Rental Platform for Young Professionals",
      image: "https://framerusercontent.com/images/eTna1UaDrgPZgTkwA6IoAPqmU.jpg",
    },
    {
      slug: "contra",
      title: "Contra",
      subtitle: "Freelancer Onboarding Flow",
      image: "https://framerusercontent.com/images/Rl4bpS0JCILZpMT28CwORQH7c.jpg",
    },
    {
      slug: "folio",
      title: "Folio",
      subtitle: "Mobile Expense Tracking App",
      image: "https://framerusercontent.com/images/OPLn2tCsAxUaYk4T6FK5sNlzoaQ.jpg",
    },
  ],
} as const;

export const SERVICES = {
  heading: "Services",
  description:
    "I don't offer packages. I take on work that has a real problem at the center of it and stay until it's solved. I've learned that the problem on the brief is rarely the actual problem. Here's where I tend to start.",
  cta: { label: "Book A Call", href: "/#contact", newTab: false },
  /** The four items of the Framer "Services" CMS collection (G_Idfj5qX).
   *  images[] are that item's Image 1-4 — the four frames the
   *  Image Slideshow component cycles through. */
  items: [
    {
      number: "01.",
      title: "Product Design",
      description:
        "I work from the first screen to the shipped product. Most designers come in after the decisions are made. I come in before, when there's still room to shape the problem, not just the solution. That's where the real work happens.",
      images: [
        "https://framerusercontent.com/images/zrUsOCnxIW0avr3aOCVa3baytA.jpg",
        "https://framerusercontent.com/images/UMGv87ZShvEYBE1rFDuBu8ZsXYc.jpg",
        "https://framerusercontent.com/images/MuGtfmYWYKQJg0WGHTtSP0ozqGA.jpg",
        "https://framerusercontent.com/images/psiiOgGGv8HgvX1VNbzUieT4t1w.jpg",
      ],
      list: [
        "User flows and journey mapping",
        "Information architecture",
        "Interaction and visual design",
        "Design systems that teams actually use",
      ],
    },
    {
      number: "02.",
      title: "UX Research",
      description:
        "The team's assumptions are usually wrong. Not because they're bad at their jobs, but because they're too close to it. I run structured research that cuts through the debate and gets everyone looking at the same truth. The output is a decision, not a slide deck.",
      images: [
        "https://framerusercontent.com/images/N4eqh7sXVmNcrn4W6gROjWn6wc.jpg",
        "https://framerusercontent.com/images/7yFubMBijoix785JFl5kgS6n0.jpg",
        "https://framerusercontent.com/images/D9yRVfkwWs5R50QWM1HMoMApzD4.jpg",
        "https://framerusercontent.com/images/zrUsOCnxIW0avr3aOCVa3baytA.jpg",
      ],
      list: [
        "Moderated user testing",
        "Interview synthesis",
        "Usability audits",
        "Jobs-to-be-done mapping",
      ],
    },
    {
      number: "03.",
      title: "Design Advisory",
      description:
        "For founders who know they need design to be a real function but haven't built it yet. I help you hire right, set the standard early, and avoid the mistakes that are expensive to fix once the team is in place.",
      images: [
        "https://framerusercontent.com/images/MuGtfmYWYKQJg0WGHTtSP0ozqGA.jpg",
        "https://framerusercontent.com/images/psiiOgGGv8HgvX1VNbzUieT4t1w.jpg",
        "https://framerusercontent.com/images/N4eqh7sXVmNcrn4W6gROjWn6wc.jpg",
        "https://framerusercontent.com/images/7yFubMBijoix785JFl5kgS6n0.jpg",
      ],
      list: [
        "Hiring and team structure",
        "Design critique and process",
        "Tooling and workflow setup",
        "Founder-level design thinking",
      ],
    },
    {
      number: "04.",
      title: "Redesign",
      description:
        "Most redesigns fail because they start with the interface instead of the problem. I start with why the current product isn't working and build forward from there. The goal is never a new look. It's a product that finally does what it was supposed to.",
      images: [
        "https://framerusercontent.com/images/psiiOgGGv8HgvX1VNbzUieT4t1w.jpg",
        "https://framerusercontent.com/images/N4eqh7sXVmNcrn4W6gROjWn6wc.jpg",
        "https://framerusercontent.com/images/7yFubMBijoix785JFl5kgS6n0.jpg",
        "https://framerusercontent.com/images/D9yRVfkwWs5R50QWM1HMoMApzD4.jpg",
      ],
      list: [
        "Full product audits",
        "User research and problem framing",
        "End-to-end redesign",
        "Handoff and implementation support",
      ],
    },
  ],
} as const;

export const TESTIMONIALS = {
  tagline: "Testimonials",
  items: [
    {
      quote:
        "Paige figured out in two weeks what we'd been arguing about for six months. She ran the research, reframed the problem, and gave us a direction the whole team could stand behind. We shipped faster after she left than we did while she was there.",
      name: "Ryan Callahan",
      role: "Head of Product, XYZ",
    },
    {
      quote:
        "Paige doesn't just design. She thinks. She asks the questions nobody else is asking, pushes back when the brief is wrong, and delivers something that actually holds up in the real world. We brought her in for one project and haven't stopped working with her since.",
      name: "Kate Morrison",
      role: "Co-founder, ABC",
    },
    {
      quote:
        "We were stuck. Six months of internal debate, three rounds of wireframes, and nothing we could agree on. Paige came in, ran the research, reframed the whole problem, and gave us a direction in two weeks. I wish we'd called her six months earlier.",
      name: "Ryan Callahan",
      role: "Head of Product, XYZ",
    },
    {
      quote:
        "I've worked with designers who are good at their craft and designers who are good at the business. Dana is the only one I've met who's genuinely both. She came in, understood the problem faster than anyone on our team, and shipped something we're still proud of.",
      name: "Tom Whitfield",
      role: "CEO, KLLM",
    },
    {
      quote:
        "She moves fast without cutting corners. She communicates better than most full-time employees I've managed. And the work she shipped for us directly contributed to a funding round we closed three months later. That's not something I say lightly.",
      name: "Chris Aldren",
      role: "CPO, XYZ",
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
  button: { label: "Schedule A Call", href: "cal.com", newTab: true },
  image: "https://framerusercontent.com/images/z8oIkjRrZgpvPdmwICKinITmNw.jpg",
} as const;

export const FOOTER = {
  heading: "Make your product stand out.",
  navLinks: [
    { label: "About", href: "/#about", newTab: false },
    { label: "Projects", href: "/#works", newTab: false },
    { label: "Services", href: "/#services", newTab: false },
    { label: "Projects", href: "/#works", newTab: false },
    { label: "Testimonials", href: "/#about", newTab: false },
    { label: "Contact", href: "cal.com", newTab: true },
  ],
  contactLinks: [
    { label: "123 street, New York, USA", href: "", newTab: false },
    { label: "hello@paige-holden.com", href: "mailto:hello@paige-holden.com", newTab: false },
    { label: "Behance", href: "linkedin.com", newTab: false },
    { label: "LinkedIn", href: "linkedin.com", newTab: false },
    { label: "Instagram", href: "instagram.com", newTab: false },
    { label: "X/Twitter", href: "x.com", newTab: false },
  ],
  copyright:
    "Copyright © 2026 Paige Holden. All RIghts Reserved. Website designed by Fazal.",
  copyrightHref: "https://fazal.site",
  legalLinks: [
    { label: "Privacy Policy", href: "https://paige-holden.framer.website/privacy-policy" },
    { label: "Terms & Conditions", href: "https://paige-holden.framer.website/terms-and-conditions" },
  ],
} as const;

/**
 * The Hero's Image Slideshow frames. The Framer component (D1hQeRBgs) is
 * built as four variants it cycles through; the bound images are not
 * exposed by the MCP, so these are the first four project images from the
 * Projects CMS collection.
 */
export const SLIDESHOW_IMAGES = [
  "https://framerusercontent.com/images/zrUsOCnxIW0avr3aOCVa3baytA.jpg",
  "https://framerusercontent.com/images/eTna1UaDrgPZgTkwA6IoAPqmU.jpg",
  "https://framerusercontent.com/images/Rl4bpS0JCILZpMT28CwORQH7c.jpg",
  "https://framerusercontent.com/images/OPLn2tCsAxUaYk4T6FK5sNlzoaQ.jpg",
] as const;
