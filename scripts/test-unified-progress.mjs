import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  emptyLocalPreparationProgress,
  migrateLegacySystemDesignProgress,
  parseLocalPreparationProgress,
  preparationActivityDaysThisWeek,
  recordLocalProgress,
  removeLocalProgressItems,
  saveLocalPlan,
} from "../lib/preparation-progress/local.ts";
import { choosePreparationContinuation, localContinuationCandidates } from "../lib/preparation-progress/continuation.ts";
import {
  preparationActivityKey,
  resolvePreparationActivitySaveOutcome,
} from "../lib/preparation-progress/activity-save.ts";
import { resolveStudyPlanSaveOutcome, studyPlanId } from "../lib/preparation-progress/plan-save.ts";

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
assert.equal(removeLocalProgressItems(local, ["dsa:two-sum"]).items.some((item) => item.itemId === "two-sum"), false, "only confirmed imports may clear their browser activity");
assert.equal(preparationActivityDaysThisWeek([{ updatedAt: Date.parse("2026-08-20T10:00:00Z") }, { updatedAt: Date.parse("2026-08-20T15:00:00Z") }, { updatedAt: Date.parse("2026-08-18T10:00:00Z") }], Date.parse("2026-08-21T12:00:00Z")), 2, "weekly momentum counts distinct activity days, not clicks or a streak");

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
const activityMigration = read("supabase/migrations/202608220002_create_preparation_track_progress.sql");
const planControl = read("components/save-study-plan-control.tsx");
const planAction = read("features/preparation-progress/plan-actions.ts");
const activityControl = read("components/preparation-activity-control.tsx");
const homeExperience = read("components/home-entry-experience.tsx");
for (const marker of ["canonicalDsaQuestionById", "canonicalSystemDesignConceptIds", "activeMlDesignProblems", "activeBehavioralQuestions", "target_notes: null"]) assert.ok(activityAction.includes(marker), `durable activity action must preserve canonical/no-note semantics: ${marker}`);
for (const marker of ["parseLocalPreparationProgress", "dsaKeys.has", "systemKeys.has", "trackKeys.has", "removeLocalProgressItems"]) assert.ok(importRoute.includes(marker) || read("components/home-entry-experience.tsx").includes(marker), `explicit import must validate and avoid overwrite: ${marker}`);
assert.ok(continuationRoute.includes('"private, no-store"'), "private continuation must never be shared-cached");
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
