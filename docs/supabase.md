# Supabase authentication setup

Engineering Foundry uses Supabase Auth, cookie-backed SSR sessions, and Postgres Row Level Security. The application builds and public pages remain available without credentials. Account features stay inactive unless a project is configured **and** the separate account feature flag is explicitly enabled.

## 1. Create the project

Create a Supabase project for Engineering Foundry. In the project's **Connect** panel, copy the project URL and anon/publishable key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
NEXT_PUBLIC_ACCOUNTS_ENABLED=false
```

Keep `NEXT_PUBLIC_ACCOUNTS_ENABLED=false` throughout public content-first launch preparation. Set it to `true` only in an environment where the hosted qualification gate below has been completed; Supabase variables alone never enable accounts.

Never place the service-role or secret key in a `NEXT_PUBLIC_` variable, browser code, GitHub Actions, or this repository.

## 2. Apply migrations

Install and authenticate the Supabase CLI, link the local repository to the project, then apply committed migrations:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Migrations live in `supabase/migrations/`. The profiles migration creates the table, validation constraints, automatic auth-user profile trigger, `updated_at` trigger, grants, and RLS policies. Review the generated diff before applying it to an existing database.

For a local Supabase stack, run `supabase start` and `supabase db reset` to validate a clean application of every migration. `db reset` is destructive to the local development database only.

## 3. Configure Auth URLs

In **Authentication → URL Configuration**, set:

- Site URL: `https://engineeringfoundry.dev`
- Production redirect: `https://engineeringfoundry.dev/auth/callback`
- Local redirect: `http://localhost:3000/auth/callback`

The same callback exchanges OAuth, email-confirmation, and recovery PKCE codes. Password recovery supplies `/reset-password` as the safe post-exchange destination.

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

Provider secrets belong in the Supabase dashboard, never in this application repository.

## 6. GitHub OAuth

1. Create a GitHub OAuth App.
2. Use the Supabase provider callback shown in **Authentication → Providers → GitHub** as the GitHub authorization callback URL.
3. Copy the GitHub client ID and secret into Supabase.
4. Enable GitHub in Supabase.

The app requests authentication only; it does not store or use provider access tokens.

## 7. Production setup gate

This gate is intentionally **unverified** in the repository. A passing build or local database test does not prove that the hosted project, provider consoles, DNS, SMTP, or deployment environment is configured correctly. Do not allow real users until an operator checks all 15 items and records evidence.

1. **Migrations applied:** apply every committed migration to the intended project; record the project reference and migration versions, and confirm the grants, RLS policies, and function definitions match `docs/auth-security.md`.
2. **Email signup:** create a disposable account from the production origin using production SMTP and confirm no premature authenticated session is created when confirmation is required.
3. **Confirmation:** use the delivered confirmation link once, verify its callback/expiry behavior, and confirm a profile row is created by the trigger.
4. **Sign in:** sign in with the confirmed account, verify the SSR cookie session and protected-page access, and confirm invalid credentials fail safely.
5. **Onboarding:** complete onboarding, verify exactly one owned profile row changes, and confirm reserved/invalid names receive friendly errors.
6. **Profile update:** update every supported profile field, refresh in a second request, and confirm the persisted owner row and `updated_at` behavior.
7. **Private/public switch:** test both transitions; confirm the RPC, `/u/[username]`, account menu, settings CTA, metadata, and analytics all follow the resulting visibility.
8. **Password recovery:** complete request, callback, password update, expired/reused-link, and new-password sign-in flows from the production origin.
9. **Google OAuth:** configure the exact provider callback, complete a Google sign-in, and verify the Engineering Foundry callback, onboarding decision, and session persistence.
10. **GitHub OAuth:** configure the exact provider callback, complete a GitHub sign-in, and verify the Engineering Foundry callback, onboarding decision, and session persistence.
11. **User A/User B RLS isolation:** prove User A can read/update only A's base row, cannot read/update B's row, and normal API roles cannot insert or delete profiles.
12. **Public-profile RPC field inspection:** as both `anon` and `authenticated`, confirm only the nine approved fields are returned and private/incomplete profiles return no row; prove anon base-table select is denied.
13. **Reserved username rejection:** attempt every reserved class through the UI and direct Data API; also test uppercase and case-insensitive duplicate values, and confirm raw database errors never reach the UI.
14. **Trigger-function execution denial:** confirm `PUBLIC`, `anon`, and `authenticated` lack direct execution while profile creation and `updated_at` triggers still work normally.
15. **Sign out/session reset:** verify hosted session-refresh responses preserve the cache-safety headers supplied by `@supabase/ssr` and cannot become cacheable; then sign out, verify cookies and analytics identity reset, confirm protected routes redirect, and repeat in a second browser to rule out response/session leakage. This hosted response-header check remains unverified until it is performed against the configured real project.

Before sign-off, also verify exact Auth callback URLs, remove broad production wildcards, keep all service-role/SMTP/OAuth secrets out of browser bundles and logs, archive the test evidence with date/tester/environment, and review relevant Supabase Auth and Postgres logs.

The checked-in TypeScript database interface is maintained in `lib/supabase/database.types.ts`. After future schema changes, it can be regenerated with the Supabase CLI and reviewed before replacing that file.
