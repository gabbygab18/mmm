# Developer Hand-Off — Margaret's MemoryCare Music

This document is for an incoming developer ("incoming dev") taking over this project with no live overlap with the
previous developer ("outgoing dev"). It gets you oriented on architecture, data model, current
build status, and what still needs to happen before launch. For full sprint-by-sprint history
and legal/compliance detail, see the two docs linked at the bottom — this doc summarizes, it
doesn't replace them.

---

## 1. Overview

**Margaret's MemoryCare Music** ("Marg") connects volunteer musicians with memory-care
facilities for live performances. Three account types:

- **Musicians** — post availability, browse facility requests, perform (unpaid/volunteer model).
- **Center coordinators** — manage one or more facility locations, post performance-date
  requests, browse musicians.
- **Admins** — moderate accounts and requests; no separate profile of their own.

There is **no payment processing** in the product — compensation is tracked only as a
preference field, not a transaction. The project is pre-launch, currently in the "Sprint 9 —
Launch Hardening" phase (see §8 for exactly what's left).

---

## 2. Architecture at a Glance

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Database / Auth | Supabase (Postgres + Auth + Row Level Security) |
| Styling | Tailwind CSS |
| Hosting | Vercel (deployed, GitHub-connected auto-deploy; **no custom domain attached yet** — see §7 and §10) |
| Email | Resend (**not yet integrated** — see §6) |

**No API route handlers exist.** This app is built entirely on Server Components (data
fetching) and Server Actions (mutations) — there is no `src/app/api/` layer to reason about.
If you're used to REST/API-route architectures, the mental model here is: pages fetch their own
data server-side, and forms submit directly to `'use server'` functions colocated with the page
(e.g. `src/app/dashboard/account/actions.ts`).

**Folder structure:**

```
src/
  app/
    dashboard/
      admin/            # moderation dashboard + inline server actions
      musician/         # musician profile + availability
      center/           # center profile, locations, requests
      account/          # settings, change-password, self-deletion
      alerts/           # notification history
      requests/         # active request negotiations
      schedule/         # accepted/completed events calendar
    discover/
      musician/[id]/    # public musician profile
      center/[id]/      # public center profile
      location/[id]/    # public location profile
    onboarding/          # post-signup profile setup (musician/center)
    login/  signup/
    privacy/  terms/
  lib/
    auth.ts              # role/session helpers (requireAuthenticatedUser, getCurrentUserRole)
    notifications.ts      # alert + email dispatch logic
    supabase/
      server.ts          # server-side client (cookie-based session)
      browser.ts         # client-side client
      middleware.ts      # session refresh, used by middleware.ts
  components/
middleware.ts             # route protection (see §5)
supabase/migrations/       # 30 SQL migrations — the source of truth for schema
docs/                      # planning + compliance docs (this file included)
```

---

## 3. Roles & User Flows

Role is stored on `users.role`: `'musician' | 'center_coordinator' | 'admin'`, set at signup and
read via `getCurrentUserRole()` (`src/lib/auth.ts`).

**Musician flow:** sign up → onboard profile (name, ZIP, music types, instruments, compensation
preference, travel radius, YouTube channel URL) → post availability dates/time windows → browse
center-posted request slots (or wait to be contacted) → negotiate a request → perform.

**Center coordinator flow:** sign up → onboard center profile + one or more locations → post
performance-date requests per location → browse musician availability (or wait to be contacted)
→ negotiate a request.

**Admin flow:** single all-in-one dashboard (`src/app/dashboard/admin/page.tsx`) — search/filter
musicians and centers, approve/disable profiles, create/resolve moderation flags, view and
override request status. There is **no admin signup path at all** — signup only offers
`musician` or `center_coordinator`. To get an admin account today, someone signs up as either of
those roles and then a person with Supabase access manually edits that user's `users.role` to
`admin` directly in the database. This is a testing/bootstrapping stopgap, not a real
provisioning process, and there's no tooling or UI around it. Whether a proper admin
onboarding/portal is even needed at all is still an **open question for design/product to
decide** — don't assume it's scoped-in work until that's confirmed.

**Request state machine** (core business object, table `requests`):

```
initiated → matched → accepted → completed
                              ↘ cancelled (from any active stage, either side)
```

- Either side can initiate a request.
- Full audit trail in `request_status_history`.
- Counter-proposals for alternate times live in `request_time_proposals`.
- **Phone numbers are hidden until a request reaches `accepted`.**

**Discovery is bidirectional:** musicians can browse center-posted slots, and centers can
browse musician-posted availability — either side can also just directly initiate a request
against a specific profile.

---

## 4. Data Layer (Supabase)

Schema lives entirely in `supabase/migrations/` (30 files, starting
`20260515000000_baseline_schema.sql`) — treat this directory as the authoritative schema
reference; nothing here summarizes every column.

**Core tables (grouped):**

| Group | Tables |
|---|---|
| Identity | `users` (extends `auth.users`, holds `role`), `musicians`, `centers`, `center_locations` |
| Availability | `musician_availability_dates`, `center_request_dates` |
| Requests | `requests`, `request_time_proposals`, `request_status_history` |
| Notifications | `alerts` (in-app), `notifications_log` (email delivery log) |
| Moderation | `moderation_flags` |
| Matching | `zip_centroids` (ZIP → lat/lng centroid lookup for radius matching) |
| Legacy/unused | `event_media` — see §9, this is descoped, do not build against it |

**Row Level Security (RLS) is how authorization is enforced** — every table has RLS enabled, and
there is **no service-role key used anywhere in the app**. Admin access works by policies
checking `(SELECT role FROM users WHERE id = auth.uid()) = 'admin'`, not by bypassing RLS. If you
add a new table, it needs RLS policies from day one — there's no fallback path.

**Key SQL functions (Postgres, not Edge Functions — there are no Supabase Edge Functions in this
project):**
- `get_distance_miles(zip1, zip2)`, `get_nearby_centers_for_musician()`,
  `get_nearby_musicians_for_center()` — ZIP-centroid radius matching
- `get_available_slots_for_musician()` — availability/slot discovery
- `create_alert_for_user()` — RPC used by `src/lib/notifications.ts` to write in-app alerts
- `check_username_availability()` — public profile username validation

**Media/images are URL fields only** (`profile_image_url`, `youtube_channel_url`, etc.) — there
are no Supabase Storage buckets in use. If you need file uploads later, that's new infrastructure,
not an existing pattern to extend.

**Running migrations locally:** use the Supabase CLI against your own project (`supabase db push`
or equivalent) — apply the files in `supabase/migrations/` in filename order. There's no
CI-driven migration step; it's manual today (see §7).

---

## 5. Auth & Authorization

- **Supabase Auth**, email + password only (no OAuth/social login — deferred, see compliance doc).
- Session is cookie-based via `@supabase/ssr`, refreshed in `middleware.ts` → `updateSession()`
  (`src/lib/supabase/middleware.ts`).
- Server-side role/session helpers: `requireAuthenticatedUser()` and `getCurrentUserRole()` in
  `src/lib/auth.ts`. Use these in any new server-rendered page that needs auth — don't hand-roll
  session checks.
- **⚠️ Known routing gap:** `middleware.ts` defines `PUBLIC_PATHS = ['/', '/login', '/signup']`
  using an **exact-match** check (`PUBLIC_PATHS.includes(pathname)`). `/privacy`, `/terms`, and
  all `/discover/*` pages are *not* in that list, so as written, an unauthenticated visitor
  hitting any of those URLs directly gets redirected to `/login` — even though the product docs
  and footer links treat them as public. This directly affects legal compliance (Privacy
  Policy/Terms are supposed to be reachable pre-signup). **Verify this in a fresh
  incognito/no-session browser before launch**, and if confirmed, fix by making `isPublicPath`
  match `/privacy`, `/terms`, and `/discover` (prefix match) as well.
- Supabase email confirmation is **currently disabled** for local dev convenience — this must be
  re-enabled before production launch (tracked in the epic plan, Sprint 9).

---

## 6. Environment Variables & Integrations

Full template in `.env.example`. Categories:

| Variable | Status | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Required, in use | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required, in use | Public anon key (browser + server) |
| `NEXT_PUBLIC_APP_URL` | Required in production | Used for auth/email callback links |
| `RESEND_API_KEY` | **Not yet used** | Sprint 7 — email delivery, gated on domain verification |
| `EMAIL_FROM_ADDRESS` | **Not yet used** | Verified sender address once Resend is live |
| `EMAIL_REPLY_TO` | **Not yet used** | Reply-to (currently would point at `privacy@...`) |
| `NEXT_DISABLE_WEBPACK_CACHE` | Local dev only | Workaround for OneDrive-synced paths on Windows breaking webpack's cache rename |

**No other third-party integrations exist today** — no Stripe/payments, no analytics package, no
error tracking (Sentry etc.), no SMS provider, no Google Maps (planned, unbuilt — see §9), no
Supabase Storage. Musicians link to their own externally-hosted YouTube channel; the platform
does not host or manage that content.

---

## 7. Deployment

- **A Vercel project already exists and is deployed**, connected to the GitHub repo for
  auto-deploy (pushes to `main` deploy to production; PRs get preview deploys, standard Vercel
  git integration behavior). Since it's live and building successfully, the required Supabase env
  vars are presumably already configured in the Vercel project — confirm this and add the Resend
  vars there too once Sprint 7 starts.
- **No custom domain is attached yet** — the app is currently only reachable at its default
  `*.vercel.app` URL. The domain `margaretsmemorycaremusic.com` is registered elsewhere (not
  through Vercel) and still needs its DNS pointed at Vercel (a CNAME/A record change at the
  registrar, plus adding the domain in the Vercel project settings). This is the main outstanding
  deployment task, not project setup itself.
- *Note:* `docs/music-memory-care-epic-plan.md` still lists "Vercel hosting setup (project, env
  vars, preview/prod deploy flow)" as unplanned/not started (Sprint 9) — that's stale. The
  project itself is done; what's actually left is the domain attachment above. Treat this doc as
  more current than that line item until the epic plan is updated.
- No `vercel.json` — all deploy-relevant config is in `next.config.js`, which sets security
  headers on every route: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS (2-year max-age, includeSubDomains, preload).
- **No CI/CD beyond Vercel's own git integration** (no GitHub Actions or separate test/lint
  pipeline) — a push to `main` deploys straight to production with no automated test gate.
- `npm run build` / `npm start` are standard Next.js; `npm run dev:guard` runs a preflight check
  (`scripts/preflight-checks.mjs`) before `next dev`.

---

## 8. Feature Status Matrix

Rolled up from `docs/music-memory-care-epic-plan.md` (the authoritative sprint tracker) into
feature-level status. **Complete** means shipped and not currently flagged as broken (aside from
the routing gap in §5). **In Progress** means partially built. **Not Started** means no code
exists yet.

| Feature | Status | Notes |
|---|---|---|
| Musician & center onboarding/profiles | Complete | Full field sets, pre-populate on edit |
| Multi-location centers | Complete | |
| ZIP-radius discovery & matching | Complete | Centroid-based, ±5 mile expansion control |
| Request workflow & state machine | Complete | Includes counter-proposals, cancellation, audit trail |
| Scheduled events calendar | Complete | `/dashboard/schedule` |
| In-app notifications (alerts) | Complete | 6 alert types, throttled 1/user/type/24h |
| Email delivery (Resend) | **Not Started** | Sprint 7 — entirely gated on domain verification; send path is stubbed only |
| Admin moderation panel | Complete | Approve/disable/flag musicians & centers |
| Admin: automated stuck-request queue | **Not Started** | Manual oversight only today |
| Account settings: change password (in-app) | Complete | Requires current password |
| Account settings: **email-based** forgot/reset password | **Not Started** | ⚠️ See callout below |
| Self-service account deletion | Complete | Soft-delete + anonymization, cancels active requests |
| Privacy Policy / Terms of Service pages | Complete (content) | Routing/public-access bug — see §5 |
| Security headers (CSP/HSTS/etc.) | Complete | |
| Ratings & reputation (Sprint 8) | **Not Started** | On hold, post-MVP |
| Google Maps / directions | **Not Started** | Backlog, unscheduled |
| Vercel hosting setup | **In Progress** | Project exists, GitHub-connected auto-deploy working; custom domain not yet attached (still on default `*.vercel.app` URL) |
| Production hardening (perf, abuse controls, session validation, incident runbook, privacy inbox) | **In Progress** | Sprint 9, several checklist items open |

**⚠️ Password reset discrepancy:** a commit message ("pw reset, some hardening, account deletion
added") reads as if password reset was completed. It was not — that commit only added the
in-app **change password** form (requires knowing your current password). The actual
**forgot-password / email-reset flow** (`/auth/forgot-password`, `/auth/reset-password`,
`resetPasswordForEmail()`, rate limiting) is unbuilt and sits in the Feature Backlog, blocked on
Resend (§6). Don't assume users can recover a lost password today.

---

## 9. Descoped / Out-of-Scope Items

These were deliberately cut or deferred — don't mistake them for unfinished work to pick back up
without checking with the client first:

- **Deferred at MVP scope-setting** (per epic plan "MVP Scope → Deferred"): traveling/remote-mode
  musicians, automated ranking/recommendation algorithms, SMS notifications, deep analytics,
  real-time chat, payments, native mobile apps, a musician knowledge quiz, and a centralized
  auto-posting YouTube pipeline.
- **Admin-curated per-event media (removed, June 28, 2026):** an earlier sprint built a workflow
  for admins to attach YouTube videos to completed events. It was replaced by musicians
  self-managing their own YouTube channel link on their profile. The `event_media` table and its
  migration (`20260517020000_sprint6_admin_media_foundation.sql`) still exist in the schema for
  historical reasons but are **unused** — don't build new features against this table, and don't
  resurrect the admin media UI without confirming the client wants it back.
- `scripts/run-migration.js` — unused, safe to delete.
- Two `npm audit` warnings in `next@15.0.0` — known, intentionally deferred to the next Next.js
  upgrade cycle, not an urgent fix.

---

## 10. Account & Access Inventory / Transfer Plan

outgoing dev currently owns every account below and will transfer or share access as part of this
hand-off. outgoing dev remains reachable for occasional questions and can help directly with DNS/Vercel
connection steps during the transfer.

**Transfer approach (ownership vs. collaborator access) is not yet decided** — this should be
driven by the project manager/client, not assumed. Confirm per-system before acting on any of the
rows below; some may end up as full ownership transfer, others as outgoing dev retaining
billing/root ownership with incoming dev added as a collaborator.

| System | Current state | Notes |
|---|---|---|
| GitHub repo | Owned by outgoing dev | Transfer approach TBD (PM decision) |
| Supabase project | Owned by outgoing dev | No service-role key in use; incoming dev needs project owner/admin access to manage schema, auth settings, and RLS policies. Transfer approach TBD |
| Vercel project | **Exists, owned by outgoing dev, deployed and connected to GitHub** (auto-deploy on push) | Not on a custom domain yet — see §7. Transfer approach TBD |
| Domain registrar (`margaretsmemorycaremusic.com`) | Domain is registered (registrar TBD — get this from outgoing dev directly), owned by outgoing dev | DNS not yet pointed at Vercel. Needed for both the Vercel custom domain and future Resend sending-domain verification. Transfer approach TBD |
| Resend account | Not yet created | Needed for Sprint 7 (email delivery) |
| Domain email hosting (for `privacy@margaretsmemorycaremusic.com`) | **Not set up at all** — no mailbox provider (e.g. Google Workspace) is configured for this domain yet | This is a bigger gap than just "create the inbox" — a mail hosting provider needs to be chosen and configured before the address referenced in the Privacy Policy can actually receive mail. Open Sprint 9 item, currently blocking |

---

## 11. Where to Go for More Detail

- **`docs/music-memory-care-epic-plan.md`** — full sprint-by-sprint history, every task and its
  status, technical reference notes (dev server quirks, DB enums). This is the source this
  document's feature matrix and descope list were built from — if the two ever disagree, treat
  the epic plan as more current and update this doc.
- **`docs/launch-compliance-baseline-2026-06-05.md`** — legal/compliance scope: Privacy Policy,
  Terms, transactional email rules, data request handling, incident response.
- Other files in `docs/` (`client-alignment-change-plan-*`, `client-proposal-scope-*`,
  `wordpress-*`) are historical client-facing scope/decision records, useful for context on *why*
  certain calls were made, not for current build status.
