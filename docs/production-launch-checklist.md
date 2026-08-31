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
4. [ ] `supabase migration list --linked` — confirm all 25 migrations are recorded, ending at `202608230002_add_feedback_export_rpc`
5. [ ] Spot-check that grants, RLS policies, and function definitions match `docs/auth-security.md`, `docs/authenticated-workspace.md`, and `docs/unified-preparation-progress.md`, including `preparation_track_progress` and owner-scoped active-plan preferences
6. [ ] Confirm every owner-scoped table reports `rowsecurity = true`:
   ```sql
   select relname, relrowsecurity from pg_class
   where relnamespace = 'public'::regnamespace and relkind = 'r'
   order by relname;
   ```
7. [ ] Confirm the canonical catalogs seeded: 162 DSA questions, 146 System Design concepts, 27 design problems, 48 curated Behavioral questions

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
- [ ] Fabricated DSA and System Design canonical IDs are refused

### Anonymous browser-progress import boundary

- [ ] While signed out, record only canonical public preparation activity in the browser; no notes, answers, stories, or analytics payloads are present in browser progress
- [ ] After sign-in, choose the explicit import action and confirm it imports only valid missing activity for User A
- [ ] Confirm existing User A records are left unchanged, browser activity is cleared only when imported, and local saved plans are not imported automatically
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
