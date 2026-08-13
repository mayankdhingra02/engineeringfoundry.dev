# Authentication and profile qualification

## Qualification status

**NOT QUALIFIED** as of 2026-08-13.

The local authentication and database foundation passed the executable security checks described below. A dedicated hosted Supabase project was not connected, so hosted migrations, hosted authentication, provider OAuth, production deployment, and final edge cache-safety verification remain blocked. Local success is not treated as production qualification.

## Test metadata

| Item | Value |
| --- | --- |
| Date | 2026-08-13 |
| Approved baseline tested | `0173fce1b59f96735777642834a15ba307035689` |
| Source under test | `d1b0b5e4322101a19f6845fd7aa36db3003d1188` |
| Supabase CLI | `2.114.0` via `npx --yes supabase` |
| Docker | Available; client and server `29.4.0` |
| Local Supabase | Available on loopback with PostgreSQL 17 |
| Hosted Supabase | **BLOCKED — dashboard/CLI authentication and a dedicated project are required** |

No service-role key, Supabase secret key, OAuth client secret, SMTP secret, or committed environment file was found. `.env.local` remained ignored and contained only local public configuration during testing.

## Defects found and corrected

1. Migration 001 used the PostgreSQL 17 keyword `current_role` as an unquoted column identifier. The identifier and its dependent references are now quoted so migrations 001 and 002 apply from scratch.
2. Two pgTAP assertions used data-modifying statements inside invalid nested CTEs. They now test the same owner/cross-owner update behavior with valid pgTAP query forms; no security expectation was weakened.
3. Two `"use server"` modules exported state objects, which caused real onboarding and password-reset submissions to fail at runtime. Initial form state now lives in the client modules.
4. The username input pattern was invalid under modern browser Unicode `v`-mode parsing. The hyphen is escaped and malformed usernames now trigger native validation.
5. Successful password recovery removed its marker and then rerendered a protected page, causing an unintended redirect back to the recovery request page. The server action now redirects directly to the dashboard after a successful password update.
6. Starting local Supabase creates ignored runtime code under `supabase/.temp`; ESLint flat config now ignores that generated directory so the documented local workflow does not break lint.

All affected flows were rerun after their fixes.

## Automated local evidence

| Test | Environment | Result | Evidence / notes |
| --- | --- | --- | --- |
| Secret-pattern and tracked-file review | Repository | **PASS** | No committed service-role, secret, OAuth-client-secret, or SMTP-secret material found; `.env.local` is ignored |
| Fresh migrations | Local Supabase | **PASS** | `npx --yes supabase db reset`; applied `202608130001_create_profiles.sql`, then `202608130002_auth_profile_hardening.sql`, without manual SQL |
| Database lint | Local Supabase | **PASS** | `npx --yes supabase db lint --local --schema public --level warning --fail-on error`; no schema errors |
| pgTAP security suite | Local Supabase | **PASS** | `npx --yes supabase test db`; 36 passed, 0 failed, 0 skipped |
| Data API / RLS harness | Local Supabase | **PASS** | `node scripts/qualify-auth-local.mjs`; 27 passed, 0 failed |
| Profile trigger | Local Supabase | **PASS** | Exactly one owned profile for each of three auth users |
| Reserved usernames | Local Data API | **PASS** | `admin` and `engineeringfoundry` rejected with SQLSTATE `23514` |
| Duplicate username | Local Data API | **PASS** | Duplicate rejected with SQLSTATE `23505`; uppercase direct value rejected by lowercase constraint |
| User A owner access | Local Data API | **PASS** | Own base row read and updated |
| User A to User B isolation | Local Data API | **PASS** | Cross-user read returned 0 rows; cross-user update returned 0 rows |
| Arbitrary insert/delete | Local Data API | **PASS** | Authenticated insert and delete rejected with SQLSTATE `42501` |
| Anonymous base table | Local Data API | **PASS** | Direct `profiles` select rejected with SQLSTATE `42501` |
| Public profile RPC | Local Data API | **PASS** | Anonymous, User A, and User B received exactly the nine approved fields |
| Private profile RPC | Local Data API | **PASS** | Anonymous and User A received no row; User B retained owner read/edit access |
| Incomplete profile RPC | Local Data API | **PASS** | No row returned |
| Trigger-function privileges | Local Data API | **PASS** | Anonymous and authenticated direct calls to both trigger functions denied (`PGRST202`) |
| `updated_at` trigger | Local Data API | **PASS** | Timestamp advanced on an owner update |
| Expired-session refresh | Local optimized production server | **PASS** | Actual expired access token refreshed; `Set-Cookie` present |
| Refresh cache safety | Local optimized production server | **PASS** | Observed `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`, `Pragma: no-cache`, and `Expires: 0` |

The cache test used a 60-second local JWT lifetime and waited for actual expiry. Next.js development mode replaced the response cache policy with its development `no-cache, must-revalidate` header, so the authoritative local observation above was taken from the optimized production server.

The public RPC fields observed, in sorted order, were:

```text
avatar_url
bio
current_company
current_role
display_name
github_url
linkedin_url
username
years_experience
```

No UUID, email, timestamps, visibility flags, onboarding flag, or provider data was returned.

## Local browser qualification

| Test | Result | Evidence / notes |
| --- | --- | --- |
| Email signup submission | **PASS** | Local Supabase signup accepted a dedicated test account |
| Confirmation-required UI | **PASS** | Confirmation UI displayed and no pre-confirmation session was issued |
| Confirmation email | **PASS** | Local Mailpit received the message |
| Confirmation callback | **PASS** | Email link completed through `/auth/callback` and established a session |
| Profile creation and onboarding entry | **PASS** | One trigger-created row; new user reached onboarding |
| Valid onboarding | **PASS** | Required and optional fields saved; public visibility selected; redirected to dashboard |
| Username normalization | **PASS** | Mixed-case UI input stored as lowercase `qualification-a` |
| Malformed username UI | **PASS** | Native pattern validation prevented submission |
| Reserved username UI | **PASS** | `admin` produced a friendly application error; no raw PostgreSQL error was exposed |
| Invalid professional URLs | **PASS** | Invalid LinkedIn and GitHub URLs were rejected by native URL validation |
| Invalid experience | **PASS** | Value above 80 was rejected by native range validation |
| Public User A page | **PASS** | Voluntary profile fields and professional links shown; no email, UUID, or provider data; canonical was `https://engineeringfoundry.dev/u/qualification-a` |
| Private User B page | **PASS** | Public route returned the not-found state without profile data |
| Incomplete profile page | **PASS** | Public route returned the not-found state without profile data |
| Password recovery | **PASS** | Privacy-preserving request UI, Mailpit email, callback, reset form, password change, and dashboard redirect completed |
| Recovery cleanup | **PASS** | Recovery marker removed; direct reset navigation redirected to `/forgot-password` |
| Old/new password check | **PASS** | Old password rejected and new password accepted after reset |
| Session persistence | **PASS** | Session survived refresh and navigation across public, dashboard, and profile-settings routes |
| Logged-out protected routes | **PASS** | Dashboard, onboarding, and settings redirected to sign-in; reset-password redirected to forgot-password; no protected data appeared |
| Sign-out | **PASS** | Session cleared, account UI changed, and protected routes redirected |
| Cross-user session isolation | **PASS** | User B login after User A sign-out showed no User A account/profile state |
| PostHog identity reset event | **NOT TESTED / NOT OBSERVABLE** | Sign-out code path executed, but no PostHog project key was configured locally |
| Public profile analytics delivery | **NOT TESTED / NOT OBSERVABLE** | Page rendered, but no PostHog project key was configured locally |
| Close/reopen browser tab | **NOT TESTED** | Refresh and same-browser navigation were tested; tab restoration was not separately observed |

## Hosted and production matrix

| Test | Environment | Result | Evidence / notes |
| --- | --- | --- | --- |
| Dedicated project connection | Hosted Supabase | **BLOCKED — MANUAL ACTION REQUIRED** | CLI had no access token; dashboard sign-in reached GitHub authorization and was intentionally not approved without owner consent |
| Remote migration dry run | Hosted Supabase | **BLOCKED** | Requires a linked project |
| Hosted migration application/history | Hosted Supabase | **BLOCKED** | Requires successful dry run and linked project |
| Production Site URL and redirect set | Hosted Supabase | **BLOCKED** | Must verify exact production and local callback URLs in the selected project |
| Hosted email provider/confirmation | Hosted Supabase | **BLOCKED** | Project not connected |
| Hosted email signup and confirmation | Hosted Supabase | **BLOCKED** | Project not connected |
| Hosted onboarding | Hosted Supabase | **BLOCKED** | Project not connected |
| Hosted RLS, base-table denial, RPC, and private-profile checks | Hosted Supabase | **BLOCKED** | Project not connected; local results are not substituted |
| Google OAuth configuration and flows | Hosted / Google | **BLOCKED — provider credentials/configuration required** | No provider credentials were available |
| GitHub OAuth configuration and flows | Hosted / GitHub | **BLOCKED — provider credentials/configuration required** | No provider credentials were available |
| Production environment variables/deployment | Production host | **BLOCKED** | No production-host access or confirmed hosted Supabase public configuration |
| Production application reachability | Production edge | **NOT TESTED** | `https://engineeringfoundry.dev` did not return within the qualification request timeout |
| Hosted/edge cache-safety refresh | Production edge | **BLOCKED — mandatory** | Requires deployed hosted auth and an actual edge session refresh |

## Application validation

| Command | Result | Notes |
| --- | --- | --- |
| `npm ci` | **PASS** | 354 packages installed; local Node 23 produced a non-failing engine warning for a package that supports Node 22.13 used by CI |
| `npm run lint` | **PASS** | No errors after excluding generated Supabase `.temp` runtime code |
| `npm run typecheck` | **PASS** | `tsc --noEmit` completed successfully |
| `npm run build -- --webpack` | **PASS** | Optimized production build completed and generated all routes |
| `npm run build` | **BLOCKED IN CODEX SANDBOX** | Turbopack crashed while attempting to bind an internal port (`Operation not permitted`); not treated as an application pass |
| `npm audit --omit=dev` | **PASS** | 0 vulnerabilities |
| GitHub Actions CI | **NOT TESTED YET** | Must be observed after the qualification commits are pushed |

## Exact owner actions required

1. Approve the pending read-only GitHub email authorization for the Supabase dashboard (or sign in to Supabase another way), then create or select a dedicated Engineering Foundry project.
2. Authenticate the CLI locally without sharing the token in chat, link the repository to that project, run `npx supabase db push --dry-run`, verify only migrations 001 and 002, then run `npx supabase db push` and verify migration history.
3. Configure Supabase Auth with Site URL `https://engineeringfoundry.dev` and exact redirects `https://engineeringfoundry.dev/auth/callback` and `http://localhost:3000/auth/callback`; keep email confirmation enabled.
4. Put only the hosted project URL and public/publishable key in local and production environment configuration. Do not add a service-role key.
5. Configure Google and GitHub provider applications with the provider callback URLs shown by Supabase; keep client secrets outside the repository.
6. Deploy the application, then rerun hosted email, onboarding, two-user RLS, anonymous denial, RPC boundary, private/incomplete profile, recovery, protected-route, sign-out, and provider-flow checks.
7. Trigger a real hosted session refresh and inspect the final production edge response for refreshed cookies and a non-public cache policy.

The production gate remains closed until every mandatory hosted security check, especially hosted cache-safety verification, actually passes.
