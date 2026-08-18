import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  validateSignInCredentials,
  validateSignUpCredentials,
} from "../lib/auth/credentials.ts";
import { safeInternalPath } from "../lib/auth/redirects.ts";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

for (const route of ["app/signin/page.tsx", "app/signup/page.tsx", "app/forgot-password/page.tsx", "app/reset-password/page.tsx", "app/dashboard/page.tsx"]) {
  if (!existsSync(route)) failures.push(`Missing authentication route: ${route}`);
}

for (const [legacyRoute, canonicalRoute] of [["app/sign-in/page.tsx", '"/signin"'], ["app/sign-up/page.tsx", '"/signup"']]) {
  if (!existsSync(legacyRoute)) failures.push(`Missing legacy authentication redirect: ${legacyRoute}`);
  else requireText(read(legacyRoute), canonicalRoute, `${legacyRoute} does not redirect to ${canonicalRoute}.`);
}

try {
  assert.deepEqual(validateSignInCredentials({ email: "invalid", password: "" }), {
    email: "Enter a valid email address.",
    password: "Enter your password.",
  });
  assert.deepEqual(validateSignUpCredentials({ fullName: "A", email: "engineer@example.com", password: "password", confirmation: "different" }), {
    full_name: "Enter your name using 2–80 characters.",
    password: "Use at least 8 characters with at least one letter and one number.",
    confirm_password: "Passwords do not match.",
  });
  assert.deepEqual(validateSignUpCredentials({ fullName: "Ada Lovelace", email: "ada@example.com", password: "Foundry123", confirmation: "Foundry123" }), {});
  assert.equal(safeInternalPath("https://attacker.example/steal"), "/dashboard");
  assert.equal(safeInternalPath("//attacker.example/steal"), "/dashboard");
  assert.equal(safeInternalPath("/applications?status=active"), "/applications?status=active");
} catch (error) {
  failures.push(`Credential or redirect validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

const authForm = read("features/auth/auth-form.tsx");
for (const marker of ["signInWithPassword", "signUp", 'name="full_name"', "full_name: fullName", 'name="confirm_password"', "validateSignUpCredentials", "PasswordInput"]) requireText(authForm, marker, `Authentication form lacks ${marker}.`);
for (const marker of ['autoComplete="name"', 'autoComplete="email"', 'role="alert"', "aria-describedby", "aria-invalid", "disabled={Boolean(pending)}", "fieldErrors", "PASSWORD_REQUIREMENT", "noValidate"]) requireText(authForm, marker, `Authentication form accessibility/loading/validation state lacks ${marker}.`);
for (const route of ["app/signin/page.tsx", "app/signup/page.tsx"]) requireText(read(route), "AuthPage", `${route} does not render the shared authentication page.`);

const passwordForms = read("features/auth/password-forms.tsx");
for (const marker of ["resetPasswordForEmail", "PasswordInput", "If an account exists", 'role="alert"', "aria-describedby", "aria-invalid"]) requireText(passwordForms, marker, `Password recovery lacks ${marker}.`);
const passwordActions = read("features/auth/password-actions.ts");
for (const marker of ["ef-password-recovery", "getUser", "updateUser", "cookieStore.delete"]) requireText(passwordActions, marker, `Password update action lacks ${marker}.`);

const guards = read("lib/auth/guards.ts");
for (const marker of ["requireAuthenticatedUser", "requireMemberProfile", "/signin?next=", "/onboarding?next=", "return { user, profile }"]) requireText(guards, marker, `Reusable route guards lack ${marker}.`);
requireText(read("app/dashboard/page.tsx"), 'requireMemberProfile("/dashboard")', "Dashboard does not use the reusable member guard.");

const actor = read("lib/auth/actor.ts");
for (const marker of ["getAuthenticatedActor", "auth.getUser", "createSupabaseServerClient", "user: data.user"]) requireText(actor, marker, `Canonical authenticated actor lacks ${marker}.`);
prohibit(actor, /(?:userId|user_id)\s*:/, "Canonical actor accepts a client-supplied user identifier.");

const dashboard = read("app/dashboard/page.tsx");
for (const marker of ["Your interview pipeline", "Upcoming interviews", "Applications needing attention", "getDashboardPipeline", "Add application"]) requireText(dashboard, marker, `Dashboard foundation lacks ${marker}.`);
prohibit(dashboard, /PageHero|Mock interviews|Referral requests/, "Dashboard retained the marketing/legacy placeholder shell.");

const accountControl = read("components/account-control.tsx");
for (const marker of ["account === undefined", "account-control-loading", 'fetch("/api/auth/account"', 'cache: "no-store"', "onAuthStateChange", "signOutAction", 'scope: "local"', "setAccount(null)", "resetAnalyticsUser", 'href="/signin"', 'href="/signup"', 'href="/dashboard"', 'href="/settings"', "signOutError"]) requireText(accountControl, marker, `Account navigation lacks ${marker}.`);
const accountRoute = read("app/api/auth/account/route.ts");
for (const marker of ["getAuthenticatedActor", '"Cache-Control"', "no-store", "actor.user.email", ".eq(\"id\", actor.user.id)"]) requireText(accountRoute, marker, `Server-backed navigation account state lacks ${marker}.`);
const signOutActionSource = read("features/auth/sign-out-action.ts");
for (const marker of ["createSupabaseServerClient", "supabase.auth.signOut()", 'scope: "local"']) requireText(signOutActionSource, marker, `Server-authoritative sign-out lacks ${marker}.`);

const proxy = read("lib/supabase/proxy.ts");
for (const marker of ["getClaims", "request.cookies.set", "response.cookies.set"]) requireText(proxy, marker, `SSR session refresh lacks ${marker}.`);
prohibit([proxy, actor, read("lib/auth/queries.ts"), guards].join("\n"), /\.auth\.getSession\(/, "Server authorization trusts getSession().");
requireText(read("lib/supabase/client.ts"), "browserClient ??= createBrowserClient", "Browser auth does not reuse a singleton Supabase client.");

const migration = read("supabase/migrations/202608130001_create_profiles.sql") + read("supabase/migrations/202608130002_auth_profile_hardening.sql");
for (const marker of ["enable row level security", 'to authenticated', "(select auth.uid()) = id", "handle_new_user", "on_auth_user_created", "revoke select on table public.profiles from anon"]) requireText(migration, marker, `Profile schema/security lacks ${marker}.`);
for (const operation of ["insert", "delete"]) requireText(migration, `revoke insert, delete on public.profiles`, `Profiles do not deny client ${operation}.`);

const env = read(".env.example");
for (const marker of ["NEXT_PUBLIC_SUPABASE_URL=", "NEXT_PUBLIC_SUPABASE_ANON_KEY=", "NEXT_PUBLIC_ACCOUNTS_ENABLED=false", "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false", "NEXT_PUBLIC_GITHUB_AUTH_ENABLED=false"]) requireText(env, marker, `.env.example lacks ${marker}.`);
prohibit(env, /NEXT_PUBLIC_(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)/i, ".env.example exposes a privileged Supabase secret to browser code.");

if (failures.length) {
  console.error(`Authentication foundation regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Authentication foundation regression passed: email auth, recovery, reusable protection, stable auth navigation, live member dashboard data, profile RLS, and environment gating hold.");
