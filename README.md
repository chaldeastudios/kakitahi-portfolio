# kakitahi-portfolio

Next.js transcription of the Framer home page (`/`) for the Paige Holden
portfolio template.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion 13
- **Scope:** the home page only. `/projects`, `/projects/:slug`, `/archive`,
  `/:slug` and `/404` are intentionally untouched.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Structure

```
src/
  app/globals.css          design tokens + the three-tier type scale
  lib/content.ts           every string, transcribed verbatim
  components/layout/       PageTemplate (header + footer + pattern ground)
  components/ui/           Button, TextLink, FooterLink, Logo, MenuButton,
                           AnimatedCounter, TimezoneClock, ImageSlideshow,
                           Cursor, ProjectCard
  components/sections/     Hero, About, Stats, Works, Services,
                           Testimonials, Cta
```

Section order matches the Framer Desktop frame exactly: Hero → About →
Stats → Works → Services → Testimonials → CTA. No section is omitted,
reordered or rewritten.

## Transcribed verbatim

Read directly out of the Framer project and reproduced as-is:

- **Copy** — every heading, paragraph, label, list item, testimonial and
  link target, word for word, in `src/lib/content.ts`.
- **Colours** — all seven project colour styles.
- **Typography** — the desktop values of all 14 text styles (family,
  size, line height, letter spacing, weight, transform, tag).
- **Layout** — grids, sticky offsets, borders, padding, gaps and the
  colour of every frame in the Desktop breakpoint.
- **Button** (`gvRRv8Sb0`) — including the wipe: a 0px-wide `/Yellow`
  rectangle pinned at `left:-1px` that expands to full width on hover
  while the label flips to black and the arrow swaps via two stacked
  copies inside an overflow-clipped box.
- **Header** (`ZXssPGx1d`) and **Footer** (`carqf7q3G`) structure.
- **TimezoneClock** — ported from the project's own
  `Workshop/SimpleTimezoneClock.tsx` code component.
- **Stats stagger** — the 0 / 240 / 480 / 720px column offsets that produce
  the cascading pin are the design's own values.

## Reconstructed — verify these against Framer

Framer's MCP could not serialise the following, so they are rebuilt from
the design system's own idiom rather than copied. Each is flagged in a
comment at the top of its file.

| Gap | Why | Where |
|---|---|---|
| Tablet + phone type sizes | MCP exposes only one size per text style | `globals.css` |
| Tablet + phone layout overrides | Non-primary variants return no children | all sections |
| Hover states | Hover variants return no children | `Button`, `TextLink`, `FooterLink` |
| Text-Link, Footer Link, CTA, Testimonials, Project Card internals | MCP errors `Node is not a text node` | those components |
| Menu Button | same MCP error | `MenuButton.tsx` |
| Slideshow images | bound images not exposed | `content.ts` |
| Background pattern | `framerusercontent.com` unreachable | `public/pattern.svg` |

Remote images still point at `framerusercontent.com`; they resolve in a
browser but not from a sandboxed build environment.

Breakpoints follow the Framer canvas: phone `<810px`, tablet `≥810px`,
desktop `≥1200px`.
