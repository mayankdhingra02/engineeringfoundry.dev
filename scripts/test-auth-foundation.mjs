import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  validateSignInCredentials,
  validateSignUpCredentials,
} from "../lib/auth/credentials.ts";
import {
  PUBLIC_PROFILE_UNAVAILABLE_MESSAGE,
  PublicProfileUnavailableError,
  resolvePublicProfileQuery,
} from "../lib/auth/public-profile-query.ts";
import {
  PROFILE_LINK_MAX_LENGTH,
  canonicalizeProfileLinkUrl,
  parseOptionalProfileLink,
  sanitizePublicProfileLinks,
} from "../lib/auth/profile-links.ts";
import { parseProfileForm } from "../lib/auth/validation.ts";
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

  const publicProfile = {
    username: "grace_hopper",
    display_name: "Grace Hopper",
    bio: "Compiler pioneer",
  };
  assert.equal(resolvePublicProfileQuery({ data: publicProfile, error: null }), publicProfile, "A resolved public profile row must pass through unchanged.");
  assert.equal(resolvePublicProfileQuery({ data: null, error: null }), null, "A genuine no-row public profile result must remain null.");
  assert.throws(
    () => resolvePublicProfileQuery({ data: null, error: { message: "database unavailable" } }),
    (error) => error instanceof PublicProfileUnavailableError
      && error.name === "PublicProfileUnavailableError"
      && error.message === PUBLIC_PROFILE_UNAVAILABLE_MESSAGE
      && error.message === "This public profile is temporarily unavailable. Please try again.",
    "A public-profile RPC error must throw the stable unavailable error instead of becoming a false not-found result.",
  );
  assert.throws(
    () => resolvePublicProfileQuery({ data: publicProfile, error: { message: "partial response" } }),
    PublicProfileUnavailableError,
    "An RPC error must take precedence over any accompanying row.",
  );
} catch (error) {
  failures.push(`Credential, redirect, or public-profile query validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

function profileForm({ github = "", linkedin = "" } = {}) {
  const form = new FormData();
  form.set("username", "profile_member");
  form.set("display_name", "Profile Member");
  if (github !== undefined) form.set("github_url", github);
  if (linkedin !== undefined) form.set("linkedin_url", linkedin);
  return form;
}

try {
  const canonicalCases = [
    ["github", "https://github.com", "https://github.com/"],
    ["github", "https://www.github.com/octocat", "https://github.com/octocat"],
    ["github", "  HTTPS://WWW.GITHUB.COM/OctoCat?tab=repositories#profile  ", "https://github.com/OctoCat"],
    ["linkedin", "https://linkedin.com/in/member", "https://www.linkedin.com/in/member"],
    ["linkedin", "https://www.linkedin.com", "https://www.linkedin.com/"],
    ["linkedin", "  HTTPS://LINKEDIN.COM/in/Profile-Member?trk=public#about  ", "https://www.linkedin.com/in/Profile-Member"],
  ];
  for (const [platform, input, expected] of canonicalCases) {
    assert.deepEqual(parseOptionalProfileLink(platform, input), { value: expected }, `${platform} link did not canonicalize safely.`);
    assert.equal(canonicalizeProfileLinkUrl(platform, input), expected, `${platform} defensive canonicalization disagrees with input parsing.`);
    assert.equal(canonicalizeProfileLinkUrl(platform, expected), expected, `${platform} canonicalization is not idempotent.`);
  }
  for (const platform of ["github", "linkedin"]) {
    assert.deepEqual(parseOptionalProfileLink(platform, ""), { value: null }, `${platform} blank optional link must remain empty.`);
    assert.deepEqual(parseOptionalProfileLink(platform, "   "), { value: null }, `${platform} whitespace-only optional link must remain empty.`);
    assert.deepEqual(parseOptionalProfileLink(platform, null), { value: null }, `${platform} absent optional link must remain empty.`);
    assert.deepEqual(parseOptionalProfileLink(platform, undefined), { value: null }, `${platform} undefined optional link must remain empty.`);
  }

  const invalidByPlatform = {
    github: [
      "https://attacker.example/phish", "https://linkedin.com/in/member", "https://evilgithub.com/member",
      "https://github.com.evil.test/member", "https://gist.github.com/member", "https://github.com./member",
      "https://127.0.0.1/member", "https://localhost/member", "http://github.com/member", "ftp://github.com/member",
      "javascript:alert(1)", "data:text/plain,github", "//github.com/member", "https://user:password@github.com/member",
      "https://github.com@evil.test/member", "https://github.com:444/member", "https://", "https://github.com/member\nnext",
      `https://github.com/${"a".repeat(PROFILE_LINK_MAX_LENGTH)}`,
    ],
    linkedin: [
      "https://attacker.example/phish", "https://github.com/member", "https://evillinkedin.com/in/member",
      "https://linkedin.com.evil.test/in/member", "https://uk.linkedin.com/in/member", "https://linkedin.com./in/member",
      "https://127.0.0.1/in/member", "https://localhost/in/member", "http://linkedin.com/in/member", "ftp://linkedin.com/in/member",
      "javascript:alert(1)", "data:text/plain,linkedin", "//linkedin.com/in/member", "https://user:password@linkedin.com/in/member",
      "https://linkedin.com@evil.test/in/member", "https://linkedin.com:444/in/member", "https://", "https://linkedin.com/in/member\u0000next",
      `https://linkedin.com/${"a".repeat(PROFILE_LINK_MAX_LENGTH)}`,
    ],
  };
  for (const [platform, values] of Object.entries(invalidByPlatform)) {
    const expectedError = platform === "github" ? "GitHub URL must use https://github.com." : "LinkedIn URL must use https://www.linkedin.com.";
    for (const value of values) {
      assert.deepEqual(parseOptionalProfileLink(platform, value), { value: null, error: expectedError }, `${platform} accepted unsafe link ${JSON.stringify(value)}.`);
      assert.equal(canonicalizeProfileLinkUrl(platform, value), null, `${platform} public sanitization accepted unsafe link ${JSON.stringify(value)}.`);
    }
    for (const value of [42, true, [], {}, new Blob(["https://github.com/member"])]) {
      assert.deepEqual(parseOptionalProfileLink(platform, value), { value: null, error: expectedError }, `${platform} accepted a non-string link.`);
    }
  }

  const absentProfileForm = new FormData();
  absentProfileForm.set("username", "profile_member");
  absentProfileForm.set("display_name", "Profile Member");
  const blankProfile = parseProfileForm(absentProfileForm);
  assert.equal(blankProfile.error, undefined);
  assert.equal(blankProfile.data?.githubUrl, null);
  assert.equal(blankProfile.data?.linkedinUrl, null);
  const canonicalProfile = parseProfileForm(profileForm({
    github: " HTTPS://WWW.GITHUB.COM/member?tab=repositories#top ",
    linkedin: " HTTPS://LINKEDIN.COM/in/member?trk=profile#about ",
  }));
  assert.equal(canonicalProfile.error, undefined);
  assert.equal(canonicalProfile.data?.githubUrl, "https://github.com/member");
  assert.equal(canonicalProfile.data?.linkedinUrl, "https://www.linkedin.com/in/member");
  assert.equal(parseProfileForm(profileForm({ github: "https://linkedin.com/in/member" })).error, "GitHub URL must use https://github.com.");
  assert.equal(parseProfileForm(profileForm({ linkedin: "https://github.com/member" })).error, "LinkedIn URL must use https://www.linkedin.com.");
  assert.equal(parseProfileForm(profileForm({ github: `https://github.com/${"a".repeat(PROFILE_LINK_MAX_LENGTH)}` })).error, "GitHub URL must use https://github.com.");
  const nonStringProfile = profileForm();
  nonStringProfile.set("github_url", new Blob(["https://github.com/member"]));
  assert.equal(parseProfileForm(nonStringProfile).error, "GitHub URL must use https://github.com.");

  const unsafeLegacy = { username: "legacy", github_url: "https://attacker.example/phish", linkedin_url: "https://github.com/legacy", extra: "preserved" };
  const sanitizedLegacy = sanitizePublicProfileLinks(unsafeLegacy);
  assert.equal(sanitizedLegacy.github_url, null, "An unsafe legacy GitHub value reached public rendering.");
  assert.equal(sanitizedLegacy.linkedin_url, null, "An unsafe legacy LinkedIn value reached public rendering.");
  assert.equal(sanitizedLegacy.extra, "preserved", "Public-link sanitization changed an unrelated projection field.");
  assert.equal(unsafeLegacy.github_url, "https://attacker.example/phish", "Public-link sanitization mutated its RPC input.");
  const sanitizedSafeAliases = sanitizePublicProfileLinks({ github_url: "https://www.github.com/legacy", linkedin_url: "https://linkedin.com/in/legacy" });
  assert.equal(sanitizedSafeAliases.github_url, "https://github.com/legacy", "A safe legacy GitHub alias was not canonicalized independently.");
  assert.equal(sanitizedSafeAliases.linkedin_url, "https://www.linkedin.com/in/legacy", "A safe legacy LinkedIn alias was not canonicalized independently.");
} catch (error) {
  failures.push(`Professional profile-link validation failed: ${error instanceof Error ? error.message : String(error)}`);
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

const professionalLinkMigration = read("supabase/migrations/202608240001_harden_profile_professional_links.sql");
const profileDatabaseTest = read("supabase/tests/database/auth_profile_hardening.test.sql");
const migration = read("supabase/migrations/202608130001_create_profiles.sql") + read("supabase/migrations/202608130002_auth_profile_hardening.sql") + professionalLinkMigration;
for (const marker of ["enable row level security", 'to authenticated', "(select auth.uid()) = id", "handle_new_user", "on_auth_user_created", "revoke select on table public.profiles from anon"]) requireText(migration, marker, `Profile schema/security lacks ${marker}.`);
for (const operation of ["insert", "delete"]) requireText(migration, `revoke insert, delete on public.profiles`, `Profiles do not deny client ${operation}.`);
for (const marker of ["get_public_profile(profile_username text)", "returns table (", "username text", "display_name text", "bio text", "current_company text", '"current_role" text', "years_experience integer", "linkedin_url text", "github_url text", "avatar_url text", "security definer", "profiles.is_public = true", "profiles.onboarding_complete = true", "grant execute on function public.get_public_profile(text) to anon, authenticated"]) requireText(migration, marker, `Public-profile RPC projection or visibility boundary lacks ${marker}.`);

const authQueries = read("lib/auth/queries.ts");
const publicProfilePage = read("app/u/[username]/page.tsx");
const profileValidation = read("lib/auth/validation.ts");
const profileFormSource = read("features/profile/profile-form.tsx");
for (const marker of ['rpc("get_public_profile"', "profile_username: username", ".maybeSingle()", "const result = await", "resolvePublicProfileQuery(result)"]) requireText(authQueries, marker, `Public-profile query must retain data and error for the resolver: ${marker}.`);
prohibit(authQueries, /const\s*\{\s*data\s*\}\s*=\s*await\s+supabase\.rpc\("get_public_profile"/, "Public-profile query discards its RPC error before resolution.");
if ((authQueries.match(/\.toLowerCase\(\)/g) ?? []).length !== 1 || publicProfilePage.includes(".toLowerCase()")) failures.push("Public-profile usernames must be normalized exactly once at the shared query boundary for metadata and page rendering.");
for (const marker of ["const profile = await getPublicProfile(username)", "getPublicProfile((await params).username)", "if (!profile) notFound()", 'title: "Profiles Unavailable"', "robots: { index: false, follow: false }"]) requireText(publicProfilePage, marker, `Public-profile route lacks ${marker}.`);
prohibit(publicProfilePage, /try\s*\{|catch\s*\(/, "Public-profile route must not catch an unavailable query and convert it to not-found.");
const pageProfileLookup = publicProfilePage.indexOf("const profile = await getPublicProfile((await params).username)");
const pageNotFound = publicProfilePage.indexOf("if (!profile) notFound()", pageProfileLookup);
if (pageProfileLookup < 0 || pageNotFound <= pageProfileLookup) failures.push("Public-profile page must call notFound only after the resolved query returns a genuine null.");
for (const marker of ["profile.display_name", "profile.username", "profile.bio", "alternates: { canonical:", "openGraph:", "<PublicProfileView", "profile.current_role", "profile.current_company", "profile.years_experience", "profile.github_url", "profile.linkedin_url"]) requireText(publicProfilePage, marker, `Successful public-profile rendering lost ${marker}.`);
const resolvedProfileIndex = authQueries.indexOf("const profile = resolvePublicProfileQuery(result);");
const sanitizedProfileIndex = authQueries.indexOf("profile ? sanitizePublicProfileLinks(profile) : null");
if (resolvedProfileIndex < 0 || sanitizedProfileIndex <= resolvedProfileIndex) failures.push("Public-profile links are not sanitized after resolver error/null semantics complete.");
for (const marker of ['parseOptionalProfileLink("linkedin", formData.get("linkedin_url"))', 'parseOptionalProfileLink("github", formData.get("github_url"))']) requireText(profileValidation, marker, `Profile form parsing bypasses canonical professional-link validation: ${marker}.`);
for (const marker of ['name="linkedin_url" type="url" inputMode="url" maxLength={500} aria-describedby="linkedin-url-help"', 'id="linkedin-url-help">Use a full HTTPS URL on linkedin.com.', 'name="github_url" type="url" inputMode="url" maxLength={500} aria-describedby="github-url-help"', 'id="github-url-help">Use a full HTTPS URL on github.com.']) requireText(profileFormSource, marker, `Profile professional-link input lacks its bound/help contract: ${marker}.`);
requireText(publicProfilePage, "No supported professional links are available.", "Public profile does not describe a sanitized zero-link state honestly.");

for (const marker of [
  "create or replace function public.enforce_profile_professional_urls()",
  "new.github_url is distinct from old.github_url",
  "new.linkedin_url is distinct from old.linkedin_url",
  "before insert or update of linkedin_url, github_url on public.profiles",
  "errcode = '23514', constraint = 'profiles_github_url_canonical'",
  "errcode = '23514', constraint = 'profiles_linkedin_url_canonical'",
  "revoke execute on function public.enforce_profile_professional_urls() from public, anon, authenticated",
  "create or replace function public.get_public_profile(profile_username text)",
  "security definer",
  "set search_path = ''",
  "revoke execute on function public.get_public_profile(text) from public, anon, authenticated",
  "grant execute on function public.get_public_profile(text) to anon, authenticated",
]) requireText(professionalLinkMigration, marker, `Professional-link migration is missing ${marker}.`);
prohibit(professionalLinkMigration, /\b(?:update|delete\s+from)\s+public\.profiles\b/i, "Professional-link migration destructively rewrites or deletes existing profile data.");
const publicRpcBlock = professionalLinkMigration.slice(professionalLinkMigration.indexOf("create or replace function public.get_public_profile"));
for (const marker of ["case", "profiles.github_url", "profiles.linkedin_url", "else null"]) requireText(publicRpcBlock, marker, `Public profile RPC does not independently mask unsafe legacy professional links: ${marker}.`);
for (const marker of [
  "anon cannot execute the professional URL trigger function",
  "authenticated cannot execute the professional URL trigger function",
  "profiles use the professional URL enforcement trigger",
  "owner can store canonical professional URLs directly",
  "GitHub rejects an off-domain URL",
  "LinkedIn rejects an off-domain URL",
  "an unrelated owner update remains possible on a legacy-invalid row",
  "the public RPC masks a legacy-invalid GitHub URL",
  "the public RPC masks a legacy-invalid LinkedIn URL",
  "the public RPC preserves the safe legacy www GitHub alias",
  "the public RPC preserves the safe legacy bare LinkedIn alias",
]) requireText(profileDatabaseTest, marker, `Profile pgTAP coverage is missing ${marker}.`);

const env = read(".env.example");
for (const marker of ["NEXT_PUBLIC_SUPABASE_URL=", "NEXT_PUBLIC_SUPABASE_ANON_KEY=", "NEXT_PUBLIC_ACCOUNTS_ENABLED=false", "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false", "NEXT_PUBLIC_GITHUB_AUTH_ENABLED=false"]) requireText(env, marker, `.env.example lacks ${marker}.`);
prohibit(env, /NEXT_PUBLIC_(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)/i, ".env.example exposes a privileged Supabase secret to browser code.");

if (failures.length) {
  console.error(`Authentication foundation regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Authentication foundation regression passed: email auth, recovery, reusable protection, stable auth navigation, live member dashboard data, profile RLS, and environment gating hold.");
