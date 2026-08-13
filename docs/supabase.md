# Supabase authentication setup

Engineering Foundry uses Supabase Auth, cookie-backed SSR sessions, and Postgres Row Level Security. The application builds and public pages remain available without credentials, but account features stay inactive until a project is configured.

## 1. Create the project

Create a Supabase project for Engineering Foundry. In the project's **Connect** panel, copy the project URL and anon/publishable key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

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

## 7. Production checklist

- Apply every migration and confirm `public.profiles` has RLS enabled.
- Confirm anonymous users can read only public, completed profiles.
- Confirm User A cannot update User B's row.
- Confirm inserts and deletes are unavailable to anonymous/authenticated API clients.
- Confirm profile creation works through the `auth.users` trigger.
- Verify the production Site URL and exact callback allowlist.
- Configure email confirmation, production SMTP, Google, and GitHub as intended.
- Set only the public URL and anon/publishable key in the application environment.
- Verify no service-role or secret key is exposed to the browser.
- Exercise sign-up, confirmation, OAuth, recovery, onboarding, visibility, and sign-out on the production origin.

The checked-in TypeScript database interface is maintained in `lib/supabase/database.types.ts`. After future schema changes, it can be regenerated with the Supabase CLI and reviewed before replacing that file.
