# Production operations runbook

This runbook is the owner-operated half of P0.1. Repository qualification proves code, migrations, RLS, and local behavior; it does not prove a DNS provider, hosted Supabase project, email delivery, scheduler, backup policy, or deployment environment.

## Ownership and release record

For every production release, record the deployment owner, UTC time, Git SHA, hosting deployment URL, Supabase project reference, final migration filename, and links to the CI runs. Do not place export files, passwords, tokens, service-role keys, reminder secrets, or customer data in the release record.

## Environment contract

Set these in the hosting provider's encrypted environment store; never commit values or print them in CI.

| Variable | Location | Required for | Verification |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public build environment | canonical URLs and production accounts | exact `https://<production-domain>`, no trailing slash; production account UI is unavailable if absent or invalid |
| `NEXT_PUBLIC_SUPABASE_URL` | public build environment | accounts | exact hosted project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public build environment | accounts | publishable/anon key only, never service role |
| `NEXT_PUBLIC_ACCOUNTS_ENABLED` | public build environment | accounts | keep `false` until hosted qualification passes; then set exactly `true` and redeploy |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`, `NEXT_PUBLIC_GITHUB_AUTH_ENABLED` | public build environment | optional OAuth | set `true` only after that provider works against the production callback |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | public build environment | optional analytics | confirm privacy configuration and a public pageview; absence intentionally disables analytics |
| `NEXT_PUBLIC_CONTACT_EMAIL` | public build environment | optional contact email | verified mailbox with a named owner |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only secret store | deletion, reminder worker | never browser-visible; delete control stays unavailable when absent |
| `REMINDER_WORKER_SECRET` | server-only secret store | reminder worker | high-entropy secret; endpoint returns `401` when absent/incorrect |

`REMINDER_EMAIL_PROVIDER` is reserved only. No provider adapter exists, so setting it must not be treated as enabling email reminders.

Before enabling accounts, inspect `.next/static` after a production build and confirm `SUPABASE_SERVICE_ROLE_KEY` and `REMINDER_WORKER_SECRET` are absent. The automated production-hardening regression also verifies server-only usage in source.

## Domain, HTTPS, and Supabase Auth

1. Configure DNS and TLS with the selected hosting provider. Do not enable account traffic over a non-HTTPS production origin.
2. Set `NEXT_PUBLIC_SITE_URL` to that exact origin and deploy.
3. In Supabase Auth URL Configuration, set **Site URL** to the same origin.
4. Add these exact redirect URLs—no production wildcards:
   - `https://<production-domain>/auth/callback`
   - `https://<production-domain>/reset-password` is an application page, but recovery emails must redirect through `/auth/callback?next=/reset-password&flow=recovery`.
5. For any intentionally supported preview domain, add its `/auth/callback` URL individually; otherwise do not authorize it.
6. Configure production SMTP, confirmation, email-change, and recovery templates in Supabase. The app does not claim delivery until a real mailbox test passes.
7. For each enabled OAuth provider, configure its provider-console callback and Supabase provider settings, then complete an actual sign-in. Keep its public flag false until then.

The callback and all post-auth destinations use `safeInternalPath`; arbitrary external `next` values, protocol-relative URLs, and backslash paths fall back to `/dashboard`.

## Database release and recovery

**Owner action required; do not run a local reset against a hosted project.**

1. Confirm point-in-time recovery or scheduled backups are enabled in Supabase, and take a manual backup before the first migration or schema-changing release.
2. `supabase link --project-ref <production-project-ref>`
3. `supabase db diff --linked`; stop on any unexpected drop, rename, or unrelated change.
4. `supabase db push`
5. `supabase migration list --linked`; confirm all **25** migrations are applied through `202608230002_add_feedback_export_rpc.sql`.
6. Verify RLS/grants/RPCs, including profiles, applications/rounds, Behavioral stories and answers, DSA/System Design progress and active-plan preferences, ML Design and Behavioral preparation activity, reminders/calendar, Playbook inputs, mock reviews, and Interview Experiences.
7. Run the two-disposable-account qualification in `docs/production-launch-checklist.md`, including account export schema `1.5`, account deletion, P0.2 preparation activity and active-plan isolation, the anonymous browser-import no-overwrite boundary, mock review isolation, private Interview Experience draft isolation, and P0.8 feedback/admin operations.

Migrations are forward-only. If a migration fails before completion, stop the deployment, preserve the error with secrets redacted, compare the linked migration history, and apply a new corrective migration only after review. Do not edit an already-applied migration. Restore from backup only when data loss is accepted; verify restore in a separate environment before routing production traffic.

## Reminder worker

The endpoint is `POST https://<production-domain>/api/internal/reminders/process` with `Authorization: Bearer <REMINDER_WORKER_SECRET>`. An external HTTPS scheduler is required; no provider is assumed by this repository.

- Start with a manual authenticated request and verify `401` for a missing/wrong secret.
- With a valid secret, the current no-provider state must return `503`; do not mark email delivery configured.
- When a provider adapter is deliberately added later, verify provider idempotency, retry classes, scheduler overlap, recipient handling, secret rotation, and logs before enabling email preference.
- In-app reminder state is independent and remains available without email delivery.

## Production smoke checklist

Run after deployment, recording tester/date/evidence without private payloads.

**Public:** homepage, DSA, System Design, ML Design, Behavioral, Interview Playbook, Interview Experiences, companies, and mock interviews; canonical/robots/sitemap; HTTPS headers and no CSP violations on a representative public and private page.

**Auth:** sign-up with confirmation, callback, onboarding, sign-in, sign-out/sign-back-in, password recovery/update, account email change, settings, and each explicitly enabled OAuth provider.

**Private data:** with User A and User B, verify application, Behavioral, DSA/System Design progress and active plans, ML Design/Behavioral preparation activity, mock-review, Interview Experience draft, calendar/reminder, export, and deletion isolation. While signed out, verify browser progress imports only canonical activity after an explicit consent action and never overwrites account records. Confirm approved/consented Interview Experiences are publicly readable while drafts/submitted records are not.

**Analytics:** only if configured, verify a public pageview; navigate private routes and confirm no private pageviews, query strings, tokens, email, notes, stories, answers, application data, mock ratings/notes, or experience draft text arrive in PostHog.

**P0.9 analytics and evidence:** follow `docs/analytics-launch-operations.md` before enabling PostHog. Verify identify/reset after a real sign-in/sign-out, create the four specified dashboards only after their events are observed, and commit the first real aggregate monthly snapshot only after the month closes. `docs/impact-ledger/` templates are not evidence and must never be counted as adoption, testimonials, outcomes, or impact.

## Incident and rollback

1. For account/auth risk, set `NEXT_PUBLIC_ACCOUNTS_ENABLED=false` and redeploy. Public learning remains available; data is retained.
2. For worker risk, unset `REMINDER_WORKER_SECRET`; requests fail closed and no delivery occurs.
3. For deletion/worker credential risk, unset `SUPABASE_SERVICE_ROLE_KEY`; deletion becomes explicitly unavailable.
4. For application defects, redeploy the prior application build. Do not roll back migrations; use a new corrective migration.
5. Preserve only redacted operational logs. Escalate data exposure, authentication bypass, or destructive failure before resuming deployments.

## Repository commands

```bash
npm run qualify:static
npm run qualify:database
npx next build --webpack
npm run test:public-routes
```

These checks are automated in the repository or CI. DNS, SSL, managed backups, SMTP, OAuth provider settings, Supabase hosted migration application, PostHog configuration, scheduling, and deployment are owner/hosting-provider actions and block full P0.1 completion until recorded as verified.
