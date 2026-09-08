# kakitahi-portfolio

Isaiah Kakitahi's portfolio site — a Next.js rebuild of a Framer template
(originally "Paige Holden"), with the design system, components, motion
and layout kept intact and every string of copy replaced with his own,
sourced from the `chaldeastudios/kakitahi` repo.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion 13
- **Pages:** `/` (home), `/projects` (listing), `/projects/[slug]` (case
  study detail, one per project), `/products` (listing), `/products/[slug]`
  (one per product), `/cart`, `/checkout` (the three-step order flow),
  `/account` + `/account/orders/[reference]` (a customer's own orders),
  `/account/login`, `/admin` (staff only), `/journal` (listing),
  `/journal/[slug]` (one per entry), `/404`

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
  app/products/            /products and /products/[slug]
  app/cart/                /cart — what's in the cart, resolved live
  app/checkout/            /checkout — the three-step order flow + action
  app/api/odoo/media/      proxies Odoo binaries (product images)
  app/api/download/        signed, expiring download of a product's file
  app/account/             sign in, the account, and one order
  lib/auth/session.ts      the signed session cookie (no session store)
  lib/auth/accounts.ts     portal users in Odoo: sign in, sign up
  app/admin/               staff-only: prices, client projects, orders
  lib/auth/staff.ts        the /admin gate (Odoo's internal-user flag)
  lib/odoo/orders.ts       a customer's own orders, scoped to their partner
  lib/odoo/projects.ts     client projects and their tasks
  lib/cart/CartProvider    the cart: slugs + quantities, in localStorage
  lib/checkout/orders.ts   partner, purchase history, confirmed sale.order
  lib/checkout/signing.ts  HMAC for the download links
  app/status/               /status — live Odoo connection diagnostics
  app/not-found.tsx        /404
  lib/content.ts           home page's own fixed copy — hero, about, testimonials, CTA, footer
  lib/projects.ts          Project/ProjectImage types (content is Odoo's; see lib/odoo/content.ts)
  lib/journal.ts           JournalPost type (content is Odoo's)
  lib/products.ts          Product type (content is Odoo's)
  lib/odoo/ids.ts           resolves an Odoo id by name/external id, not a hardcoded number
  lib/odoo/config.ts        env-based Odoo connection config
  lib/odoo/json2.ts         Odoo 19 JSON-2 API client (bearer token, no session, retries a 429)
  lib/odoo/content.ts       fetches + parses live services/case studies/products/journal
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

**Status: wired and live. No static fallback — a page that can't reach
Odoo shows this site's own error.tsx rather than stale placeholder
content.**

Odoo is the source of truth for services, products, project case studies,
and journal entries — and, since the checkout, for the orders those
products generate:

| Odoo model | Holds |
|---|---|
| `product.template` in category `Chaldea Studios Services` | The real service offerings |
| `product.template` in category `Chaldea Studios Products` | ReplyFrame, Bernaum |
| `blog.post` in blog `Portfolio`, tagged `Case Study` | The project case studies |
| `blog.post` in blog `Our blog` | The journal entries |

None of these are looked up by a hardcoded numeric id — every category,
blog and tag above is resolved live by its **name** (`resolveIdByName`),
and Odoo's own `base.group_portal` by its **external id**
(`resolveXmlId`), both in `src/lib/odoo/ids.ts`. A record id an
`create()` call gets back is only ever a property of the database that
created it; it is not guaranteed to survive a migration to a different
Odoo instance the way this site's backend has already moved once, from a
self-hosted box to Odoo Online. A name or an external id is.

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
| Product | the service shape, plus repeated `.ks-body > h3 + p… + ul>li`, and `ul.ks-meta > li.ks-kind\|.ks-tagline\|.ks-platform\|.ks-price\|.ks-license\|.ks-published\|.ks-updated\|.ks-tags\|.ks-link-label\|.ks-live-link`, plus the optional purchase rules `li.ks-max-quantity` and `li.ks-once-per-customer`. Its gallery and deliverable are **not** in the description — see below. |

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
which surfaces as the calling route's error.tsx with the reason in the
server log, rather than a section of the live site quietly rendering blank.

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
`getJournalPosts()` in `src/lib/odoo/content.ts`. None of these fall back
to a static dataset — an earlier version of this site did, kept a
byte-identical copy of Odoo's content in `content.ts`/`projects.ts`/
`journal.ts`/`products.ts` for exactly that, and it turned out to be the
wrong call in practice: a real Odoo outage looked like a working page
showing subtly wrong content (a free price where there should be a real
one, no images, stale copy) rather than an obvious error, which made a
migration-era problem harder to see, not easier. Now a failed fetch just
throws, and the nearest `error.tsx` says so plainly. The static files still
exist for their **types** (`Product`, `Project`, `JournalPost`) — pages and
client components need those without pulling in the `server-only` Odoo
layer — but hold no content of their own any more.

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

**Rate limits, and why some of this is cached.** Odoo Online (this site's
backend, since a self-hosted Odoo box has no such limit) enforces its own
platform-level rate limit on the JSON-2 API per source address — an HTTP
429 with an Odoo-branded "Keep calm and breathe deeply" page. A page here
that renders once can mean anywhere from one to a dozen-plus live Odoo
calls (an id lookup, a content read, media, tax lookups for a product
listing), uncached, on every single visit — fine against a self-hosted
box with no limit of its own, enough to trip Odoo Online's under normal
traffic. Two things address that, both in `src/lib/odoo/json2.ts`:

- `callJson2` takes an optional `revalidateSeconds`, which switches that
  one call from `cache: "no-store"` to Next's `next: { revalidate }` fetch
  cache. Read-only content that any visitor could get from any other
  visitor's request — services, case studies, products, journal entries,
  and the id/external-id lookups in `ids.ts` — passes this
  (`CONTENT_CACHE_SECONDS` in `content.ts`, 60s for content and 300s for
  id resolution), so a burst of visits in the same window shares one Odoo
  round trip instead of one each. Anything checkout- or account-scoped (an
  order, a partner, a payment, `/status`'s own diagnostics) stays
  uncached, because it has to be correct on every request and is low
  enough volume that caching it was never the point.
- A 429 is retried up to twice with a short backoff before giving up, on
  every call, cached or not — Odoo's edge rejects the request outright
  before any business logic runs, so, unlike a timeout, it's always safe
  to retry without any risk of double-submitting a write.

This site is not using [Cache
Components](https://nextjs.org/docs/app/getting-started/caching) (Next 16's
new `cacheComponents` flag, off by default) — `next.revalidate` is the
"previous model" fetch-caching API, which is what this project's
`next.config.ts` currently targets.

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

**The cart.** `/cart` holds only slugs and quantities, in `localStorage`.
Prices, titles, images and every purchase rule stay in Odoo and are
resolved server-side each time the cart is rendered or submitted — so a
cart can never carry a stale price, and a product withdrawn in Odoo simply
stops resolving and drops out rather than reaching a checkout that would
fail. There is no Odoo session and no server-side cart: these are free
digital goods with no stock to reserve, so a server cart would protect
nothing while leaving orphaned draft orders behind every browser that
wandered off. The order is created once, at checkout.

### Pricing is live, and Odoo decides it

**The price a customer pays is `product.template.list_price`, read on every
request.** It was briefly a string in the description (`.ks-price`), which
meant changing the price in Odoo changed nothing on the site — a real bug,
and the reason this section exists. Price is data now, not content:

- Product pages, cards, the cart and the checkout all show Odoo's number,
  formatted with Odoo's currency. Zero reads "Free".
- **Order lines are sent with no `price_unit` at all.** Odoo prices each
  line itself from the product and the customer's pricelist. A price sent
  from the site would be a copy, and a copy is exactly how something ends up
  billed at yesterday's number.
- A **free** order is confirmed immediately, as before. A **priced** order is
  created as a *quotation* and left there: nothing is charged, and nothing
  is released. Downloads are gated on the order reaching `sale`/`done`, so
  a customer gets their files when the order is confirmed — which, until a
  payment provider is enabled, is you confirming it in `/admin` once the
  money lands.

**On taking payment properly:** the Odoo instance has no live payment
provider — only *Demo* (test mode) and *Cash on Delivery* are enabled;
*Wire Transfer* exists but is disabled. Enable a real provider (or Wire
Transfer, for bank details) in Odoo and the checkout can grow a payment step
that hands off to it. Until then the flow above is the honest version:
quote, then confirm on payment.

**Purchase rules come from Odoo, per product — nothing is named in code:**

| Rule | Where it lives | Default |
|---|---|---|
| Can this be ordered at all? | Odoo's own **Can be Sold** on the product | — |
| How many may a cart hold? | `li.ks-max-quantity` in `ks-meta` | 1 |
| One order per customer? | `li.ks-once-per-customer` (`no` to disable) | yes |
| Stock | not consulted — these are non-storable **service** products | — |

So a product added to Odoo tomorrow is in the shop, in the cart and
checkout-able with no deploy, and it inherits the digital-goods defaults:
one per cart, one per customer, no inventory.

**"One per customer" is enforced against Odoo, not the browser.** At
checkout the action asks what this partner has already been given
(`sale.order.line` where `order_id.partner_id` is them and
`order_id.state` is `sale`/`done`) and drops those lines, telling the
person why on the confirmation. Clearing storage or switching device
doesn't get a second copy, because the identity that matters is the email
and the record is Odoo's. Cancelling an order in Odoo does release the
limit — a cancelled order is not a sale — which is the sensible way to
re-issue something to someone.

**The checkout.** `/checkout` runs three steps (details → review →
confirmation) for whatever the cart contains, and on confirmation writes:

1. `res.partner` — reused if that email already exists, so a repeat
   customer stays one contact.
2. `sale.order` — origin naming this site, one line per cart line at 0.00.
3. `action_confirm()` — a draft order is a quotation and would not reach
   Sales reporting or any mailing automation, so this step is what makes a
   free download count as a sale.

Marketing consent is explicit, per order, and recorded on the order. The
confirmation hands over the goods immediately, per product: the marketplace
link for everything, plus a signed, expiring download link for products
that have a file attached (`app/api/download`). The attachment is private
in Odoo, so the route fetches it with the server key and decides access
from an HMAC over the order reference, the attachment id and an expiry.
Nothing is stored, and the link cannot be edited to reach a different
attachment without breaking its signature.

### Customer accounts

**Odoo owns the identity.** A customer here is a `res.users` in the Portal
group (`base.group_portal`, id 10 on this database) attached to the
`res.partner` their orders already point at — the same contact the checkout
creates. So signing up doesn't make a second copy of anyone: it gives an
existing contact a way to log in, and their history is there the moment they
get in. Someone who ordered as a guest last week and signs up today with the
same address finds that order waiting.

**Odoo owns the password too.** Sign-up hands the chosen password to Odoo,
which hashes it; sign-in asks Odoo whether a password is right, via
`common.authenticate` on the same unauthenticated `/jsonrpc` endpoint the
status page already pings. No password material is stored in this codebase
or passes through anything but that call. Internal (staff) Odoo users are
refused at the shop's sign-in — this surface is for customers.

**The session is a signed cookie, not a table.** It carries the partner id,
user id and email, signed with the same server secret the download links
use: HttpOnly, SameSite=Lax, Secure in production, thirty days. There is no
session store to grow or leak, and signing out is dropping the cookie. The
cookie is an identity claim only — every page still reads that customer's
real orders from Odoo, so a session can say who you are but never what you
own.

**What a customer sees.** `/account` has two halves because they answer two
questions:

- **Your things** — every product they own, gathered across all orders, each
  with its download and its marketplace link, so nobody has to remember
  which order a file arrived on.
- **Orders** — the record: reference, date, status (Odoo's state in
  customer words), and what was on it. Cancelled orders are shown too;
  "where did my order go" is exactly what a history is for.

`/account/orders/[reference]` is one order in full. The reference in the URL
is matched *within* the set that partner owns, so guessing someone else's
reference finds nothing rather than finding theirs.

**Product pages change for a signed-in owner.** A product limited to one per
customer that they already have loses its Add to Cart — offering it would
only be refused at checkout — and gains "You have this", its download, and a
link into the account. A product that can be bought again keeps its Add to
Cart and simply says so. Signed out, none of this runs and the page is the
public one.

**Checkout knows who they are.** Signed in, the identity comes from the
session rather than the form — it is the one thing on that page a customer
should not be able to change, or one account could order against another's
contact.

### Client projects

A client sees a project when they are the **Customer** on it
(`project.project.partner_id`) — the same contact their orders and their
login point at. That single field is the whole access model: assigning a
client and recording who the work is for are the same act. `/account` shows
each project, its status and its tasks with their stages.

Two field notes for this database: `project.project.stage_id` is not
readable (project stages aren't enabled), so the status shown is Odoo's own
project health field `last_update_status`; task status comes from
`project.task.state`, which is present.

### The admin surface

**Signing in as an internal Odoo user opens `/admin`.** Staff is not a role
this site invents — it is Odoo's own `share` flag, read at sign-in and
carried in the signed session cookie. `requireStaff()` gates the page and
every action re-checks server-side, so hiding a button is presentation and
the check is the permission.

What it does, all of it writes straight to Odoo:

| Panel | Writes |
|---|---|
| Products & pricing | `list_price`, `sale_ok`, and creating a product in the shop's category |
| Client projects | create a project, set its **Customer** (which is how a client gains access), set its status |
| Orders | confirm a quotation (**this is what releases a paid customer's downloads**) or cancel it |

It is deliberately not a second Odoo. Descriptions, media, attachments and
taxes stay in Odoo, because rebuilding those forms here would mean two
places to get them wrong. A product created from `/admin` appears in the
shop immediately with its name and price; its copy and files are added in
Odoo using the record shape above.

**Password resets need email, and this Odoo has none.** Every `mail.mail`
on the instance is in an `exception` state with "Connection refused", so
order-confirmation emails don't arrive either. That is why the confirmation
screen hands over the files directly instead of promising an email, and why
the sign-in page says a forgotten password is reset by hand (Odoo →
Settings → Users → Change Password) rather than offering a link that would
go nowhere. Configure an outgoing mail server in Odoo and both start working
with no change here; `/status` reports on it.

**Why not drive Odoo's own `website_sale` shop**, the way
`chaldeastudios/kilele_coffee` does? That reference scrapes `/shop/cart`,
posts to `/shop/address/submit`, and runs the Demo payment provider through
`/shop/payment` — which needs the products published on the Odoo website, a
delivery carrier, and a payment provider configured. For free digital goods
with no address and no payment, that machinery is all cost and no benefit,
and it would put Odoo's own markup between this site and its design. The
credential pattern and the JSON-2 client here are ported from that
reference; the checkout shape deliberately isn't.

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
