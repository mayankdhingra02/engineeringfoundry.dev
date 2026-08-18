# Supabase authentication setup

Engineering Foundry uses Supabase Auth, cookie-backed SSR sessions, and Postgres Row Level Security. The application builds and public pages remain available without credentials. Account features stay inactive unless a project is configured **and** the separate account feature flag is explicitly enabled.

## 1. Create the project

Create a Supabase project for Engineering Foundry. In the project's **Connect** panel, copy the project URL and anon/publishable key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
NEXT_PUBLIC_ACCOUNTS_ENABLED=false
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
NEXT_PUBLIC_GITHUB_AUTH_ENABLED=false
```

Keep `NEXT_PUBLIC_ACCOUNTS_ENABLED=false` throughout public content-first launch preparation. Set it to `true` only in an environment where the hosted qualification gate below has been completed; Supabase variables alone never enable accounts.

Never place the service-role or secret key in a `NEXT_PUBLIC_` variable, browser code, GitHub Actions, or this repository.

Only Phase 7's optional reminder worker and Phase 8's permanent account-deletion path are designed to use `SUPABASE_SERVICE_ROLE_KEY`, and only in a protected server runtime. No email adapter or production scheduler is configured; see [`interview-calendar-reminders.md`](interview-calendar-reminders.md) before enabling email preferences.

## 2. Apply migrations

The migration chain also includes round preparation, the Phase 7 interview calendar/reminder schedule, and Phase 8 account-lifecycle state, with owner-only reads, actor-derived writes, lifecycle triggers, and narrowly scoped trusted-server operations.

Install and authenticate the Supabase CLI, link the local repository to the project, then apply committed migrations:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Migrations live in `supabase/migrations/`. The profile migrations create account profiles, triggers, grants, and RLS policies. Later migrations add the private Application tracker, normalized Behavioral workspace, saved questions, account preferences, and DSA/System Design progress with owner-only RLS and relationship constraints. The canonical DSA catalog and per-user practice records are introduced by `202608140007_create_dsa_question_progress.sql`; [`dsa-progress.md`](dsa-progress.md) documents its identity, write-path, timestamp, and completion contracts. Review the generated diff before applying migrations to an existing database. See [`authenticated-workspace.md`](authenticated-workspace.md) for the authoritative identity, ownership, caching, and local-progress contract; [`application-tracker.md`](application-tracker.md) and [`behavioral-workspace.md`](behavioral-workspace.md) document their domain models.

For a local Supabase stack, run `supabase start` and `supabase db reset` to validate a clean application of every migration. `db reset` is destructive to the local development database only.

After a clean reset, run `supabase db lint --local --schema public --level warning --fail-on error`, `supabase test db`, and `npm run qualify:persistence-local`. The final command refuses non-local Supabase URLs and validates representative private entities with two Mailpit-confirmed users through the publishable Data API; it does not use a service-role key. Then run `npm run qualify:account-lifecycle-local` for the disposable two-user export and deletion matrix; that separate qualification requires the local trusted-server credential used by permanent deletion.

## 3. Configure Auth URLs

In **Authentication → URL Configuration**, set:

- Site URL: `https://engineeringfoundry.dev`
- Production redirect: `https://engineeringfoundry.dev/auth/callback`
- Local redirect: `http://localhost:3000/auth/callback`

The same callback exchanges OAuth, email-confirmation, and recovery PKCE codes. Password recovery supplies `/reset-password` as the safe post-exchange destination. The canonical account routes are `/signin` and `/signup`; the older hyphenated URLs redirect to them and should not be used in new links.

For preview deployments, add only the exact trusted callback origins you intend to use. Do not use broad wildcard redirects in production.

## 4. Email and password

Enable the Email provider. When **Confirm email** is enabled, sign-up returns no session and the application tells the user to confirm their address. Ensure the confirmation email template uses Supabase's confirmation URL and that the callback URLs above are allowed.

Configure production SMTP before launch; Supabase's default email service is intended for limited testing and has rate limits.

## 5. Google OAuth

1. Create OAuth web credentials in Google Cloud.
2. Add the Supabase provider callback shown in **Authentication → Providers → Google** to Google's authorized redirect URIs.
3. Copy the Google client ID and secret into the Supabase provider settings.
4. Enable Google in Supabase.
5. Keep the Engineering Foundry `/auth/callback` URLs in Supabase's redirect allowlist.
6. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` only in application environments where the provider is configured and verified. Email/password authentication remains available independently.

Provider secrets belong in the Supabase dashboard, never in this application repository.

## 6. GitHub OAuth

1. Create a GitHub OAuth App.
2. Use the Supabase provider callback shown in **Authentication → Providers → GitHub** as the GitHub authorization callback URL.
3. Copy the GitHub client ID and secret into Supabase.
4. Enable GitHub in Supabase.
5. Set `NEXT_PUBLIC_GITHUB_AUTH_ENABLED=true` only in application environments where the provider is configured and verified.

The app requests authentication only; it does not store or use provider access tokens.

## 7. Production setup gate

This gate is intentionally **unverified** in the repository. A passing build or local database test does not prove that the hosted project, provider consoles, DNS, SMTP, or deployment environment is configured correctly. Do not allow real users until an operator checks all 17 items and records evidence.

1. **Migrations applied:** apply every committed migration to the intended project; record the project reference and migration versions, and confirm the grants, RLS policies, constraints, and function definitions match `docs/auth-security.md` and `docs/authenticated-workspace.md`.
2. **Email signup:** create a disposable account from the production origin using production SMTP and confirm no premature authenticated session is created when confirmation is required.
3. **Confirmation:** use the delivered confirmation link once, verify its callback/expiry behavior, and confirm a profile row is created by the trigger.
4. **Sign in:** sign in with the confirmed account, verify the SSR cookie session and protected-page access, and confirm invalid credentials fail safely.
5. **Onboarding:** complete and skip onboarding in separate disposable accounts; verify exactly one owned profile row changes, completion state is consistent, saved choices route correctly, and skip invents no preferences.
6. **Profile update:** update every supported profile field, refresh in a second request, and confirm the persisted owner row and `updated_at` behavior. Confirm reserved and invalid usernames receive friendly errors.
7. **Private/public switch:** test both transitions; confirm the RPC, `/u/[username]`, account menu, settings CTA, metadata, and analytics all follow the resulting visibility.
8. **Password recovery:** complete request, callback, password update, expired/reused-link, and new-password sign-in flows from the production origin.
9. **Google OAuth:** configure the exact provider callback, complete a Google sign-in, and verify the Engineering Foundry callback, onboarding decision, and session persistence.
10. **GitHub OAuth:** configure the exact provider callback, complete a GitHub sign-in, and verify the Engineering Foundry callback, onboarding decision, and session persistence.
11. **User A/User B RLS isolation:** prove User A can read/create/update/delete only A's private rows, cannot read or mutate B's profile, applications, rounds, Behavioral records, saved questions, preferences, or progress, and cannot connect a child record to B's parent. Confirm normal API roles cannot insert or delete profiles.
12. **Public-profile RPC field inspection:** as both `anon` and `authenticated`, confirm only the nine approved fields are returned and private/incomplete profiles return no row; prove anon base-table select is denied.
13. **Reserved username rejection:** attempt every reserved class through the UI and direct Data API; also test uppercase and case-insensitive duplicate values, and confirm raw database errors never reach the UI.
14. **Trigger-function execution denial:** confirm `PUBLIC`, `anon`, and `authenticated` lack direct execution while profile creation and `updated_at` triggers still work normally.
15. **Sign out/session reset:** verify hosted session-refresh responses preserve the cache-safety headers supplied by `@supabase/ssr` and cannot become cacheable; then exercise ordinary and global sign-out, verify cookies and analytics identity reset, confirm protected routes redirect, and repeat in a second browser to prove global revocation. This hosted response-header check remains unverified until it is performed against the configured real project.
16. **Account export:** export disposable User A through the production origin; verify the private no-store headers, attachment filename, stable schema, complete pagination, and absence of User B data, credentials, tokens, provider delivery details, and public catalogs.
17. **Permanent deletion:** with the trusted server credential configured, delete a disposable account containing representative private data. Verify its Auth identity and every owner-scoped row are gone, stale sessions and exports are denied, reminder work is unclaimable, and User B remains unchanged.

Before sign-off, also verify exact Auth callback URLs, remove broad production wildcards, keep all service-role/SMTP/OAuth secrets out of browser bundles and logs, archive the test evidence with date/tester/environment, and review relevant Supabase Auth and Postgres logs.

## 8. FORCE ROW LEVEL SECURITY — intentionally not enabled

`FORCE ROW LEVEL SECURITY` was evaluated in Phase 9 and deliberately rejected. It is recorded here so the decision is not silently revisited.

RLS already applies to every request that reaches this database from the internet. PostgREST connects as `authenticator` and switches to `anon` or `authenticated`; neither owns any table, so neither can bypass RLS. `FORCE RLS` changes behavior only for the **table owner**, which is `postgres`.

The one thing that runs as `postgres` here is the `SECURITY DEFINER` RPC layer — and that layer is how nearly every private write happens. Enabling `FORCE RLS` would subject those functions to the policies, which would break them:

- `interview_preparations` and `interview_preparation_custom_tasks` have `FOR ALL TO authenticated` policies. A definer function runs as `postgres`, not `authenticated`, so no policy would apply and every write would be denied.
- `interview_reminders`, `interview_reminder_preferences`, `interview_calendar_exports`, and `account_action_rate_limits` have **select-only** policies by design; all writes go through definer functions and triggers. Those would all fail.

Restoring them would mean adding owner-targeted permissive policies to roughly ten tables — policies that would have to permit exactly the operations the RPCs already perform, reopening the same hole while adding a second place to get authorization wrong.

The protection `FORCE RLS` would theoretically add is a backstop against a definer function that forgets its `auth.uid()` check. That is covered instead by narrow grants, actor-derived RPCs that raise `42501` when `auth.uid()` is null, and the pgTAP suite, which asserts the unauthenticated path for each function.

If a future table takes writes **only** from ordinary `authenticated` clients with no definer path, `FORCE RLS` on that specific table is reasonable. It is not appropriate as a blanket setting under this architecture.

The checked-in TypeScript database interface is maintained in `lib/supabase/database.types.ts`. After future schema changes, it can be regenerated with the Supabase CLI and reviewed before replacing that file.

Phase 9 adds `202608150002_create_account_action_rate_limits.sql`, the owner-scoped throttle state and its actor-derived RPC described in [`account-lifecycle.md`](account-lifecycle.md). The operational release procedure lives in [`production-launch-checklist.md`](production-launch-checklist.md); apply migrations to a hosted project with `supabase db push` after inspecting `supabase db diff --linked`, and never with a reset.

Phase 8 requires the server-only `SUPABASE_SERVICE_ROLE_KEY` for permanent account deletion. It must be present only in the trusted Next.js server environment and must never use a `NEXT_PUBLIC_` prefix. The migration adds explicit onboarding completion state plus minimal preparation preferences; export itself needs no storage or public bucket. Apply and qualify the lifecycle described in [`account-lifecycle.md`](account-lifecycle.md) before enabling hosted accounts.
