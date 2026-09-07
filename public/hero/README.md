# Hero portraits

`src/lib/content.ts` → `SLIDESHOW_IMAGES` points at `/hero/1.png` … `/hero/4.png`.

Drop the four portraits here with those exact names, in the order they
should cycle. They render at 100x100 in the home hero, cropped to
`background-size: cover`, so square crops work best.

Any web format is fine — if you switch to `.jpg` or `.webp`, update the four
paths in `SLIDESHOW_IMAGES` to match.
