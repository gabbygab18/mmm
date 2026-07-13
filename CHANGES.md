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

---

# Auth pages — sign-in & sign-up redesign (landing-design match)

`/login` and `/signup` now follow the approved auth mockups: cream header with the
heart-note logo, ocean-blue photo hero with the musical-notes texture, warm cream
form card with the Playfair serif heading, round social icons, and the cream footer
strip. All Supabase logic (sign-in, sign-up with role, password strength, deleted-account
notice, error/confirm messages) is unchanged.

## Copy these into the MMM project (same paths)

| File | Change |
|------|--------|
| `src/components/auth-shell.tsx` | **New** — shared shell for both auth pages (header, photo hero + overlays, aside slot, socials, footer). |
| `src/app/login/page.tsx` | **Replaced** — new design; hero photo + quote on the right (desktop) / below the photo (mobile). Same auth logic. |
| `src/app/signup/page.tsx` | **Replaced** — new design; glass Musicians / Memory Care Centers info cards over the caregiver photo, gradient role pills with icons. Same auth logic. |
| `public/landing/signup-hero.jpg` | **New** — caregiver photo for the sign-up hero (cropped from the design pack's centers card). |

## Notes
- Both pages reuse existing assets (`hero.jpg`, `logo.png`, social PNGs, `notes-center.png`)
  and the existing `ocean` / `cream` palette + Playfair `font-display` — no config changes.
- `SiteFooter` is no longer used on the auth pages (replaced by the cream footer in the
  shell, per the mockups); it remains untouched for other pages.
- Responsive: desktop shows the full-bleed photo with the card on the left; mobile stacks
  photo → quote/info cards → card → socials → footer, matching the mobile mockups.

---

# Auth pages — typography spec + desktop sign-up flip (v2)

Applied the annotated font spec to `/login` and `/signup`:
**Cormorant Garamond** for the card headings, **Poppins** for everything else,
at the exact annotated sizes (desktop / mobile):

| Element | Desktop | Mobile |
|---|---|---|
| Card heading | Cormorant Garamond 37.7 | 24.3 |
| Subtitle | Poppins 13.8 | 8.9 (login) / 8.3 (signup) |
| Labels & inputs | Poppins 10.7 | 8.3 |
| Role pills | Poppins 11.9 | 8.4 |
| Buttons | Poppins Bold 17 | 13.1 (sign in) / 10.6 (create) |
| Helper links / terms | Poppins 10.7 | 8.3 |
| Quote / attribution | Poppins Italic 22.2 / 17.8 | 10.9 / 8.7 |
| Info card title / body | Poppins Bold 17 / 15 | Bold 8.4 / 7.7 |
| "Always free…" | Poppins 10.7 | 6.9 |
| Footer | Poppins 10.7 | 4.8 |

Also per the new desktop sign-up mockup, the cream card now sits on the **right**
with the Musicians / Memory Care Centers info cards lower-**left** (login unchanged:
card left, quote right). `AuthShell` gained a `cardSide` prop; the legibility gradient
follows the card side.

## Copy these into the MMM project (same paths)

| File | Change |
|------|--------|
| `src/app/layout.tsx` | **Edited** — loads Poppins (400–700 + italics) and Cormorant Garamond (600–700) next to the existing fonts. |
| `tailwind.config.ts` | **Edited** — adds `font-garamond` and `font-poppins` families. Existing `sans`/`display` untouched. |
| `src/components/auth-shell.tsx` | **Edited** — `cardSide` prop, mirrored gradient, Poppins footer sizes. |
| `src/app/login/page.tsx` | **Edited** — spec typography. |
| `src/app/signup/page.tsx` | **Edited** — spec typography + `cardSide="right"`. |
