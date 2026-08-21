# Engineering Foundry v1 Launch Finish Plan

**Canonical launch-governance document**  
**Prepared:** August 21, 2026  
**Repository baseline audited:** `main` at `0ae80361d30bb486ebc5d099155dfe7f916c083f`

## Goal and scope freeze

Launch a coherent, trustworthy Engineering Foundry v1 — not an attempt to finish the product forever. The product promise is: **context → assess evidence → prioritize → learn/practice in the canonical section → observe new evidence → reprioritize**.

Feature complete: October 2, 2026. Release candidate: October 9, 2026. Public launch: October 16, 2026.

No new major section becomes P0 unless it replaces an existing P0 item or closes a security, data-loss, legal, or launch-critical gap. After October 2, only defect fixes, content corrections, security/privacy work, accessibility, performance, deployment, and launch polish are permitted.

Every implementation must work only in its current P0 workstream. New ideas go to the post-launch backlog.

## Product boundaries

Engineering Foundry is a focused software-engineering interview-preparation workspace. It combines technically credible, source-aware curricula, level/company-aware preparation, persistent progress, obvious next actions, private workspaces, and low-overwhelm UX.

The Interview Playbook owns context, orchestration, execution guidance, time-horizon changes, recovery, debrief, provenance, and explainability. It does not duplicate specialist curricula or show pass probabilities/readiness scores.

Completion is activity, not proof of mastery. Private notes, stories, applications, reflection text, secrets, and tokens must never be logged or sent to analytics. Preserve RLS, RPC-only writes where intended, export/deletion integrity, and provenance distinctions.

## P0 workstreams

### P0.1 Production baseline, authentication, and deployment

- Production domain, DNS, HTTPS, canonical URLs, environment configuration, migrations, auth callback/email recovery/sign-out redirects, PostHog privacy configuration, reminders, error monitoring, backups, export/deletion/recovery runbook, and launch smoke tests.
- A new user must be able to sign up, verify, onboard, sign in, recover a password, export data, and delete the account. RLS qualification and no-private-analytics boundaries must remain green.

### P0.2 Unified continuation, progress, and study plans

- Homepage continuation for DSA, System Design, ML Design, and Behavioral.
- Signed-in continuation from account progress and active plans; versioned anonymous local progress; optional explicit merge on sign-in; meaningful completion controls; one active saved plan per track; weekly momentum and recent activity (not daily streaks); exact Playbook deep links and return path.

### P0.3 Interview Experiences v1

- Directory appears before contribution workflow, with honest empty state and filters for company, role/level, date, stage/round type, location/region, and source freshness where available.
- An “Add an interview experience” CTA leads to authenticated create, preview, submit, edit, withdraw, and delete flows.
- Moderation states: draft, submitted, needs changes, approved, rejected, archived.
- Require publication consent and privacy/confidentiality checks. Exact proprietary prompts must be rejected or generalized. Preserve source/provenance, report date, context, “may vary”, correction/removal/archival, and report-abuse paths.
- Do not publish scraped, copied, purchased, fabricated, or test-user experiences; contributors select public identity treatment; public counts reflect approved records only.

### P0.4 Company Guides v1

Build strong sourced guides for Amazon, Google, Meta, Walmart, Microsoft, NVIDIA, OpenAI, Anthropic, Atlassian, and Uber. Separate qualitative Coding/DSA, practical coding/debugging/code review/LLD, System Design, role-relevant ML Design, and Behavioral/values sections. Use Entry, Mid, Senior, and Staff+ overlays; distinguish official sources, candidate reports, and Engineering Foundry recommendations; show verification date, applicability, confidence, related experiences, and practice links. Never use unsupported weighting percentages.

### P0.5 Low-Level Design v1

Deliver eight lessons: approach, requirements/use cases, domain models, responsibilities/ownership, relationships/interfaces, state/lifecycle/invariants/errors, selective patterns, and concurrency/testability/evolving requirements. Include six original/generic practice designs. Teach decisions, trade-offs, failure modes, and follow-ups; link to System Design when distributed and later LLD systems when memory/concurrency dominate.

### P0.6 Salary Negotiation v1

Deliver eight modules and a private offer-comparison worksheet: package anatomy; level/scope/bands; timing; honest leverage; counters/scripts/component trade-offs; startup equity diligence; raises/promotion; remote/geographic models/written terms/jurisdictional caveats. Include an offer-status Playbook handoff. Never encourage fabricated offers or documents; label legal/employment guidance as general and time-sensitive.

### P0.7 Behavioral v1 polish

Extend—not rebuild—the story workspace with a coverage map, compact STAR/CAR/SOAR outline on question pages, story-first answers, fact-integrity prompts, concise/standard answer modes, consistency follow-ups, Entry/Mid/Senior/Staff+ overlays, and text-first accessibility. Stories remain canonical factual sources; answer variants cannot silently add facts or metrics.

### P0.8 Feedback and minimal admin operations

Add privacy-aware bug/suggestion intake (category, message, current page, optional contact, consent, rate/spam/abuse controls, status, reference ID) and least-privilege/audited operations for interview-experience moderation, feedback triage, company-guide freshness, and operational health. No broad CMS, impersonation, analytics warehouse, mass messaging, or general community administration.

### P0.9 Analytics and launch evidence

Configure PostHog production and consent/privacy copy. Provide dashboards/funnels for first useful action, track and lesson starts/completions, continuation, plan activation, mock completion, and seven-day return, segmented only where privacy permits. Establish dated releases, stable monthly metric exports, consented testimonials, adoption evidence, and an EB-1A impact ledger. Never buy bots or fabricate impact.

### P0.10 Content, accessibility, QA, and launch operations

Complete content/source, links, metadata, sitemap, robots, canonical/OG, keyboard/screen-reader/focus/form/touch/text-resize/contrast/reduced-motion, mobile/desktop, performance/CWV, database/reset/RLS/export/deletion/static/build/smoke, security/secrets/rate-limit/backup/incident, privacy/legal/contact/moderation, release notes, and rollback checks.

## P0 stretch

Visualization Lab Beta is launch eligible only if it uses reviewed deterministic Python traces, never arbitrary user code, has bounded/static artifacts, accessible textual fallback, ten real integrations, and green performance/mobile/CI by October 2. Otherwise it moves to P1.

## P1 and exclusions

P1 begins after launch stability with: authenticated peer evaluator feedback (Phase 3E), visualization expansion, AI Basics, seven additional company guides, richer Behavioral/mock depth, research/blog publishing, genuine moderated community, Principal-specific overlays, Low-Level Systems/C++, and only then ethical monetization.

Do not build: payment for referral access, daily streak gamification, AI for Kids inside EF, broad social feeds, fake activity, scraped proprietary questions, hidden interview copilot/cheating assistance, numeric readiness/pass scores, personality/emotion/accent/culture-fit scoring, arbitrary code execution, full CMS, or blog CMS before launch.

## Canonical level taxonomy

Use Entry, Mid, Senior, and Staff+. Map company titles with visible caveats; a distinct Principal profile is P1 unless evidence supports materially distinct preparation.

## Weekly roadmap and definition of done

Week 0: commit this plan, pause P1 branches, create P0 epics. Week 1: production baseline and unified progress. Week 2: Interview Experiences and operations. Week 3: company guides/levels. Week 4: LLD. Week 5: Salary and Behavioral. Week 6: feature completion/content freeze. Week 7: release candidate. Week 8: fixes only and launch.

v1 is ready only when P0 routes work; continuation, authenticated/anonymous completion, saved plans, genuine moderated experiences, ten guides, LLD, salary, coherent Behavioral loop, honest mock self-review, feedback/admin operations, trust/privacy/accessibility/release quality, and launch operations all meet their stated acceptance criteria.

## Governance

Every feature PR must state its P0/P1 workstream, acceptance criterion, deliberate non-goals, private-data/analytics implications, source/provenance implications, qualification run, and whether it changes scope/dates. A PR without a connection to this plan goes to backlog review.
