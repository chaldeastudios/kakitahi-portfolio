# kakitahi-portfolio

Isaiah Kakitahi's portfolio site — a Next.js rebuild of a Framer template
(originally "Paige Holden"), with the design system, components, motion
and layout kept intact and every string of copy replaced with his own,
sourced from the `chaldeastudios/kakitahi` repo.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion 13
- **Pages:** `/` (home), `/projects` (listing), `/projects/[slug]` (case
  study detail, one per project), `/products` (listing), `/products/[slug]`
  (one per product), `/products/[slug]/checkout` (the three-step order
  flow), `/journal` (listing), `/journal/[slug]` (one per entry), `/404`

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
  app/journal/             /journal and /journal/[slug] (live Odoo data)
  app/products/            /products, /products/[slug] and its checkout
  app/api/odoo/media/      proxies Odoo binaries (product images)
  app/api/download/        signed, expiring download of a product's file
  lib/checkout/orders.ts   creates the partner + confirmed sale.order
  lib/checkout/signing.ts  HMAC for the download links
  app/status/               /status — live Odoo connection diagnostics
  app/not-found.tsx        /404
  lib/content.ts           home page copy — services, testimonials, CTA, footer
  lib/projects.ts          the five project case studies (static fallback dataset)
  lib/journal.ts           the six journal entries (static fallback dataset)
  lib/products.ts          ReplyFrame + Bernaum (static fallback dataset)
  lib/odoo/config.ts        env-based Odoo connection config
  lib/odoo/json2.ts         Odoo 19 JSON-2 API client (bearer token, no session)
  lib/odoo/content.ts       fetches + parses live services/case studies/journal
  lib/odoo/safe.ts          wraps a live fetch with a static fallback
  lib/odoo/status.ts        the checks /status runs
  components/layout/       PageTemplate (header + footer + pattern ground)
  components/ui/           Button, TextLink, FooterLink, Logo, MenuButton,
                           AnimatedCounter, TimezoneClock, ImageSlideshow,
                           Cursor, ProjectCard, JournalCard, ProductCard,
                           ClientMarquee, FooterWordmark, Wordmark,
                           ProjectVideos, Reveal (scroll/mount animations)
  components/sections/     Hero, About, Stats, Works, Services,
                           Testimonials, Cta, ProjectGrid, PageHero
```

Home page section order matches the Framer Desktop frame exactly: Hero →
About → Stats → Works → Services → Testimonials → CTA. The journal is
deliberately not among them — it lives at `/journal`, reached from the
header nav, and adds no section to the home page.

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
source of truth for services, products, project case studies, and journal
entries — and, since the checkout, for the orders those products generate:

| Odoo model | Holds |
|---|---|
| `product.template` (categ `Chaldea Studios Services`, id 7) | The 4 real service offerings (ids 22–25) |
| `product.template` (categ `Chaldea Studios Products`, id 8) | ReplyFrame (id 26), Bernaum (id 28) |
| `blog.post` in blog `Portfolio` (id 2), tagged `Case Study` (tag id 1) | The 5 project case studies (ids 1–5) |
| `blog.post` in blog `Our blog` (id 1), tagged `Journal` (tag id 2) | The 6 real journal entries (ids 6–11) |

**Where to edit them in Odoo.** Services and products are ordinary
products: **Sales → Products → Products**, filter by category *Chaldea
Studios Services* / *Chaldea Studios Products*; the site reads the
**Description** field on the *Sales* tab. Case studies and journal entries
are ordinary blog posts: **Website → Blog → Blog Posts**, in the *Portfolio*
and *Our blog* blogs respectively. Adding a new service is adding a product
in that category; it appears on the home page on the next request.

### The content shape (read this before editing a record)

Every record carries a predictable HTML structure that
`src/lib/odoo/content.ts` parses back out. Structure is marked with `ks-*`
**class names**, and every value lives in **visible content** — a `<li>`, a
`<span>` — never in an attribute:

| Record | Shape |
|---|---|
| Service / product | `.ks-number` · `.ks-description>p` · `ul.ks-highlights>li` · `.ks-stat > span.ks-stat-value + span.ks-stat-label` · `.ks-images>img[src][alt]` |
| Case study | `ul.ks-meta > li.ks-client\|.ks-year\|.ks-live-link\|.ks-services` · `.ks-overview` · `.ks-problem` · `.ks-solution` · `.ks-result` · `.ks-testimonial > p… + footer > span.ks-name + span.ks-role` · `.ks-images` |
| Journal entry | `ul.ks-meta > li.ks-category\|.ks-date\|.ks-author` · `.ks-intro` · repeated `.ks-body > h3 + p…` |
| Product | the service shape, plus repeated `.ks-body > h3 + p… + ul>li`, and `ul.ks-meta > li.ks-kind\|.ks-tagline\|.ks-platform\|.ks-price\|.ks-license\|.ks-published\|.ks-updated\|.ks-tags\|.ks-link-label\|.ks-live-link`. Its gallery and deliverable are **not** in the description — see below. |

`.ks-number`, `.ks-stat` and `.ks-images` are optional; the description is
not.

**Why classes and not `data-*`.** Odoo sanitises every HTML field on write,
and on this instance it silently strips `data-*` attributes from `<div>`
and `<ul>`: a record written as `<div data-section="number">01.</div>` reads
back as `<div>01.</div>`. The write returns success and the markers are
simply gone — which is exactly how an earlier version of this integration
looked fully wired while rendering nothing. `class`, `id`, `style`, `title`,
`<section>`, `<footer>`, `<ul>/<li>` and HTML comments all survive intact.
Keeping the values as visible text has a second benefit: they're editable in
Odoo's own rich-text editor without opening the code view.

To keep that failure mode from ever being silent again, each fetcher runs an
`assertParsed()` check: records fetched but parsed structurally empty throws,
so `withOdooFallback` engages and the reason lands in the server log, rather
than a section of the live site quietly rendering blank.

**How it connects.** Odoo 19's External JSON-2 API
(`POST /json/2/<model>/<method>`, `Authorization: bearer <api_key>`, no
session/login step) — the same pattern proven live in production by
`chaldeastudios/kilele_coffee` (a working Next.js + Odoo 19 integration
on this same Vercel account). `src/lib/odoo/json2.ts` and `config.ts` are
near-verbatim ports of that reference's client.

Reading and writing are separated. Everything the site *shows* uses the
read-only `ODOO_API_KEY`; the product checkout — the one write path — uses
`ODOO_WRITE_API_KEY`, which falls back to the read key but should be its own
write-scoped credential, so the key that renders every public page cannot
write anything. That is the same split kilele_coffee makes for its carts
and form submissions.

**What's wired.** The home page, `/projects`, `/projects/[slug]`,
`/products`, `/products/[slug]`, `/journal` and `/journal/[slug]` all fetch
live: `getCaseStudies()`, `getServices()`, `getProducts()` and
`getJournalPosts()` in `src/lib/odoo/content.ts`.
Each call is wrapped in `withOdooFallback()` (`src/lib/odoo/safe.ts`),
which falls back to the static datasets (`content.ts`, `projects.ts`,
`journal.ts`, `products.ts`) if the live fetch fails for any reason — not
configured, network hiccup,
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

The checkout needs two more, and only the checkout does — everything else
works without them:

```
ODOO_WRITE_API_KEY=<a write-scoped API key; falls back to ODOO_API_KEY>
CHECKOUT_SECRET=<any long random string: openssl rand -base64 32>
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

### Products: media, the deliverable, and the checkout

Three things about a product live outside its description field, because
they are Odoo's own product features rather than copy:

| In Odoo | Used as |
|---|---|
| **eCommerce Media** (`product.image`) | the gallery on `/products/[slug]` and the lead image on its card |
| **Attachments** (`ir.attachment` on the product) | the file a buyer is handed — Bernaum has one, ReplyFrame does not |
| **Variant** (`product.product`) | what the sale order line points at |

Both are served through this site rather than linked from Odoo: these
products are not published on the Odoo website, so `/web/image/...` would
404 for the public. `app/api/odoo/media` fetches them with the server-side
read key and streams the bytes, against a strict allow-list of
model/field pairs — a proxy that will fetch any binary of any model is an
open door to every attachment in the database.

**The checkout.** Both products are free, so there is nothing to pay and no
payment step. What the flow collects is *who* — so the order is a record
rather than an anonymous download, and so those people can be reached
later. `/products/[slug]/checkout` runs three steps (details → review →
confirmation) and on confirmation writes to Odoo:

1. `res.partner` — reused if that email already exists, so a repeat
   customer stays one contact.
2. `sale.order` — origin naming this site, one line at 0.00.
3. `action_confirm()` — a draft order is a quotation and would not reach
   Sales reporting or any mailing automation, so this step is what makes a
   free download count as a sale.

Marketing consent is explicit, per order, and recorded on the order.

The confirmation hands over the goods immediately: the marketplace link,
plus — where the product has a file attached — a signed, expiring download
link (`app/api/download`). The attachment is private in Odoo, so the route
fetches it with the server key and decides access from an HMAC over the
order reference, the attachment id and an expiry. Nothing is stored, and
the link cannot be edited to reach a different attachment without breaking
its signature.

**When a product stops being free**, the server action refuses the order
outright rather than quietly writing a zero-price sale — that line in
`app/products/[slug]/checkout/actions.ts` is the one to change, and it
should change to a payment step (Odoo's eCommerce module can take payment
and deliver the download) rather than to a silent free order.

**Walking the flow without writing to the real database:** in development
only, `CHECKOUT_DEV_STUB=1` makes the action mint a plausible order
reference and skip Odoo. It is ignored in production builds.

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
