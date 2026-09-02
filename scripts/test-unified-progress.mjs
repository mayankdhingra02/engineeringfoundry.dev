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

assert.deepEqual(resolveStudyPlanSaveOutcome({ accountStatus: "saved" }), {
  persisted: true,
  persistence: "account",
  message: "Active study plan saved to your account.",
}, "account persistence must be the final outcome without a local fallback");

const accountFailureReasons = ["account-unavailable", "unauthenticated", "invalid-input", "persistence-failed", "request-failed"];
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
const homeExperience = read("components/home-entry-experience.tsx");
for (const marker of ["canonicalDsaQuestionById", "canonicalSystemDesignConceptIds", "activeMlDesignProblems", "activeBehavioralQuestions", "target_notes: null"]) assert.ok(activityAction.includes(marker), `durable activity action must preserve canonical/no-note semantics: ${marker}`);
for (const marker of ["parseLocalPreparationProgress", "dsaKeys.has", "systemKeys.has", "trackKeys.has", "removeLocalProgressItems"]) assert.ok(importRoute.includes(marker) || read("components/home-entry-experience.tsx").includes(marker), `explicit import must validate and avoid overwrite: ${marker}`);
assert.ok(continuationRoute.includes('"private, no-store"'), "private continuation must never be shared-cached");
for (const marker of ["on delete cascade", "enable row level security", "save_preparation_track_progress", "security definer"]) assert.ok(activityMigration.includes(marker), `durable activity schema is missing ${marker}`);
assert.ok(planControl.includes("Saving replaces the active plan"), "saved plan replacement must be deliberate rather than silent");
assert.ok(planControl.includes("if (accountPlatformAvailable)"), "account-disabled study-plan saves must not invoke the Server Action");
assert.ok(planControl.includes("browser storage when available"), "account-disabled helper copy must not promise optional browser persistence before it succeeds");
assert.ok(planControl.includes('const pending = saveState?.status === "pending"') && planControl.includes("Finishing previous plan save…"), "an in-flight save must globally block a different selected plan from racing it");
assert.equal((planControl.match(/track\("study_plan_activated"/g) ?? []).length, 1, "study-plan persistence must have one analytics emission point");
assert.ok(planControl.includes("if (outcome.persisted)"), "study-plan analytics must require a resolved real persistence outcome");
assert.match(planControl, /writeLocalPreparationProgress\([^;]+;\s*window\.dispatchEvent\(new CustomEvent\(preparationProgressEvent\)\)/, "browser-local continuation events must follow the storage write");
assert.ok(planControl.includes('aria-live="polite"') && planControl.includes('aria-atomic="true"'), "study-plan persistence must announce one polite atomic outcome");
assert.ok(planAction.includes("reason: result.error.code"), "the study-plan action must preserve stable repository error codes");
assert.ok(homeExperience.includes("Preparation recorded on") && !homeExperience.includes("streak"), "homepage momentum must stay low-pressure and non-streak based");

console.log("Unified preparation-progress core passed: versioned local state, corrupted-state recovery, deterministic precedence, and no fabricated activity.");
