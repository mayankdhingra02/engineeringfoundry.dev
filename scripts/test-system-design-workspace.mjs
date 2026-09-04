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
import {
  SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION,
  SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD,
  SYSTEM_DESIGN_PROGRESS_CONFLICT_ERROR,
  SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD,
  SYSTEM_DESIGN_PROGRESS_INVALID_INPUT_ERROR,
  SYSTEM_DESIGN_PROGRESS_PERSISTENCE_ERROR,
  SYSTEM_DESIGN_PROGRESS_SAVED_MESSAGE,
  isCanonicalSystemDesignProgressRevision,
  parseSystemDesignItemProgressActionInput,
  parseSystemDesignItemProgressSaveResult,
} from "../lib/system-design/item-progress-action-input.ts";
import { PrivateDataUnavailableError } from "../lib/persistence/errors.ts";

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };
const migration = readFileSync(new URL("../supabase/migrations/202608140008_create_system_design_workspace.sql", import.meta.url), "utf8");
const validationMigration = readFileSync(new URL("../supabase/migrations/202608140010_enforce_system_design_attempt_document_shape.sql", import.meta.url), "utf8");
const progressRevisionMigration = readFileSync(new URL("../supabase/migrations/202609030006_save_system_design_item_progress_if_revision.sql", import.meta.url), "utf8");
const databaseTest = readFileSync(new URL("../supabase/tests/database/system_design_workspace.test.sql", import.meta.url), "utf8");
const persistenceQualifier = readFileSync(new URL("../scripts/qualify-persistence-local.mjs", import.meta.url), "utf8");
const securityQualifier = readFileSync(new URL("../scripts/qualify-security-local.mjs", import.meta.url), "utf8");
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

function sqlFunction(source, name) {
  const start = source.indexOf(`function public.${name}(`);
  const end = source.indexOf("$$;", start);
  return start < 0 || end < 0 ? "" : source.slice(start, end);
}

function progressForm(overrides = {}) {
  const values = {
    item_id: "estimation",
    item_type: "concept",
    status: "reviewed",
    confidence: "",
    [SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD]: "true",
    notes: "State the assumptions.\nKeep the review private.",
    [SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD]: SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION,
    ...overrides,
  };
  const form = new FormData();
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) form.append(name, item);
    } else {
      form.set(name, value);
    }
  }
  return form;
}

const parseProgress = (form) => parseSystemDesignItemProgressActionInput(form, canonicalSystemDesignItemIds);

check(canonicalSystemDesignConceptIds.size === 146, "published concept catalog stays canonical");
check(canonicalSystemDesignProblemIds.size === 27, "published problem catalog stays canonical");
check(canonicalSystemDesignItemIds.size === 173, "namespaced combined catalog preserves shared concept/problem IDs");
check(canonicalSystemDesignProblemIds.has("url-shortener"), "foundation problem is canonical");
check(canonicalSystemDesignConceptIds.has("capacity-estimation") === false, "route slugs cannot spoof concept IDs");
check(canonicalSystemDesignConceptIds.has("estimation"), "durable concept ID is canonical");

const canonicalProgressRevision = "2026-09-03T21:15:30.123456+00:00";
const absentProgress = parseProgress(progressForm());
check(absentProgress.ok && absentProgress.value.expectAbsent && absentProgress.value.expectedUpdatedAt === null, "an exact absent sentinel creates a canonical insert expectation");
check(absentProgress.ok && absentProgress.value.confidence === null && absentProgress.value.bookmarked === false, "explicit empty confidence and an absent checked value preserve legitimate null and false states");
check(absentProgress.ok && absentProgress.value.notes === "State the assumptions.\nKeep the review private.", "multiline private progress notes preserve their canonical content");
const existingProgress = parseProgress(progressForm({
  item_id: "url-shortener",
  item_type: "design_problem",
  status: "comfortable",
  confidence: "high",
  bookmarked: "true",
  notes: "  Preserve this note.  ",
  [SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD]: canonicalProgressRevision,
}));
check(existingProgress.ok && !existingProgress.value.expectAbsent && existingProgress.value.expectedUpdatedAt === canonicalProgressRevision, "a persisted database timestamp becomes an exact compare-and-swap revision");
check(existingProgress.ok && existingProgress.value.itemType === "design_problem" && existingProgress.value.bookmarked && existingProgress.value.notes === "Preserve this note.", "valid design-problem progress normalizes only surrounding note whitespace");
for (const status of ["not_started", "reviewed", "review", "comfortable"]) {
  const parsedStatus = parseProgress(progressForm({ status }));
  check(parsedStatus.ok && parsedStatus.value.status === status, `canonical progress status ${status} is accepted`);
}
for (const confidence of ["", "low", "medium", "high"]) {
  const parsedConfidence = parseProgress(progressForm({ confidence }));
  check(parsedConfidence.ok && parsedConfidence.value.confidence === (confidence || null), `canonical confidence ${confidence || "none"} is accepted`);
}
for (const revision of [
  "2026-09-03T21:15:30Z",
  "2026-09-03T21:15:30.1Z",
  canonicalProgressRevision,
  "2026-09-03T16:15:30.123456-05:00",
]) check(isCanonicalSystemDesignProgressRevision(revision), `canonical database revision ${revision} is accepted`);

const fileValue = new File(["private"], "private.txt", { type: "text/plain" });
for (const [label, input] of [
  ["null root", null],
  ["plain-object root", { item_id: "estimation" }],
  ["array root", []],
]) check(!parseProgress(input).ok, `${label} progress input is rejected`);
for (const field of ["item_id", "item_type", "status", "confidence", SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD, "notes", SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD]) {
  check(!parseProgress(progressForm({ [field]: undefined })).ok, `missing ${field} is rejected`);
  check(!parseProgress(progressForm({ [field]: [field === "notes" ? "one" : "reviewed", field === "notes" ? "two" : "reviewed"] })).ok, `duplicate ${field} is rejected`);
  check(!parseProgress(progressForm({ [field]: fileValue })).ok, `file-valued ${field} is rejected`);
}
for (const [label, override] of [
  ["unknown field", { surprise: "true" }],
  ["wrong-case field", { Status: "reviewed" }],
  ["unknown concept", { item_id: "fabricated-concept" }],
  ["valid slug with wrong type", { item_id: "estimation", item_type: "design_problem" }],
  ["wrong-case item ID", { item_id: "Estimation" }],
  ["wrong-case item type", { item_type: "Concept" }],
  ["wrong-case status", { status: "Reviewed" }],
  ["unknown status", { status: "mastered" }],
  ["wrong-case confidence", { confidence: "High" }],
  ["unknown confidence", { confidence: "certain" }],
  ["missing bookmark sentinel", { [SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD]: undefined }],
  ["false bookmark sentinel", { [SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD]: "false" }],
  ["checkbox false string", { bookmarked: "false" }],
  ["duplicate checkbox", { bookmarked: ["true", "true"] }],
  ["empty revision", { [SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD]: "" }],
  ["wrong-case absent sentinel", { [SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD]: "ABSENT" }],
  ["whitespace revision", { [SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD]: ` ${canonicalProgressRevision}` }],
  ["NUL note", { notes: "private\u0000note" }],
  ["C1 note", { notes: "private\u0085note" }],
  ["overlong Unicode note", { notes: "😀".repeat(10_001) }],
]) check(!parseProgress(progressForm(override)).ok, `${label} is rejected before persistence`);
check(parseProgress(progressForm({ notes: "😀".repeat(10_000) })).ok, "the 10,000 Unicode-code-point notes boundary is accepted");
check(parseProgress(progressForm({ $ACTION_ID_test: "framework metadata" })).ok, "framework-owned action metadata does not invalidate a canonical form");
for (const revision of [
  "0000-09-03T21:15:30Z",
  "2026-00-03T21:15:30Z",
  "2026-13-03T21:15:30Z",
  "2026-02-29T21:15:30Z",
  "2024-02-30T21:15:30Z",
  "2026-09-03T24:00:00Z",
  "2026-09-03T21:60:00Z",
  "2026-09-03T21:15:60Z",
  "2026-09-03T21:15:30",
  "2026-09-03 21:15:30Z",
  "2026-09-03T21:15:30.1234567Z",
  "2026-09-03T21:15:30+14:01",
  "2026-09-03T21:15:30+15:00",
]) check(!isCanonicalSystemDesignProgressRevision(revision) && !parseProgress(progressForm({ [SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD]: revision })).ok, `noncanonical or impossible revision ${revision} is rejected`);

check(SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD === "expected_updated_at" && SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION === "absent" && SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD === "bookmarked_present", "progress parser exports stable revision and presence field names");
check(SYSTEM_DESIGN_PROGRESS_INVALID_INPUT_ERROR === "Review the progress fields and try again.", "malformed progress input uses stable curated copy");
check(SYSTEM_DESIGN_PROGRESS_CONFLICT_ERROR === "This progress record may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.", "stale progress uses exact non-destructive conflict copy");
check(SYSTEM_DESIGN_PROGRESS_PERSISTENCE_ERROR === "We couldn't save this progress update." && SYSTEM_DESIGN_PROGRESS_SAVED_MESSAGE === "Progress saved.", "persistence failure and success copy remain stable");
check(parseSystemDesignItemProgressSaveResult([], "estimation", "concept", canonicalSystemDesignItemIds).status === "conflict", "an exact zero-row mutation result is the only conflict outcome");
const savedProgressResult = parseSystemDesignItemProgressSaveResult(
  [{ item_id: "estimation", item_type: "concept", updated_at: canonicalProgressRevision }],
  "estimation",
  "concept",
  canonicalSystemDesignItemIds,
);
check(savedProgressResult.status === "saved" && savedProgressResult.updatedAt === canonicalProgressRevision, "one exact correlated canonical row advances the client revision");
for (const [label, result] of [
  ["null", null],
  ["object", {}],
  ["two rows", [{ item_id: "estimation", item_type: "concept", updated_at: canonicalProgressRevision }, { item_id: "estimation", item_type: "concept", updated_at: canonicalProgressRevision }]],
  ["nonobject row", ["estimation"]],
  ["missing field", [{ item_id: "estimation", item_type: "concept" }]],
  ["extra field", [{ item_id: "estimation", item_type: "concept", updated_at: canonicalProgressRevision, user_id: "private" }]],
  ["wrong item", [{ item_id: "caching", item_type: "concept", updated_at: canonicalProgressRevision }]],
  ["wrong type", [{ item_id: "estimation", item_type: "design_problem", updated_at: canonicalProgressRevision }]],
  ["fabricated catalog row", [{ item_id: "fabricated", item_type: "concept", updated_at: canonicalProgressRevision }]],
  ["invalid revision", [{ item_id: "estimation", item_type: "concept", updated_at: "2026-02-29T00:00:00Z" }]],
]) check(parseSystemDesignItemProgressSaveResult(result, "estimation", "concept", canonicalSystemDesignItemIds).status === "invalid", `${label} progress result cannot claim a save or conflict`);

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

const fullProgressFunction = sqlFunction(progressRevisionMigration, "save_system_design_item_progress_if_revision");
const quickProgressFunction = sqlFunction(progressRevisionMigration, "set_system_design_item_quick_progress");
const legacyProgressFunction = sqlFunction(progressRevisionMigration, "save_system_design_item_progress");
const progressRevisionTrigger = sqlFunction(progressRevisionMigration, "set_system_design_item_progress_updated_at");
for (const [name, source] of [
  ["revision-checked full save", fullProgressFunction],
  ["status-only quick save", quickProgressFunction],
]) {
  check(source.includes("security definer") && source.includes("set search_path = ''") && source.includes("auth.uid()"), `${name} derives its owner inside a hardened database boundary`);
  check(source.includes("pg_advisory_xact_lock") && source.includes("hashtext(current_user_id::text)") && source.includes("hashtext(target_item_type || ':' || target_item_id)"), `${name} serializes the same owner, type, and item identity`);
  check(source.includes("system_design_item_catalog") && source.includes("target_item_type"), `${name} validates the exact canonical item and type`);
}
check(fullProgressFunction.includes("target_expect_absent") && fullProgressFunction.includes("target_expected_updated_at"), "full saves require one explicit absent or persisted revision shape");
check(fullProgressFunction.includes("on conflict on constraint system_design_item_progress_pkey do nothing"), "an absent-revision save cannot overwrite an intervening insert");
check(fullProgressFunction.includes("progress.user_id = current_user_id") && fullProgressFunction.includes("progress.item_id = target_item_id") && fullProgressFunction.includes("progress.item_type = target_item_type") && fullProgressFunction.includes("progress.updated_at = target_expected_updated_at"), "existing full saves use an owner-, type-, item-, and revision-scoped compare-and-swap");
for (const assignment of ["status = target_status", "confidence = target_confidence", "bookmarked = target_bookmarked", "notes = normalized_notes"]) check(fullProgressFunction.includes(assignment), `a winning full save persists its coherent ${assignment.split(" =")[0]} snapshot`);
check(progressRevisionTrigger.includes("greatest(") && progressRevisionTrigger.includes("clock_timestamp()") && progressRevisionTrigger.includes("old.updated_at + interval '1 microsecond'"), "the edit revision advances monotonically after every winning update");
check(quickProgressFunction.includes("status = excluded.status") && quickProgressFunction.includes("where public.system_design_item_progress.status is distinct from excluded.status"), "quick saves change only a desired status and keep identical requests idempotent");
for (const richField of ["confidence =", "bookmarked =", "notes ="]) check(!quickProgressFunction.includes(richField), `quick saves cannot overwrite unrelated ${richField.slice(0, -2)}`);
check(legacyProgressFunction.includes("Revision-checked System Design progress saving is required") && legacyProgressFunction.includes("errcode = '0A000'"), "the legacy whole-row signature remains a stable migration-first fail-safe");
for (const signature of [
  "save_system_design_item_progress_if_revision(text,text,boolean,timestamptz,text,text,boolean,text)",
  "set_system_design_item_quick_progress(text,text,text)",
]) check(progressRevisionMigration.includes(`revoke all on function public.${signature} from public, anon, authenticated`) && progressRevisionMigration.includes(`grant execute on function public.${signature} to authenticated`), `${signature} denies public and anonymous callers while granting the reviewed authenticated signature`);
check(progressRevisionMigration.includes("grant execute on function public.save_system_design_item_progress(text,text,text,text,boolean,text) to authenticated"), "authenticated old clients reach the stable legacy failure instead of an ambiguous missing-function error");

for (const marker of [
  "a stale full edit cannot overwrite the winning save",
  "quick status mutation preserves confidence",
  "quick status mutation preserves bookmark state",
  "quick status mutation preserves private notes",
  "a no-op quick status does not advance the edit revision",
  "absent-revision full save reports conflict after import creates the row",
  "foreign and missing owner progress are indistinguishable revision conflicts",
  "legacy whole-row saves fail without mutation",
]) check(databaseTest.includes(marker), `System Design pgTAP lacks ${marker}`);
check(databaseTest.includes("plan(85)"), "System Design pgTAP plan covers the frozen revision, quick-save, privacy, and legacy boundary");
for (const marker of [
  "legacy System Design whole-row saves fail safely",
  "desired System Design status updates preserve rich fields and no-op revisions",
  "concurrent stale System Design full saves commit exactly one winner",
  "concurrent System Design full and desired-status saves preserve a coherent rich snapshot",
  "concurrent browser import and absent-revision System Design save commit one coherent winner",
  "concurrent absent System Design import and desired status settle on the desired status",
  "concurrent absent System Design full and desired status preserve either coherent rich outcome",
]) check(persistenceQualifier.includes(marker), `persistence qualification lacks ${marker}`);
for (const marker of [
  "anonymous callers cannot invoke insert-only browser import RPCs or System Design revision and quick saves",
]) check(securityQualifier.includes(marker), `security qualification lacks ${marker}`);

check(actions.includes("canonicalSystemDesignProblemIds.has"), "server action validates problem catalog");
check(actions.includes("target_expected_revision"), "server action forwards concurrency token");
check(actions.includes("getAuthenticatedActor"), "server actions derive actor from session");
check(actions.includes("attemptDocumentFromForm"), "attempt document is server-validated");
const progressActionStart = actions.indexOf("export async function saveSystemDesignProgressAction");
const progressActionEnd = actions.indexOf("\nexport async function ", progressActionStart + 1);
const progressActionBody = actions.slice(progressActionStart, progressActionEnd);
const progressParserIndex = progressActionBody.indexOf("parseSystemDesignItemProgressActionInput(");
const progressInvalidIndex = progressActionBody.indexOf("if (!parsed.ok)");
const progressAvailabilityIndex = progressActionBody.indexOf("isAccountPlatformAvailable()");
const progressActorIndex = progressActionBody.indexOf("getAuthenticatedActor()");
const progressRpcIndex = progressActionBody.indexOf('rpc(\n    "save_system_design_item_progress_if_revision"');
check(progressActionStart >= 0 && progressParserIndex >= 0 && progressParserIndex < progressInvalidIndex && progressInvalidIndex < progressAvailabilityIndex && progressAvailabilityIndex < progressActorIndex && progressActorIndex < progressRpcIndex, "full progress parses and returns malformed runtime input before availability, actor, or persistence work");
for (const argument of ["target_item_id: input.itemId", "target_item_type: input.itemType", "target_expect_absent: input.expectAbsent", "target_expected_updated_at: input.expectedUpdatedAt", "target_status: input.status", "target_confidence: input.confidence", "target_bookmarked: input.bookmarked", "target_notes: input.notes"]) check(progressActionBody.includes(argument), `full progress RPC is missing ${argument}`);
check(progressActionBody.indexOf("if (error)") < progressActionBody.indexOf("parseSystemDesignItemProgressSaveResult("), "RPC errors cannot be reclassified as zero-row conflicts");
check(progressActionBody.includes('outcome.status === "conflict"') && progressActionBody.includes("return failed(SYSTEM_DESIGN_PROGRESS_CONFLICT_ERROR, true)"), "zero rows become a stable conflict without claiming persistence");
check(progressActionBody.includes('outcome.status === "invalid"') && progressActionBody.includes("SYSTEM_DESIGN_PROGRESS_PERSISTENCE_ERROR"), "malformed success data becomes a sanitized persistence failure");
check(progressActionBody.includes("revision: outcome.updatedAt") && progressActionBody.indexOf("refreshSystemDesign(") < progressActionBody.indexOf("analytics:"), "only a validated one-row success advances revision, refreshes, and exposes analytics");
check(!progressActionBody.includes('rpc("save_system_design_item_progress"'), "production full progress cannot call the legacy whole-row RPC");
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
for (const marker of [
  "const initialRevision = progress?.updated_at ?? SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION",
  "name={SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD}",
  "value={state.revision ?? initialRevision}",
  "name={SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD}",
  'value="true"',
]) check(progressEditor.includes(marker), `progress editor lacks its explicit revision/presence contract: ${marker}`);
const progressSubmitStart = progressEditor.indexOf("const submit = (");
const progressSubmitEnd = progressEditor.indexOf("\n  const liveStatus", progressSubmitStart);
const progressSubmitBody = progressEditor.slice(progressSubmitStart, progressSubmitEnd);
const preventDefaultIndex = progressSubmitBody.indexOf("event.preventDefault()");
const duplicateGuardIndex = progressSubmitBody.indexOf("if (submissionPending.current) return");
const pendingClaimIndex = progressSubmitBody.indexOf("submissionPending.current = true");
const formSnapshotIndex = progressSubmitBody.indexOf("new FormData(event.currentTarget)");
const transitionIndex = progressSubmitBody.indexOf("startTransition(() => action(formData))");
check(preventDefaultIndex >= 0 && preventDefaultIndex < duplicateGuardIndex && duplicateGuardIndex < pendingClaimIndex && pendingClaimIndex < formSnapshotIndex && formSnapshotIndex < transitionIndex, "manual progress submission preserves the live draft and synchronously guards duplicate snapshots before transition dispatch");
check(progressEditor.includes("if (!pending) submissionPending.current = false") && progressEditor.includes("submissionPending.current = false;\n  }, []);"), "the duplicate guard resets only after settlement and on unmount");
check(progressEditor.includes("<form action={action} onSubmit={submit} aria-busy={pending}>") && progressEditor.includes('aria-disabled={pending}'), "progress keeps its no-JavaScript action while exposing guarded pending semantics without removing trigger focus");
check(!/(?:^|\s)disabled=\{pending\}/m.test(progressEditor) && !progressEditor.includes("key={state") && !progressEditor.includes(".focus()"), "progress pending/conflict handling neither natively disables, remounts, nor claims focus from an edited draft");
check((progressEditor.match(/aria-atomic="true"/g) ?? []).length === 1 && progressEditor.includes('role={liveStatus === "error" ? "alert" : "status"}') && progressEditor.includes('aria-live={liveStatus === "error" ? "assertive" : "polite"}'), "one atomic live region announces pending, success, and error/conflict outcomes with appropriate urgency");
check(progressEditor.includes('const liveStatus = pending ? "pending" : state.status') && progressEditor.includes('pending ? "Saving progress…" : state.message'), "a retry announces pending instead of retaining stale assertive conflict styling");
check(progressEditor.includes("latestHref: string") && progressEditor.includes('!pending && state.conflict') && progressEditor.includes('<Link href={latestHref} target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link>'), "only a settled conflict exposes the supplied latest-version link with safe new-tab attributes");
check(home.includes("latestHref={item.href}"), "the practice catalog correlates each progress editor with that canonical item's existing public href");
const privateLatestHrefIndex = privateProgress.indexOf("const latestHref =");
const privateQueryIndex = privateProgress.indexOf("getSystemDesignItemState(");
check(
  privateProgress.includes('canonicalSystemDesignProblemIds.has(canonicalId)') &&
    privateProgress.includes('`/system-design/problems/${canonicalId}`') &&
    privateProgress.includes("systemDesignTopicManifest.find((item) => item.published && item.id === canonicalId)?.slug ?? null") &&
    privateProgress.includes("if (!latestHref) return null;") &&
    privateProgress.includes("latestHref={latestHref}") &&
    privateLatestHrefIndex >= 0 &&
    privateLatestHrefIndex < privateQueryIndex,
  "public lesson progress resolves a published canonical concept/problem href before private queries and passes only that correlated href to the editor",
);
check(progressEditor.includes('const key = `${state.analytics.itemType}:${state.analytics.itemId}:${state.analytics.recordedStatus}`') && progressEditor.includes("}, [state.analytics]);") && !progressEditor.includes("state.analytics.recordedStatus}:${state.revision"), "account analytics remain tied to the confirmed activity outcome without repeating solely because a revision advanced");
check(styles.includes('.sd-private-progress .button[aria-disabled="true"]') && styles.includes('.sd-private-progress .button[aria-disabled="true"]:hover'), "progress pending styling is scoped and hover-neutral while focus stays on the submit control");
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
