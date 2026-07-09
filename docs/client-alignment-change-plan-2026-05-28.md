# Client Alignment Change Plan (May 28, 2026)

## Objective
Align current MVP implementation with latest client confirmations while preserving the existing architecture and avoiding unnecessary rebuilds.

## Priority Summary
1. Hardest: Participating facilities map integration (regional launch first, national-ready design).
2. Second hardest: New holistic calendar view for events with admin-first filtering by region and center/musician combinations.
3. Moderate: Media submission flow update (musician submits; admin approves/publishes).
4. Small-to-moderate: Musician application/profile field alignment and privacy/contact refinements.
5. Small: Hero/landing education content expansion.

## Confirmed Baseline To Keep
- One platform that starts in Palm Beach County and scales nationally.
- Existing account roles and onboarding structure.
- Existing ZIP-distance matching and request/scheduling workflows.
- Existing admin moderation framework.
- Ratings/comments deferred.

## Scope Changes

### 1. Participating Facilities Map (Hardest)
Goal: Add a map-based discovery/operations surface that starts regionally and scales nationally without redesign.

Phase 1 (MVP map):
- Show participating center locations as map markers.
- Add quick actions per marker:
  - View center/location profile.
  - Open route in external maps (Google/Apple/Waze URL based on address).
- Launch default region = Palm Beach County.

Phase 2 (near-term enhancements):
- Region filters (county/city/ZIP cluster).
- Admin toggles for who appears on map.
- Optional musician availability overlay.

Implementation notes:
- Keep address source of truth in center_locations.
- Avoid exposing restricted musician PII on map.
- Use map stack that can scale to national marker counts (clustering and lazy loading).

Primary files likely impacted:
- src/app/dashboard/discover (new map surface or subroute)
- src/app/discover/location/[id]/page.tsx
- src/app/dashboard/admin/page.tsx (map visibility controls, if added)
- supabase functions/queries for region-filtered location fetches


### 2. Holistic Events Calendar (Second Hardest)
Goal: Add a new calendar experience to view events holistically across the network, with admin-focused filters.

Core requirements:
- Month/week calendar view for accepted/completed events across multiple centers/musicians.
- Filter by:
  - Region (start with Palm Beach area segmentation).
  - Specific center.
  - Specific musician.
  - Center + musician pair/combination.
- Event click-through to request/event details and related profile pages.

Suggested rollout:
- Step A: Admin-only holistic calendar route (keeps initial complexity and permissions controlled).
- Step B: Region filter presets and URL-param persistence.
- Step C: Pairing filters and saved views.

Data/logic considerations:
- Reuse requests table statuses accepted/completed as event source.
- Join with center_locations, centers, musicians for labels and filtering.
- Add server-side filtering and pagination/window loading to prevent heavy calendar payloads.

Primary files likely impacted:
- src/app/dashboard/admin (new calendar subroute or extracted admin module)
- src/app/dashboard/schedule/page.tsx (shared calendar components/utilities)
- src/app/components/calendar-utils.ts
- new calendar component(s) under src/app/components/
- potential new DB query helpers/RPC for filtered event retrieval


### 3. Media Workflow Update (Moderate)
Goal: Musicians submit media; admin approves/publishes.

Changes:
- Keep current event_media table and moderation gates.
- Add musician submission entry point tied to completed events.
- Add admin review queue for submitted media.
- Keep publish flag as final gate.

Suggested first pass:
- Submission type = YouTube links first (fastest path).
- Optional direct file upload later.

Primary files likely impacted:
- src/app/dashboard/schedule/page.tsx (or musician event detail route)
- src/app/dashboard/admin/page.tsx
- supabase policies/migrations extending event_media ownership and submission status


### 4. Musician Application/Profile Alignment (Small-to-Moderate)
Goal: Treat existing onboarding + admin approval flow as the application, with field alignment updates.

Changes:
- Reframe copy/labels to "Musician Application" where appropriate.
- Add/adjust musician-provided fields requested by client:
  - Ensemble options (solo/duet/trio/group).
  - Instruments (checkbox + other).
  - Styles/eras (40s/50s/60s/etc.).
  - Background categories (church musician, student, teacher, professional, etc.).
  - Area available to play (city/county options).
- Keep approval gate in admin workflow.

Privacy/contact alignment:
- Public musician display = first name + last initial.
- Contact method default = email-first CTA.
- Phone remains optional and policy-controlled.

Primary files likely impacted:
- src/app/onboarding/musician/page.tsx
- src/app/discover/musician/[id]/page.tsx
- src/app/dashboard/schedule/page.tsx
- related schema migrations for structured fields


### 5. Education Content On Landing/Hero (Small)
Goal: Add client-requested education messaging to landing experience.

Content blocks to add:
- What we do.
- Performance video highlights.
- Memory care resident context.
- Dos and don'ts.
- Sample playlist with admin-extensible content source (can start as static and evolve to managed).

Primary files likely impacted:
- src/app/page.tsx
- optional docs/content source file if externalized


## Proposed Delivery Sequence
1. Calendar architecture + admin holistic calendar foundation (second hardest).
2. Map architecture + regional participating facilities map (hardest).
3. Musician application field alignment and privacy/contact adjustments.
4. Media submission + admin approval extension.
5. Landing/hero education expansion.
6. QA hardening and role-based regression checks.

Rationale:
- Calendar and map are the largest architectural shifts and should be designed early.
- Remaining items are mostly additive and can proceed in parallel once data model decisions are final.


## Testing and Validation Plan
- Access control:
  - Verify admin-only holistic calendar access (initial rollout).
  - Verify map visibility respects approval/public flags.
- Privacy:
  - Confirm public surfaces show first name + last initial only for musicians.
  - Confirm contact flow defaults to email-first.
- Functional:
  - Calendar filters correctly by region/center/musician combos.
  - Map marker actions route correctly to profile and navigation links.
  - Media submission appears in admin queue and requires approval before publish.
- Performance:
  - Validate calendar query latency under realistic event counts.
  - Validate map rendering with marker clustering and filter changes.


## Open Decisions To Resolve Before Build
1. Calendar audience after admin phase:
- Admin only vs center coordinators too.
2. Region model:
- Counties/cities table vs derived ZIP groupings.
3. Map provider:
- Mapbox vs Leaflet/OpenStreetMap vs Google Maps.
4. Media submission type for initial release:
- YouTube links only vs links + direct uploads.
5. Playlist management:
- Static curated list first vs admin-managed data model now.


## Out of Immediate Scope
- Ratings/comments (explicitly deferred).
- Real-time chat, payments, SMS, native app work.


## Success Criteria
- Map and holistic calendar launched with stable filtering and role-safe access.
- Musician onboarding/profile reflects requested intake fields without a net-new application subsystem.
- Media workflow supports musician submission with admin publish control.
- Landing page reflects educational mission content.
- No regression in existing request/proposal/scheduling/notification flows.
