# kakitahi-portfolio

Isaiah Kakitahi's portfolio site — a Next.js rebuild of a Framer template
(originally "Paige Holden"), with the design system, components, motion
and layout kept intact and every string of copy replaced with his own,
sourced from the `chaldeastudios/kakitahi` repo.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion 13
- **Pages:** `/` (home), `/projects` (listing), `/projects/[slug]` (case
  study detail, one per project), `/404`

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Structure

```
src/
  app/globals.css          design tokens + the three-tier type scale
  app/projects/            /projects and /projects/[slug]
  app/not-found.tsx        /404
  lib/content.ts           home page copy — services, testimonials, CTA, footer
  lib/projects.ts          the five project case studies (static dataset)
  lib/odoo.ts               Odoo JSON-RPC client — see "Odoo integration" below
  lib/odoo-content.ts       parses Odoo records back into the same shapes
                            content.ts/projects.ts export — not wired up yet
  components/layout/       PageTemplate (header + footer + pattern ground)
  components/ui/           Button, TextLink, FooterLink, Logo, MenuButton,
                           AnimatedCounter, TimezoneClock, ImageSlideshow,
                           Cursor, ProjectCard, ClientMarquee, LiquidGradient,
                           ProjectVideos, Reveal (scroll/mount animations)
  components/sections/     Hero, About, Stats, Works, Services,
                           Testimonials, Cta, ProjectGrid, PageHero
```

Home page section order matches the Framer Desktop frame exactly: Hero →
About → Stats → Works → Services → Testimonials → CTA.

## Content

All copy is Isaiah's own, sourced from the `chaldeastudios/kakitahi` repo
(`src/data/content.js`, itself built from a crawl of kakitahi.com) — see
that file's header for what's real vs. reframed and why. Two judgement
calls made when porting it here:

- The project case studies need a problem/solution/result breakdown the
  source doesn't carry (it has an overview and a client testimonial per
  project). Those three fields are written from that same overview,
  headline and quote — brief and approach only, no invented metrics or
  business outcomes.
- No logo files exist for the five 2025 clients, so the hero's client
  marquee (`ClientMarquee`) carries their names as text rather than
  fabricated or borrowed marks.

## Odoo integration

**Status: data layer built and populated; frontend wiring not done.**

The user's real Odoo instance (`chaldeastudios` Kakitahi, Odoo 19) now
holds the same content as the source of truth going forward:

| Odoo model | Holds |
|---|---|
| `product.template` (categ `Chaldea Studios Services`, id 7) | The 4 real service offerings |
| `product.template` (categ `Chaldea Studios Products`, id 8) | ReplyFrame |
| `blog.post` in blog `Portfolio` (id 2), tagged `Case Study` (tag id 1) | The 5 project case studies |
| `blog.post` in blog `Our blog` (id 1), tagged `Journal` (tag id 2) | The 6 real journal entries |

Every record was written with a predictable HTML shape — a sequence of
`<div data-section="...">` blocks carrying the same fields the static
datasets use (overview/problem/solution/result/testimonial/images for
case studies; description/highlights/stat/images for services; intro and
headed body sections for journal posts). That shape is both what a person
editing the record in Odoo's own rich-text editor sees, and what
`src/lib/odoo-content.ts` parses back out — see that file for the exact
extraction.

**What's built:** `src/lib/odoo.ts` (a server-only JSON-RPC client —
`common.login` then `object.execute_kw`, reading `ODOO_URL`, `ODOO_DB`,
`ODOO_LOGIN`, `ODOO_API_KEY` from the environment, see `.env.example`) and
`src/lib/odoo-content.ts` (typed fetchers — `getCaseStudies`,
`getCaseStudy`, `getNextCaseStudy`, `getServices`, `getProducts`,
`getJournalPosts`, `getJournalPost` — that call it and parse the HTML back
into `Project`/`OdooService`/`JournalPost` shapes). Both typecheck and the
build is unaffected by their presence.

**What's not done, and why:** no page or component calls this layer yet.
`content.ts` and `projects.ts` are still what every page actually reads.
Two things are missing to finish the wiring, both outside what this
session can supply on its own:

1. **Connection credentials.** A live Odoo API key (Settings → your
   profile → Account Security → New API Key), plus the instance's base
   URL and database name. A dedicated read-only integration user is
   preferable to using a personal/admin login for this, but that's the
   account owner's call, not something to create unasked in a live
   business instance.
2. **Reachability.** This was built in a sandboxed session whose network
   policy blocks outbound access to arbitrary domains — confirmed
   directly against `framerusercontent.com` and a Framer preview host
   during this same build. Whether the sandbox (or wherever this app is
   eventually hosted) can reach the Odoo instance at all has not been
   verified, and can't be, without first knowing the URL.

There's also a real architecture change bundled into finishing this: the
site currently renders as a static export. Reading Odoo per-request (or
per-build) needs a Node runtime — Vercel or similar — rather than pure
static hosting. Worth deciding deliberately rather than as a side effect
of wiring in the data.

Once the two items above are available, finishing the wiring is
mechanical: swap the imports in `Works.tsx`, `Services.tsx`, `Hero.tsx`
(client marquee stays static — see above), and both `/projects` routes
from the static modules to the `odoo-content` fetchers, passed down from
the page (a Server Component) as props to whatever needs them.

## Framer transcription notes

Reconstructed rather than read directly from Framer's MCP, since several
node types return no children through it (non-primary breakpoint variants,
hover variants) or error outright (`Node is not a text node`):

| Gap | Why | Where |
|---|---|---|
| Tablet + phone type sizes | MCP exposes only one size per text style | `globals.css` |
| Tablet + phone layout overrides | Non-primary variants return no children | all sections |
| Some hover states | Hover variants return no children | a few components |

Breakpoints follow the Framer canvas: phone `<810px`, tablet `≥810px`,
desktop `≥1200px`.
