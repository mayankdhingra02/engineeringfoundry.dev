import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  attemptDocumentFromForm,
  canonicalSystemDesignConceptIds,
  canonicalSystemDesignItemIds,
  canonicalSystemDesignProblemIds,
  chooseSystemDesignContinueTarget,
  emptySystemDesignAttemptDocument,
  validateSystemDesignAttemptDocument,
} from "../lib/system-design/workspace.ts";
import {
  isSystemDesignAttemptId,
  resolveSystemDesignAttemptQuery,
  SYSTEM_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN,
} from "../lib/system-design/attempt-query.ts";
import { PrivateDataUnavailableError } from "../lib/persistence/errors.ts";

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };
const migration = readFileSync(new URL("../supabase/migrations/202608140008_create_system_design_workspace.sql", import.meta.url), "utf8");
const validationMigration = readFileSync(new URL("../supabase/migrations/202608140010_enforce_system_design_attempt_document_shape.sql", import.meta.url), "utf8");
const actions = readFileSync(new URL("../features/system-design/actions.ts", import.meta.url), "utf8");
const queries = readFileSync(new URL("../lib/system-design/queries.ts", import.meta.url), "utf8");
const attemptQuery = readFileSync(new URL("../lib/system-design/attempt-query.ts", import.meta.url), "utf8");
const editor = readFileSync(new URL("../features/system-design/attempt-editor.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../app/system-design/practice/page.tsx", import.meta.url), "utf8");
const problemPanel = readFileSync(new URL("../features/system-design/problem-practice-panel.tsx", import.meta.url), "utf8");
const privateProgress = readFileSync(new URL("../features/system-design/private-progress.tsx", import.meta.url), "utf8");
const progressEditor = readFileSync(new URL("../features/system-design/progress-editor.tsx", import.meta.url), "utf8");
const contentRoute = readFileSync(new URL("../app/system-design/[...segments]/page.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/system-design/problems/[slug]/practice/[attemptId]/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8");
const application = readFileSync(new URL("../app/applications/[id]/page.tsx", import.meta.url), "utf8");
const practiceLibrary = readFileSync(new URL("../components/system-design-practice-library.tsx", import.meta.url), "utf8");
const sidebar = readFileSync(new URL("../components/system-design-sidebar.tsx", import.meta.url), "utf8");
const lesson = readFileSync(new URL("../components/system-design-lesson.tsx", import.meta.url), "utf8");
const plan = readFileSync(new URL("../app/system-design/plan/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const attemptQueryStart = queries.indexOf("export async function getSystemDesignAttempt");
const attemptQueryEnd = queries.indexOf("\nexport async function ", attemptQueryStart + 1);
const attemptQueryBody = queries.slice(attemptQueryStart, attemptQueryEnd < 0 ? undefined : attemptQueryEnd);
const attemptRouteBody = route.slice(route.indexOf("export default async function SystemDesignAttemptPage"));

check(canonicalSystemDesignConceptIds.size === 146, "published concept catalog stays canonical");
check(canonicalSystemDesignProblemIds.size === 27, "published problem catalog stays canonical");
check(canonicalSystemDesignItemIds.size === 173, "namespaced combined catalog preserves shared concept/problem IDs");
check(canonicalSystemDesignProblemIds.has("url-shortener"), "foundation problem is canonical");
check(canonicalSystemDesignConceptIds.has("capacity-estimation") === false, "route slugs cannot spoof concept IDs");
check(canonicalSystemDesignConceptIds.has("estimation"), "durable concept ID is canonical");

const blank = emptySystemDesignAttemptDocument();
check(validateSystemDesignAttemptDocument(blank).ok, "blank structured document is valid");
check(!validateSystemDesignAttemptDocument(null).ok, "null document is rejected");
check(!validateSystemDesignAttemptDocument({ ...blank, surprise: true }).ok, "unknown document keys are rejected");
check(!validateSystemDesignAttemptDocument({ ...blank, functional_requirements: "text" }).ok, "unstructured requirement blob is rejected");
check(!validateSystemDesignAttemptDocument({ ...blank, capacity: [] }).ok, "capacity must remain structured");
check(!validateSystemDesignAttemptDocument({ ...blank, high_level_design: "x".repeat(30001) }).ok, "high-level design length is bounded");
check(!validateSystemDesignAttemptDocument({ ...blank, final_review_notes: "x".repeat(20001) }).ok, "review notes length is bounded");
check(validateSystemDesignAttemptDocument({ ...blank, functional_requirements: ["Create a short URL"] }).ok, "requirement list is accepted");
check(validateSystemDesignAttemptDocument({ ...blank, capacity: { assumptions: [{ label: "DAU", value: "10M", unit: "users/day" }], calculations: [{ label: "RPS", formula: "10M / 86400", result: "116" }] } }).ok, "transparent capacity rows are accepted");
check(!validateSystemDesignAttemptDocument({ ...blank, apis: [{ path: "/v1" }] }).ok, "partial API rows are rejected");
check(!validateSystemDesignAttemptDocument({ ...blank, failure_modes: Array.from({ length: 51 }, () => ({ failure: "x", impact: "y", mitigation: "z" })) }).ok, "row counts are bounded");

const canonicalAttemptId = "11111111-1111-4111-8111-111111111111";
for (const id of [
  "11111111-1111-1111-8111-111111111111",
  canonicalAttemptId,
  "11111111-1111-5111-b111-111111111111",
  canonicalAttemptId.toUpperCase(),
]) {
  check(isSystemDesignAttemptId(id), `canonical RFC 4122 attempt ID shape ${id} is accepted regardless of hex case`);
}
for (const [label, id] of [
  ["missing", undefined],
  ["null", null],
  ["empty", ""],
  ["leading whitespace", ` ${canonicalAttemptId}`],
  ["trailing whitespace", `${canonicalAttemptId} `],
  ["nil/version zero", "00000000-0000-0000-0000-000000000000"],
  ["unsupported version", "11111111-1111-6111-8111-111111111111"],
  ["invalid variant", "11111111-1111-4111-7111-111111111111"],
  ["missing separators", "11111111111141118111111111111111"],
  ["non-hex lookalike", "g1111111-1111-4111-8111-111111111111"],
  ["query suffix", `${canonicalAttemptId}?next=/dashboard`],
  ["encoded path suffix", `${canonicalAttemptId}%2Fworkspace`],
  ["SQL-shaped suffix", `${canonicalAttemptId}' OR '1'='1`],
  ["array", [canonicalAttemptId]],
  ["object", { id: canonicalAttemptId }],
]) {
  check(!isSystemDesignAttemptId(id), `${label} attempt ID is rejected`);
}

const validPersistedAttempt = {
  id: canonicalAttemptId,
  user_id: "22222222-2222-4222-8222-222222222222",
  problem_id: "url-shortener",
  catalog_item_type: "design_problem",
  application_id: null,
  title: "URL Shortener",
  status: "draft",
  confidence: null,
  document: blank,
  revision: 1,
  first_practiced_at: null,
  last_practiced_at: null,
  created_at: "2026-08-14T12:00:00.000Z",
  updated_at: "2026-08-14T12:00:00.000Z",
};
const resolvedPersistedAttempt = resolveSystemDesignAttemptQuery({ data: validPersistedAttempt, error: null });
check(resolvedPersistedAttempt?.id === canonicalAttemptId && resolvedPersistedAttempt.document.functional_requirements.length === 0, "a valid owner-scoped row resolves to its validated attempt");
check(resolveSystemDesignAttemptQuery({ data: null, error: null }) === null, "a genuine zero-row result remains a not-found null");

const unavailableMessage = "Your private System Design attempt data is temporarily unavailable. Please try again.";
function captureUnavailable(result) {
  try {
    resolveSystemDesignAttemptQuery(result);
  } catch (error) {
    return error;
  }
  return null;
}
for (const [label, result, forbiddenDetail] of [
  ["query error", { data: null, error: { message: "relation system_design_attempts timed out" } }, "system_design_attempts"],
  ["error with row", { data: validPersistedAttempt, error: { message: `owner ${validPersistedAttempt.user_id} failed` } }, validPersistedAttempt.user_id],
  ["missing error member", { data: validPersistedAttempt }, canonicalAttemptId],
  ["invalid persisted document", { data: { ...validPersistedAttempt, document: { ...blank, unsupported_private_field: "do not expose" } }, error: null }, "unsupported_private_field"],
]) {
  const error = captureUnavailable(result);
  check(error instanceof PrivateDataUnavailableError, `${label} raises the shared private-data-unavailable error`);
  check(error?.message === unavailableMessage && error?.name === "PrivateDataUnavailableError", `${label} uses the exact stable System Design attempt message`);
  check(!error?.message.includes(forbiddenDetail), `${label} does not expose database, owner, or persisted-document details`);
}
check(SYSTEM_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN === "System Design attempt", "attempt errors use the fixed sanitized private-data domain");

const form = new FormData();
form.set("functional_requirements", "Create link\nResolve link");
form.set("non_functional_requirements", "p99 < 100ms");
form.set("capacity_assumptions", "DAU | 10M | users/day");
form.set("capacity_calculations", "Average RPS | 10M / 86400 | 116 RPS");
form.set("apis", "POST | /v1/links | Create short link");
form.set("data_models", "Link | id,url | keyed by id");
form.set("high_level_design", "Client to API to cache and database.");
form.set("deep_dives", "Key generation"); form.set("bottlenecks", "Hot keys");
form.set("failure_modes", "Cache outage | Higher latency | Bypass with limits");
form.set("tradeoffs", "Random keys | Low coordination | Collision handling");
form.set("follow_ups", "How would analytics change the design?"); form.set("final_review_notes", "State assumptions sooner.");
const parsed = attemptDocumentFromForm(form);
check(parsed.ok, "form converts to validated structured document");
check(parsed.ok && parsed.data.functional_requirements.length === 2, "newline requirements stay independent");
check(parsed.ok && parsed.data.capacity.assumptions[0].unit === "users/day", "capacity unit is preserved");
check(parsed.ok && parsed.data.apis[0].method === "POST", "API method is structured");
check(parsed.ok && parsed.data.failure_modes[0].mitigation === "Bypass with limits", "failure mitigation is structured");

const continueCatalog = [{ id: "caching", itemType: "concept", title: "Caching", href: "/system-design/caching/caching" }];
const draftTarget = chooseSystemDesignContinueTarget([
  { id: "older", problem_id: "url-shortener", title: "Older review", status: "review", confidence: null, updated_at: "2026-08-13T00:00:00Z" },
  { id: "draft", problem_id: "url-shortener", title: "Active draft", status: "draft", confidence: null, updated_at: "2026-08-12T00:00:00Z" },
], [], continueCatalog);
check(draftTarget?.kind === "attempt" && draftTarget.href.endsWith("/draft"), "Continue prioritizes a draft before review attempts");
const reviewTarget = chooseSystemDesignContinueTarget([], [{ item_id: "caching", item_type: "concept", status: "review", confidence: "low", last_practiced_at: "2026-08-14T00:00:00Z", updated_at: "2026-08-14T00:00:00Z" }], continueCatalog);
check(reviewTarget?.kind === "item" && reviewTarget.title === "Review Caching", "Continue falls back to an item marked Needs review");
const gapTarget = chooseSystemDesignContinueTarget([], [], continueCatalog);
check(gapTarget?.kind === "item" && gapTarget.title === "Start with Caching", "Continue has a deterministic curriculum-gap fallback");

check(migration.includes("system_design_item_catalog"), "migration creates canonical catalog");
check(migration.includes("system_design_item_progress"), "migration creates private progress");
check(migration.includes("system_design_attempts"), "migration creates attempts");
check(migration.includes("foreign key (application_id, user_id)"), "attempt application uses composite ownership");
check(migration.includes("primary key (id, item_type)"), "shared concept and problem IDs remain independent");
check(migration.includes("item_type = 'design_problem'"), "attempt RPC rejects concept IDs");
check(migration.includes("auth.uid()"), "database derives authenticated owner");
check(migration.includes("revision = target_expected_revision"), "attempt saves use optimistic concurrency");
check(migration.includes("octet_length(document::text) <= 200000"), "JSONB size is bounded in database");
check(migration.includes("jsonb_typeof(document->'capacity'->'calculations') = 'array'"), "database validates calculation shape");
check(migration.includes("revoke all on table public.system_design_item_catalog, public.system_design_item_progress, public.system_design_attempts"), "table grants start closed");
check(migration.includes("grant select, delete on table public.system_design_item_progress to authenticated"), "authenticated owners can clear progress without bypassing saves");
check(migration.includes("grant select on table public.system_design_attempts to authenticated"), "attempt table access remains read only");
check(!migration.includes("grant insert on table public.system_design_attempts"), "attempt writes cannot bypass RPCs");
check(migration.includes("system_design_attempts_user_problem_idx"), "attempt history has a covering lookup index");
check(migration.includes("system_design_progress_user_bookmarked_idx_v2"), "bookmark lookup is indexed");
check(validationMigration.includes("system_design_json_string_array_valid"), "database validates nested string arrays and bounds");
check(validationMigration.includes("system_design_json_object_array_valid"), "database validates structured row keys and string values");
check(validationMigration.includes("jsonb_object_keys(document)"), "database rejects unsupported top-level document keys");

check(actions.includes("canonicalSystemDesignProblemIds.has"), "server action validates problem catalog");
check(actions.includes("target_expected_revision"), "server action forwards concurrency token");
check(actions.includes("getAuthenticatedActor"), "server actions derive actor from session");
check(actions.includes("attemptDocumentFromForm"), "attempt document is server-validated");
for (const actionName of ["saveSystemDesignProgressAction", "createSystemDesignAttemptAction", "saveSystemDesignAttemptAction", "deleteSystemDesignAttemptAction"]) {
  const start = actions.indexOf(`export async function ${actionName}`);
  const end = actions.indexOf("\nexport async function ", start + 1);
  const body = actions.slice(start, end < 0 ? undefined : end);
  check(start >= 0 && body.indexOf("isAccountPlatformAvailable()") < body.indexOf("getAuthenticatedActor()"), `${actionName} must reject disabled account persistence before resolving an actor`);
}
check(actions.includes('message: "Account persistence is not available in this configuration."'), "disabled progress and attempt saves return an explicit configuration error");
check(actions.includes('redirect(`/signin?next=${encodeURIComponent(`/system-design/problems/${problemId}`)}`)') && actions.includes('redirect("/signin?next=/system-design/practice")'), "enabled signed-out attempt actions preserve their sign-in handoffs");
check((queries.match(/if \(!accountPlatformAvailable\) return \{ accountPlatformAvailable, signedIn: false as const/g) ?? []).length === 3, "workspace, item, and problem queries expose a distinct disabled-account state");
check((queries.match(/if \(!actor\) return \{ accountPlatformAvailable, signedIn: false as const/g) ?? []).length === 3, "enabled signed-out queries preserve account availability separately from authentication");
check((queries.match(/accountPlatformAvailable,/g) ?? []).length >= 9 && queries.includes("signedIn: true as const"), "authenticated query results preserve the available state alongside account-backed data");
check(queries.indexOf("if (!isAccountPlatformAvailable()) return null;") < queries.indexOf("const actor = await getAuthenticatedActor();", queries.indexOf("getSystemDesignAttempt")), "private attempt lookup fails closed before authentication when accounts are disabled");
check(attemptQuery.includes("if (result.error !== null) unavailable();") && attemptQuery.indexOf("if (result.error !== null) unavailable();") < attemptQuery.indexOf("if (result.data === null) return null;"), "attempt resolver gives every non-null or malformed error state precedence over rows while preserving genuine null");
check(attemptQuery.includes("if (!isPersistedAttemptRow(result.data)) unavailable();") && attemptQuery.includes("return asSystemDesignAttempt(result.data) ?? unavailable();"), "attempt resolver validates both the persisted row and structured document before returning private data");
check(attemptQueryBody.includes("if (!isSystemDesignAttemptId(attemptId))") && attemptQueryBody.includes("if (!actor) throw new PrivateDataUnavailableError") && attemptQueryBody.indexOf("if (!isSystemDesignAttemptId(attemptId))") < attemptQueryBody.indexOf("getAuthenticatedActor()"), "attempt query rejects malformed IDs and missing actors as unavailable before database access");
check(attemptQueryBody.includes('const result = await actor.supabase.from("system_design_attempts").select("*").eq("id", attemptId).eq("user_id", actor.user.id).maybeSingle()'), "attempt query retains the full result and scopes the lookup by both attempt and owner ID");
check(attemptQueryBody.includes("return resolveSystemDesignAttemptQuery(result)"), "attempt query delegates data/error interpretation to the strict resolver");
check(editor.includes("beforeunload"), "editor protects browser navigation with unsaved work");
check(editor.includes("Unsaved changes"), "editor exposes dirty state");
check(editor.includes("Save attempt"), "editor uses explicit save");
check(editor.includes("Capacity assumptions and calculations"), "editor separates capacity work");
check(editor.includes("This worksheet is private"), "editor states privacy boundary");
check(home.includes("Statuses and confidence are self-reported"), "workspace avoids fake readiness");
check(home.includes("name=\"application\""), "workspace filters preserve application context");
check(home.includes("chooseSystemDesignContinueTarget"), "workspace uses documented deterministic Continue selection");
check(home.includes("Concept progress"), "workspace derives category-level concept progress");
check(home.includes('details className="sd-practice-topic-progress"'), "category progress stays in a compact disclosure below filters");
check(home.includes("slice(0, 80)"), "workspace bounds catalog rendering");
check(home.indexOf("if (!accountPlatformAvailable)") < home.indexOf("const state = await getSystemDesignWorkspaceState"), "My Practice renders its public disabled state without invoking account queries");
check(home.includes("Public System Design practice remains available") && home.includes('href="/system-design/problems"') && home.includes('href="/system-design/start-here/introduction"'), "disabled My Practice keeps System Design learning and public problems available");
check(home.includes('href="/signin?next=/system-design/practice"'), "enabled signed-out My Practice retains its private-workspace sign-in handoff");
check(practiceLibrary.includes("withApplication(item.slug)"), "public problem library preserves owned application context");
check(practiceLibrary.includes("accountPlatformAvailable: boolean") && practiceLibrary.includes("Public practice remains available.") && practiceLibrary.includes('href="/signin?next=/system-design/practice"'), "problem library distinguishes disabled accounts from enabled signed-out visitors");
check(problemPanel.includes("state.accountPlatformAvailable") && problemPanel.includes("Private design attempts are unavailable in this configuration") && problemPanel.includes("Sign in to practice"), "problem practice panel renders disabled, enabled signed-out, and authenticated attempt states");
check(privateProgress.includes("accountPlatformAvailable={state.accountPlatformAvailable}") && progressEditor.includes("Account progress unavailable") && progressEditor.includes("Sign in to track progress"), "lesson progress distinguishes disabled accounts from enabled signed-out visitors");
check(sidebar.includes("accountPlatformAvailable: boolean") && sidebar.includes("...(accountPlatformAvailable ?") && sidebar.includes('label: "My Practice"'), "sidebar exposes My Practice only when the account platform is available");
check(contentRoute.includes("accountPlatformAvailable={state.accountPlatformAvailable}") && lesson.includes("accountPlatformAvailable={accountPlatformAvailable}") && plan.includes("accountPlatformAvailable={accountPlatformAvailable}"), "public problem, lesson, and plan routes forward server-derived account availability");
check(editor.includes('role="status"'), "attempt save and error feedback is announced");
check(editor.includes("<fieldset"), "structured attempt controls have a labeled semantic group");
check(!editor.includes("<main>"), "attempt editor does not nest a main landmark");
check(problemPanel.includes("Each attempt remains independent"), "problem UI explains attempt independence");
check(problemPanel.includes("ConfirmAction"), "attempt deletion requires confirmation");
check(route.includes("attempt.problem_id !== slug"), "route prevents cross-problem attempt spoofing");
check(route.includes("requireMemberProfile"), "attempt editor requires member auth");
check(attemptRouteBody.indexOf("if (!isSystemDesignAttemptId(attemptId)) notFound()") >= 0 && attemptRouteBody.indexOf("if (!isSystemDesignAttemptId(attemptId)) notFound()") < attemptRouteBody.indexOf("requireMemberProfile(") && attemptRouteBody.indexOf("if (!isSystemDesignAttemptId(attemptId)) notFound()") < attemptRouteBody.indexOf("getSystemDesignAttempt(attemptId)"), "attempt route rejects malformed IDs before its member guard and private queries");
check(attemptRouteBody.includes("if (!attempt || attempt.problem_id !== slug || !problem || !workspace.signedIn) notFound()"), "attempt route preserves genuine null and problem-mismatch not-found behavior");
check(!attemptRouteBody.includes("catch") && !attemptRouteBody.includes("try {"), "attempt route does not convert private query failures into false not-found responses");
check(dashboard.includes("getSystemDesignDashboardSummary"), "dashboard reads real persistent summary");
check(dashboard.includes("application=${systemDesignRound.application.id}"), "dashboard passes exact application context");
check(application.includes("/system-design/practice?application=${application.id}"), "application detail passes exact context");
check(styles.includes("@media (max-width: 720px)"), "workspace has compact viewport treatment");
check(!styles.slice(styles.indexOf("/* Phase 5"), styles.indexOf("/* Phase 5") + 18000).includes("linear-gradient"), "Phase 5 UI adds no decorative gradients");

console.log(`System Design workspace qualification passed (${checks} checks).`);
