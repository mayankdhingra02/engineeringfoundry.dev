# Authentication and profile security

This document describes the enforceable boundary introduced by the authentication foundation and the `202608130002_auth_profile_hardening.sql` migration. Application checks improve the user experience; Postgres grants, constraints, functions, and Row Level Security remain the final authority.

## Data-access model

- `public.profiles` is an account-owned base table. `anon` has no `SELECT` privilege. An `authenticated` request has `SELECT` privilege but RLS returns only the row whose `id` equals `auth.uid()`.
- Profile inserts are created only by the `auth.users` trigger. Anonymous and authenticated API roles cannot insert or delete profile rows.
- Authenticated users can update only their own row and only the explicitly granted profile columns. A profile update must return the updated row identifier; zero rows is treated as an integrity failure rather than a successful save or an insert opportunity.
- Public lookup goes through `public.get_public_profile(text)`, a stable `SECURITY DEFINER` SQL function with an explicitly empty `search_path`, fully qualified relations, no dynamic SQL, and a fixed nine-column return shape.
- The RPC returns only completed, public profiles. It never returns profile UUIDs, visibility flags, onboarding state, or creation/update timestamps.

The public return shape is exactly: `username`, `display_name`, `bio`, `current_company`, `current_role`, `years_experience`, `linkedin_url`, `github_url`, and `avatar_url`.

## Function privileges

| Function | Execution model | `PUBLIC` | `anon` | `authenticated` | Purpose |
| --- | --- | --- | --- | --- | --- |
| `public.set_updated_at()` | Security invoker; empty `search_path` | Revoked | Revoked | Revoked | Trigger-only timestamp maintenance |
| `public.handle_new_user()` | Security definer; empty `search_path` | Revoked | Revoked | Revoked | Trigger-only profile creation |
| `public.get_public_profile(text)` | Stable security definer; empty `search_path` | Revoked | Granted | Granted | Minimal public profile lookup |

Revoking direct execution from a trigger function does not disable its trigger. PostgreSQL invokes the trigger as part of the table operation; API clients do not need direct `EXECUTE` permission.

## Reserved usernames

The application rejects reserved names with the friendly message “That username is reserved. Choose another one.” The database constraint is the final enforcement layer.

The exact reserved set is:

`admin`, `administrator`, `root`, `support`, `help`, `staff`, `moderator`, `moderators`, `mod`, `official`, `system`, `security`, `auth`, `api`, `engineeringfoundry`, `engineering-foundry`, `engineering_foundry`, `owner`, `team`, `abuse`, `contact`, `legal`, `privacy`, `terms`, `account`, `settings`, `dashboard`, `signin`, `signup`, `login`, `logout`.

Usernames are normalized to lowercase in the application, constrained to lowercase in Postgres, and protected by a case-insensitive unique index. A reserved, uppercase, or duplicate value is rejected even if an application client is bypassed.

## SSR session boundary

The Next.js proxy calls `supabase.auth.getClaims()` so expired tokens can be verified/refreshed and resulting cookies are copied to both the request and response. Protected server pages and server actions continue to call `getUser()` when they need the current authoritative user record. RLS remains the data-authorization boundary.

Do not use `getSession()` as proof of identity in server authorization code. Do not cache responses that can refresh authentication cookies.

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
| Authenticated User A updates profile A | Exactly one row updated |
| Authenticated User A updates profile B | Zero rows updated |
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
