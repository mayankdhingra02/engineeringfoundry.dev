# Account lifecycle

Phase 8 completes the signed-in lifecycle around onboarding, preferences, account security, export, and deletion. The implementation extends the existing profile, preparation-preference, reminder, and Supabase Auth boundaries; it does not create a second profile system.

## Onboarding lifecycle

`/onboarding` is a request-time authenticated route. A new profile begins with `onboarding_complete = false` and `onboarding_completed_at = null`. The route redirects an already-completed account to its safe requested destination, so returning users do not see onboarding again.

The single compact form asks for a preparation role, whether an interview is scheduled, a primary focus, and the existing Phase 7 IANA timezone. `Skip for now` records completion without inventing a role, focus, roadmap, application, or reminder schedule. Completion calls `complete_account_onboarding`, an actor-derived database function that validates the shared enums, reuses `interview_reminder_preferences.preferred_timezone`, and sets the boolean/timestamp pair atomically.

Migration `202608150001_create_account_lifecycle.sql` marks every pre-Phase-8 profile complete with a timestamp. It deliberately does not infer preferences from applications or preparation history. The database constraint requires the completion boolean and timestamp to agree.

The destination order is deterministic:

1. An existing upcoming interview goes to `/dashboard`.
2. “Interview scheduled” without a tracked interview goes to `/applications/new`.
3. A non-dashboard safe return path is honored.
4. Focus routes to DSA roadmap, System Design practice, Behavioral workspace, or new application.
5. Missing or unsure focus goes to `/dashboard`.

The dashboard shows one preference-aware starting path until any meaningful application, DSA, Behavioral, or System Design work exists. It then returns to the pipeline view; there is no permanent checklist.

## Settings and preference precedence

The compact `/settings` index links to:

- `/settings/account` for display name, provider-managed email change, password change, and global sign-out;
- `/settings/preparation` for preferred role, primary focus, and the existing preferred DSA roadmap;
- `/settings/interviews` for the existing Phase 7 timezone and reminder settings;
- `/settings/privacy` for private export and permanent deletion.

Preference precedence is application context, then explicit page selection, then account default. An application-specific company/role always wins inside that preparation flow. A manual roadmap or filter selection remains authoritative. Account preferences only choose defaults outside those contexts and never hide content.

`save_account_preparation_preferences` derives ownership from `auth.uid()`. Role values are `sde1`, `sde2`, `senior`, `staff`, and `unsure`; focus values are `dsa`, `system_design`, `behavioral`, `applications`, and `unsure`. The DSA roadmap retains its established `sde1`, `sde2`, and `sde3plus` taxonomy.

## Authentication lifecycle

Display-name updates write only the authenticated profile's allowed field. Email changes call Supabase Auth `updateUser({ email })`; Auth remains authoritative and production verification behavior depends on the hosted Auth email-change configuration. Password changes verify the current password with the provider before calling `updateUser({ password })`.

Signed-out recovery uses Supabase's password-reset email and a fixed application callback. The request response is neutral for known and unknown addresses. Callback and return paths pass through the shared internal-path validator; external, protocol-relative, and malformed destinations fall back to `/dashboard`. The reset page requires a valid provider recovery session. Auth forms declare `method="post"`, so a pre-hydration native submission cannot place credentials in a query string.

“Sign out everywhere” uses Supabase Auth's real global scope. The product does not fabricate a device list or claim session detail the provider does not expose.

## Export contract

`GET /api/account/export` has no account selector. It resolves the cookie-authenticated actor, queries only that actor's RLS-visible rows, and returns a date-stamped `engineering-foundry-export-YYYY-MM-DD.json` directly with `Content-Disposition: attachment`, `Cache-Control: private, no-store`, `Pragma: no-cache`, and `X-Robots-Tag: noindex, nofollow`.

Export version `1.0` contains stable top-level keys: `export_version`, `generated_at`, `account`, `applications`, `interview_rounds`, `interview_preparation`, `behavioral`, `dsa`, `system_design`, and `calendar`. It includes private notes and structured attempts because they belong to the user. It omits passwords, hashes, sessions, tokens, provider delivery identifiers/errors, service credentials, reminder claims, and global curriculum/question catalogs.

Every list section uses stable ordering and 500-row PostgREST ranges. Pagination continues past the project API's 1,000-row response cap; encountering 100 full pages in one section fails the export instead of risking a silently truncated file. Behavioral answers include their opening framing and emphasize/avoid preparation fields as well as the finished answer and notes.

Export contents are not logged, persisted to a public URL, or sent to analytics. Version `1.0` is machine-readable but is not a promise of indefinite compatibility.

### Export rate limiting

Phase 8 discouraged rapid regeneration with a short-lived cookie. That was not abuse protection: the client owned the cookie, so deleting it removed the limit, and each export runs twenty queries with pagination.

Phase 9 replaced it with server-authoritative throttling in `202608150002_create_account_action_rate_limits.sql`. The policy is five exports per fifteen minutes per account — modest, and intended to stop hammering rather than to meter usage.

`public.account_action_rate_limits` is owner-scoped with RLS. Authenticated clients hold `SELECT` only, so they can see their own budget but cannot insert, update, or delete it; the sole writer is `consume_account_action_rate_limit`, a `SECURITY DEFINER` function with an empty `search_path` that derives ownership from `auth.uid()` and accepts no user parameter. Concurrent requests serialize on a row lock, so parallel exports cannot both read a stale count. Being throttled does not extend the window or inflate the counter. The limiter fails closed: if it errors, the export is denied rather than allowed unbounded.

A throttled request returns `429` with `Retry-After`. The row cascades with `auth.users`, so throttle state disappears when the account is deleted.

## Permanent deletion

Deletion requires a current authenticated session, the exact text `DELETE`, and — for accounts that have a password — fresh verification of that password. The Server Action accepts no user ID. A server-only Supabase admin client deletes `actor.user.id`; the service credential is never exposed to a Client Component or browser bundle. If the Auth admin call fails, the action reports that nothing changed.

Password verification uses the isolated, cookie-free client described in [`auth-security.md`](auth-security.md), so confirming the credential does not disturb the session being used to delete. OAuth-only accounts have no password and keep the typed confirmation alone; the residual unlocked-session risk is documented there rather than covered by a prompt that verifies nothing. The settings page renders the password field only for password-capable accounts, and the Server Action re-derives that decision itself rather than trusting the rendered form.

When `SUPABASE_SERVICE_ROLE_KEY` is absent, deletion is impossible, so the danger zone renders an explicit unavailable state instead of a control that would fail after the user commits to it. See `lib/config/capabilities.ts`.

Deleting the Auth user is the atomic root operation. Foreign keys from all owner-scoped tables use `ON DELETE CASCADE`, so the same database transaction removes the profile, applications, rounds, interview preparation/tasks, Behavioral private records, saved questions, preparation preferences, DSA progress/notes, System Design progress/attempts, reminder preferences, pending or historical reminder rows, and calendar-export audit rows. There is no application-first half-deletion window. Application-linked attempts that normally detach when an application alone is deleted are still removed when their owning Auth user is deleted.

After success, Supabase, recovery, and export cookies are removed and the user is redirected to a signed-out confirmation. Stale sessions fail private guards/RLS, exports return unauthorized, and no reminder row remains for the worker to claim. Legacy signed-out browser-local System Design continuation is public local state, not authenticated account data, and follows the separate local/account authority rules in `authenticated-workspace.md`.

## Security and failure semantics

- Profile/preference RPC ownership comes only from `auth.uid()`; forms and URLs cannot select another user.
- Export has no ID/query parameter and depends on the authenticated actor plus RLS.
- Deletion uses only the authenticated actor ID and a server-only privileged client.
- Server Actions reauthenticate. Expired mutations return a readable sign-in-required result instead of raw Supabase errors.
- Next.js same-site cookies and Server Action origin checks provide the existing CSRF boundary; exact confirmation reduces accidental deletion but is not authorization.
- Recovery and auth callback destinations are allowlisted internal paths, and recovery requests use non-enumerating copy.

## Qualification

Run the static regression with `npm run test:account-lifecycle`. Run the local disposable two-user export/deletion qualification with `npm run qualify:account-lifecycle-local`. The database assertions live in `supabase/tests/database/account_lifecycle.test.sql` and explicitly cover onboarding ownership, enum validation, established completion semantics, and cascades across every private Phase 1–7 table, including reminder jobs.

Local qualification is not hosted qualification. Before enabling accounts in production, apply the migration through the normal migration tool, configure the server-only service role, validate email-change/recovery templates and redirects, repeat two-user export/deletion checks, and archive evidence without retaining private export files.
