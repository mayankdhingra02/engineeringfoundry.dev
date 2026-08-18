import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onboardingDestination } from "../lib/account/preferences.ts";
import { safeInternalPath } from "../lib/auth/redirects.ts";
import { collectAccountExportRows, EXPORT_PAGE_SIZE } from "../lib/account/export-pagination.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [migration, actions, exportRoute, exporter, onboardingPage, onboardingForm, dashboard, accountControl, authForm, passwordForms, styles, packageJson] = await Promise.all([
  read("supabase/migrations/202608150001_create_account_lifecycle.sql"),
  read("features/account/actions.ts"),
  read("app/api/account/export/route.ts"),
  read("lib/account/export.ts"),
  read("app/onboarding/page.tsx"),
  read("features/account/onboarding-form.tsx"),
  read("app/dashboard/page.tsx"),
  read("components/account-control.tsx"),
  read("features/auth/auth-form.tsx"),
  read("features/auth/password-forms.tsx"),
  read("app/globals.css"),
  read("package.json"),
]);

for (const marker of ["onboarding_completed_at", "preferred_role_level", "primary_preparation_focus", "complete_account_onboarding", "save_account_preparation_preferences"]) {
  assert.ok(migration.includes(marker), `migration is missing ${marker}`);
}
assert.match(migration, /update public\.profiles[\s\S]*onboarding_complete = true[\s\S]*onboarding_completed_at/, "established-profile backfill is absent");
assert.match(migration, /revoke update \(onboarding_complete\).*authenticated/, "clients can still forge onboarding completion");
assert.match(migration, /current_user_id uuid := auth\.uid\(\)/, "account RPCs do not derive ownership from auth.uid()");

assert.equal(onboardingDestination({ hasUpcomingInterview: true, interviewScheduled: false, focus: "dsa", requestedPath: "/dashboard" }), "/dashboard");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: true, focus: "dsa", requestedPath: "/dashboard" }), "/applications/new");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "dsa", requestedPath: "/dashboard" }), "/dsa/roadmap");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "system_design", requestedPath: "/dashboard" }), "/system-design/practice");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "behavioral", requestedPath: "/dashboard" }), "/behavioral/workspace");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "applications", requestedPath: "/dashboard" }), "/applications/new");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: null, requestedPath: "/applications" }), "/applications");
assert.equal(safeInternalPath("//evil.example/account"), "/dashboard");
assert.equal(safeInternalPath("https://evil.example/account"), "/dashboard");

const highCardinalityRows = Array.from({ length: (EXPORT_PAGE_SIZE * 2) + 205 }, (_, id) => ({ id }));
const requestedRanges = [];
const paginatedRows = await collectAccountExportRows("high_cardinality_regression", async (from, to) => {
  requestedRanges.push([from, to]);
  return { data: highCardinalityRows.slice(from, to + 1), error: null };
});
assert.equal(paginatedRows.length, 1_205, "account export pagination silently truncates high-cardinality sections");
assert.deepEqual(requestedRanges, [[0, 499], [500, 999], [1000, 1499]], "account export does not advance through deterministic ranges");

for (const marker of ["preferredRoleLevel", "interviewScheduled", "primaryPreparationFocus", "preferredTimezone", "Skip for now"]) {
  assert.ok(onboardingForm.includes(marker), `onboarding form is missing ${marker}`);
}
assert.ok(onboardingPage.includes("profile.onboarding_complete"), "established users are not redirected away from onboarding");
assert.ok(dashboard.includes("preparationHasStarted") && dashboard.includes("primary_preparation_focus"), "dashboard lacks the preference-aware first-use transition");
assert.ok(dashboard.indexOf('!preparationHasStarted') < dashboard.indexOf('className="pipeline-summary"'), "new users see zero-value summaries before the first-use action");

assert.match(actions, /String\(form\.get\("confirmation"\)[\s\S]*!== "DELETE"/, "deletion lacks exact confirmation");
assert.match(actions, /admin\.auth\.admin\.deleteUser\(actor\.user\.id, false\)/, "deletion is not bound to the authenticated actor");
assert.ok(!actions.includes('form.get("userId")') && !actions.includes('form.get("user_id")'), "an account action trusts a client user ID");
assert.match(actions, /signOut\(\{ scope: "global" \}\)/, "global session signout is not implemented");
// Phase 9 moved credential verification to an isolated, cookie-free client so a
// verification step cannot rotate the caller's session. See
// lib/auth/reauthentication.ts.
assert.match(actions, /verifyPasswordForSensitiveAction\(actor\.user, currentPassword\)[\s\S]*updateUser\(\{ password: newPassword \}\)/, "password change does not verify the current password first");
assert.ok(!actions.includes("actor.supabase.auth.signInWithPassword"), "credential verification must not run on the cookie-backed session client");
assert.match(actions, /supportsPasswordReauthentication\(actor\.user\)/, "deletion does not reauthenticate password-capable accounts");

assert.match(exportRoute, /getAuthenticatedActor\(\)/, "export route does not resolve an authenticated actor");
assert.match(exportRoute, /Content-Disposition/, "export is not delivered as an attachment");
assert.match(exportRoute, /private, no-store/, "export response is not private/no-store");
assert.ok(!exportRoute.includes("searchParams") && !exportRoute.includes("userId"), "export accepts a target account parameter");
for (const forbidden of ["access_token", "refresh_token", "encrypted_password", "service_role", "claim_token", "provider_message_id", "last_error_code"]) {
  assert.ok(!exporter.includes(`"${forbidden}`), `export includes operational secret field ${forbidden}`);
}
for (const section of ["applications", "interview_rounds", "interview_preparation", "behavioral", "dsa", "system_design", "calendar"]) {
  assert.ok(exporter.includes(section), `export lacks ${section}`);
}
for (const field of ["opening_framing", "details_to_emphasize", "details_to_avoid"]) {
  assert.ok(exporter.includes(field), `behavioral export omits ${field}`);
}
assert.match(exporter, /collectAccountExportRows[\s\S]*\.range\(from, to\)/, "export queries do not paginate past the PostgREST row cap");

for (const destination of ["/dashboard", "/applications", "/calendar", "/settings"]) {
  assert.ok(accountControl.includes(`href="${destination}"`), `account navigation lacks ${destination}`);
}
assert.ok(!accountControl.includes('href="/behavioral/workspace"'), "account dropdown still duplicates primary preparation navigation");
assert.match(authForm, /<form[^>]*method="post"/, "auth forms can leak credentials through a pre-hydration GET submission");
assert.match(passwordForms, /<form[^>]*method="post"/, "password-recovery forms lack a safe pre-hydration method");
assert.ok(!passwordForms.includes("auth-kicker"), "recovery pages reintroduce decorative pre-heading kickers");
assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.settings-workspace \{ grid-template-columns: 1fr;/, "mobile settings do not collapse to one column");
assert.ok(JSON.parse(packageJson).scripts["test:account-lifecycle"], "package script for Phase 8 is absent");

console.log("PASS  Phase 8 onboarding, settings, export, deletion, navigation, redirect, and mobile invariants");
