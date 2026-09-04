# Authentication and profile security

This document describes the enforceable boundary introduced by the authentication foundation and extended through `202609040006_save_profile_if_revision.sql`. Application checks improve the user experience; Postgres grants, constraints, functions, and Row Level Security remain the final authority.

## Data-access model

- `public.profiles` is an account-owned base table. `anon` has no `SELECT` privilege. An `authenticated` request has `SELECT` privilege but RLS returns only the row whose `id` equals `auth.uid()`.
- Profile inserts are created only by the `auth.users` trigger. Anonymous and authenticated API roles cannot insert or delete profile rows.
- Authenticated clients cannot update `profiles` directly. Full profile edits use `save_profile_if_revision`, which derives the owner from `auth.uid()`, requires the exact loaded `updated_at`, and returns one row only when that revision still matches. The account page's display-name control uses `set_profile_display_name`; both writers share an owner lock and advance a monotonic revision, so a stale full form cannot erase the one-field change.
- Public lookup goes through `public.get_public_profile(text)`, a stable `SECURITY DEFINER` SQL function with an explicitly empty `search_path`, fully qualified relations, no dynamic SQL, and a fixed nine-column return shape.
- The RPC returns only completed, public profiles. It never returns profile UUIDs, visibility flags, onboarding state, or creation/update timestamps.

The public return shape is exactly: `username`, `display_name`, `bio`, `current_company`, `current_role`, `years_experience`, `linkedin_url`, `github_url`, and `avatar_url`.

## Function privileges

| Function | Execution model | `PUBLIC` | `anon` | `authenticated` | Purpose |
| --- | --- | --- | --- | --- | --- |
| `public.set_updated_at()` | Security invoker; empty `search_path` | Revoked | Revoked | Revoked | Trigger-only timestamp maintenance |
| `public.handle_new_user()` | Security definer; empty `search_path` | Revoked | Revoked | Revoked | Trigger-only profile creation |
| `public.get_public_profile(text)` | Stable security definer; empty `search_path` | Revoked | Granted | Granted | Minimal public profile lookup |
| `public.set_profile_updated_at()` | Security invoker; empty `search_path` | Revoked | Revoked | Revoked | Trigger-only monotonic profile revision |
| `public.save_profile_if_revision(timestamptz,...)` | Volatile security definer; empty `search_path`; actor-derived | Revoked | Revoked | Granted | Revision-checked coherent profile edit |
| `public.set_profile_display_name(text)` | Volatile security definer; empty `search_path`; actor-derived | Revoked | Revoked | Granted | Serialized one-field display-name edit |
| `public.complete_account_onboarding(text,text,text)` | Security definer; empty `search_path`; actor-derived | Revoked | Revoked | Granted | Atomic onboarding completion and minimal preference seed |
| `public.save_account_preparation_preferences(text,text,text)` | Security definer; empty `search_path`; actor-derived | Revoked | Revoked | Granted | Save the caller's preparation defaults |

Revoking direct execution from a trigger function does not disable its trigger. PostgreSQL invokes the trigger as part of the table operation; API clients do not need direct `EXECUTE` permission.

## Reserved usernames

The application rejects reserved names with the friendly message “That username is reserved. Choose another one.” The database constraint is the final enforcement layer.

The exact reserved set is:

`admin`, `administrator`, `root`, `support`, `help`, `staff`, `moderator`, `moderators`, `mod`, `official`, `system`, `security`, `auth`, `api`, `engineeringfoundry`, `engineering-foundry`, `engineering_foundry`, `owner`, `team`, `abuse`, `contact`, `legal`, `privacy`, `terms`, `account`, `settings`, `dashboard`, `signin`, `signup`, `login`, `logout`.

Usernames are normalized to lowercase in the application, constrained to lowercase in Postgres, and protected by a case-insensitive unique index. A reserved, uppercase, or duplicate value is rejected even if an application client is bypassed.

## SSR session boundary

The Next.js proxy calls `supabase.auth.getClaims()` so expired tokens can be verified/refreshed and resulting cookies are copied to both the request and response. Protected server pages and server actions continue to call `getUser()` when they need the current authoritative user record. RLS remains the data-authorization boundary.

Do not use `getSession()` as proof of identity in server authorization code. Do not cache responses that can refresh authentication cookies.

### Global account-navigation truth

The global header uses the request-time `/api/auth/account` route rather than trusting browser session contents as an identity projection. That route calls `getUser()` directly and treats only Supabase's explicit `AuthSessionMissingError` as a genuine anonymous state. Other Auth failures, contradictory results, profile-query errors, and malformed rows return a private, no-store, noindex `503` unavailable response. A verified user with a genuine missing profile row remains signed in with the minimal email-or-Member identity; the response does not include unused profile visibility or avatar fields.

The client strictly parses the status-correlated `disabled`, `anonymous`, `ready`, and `unavailable` response shapes. Network, non-OK, JSON, and malformed-body failures render compact retryable unavailable copy instead of Sign in and Sign up. Request epochs reject stale and unmounted settlements; `SIGNED_OUT` invalidates an in-flight request before rendering anonymous controls, while authenticated session events trigger an authoritative reload and cannot leave a formerly anonymous state in place after failure. A refresh failure preserves an already verified ready identity, and a successful retry restores focus only when the retry control owned it.

These protections are deliberately route-specific. The shared `getAuthenticatedActor()` helper still maps an authentication-service failure and a legitimate missing session to the same `null` result for other call sites; that broader contract remains separate follow-up work. Automated checks execute the pure identity/profile/response/settlement matrices and source-regress request, event, retry, and focus wiring. Rendered browser timing, focus, and assistive-technology behavior remain manual validation.

### Proxy cache safety

The Proxy uses `getClaims()` for session verification and refresh, copies refreshed cookies to the outgoing response, and propagates every cache-control or security header supplied by `@supabase/ssr`. Responses that refresh authentication must not be cached by a CDN or reverse proxy, because replaying a cached `Set-Cookie` response could attach one user's session to another request.

## Security test matrix

The pgTAP suite at `supabase/tests/database/auth_profile_hardening.test.sql` automates the database-capable rows below. UI behavior and hosted-project behavior remain explicit manual checks.

| Scenario | Expected result |
| --- | --- |
| Anonymous selects base `profiles` table | Permission denied; no base-table access |
| Anonymous calls public RPC for completed Public User B | Exactly the nine approved public fields are returned |
| Anonymous calls public RPC for Private User B | No row |
| Anonymous calls public RPC for incomplete User B | No row |
| Authenticated User A reads base profile A | Allowed |
| Authenticated User A reads base profile B | No row |
| Authenticated User A directly updates any profile | Permission denied |
| Authenticated User A saves profile A from its current revision | Exactly one RPC row with a newer revision |
| Two full profile saves use the same revision | Exactly one coherent snapshot wins |
| A one-field display-name save races a stale full profile save | Desired display name survives; rich fields remain one coherent snapshot |
| User B submits User A's revision | Zero rows; neither profile is exposed or changed |
| Authenticated User A directly inserts a profile | Permission denied |
| Authenticated User A deletes a profile | Permission denied |
| User submits a reserved username through the UI | Friendly reserved-name error |
| User submits a reserved username through the Data API | Postgres check violation; application does not expose the raw message |
| User submits a duplicate username with different capitalization | Rejected by lowercase/uniqueness constraints |
| API role directly executes either trigger function | Permission denied; normal trigger execution still succeeds |
| Public RPC response inspected for UUID | `id` is absent |
| Public RPC response inspected for timestamps | `created_at` and `updated_at` are absent |

Run the clean migration and database tests with:

```bash
supabase start
supabase db reset
supabase test db
```

`supabase db reset` destroys only the local Supabase database. Do not point local destructive commands at a production project.

Account export and deletion add trusted server boundaries above RLS. Neither accepts a target user identifier: export resolves the cookie actor and emits only explicitly selected safe fields, while deletion passes that actor's ID to a server-only Auth admin client. See [`account-lifecycle.md`](account-lifecycle.md) for the export schema, recovery redirect rules, credential-safe form fallback, and full deletion cascade.

## Fresh verification for destructive actions

Holding an unlocked session is not the same as proving current credentials. Phase 9 added `lib/auth/reauthentication.ts` for actions where that distinction matters.

Verification runs against an **isolated Supabase client** created with `persistSession: false`. That client keeps its session in memory and never touches cookie storage, so confirming a password cannot rewrite or invalidate the caller's active session. The throwaway session is signed out locally afterwards, and the verified identity is compared against the caller's user ID so valid credentials for a different account are rejected.

Account credential and deletion actions strictly parse their exact runtime fields before resolving the actor or calling Auth. Duplicate, file-valued, missing, unknown, and non-`FormData` inputs cannot be coerced into credentials or confirmations. Signup, password recovery, and signed-in password change share one policy predicate: 8–128 characters with at least one ASCII letter and one number. Client `minLength`/`maxLength` constraints and associated help expose that same policy, but the server parser remains authoritative.

Profile settings apply the same runtime discipline to all ten submitted fields. Missing, duplicate, file-valued, unknown, control-bearing, oversized, or non-`FormData` inputs fail before actor or profile reads. The parser requires the exact loaded revision and explicit visibility state; optional blanks are intentional `null`, not defaults for omitted fields. Changed invalid professional links fail, while an exact unchanged legacy-invalid stored link is omitted from the mutation so unrelated edits neither rewrite nor expose it. The client manually dispatches the edit form to preserve an uncontrolled draft on conflict, blocks duplicate submissions synchronously, announces pending/error/success atomically, and distinguishes an earlier saved snapshot when a field changes in flight. Rendered draft retention, focus, and assistive-technology behavior remain browser/manual validation.

| Action | Password-capable account | OAuth-only account |
| --- | --- | --- |
| Password change | Current password verified through the isolated client | Directed to password recovery |
| Permanent deletion | Current password **and** the typed `DELETE` confirmation | Typed `DELETE` confirmation only |

OAuth-only accounts deliberately keep confirmation rather than reauthentication. There is no password to verify, and a prompt that validates nothing would be security theater. The residual risk is explicit: an attacker with an unlocked, already-signed-in browser belonging to an OAuth-only user can delete that account. Deletion remains irreversible, the confirmation remains exact, and the product does not claim more assurance than it has.

Supabase Auth rate limits these verification attempts. Engineering Foundry deliberately adds no second limiter, because duplicating a provider control it does not own could lock users out of authentication.

Before Phase 9 the password-change action verified by calling `signInWithPassword` on the cookie-backed server client, which issued a new session as a side effect of a check. That is no longer the case.

## Response security headers

`lib/security/headers.ts` is the single definition, applied to every route by `next.config.ts` and covered by `npm run test:production-hardening`.

Enforced: `Content-Security-Policy`, `Strict-Transport-Security` (production only), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy: same-origin`, `X-Permitted-Cross-Domain-Policies: none`, and `Permissions-Policy`.

### Why the CSP allows inline scripts

The policy is an enforced baseline, not a strict CSP, and the reason is deliberate.

A nonce-based CSP in Next.js requires generating a per-request nonce in the proxy, which opts every page into dynamic rendering. Engineering Foundry statically generates the great majority of its pages, so that would convert a mostly-static curriculum site into a fully dynamic one. Next.js also injects its own inline bootstrap and streaming-payload scripts, which have no stable hash.

So `script-src` retains `'unsafe-inline'` and is not treated as the XSS boundary; React's escaping and the absence of `dangerouslySetInnerHTML` on user content are. `'unsafe-eval'` is permitted in development only, for hot module replacement.

The directives that do carry weight here are enforced strictly:

- `frame-ancestors 'none'` prevents clickjacking of the authenticated workspace.
- `base-uri 'self'` prevents base-tag injection.
- `form-action 'self'` prevents a form posting credentials to another origin.
- `object-src 'none'` and `frame-src 'none'` remove plugin and embed surface.
- `connect-src` is an allowlist of the configured Supabase project and, when configured, PostHog — this bounds where a script could exfiltrate private preparation data.
- `img-src` is restricted to first-party, `data:`, and `blob:`. Inline styles remain permitted because Mermaid injects a style block into rendered SVG.

Report-only was considered and rejected: with no error-monitoring vendor in this project there is nowhere to send violation reports, so a report-only policy would produce neither signal nor protection.

## Rate limiting

Supabase Auth owns brute-force protection for sign-in, sign-up, recovery, and credential verification. Engineering Foundry throttles only operations it makes expensive itself.

Account export is the one such operation today: five requests per fifteen minutes per account. The budget lives in `public.account_action_rate_limits`, keyed by `auth.uid()` through a `SECURITY DEFINER` RPC that takes no user parameter, so a client can neither spend another account's budget nor reset its own by clearing cookies. Concurrent requests serialize on a row lock. See [`account-lifecycle.md`](account-lifecycle.md).

## Real-project verification

Automated local tests do not replace checks against the actual hosted project. Before allowing real users, create two disposable confirmed accounts (User A and User B), complete both profiles, and perform these checks through the production-origin application using only the publishable/anon key:

1. As a logged-out visitor, open User A's completed public URL and confirm only the approved fields render.
2. Make User A private. Confirm the URL returns the not-found experience, emits no `public_profile_viewed` event, and no Profile/View profile link appears in User A's account UI.
3. Sign in as User A and confirm settings can still load and update User A's private base row.
4. With User A's access token, query `profiles` for User B's UUID and confirm zero rows; attempt an update and confirm zero affected rows.
5. With the anon key, query `profiles` directly and confirm permission is denied; call `get_public_profile` and confirm public profiles remain available.
6. Attempt `rpc('set_updated_at')` and `rpc('handle_new_user')` as anon and authenticated clients and confirm permission is denied.
7. Attempt reserved, uppercase, and duplicate usernames by direct API calls and confirm Postgres rejects them.
8. Complete sign-up, email confirmation, both OAuth providers, recovery, onboarding, session refresh, sign-out, and cross-browser cookie checks on the production origin.

Record the date, project reference, tester, and evidence for every check. None of these hosted-project checks are considered verified merely because the repository builds.
