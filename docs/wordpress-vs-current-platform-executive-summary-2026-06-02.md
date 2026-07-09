# Executive Summary: WordPress-Only Implementation Plan

Date: June 2, 2026
Prepared for: Music Memory Care decision review

## Objective
Describe what this platform looks like if built as WordPress alone, including architecture, required extensions, expected costs, and tradeoffs versus the current custom build.

## What the Site Looks Like as WordPress-Only
WordPress would operate as both CMS and application shell.

1. Public experience
- Homepage and education pages managed in WordPress editor.
- Public musician/center/location profile pages powered by a directory plugin.
- Search and filtering through directory plugin facets.
- Map page with location pins and route links.

2. Logged-in experience
- Musician and center accounts managed via membership/role plugin.
- Application/profile submission handled by forms plugin.
- Request/scheduling flows modeled via custom post types + custom fields + automations.
- Media submission via frontend form and approval queue in wp-admin.

3. Admin experience
- Review and approve profiles, media, and flags in wp-admin.
- Manage content and education sections without developer support.
- Monitor notifications/workflows through plugin dashboards and custom admin screens.

## Core Architecture (WordPress-Only)
Expected implementation pattern:
- Custom post types for musicians, centers, locations, requests, proposals, events, media submissions.
- Custom fields/meta for workflow state and filters.
- Plugin automations for status transitions and notifications.
- Custom plugin code for business rules not handled natively.

Operationally, this works, but complex logic becomes distributed across multiple plugins and custom hooks.

## Differences from the Current Platform

1. Data model and querying
- Current platform: normalized relational schema designed for workflow depth.
- WordPress-only: heavy reliance on post meta/custom tables; can be slower/more complex for advanced filters.

2. Workflow behavior
- Current platform: explicit state transitions and server-enforced rules.
- WordPress-only: rules are often split between plugins, form logic, and automation events.

3. Maintainability pattern
- Current platform: developer-maintained product code.
- WordPress-only: easier content edits by non-devs, but complex workflow maintenance usually still needs a WordPress engineer.

4. Upgrades and compatibility
- Current platform: single codebase lifecycle.
- WordPress-only: plugin/theme updates can create compatibility regressions.

5. Feature velocity on complex operations
- Current platform: stronger for advanced map/calendar/workflow operations.
- WordPress-only: faster for content, slower for reliable custom operations beyond plugin defaults.

## What You Potentially Lose or Weaken in WordPress-Only
Even if strict row-level-security is not a top priority, these areas are usually weaker compared to a custom app:

1. Workflow integrity under edge cases
- Multi-step request/proposal/schedule flows are harder to keep consistent.

2. Consistent business-rule enforcement
- Visibility and approval rules can drift across templates, plugins, and automations.

3. Advanced filtering performance at scale
- Region + center + musician combination filtering and holistic calendar queries can become expensive to maintain.

4. Predictability after updates
- Plugin upgrades can break previously working integrations.

5. Long-term complexity costs
- Initial launch can be quicker, but custom workflow debt can increase over time.

## What You Gain in WordPress-Only
1. Strong non-technical content management.
2. Faster editing and publishing of landing/education content.
3. Large ecosystem of ready-made extensions.

## Required Extension Stack and Typical Cost
Note: costs vary by vendor and licensing tier.

1. Membership and roles
- Candidate: MemberPress
- Type: Paid
- Typical cost: about 179 to 399 USD/year
- Alternative: Ultimate Member (free core, paid extensions)

2. Directory and profile search
- Candidate: GeoDirectory
- Type: Free core + paid addons
- Typical paid range: about 199 to 399 USD/year bundles
- Alternative: Directorist (free core + paid addons)

3. Forms and application intake
- Candidate: Gravity Forms
- Type: Paid
- Typical cost: about 59 to 259 USD/year
- Alternatives: Fluent Forms Pro, WPForms Pro

4. Workflow automation
- Candidate: Uncanny Automator Pro
- Type: Free core + paid tiers
- Typical paid entry: about 149 USD/year
- Alternative: AutomatorWP (free core + paid addons)

5. Calendar and events
- Candidate: The Events Calendar Pro
- Type: Free core + paid tiers
- Typical paid cost: about 149 USD/year and up
- Alternative: Amelia (booking-focused)

6. Maps
- Candidate: WP Google Maps Pro
- Type: Free core + paid tiers
- Typical paid cost: tens to low hundreds per year/license
- Extra: Google Maps or Mapbox API usage costs may apply

7. Transactional email
- Candidate: SMTP plugin + provider
- Type: plugin often free/low-cost; provider usage-based

8. YouTube/video gallery display
- Candidate: YouTube gallery/feed plugin
- Type: Free core + paid tiers
- Typical paid cost: about 49 to 149 USD/year

9. Security hardening
- Candidate: Wordfence Premium
- Type: Free core + paid
- Typical paid cost: about 119 USD/year/site
- Add backups and monitoring plugin costs separately

10. Custom workflow plugin work
- Type: custom development
- Cost: variable; usually largest long-term cost center

## WordPress-Only Cost Envelope
Licensing and SaaS only (excluding custom development):
- Lean setup: about 500 to 1,200 USD/year
- More robust setup: about 1,500 to 3,500+ USD/year

Additional costs to budget separately:
- Map API usage (if Google/Mapbox)
- Identity/background screening vendors
- Ongoing WordPress maintenance/testing after plugin updates

## WordPress-Only Feasibility by Feature

1. Content and education pages
- Feasibility: High

2. Profile directory and search
- Feasibility: High

3. Basic request workflow
- Feasibility: Medium-High

4. Advanced proposal negotiation and strict workflow gating
- Feasibility: Medium (custom coding likely)

5. Holistic calendar with complex filters
- Feasibility: Medium (custom coding and performance tuning likely)

6. Map with routing links and scalable filters
- Feasibility: Medium-High (depends on filter complexity)

7. Media submission + admin moderation + publish controls
- Feasibility: Medium-High

## WordPress-Only Execution Plan

1. Foundation
- Set up membership/roles, directory model, and form workflows.

2. Workflow core
- Implement requests, statuses, and approval gates with custom post types and automation rules.

3. Experience layers
- Add map and holistic calendar views.

4. Moderation and media
- Add musician media submission queue and admin approvals.

5. Hardening
- Add security controls, backup/restore, monitoring, and regression test checklist for plugin updates.

## Key Decision Point
WordPress-only is viable, but success depends on accepting a plugin-heavy architecture with custom glue code for advanced operations.

If the priority is easy handoff and content maintainability with moderate workflow complexity, WordPress-only can work.
If the workflow remains highly stateful and operationally strict, custom development effort inside WordPress should be expected from day one.