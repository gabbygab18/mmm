# Landing page — drop-in changes (v2, exact-design match)

Homepage (`/`) now matches the approved "Bringing Music to Memory Care" design pixel-for-pixel,
using the design pack's exported **button assets**, the **light-streak wave**, and the
**musical-note decorations**. Every CTA — header **Sign in**, **Get Started — It's Free!**,
and the hero **Sign in** — routes to the sign-in page at `/login`.

## Copy these into the MMM project (same paths)

| File | Change |
|------|--------|
| `src/app/page.tsx` | **Replaced** — landing page (server component, no client JS). |
| `src/app/layout.tsx` | **Edited** — adds Playfair Display display font next to Nunito. |
| `src/app/globals.css` | **Edited** — appends landing-only classes (hero blend, entrance animation). |
| `tailwind.config.ts` | **Edited** — adds `ocean` blue scale, `cream` colour, `display` font. Green `brand` scale untouched. |
| `public/landing/*` | **New/updated** — 11 assets (hero, 3 cards, logo, 2 button PNGs, wave, 3 note overlays). |

## What changed from v1
- The **Get Started** and hero **Sign in** buttons now use the exact PNG assets from the
  design pack (`btn-get-started.png`, `btn-signin.png`), wrapped in accessible links
  (`aria-label` + focus rings). They still link to `/login`.
- The header **Sign in** is a solid navy pill in CSS (its asset was a two-state composite).
- Added the bright **light-streak wave** (`wave.png`) across the hero/section boundary.
- Added **treble-clef note decorations** (`notes-ur.png`, `notes-bl.png`) in the blue section
  and a faint staff overlay (`notes-center.png`) in the hero.
- Hero wash is now left-weighted so the headline stays legible while the audience photo
  shows through on the right, matching the design.

## Notes
- Nothing else in the app changes; login, signup, dashboard, and the green `brand` palette
  are untouched. `/` stays statically prerendered.
- Headline/body/card text are real HTML (accessible, responsive, translatable). Only the two
  hero buttons use baked-in-text images, per request — say the word if you'd rather have those
  as CSS too (selectable text, sharper on 4K).
- Social links (FB / IG / YouTube / TikTok) point to `#` — swap in real URLs when ready.
- Verified locally: `tsc --noEmit` passes, `next build` compiles, `/` prerenders static, and
  the page was screenshot-tested at 1366px and 390px.
- First `npm run dev`/`build` needs internet for Google Fonts (Nunito + Playfair) — same as before.
