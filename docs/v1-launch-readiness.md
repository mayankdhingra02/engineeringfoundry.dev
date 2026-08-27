# Engineering Foundry v1 launch-readiness tracker

**Status:** Living repository checklist; PR and CI status are maintained in GitHub, not hard-coded here.
**Repository baseline:** `948fb742456e2c0fcc65965304a3e7c5ba17434c` (`main`)

This is the owner-facing release checklist. It separates what the repository has proved from work that only a deployment owner, provider, or qualified reviewer can complete. Checking a repository item does not complete a hosted-production action.

## Status language

- `[x]` **Repository-proven:** implemented and covered by the named source-level, local, database, build, smoke, or CI qualification.
- `[ ]` **OWNER GATE:** an intentionally unchecked production/manual/legal/provider action. Do not check it without dated evidence.
- **DEFERRED P1:** intentionally outside v1; it is not a launch promise.

Repository qualification can establish `REPOSITORY RC READY`; it cannot establish a public-production launch, production DNS/TLS, backups, legal sufficiency, provider delivery, or a live analytics configuration.

## P0 checkpoint status

| Checkpoint | Scope | Repository implementation | Production verification | Notes |
| --- | --- | --- | --- | --- |
| P0.1 | Production baseline, auth, deployment | Merged / repository-proven | OWNER GATE | Hosted Auth, DNS/TLS, backups, secrets, and provider checks remain external. |
| P0.2 | Continuation, progress, study plans | Merged / repository-proven | OWNER GATE | Verify signed-in and anonymous behavior in the hosted environment. |
| P0.3 | Interview Experiences v1 | Merged / repository-proven | OWNER GATE | Bootstrap moderation and verify public approval flow. |
| P0.4 | Company Guides v1 | Merged / repository-proven | OWNER GATE | Continue source-freshness operation after deployment. |
| P0.5 | Low-Level Design v1 | Merged / repository-proven | OWNER GATE | Verify deployed public routes and performance. |
| P0.6 | Salary Negotiation v1 | Merged / repository-proven | OWNER GATE | Legal review of general guidance remains external. |
| P0.7 | Behavioral v1 polish | Merged / repository-proven | OWNER GATE | Verify hosted private-workspace flows when accounts are enabled. |
| P0.8 | Feedback and minimal admin operations | Merged / repository-proven | OWNER GATE | Operator bootstrap and edge protection remain external. |
| P0.9 | Analytics and launch evidence | Merged / repository-proven | OWNER GATE | Consent decision, PostHog configuration, and real evidence are not repository claims. |
| P0.10 | Content, accessibility, QA, launch operations | Repository release controls implemented | OWNER GATE | The generated RC record identifies its candidate code commit; hosted verification remains external. |

## Homepage

- [x] Repository-proven: homepage continuation and entry experience are covered by `test:homepage-entry` and public-launch integrity checks.
- [x] Repository-proven: public account controls fail closed while `NEXT_PUBLIC_ACCOUNTS_ENABLED=false`.
- [ ] OWNER GATE: verify the deployed production origin, canonical URL, and public homepage smoke path.
- [ ] OWNER GATE: complete mobile, keyboard/focus, text-resize, screen-reader, and Lighthouse/CWV checks on the deployed homepage.

## Authentication

- [x] Repository-proven: sign-up, sign-in, callback, recovery, onboarding, and account capability gates are qualified statically and locally.
- [x] Repository-proven: account actions remain disabled until explicit production configuration is present.
- [ ] OWNER GATE: configure the intended hosted Supabase project and exact production Auth callback/recovery redirects.
- [ ] OWNER GATE: configure and exercise production SMTP, confirmation, email-change, and password-recovery delivery.
- [ ] OWNER GATE: verify every enabled OAuth provider against the production callback; leave every unverified provider disabled.

## Dashboard

- [x] Repository-proven: dashboard access, private metadata, and analytics-route suppression are covered by auth and privacy regressions.
- [ ] OWNER GATE: run a hosted two-user dashboard isolation check with disposable accounts after accounts are enabled.

## Onboarding and Settings

- [x] Repository-proven: onboarding completion, account preferences, password reauthentication, global sign-out, and feature-unavailable states are covered by lifecycle tests.
- [ ] OWNER GATE: verify real hosted onboarding, settings, password recovery/update, and sign-out flows with production Auth.

## Applications

- [x] Repository-proven: owner-scoped applications, rounds, preparation, and private noindex controls are covered by application, RLS, and privacy qualification.
- [ ] OWNER GATE: verify two-user hosted application and round isolation, including inaccessible direct URLs.

## Calendar and Reminders

- [x] Repository-proven: calendar exports, reminder lifecycle, authorization, no-store responses, and no-provider behavior are covered by regression and database tests.
- [ ] OWNER GATE: configure service-role and reminder-worker secrets in the production secret store.
- [ ] OWNER GATE: configure an external HTTPS scheduler and verify unauthorized, configured/no-provider, and reschedule/cancel behavior.
- [ ] OWNER GATE: open a production `.ics` export and verify its canonical preparation link and stored timezone.

## DSA

- [x] Repository-proven: canonical DSA content, level roadmaps, plans, persistent progress, and analytics identifiers are covered by catalog and progress checks.
- [ ] OWNER GATE: verify the deployed DSA routes and signed-in progress/plan persistence with a hosted account.

## System Design

- [x] Repository-proven: curriculum, manifests, practice workspace, plans, canonical IDs, and curated links are covered by dedicated regressions.
- [ ] OWNER GATE: verify deployed System Design routes, private attempts, and CSP behavior on Mermaid-containing content.

## ML Design

- [x] Repository-proven: canonical ML Design content and privacy-bounded analytics contract are covered by content and analytics qualification.
- [ ] OWNER GATE: verify deployed ML Design rendering and public navigation on the production origin.

## Behavioral

- [x] Repository-proven: questions, stories, answer variants, coverage, and fact-integrity safeguards are covered by workspace and Behavioral v1 tests.
- [ ] OWNER GATE: verify hosted private stories/answers and cross-account isolation after accounts are enabled.

## Interview Playbook

- [x] Repository-proven: diagnostic inputs, adaptive planning, DSA/System Design evidence boundaries, and mock-review export behavior are covered by Phase 3 regressions.
- [ ] OWNER GATE: verify hosted Playbook persistence and private-route behavior with disposable accounts.

## Mock Interviews

- [x] Repository-proven: public Practice Lab content, in-memory draft boundary, and persisted self-review isolation are covered by mock and privacy regressions.
- [ ] OWNER GATE: verify a production mock-review save/export/delete lifecycle when accounts are enabled.

## Interview Experiences

- [x] Repository-proven: public directory, contribution privacy, provenance, consent, moderation states, and no-fabrication constraints are covered by v1 and integrity tests.
- [ ] OWNER GATE: bootstrap the first admin operator and exercise submitted → approved/needs-changes moderation with disposable reports.
- [ ] OWNER GATE: verify only approved, consented reports become publicly readable and that correction/removal operations work.

## Company Guides

- [x] Repository-proven: guide separation, level overlays, provenance, verification metadata, and source-link rules are covered by company-guide validation.
- [ ] OWNER GATE: assign an operator for the 180-day source-freshness review and verify the deployed guide links.

## Low-Level Design

- [x] Repository-proven: eight lessons, original practice designs, local activity boundary, and content validation are covered by `test:low-level-design`.
- [ ] OWNER GATE: verify deployed lesson/practice routes and performance on representative mobile and desktop devices.

## Salary Negotiation

- [x] Repository-proven: eight modules, private in-memory worksheet, ethical anti-fabrication guidance, and content checks are covered by `test:salary-negotiation`.
- [ ] OWNER GATE: obtain qualified review of the general legal/employment guidance before public deployment.

## Feedback

- [x] Repository-proven: private feedback receipt, consent, sanitization, RPC boundary, and database throttle are covered by feedback/admin qualification.
- [ ] OWNER GATE: configure hosting-provider WAF or edge feedback rate limiting without retaining message bodies, cookies, query strings, or raw IP data in application logs.
- [ ] OWNER GATE: assign a named owner for feedback triage and verify the production follow-up channel.

## Admin Operations

- [x] Repository-proven: least-privilege memberships, private/noindex admin routes, audit-event minimization, and read-only freshness reminders are covered by security and admin regressions.
- [ ] OWNER GATE: bootstrap the initial `admin_memberships` operator in the trusted Supabase administration environment.
- [ ] OWNER GATE: record an operational owner and escalation path for moderation, feedback triage, and incident response.

## Search and Resources

- [x] Repository-proven: global-search focus management, public-resource discovery, internal links, and curated external-link rules are covered by launch and link validation.
- [ ] OWNER GATE: verify deployed search keyboard navigation, external destinations, and resource links from real production browsers.

## Privacy, Terms, Contact, FAQ, About

- [x] Repository-proven: legal pages state draft status; Contact exposes only configured/working channels; sitemap/robots/canonical metadata and private noindex are covered by regressions.
- [ ] OWNER GATE: obtain qualified legal review of Privacy and Terms before public deployment.
- [ ] OWNER GATE: assign and verify the production contact mailbox/community-channel owners before exposing any configured contact destination.
- [ ] OWNER GATE: verify deployed headers/CSP, robots, sitemap, canonical/OG metadata, keyboard/focus/text-resize, and screen-reader behavior.

## Analytics and Impact Ledger

- [x] Repository-proven: `analytics-definition-v1`, property allowlists, public-only pageviews, `registered_accounts` ledger terminology, and zero fabricated evidence records are covered by analytics and ledger tests.
- [x] Repository-proven: analytics is inactive without its public key and no consent UI is falsely represented as functional.
- [ ] OWNER GATE: obtain a qualified analytics-consent decision for the actual launch jurisdictions before enabling PostHog.
- [ ] OWNER GATE: create/configure the production PostHog project and verify public-only live payloads, safe identify/reset, and private-route suppression.
- [ ] OWNER GATE: create the specified PostHog dashboards only after real events are observed; create the first aggregate snapshot only after a complete month.

## Production / Release Operations

- [x] Repository-proven: the canonical release verifier derives migration identity from the repository and covers clean reset, schema lint, pgTAP, two-user qualification, export/deletion, auth/security, static qualification, the Next.js production build using Turbopack, public smoke, and link validation.
- [x] Repository-proven: rollback procedures preserve the feature-gate-first, forward-only-migration boundary in `docs/production-launch-checklist.md` and `docs/production-operations-runbook.md`.
- [ ] OWNER GATE: set the production DNS/TLS/origin and verify `NEXT_PUBLIC_SITE_URL`, redirects, HSTS, response headers, and CSP console behavior.
- [ ] OWNER GATE: enable and record backups/PITR, take a pre-migration backup, apply migrations only to the intended hosted Supabase project, and record the migration list.
- [ ] OWNER GATE: run hosted two-user isolation plus production export/deletion exercises; retain only redacted evidence.
- [ ] OWNER GATE: run deployed public-route smoke, mobile/desktop verification, keyboard/focus/text-resize and screen-reader checks, then record Lighthouse/CWV results.
- [ ] OWNER GATE: monitor deployment, Auth, database, and application logs after launch; exercise the documented rollback path if a launch-critical incident occurs.

## Deferred P1

**Visualization Lab Beta — DEFERRED P1.** It is not included in this release candidate. A future launch decision requires reviewed deterministic traces, bounded/static artifacts, accessible textual fallback, ten real integrations, and green performance/mobile/CI evidence. Do not reopen implementation during P0.10.

## Readiness decision

**Repository decision: `REPOSITORY RC READY` only when the generated release record validates and required GitHub checks pass.** This is not public launch completion, and it does not authorize production account or analytics enablement until every applicable unchecked OWNER GATE has dated evidence.
