import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  emptyLocalPreparationProgress,
  migrateLegacySystemDesignProgress,
  parseLocalPreparationProgress,
  preparationActivityDaysThisWeek,
  recordLocalProgress,
  saveLocalPlan,
} from "../lib/preparation-progress/local.ts";
import {
  choosePreparationContinuation,
  createUnavailableAccountPreparationContinuationState,
  localContinuationCandidates,
  normalizeAccountPreparationContinuationResponse,
  resolveAccountPreparationContinuationState,
} from "../lib/preparation-progress/continuation.ts";
import {
  preparationActivityKey,
  resolvePreparationActivitySaveOutcome,
} from "../lib/preparation-progress/activity-save.ts";
import { resolveStudyPlanSaveOutcome, studyPlanId } from "../lib/preparation-progress/plan-save.ts";
import {
  parsePreparationImportError,
  parsePreparationImportRequest,
  parsePreparationImportResponse,
  preparationImportStatusMessage,
  PREPARATION_IMPORT_INVALID_MESSAGE,
  PREPARATION_IMPORT_UNAUTHENTICATED_MESSAGE,
  PREPARATION_IMPORT_UNAVAILABLE_MESSAGE,
  reconcilePreparationImport,
} from "../lib/preparation-progress/import.ts";

const catalog = {
  dsa: [{ id: "two-sum", title: "Two Sum", href: "/dsa/questions/two-sum" }, { id: "valid-parentheses", title: "Valid Parentheses", href: "/dsa/questions/valid-parentheses" }],
  "system-design": [{ id: "introduction", title: "Introduction", href: "/system-design/start-here/introduction" }],
  "ml-design": [{ id: "recommendation-system", title: "Recommendation System", href: "/ml-design/recommendation-system" }],
  behavioral: [{ id: "beh-conflict", title: "Navigating conflict", href: "/behavioral?question=navigating-conflict" }],
};

assert.deepEqual(parseLocalPreparationProgress("not-json"), emptyLocalPreparationProgress(), "corrupt storage must safely reset");
assert.deepEqual(parseLocalPreparationProgress({ version: 2, items: [], plans: [] }), emptyLocalPreparationProgress(), "unknown schema versions must not be trusted");
assert.deepEqual(parseLocalPreparationProgress({ version: 1, items: [{ track: "dsa", itemId: "two-sum", status: "completed", updatedAt: 1, notes: "private" }], plans: [] }).items, [{ track: "dsa", itemId: "two-sum", status: "completed", updatedAt: 1 }], "local state must retain only bounded navigation/completion fields");
assert.deepEqual(migrateLegacySystemDesignProgress({ "topic:introduction": "completed", "practice:url-shortener": "in-progress", "topic:invalid item": "completed" }), [
  { track: "system-design", itemId: "introduction", status: "completed", updatedAt: 0 },
  { track: "system-design", itemId: "url-shortener", status: "in-progress", updatedAt: 0 },
], "legacy System Design activity must migrate only canonical-safe identifiers");

let local = emptyLocalPreparationProgress();
local = recordLocalProgress(local, { track: "dsa", itemId: "two-sum", status: "completed", updatedAt: 100 });
local = recordLocalProgress(local, { track: "ml-design", itemId: "recommendation-system", status: "in-progress", updatedAt: 200 });
let candidates = localContinuationCandidates(local, catalog);
assert.equal(choosePreparationContinuation([], candidates)?.track, "ml-design", "an in-progress local item should outrank completed navigation");
assert.equal(choosePreparationContinuation([], candidates)?.href, "/ml-design/recommendation-system");

const systemLocal = recordLocalProgress(emptyLocalPreparationProgress(), { track: "system-design", itemId: "introduction", status: "in-progress", updatedAt: 100 });
assert.equal(choosePreparationContinuation([], localContinuationCandidates(systemLocal, catalog))?.track, "system-design", "System Design continuation must use its canonical item");
const behavioralLocal = recordLocalProgress(emptyLocalPreparationProgress(), { track: "behavioral", itemId: "beh-conflict", status: "completed", updatedAt: 100 });
assert.equal(choosePreparationContinuation([], localContinuationCandidates(behavioralLocal, catalog))?.track, "behavioral", "Behavioral continuation must use a public canonical prompt only");

local = saveLocalPlan(local, { track: "dsa", label: "60-day DSA study plan", href: "/dsa/study-plans?level=sde2&duration=60", savedAt: 300 });
candidates = localContinuationCandidates(local, catalog);
assert.equal(choosePreparationContinuation([], candidates)?.kind, "active-plan", "a deliberately saved plan should have deterministic local precedence");

const account = { track: "behavioral", title: "Continue Behavioral workspace", href: "/behavioral/workspace", context: "Recent saved preparation.", source: "account", kind: "recent", updatedAt: 10 };
assert.equal(choosePreparationContinuation([account], candidates)?.source, "account", "account-backed state must outrank browser-local state");
const upcomingInterview = { track: "interview", title: "Prepare for your upcoming interview", href: "/interviews/round-1/prepare", context: "Upcoming route.", source: "account", kind: "upcoming-interview", updatedAt: 1 };
assert.equal(choosePreparationContinuation([account, upcomingInterview], candidates)?.kind, "upcoming-interview", "a real upcoming interview context should outrank all saved preparation continuation");
assert.equal(choosePreparationContinuation([], []) , null, "new users must not receive fabricated continuation");
assert.equal(preparationActivityDaysThisWeek([{ updatedAt: Date.parse("2026-08-20T10:00:00Z") }, { updatedAt: Date.parse("2026-08-20T15:00:00Z") }, { updatedAt: Date.parse("2026-08-18T10:00:00Z") }], Date.parse("2026-08-21T12:00:00Z")), 2, "weekly momentum counts distinct activity days, not clicks or a streak");

const importValidationInstant = new Date("2026-09-03T12:00:00.000Z");
const importRequestFixture = {
  version: 1,
  items: [
    { track: "dsa", itemId: "two-sum", status: "completed", updatedAt: 10 },
    { track: "system-design", itemId: "introduction", status: "in-progress", updatedAt: 0 },
    { track: "ml-design", itemId: "recommendation-system", status: "in-progress", updatedAt: 20 },
    { track: "behavioral", itemId: "beh-conflict", status: "completed", updatedAt: 30 },
  ],
  plans: [{ track: "dsa", href: "/dsa/study-plans?level=sde2&duration=60", label: "60-day DSA study plan", savedAt: 40 }],
};
const parsedImportRequest = parsePreparationImportRequest(importRequestFixture, importValidationInstant);
assert.deepEqual(parsedImportRequest, importRequestFixture, "a strict bounded browser snapshot must remain eligible for import");

const invalidImportRequests = [
  null,
  [],
  {},
  { ...importRequestFixture, extra: true },
  { ...importRequestFixture, version: 2 },
  { ...importRequestFixture, items: "items" },
  { ...importRequestFixture, plans: "plans" },
  { ...importRequestFixture, items: Array.from({ length: 161 }, (_, index) => ({ track: "dsa", itemId: `item-${index}`, status: "completed", updatedAt: index })) },
  { ...importRequestFixture, plans: [...importRequestFixture.plans, { ...importRequestFixture.plans[0], track: "system-design" }, { ...importRequestFixture.plans[0], href: "/another" }] },
  { ...importRequestFixture, items: [...importRequestFixture.items, { ...importRequestFixture.items[0] }] },
  { ...importRequestFixture, items: [{ ...importRequestFixture.items[0], extra: true }] },
  { ...importRequestFixture, items: [{ ...importRequestFixture.items[0], track: "interview" }] },
  { ...importRequestFixture, items: [{ ...importRequestFixture.items[0], itemId: "../private" }] },
  { ...importRequestFixture, items: [{ ...importRequestFixture.items[0], status: "review" }] },
  { ...importRequestFixture, items: [{ ...importRequestFixture.items[0], updatedAt: -1 }] },
  { ...importRequestFixture, items: [{ ...importRequestFixture.items[0], updatedAt: Date.parse("2026-09-04T12:00:00.001Z") }] },
  { ...importRequestFixture, plans: [{ ...importRequestFixture.plans[0], extra: true }] },
  { ...importRequestFixture, plans: [{ ...importRequestFixture.plans[0], track: "ml-design" }] },
  { ...importRequestFixture, plans: [{ ...importRequestFixture.plans[0], href: "https://evil.example/plan" }] },
  { ...importRequestFixture, plans: [{ ...importRequestFixture.plans[0], label: "" }] },
  { ...importRequestFixture, plans: [{ ...importRequestFixture.plans[0], savedAt: Number.NaN }] },
  { ...importRequestFixture, plans: [importRequestFixture.plans[0], { ...importRequestFixture.plans[0], href: "/dsa/study-plans?duration=30" }] },
];
for (const value of invalidImportRequests) {
  assert.equal(parsePreparationImportRequest(value, importValidationInstant), null, `malformed or over-bounded import request must fail closed: ${JSON.stringify(value)}`);
}
assert.equal(parsePreparationImportRequest(importRequestFixture, new Date("invalid")), null, "an invalid injected validation instant must fail closed");

const importResponseFixture = {
  results: [
    { track: "behavioral", itemId: "beh-conflict", outcome: "failed" },
    { track: "ml-design", itemId: "recommendation-system", outcome: "existing" },
    { track: "system-design", itemId: "introduction", outcome: "imported" },
    { track: "dsa", itemId: "two-sum", outcome: "imported" },
  ],
  plansRequireChoice: true,
};
const parsedImportResponse = parsePreparationImportResponse(importResponseFixture, parsedImportRequest);
assert.deepEqual(parsedImportResponse, {
  results: [
    { track: "dsa", itemId: "two-sum", outcome: "imported" },
    { track: "system-design", itemId: "introduction", outcome: "imported" },
    { track: "ml-design", itemId: "recommendation-system", outcome: "existing" },
    { track: "behavioral", itemId: "beh-conflict", outcome: "failed" },
  ],
  plansRequireChoice: true,
}, "a complete response must correlate one exact outcome to every submitted item in submitted order");

for (const value of [
  null,
  {},
  { ...importResponseFixture, extra: true },
  { ...importResponseFixture, results: importResponseFixture.results.slice(1) },
  { ...importResponseFixture, results: [...importResponseFixture.results, importResponseFixture.results[0]] },
  { ...importResponseFixture, results: importResponseFixture.results.map((item, index) => index === 0 ? { ...item, extra: true } : item) },
  { ...importResponseFixture, results: importResponseFixture.results.map((item, index) => index === 0 ? { ...item, track: "dsa", itemId: "foreign-item" } : item) },
  { ...importResponseFixture, results: importResponseFixture.results.map((item, index) => index === 0 ? { ...item, outcome: "skipped" } : item) },
  { ...importResponseFixture, results: importResponseFixture.results.map(() => importResponseFixture.results[0]) },
  { ...importResponseFixture, plansRequireChoice: false },
]) {
  assert.equal(parsePreparationImportResponse(value, parsedImportRequest), null, `uncorrelated or malformed import response must fail closed: ${JSON.stringify(value)}`);
}

for (const message of [PREPARATION_IMPORT_INVALID_MESSAGE, PREPARATION_IMPORT_UNAUTHENTICATED_MESSAGE, PREPARATION_IMPORT_UNAVAILABLE_MESSAGE]) {
  assert.equal(parsePreparationImportError({ error: message }), message, `the client may expose only the curated import error: ${message}`);
}
for (const value of [null, {}, { error: "database detail" }, { error: PREPARATION_IMPORT_UNAVAILABLE_MESSAGE, detail: "private" }]) {
  assert.equal(parsePreparationImportError(value), null, "unknown or malformed import errors must be replaced by the stable unavailable message");
}

const currentImportProgress = {
  version: 1,
  items: [
    importRequestFixture.items[0],
    { ...importRequestFixture.items[1], status: "completed", updatedAt: 999 },
    importRequestFixture.items[2],
    importRequestFixture.items[3],
    { track: "dsa", itemId: "valid-parentheses", status: "in-progress", updatedAt: 50 },
  ],
  plans: importRequestFixture.plans,
};
const importReconciliation = reconcilePreparationImport(
  parsedImportRequest,
  parsedImportResponse,
  currentImportProgress,
  { "topic:introduction": "in-progress", "practice:url-shortener": "completed", malformed: "private" },
);
assert.deepEqual(importReconciliation.progress.items, [
  { ...importRequestFixture.items[1], status: "completed", updatedAt: 999 },
  importRequestFixture.items[3],
  { track: "dsa", itemId: "valid-parentheses", status: "in-progress", updatedAt: 50 },
], "reconciliation must remove exact imported/existing snapshots while retaining failed, concurrently changed, and unrelated primary rows");
assert.deepEqual(importReconciliation.progress.plans, importRequestFixture.plans, "browser plan choices must survive activity import unchanged");
assert.deepEqual(importReconciliation.legacySystemDesignProgress, { "practice:url-shortener": "completed", malformed: "private" }, "legacy reconciliation must remove only the exact confirmed submitted snapshot");
assert.equal(importReconciliation.primaryChanged, true);
assert.equal(importReconciliation.legacyChanged, true);
assert.equal(importReconciliation.changedLocallyCount, 1, "a changed key present in multiple stores must be counted once");
assert.equal(
  preparationImportStatusMessage(parsedImportResponse, { changedLocallyCount: 1, localReconciliationFailed: false }),
  "2 activities were imported. 1 activity was already in your account. 1 activity could not be imported and remains in this browser. 1 activity changed in this browser during the import and remains here. Saved plans remain in this browser until you choose one on its plan page.",
  "mixed import outcomes must have exact truthful copy",
);
assert.match(preparationImportStatusMessage(parsedImportResponse, { changedLocallyCount: 0, localReconciliationFailed: true }), /browser activity could not be fully cleared/, "a failed local rewrite must not claim browser cleanup");
assert.equal(preparationImportStatusMessage({ results: [], plansRequireChoice: false }, { changedLocallyCount: 0, localReconciliationFailed: false }), "No browser activity needed importing.");

const anonymousContinuationState = { status: "anonymous", authenticated: false, candidates: [], weeklyActivityDays: 0 };
const emptyReadyContinuationState = { status: "ready", authenticated: true, candidates: [], weeklyActivityDays: 0 };
const readyContinuationState = { status: "ready", authenticated: true, candidates: [account], weeklyActivityDays: 2 };
const unavailableContinuationState = { status: "unavailable", candidates: [], weeklyActivityDays: 0 };

assert.deepEqual(normalizeAccountPreparationContinuationResponse(anonymousContinuationState), anonymousContinuationState, "an exact anonymous response must remain distinct from an unavailable response");
assert.deepEqual(normalizeAccountPreparationContinuationResponse(emptyReadyContinuationState), emptyReadyContinuationState, "an authenticated account with genuinely empty progress must remain a successful ready response");
assert.deepEqual(normalizeAccountPreparationContinuationResponse(readyContinuationState), readyContinuationState, "a valid account continuation response must preserve its bounded public candidate");
assert.deepEqual(normalizeAccountPreparationContinuationResponse(unavailableContinuationState), unavailableContinuationState, "the exact unavailable response must remain explicit and unauthenticated-neutral");
assert.deepEqual(createUnavailableAccountPreparationContinuationState(), unavailableContinuationState, "transport and malformed-response failures must share one conservative unavailable state");

assert.deepEqual(resolveAccountPreparationContinuationState({ authenticated: false, queryFailed: false, candidates: [], weeklyActivityDays: 0 }), anonymousContinuationState, "a successful anonymous account lookup must resolve to anonymous rather than unavailable");
assert.deepEqual(resolveAccountPreparationContinuationState({ authenticated: false, queryFailed: true, candidates: [], weeklyActivityDays: 0 }), unavailableContinuationState, "an explicit continuation-data failure must resolve unavailable even when no authenticated continuation can be established");
assert.deepEqual(resolveAccountPreparationContinuationState({ authenticated: true, queryFailed: false, candidates: [], weeklyActivityDays: 0 }), emptyReadyContinuationState, "successful zero-row account queries must resolve to a genuine ready-empty state");
assert.deepEqual(resolveAccountPreparationContinuationState({ authenticated: true, queryFailed: false, candidates: [account], weeklyActivityDays: 2 }), readyContinuationState, "successful account queries must resolve to ready with their validated candidate");
assert.deepEqual(resolveAccountPreparationContinuationState({ authenticated: true, queryFailed: true, candidates: [account], weeklyActivityDays: 2 }), unavailableContinuationState, "any account-query failure must discard partial rows and resolve unavailable rather than empty-ready");

for (const malformed of [
  null,
  undefined,
  false,
  0,
  "ready",
  [],
  {},
  { ...anonymousContinuationState, extra: true },
  { ...anonymousContinuationState, authenticated: true },
  { ...anonymousContinuationState, candidates: [account] },
  { ...anonymousContinuationState, weeklyActivityDays: 1 },
  { ...emptyReadyContinuationState, authenticated: false },
  { ...emptyReadyContinuationState, candidates: {} },
  { ...unavailableContinuationState, authenticated: false },
  { ...unavailableContinuationState, candidates: [account] },
  { ...unavailableContinuationState, weeklyActivityDays: 1 },
]) {
  assert.equal(normalizeAccountPreparationContinuationResponse(malformed), null, `malformed/cross-correlated continuation response must fail closed: ${JSON.stringify(malformed)}`);
}

for (const weeklyActivityDays of [-1, 1.5, 8, Number.NaN, Number.POSITIVE_INFINITY, "2", null]) {
  assert.equal(
    normalizeAccountPreparationContinuationResponse({ ...emptyReadyContinuationState, weeklyActivityDays }),
    null,
    `ready continuation activity days must be an integer from zero through seven: ${String(weeklyActivityDays)}`,
  );
}

const invalidCandidateMutations = [
  { ...account, extra: true },
  { ...account, track: "salary" },
  { ...account, title: "" },
  { ...account, title: " Padded title " },
  { ...account, title: "Unsafe\nTitle" },
  { ...account, href: "https://evil.example/path" },
  { ...account, href: "//evil.example/path" },
  { ...account, href: "/behavioral workspace" },
  { ...account, href: "/behavioral\\workspace" },
  { ...account, context: "" },
  { ...account, context: " Unsafe context " },
  { ...account, source: "local" },
  { ...account, kind: "unknown" },
  { ...account, updatedAt: -1 },
  { ...account, updatedAt: Number.NaN },
  { ...account, updatedAt: "10" },
];
for (const candidate of invalidCandidateMutations) {
  assert.equal(
    normalizeAccountPreparationContinuationResponse({ ...emptyReadyContinuationState, candidates: [candidate] }),
    null,
    `unsafe or malformed account continuation candidate must fail closed: ${JSON.stringify(candidate)}`,
  );
}

const accountFailureReasons = ["account-unavailable", "unauthenticated", "invalid-input", "persistence-failed", "request-failed"];

const fullLocalProgress = parseLocalPreparationProgress({
  version: 1,
  plans: [],
  items: Array.from({ length: 160 }, (_, index) => ({
    track: "behavioral",
    itemId: `bounded-${String(index).padStart(3, "0")}`,
    status: "in-progress",
    updatedAt: index + 1,
  })),
});
const cappedWithNew = recordLocalProgress(fullLocalProgress, { track: "ml-design", itemId: "newest-practice", status: "completed", updatedAt: 1_000 });
assert.equal(cappedWithNew.items.length, 160, "local activity must remain bounded at exactly 160 items");
assert.ok(cappedWithNew.items.some((item) => item.track === "ml-design" && item.itemId === "newest-practice" && item.status === "completed"), "a new activity must survive insertion into a full local store");
assert.ok(!cappedWithNew.items.some((item) => item.itemId === "bounded-000"), "a full local store must deterministically evict its oldest existing activity");
const cappedWithUpdate = recordLocalProgress(fullLocalProgress, { track: "behavioral", itemId: "bounded-050", status: "completed", updatedAt: 2_000 });
assert.equal(cappedWithUpdate.items.length, 160, "updating a full local store must not evict an unrelated activity");
assert.equal(cappedWithUpdate.items.filter((item) => item.itemId === "bounded-050").length, 1, "a full-store update must replace rather than duplicate its activity");
assert.equal(cappedWithUpdate.items.find((item) => item.itemId === "bounded-050")?.status, "completed", "an updated activity must survive the 160-item bound");
assert.ok(cappedWithUpdate.items.some((item) => item.itemId === "bounded-000"), "updating an existing full-store activity must retain the previous oldest unrelated row");
assert.equal(preparationActivityKey("behavioral", "beh-conflict"), "behavioral:beh-conflict", "activity keys must preserve track and canonical item identity");

assert.deepEqual(resolvePreparationActivitySaveOutcome({ accountStatus: "saved" }), {
  persisted: true,
  persistence: "account",
  message: "Preparation activity saved to your account.",
}, "account activity persistence must settle without a browser fallback");

for (const reason of accountFailureReasons) {
  const localSuccess = resolvePreparationActivitySaveOutcome({ accountStatus: "failed", accountReason: reason, localStatus: "saved" });
  assert.equal(localSuccess.persisted, true, `${reason} activity must allow an honest browser-local fallback`);
  assert.equal(localSuccess.persistence, "local", `${reason} activity fallback must drive analytics persistence`);
  assert.match(localSuccess.message, /^Saved in this browser\./, `${reason} activity fallback must confirm the browser write only after success`);

  const totalFailure = resolvePreparationActivitySaveOutcome({ accountStatus: "failed", accountReason: reason, localStatus: "failed" });
  assert.equal(totalFailure.persisted, false, `${reason} activity plus browser failure must not claim persistence`);
  assert.equal(totalFailure.persistence, null, `${reason} activity plus browser failure must not produce analytics persistence`);
  assert.doesNotMatch(totalFailure.message, /^Saved\b/, `${reason} activity plus browser failure must not claim success`);
}
assert.equal(resolvePreparationActivitySaveOutcome({ accountStatus: "failed", accountReason: "request-failed", localStatus: "saved" }).message, "Saved in this browser. Account saving could not be confirmed.", "a rejected activity response cannot prove that an account write failed");
assert.equal(resolvePreparationActivitySaveOutcome({ accountStatus: "failed", accountReason: "request-failed", localStatus: "failed" }).message, "Recorded for this visit, but browser storage is unavailable. Account saving could not be confirmed.", "an unconfirmed account response and failed activity browser write must remain distinct");

assert.deepEqual(resolveStudyPlanSaveOutcome({ accountStatus: "saved" }), {
  persisted: true,
  persistence: "account",
  message: "Active study plan saved to your account.",
}, "account persistence must be the final outcome without a local fallback");

for (const reason of accountFailureReasons) {
  const localSuccess = resolveStudyPlanSaveOutcome({ accountStatus: "failed", accountReason: reason, localStatus: "saved" });
  assert.equal(localSuccess.persisted, true, `${reason} must allow an honest browser-local fallback`);
  assert.equal(localSuccess.persistence, "local", `${reason} local fallback must drive analytics persistence`);
  assert.match(localSuccess.message, /^Saved in this browser\./, `${reason} local fallback must confirm the write only after success`);

  const totalFailure = resolveStudyPlanSaveOutcome({ accountStatus: "failed", accountReason: reason, localStatus: "failed" });
  assert.equal(totalFailure.persisted, false, `${reason} plus localStorage failure must not claim persistence`);
  assert.equal(totalFailure.persistence, null, `${reason} plus localStorage failure must not produce an analytics persistence value`);
  assert.doesNotMatch(totalFailure.message, /^Saved\b/, `${reason} plus localStorage failure must not claim success`);
}
assert.equal(resolveStudyPlanSaveOutcome({ accountStatus: "failed", accountReason: "request-failed", localStatus: "saved" }).message, "Saved in this browser. Account saving could not be confirmed.", "a rejected response cannot prove that an earlier account write failed");
assert.equal(resolveStudyPlanSaveOutcome({ accountStatus: "failed", accountReason: "request-failed", localStatus: "failed" }).message, "This plan is still visible, but it could not be saved in this browser. Account saving could not be confirmed.", "an unconfirmed account response and failed browser write must remain distinct");

assert.equal(studyPlanId({ track: "dsa", level: "sde2", duration: 60 }), "sde2-60d", "DSA plan analytics IDs must remain canonical");
assert.equal(studyPlanId({ track: "system-design", level: "senior", preparationWindow: "2-weeks", role: undefined, minutesPerDay: 45 }), "senior-2-weeks-general-45m", "general System Design plans must include their role discriminator");
assert.equal(studyPlanId({ track: "system-design", level: "senior", preparationWindow: "2-weeks", role: "backend", minutesPerDay: 45 }), "senior-2-weeks-backend-45m", "role-specific System Design plans must not collapse into the general plan analytics ID");

const read = (path) => readFileSync(path, "utf8");
const activityAction = read("features/preparation-progress/actions.ts");
const importRoute = read("app/api/preparation/import/route.ts");
const continuationRoute = read("app/api/preparation/continuation/route.ts");
const accountContinuationQuery = read("lib/preparation-progress/account.ts");
const activityMigration = read("supabase/migrations/202608220002_create_preparation_track_progress.sql");
const importMigration = read("supabase/migrations/202609030003_import_preparation_activity_if_absent.sql");
const importDatabaseTest = read("supabase/tests/database/preparation_activity_import.test.sql");
const unifiedProgressDocs = read("docs/unified-preparation-progress.md");
const persistenceQualifier = read("scripts/qualify-persistence-local.mjs");
const securityQualifier = read("scripts/qualify-security-local.mjs");
const planControl = read("components/save-study-plan-control.tsx");
const planAction = read("features/preparation-progress/plan-actions.ts");
const activityControl = read("components/preparation-activity-control.tsx");
const homeExperience = read("components/home-entry-experience.tsx");
for (const marker of ["canonicalDsaQuestionById", "canonicalSystemDesignConceptIds", "activeMlDesignProblems", "activeBehavioralQuestions", "target_notes: null"]) assert.ok(activityAction.includes(marker), `durable activity action must preserve canonical/no-note semantics: ${marker}`);
assert.ok(importRoute.indexOf("parsePreparationImportRequest(payload)") < importRoute.indexOf("await getAuthenticatedActor()"), "browser import must strictly parse the untrusted snapshot before actor or RPC work");
for (const marker of [
  "canonicalDsaQuestionById.has(item.itemId)",
  "canonicalSystemDesignConceptIds.has(item.itemId)",
  "canonicalSystemDesignProblemIds.has(item.itemId)",
  "mlIds.has(item.itemId)",
  "behavioralIds.has(item.itemId)",
  'rpc("import_dsa_question_progress_if_absent"',
  'rpc("import_system_design_item_progress_if_absent"',
  'rpc("import_preparation_track_progress_if_absent"',
  'return data ? "imported" : "existing"',
  'return "failed"',
  '"Cache-Control": "private, no-store"',
  'Pragma: "no-cache"',
  '"X-Robots-Tag": "noindex, nofollow"',
]) assert.ok(importRoute.includes(marker), `explicit import route is missing its strict atomic outcome contract: ${marker}`);
for (const obsolete of [
  'from("dsa_question_progress")',
  'from("system_design_item_progress")',
  'from("preparation_track_progress")',
  'rpc("save_dsa_question_progress"',
  'rpc("save_system_design_item_progress"',
  'rpc("save_preparation_track_progress"',
]) assert.ok(!importRoute.includes(obsolete), `explicit import must not pre-read progress or invoke a whole-record save boundary: ${obsolete}`);
for (const rpc of ["import_dsa_question_progress_if_absent", "import_system_design_item_progress_if_absent", "import_preparation_track_progress_if_absent"]) {
  const functionStart = importMigration.indexOf(`function public.${rpc}`);
  const functionEnd = importMigration.indexOf("$$;", functionStart);
  const functionSource = functionStart < 0 || functionEnd < 0 ? "" : importMigration.slice(functionStart, functionEnd);
  assert.ok(functionSource.includes("security definer") && functionSource.includes("set search_path = ''") && functionSource.includes("auth.uid()"), `${rpc} must derive its owner inside a hardened security-definer boundary`);
  assert.ok(functionSource.includes("on conflict") && functionSource.includes("do nothing") && functionSource.includes("return coalesce(inserted, false)"), `${rpc} must be one insert-if-absent statement whose boolean reports the actual insert`);
  assert.ok(importMigration.includes(`revoke all on function public.${rpc}`) && importMigration.includes(`grant execute on function public.${rpc}`), `${rpc} must deny anonymous execution and grant only its reviewed authenticated signature`);
}
for (const marker of [
  "insert-only browser import preserves rich existing progress across every storage family",
  "concurrent same-key browser imports insert exactly once",
  "concurrent browser import and rich DSA save preserve the full-save intent",
  "concurrent different-key browser imports commute",
]) assert.ok(persistenceQualifier.includes(marker), `persistence qualification must retain atomic import evidence: ${marker}`);
for (const marker of ["anonymous callers cannot invoke insert-only browser import RPCs", "insert-only browser imports derive independent owners without exposing foreign state"]) assert.ok(securityQualifier.includes(marker), `security qualification must retain import isolation evidence: ${marker}`);
for (const marker of ["plan(41)", "DSA import inserts an absent canonical question", "DSA import preserves every rich field and timestamp byte-for-byte", "repeated DSA import is idempotent and preserves the first result"]) assert.ok(importDatabaseTest.includes(marker), `database import regression is missing ${marker}`);
for (const marker of ["exactly matches the submitted snapshot", "`imported` or `existing`", "Partial success", "failed, concurrently changed, and unrelated browser activity remains recoverable", "Local saved plans always stay in the browser"]) assert.ok(unifiedProgressDocs.includes(marker), `canonical import documentation is missing its snapshot-safe partial-outcome contract: ${marker}`);
assert.match(
  accountContinuationQuery,
  /\[upcomingRoundResult, preferencesResult, dsaResult, systemProgressResult, attemptsResult, trackResult, behavioralResult\]\.some\(\(result\) => result\.error\)[\s\S]*authenticated: true, queryFailed: true/,
  "any account continuation query error must resolve unavailable instead of returning authenticated empty/zero progress",
);
assert.match(accountContinuationQuery, /if \(!actor\)[\s\S]*authenticated: false, queryFailed: false/, "a successful signed-out lookup must remain anonymous rather than unavailable");
assert.match(accountContinuationQuery, /authenticated: true,[\s\S]*queryFailed: false,[\s\S]*candidates,[\s\S]*weeklyActivityDays:/, "successful account queries must retain genuine ready, including ready-empty, semantics");
assert.ok(accountContinuationQuery.includes('select("id,problem_id,status,updated_at")') && !accountContinuationQuery.includes('select("id,problem_id,title,status,updated_at")'), "account continuation queries must derive attempt titles from the canonical public catalog rather than selecting private attempt text");
assert.match(continuationRoute, /status: state\.status === "unavailable" \? 503 : 200/, "the continuation route must return 503 only for the explicit unavailable state");
assert.equal((continuationRoute.match(/503/g) ?? []).length, 1, "the continuation route must have one explicit unavailable HTTP status boundary");
for (const marker of ['"private, no-store"', 'Pragma: "no-cache"', '"X-Robots-Tag": "noindex, nofollow"', 'export const dynamic = "force-dynamic"']) {
  assert.ok(continuationRoute.includes(marker), `private continuation responses must preserve the request-time privacy/cache contract: ${marker}`);
}
for (const marker of ["on delete cascade", "enable row level security", "save_preparation_track_progress", "security definer"]) assert.ok(activityMigration.includes(marker), `durable activity schema is missing ${marker}`);
assert.ok(planControl.includes("Saving replaces the active plan"), "saved plan replacement must be deliberate rather than silent");
assert.ok(planControl.includes("if (accountPlatformAvailable)"), "account-disabled study-plan saves must not invoke the Server Action");
assert.ok(planControl.includes("browser storage when available"), "account-disabled helper copy must not promise optional browser persistence before it succeeds");
assert.ok(planControl.includes("useStudyPlanSaveCoordinator") && planControl.includes('const pending = saveState?.status === "pending"') && planControl.includes("pendingRef.current") && planControl.includes("Finishing previous plan save…"), "a parent-owned coordinator must block duplicate or different-plan activation across conditional control remounts");
assert.ok(planControl.includes("Previous save for ${saveState.label}"), "a completed prior-plan save must remain explicitly labeled in the live status after the visible plan changes");
assert.ok(planControl.includes("aria-disabled={pending}") && !planControl.includes(" disabled={pending}"), "pending saves must retain trigger focus while preventing another activation");
assert.equal((planControl.match(/track\("study_plan_activated"/g) ?? []).length, 1, "study-plan persistence must have one analytics emission point");
assert.ok(planControl.includes("if (outcome.persisted)"), "study-plan analytics must require a resolved real persistence outcome");
assert.match(planControl, /writeLocalPreparationProgress\([^;]+;\s*window\.dispatchEvent\(new CustomEvent\(preparationProgressEvent\)\)/, "browser-local continuation events must follow the storage write");
assert.ok(planControl.includes('aria-live="polite"') && planControl.includes('aria-atomic="true"'), "study-plan persistence must announce one polite atomic outcome");
assert.ok(planAction.includes("reason: result.error.code"), "the study-plan action must preserve stable repository error codes");
assert.ok(activityAction.includes('return { saved: false, reason: "account-unavailable" }') && activityAction.includes('return { saved: false, reason: "unauthenticated" }') && activityAction.includes('return { saved: false, reason: "invalid-input" }') && activityAction.includes('return { saved: false, reason: "persistence-failed" }') && activityAction.includes('return { saved: true, reason: "saved" }'), "activity actions must return stable discriminated reasons without presentation strings");
assert.ok(activityAction.indexOf("if (!isAccountPlatformAvailable())") < activityAction.indexOf("await getAuthenticatedActor()"), "activity actions must reject disabled accounts before actor resolution");
assert.ok(activityAction.includes("!input ||") && activityAction.includes("preparationTrackSet.has(input.track)") && activityAction.includes("preparationStatusSet.has(input.status)") && activityAction.includes('typeof input.itemId !== "string"') && activityAction.indexOf("preparationTrackSet.has(input.track)") < activityAction.indexOf("await getAuthenticatedActor()") && activityAction.includes('input.track === "ml-design" || input.track === "behavioral"'), "the public activity action must reject malformed or forged track/status/item values before actor resolution or RPC dispatch");
assert.ok(activityControl.includes("accountPlatformAvailable: boolean") && !activityControl.includes("accountPlatformAvailable = true"), "every shared activity caller must provide an explicit account-availability value");
assert.ok(activityControl.indexOf("if (accountPlatformAvailable)") < activityControl.indexOf("recordPreparationActivityAction({ track, itemId, status: next })"), "account-disabled activity must skip its Server Action");
assert.ok(activityControl.includes("pendingRef.current") && activityControl.includes("requestIdRef") && activityControl.includes("requestedActivityKey") && activityControl.includes("current?.requestId === requestId") && activityControl.includes("current.activityKey === requestedActivityKey"), "activity saves must block duplicate activation and guard settlement by request and item identity");
assert.ok(activityControl.includes("activityStatus.activityKey === currentActivityKey") && activityControl.includes("saveState?.activityKey === currentActivityKey"), "a prior activity's optimistic status and result must not render under a different item");
assert.ok(activityControl.includes("updated.items.some") && activityControl.indexOf("if (!recorded) return \"failed\"") < activityControl.indexOf("writeLocalPreparationProgress(window.localStorage, updated)"), "activity fallback must verify that the requested row survived normalization before claiming a browser write");
assert.match(activityControl, /writeLocalPreparationProgress\(window\.localStorage, updated\);\s*window\.dispatchEvent\(new CustomEvent\(preparationProgressEvent\)\)/, "activity continuation events must follow a verified browser write");
assert.equal((activityControl.match(/trackAnalytics\("preparation_activity_recorded"/g) ?? []).length, 1, "activity completion must have exactly one analytics emission point");
assert.ok(activityControl.includes('next === "completed" && outcome.persisted') && activityControl.includes("persistence: outcome.persistence"), "activity analytics must require a resolved account or browser persistence outcome");
assert.ok(activityControl.includes('aria-live="polite"') && activityControl.includes('aria-atomic="true"') && activityControl.includes("Finishing previous activity save…"), "activity saves must retain focus and announce pending and final outcomes atomically");
assert.ok(activityControl.includes("Account saving is unavailable") && activityControl.includes("browser storage when available"), "the disabled helper must describe optional browser storage without promising persistence");
assert.ok(homeExperience.includes("Preparation recorded on") && !homeExperience.includes("streak"), "homepage momentum must stay low-pressure and non-streak based");

console.log("Unified preparation-progress core passed: versioned local state, corrupted-state recovery, deterministic precedence, and no fabricated activity.");
