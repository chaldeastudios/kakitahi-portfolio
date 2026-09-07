/**
 * Projects dataset.
 *
 * Transcribed verbatim from the export of the Framer "Projects" CMS
 * collection (vUcj716Ux). This is the single source of truth for both
 * /projects and /projects/[slug]; add or edit an entry here and both
 * pages follow.
 *
 * Field names mirror the CMS columns. `services` is stored as an array,
 * split from the collection's comma-separated "Services provided" string.
 * `images` collects Image 1-7 in order, each with its alt text.
 */

export type ProjectImage = {
  src: string;
  alt: string;
};

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  clientName: string;
  year: number;
  liveLink: string;
  services: string[];
  shortOverview: string;
  problem: string;
  solution: string;
  result: string;
  images: ProjectImage[];
  video: string | null;
  youtubeUrl: string | null;
};

export const PROJECTS: Project[] = [
  {
    slug: "vantage",
    title: "Vantage",
    subtitle: "B2B Analytics Dashboard",
    clientName: "John Doe",
    year: 2023,
    liveLink: "https://vantage.example.com",
    services: [
      "UX Research",
      "Dashboard Redesign",
      "Design System",
      "Onboarding Flow",
    ],
    shortOverview:
      "Great data. Wrong container. Vantage's product could do things competitors couldn't. Their users couldn't find any of it. Trial-to-paid was at 4% and the team had convinced themselves it was a pricing problem. It wasn't.",
    problem:
      "Most users were hitting a wall in the first session and never coming back. The product worked, but discoverability was the core issue. Trial-to-paid conversion was severely impacted due to a broken onboarding experience.",
    solution:
      "Redesigned the onboarding flow to show value before users had to go looking for it. Rebuilt the dashboard architecture and introduced a guided first-session experience. Implemented a design system for consistency across the platform.",
    result:
      "Trial-to-paid conversion increased from 4% to 17% (325% improvement). Support tickets dropped by 40%. User retention and activation metrics significantly improved within the first quarter.",
    images: [
      { src: "https://framerusercontent.com/images/zrUsOCnxIW0avr3aOCVa3baytA.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/UMGv87ZShvEYBE1rFDuBu8ZsXYc.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/MuGtfmYWYKQJg0WGHTtSP0ozqGA.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/psiiOgGGv8HgvX1VNbzUieT4t1w.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/N4eqh7sXVmNcrn4W6gROjWn6wc.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/7yFubMBijoix785JFl5kgS6n0.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/D9yRVfkwWs5R50QWM1HMoMApzD4.jpg", alt: "" },
    ],
    video: "https://framerusercontent.com/assets/KDFdf3C2YrT7q0aQNpgckmffw.mp4",
    youtubeUrl: "https://youtu.be/SYyvx6GE2UI",
  },
  {
    slug: "shelt",
    title: "Shelt",
    subtitle: "Rental Platform for Young Professionals",
    clientName: "Shelt",
    year: 2023,
    liveLink: "https://shelt.example.com",
    services: [
      "UX Audit",
      "Platform Redesign",
      "Mobile-First Design",
      "Search Optimization",
    ],
    shortOverview:
      "A rental platform designed to help young professionals find and compare homes with less friction.",
    problem:
      "Renters were leaving after one search because filters were difficult to use, key listing details were buried, and the mobile experience felt like a desktop site squeezed onto a phone.",
    solution:
      "Audited the renter journey, rebuilt search and filtering, and redesigned listing pages around the five details renters need first. Added a mobile-first design system across the experience.",
    result:
      "Renter sign-ups increased 63% the quarter after launch, while mobile engagement and search-to-contact conversion improved.",
    images: [
      { src: "https://framerusercontent.com/images/eTna1UaDrgPZgTkwA6IoAPqmU.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/lrJ7h5Q28GOB4JVP5smPfZkc3k.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/Tj2tdODWkjIxgjKU82WNxTnE.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/s5reZjphWqgwaSXCIbTOcT7YvY.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/gCeWSJj010ffErQO6jeR0pWbMVc.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/JNAYHvKSFvqXDLBl77YgsScvpA.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/C9PBcQsvV0z4JjZKrdPYO602SE.jpg", alt: "" },
    ],
    video: null,
    youtubeUrl: "https://youtu.be/SYyvx6GE2UI",
  },
  {
    slug: "contra",
    title: "Contra",
    subtitle: "Freelancer Onboarding Flow",
    clientName: "Contra",
    year: 2023,
    liveLink: "https://contra.example.com",
    services: [
      "User Research",
      "Flow Redesign",
      "A/B Testing",
      "Segmentation Strategy",
    ],
    shortOverview:
      "A flexible onboarding experience for freelancers with different goals, backgrounds, and levels of experience.",
    problem:
      "The onboarding flow had eleven steps built for one freelancer type, while six distinct user groups were forced through the same rigid experience. Activation suffered across every segment.",
    solution:
      "Mapped each user type and created a segmented flow that adapted to the person signing up. Reduced onboarding from eleven steps to five without removing important information.",
    result:
      "Activation increased 38% in the first month and onboarding completion improved across all freelancer segments.",
    images: [
      { src: "https://framerusercontent.com/images/Rl4bpS0JCILZpMT28CwORQH7c.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/lgt8KwQwDMEzStNttEpwiPi98.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/AoFRBIrDnz5iHGhqIRNPzf7VyQ4.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/Szw0Cn2EGJ9NkEfOHBZFXOB9x4.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/TvQPp6b2exmDzBJmBU2FvWYASA.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/dNh0zQBkV0P2fNUNAHqMYLKDA8.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/xoAiThe4WNcBrZ1C0I7igAiNYE.jpg", alt: "" },
    ],
    video: "https://framerusercontent.com/assets/KDFdf3C2YrT7q0aQNpgckmffw.mp4",
    youtubeUrl: "https://youtu.be/SYyvx6GE2UI",
  },
  {
    slug: "folio",
    title: "Folio",
    subtitle: "Mobile Expense Tracking App",
    clientName: "Folio",
    year: 2023,
    liveLink: "https://folio.example.com",
    services: [
      "Product Design",
      "Interaction Design",
      "Prototype Testing",
      "User Research",
    ],
    shortOverview:
      "A calmer, faster way for teams to capture expenses and build a reliable weekly money habit.",
    problem:
      "People signed up and disappeared after two or three sessions. Logging expenses felt like homework, and the product gave users no reason to return consistently.",
    solution:
      "Ran two weeks of research, redesigned the core logging flow around speed and habit, and introduced a weekly summary that made progress visible and useful.",
    result:
      "Day-30 retention increased from 21% to 49%, with stronger repeat usage and faster expense logging.",
    images: [
      { src: "https://framerusercontent.com/images/OPLn2tCsAxUaYk4T6FK5sNlzoaQ.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/1CTdjXgN1UtHFOeII8djVETGC0.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/3if5wp0ZGzoGtXPgWbEhzMkPvoM.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/XCho1IRHZ8Zz9suuRwrQmct1jtc.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/pDnkmTB4HL02XHjJ0MVmkuJ3w.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/aOC8htAU8Jib1tVvx05GRH4g.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/eKmxPiCyq7QTZFfUVlT4f8efMXc.jpg", alt: "" },
    ],
    video: "https://framerusercontent.com/assets/KDFdf3C2YrT7q0aQNpgckmffw.mp4",
    youtubeUrl: "https://youtu.be/SYyvx6GE2UI",
  },
];

/** Look one up by slug. */
export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/** The next project in the collection, wrapping at the end. */
export function getNextProject(slug: string): Project {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  return PROJECTS[(i + 1) % PROJECTS.length];
}
