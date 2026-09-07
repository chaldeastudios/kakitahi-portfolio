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
  app/projects/            /projects and /projects/[slug] (live Odoo data)
  app/status/               /status — live Odoo connection diagnostics
  app/not-found.tsx        /404
  lib/content.ts           home page copy — services, testimonials, CTA, footer
  lib/projects.ts          the five project case studies (static fallback dataset)
  lib/odoo/config.ts        env-based Odoo connection config
  lib/odoo/json2.ts         Odoo 19 JSON-2 API client (bearer token, no session)
  lib/odoo/content.ts       fetches + parses live services/case studies/journal
  lib/odoo/safe.ts          wraps a live fetch with a static fallback
  lib/odoo/status.ts        the checks /status runs
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

**Status: wired and live-ready. Falls back to static data until the
connection is configured; then works with no further code changes.**

The user's real Odoo instance (`chaldeastudios` Kakitahi, Odoo 19) is the
source of truth for services, project case studies, and journal entries:

| Odoo model | Holds |
|---|---|
| `product.template` (categ `Chaldea Studios Services`, id 7) | The 4 real service offerings |
| `product.template` (categ `Chaldea Studios Products`, id 8) | ReplyFrame |
| `blog.post` in blog `Portfolio` (id 2), tagged `Case Study` (tag id 1) | The 5 project case studies |
| `blog.post` in blog `Our blog` (id 1), tagged `Journal` (tag id 2) | The 6 real journal entries |

Every record was written with a predictable HTML shape — a sequence of
`<div data-section="...">` blocks — which is both what a person editing
the record in Odoo's own rich-text editor sees, and what
`src/lib/odoo/content.ts` parses back out.

**How it connects.** Odoo 19's External JSON-2 API
(`POST /json/2/<model>/<method>`, `Authorization: bearer <api_key>`, no
session/login step) — the same pattern proven live in production by
`chaldeastudios/kilele_coffee` (a working Next.js + Odoo 19 integration
on this same Vercel account). `src/lib/odoo/json2.ts` and `config.ts` are
near-verbatim ports of that reference's client. Read-only only: this site
never writes to Odoo, so a single `ODOO_API_KEY` covers everything (no
separate write-scoped credential the way kilele_coffee needs for its
carts and forms).

**What's wired.** The home page, `/projects`, and `/projects/[slug]` all
fetch live: `getCaseStudies()`, `getServices()` in `src/lib/odoo/content.ts`.
Each call is wrapped in `withOdooFallback()` (`src/lib/odoo/safe.ts`),
which falls back to the static datasets (`content.ts`/`projects.ts`) if
the live fetch fails for any reason — not configured, network hiccup,
Odoo down — so a connection issue degrades to "shows the same content it
always did" rather than a blank page. That fallback is a deliberate
departure from the kilele_coffee reference, which is a throwaway test
whose whole point is proving the live connection and so shows raw errors
with no fallback at all; this is a real site that already worked from
static data.

**To go live:** set three env vars, either in `.env.local` for `npm run
dev` or as Vercel Project → Settings → Environment Variables for the
deployed site (this project is already on Vercel, auto-deploying from
`main`):

```
ODOO_URL=https://<the instance>
ODOO_DB=<database name>
ODOO_API_KEY=<a read-only API key — Odoo Settings → your profile →
              Account Security → New API Key>
```

Then visit `/status` — a live diagnostic page (not part of the Framer
design; same checks as kilele_coffee's own `/status`) that pings Odoo and
confirms the key can read each of the three model sets, with no fallback
of its own, so a real misconfiguration shows up there directly rather
than being silently masked. On Vercel, a newly added env var takes effect
on the next deploy, not the currently running one.

**Trade-off worth knowing:** `callJson2` uses `cache: "no-store"`, so once
a real connection succeeds, Next.js takes the home page and `/projects`
out of static prerendering and serves them dynamically per request (they
currently build as fully static — see the build output, `○` vs `ƒ` — and
will flip to `ƒ` on the first deploy where Odoo is actually reachable
at build time). That's the right default for content meant to update the
moment it's edited in Odoo; if that per-request Odoo round trip ever
becomes a real latency or cost concern, moving to ISR (`revalidate: N`
instead of `no-store`) is a small, isolated change in `json2.ts`.

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
