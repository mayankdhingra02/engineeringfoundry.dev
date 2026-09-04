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
5. `supabase migration list --linked`; confirm all **34** migrations are applied through `202609030007_save_behavioral_answer_aggregate.sql`.
6. Verify RLS/grants/RPCs, including profiles, applications/rounds, Behavioral stories and answers, DSA/System Design progress and active-plan preferences, ML Design and Behavioral preparation activity, reminders/calendar, Playbook inputs, mock reviews, and Interview Experiences. For profiles, use a disposable owner and the publishable client to store the canonical professional URLs `https://github.com/qualification-a` and `https://www.linkedin.com/in/qualification-a`; confirm those exact stored values and the public RPC projection, then confirm changed-column writes using a deceptive host or credentials fail with SQLSTATE `23514`. Inspect the deployed `get_public_profile` definition to confirm unsafe legacy professional-link values are returned as `null` while exact HTTPS GitHub/LinkedIn host aliases remain readable. If an existing pre-migration invalid value is available, verify the public RPC masks it without changing the stored owner value; do not create, backfill, or rewrite production profile data solely to manufacture this case. For Interview Experiences, confirm the approved-row policies apply only to `anon`, anonymous clients have no table-wide `SELECT`, the safe nested report/round projection succeeds, and author, moderation, lifecycle, round identifier/position, and round process-note columns remain unavailable to anonymous clients. For interview-preparation checklists, use a disposable owner and the publishable client to call `set_interview_preparation_checklist_item`: set two distinct canonical items to `true`, repeat one `true` request, then set only the other item to `false`; confirm independent membership, idempotence, and preservation of the untouched item. Confirm another disposable user cannot change that round. Finally, confirm a direct legacy `save_interview_preparation` call with non-null `completed_ids_value` fails with SQLSTATE `0A000` and `Checklist items must be updated individually`; notes-only and reflection-only calls must remain compatible. For DSA quick progress, confirm `anon` cannot execute `set_dsa_question_quick_progress` while an authenticated disposable owner can. Against one canonical question with existing confidence and notes, issue overlapping desired-status and desired-bookmark calls and confirm both requested fields survive without changing confidence or notes; repeat each desired value and confirm idempotence. Confirm a `false` bookmark request on an untouched canonical question returns that question ID without creating a row, another owner cannot read or mutate the first owner's state, and the RPC rejects both zero and two supplied quick values with SQLSTATE `23514` and `Exactly one quick progress value is required`. For revision-checked DSA full progress, confirm `anon` cannot execute `save_dsa_question_progress_if_revision`, another owner cannot read or change the first owner's row, and a returned `updated_at` advances the revision. Race two full saves from one revision and confirm exactly one coherent snapshot wins; race full saves with quick status and bookmark writes and confirm the quick desired fields survive; race an `absent` full save with `import_dsa_question_progress_if_absent` and confirm neither winner is overwritten. Confirm a stale timestamp or stale absent sentinel returns zero rows without mutation. Confirm the legacy authenticated `save_dsa_question_progress` signature fails with SQLSTATE `0A000` and `Revision-checked DSA progress saving is required`. For revision-checked System Design item progress, confirm `anon` cannot execute `save_system_design_item_progress_if_revision` or `set_system_design_item_quick_progress`. With a disposable owner and one exact `(item_type,item_id)` key, confirm one absent full save succeeds and returns a revision; race two full saves from that revision and confirm exactly one coherent status/confidence/bookmark/note snapshot wins; race a full save with a desired-status quick save and confirm the quick status survives without mixing or clearing the rich fields; repeat the same quick status and confirm the revision does not churn. Race an explicit absent full save against both `import_system_design_item_progress_if_absent` and the desired-status quick RPC, confirm no winner is silently overwritten, and verify a second owner cannot observe or mutate the first owner's row. Confirm the authenticated legacy `save_system_design_item_progress` signature fails without mutation with SQLSTATE `0A000` and `Revision-checked System Design progress saving is required`. For the atomic browser import, confirm `anon` cannot execute `import_dsa_question_progress_if_absent`, `import_system_design_item_progress_if_absent`, or `import_preparation_track_progress_if_absent`, while an authenticated disposable owner can import canonical missing activity. Confirm each RPC returns `true` only for its insert, returns `false` for an existing row without changing richer status, notes, confidence, bookmark, or timestamps, and remains idempotent under repeated and overlapping calls. Confirm concurrent same-key imports insert once, concurrent different-key imports commute, a concurrent rich DSA or System Design save is not overwritten by the import default, and another owner cannot observe or change the first owner's rows. These are hosted owner-run checks and remain unverified until their evidence is recorded.
7. For Behavioral story aggregates, confirm `anon` cannot execute `create_behavioral_story_with_themes`, `update_behavioral_story_with_themes_if_revision`, or `duplicate_behavioral_story_with_themes`. With disposable owners, confirm create saves one parent and its exact controlled themes; two updates from one revision produce exactly one coherent winner; stale, foreign, and missing updates return zero rows without mutation; duplication captures one complete parent/theme snapshot; and invalid themes roll back both halves. Confirm authenticated direct story `INSERT`/`UPDATE` and theme `INSERT`/`UPDATE`/`DELETE` fail, owner story deletion remains available, and the authenticated legacy `replace_behavioral_story_themes` call fails with SQLSTATE `0A000` and `Atomic Behavioral story saving is required`. These hosted checks remain unverified until their evidence is recorded.
8. For Behavioral answer aggregates, confirm `anon` cannot execute `create_behavioral_answer_aggregate` or `update_behavioral_answer_aggregate_if_revision`. With disposable owners and one question, confirm create saves content and desired primary state together; race two full edits from one revision and confirm exactly one coherent snapshot wins; then race two answers requesting primary and confirm exactly one requested answer is primary. Confirm stale revisions, foreign answer targets, missing answer targets, and question-mismatched targets return zero rows without changing answer content or the prior primary, and invalid input rolls back before any primary change. Confirm authenticated direct answer `INSERT`/`UPDATE` fail while owner `SELECT`/`DELETE` remain available, and the authenticated legacy `set_behavioral_primary_answer` call fails without mutation with SQLSTATE `0A000` and `Atomic Behavioral answer saving is required`. These hosted checks remain unverified until their evidence is recorded.
9. Run the two-disposable-account qualification in `docs/production-launch-checklist.md`, including account export schema `1.5`, account deletion, P0.2 preparation activity and active-plan isolation, the atomic browser-import no-overwrite boundary, mock review isolation, private Interview Experience draft isolation, and P0.8 feedback/admin operations.

Apply `202609030005_save_behavioral_story_aggregate.sql` before the aggregate-writing application. Migration-first closes authenticated direct story/theme mutation and makes already-loaded old split-write clients fail safely; app-first leaves their torn-write window open until the migration lands. A post-migration rollback to old application code is safe but degraded because those old writes remain unavailable, so retain the migration and roll forward.

Apply `202609030006_save_system_design_item_progress_if_revision.sql` before the revision-aware System Design application. Migration-first makes already-loaded whole-row clients fail safely with SQLSTATE `0A000`; application-first protects only newly loaded clients and leaves the stale overwrite window open until the migration lands. A post-migration application rollback is safe but degraded because the legacy full-save boundary remains unavailable, so retain the migration and roll forward.

Apply `202609030007_save_behavioral_answer_aggregate.sql` before the Behavioral answer aggregate application. Migration-first closes authenticated direct answer `INSERT`/`UPDATE` and makes the legacy primary-only RPC fail with SQLSTATE `0A000`, so already-loaded split-write clients fail before partial mutation; application-first protects only newly loaded clients and leaves the old torn-save and stale-overwrite window open until the migration lands. A post-migration application rollback is safe but degraded because the legacy direct and primary-only paths remain unavailable, so retain the migration and roll forward.

Migrations are forward-only. If a migration fails before completion, stop the deployment, preserve the error with secrets redacted, compare the linked migration history, and apply a new corrective migration only after review. Do not edit an already-applied migration. Restore from backup only when data loss is accepted; verify restore in a separate environment before routing production traffic.

## Reminder worker

The endpoint is `POST https://<production-domain>/api/internal/reminders/process` with `Authorization: Bearer <REMINDER_WORKER_SECRET>`. An external HTTPS scheduler is required; no provider is assumed by this repository.

- Start with a manual authenticated request and verify `401` for a missing/wrong secret.
- With a valid secret, the current no-provider state must return `503`; do not mark email delivery configured.
- When a provider adapter is deliberately added later, verify provider idempotency, retry classes, scheduler overlap, recipient handling, secret rotation, and logs before enabling email preference.
- In-app reminder state is independent and remains available without email delivery.

## Production smoke checklist

Run after deployment, recording tester/date/evidence without private payloads.

After deploying the exact candidate that completed local qualification, run the automated public-route smoke against that deployment:

```bash
PUBLIC_SMOKE_ORIGIN=https://engineeringfoundry.dev npm run test:public-routes:hosted
```

This is a post-deployment command. It requires a root HTTP(S) origin and rejects paths, query strings, fragments, and embedded credentials. It does not build the application or start/stop a local Next.js server. `npm run test:public-routes` remains the local built-candidate smoke used by `npm run qualify:launch:production`; do not treat that local command as hosted verification. Record the result as dated deployment evidence only after it runs successfully; until then, keep `DEPLOYMENT_STATUS=NOT_DEPLOYED_HOSTED_GATES_PENDING`.

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
npm run qualify:launch:production
npm run release:verify
```

The release build is `next build`, a **Next.js production build using Turbopack**. CI and local production qualification use that same command.

These checks are automated in the repository or CI. DNS, SSL, managed backups, SMTP, OAuth provider settings, Supabase hosted migration application, PostHog configuration, scheduling, and deployment are owner/hosting-provider actions and block full P0.1 completion until recorded as verified.
