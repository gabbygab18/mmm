# Launch Compliance Baseline (US-only)

Date: June 5, 2026

This document is planning guidance only and is not legal advice.

## Scope Assumptions

- US-only launch.
- Transactional notifications only at launch (account and scheduling/request alerts).
- No newsletter or promotional/marketing email at launch.
- Adults-only at launch (18+).
- Privacy/data requests handled via a documented manual process initially.

## Why This Exists

Even for a nonprofit and even if "GDPR" is not the main driver, launch readiness still requires:

- Clear user-facing disclosures (Privacy Policy + Terms).
- A way to handle user privacy/data requests.
- A minimum operational plan for security incidents.

## Must-Have Before Go-Live

### 1) Privacy Policy (publish)
Include, at minimum:
- What data you collect (account info, profile info, scheduling metadata, media links).
- Why you collect it (operate the service, matching, notifications, moderation).
- Where data is processed/stored (service providers).
- How long data is retained (high-level statement).
- How users can request access/deletion.
- Contact method for privacy requests.

### 2) Terms of Service (publish)
Include, at minimum:
- Volunteer-only posture at launch.
- User conduct rules and moderation/termination rights.
- Media/photo/video rights and publishing permissions.
- Liability limitations and dispute/jurisdiction language (as appropriate).
- Adults-only policy (18+).

### 3) Transactional Email Baseline
- Document that launch email is transactional (alerts about requests/scheduling/status).
- Ensure all emails include organization identity and contact info.
- Do not send newsletters/promotional emails until an email preference/unsubscribe feature exists.

### 4) Privacy/Data Request Process (manual)
Define a simple process:
- Intake channel (privacy email address).
- Identity verification step.
- What you can fulfill:
  - copy/export of account data (manual export is acceptable for MVP)
  - deletion request handling
- Response target window (example: 30–45 days).
- Log each request and fulfillment date.

### 5) Incident Response Mini-Runbook
- How you detect/report an incident.
- Who is responsible for triage.
- How you coordinate with vendors.
- A draft message template for user notification if needed.

## Phase 2 (Plan Ahead, Do Not Block Launch)

### 1) SMS/Text Alerts
If enabled later, plan for:
- Explicit opt-in consent and opt-out handling.
- Consent recordkeeping.
- Vendor registration and deliverability setup.
- Throttling and quiet hours.

### 2) Google/Facebook Login
If enabled later, plan for:
- Minimal scopes only (email/profile).
- Privacy Policy updates describing provider data use.
- Ability for user to disconnect their social login.

## Evidence in Project Plan

- Sprint 9 includes security hardening and compliance baseline items in docs/music-memory-care-epic-plan.md.
