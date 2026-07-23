# Public pages + registration fixes — 23 July 2026

Closes the public-site gaps identified against the spec, and delivers four of
the five changes promised to Michael.

## New routes

| Route | Notes |
|---|---|
| `/register/facility` | 5-step wizard + thank-you screen. The biggest gap — facilities previously had no registration path at all. |
| `/about` | Margaret & Michael's story, Our Story timeline, mission / vision / goals. |
| `/how-it-works` | Parallel musician (7 steps) and facility (6 steps) paths. |
| `/why-music-matters` | Hero + nine education topic cards linking into `/education`. |
| `/faq` | Seven-question accordion + "Still have questions?" band. |
| `/contact` | Inquiry form (volunteer / facility), contact cards, socials, service-area map. |
| `/api/contact` | Stores submissions in `contact_inquiries`; verifies Turnstile when configured. |

All six are in the middleware public allowlist.

## Client-requested changes

| Request | Status |
|---|---|
| Show/hide password toggle | Done — `PasswordField` in `components/mmm/form-kit.tsx`, used by both wizards. |
| Split first / last name | Done — both wizards. Musicians are told facilities see "First L." |
| Free-text fields → dropdowns | Done — vocabularies centralised in `lib/mmm/options.ts`. |
| Human verification | Done — `components/mmm/human-check.tsx`. |
| Registration data not retained | Root cause found and fixed. See below. |

### Registration data retention — root cause

`on_auth_user_created` (migration `20260515000200`) only inserted `id`, `role`,
and `email` into `public.users`. Every other answer stayed in
`auth.users.raw_user_meta_data->'registration'` and was never copied into
`musicians` / `centers` / `center_locations`, so onboarding and the dashboard
loaded empty.

Migration `20260723090000` rewrites the trigger to hydrate those tables from the
signup metadata, adds `first_name` / `last_name` to `musicians` and the facility
fields to `centers`, creates the first `center_locations` row from the step-2
address, and backfills existing accounts from metadata already on file.

## Migrations to apply

```
supabase/migrations/20260723090000_registration_retention_and_facility_fields.sql
supabase/migrations/20260723091000_contact_inquiries.sql
```

Apply in order. Both are idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE`).

## Human verification setup

Works out of the box with a built-in arithmetic challenge plus a honeypot field
and a minimum time-on-form check. To switch to Cloudflare Turnstile, set:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...   # renders the widget
TURNSTILE_SECRET_KEY=...             # server-side verification in /api/contact
```

No code change needed — the component and the API route both detect the keys.

## Assets

Designer exports are trimmed and written to `public/mmm/pages/` (~4 MB).

Note: most of the design pack ships copy as PNG images (headings, labels, button
captions). Those were **not** used — text is set live in Cormorant Garamond and
Poppins at the annotated sizes, so it stays selectable, translatable, indexable,
and readable by screen readers. Only genuine artwork was taken: hero photos,
Margaret's portrait, the map, icons, and background textures.

## Placeholders to replace

- Contact e-mail (`info@margaretsmemorycaremusic.org`) and phone `(561) 555-0142`
- Social links point at each platform's home page
- `/why-music-matters` cards deep-link to `/education#…` anchors that don't exist
  yet in the education page

## Design questions for Michael

1. **Nav conflict.** The spec's primary nav ends with "Why Music Matters"; every
   mockup still shows "Education". Both pages exist, and the mockups' Education
   screen and the Why Music Matters screen look like the same design. Current
   build follows the spec — nav shows Why Music Matters, and Education stays
   reachable from the footer. Confirm which he wants.
2. **Step 5.** The mockups he shared jumped from step 4 to the thank-you screen,
   but the Step 5 asset folder contains "Review Your Information" fields. Built
   as a review-and-confirm step; worth confirming that matches his intent.
3. **Type scale.** Mockup annotations use uneven sizes (65.9, 50.8, 42.6, 32.3).
   Reproduced as-is for fidelity. Say the word if a normalised scale is wanted.

## Not in this batch

The four dashboard mockups — musician, facility, admin, Request a Performance —
plus the spec's volunteer-hours tracking, notifications surfacing, favorite
musicians, and admin education/song-library management. These are data-driven
against existing routes and are the natural next batch.
