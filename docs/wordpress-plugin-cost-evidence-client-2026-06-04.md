# WordPress Plugin Requirements and Cost Evidence (Client Version)

Date: June 4, 2026
Prepared for: Margaret's Memorycare Music, Inc.

## Purpose

This document explains why a WordPress approach would require multiple paid plugins and ongoing maintenance, and why we recommend staying with the current custom website platform approach.

## Executive Summary

A WordPress build is possible, but this project is workflow-heavy (accounts, approval flows, scheduling, notifications, moderation, media governance). In WordPress, these features are usually assembled from many plugins plus custom glue code.

That creates three practical issues:

1. Ongoing annual plugin licensing cost.
2. Higher maintenance risk from plugin compatibility updates.
3. Additional custom development to make all plugins work together reliably.

Estimated yearly plugin/license cost only (not custom dev labor):

- Lean stack: about 500 to 1,200 USD/year
- Robust stack: about 1,500 to 3,500+ USD/year

## Functional Requirements vs WordPress Plugin Needs

| Required Functionality | Typical WordPress Plugin Category | Typical Plugin Examples | Expected Cost Pattern | Notes |
|---|---|---|---|---|
| User roles and account gating (musician, facility, admin) | Membership / role management | MemberPress, Ultimate Member | 0 to about 399+ USD/year | Paid tiers usually needed for advanced role and workflow control. |
| Profile intake and application forms | Forms / workflow forms | Gravity Forms, WPForms, Fluent Forms | about 59 to 599 USD/year | More complex conditional flows typically require higher tiers/add-ons. |
| Directory, profile browsing, search/filtering | Directory/listings | GeoDirectory, Directorist | about 97 to 399 USD/year | Advanced filtering often needs paid bundles and optimization work. |
| Availability and request workflow automation | Automation / workflow orchestration | Uncanny Automator, AutomatorWP | about 149 to 720 USD/year | Multi-step request states usually still need custom code. |
| Calendar and schedule views | Events/calendar | The Events Calendar, Amelia | about 49 to 599 USD/year | Calendar plugins handle display well; business logic often remains custom. |
| Facility map and routing links | Maps | WP Go Maps (WP Google Maps) + possible map API | one-time 79 to 299 plus API usage | API usage can add monthly costs depending on traffic. |
| Email notifications and deliverability | SMTP/email provider integration | SMTP plugin + provider | plugin low-cost/free + provider usage | Reliability depends on provider setup and ongoing monitoring. |
| Media/video gallery workflow | YouTube/gallery/media | YouTube/gallery plugins | about 49 to 149 USD/year | Admin-approval workflow usually requires custom moderation logic. |
| Security hardening and malware/firewall | Security suite | Sucuri, Wordfence | about 119 to 549+ USD/year | Security is not optional for a role-based platform. |
| Backups/monitoring/recovery (often separate) | Backup/ops tooling | varies by host/plugin | variable | Often added on top of security costs. |

## Sourced Pricing Snapshots (Published Vendor Prices)

As-of: June 2, 2026. Vendor pricing can change and often has intro pricing vs renewal pricing.

### Membership / Roles
- MemberPress: 199.50 intro, renews at 399 USD/year (Launch tier shown)
- Ultimate Member: Free, Standard 276 USD/year, Pro 348 USD/year

### Forms
- Gravity Forms: 59 to 259 USD/year renewal range (depending on tier)
- WPForms: 99 to 599 USD/year renewal range (depending on tier)
- Fluent Forms: roughly 79 to 299 USD/year list pricing (promo pricing may be lower)

### Directory
- Directorist: roughly 103 to 131 USD/year renewal range for listed plans
- GeoDirectory membership: 229 USD/year option listed

### Automation
- AutomatorWP: 149 to 499 USD/year
- Uncanny Automator: plan listing observed at 60 USD/month billed annually (720 USD/year)

### Calendar/Events
- The Events Calendar listing: 259 / 399 / 599 USD/year tiers
- Amelia listing: plans from about 49 upward (tier-dependent)

### Maps
- WP Go Maps: one-time license examples 79 / 149 / 299 USD
- Note: separate map API usage charges may apply depending on provider/traffic

### Security
- Sucuri: 229 / 339 / 549 USD/year tiers listed
- Wordfence Premium: paid tier available (manual verification required due anti-bot page)

## Annual Cost Model Examples (Licenses Only)

### Lean Example
- Ultimate Member Free: 0
- Fluent Forms Single: about 63 to 79
- Directorist Starter: about 97 to 103
- WP Go Maps one-time: about 79
- The Events Calendar Essentials: about 259
- Estimated year-1 total: about 500 to 1,200 USD (excluding custom development, hosting, APIs)

### More Robust Example
- MemberPress Growth: about 349.50 intro (higher renewal)
- Gravity Forms Pro: about 119 intro (higher renewal)
- Directorist Agency: about 142 intro
- AutomatorWP Professional: about 249
- The Events Calendar Pro: about 399
- Sucuri Pro: about 339
- Estimated annual total: about 1,500 to 3,500+ USD (excluding custom development, hosting, APIs)

## Why This Matters for This Project

This project is not just a brochure website. It includes:

- Multi-role accounts and permissions
- Request lifecycle and approval logic
- Scheduling and status transitions
- Notifications and moderation
- Media submission/publish governance

In WordPress, these tend to span multiple plugins and custom code bridges. That increases:

1. Recurring software cost
2. Integration complexity
3. Regression risk when plugins update
4. Long-term maintenance overhead

## Recommendation

For this project, we recommend not using WordPress as the primary implementation approach.

Reason:

- The required functionality is operationally complex and workflow-driven.
- WordPress can do it, but usually with a plugin-heavy stack plus custom glue code.
- That approach increases annual cost and maintenance risk without improving core product outcomes.

Recommended path:

- Continue with the current custom website platform implementation.
- Keep WordPress only as an optional content-only CMS consideration in the future if publishing needs expand significantly.

## Sources Used

- Existing internal summary: docs/wordpress-client-facing-summary-2026-06-02.md
- Existing internal executive summary: docs/wordpress-vs-current-platform-executive-summary-2026-06-02.md
- Referenced vendor pricing pages as captured in those summaries (MemberPress, Ultimate Member, Gravity Forms, WPForms, Fluent Forms, Directorist, GeoDirectory, Uncanny Automator, AutomatorWP, The Events Calendar, Amelia, WP Go Maps, Sucuri, Wordfence)
