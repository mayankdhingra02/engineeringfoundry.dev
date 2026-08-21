import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

register(new URL("./typescript-path-loader.mjs", import.meta.url));

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const file = (path) => resolve(repositoryRoot, path);
const read = (path) => readFileSync(file(path), "utf8");
const requireFile = (path) => assert.ok(existsSync(file(path)), `missing required foundation file: ${path}`);
const assertContains = (source, marker, message) => assert.ok(source.includes(marker), message);
const assertNotMatches = (source, pattern, message) => assert.doesNotMatch(source, pattern, message);

for (const path of [
  "lib/auth/actor.ts",
  "lib/preparation-state/types.ts",
  "lib/preparation-state/validation.ts",
  "lib/preparation-state/repository.ts",
  "supabase/migrations/202608140002_harden_private_workspace_integrity.sql",
  "supabase/migrations/202608140003_create_user_preparation_state.sql",
  "supabase/migrations/202608220002_create_preparation_track_progress.sql",
]) requireFile(path);

const {
  validateDsaProgressMutation,
  validateDsaProgressSelector,
  validateLocalSystemDesignImportVersion,
  validatePreparationPreferencesPatch,
  validateSystemDesignProgressMutation,
  validateSystemDesignProgressSelector,
} = await import("../lib/preparation-state/validation.ts");

// Execute the production validators so runtime checks cannot drift behind their
// TypeScript declarations or the public curriculum catalogs they reference.
assert.equal(validatePreparationPreferencesPatch({
  dsaLevel: "sde2",
  dsaPlanId: "two-week",
  dsaPreferredLanguageSlug: "python",
  dsaInterviewDate: "2026-09-30",
  systemDesignLevel: "senior",
  systemDesignPreparationWindow: "2-weeks",
  systemDesignRole: "backend",
  systemDesignMinutesPerDay: 60,
}).ok, true, "supported preparation preferences should validate");
for (const invalid of [
  {},
  { dsaLevel: "principal" },
  { dsaPlanId: "tomorrow" },
  { dsaInterviewDate: "2026-02-30" },
  { systemDesignPreparationWindow: "7-days" },
  { systemDesignMinutesPerDay: 45 },
  { dsaLevel: "sde1", userId: "forged-user" },
]) assert.equal(validatePreparationPreferencesPatch(invalid).ok, false, `invalid preference input was accepted: ${JSON.stringify(invalid)}`);

assert.equal(validateDsaProgressMutation({ itemKind: "problem", itemId: "two-sum", status: "solved" }).ok, true, "a catalog DSA problem should validate");
assert.equal(validateDsaProgressMutation({ itemKind: "problem", itemId: "two-sum", status: "completed" }).ok, false, "problem status must respect its item-kind state machine");
assert.equal(validateDsaProgressMutation({ itemKind: "roadmap-task", itemId: "two-sum", status: "completed" }).ok, false, "item IDs must belong to the selected catalog kind");
assert.equal(validateDsaProgressMutation({ itemKind: "problem", itemId: "private-injected-problem", status: "solved" }).ok, false, "unknown DSA IDs must be rejected");
assert.equal(validateDsaProgressMutation({ itemKind: "problem", itemId: "two-sum", status: "not-started" }).ok, true, "not-started must remain the explicit deletion/reset command");
assert.equal(validateDsaProgressSelector({ itemKind: "problem", itemId: "two-sum", userId: "forged" }).ok, false, "selectors must reject ownership fields");

assert.equal(validateSystemDesignProgressMutation({ itemKind: "topic", itemId: "requirements", status: "completed" }).ok, true, "a published System Design topic should validate");
assert.equal(validateSystemDesignProgressMutation({ itemKind: "topic", itemId: "requirements", status: "not-started" }).ok, true, "System Design reset must remain an explicit delete command");
assert.equal(validateSystemDesignProgressMutation({ itemKind: "topic", itemId: "unpublished-injected-topic", status: "completed" }).ok, false, "unknown System Design IDs must be rejected");
assert.equal(validateSystemDesignProgressMutation({ itemKind: "topic", itemId: "requirements", status: "solved" }).ok, false, "System Design statuses must use the supported lifecycle");
assert.equal(validateSystemDesignProgressSelector({ itemKind: "topic", itemId: "requirements", user_id: "forged" }).ok, false, "System Design selectors must reject ownership fields");
assert.equal(validateLocalSystemDesignImportVersion(1).ok, true, "a positive import version should validate");
for (const invalid of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1"]) assert.equal(validateLocalSystemDesignImportVersion(invalid).ok, false, `invalid import version was accepted: ${String(invalid)}`);

const actor = read("lib/auth/actor.ts");
const repository = read("lib/preparation-state/repository.ts");
assert.match(actor, /(?:function\s+getAuthenticatedActor\s*\(\s*\)|getAuthenticatedActor\s*=\s*cache\(async\s*\(\s*\))/, "canonical actor must not accept a client-supplied identity");
for (const marker of ["createSupabaseServerClient", "auth.getUser", "user: data.user"]) assertContains(actor, marker, `canonical actor lacks ${marker}`);
assertNotMatches(actor, /\.auth\.getSession\(/, "server authorization must not trust getSession()");
for (const marker of [
  "getCurrentPreparationPreferences",
  "updateCurrentPreparationPreferences",
  "deleteCurrentPreparationPreferences",
  "getCurrentDsaProgress",
  "setCurrentDsaProgress",
  "deleteCurrentDsaProgressItem",
  "getCurrentSystemDesignProgress",
  "setCurrentSystemDesignProgress",
  "deleteCurrentSystemDesignProgressItem",
  "getCurrentPreparationState",
  "markCurrentLocalSystemDesignImported",
  'rpc("record_local_system_design_import"',
  'eq("user_id", actor.user.id)',
  'eq("user_id", current.data.user.id)',
  "isAccountPlatformAvailable",
  "getAuthenticatedActor",
]) assertContains(repository, marker, `current-user persistence boundary lacks ${marker}`);
assertNotMatches(repository, /export\s+(?:async\s+)?function\s+\w+\s*\([^)]*(?:userId|user_id)/, "exported persistence APIs must not accept an arbitrary user ID");
assertNotMatches(repository, /service[_-]?role|SUPABASE_SERVICE/i, "request persistence must not bypass RLS with service credentials");
assertNotMatches(repository, /(?:error\.message|JSON\.stringify\(error\)|throw\s+error)/, "database errors must not be exposed through the repository result");

const publicEntryFiles = [
  "app/page.tsx",
  "app/prepare/page.tsx",
  "app/dsa/page.tsx",
  "app/dsa/[...segments]/page.tsx",
  "app/system-design/[...segments]/page.tsx",
  "app/system-design/plan/page.tsx",
  "app/companies/page.tsx",
  "app/companies/[slug]/page.tsx",
];
for (const path of publicEntryFiles) {
  const source = read(path);
  assertNotMatches(source, /@\/lib\/(?:auth\/actor|applications\/queries|behavioral\/queries|preparation-state)/, `${path} imports private user data into a public route`);
  assertNotMatches(source, /force-dynamic/, `${path} lost its public/static rendering boundary`);
}

const privatePages = [
  "app/applications/page.tsx",
  "app/applications/new/page.tsx",
  "app/applications/[id]/page.tsx",
  "app/applications/[id]/edit/page.tsx",
  "app/applications/[id]/rounds/new/page.tsx",
  "app/applications/[id]/rounds/[roundId]/edit/page.tsx",
  "app/behavioral/workspace/page.tsx",
  "app/behavioral/questions/page.tsx",
  "app/behavioral/questions/new/page.tsx",
  "app/behavioral/questions/[questionId]/page.tsx",
  "app/behavioral/questions/[questionId]/edit/page.tsx",
  "app/behavioral/questions/[questionId]/answers/new/page.tsx",
  "app/behavioral/questions/[questionId]/answers/[answerId]/edit/page.tsx",
  "app/behavioral/stories/page.tsx",
  "app/behavioral/stories/new/page.tsx",
  "app/behavioral/stories/[id]/page.tsx",
  "app/behavioral/stories/[id]/edit/page.tsx",
  "app/dashboard/page.tsx",
  "app/onboarding/page.tsx",
  "app/settings/profile/page.tsx",
];
for (const path of privatePages) {
  const source = read(path);
  assertContains(source, 'dynamic = "force-dynamic"', `${path} must never be globally cached or statically generated`);
  assert.match(source, /robots:\s*\{\s*index:\s*false/, `${path} must explicitly opt out of indexing`);
  assertNotMatches(source, /unstable_cache|cacheLife\(|cacheTag\(/, `${path} must not use shared application caching`);
}
assertNotMatches(repository, /unstable_cache|cacheLife\(|cacheTag\(/, "user-owned preparation reads must not use shared application caching");
for (const path of ["lib/applications/queries.ts", "lib/behavioral/queries.ts", "lib/auth/queries.ts"]) {
  const source = read(path);
  assertNotMatches(source, /unstable_cache|cacheLife\(|cacheTag\(/, `${path} must not globally cache current-user data`);
  assertNotMatches(source, /service[_-]?role|SUPABASE_SERVICE/i, `${path} must not bypass request-scoped RLS`);
}

const systemDesignProgress = read("components/system-design-lesson-progress.tsx");
const systemDesignPlanner = read("components/system-design-focus-planner.tsx");
const systemDesignPractice = read("components/system-design-practice-library.tsx");
assertContains(systemDesignProgress, 'engineering-foundry-system-design-study-progress-v1', "signed-out System Design continuation key changed unexpectedly");
assertContains(systemDesignProgress, "window.localStorage.setItem", "signed-out System Design progress no longer persists locally");
for (const source of [systemDesignPlanner, systemDesignPractice]) assertContains(source, 'engineering-foundry-system-design-recommendations-v1', "signed-out System Design preferences key changed unexpectedly");
for (const [path, source] of [
  ["components/system-design-lesson-progress.tsx", systemDesignProgress],
  ["components/system-design-focus-planner.tsx", systemDesignPlanner],
  ["components/system-design-practice-library.tsx", systemDesignPractice],
]) assertNotMatches(source, /preparation-state\/repository/, `${path} must not silently merge browser-local progress into an account`);

const dsaPlanning = read("data/dsa/roadmap-planning.ts");
assert.match(dsaPlanning, /source:\s*"none"\s*,/, "signed-out DSA must preserve its honest no-persistence source");
assertNotMatches(read("app/dsa/[...segments]/page.tsx"), /preparation-state\/repository|source:\s*"account"/, "public DSA must not claim account-backed continuation before integration");

const analytics = read("lib/analytics.ts");
const pageView = read("components/posthog-page-view.tsx");
// Private-route classification moved to one canonical module in Phase 9 so
// analytics and robots cannot drift apart. See lib/privacy/routes.ts and
// scripts/test-private-route-privacy.mjs.
const privacyRoutes = read("lib/privacy/routes.ts");
assertContains(analytics, 'from "@/lib/privacy/routes"', "analytics must use the canonical private-route classification");
for (const prefix of ["/applications", "/behavioral/questions", "/behavioral/stories", "/behavioral/workspace", "/dashboard", "/settings", "/calendar", "/interviews", "/system-design/practice"]) {
  assertContains(privacyRoutes, `"${prefix}"`, `canonical private-route classification lacks ${prefix}`);
}
for (const marker of ["autocapture: false", "capture_pageview: false", "capture_pageleave: false", "disable_session_recording: true", "mask_all_text: true", "save_campaign_params: false", "save_referrer: false"]) assertContains(analytics, marker, `analytics privacy configuration lacks ${marker}`);
assert.match(analytics, /isPrivateAnalyticsPath\(safeUrl\.pathname\)\) return/, "page-view capture must reject private routes");
assertContains(analytics, 'safeUrl.search = ""', "public analytics URLs must discard query strings");
assertContains(analytics, 'safeUrl.hash = ""', "public analytics URLs must discard fragments");
assertContains(pageView, "isPrivateAnalyticsPath(pathname)", "client navigation must skip private page views");
assertNotMatches(pageView, /useSearchParams|window\.location\.href/, "page-view collection must not include query strings or raw browser URLs");

const robots = read("app/robots.ts");
assertContains(robots, "PRIVATE_ROBOTS_DISALLOW", "robots.txt must derive its rules from the canonical private-route classification");
for (const prefix of ["/applications", "/behavioral/questions", "/behavioral/stories", "/behavioral/workspace", "/dashboard", "/settings", "/onboarding"]) assertContains(privacyRoutes, `"${prefix}"`, `robots.txt rules lack ${prefix}`);
const sitemap = read("app/sitemap.ts");
for (const privateRoute of ["/applications", "/behavioral/questions", "/behavioral/stories", "/behavioral/workspace", "/dashboard", "/settings", "/onboarding"]) assert.ok(!sitemap.includes(`"${privateRoute}"`), `private route leaked into sitemap source: ${privateRoute}`);

const preparationMigration = read("supabase/migrations/202608140003_create_user_preparation_state.sql");
const trackActivityMigration = read("supabase/migrations/202608220002_create_preparation_track_progress.sql");
for (const table of ["user_preparation_preferences", "dsa_progress", "system_design_progress", "behavioral_saved_questions"]) {
  assert.match(preparationMigration, new RegExp(`create table public\\.${table}\\s*\\(`), `normalized table ${table} is missing`);
  assert.match(preparationMigration, new RegExp(`alter table public\\.${table} enable row level security`), `${table} does not enable RLS`);
}
for (const domain of ["preparation preferences", "DSA progress", "System Design progress"]) {
  for (const operation of ["read", "create", "update", "delete"]) assertContains(preparationMigration, `Owners can ${operation} ${domain}`, `${domain} lacks owner-only ${operation} policy`);
}
for (const marker of ["Owners can read saved behavioral questions", "Owners can save behavioral questions", "Owners can delete saved behavioral questions"]) assertContains(preparationMigration, marker, `saved questions lack owner-only policy: ${marker}`);
assert.match(preparationMigration, /revoke all on table[\s\S]*from anon/, "anonymous users must have no preparation-table grants");
assertNotMatches(preparationMigration, /grant all(?: privileges)? on table[\s\S]*to authenticated/i, "authenticated users must receive narrow column/table grants, not GRANT ALL");
for (const marker of ["grant select, delete on table public.dsa_progress", "grant update (status)", "grant select, delete on table public.system_design_progress", "grant update (status, completed_at, last_interacted_at)"]) assertContains(preparationMigration, marker, `preparation grants lack ${marker}`);
for (const marker of [
  "record_local_system_design_import",
  "security definer",
  "set search_path = ''",
  "revoke all on function public.record_local_system_design_import(integer) from public",
  "grant execute on function public.record_local_system_design_import(integer) to authenticated",
]) assertContains(preparationMigration, marker, `local-import receipt RPC lacks ${marker}`);
assertNotMatches(
  preparationMigration,
  /grant (?:insert|update) \([^)]*local_system_design_import_(?:version|imported_at)/is,
  "authenticated clients must not assign the local-import version or timestamp directly",
);
for (const marker of [
  "create table public.preparation_track_progress",
  "on delete cascade",
  "enable row level security",
  "Owners can read preparation track progress",
  "save_preparation_track_progress",
  "security definer",
  "set search_path = ''",
  "revoke all on table public.preparation_track_progress from anon, authenticated",
]) assertContains(trackActivityMigration, marker, `P0.2 durable activity migration lacks ${marker}`);

const hardeningMigration = read("supabase/migrations/202608140002_harden_private_workspace_integrity.sql");
for (const marker of [
  "foreign key (application_id, user_id)",
  "foreign key (story_id, user_id)",
  "foreign key (custom_question_id, user_id)",
  "replace_behavioral_story_themes",
  "move_interview_round",
  "security invoker",
  "set search_path = ''",
  "revoke all on function",
  "grant execute on function",
]) assertContains(hardeningMigration, marker, `private-workspace hardening lacks ${marker}`);

const pgTapPath = "supabase/tests/database/user_preparation_state.test.sql";
requireFile(pgTapPath);
const pgTap = read(pgTapPath);
for (const marker of [
  "create extension if not exists pgtap",
  "request.jwt.claim.sub",
  "another user cannot read",
  "another user cannot update",
  "another user cannot delete",
  "owner can create",
  "owner can update",
  "owner can delete",
  "anon cannot read",
  "local import RPC rejects a version downgrade",
  "clients cannot downgrade a local import version directly",
]) assertContains(pgTap, marker, `preparation pgTAP coverage lacks ${marker}`);

console.log([
  "Persistence foundation regression passed:",
  "- production runtime validators reject forged ownership, invalid enums, impossible dates, unknown catalog IDs, and invalid state transitions",
  "- canonical actor/current-user repositories do not accept arbitrary user IDs or bypass RLS",
  "- public/static pages, private no-cache/noindex pages, analytics, robots, and sitemap boundaries hold",
  "- versioned browser activity remains bounded, recoverable, and separate from deliberate account imports",
  "- normalized schema, owner RLS, narrow grants, relationship ownership, atomic RPCs, and two-user pgTAP coverage are present",
].join("\n"));
