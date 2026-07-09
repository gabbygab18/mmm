# Client Proposal Scope Boundaries

Date: June 3, 2026
Source of truth: docs/music-memory-care-epic-plan.md

## In Scope (Current Delivery)

- Platform foundation using Next.js + Supabase + Vercel.
- Account system for three roles: musician, center coordinator, admin.
- Role-aware onboarding and protected dashboards.
- Musician and center profile management, including photos.
- Multi-location support for centers.
- ZIP-radius viability matching for discovery.
- Two-way discovery from posted availability/request slots.
- Two-way request initiation and request lifecycle management.
- Alternate time proposals and status history tracking.
- Scheduled events view for accepted/completed requests.
- In-app alerts and notification center.
- Email notifications (including production sending) for core alert types.
- Admin moderation and oversight tools (users, flags, manual interventions).
- Event media model with moderation/publish controls.
- Public musician identity/contact defaults: first name + last initial, email-first contact.
- Volunteer-only launch model (no payment processing in MVP).
- Launch hardening work in progress (performance, deployment runbook, production readiness).
- Launch compliance baseline (US-only): Privacy Policy + Terms, transactional email posture, and a defined process for privacy/data requests.

## Out of Scope (Not Included in This Delivery)

- Payment processing and payout workflows.
- Native mobile applications.
- Real-time chat/messaging.
- SMS notification channel.
- Deep analytics/business intelligence dashboards.
- Automated ranking/recommendation engine.

## Deferred to Future Development Effort

- Centralized MMM YouTube auto-posting pipeline.
- Musician knowledge quiz for education/compliance.
- Full background-check vendor integration workflow (while keeping no local ID/DL storage).
- Expanded portability/handoff package beyond baseline documentation and export planning.
- Ratings and reputation system.
- Traveling musician remote-mode enhancements.
- Additional time-slot granularity enhancements beyond current scheduling model.
- Marketing email preference center / unsubscribe management (only needed if/when marketing emails are introduced).

## Notes for Proposal Use

- This scope reflects the current plan state and decisions log as of June 3, 2026.
- Future development items are intentionally separated so they can be priced as optional Phase 2+ work.
