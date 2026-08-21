# Engineering Foundry v1 launch-readiness tracker

**Assessment date:** 2026-08-21
**Repository baseline:** `948fb742456e2c0fcc65965304a3e7c5ba17434c` (`main`)
**Assessment scope:** final repository release-candidate readiness, not a declaration that a hosted public launch has occurred.

## Status language

- **PASS — repository proven:** implemented and covered by the named source-level, local, database, build, or CI qualification.
- **OWNER GATE — external verification required:** a deployment, account, legal, provider, or operational action that the repository cannot truthfully prove.
- **DEFERRED P1:** deliberately outside v1; it is not shown as a launch promise.

Repository qualification can establish `REPOSITORY RC READY`; it cannot establish production DNS, HTTPS, backups, email delivery, legal sufficiency, or a live analytics configuration.

## Public product surfaces

| Surface | Launch status | Repository evidence | External/owner gate |
| --- | --- | --- | --- |
| Home and preparation hub | PASS — repository proven | `test:homepage-entry`, `test:public-launch-integrity`, public-route smoke | Verify deployed routes and headers |
| DSA curriculum, questions, roadmaps, and progress | PASS — repository proven | catalog, roadmap, progress, and persistence regressions | Account progress requires hosted account qualification |
| System Design curriculum, practice, and plans | PASS — repository proven | curriculum, manifest, workspace, plan, and link regressions | Verify hosted authenticated attempts |
| ML Design | PASS — repository proven | canonical content validation and analytics contract | Verify public deploy rendering |
| Low-Level Design lessons and practice | PASS — repository proven | `test:low-level-design` and content validators | Verify public deploy rendering |
| Behavioral prompts and public guidance | PASS — repository proven | workspace and Behavioral v1 regressions | Verify hosted account writes before accounts are enabled |
| Company guides and experience directory | PASS — repository proven | company-guide and Interview Experiences v1 regressions; provenance/integrity validators | Bootstrap moderation operator and exercise approved publication workflow |
| Interview Execution Guide, checklists, and round guides | PASS — repository proven | public-launch and Playbook qualification | Verify public deploy rendering |
| Mock Interview Practice Lab | PASS — repository proven | mock content/privacy and mock-review regressions | Verify hosted account persistence when enabled |
| Salary Negotiation guidance and private worksheet | PASS — repository proven | `test:salary-negotiation`; worksheet stays in memory | Legal review of general guidance remains required |
| Referrals, challenges, community, recognition, and write-up builder | PASS — repository proven | privacy/integrity/content validators | Maintain named public channels and moderation coverage |
| Privacy, terms, contact, FAQ, and about | PASS — repository proven for current copy/links | public-link and launch-integrity checks | Qualified legal review; assign and verify contact ownership |
| Visualization Lab Beta | DEFERRED P1 | No launch claim, route, or unreviewed execution surface is introduced | Requires deterministic reviewed traces, textual fallback, ten real integrations, and performance/mobile/CI proof before a future launch decision |

## Authenticated and operational surfaces

| Surface | Launch status | Repository evidence | External/owner gate |
| --- | --- | --- | --- |
| Sign-up, sign-in, recovery, callback, onboarding, settings | PASS — repository proven; feature-gated | auth foundation, lifecycle, production-baseline regressions | Supabase project, SMTP, redirects, enabled-provider verification |
| Applications, interview preparation, calendar, and reminders | PASS — repository proven; feature-gated | calendar/reminder, private-route, persistence, and database qualifications | Scheduler, secret store, real calendar/email verification |
| Private Behavioral stories, answers, saved questions, and plans | PASS — repository proven; feature-gated | workspace, v1 polish, persistence, and RLS checks | Two-account hosted qualification |
| Account export and permanent deletion | PASS — repository proven; feature-gated | account-lifecycle, production-hardening, local lifecycle qualification | Service-role secret, real account export/deletion test |
| Feedback and least-privilege admin operations | PASS — repository proven; feature-gated | feedback/admin regression and database policy suite | Bootstrap first operator; configure WAF/edge rate limit and operating ownership |
| Analytics and impact ledger | PASS — repository proven; disabled unless configured | P0.9 event allowlists, privacy boundary, ledger validator | Legal/consent decision, production PostHog verification, real dashboard and month-end aggregates |

## Release-critical repository controls

| Control | Status | Evidence |
| --- | --- | --- |
| Content provenance and no fabricated public experiences | PASS — repository proven | company, experience, mock, referral, challenge, and public-launch validators |
| Internal and curated public links | PASS — repository proven | `validate:public-links` and route smoke test |
| Metadata, canonical URLs, sitemap, robots, and private noindex | PASS — repository proven | `test:public-launch-integrity`, `test:private-route-privacy` |
| Keyboard/focus/form semantics and density/readability guards | PASS — repository proven | accessibility-aware public-launch regression, `test:ui-density`, `test:typography-readability` |
| Mobile, visual, and assistive-technology acceptance | OWNER GATE — external/manual verification required | Existing implementation has static safeguards; no fresh browser evidence is represented by this record |
| Security headers, secret boundaries, server actions, and rate limits | PASS — repository proven | `test:production-hardening` |
| RLS, ownership isolation, export/deletion cascades | PASS — repository proven locally | schema lint, pgTAP, two-user local qualification |
| Production backups, DNS, TLS, CSP console validation, monitoring, and rollback execution | OWNER GATE — external verification required | Procedures in `docs/production-launch-checklist.md` and `docs/production-operations-runbook.md` |

## P0.9 contract audit

The P0.9 launch-analytics contract remains the canonical `analytics-definition-v1`: event-specific allowlists reject private/free-form properties; public-only pageviews suppress private routes; account registration is an end-of-window Supabase/Auth aggregate; and evidence templates are not evidence. The snapshot key is now `registered_accounts`, matching that published definition. There are no committed monthly snapshots, so this clarity repair does not rewrite historical evidence.

## Required owner sign-off before enabling production accounts or analytics

1. Complete every hosted item in `docs/production-launch-checklist.md`, including two disposable-account verification.
2. Record a backup/PITR check, applied hosted migration list, deployment URL, and redacted CI links in the release record.
3. Obtain qualified review of the Privacy and Terms drafts, and decide whether a functional analytics-consent control is required for the launch jurisdictions.
4. Configure and test SMTP, exact Auth redirects, each enabled OAuth provider, required secrets, WAF/edge rate limits, and the named operator/contact owners.
5. Verify production headers, sitemap/robots, canonical URLs, CSP console behavior, mobile/keyboard/screen-reader paths, and the public route smoke test against the deployed origin.

## Readiness decision

**Current repository decision: `REPOSITORY RC READY` only after the qualification recorded in the release-candidate record is green.**

Do not represent this as a public-production launch. The owner gates above are blockers for enabling the account platform, analytics, and a full hosted v1 release. Public content may remain available with `NEXT_PUBLIC_ACCOUNTS_ENABLED=false` while those gates are completed.
