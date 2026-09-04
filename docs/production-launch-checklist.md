# Production launch checklist

Operational checklist for taking Engineering Foundry's signed-in v1 to production. Every item is something an operator performs against a real hosted environment. Nothing here is satisfied by a passing local build.

The account platform is gated by `NEXT_PUBLIC_ACCOUNTS_ENABLED`. Public preparation content ships and works independently of every item below, so the public site can go live before any of this is complete.

**Local qualification is not hosted qualification.** The repository can prove its own logic; it cannot prove your Supabase project, DNS, SMTP, or deployment environment.

---

## 0. Capability model

Capabilities are independent. Confirm which ones you intend to enable before configuring anything.

| Capability | Requires | If unmet |
| --- | --- | --- |
| Public preparation content | nothing | — always available |
| Account platform | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ACCOUNTS_ENABLED=true` | Private routes and controls are absent; public product unaffected |
| Permanent account deletion | account platform **+** `SUPABASE_SERVICE_ROLE_KEY` | Delete control renders as explicitly unavailable |
| Reminder worker | `SUPABASE_SERVICE_ROLE_KEY` **+** `REMINDER_WORKER_SECRET` **+** external HTTPS scheduler | Endpoint rejects every request as unauthorized |
| Email reminders | reminder worker **+** a real provider adapter | **Not available.** No adapter is implemented; the toggle stays disabled |

`lib/config/capabilities.ts` is the authority. It reports missing variable *names* only, never values.

---

## Before deployment

### Environment variables

Browser-safe (inlined into the client bundle — public by definition):

- [ ] `NEXT_PUBLIC_SITE_URL` — exact production origin, no trailing slash
- [ ] `NEXT_PUBLIC_DISCORD_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable/anon key only
- [ ] `NEXT_PUBLIC_ACCOUNTS_ENABLED` — **`false` until section 3 passes**
- [ ] `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` / `NEXT_PUBLIC_GITHUB_AUTH_ENABLED` — true only where the provider is verified
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` — optional

Server-only (must never carry a `NEXT_PUBLIC_` prefix, appear in CI logs, or reach a browser bundle):

- [ ] `SUPABASE_SERVICE_ROLE_KEY` — required for deletion and the reminder worker
- [ ] `REMINDER_WORKER_SECRET` — required for the reminder worker
- [ ] `REMINDER_EMAIL_PROVIDER` — reserved; has no effect today

Verify:

- [ ] `grep -r "SUPABASE_SERVICE_ROLE_KEY\|REMINDER_WORKER_SECRET" .next/static` returns nothing after a production build
- [ ] No secret appears in deployment logs or build output

### Supabase project

- [ ] Confirm the project reference is the intended production project, not staging
- [ ] Record the project reference and current migration version in your release notes
- [ ] Confirm point-in-time recovery or scheduled backups are enabled **before** applying migrations
- [ ] Take a manual backup immediately before the first migration run

### Auth configuration

- [ ] Site URL set to the production origin
- [ ] Redirect allowlist contains the exact production callback `…/auth/callback`
- [ ] **No wildcard redirect entries in production**
- [ ] Preview-deployment callbacks added individually, only if intentionally used
- [ ] Production SMTP configured (Supabase's built-in email service is test-grade and rate limited)
- [ ] Confirmation email template uses Supabase's confirmation URL
- [ ] Email-change template verified — the address changes only after confirmation
- [ ] Password recovery template points at the application callback, which forwards to `/reset-password`
- [ ] Google OAuth: provider callback registered in Google Cloud and Supabase, flag enabled only after a real sign-in works
- [ ] GitHub OAuth: same

### Reminders

- [ ] Decide whether the reminder worker is enabled at launch
- [ ] If enabled: set `REMINDER_WORKER_SECRET`, configure an external HTTPS scheduler to `POST /api/internal/reminders/process` with `Authorization: Bearer <secret>`
- [ ] Confirm email reminders remain unavailable and the settings toggle is disabled
- [ ] Confirm in-app reminder state renders correctly

---

## Database release

Never run a destructive reset against a hosted project. `supabase db reset` is local-only.

1. [ ] `supabase link --project-ref <production-ref>`
2. [ ] `supabase db diff --linked` — **inspect the diff before applying**; an unexpected drop or rename stops the release
3. [ ] `supabase db push` — applies migrations in filename order
4. [ ] `supabase migration list --linked` — confirm all 32 migrations are recorded, ending at `202609030005_save_behavioral_story_aggregate`
5. [ ] Spot-check that grants, RLS policies, and function definitions match `docs/auth-security.md`, `docs/authenticated-workspace.md`, and `docs/unified-preparation-progress.md`, including `preparation_track_progress` and owner-scoped active-plan preferences
6. [ ] Confirm every owner-scoped table reports `rowsecurity = true`:
   ```sql
   select relname, relrowsecurity from pg_class
   where relnamespace = 'public'::regnamespace and relkind = 'r'
   order by relname;
   ```
7. [ ] Confirm the canonical catalogs seeded: 162 DSA questions, 146 System Design concepts, 27 design problems, 48 curated Behavioral questions

Apply `202609030005_save_behavioral_story_aggregate.sql` before deploying the aggregate-writing application. Migration-first makes already-loaded split-write clients fail safely before partial mutation: direct story/theme writes fail with `42501`, while direct calls to the legacy theme RPC fail with `0A000`. App-first leaves the torn-write window open until the migration lands. Rolling application code back after the migration is safe but degraded because the old split-write path stays unavailable; keep the migration and roll forward.

---

## Hosted qualification

Use two disposable accounts (User A and User B) against the production origin with only the publishable key. Record date, tester, project reference, and evidence for each.

### Authentication

- [ ] Sign up with production SMTP; no authenticated session is created before confirmation
- [ ] Confirmation link works once; a profile row is created by the trigger
- [ ] Sign in succeeds; invalid credentials fail without revealing whether the account exists
- [ ] Onboarding completes; a second disposable account skips it and no preferences are invented
- [ ] An established account is never trapped back in onboarding
- [ ] Password recovery: request, callback, update, expired-link reuse, sign-in with the new password
- [ ] Password change succeeds and **the active session is not signed out** by the verification step
- [ ] Sign out, then global sign out, verified in a second browser
- [ ] OAuth sign-in for each enabled provider

### Ownership isolation (two users)

- [ ] User A cannot read or mutate User B's applications, rounds, preparation, stories, answers, saved questions, progress, attempts, preferences, ML Design/Behavioral `preparation_track_progress`, DSA/System Design active-plan preferences, reminders, mock reviews, Interview Experience drafts, or throttle state
- [ ] User A cannot attach a child record to User B's parent
- [ ] User A cannot open `/interviews/<User B round id>/prepare`
- [ ] User A cannot fetch User B's `.ics` or Google export
- [ ] Anonymous clients cannot select `profiles` directly; the public RPC still returns exactly nine fields
- [ ] With User A and the publishable client, save the canonical GitHub and LinkedIn URLs `https://github.com/qualification-a` and `https://www.linkedin.com/in/qualification-a`; confirm those exact stored values and the public RPC projection, then confirm deceptive-host and credential-bearing changed-column writes fail with SQLSTATE `23514`
- [ ] Inspect the deployed `get_public_profile` definition and confirm unsafe legacy professional-link values are masked to `null` while exact HTTPS GitHub/LinkedIn host aliases remain readable; if a pre-migration invalid value already exists, verify its public result is `null` and its stored owner value is unchanged, but do not manufacture or rewrite production data solely for this check
- [ ] Anonymous Interview Experience reads return only approved, consented reports and the safe nested round projection; direct requests for author identity, moderation/lifecycle metadata, round identifiers/positions, or round process notes fail
- [ ] A signed-in non-owner cannot query another contributor's approved base row; the sessionless public directory still shows the same approved projection
- [ ] Fabricated DSA and System Design canonical IDs are refused
- [ ] As User A, call `set_interview_preparation_checklist_item` for two distinct canonical items with `target_completed=true`; repeat one request and then clear only the other item. Confirm the calls are idempotent, both additions survive independently, and clearing one preserves the untouched item.
- [ ] As User B, confirm `set_interview_preparation_checklist_item` cannot change User A's round. As User A, confirm a legacy `save_interview_preparation` call with non-null `completed_ids_value` fails with SQLSTATE `0A000`, while notes-only and reflection-only calls remain compatible.
- [ ] Confirm `anon` cannot execute `set_dsa_question_quick_progress` and an authenticated disposable User A can. For one canonical question with existing confidence and notes, issue overlapping desired-status and desired-bookmark calls; confirm both requested values persist while confidence and notes remain unchanged, then repeat both desired values to confirm idempotence.
- [ ] As User A, send a `target_bookmarked=false` quick-progress request for an untouched canonical question and confirm the RPC returns its question ID without creating a progress row. Confirm User B cannot read or mutate User A's state, and confirm calls with both quick values null or both non-null fail with SQLSTATE `23514` and `Exactly one quick progress value is required`.
- [ ] Confirm `anon` cannot execute `save_dsa_question_progress_if_revision`. As User A, race two full saves from the same loaded revision and confirm exactly one coherent snapshot wins, the returned `updated_at` advances, and replaying the stale revision returns zero rows without changing the winner.
- [ ] Race a revision-checked full save with quick status and bookmark writes for the same User A/question and confirm both quick desired values survive. Race an explicit absent-revision full save with `import_dsa_question_progress_if_absent` and confirm neither winner is overwritten; confirm User B cannot read or mutate User A's row.
- [ ] Confirm the authenticated legacy `save_dsa_question_progress` signature fails with SQLSTATE `0A000` and `Revision-checked DSA progress saving is required`.
- [ ] Confirm `anon` cannot execute `create_behavioral_story_with_themes`, `update_behavioral_story_with_themes_if_revision`, or `duplicate_behavioral_story_with_themes`; authenticated User A can create one parent with its exact controlled theme set.
- [ ] Race two User A aggregate story updates from the same revision and confirm exactly one coherent parent/theme snapshot wins; stale, foreign, and missing revisions return zero rows without mutation, duplication captures one complete aggregate snapshot, and invalid themes roll back both parent and theme changes.
- [ ] Confirm authenticated direct story `INSERT`/`UPDATE` and theme `INSERT`/`UPDATE`/`DELETE` fail while owner story deletion remains available. Confirm the authenticated legacy `replace_behavioral_story_themes` call fails with SQLSTATE `0A000` and `Atomic Behavioral story saving is required`.

### Anonymous browser-progress import boundary

- [ ] While signed out, record only canonical public preparation activity in the browser; no notes, answers, stories, or analytics payloads are present in browser progress
- [ ] Confirm `anon` cannot execute `import_dsa_question_progress_if_absent`, `import_system_design_item_progress_if_absent`, or `import_preparation_track_progress_if_absent`; after sign-in, choose the explicit import action and confirm those insert-only RPCs import only valid missing activity for User A
- [ ] Seed richer existing progress in all three storage families, then confirm import reports it as existing and leaves its status, notes, confidence, bookmark, and timestamps unchanged; repeat and overlap same-key imports to confirm exactly one insert, and overlap a DSA import with a richer save to confirm the richer intent survives
- [ ] Change a submitted browser activity while its request is in flight, and add an unrelated activity; confirm only an exact submitted browser snapshot whose account result is imported or existing is cleared from current primary and legacy storage, while changed, unrelated, and failed activity remains and local saved plans are not imported automatically
- [ ] Confirm User B cannot read, import, overwrite, or otherwise observe User A's browser-originated or account-backed preparation activity

### Privacy

- [ ] `/robots.txt` disallows every private prefix including `/calendar`, `/interviews`, and `/system-design/problems/*/practice`
- [ ] `/sitemap.xml` lists no private route
- [ ] With analytics configured, navigate dashboard → application → interview preparation → calendar → behavioral story → System Design attempt, then confirm in PostHog's live event view that **no pageview and no round/application/story/attempt UUID was received**
- [ ] Private pages return `noindex` metadata
- [ ] If PostHog is enabled: follow `docs/analytics-launch-operations.md`; verify public path-only pageviews, private-route suppression, query/fragment stripping, safe identify/reset, and that autocapture/session recording/exception capture remain disabled
- [ ] Confirm qualified legal/privacy review determines whether a functional analytics-consent control is required for the actual deployment jurisdictions before enabling PostHog

### P0.9 analytics and launch evidence

- [ ] Create the production PostHog project and configure only `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`; do not commit values
- [ ] Build the four dashboards from `docs/analytics-launch-operations.md` after verifying real event payloads; do not claim a dashboard exists before it is created
- [ ] After the first complete measurement month, create one aggregate `docs/impact-ledger/snapshots/YYYY-MM.json`, validate it with `npm run validate:impact-ledger`, and keep `analytics_definition_version` unchanged
- [ ] Record releases, independent evidence, and testimonials only with actual source links and required permission metadata; never convert feedback to a testimonial without explicit permission

### P0.8 feedback/admin operations

- [ ] Submit anonymous and signed-in feedback; verify the private `EF-FB-…` reference receipt, consent gate, sanitized page context, and rate limit
- [ ] Verify anonymous and ordinary members cannot read feedback or access `/admin`; verify an explicitly bootstrapped operator can triage feedback and moderate only submitted/needs-changes experiences
- [ ] Confirm `/admin` remains noindex/no-store, renders no secrets, and company freshness remains a read-only review reminder

### Export

- [ ] Export succeeds and downloads as a dated JSON attachment
- [ ] Headers include `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`
- [ ] Export contains User A's data only, has `export_version` `1.5`, includes User A's `preparation_activity` and account-linked feedback only, and contains no credentials, tokens, provider delivery identifiers, or global catalogs
- [ ] Request the export more than five times in fifteen minutes — the sixth returns `429` with `Retry-After`
- [ ] **Delete all cookies, sign in again, and confirm the limit is still in force** (the budget is server-side)

### Deletion

- [ ] Delete a disposable account holding representative private data
- [ ] Password-capable accounts must re-enter the current password; an incorrect password deletes nothing
- [ ] OAuth-only accounts require the typed `DELETE` confirmation
- [ ] Auth identity and all owner-scoped rows are gone; User B is unaffected
- [ ] Interview Experience draft/round rows and persisted mock review/rating rows are gone with User A; User B is unaffected
- [ ] User A's `preparation_track_progress` rows and DSA/System Design active-plan preferences are gone with the account; User B's corresponding data is unaffected
- [ ] Stale session cannot reach private routes; export returns unauthorized
- [ ] No reminder row remains for the worker to claim

### Calendar and reminders

- [ ] `.ics` downloads, opens in a calendar client, and shows the interview's stored timezone
- [ ] The `.ics` preparation link points at the production origin
- [ ] "Add to Google Calendar" opens a prefilled template (it is not synchronization)
- [ ] Rescheduling produces a new reminder revision and suppresses the superseded one
- [ ] Cancelling or completing a round suppresses pending reminders
- [ ] Anonymous `POST /api/internal/reminders/process` returns `401`
- [ ] With the correct bearer token it returns `503` while no email adapter exists

### Security headers

Check the production response for any page:

- [ ] `Content-Security-Policy` present with `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`
- [ ] `connect-src` lists only your Supabase project and, if configured, PostHog
- [ ] `Strict-Transport-Security` present over HTTPS
- [ ] `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Browse the site with the console open and confirm **no CSP violation** on: homepage, a DSA lesson, a System Design lesson containing a Mermaid diagram, the dashboard, and the calendar

---

## Launch

1. [ ] Deploy with `NEXT_PUBLIC_ACCOUNTS_ENABLED=false` and confirm the public product is healthy
2. [ ] After deploying the exact candidate that passed local qualification, run the post-deployment public-route smoke (it never builds or starts a local application server):
   ```bash
   PUBLIC_SMOKE_ORIGIN=https://engineeringfoundry.dev npm run test:public-routes:hosted
   ```
   `PUBLIC_SMOKE_ORIGIN` is an operator-only command input, not an application runtime variable. Use only the root HTTP(S) origin; do not add a path, query, fragment, or credentials. Record the tester/date/evidence and keep this hosted gate unchecked until it passes against the real deployment.
3. [ ] Complete every hosted-qualification item above using a temporarily enabled preview or staging environment
4. [ ] Set `NEXT_PUBLIC_ACCOUNTS_ENABLED=true` and redeploy
5. [ ] Re-verify sign-in, dashboard, export, and deletion on production
6. [ ] Watch Supabase Auth and Postgres logs for the first hours
7. [ ] Grep application logs for `"level":"error"` events: `account_export_failed`, `account_deletion_failed`, `reminder_worker_failed`, `calendar_export_record_failed`

---

## Rollback

Ordered from least to most disruptive.

| Action | Effect | Data loss |
| --- | --- | --- |
| Set `NEXT_PUBLIC_ACCOUNTS_ENABLED=false` and redeploy | Accounts disabled, public product unaffected, private data retained | None |
| Unset `REMINDER_WORKER_SECRET` | Worker rejects everything; reminder rows accumulate harmlessly | None |
| Unset `SUPABASE_SERVICE_ROLE_KEY` | Deletion renders unavailable; worker stops | None |
| Set an OAuth flag to `false` | That provider disappears from the sign-in surface | None |
| Redeploy the previous application build | Reverts application code | None, provided migrations are not rolled back |

**The account feature flag is the primary emergency boundary.** It requires no code change and no database change, and it never destroys user data.

Migrations are forward-only. There is no down-migration path. To reverse a schema change, write a new corrective migration and apply it through the same process. Restoring a backup is a last resort and loses data written since the backup.

---

## Local qualification commands

These are what the repository can prove on its own.

```bash
npm run qualify:static        # clean install, lint, typecheck, static regressions
npm run qualify:database      # pinned local CLI, clean reset, pgTAP, auth/RLS qualifiers
npm run qualify:launch:production # Next.js production build using Turbopack, links, smoke
npm run release:verify        # complete sequence; always cleans up local processes
```

`npm run qualify:launch:production` is the local qualification command for a built candidate. Its `npm run test:public-routes` step starts a local Next.js server and is distinct from the post-deployment hosted command above.

`npm run qualify:auth-cache-local` additionally requires the application running on `localhost:3000` and is therefore run by hand rather than in CI.

Every database qualification refuses to run against a non-local Supabase URL. The orchestrator starts and stops the pinned local Supabase stack even when a step fails.
