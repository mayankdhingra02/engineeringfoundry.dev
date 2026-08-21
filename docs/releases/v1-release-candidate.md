# Engineering Foundry v1 release candidate

**RC date:** 2026-08-21

## Candidate identity

| Field | Value |
| --- | --- |
| Base SHA | `948fb742456e2c0fcc65965304a3e7c5ba17434c` — `main` before P0.10 |
| Candidate SHA | `b2e31ee8263e1940645ca53bf43ae69b4fd23468` — `docs: record v1 launch readiness` |
| Candidate branch | `feat/p0-final-launch-readiness` |
| Scope | P0.10 final launch-readiness evidence and a non-breaking impact-ledger terminology correction |
| Production status | **Not deployed or production-qualified by this record.** |

This record identifies the candidate code commit. The companion documentation commit that adds this immutable record is release metadata, not a new product capability.

## Repository qualification summary

- Static qualification: **PASS — 33/33**.
- Clean local database reset: **PASS** — all 25 migrations applied in filename order through `202608230002_add_feedback_export_rpc.sql`.
- Database schema lint: **PASS**.
- pgTAP policy/integrity suite: **PASS**.
- Two-user persistence isolation: **PASS**.
- Account lifecycle/export and deletion qualification: **PASS**.
- Phase 9 security qualification: **PASS**.
- Production Webpack build: **PASS — exit 0**.
- Public-route smoke: **PASS** — 46 public routes, 19 disabled-account routes, unavailable-profile route, 9 unknown dynamic routes, contact integrity, and security headers.
- Public-link validation: **PASS** — 91 literal internal links resolve to 79 application page patterns; curated external-link rules pass.

These results prove local repository behavior only. Fresh PR CI remains required before review completion.

## P0 summary and surface boundary

The candidate preserves the v1 P0 workstreams: feature-gated authentication and account lifecycle; unified preparation progress and plans; moderated Interview Experiences; sourced company guides; Low-Level Design; salary-negotiation education; Behavioral stories/answers; feedback/admin operations; and privacy-bounded analytics/evidence.

Public preparation surfaces remain available independently of accounts. Authenticated surfaces — applications, Playbook inputs, Behavioral workspace, plans/progress, reminders/calendar, export/deletion, feedback linkage, and admin operations — remain behind the explicit account capability and RLS/RPC ownership boundaries.

The candidate does not make a public performance, readiness, hiring, or adoption claim. P0.9 analytics remain optional, public-route-only, fixed-property instrumentation. The monthly ledger template now names the authoritative end-of-window metric `registered_accounts`; no real snapshots exist and no historical evidence was rewritten.

## Security and privacy boundary

Repository checks cover private-route noindex/robots/sitemap exclusion, analytics property sanitization and private-route suppression, Content Security Policy/header construction, server-only secrets, auth capability gating, rate limiting, reauthentication, export cache headers, account deletion cascades, and local RLS/two-user isolation.

The candidate does not attest to hosted secret configuration, a production CSP console check, legal sufficiency, live provider behavior, or a completed incident exercise. Those remain explicit owner gates in `docs/production-launch-checklist.md` and `docs/production-operations-runbook.md`.

## Deferred P1 scope

Visualization Lab Beta is **DEFERRED P1**. It is not included in this candidate because the required reviewed deterministic traces, bounded/static artifacts, accessible textual fallback, ten real integrations, and performance/mobile/CI proof have not been established. Other P1 work remains as recorded in `docs/launch-finish-plan.md`.

## Required external release gates

Before calling this a deployed or full hosted v1 release, the owner must complete and record:

1. Production domain, DNS, HTTPS, canonical origin, hosting configuration, and response-header/CSP verification.
2. Backup/PITR, intended Supabase project, migration application, and hosted two-account RLS/export/deletion qualification.
3. SMTP, exact Auth callback/recovery redirects, enabled OAuth providers, service-role/reminder secret configuration, scheduler behavior, WAF/edge rate limits, and operator bootstrap.
4. Qualified review of the Privacy and Terms drafts plus an analytics-consent decision for actual launch jurisdictions before PostHog is enabled.
5. Production mobile, keyboard, focus, text-resize, screen-reader, and browser smoke evidence; configured contact/community ownership; and fresh green PR CI.

## Rollback reference

Use the ordered, non-destructive rollback procedures in [`production-launch-checklist.md`](../production-launch-checklist.md#rollback) and [`production-operations-runbook.md`](../production-operations-runbook.md#incident-and-rollback). The primary immediate containment is `NEXT_PUBLIC_ACCOUNTS_ENABLED=false` followed by redeploy; it leaves public learning available and retains private data. Migrations are forward-only: correct a schema issue with a new reviewed migration rather than a destructive rollback.

## Decision

**REPOSITORY RC READY, pending fresh PR CI and all external owner gates.** This is not a statement that Engineering Foundry has launched publicly or that production accounts are approved for enablement.
