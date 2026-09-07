/**
 * Projects dataset — Isaiah Kakitahi's five real 2025 client projects.
 *
 * Titles, sub-titles, clients, years, live links, services, overviews and
 * imagery all come from the chaldeastudios/kakitahi repo
 * (src/data/content.js), which was built from a crawl of kakitahi.com.
 *
 * The source records an Overview and a client Testimonial per project but
 * no problem/solution/result breakdown, which the detail page needs. Those
 * three fields are written from that same Overview, headline and client
 * quote — they describe the brief and the approach only. No metrics,
 * conversion figures or business outcomes are stated, because none exist in
 * the source and inventing them would misrepresent real clients.
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

const IMG = "https://framerusercontent.com/images/";
const img = (id: string, alt: string): ProjectImage => ({ src: IMG + id, alt });

export const PROJECTS: Project[] = [
  {
    slug: "karikari",
    title: "KariKari",
    subtitle: "Website Design",
    clientName: "Saddiq Mwai",
    year: 2025,
    liveLink: "https://karikari.beauty",
    services: ["Website Design", "E-commerce", "Content Structure", "Brand Application"],
    shortOverview:
      "A 100% organic beauty brand built around confidence, self-worth, and clean, uncluttered simplicity. KariKari harnesses the power of nature to enhance and celebrate natural beauty, with skin and hair care crafted from plant extracts and free from harmful chemicals.",
    problem:
      "A brand whose whole proposition is natural confidence needed a site that carried that feeling rather than working against it. Anything busy, over-designed or shouty would have undercut the products themselves.",
    solution:
      "Built the site around the same sense of natural confidence and self-worth the products are made for — clean, uncluttered structure, room to breathe, and an e-commerce flow that stays quiet and gets out of the way.",
    result:
      "Delivered alongside several other builds for the same client, who described the collaboration as patient, professional and genuinely collaborative — and came back for further work.",
    images: [
      img("Fpyp5QZCMdQE8XvNXoNPjxl3U.png", "KariKari — site overview"),
      img("1rbQysWun68yhodWOjhybXGr1tU.png", "KariKari — landing"),
      img("JPVJ9nlokGsOTIXOLWPn5flwzIs.png", "KariKari — product detail"),
      img("rgnWiVqdaxQuRg3Q6LBWvOusIw.png", "KariKari — collection"),
      img("zpTWdENyyKjn2PNIFOxeC7wMrHU.png", "KariKari — brand application"),
      img("opXnlbpBD6Mrx1yGdTZPmRTpa8.png", "KariKari — content page"),
      img("OxUJNvyYfLgGYI44Hqx1mahZYkY.png", "KariKari — mobile views"),
    ],
    video: null,
    youtubeUrl: null,
  },
  {
    slug: "southside-akwana-records",
    title: "Southside Akwana Records",
    subtitle: "Brand Identity Design",
    clientName: "Southside Akwana Records",
    year: 2025,
    liveLink: "",
    services: ["Brand Identity", "Logo System", "Type & Colour", "Applied Collateral"],
    shortOverview:
      "A record label identity built to carry street energy without losing precision. Southside Akwana Records discovers, produces and promotes bold new sounds from emerging artists, blending street energy with refined artistry.",
    problem:
      "The label sits between two things that usually pull apart: raw street energy and refined artistry. An identity leaning too far either way would have misrepresented the roster.",
    solution:
      "Made that tension the core of the identity rather than resolving it — a system sharp enough to read as considered, loose enough to still feel like the music it belongs to.",
    result:
      "The label's founder described the result as authentic, sharp and confident, and as a direct translation of the vision they brought in.",
    images: [
      img("l6wmIAMt9QPZoQMIvJIxkWHcyTc.png", "Southside Akwana Records — identity"),
      img("9XTL9szQaMBytrDBH2H4JqPw3k.png", "Southside Akwana Records — logo system"),
      img("w8jVyZxTiCRN1Dfw2ywpL2LYb0.png", "Southside Akwana Records — type"),
      img("6DZyEJB7smR8ziOorwtLvNSnU4.png", "Southside Akwana Records — colour"),
      img("09u0L7VUiTR5kGhieq1qtVEi4MU.png", "Southside Akwana Records — collateral"),
      img("0IFPBIyuZJc9c0YTLheAUoAPs.png", "Southside Akwana Records — application"),
      img("6XA4Ry4y7zOQgcbY7bV1GrUt0Q.png", "Southside Akwana Records — in use"),
    ],
    video: null,
    youtubeUrl: null,
  },
  {
    slug: "veridian-tech-co",
    title: "Veridian Tech Co.",
    subtitle: "Branding & Website Design",
    clientName: "Sonia Kentaro",
    year: 2025,
    liveLink: "https://veridiantechco.com",
    services: ["Brand Identity", "Website Design", "Content Structure", "AI Tooling"],
    shortOverview:
      "A boutique risk-advisory brand made to read as precise and considered as the work itself. Veridian Tech specialises in business and IT strategy, risk assessment, process and controls design, and governance and compliance.",
    problem:
      "A firm that sells rigor has to signal rigor immediately. Anything loose or decorative in the brand or the site would have contradicted the service being offered.",
    solution:
      "Built brand and site together so the whole thing reads as precise at a glance — restrained type, tight structure, and a content architecture that mirrors how the firm actually assesses risk. AI-assisted risk-assessment tooling is in delivery alongside it.",
    result:
      "The founder called the collaboration a pure joy, and singled out the attention paid to their needs and the originality of the design work.",
    images: [
      img("utlrkOA0ZrqeRmJ9SZTbFsPVg8.png", "Veridian Tech Co. — site overview"),
      img("UxOS7hSDctiixRauSgqcc8Ctm4.png", "Veridian Tech Co. — landing"),
      img("xT9C8ontHdC227X0vtdeqWVyWI.png", "Veridian Tech Co. — services"),
      img("aLWEv7XFQM2QrKTQlEKFZ1NSyiY.png", "Veridian Tech Co. — brand marks"),
      img("vJIbauvO0MAz4HJ6K24hJzq7L8.png", "Veridian Tech Co. — content page"),
      img("16w0Ksp1j49bvKom8XJzMOCFBFc.png", "Veridian Tech Co. — application"),
      img("SygVQUmnIIHGHJQ1LAdrWuHQaU.png", "Veridian Tech Co. — detail"),
    ],
    video: null,
    youtubeUrl: null,
  },
  {
    slug: "kaktus-limited",
    title: "Kaktus Limited",
    subtitle: "Website Design",
    clientName: "Kaktus Limited",
    year: 2025,
    liveLink: "https://kaktuslimited.com",
    services: ["Website Design", "Information Architecture", "Content Structure", "CMS Build"],
    shortOverview:
      "A multi-branch family business given one coherent site to hold all of it together. Founded in 2015 by John M. and Pearl K. Kakitahi, Kaktus has grown several branches — most prominently an affordable H.R. consultancy for startups.",
    problem:
      "Several distinct branches were competing for the same front door. Without a clear structure, visitors could not tell what the company actually did or which part of it they needed.",
    solution:
      "Gave the whole family of branches one clear structure, with an architecture open-ended enough that different kinds of visitor can follow their own thread rather than being funnelled down a single path.",
    result:
      "The managing director singled out exactly that quality — a site open-ended enough to let different people explore as far as their curiosity takes them, with something there for each of them.",
    images: [
      img("J2P6nMgtq4X7USnFotPtPhZOus.png", "Kaktus Limited — site overview"),
      img("7xRYfCGvaYsoYYL7Rc3nVKIc8.png", "Kaktus Limited — landing"),
      img("Ex0UP17WaDB5Ej4bTpWbOxlwbwg.png", "Kaktus Limited — branches"),
      img("Dg9Vc7qi0XMyenQfE75Vg4fl4.png", "Kaktus Limited — consultancy"),
      img("gqaSD6yDn3mTfdbaetUs44r4.png", "Kaktus Limited — content page"),
      img("kFRYEnVn5bWeRYEoW3AlrlcPg2M.png", "Kaktus Limited — structure"),
      img("E7rZMWfeggYeBUCpYDelsmUaQs.png", "Kaktus Limited — detail"),
    ],
    video: null,
    youtubeUrl: null,
  },
  {
    slug: "karitas-karisimbi-foundation",
    title: "Karitas Karisimbi Foundation",
    subtitle: "Website Design",
    clientName: "Saddiq Mwai",
    year: 2025,
    liveLink: "https://karitaskarisimbi.foundation",
    services: ["Website Design", "Content Structure", "Programme Pages", "CMS Build"],
    shortOverview:
      "A foundation's mission given a site as clear and steady as its purpose. Karitas Karisimbi uplifts, guides and empowers boys in Uganda through meaningful support programmes, working towards a world where every boy reaches his full potential.",
    problem:
      "The mission had to be legible in seconds to donors, partners and families alike — without the site reading like a typical corporate build, which would have put distance between the foundation and the people it serves.",
    solution:
      "Structured the site so the mission lands at a glance and the programmes are easy to follow, keeping the tone plain and steady rather than institutional.",
    result:
      "Part of a run of projects for the same client, whose feedback highlighted the creativity, technical expertise and willingness to listen and adapt that carried each build through.",
    images: [
      img("16w0Ksp1j49bvKom8XJzMOCFBFc.png", "Karitas Karisimbi Foundation — site overview"),
      img("lBrh71dgz2wJcLNIXMamlgRCdGc.png", "Karitas Karisimbi Foundation — landing"),
      img("jvF0wsidhelaCgESaPQ6OEkDo.png", "Karitas Karisimbi Foundation — mission"),
      img("b6UkWY5njyVgSkWqVtfHoVL0BIQ.png", "Karitas Karisimbi Foundation — programmes"),
      img("GyXViSRc810wxNNyhenUecsVU.png", "Karitas Karisimbi Foundation — support"),
      img("J27wLhQh26Bse3oq8L3SiWGxLY.png", "Karitas Karisimbi Foundation — content page"),
      img("Yhg0Vwv5ukUvMNkmtBLcfA6pLY.png", "Karitas Karisimbi Foundation — detail"),
    ],
    video: null,
    youtubeUrl: null,
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
