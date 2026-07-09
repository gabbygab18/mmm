# Music Memory Care — Project Plan

A free-tier-first platform (Next.js 15 + Supabase + Vercel) connecting musicians with memory-care facilities for live volunteer performances.

---

## MVP Scope

**In scope**
- Both-sided accounts (musicians, center coordinators, admin)
- Full profile management with photos and YouTube channel link
- ZIP-radius viability matching (approximate, centroid-based)
- Date-based availability postings from both sides
- Discovery in both directions (musicians browse center slots; centers browse musician availability)
- Two-way request initiation; facility selects musician
- In-app alerts + email notifications
- Admin oversight, moderation, and profile management
- Multi-location support under one center account
- Volunteer-only model at launch (no payment processing)

**Deferred**
- Traveling musician remote-mode
- Automated ranking/recommendations
- SMS notifications
- Deep analytics
- Real-time chat, payments, native mobile apps
- Musician knowledge quiz
- Centralized MMM YouTube auto-posting pipeline

---

## Key Decisions

| Decision | Outcome |
|---|---|
| Infrastructure | Free-tier Supabase (DB/auth/storage) + Vercel (Next.js app) |
| Matching algorithm | ZIP centroid + miles radius (v1) |
| Notification channels | In-app alerts + email (v1) |
| Phone visibility | Hidden until request reaches accepted state |
| Multi-location centers | Required in v1 |
| Profile pre-approval | Deferred — MVP auto-publishes; admin can disable/flag anytime |
| Cancellation | Either side can cancel at any workflow stage |
| Request initiation | Either side can initiate (musician-first or center-first) |
| Center-to-musician | Centers can contact multiple musicians for one date simultaneously |
| Discovery model | Both models: direct requests/proposals and slot-based discovery from posted availability |
| Identity verification | No ID/DL documents stored in platform; use external verification/background-check provider (~$1/check target) |
| Musician content | Musicians self-manage their YouTube channel; platform links to it on their profile. No admin-curated per-event media. |
| Portability | Add handoff/export documentation so platform can be transferred to another developer |

---

## Time Tracking

| Sprint | Hours | Status |
|--------|-------|--------|
| Sprint 0 — Foundation | 1.5 | ✅ Complete |
| Sprint 1 — Profiles & Auth | 3.0 | ✅ Complete |
| Sprint 2 — Discovery & Matching | 2.0 | ✅ Complete |
| Sprint 3 — Request Workflow | 1.0 | ✅ Complete |
| Sprint 4 — Notifications | 2.0 | ✅ Complete |
| Sprint 5 — Slot Discovery & Scheduling UX | 4.0 | ✅ Complete |
| Sprint 6 — Admin Panel & Musician Media | 1.5 | ✅ Complete |
| Sprint 7 — Email Delivery | TBD | ⬜ Planned |
| Sprint 8 — Ratings & Reputation | — | ⬜ On Hold (post-MVP) |
| Sprint 9 — Launch Hardening | 4.0+ | 🟨 In Progress |
| **Total so far** | **17.5** | |

---

## Sprints

### Sprint 0 — Foundation ✅ Complete

Setup and infrastructure. No user-facing features.

| Task | Status |
|---|---|
| Supabase project (auth, storage, env) | ✅ |
| Next.js 15 + Supabase SSR client wiring | ✅ |
| Baseline schema (10 tables, RLS enabled) | ✅ |
| Role-based RLS policies | ✅ |
| Auth trigger: `on_auth_user_created` | ✅ |
| `get_my_role()` SECURITY DEFINER (prevents RLS recursion) | ✅ |
| GRANT SELECT/INSERT/UPDATE to `authenticated` on all tables | ✅ |
| Smoke-test all 3 roles | ✅ |

---

### Sprint 1 — Profiles & Auth ✅ Complete

Auth, onboarding, and full profile management for musicians and centers. Includes stability hotfixes applied early in the sprint.

| Task | Status |
|---|---|
| Stability hotfixes: duplicate default exports, orphaned JSX blocks, route compile sweep | ✅ |
| Signup/login (email + role selection) | ✅ |
| Role-aware routing middleware | ✅ |
| Per-role onboarding pages | ✅ |
| Protected dashboards (musician, center, admin) | ✅ |
| Admin approval toggle | ✅ |
| Musician onboarding: full field set (name, phone, ZIP, photo, bio, music types, instruments, band size, compensation, availability days, travel) | ✅ |
| Musician onboarding: pre-populate on edit (no data wipe) | ✅ |
| Musician dashboard: hero card, info grid, availability day chips | ✅ |
| Musician availability slot scheduling (date + time windows) | ✅ |
| Center onboarding: full field set (name, phone, resident count, photo) | ✅ |
| Center onboarding: pre-populate on edit | ✅ |
| Center dashboard: hero card, multi-location list | ✅ |
| Add/edit center locations (`/dashboard/center/locations/new`) | ✅ |

---

### Sprint 2 — Discovery & Matching ✅ Complete

ZIP-centroid distance calculation, viability radius filtering, and discovery views for both sides.

| Task | Status |
|---|---|
| Load ZIP centroid coordinates table | ✅ |
| Distance function: `get_distance_miles(zip1, zip2)` | ✅ |
| Matching helper SQL functions (nearby centers/musicians RPC) | ✅ |
| Musician discovery view: browse nearby centers in radius | ✅ |
| Center discovery view: browse nearby musicians per location | ✅ |
| Profile completeness gate before appearing in search results | ✅ |
| Matching smoke tests (distance boundary validation) | ✅ |
| Pagination (limit 100, result counts displayed) | ✅ |

---

### Sprint 3 — Request Workflow ✅ Complete

Two-way request initiation, state machine, auditable status history, and a dedicated schedule view for accepted events.

| Task | Status |
|---|---|
| Either side initiates a request (calendar + time-slot form at `/dashboard/requests/new`) | ✅ |
| Request state machine: initiated → accepted → completed / cancelled | ✅ |
| Status transition audit log (`request_status_history`) | ✅ |
| Alternate time proposals (suggest new time + proposal history) | ✅ |
| Phone number reveal only after request is accepted | ✅ |
| Cancellation from either side at any active stage | ✅ |
| Requests page: active negotiations + archive section | ✅ |
| Scheduled Events page (`/dashboard/schedule`): accepted + completed events separate from negotiations | ✅ |
| Month-grid calendar view for scheduled events | ✅ |

---

### Sprint 4 — Notifications ✅ Complete

In-app alert bell, full alerts history page, and notification plumbing for all six request/event transition types. Email delivery is wired but deferred to Sprint 7 (domain verification required).

**6 alert types:** `request_initiated`, `request_accepted`, `request_cancelled`, `proposal_suggested`, `event_completed`, `event_cancelled`. Throttle: max 1 email per user per type per 24 hours.

| Task | Status |
|---|---|
| `src/lib/notifications.ts`: `createAlert()`, `shouldSendEmail()`, `notifyUser()`, `getRecipientEmail()` | ✅ |
| Expanded `alert_type` DB enum (6 types) | ✅ |
| DB triggers: `notify_request_initiated()`, `notify_proposal_suggested()` | ✅ |
| Notifications wired into request status actions (accept/cancel/complete) | ✅ |
| `NotificationBell` component: unread badge, dropdown with 10 recent alerts, dismiss, link to history | ✅ |
| `/dashboard/alerts` history page: type badges, status indicators, formatted dates | ✅ |
| Bell added to `AuthNav` (desktop sidebar + mobile) | ✅ |
| Email send path stubbed; actual delivery deferred to Sprint 7 | ✅ |

---

### Sprint 5 — Slot Discovery & Scheduling UX ✅ Complete

Posted-slot discovery as a first-class workflow and upgraded scheduling UX.

| Task | Status |
|---|---|
| Routeable musician and center profile pages (`/discover/musician/[id]`, `/discover/center/[id]`, `/discover/location/[id]`) | ✅ |
| Musician-side slot discovery: browse center-posted request slots in area | ✅ |
| Center-side slot discovery: browse musician availability slots in area | ✅ |
| Discovery calendar view: aggregated openings for nearby users | ✅ |
| Musician scheduling calendar: explicit free slots + soft day-of-week availability shading | ✅ |
| Drag-select day grid for time selection (30-minute blocks) | ✅ |
| Quick distance expansion controls in discovery (±5 miles) | ✅ |

---

### Sprint 6 — Admin Panel & Musician Media ✅ Complete

Admin moderation tools for accounts and requests. Initial per-event media workflow was built and replaced with a simpler musician-owned YouTube channel link.

| Task | Status |
|---|---|
| Admin: musician list — view, disable, re-enable, flag | ✅ |
| Admin: center list — view, disable, re-enable, flag | ✅ |
| Admin: request/event oversight view + manual status correction | 🟨 Partial (automated stuck-request queue not built) |
| Musician profile: `youtube_channel_url` field (DB migration + CHECK constraint) | ✅ |
| Musician onboarding/edit: YouTube channel URL input | ✅ |
| YouTube channel link on public musician profile and musician dashboard | ✅ |
| Remove admin-driven per-event media workflow and all associated UI | ✅ |
| Remove Event Portfolio sections from musician, center, and location profiles | ✅ |

> **Direction change (June 28, 2026):** Initial plan had admins attaching YouTube videos to completed events. Replaced by musician-owned channel links — musicians self-manage their YouTube content, and the platform links directly to the channel URL. The `event_media` table remains in DB migrations for history but is unused.

**Remaining (non-media):**
- Consider dedicated admin subroutes (`/dashboard/admin/musicians`, `/dashboard/admin/centers`) if the all-in-one admin page becomes unwieldy
- QA pass on role-based visibility and moderation flows

---

### Sprint 7 — Email Delivery ⬜ Planned

**Gate:** verified sending domain (DNS configured and validated in Resend).

| Task | Status |
|---|---|
| Create Resend account + verify sending domain | ⬜ |
| Add env vars (`RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`) in local + Vercel | ⬜ |
| Implement real send path in `src/lib/notifications.ts` (alert-first, email best-effort) | ⬜ |
| Persist delivery metadata in `notifications_log` (`delivery_status`, `resend_message_id`, `provider_error`) | ⬜ |
| Include unsubscribe link in all outbound notification emails (CAN-SPAM compliance) | ⬜ |
| Unsubscribe link updates user email preference; subsequent emails are suppressed | ⬜ |
| Validate throttle: 1 email/user/type/24h | ⬜ |
| Validate all 6 alert types send end-to-end | ⬜ |
| Failure-mode test: bad key/domain does not break in-app alerts | ⬜ |

---

### Sprint 8 — Ratings & Reputation ⬜ On Hold (post-MVP)

Post-event lightweight feedback between musicians and centers.

| Task | Status |
|---|---|
| Rating model (musician rates center; center rates musician) | ⬜ |
| Completed-event-only eligibility rules | ⬜ |
| Rating submission UI | ⬜ |
| Aggregate rating display on profiles | ⬜ |
| Moderation / abuse handling for ratings | ⬜ |

---

### Sprint 9 — Launch Hardening 🟨 In Progress

Production readiness: performance, security, compliance, and deployment.

**Progress (May–June 2026):** UI redesign complete (brand/stone system), responsive shell (desktop sidebar + mobile drawer), notification bell restored in new shell with inline dismiss, realtime channel collision fixed, matching radius and notification deduplication smoke tests passed. Branding renamed to "Margaret's MemoryCare Music", shared site footer with Privacy/ToS links and social placeholders shipped on all public and authenticated surfaces.

| Task | Status |
|---|---|
| Front-end visual refresh (navigation, hierarchy, spacing) | ✅ |
| Responsive UX hardening (mobile/tablet/desktop breakpoints + touch targets) | ✅ |
| Notification bell: desktop sidebar + mobile parity, inline dismiss, footer link to history | ✅ |
| Notification realtime stability (unique channel IDs per bell instance) | ✅ |
| Matching radius edge-case smoke tests (`s2_matching_edge_cases.sql`) | ✅ |
| Notification deduplication + throttle smoke tests (`s4_notification_dedupe_throttle.sql`) | ✅ |
| App-wide branding rename to "Margaret's MemoryCare Music" (layout, login, signup, sidebar, onboarding header) | ✅ |
| `SiteFooter` component: copyright, Privacy Policy link, Terms of Service link, Facebook + Instagram placeholders | ✅ |
| Footer on all public surfaces: landing page, login, signup, `/privacy`, `/terms` | ✅ |
| Footer links (Privacy, Terms, socials) in authenticated sidebar (desktop + mobile drawer) | ✅ |
| Signup consent text linking to Terms and Privacy Policy | ✅ |
| Privacy Policy page (`/privacy`): public, no auth — data collected, usage, sharing, email/unsubscribe, retention, user rights, cookies, contact | ✅ |
| Terms of Service page (`/terms`): public, no auth — volunteer-only model, acceptable use, scheduling commitments, content/photo rights, safety disclaimer, account termination | ✅ |
| Age verification at signup (18+): 18+ requirement documented in Terms; consent text on signup page | ✅ |
| `privacy@margaretsmemorycaremusic.com` referenced in Privacy Policy as contact for data access, export, and deletion requests | ✅ |
| Security headers in Next.js config (CSP, X-Frame-Options, Referrer-Policy, HSTS, Permissions-Policy) | ✅ |
| iPhone viewport overflow fix (`overflow-x-hidden` on body) | ✅ |
| Mobile bell: auto-close popover on navigation link click | ✅ |
| Account settings page (`/dashboard/account`): change password, email notification toggle, delete account danger zone | ✅ |
| Notification email preferences: `email_notifications_enabled` column on `users` table, toggle in account settings | ✅ |
| Self-service account deletion: soft-delete with anonymization, cancel active requests, `deleted_at` on musicians/centers, redirect to login with confirmation | ✅ |
| Admin: surface deleted accounts with "Deleted" badge in musician and center oversight views | ✅ |
| Custom 404 page (`/not-found.tsx`): branded, links to home and dashboard | ✅ |
| Dashboard loading states: `loading.tsx` for musician, center, requests, schedule, admin, and root dashboard routes | ✅ |
| `.env.example`: documented all required and planned env vars with descriptions | ✅ |
| Password strength indicator on signup and account settings change-password form | ✅ |
| Performance profiling + latency fixes (requests, transitions, dashboard refreshes) | ⬜ |
| Notification actionability: direct actions from bell dropdown, not just links to notification board | ⬜ |
| Abuse-control strategy for auth/forms (rate limiting or bot challenge at edge layer) | ⬜ |
| Session/cookie/auth behavior validated in production (login, logout, refresh, expiry, role redirects) | ⬜ |
| Set up `privacy@margaretsmemorycaremusic.com` inbox and verify it routes correctly | ⬜ |
| Unsubscribe action confirmation page (`/account/unsubscribe?token=...`): one-click opt-out, no login required | ⬜ |
| Transactional email footer: organization identity, contact address, and unsubscribe link | ⬜ |
| Incident response mini-runbook | ⬜ |
| Re-enable Supabase email confirmation (currently off for dev) | ⬜ |
| Vercel hosting setup (project, env vars, preview/prod deploy flow) | ⬜ |
| Launch runbook (free-tier limits, deployment ops checklist) | ⬜ |
| Dependency and configuration security pass (lock env usage, validate secrets, document known risks) | ⬜ |

> **Account deletion retention rule:** preserve anonymized event completion records, moderation flags, and auth audit trail. Delete everything else (name, phone, photo, bio, ZIP, availability slots, alerts, notifications log).

---

## Feature Backlog

Planned features not yet assigned to a sprint.

### Password Reset & Account Settings

Self-service password recovery and in-app password change. Depends on Resend email delivery (Sprint 7).

| Task | Status |
|---|---|
| `/auth/forgot-password` page: email input, sends reset link (never expose whether email exists) | ⬜ |
| `/auth/reset-password` page: token validation + new password form (24-hour link expiry) | ⬜ |
| Supabase Auth `resetPasswordForEmail()` + `updateUser()` integration | ⬜ |
| Account settings: change password form (requires current password) | ⬜ |
| Client-side password strength validation with visual feedback | ⬜ |
| Rate-limit reset requests (max 3/email/hour) | ⬜ |
| Smoke test: request → email → link → new password → login success | ⬜ |

### Google Maps — Location & Directions

Embedded map on center profiles with directions from musician's ZIP centroid (not exact address).

| Task | Status |
|---|---|
| Google Cloud project + Maps JavaScript API key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var) | ⬜ |
| `CenterLocationMap` component: single location pin + "Get Directions" button | ⬜ |
| Center profile page: all locations on one map | ⬜ |
| Musician discovery view: list/map toggle | ⬜ |
| Responsive map layout (mobile full-width, desktop side-by-side) | ⬜ |

---

## Pre-Launch Checklist

- [ ] Access-control matrix: all role/action combinations tested
- [ ] Matching: near-boundary radius values and ZIP centroid correctness
- [ ] Workflow: all transition paths, cancellation, and reopen verified
- [ ] Notifications: deduplication, throttle, and all 6 types end-to-end
- [ ] Responsive UX: core flows on mobile, tablet, and desktop
- [ ] Free-tier limits: storage, query volume, function invocations within bounds
- [ ] Security headers in production response set
- [ ] Abuse controls on auth/form entry points
- [ ] Session/cookie/auth validated in production
- [x] Privacy Policy live, linked from signup/login, footer on all public + authenticated surfaces, covers data collected, retention, deletion rights, and contact for requests
- [x] Terms of Service live, linked from signup/login, footer on all public + authenticated surfaces, covers acceptable use, volunteer model, photo/content rights, account termination
- [ ] Self-service account deletion tested end-to-end (both roles; no dangling FK violations after soft-delete; auth.users deletion is a manual admin step for MVP)
- [x] `privacy@margaretsmemorycaremusic.com` referenced in Privacy Policy as contact — inbox setup still needed (⬜ tracked in Sprint 9)

- [ ] Email opt-out/unsubscribe tested end-to-end: link in email → confirmation page → emails suppressed, no login required
- [ ] In-app notification email preferences tested: users can opt out; preference persists and is respected by send path
- [ ] Transactional email classification documented; no marketing emails at launch; footer includes org identity + unsubscribe link
- [ ] Data access/export request process documented (manual fulfillment via `privacy@[domain]` acceptable for MVP)
- [ ] Moderation SLA defined (expected response time for flagged content)
- [ ] No ID/DL document storage paths in any flow

---

## Next Up

1. Sprint 9: complete remaining hardening tasks — performance, security headers, account deletion, compliance pages, deployment runbook
2. Sprint 7: unblock with domain verification, then wire Resend email delivery
3. Feature Backlog: schedule Password Reset and Google Maps into sprints when prioritized
4. Sprint 8 (Ratings): evaluate for post-launch Phase 2
5. Confirm portability/handoff deliverable scope (export package + runbook)

---

## Technical Reference

**Stack:** Next.js 15.0.0 · Supabase (Postgres + Auth + Storage) · Vercel · TypeScript · Tailwind CSS 3.3

**Key patterns:**
- Server Components for data fetching; Client Components for all forms
- Server Actions for mutations
- `createSupabaseBrowserClient()` — Client Components
- `createSupabaseServerClient()` — Server Components
- `requireAuthenticatedUser()` / `getCurrentUserRole()` — server auth helpers

**Dev server:** requires `NEXT_DISABLE_WEBPACK_CACHE=1` (OneDrive path causes webpack cache rename failures)
```
Remove-Item -Recurse -Force .next; $env:NEXT_DISABLE_WEBPACK_CACHE='1'; npm run dev
```

**DB enums:** `user_role` (musician | center_coordinator | admin), `request_status`, `alert_type`

**Known items:**
- Two npm audit warnings in next@15.0.0 — defer to Next.js upgrade cycle
- `scripts/run-migration.js` — unused, can be deleted
