import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildInterviewPlaybookPlanningTargets,
  buildInterviewPlaybookPlanningProjection,
  presentInterviewAdaptivePlan,
} from "../lib/interview-playbook/planner-integration.ts";

const root = process.cwd();
const integrationSource = readFileSync(join(root, "lib/interview-playbook/planner-integration.ts"), "utf8");
const pageSource = readFileSync(join(root, "app/interview-playbook/page.tsx"), "utf8");

const cases = [];
const check = (name, ok) => cases.push([name, Boolean(ok)]);
const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function round(overrides) {
  return {
    id: "r1",
    applicationId: "a1",
    companyName: "Acme",
    companySlug: "acme",
    roleTitle: "SWE",
    roleLevel: null,
    applicationStatus: "Interviewing",
    roundNumber: 1,
    roundName: "Round 1",
    roundType: "System Design",
    scheduledAt: null,
    durationMinutes: null,
    timezone: null,
    status: "Scheduled",
    result: "Pending",
    state: "upcoming",
    modules: [],
    needsSignalClarification: false,
    clarificationPrompt: null,
    executionGuideSlugs: [],
    preparationHref: "/interviews/r1/prepare",
    preparation: { completed: 0, total: 0 },
    ...overrides,
  };
}

function overviewOf(upcomingRounds, unscheduledRounds = []) {
  return { upcomingRounds, unscheduledRounds };
}

const NOW = new Date("2026-08-19T12:00:00Z");

// --- Canonical area extraction ------------------------------------------
{
  const targets = buildInterviewPlaybookPlanningTargets(
    overviewOf([round({ id: "r1", executionGuideSlugs: ["technical-screen", "algorithmic-coding", "system-design"] })]),
    NOW,
  );
  check("mixed slugs produce exactly the two canonical areas", arraysEqual(targets[0].areas, ["algorithmic-coding", "system-design"]));
  check("technical-screen is not included in areas", !targets[0].areas.includes("technical-screen"));
}
{
  const ALL_NINE = [
    "algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design",
    "system-design", "ml-system-design", "behavioral", "project-deep-dive",
  ];
  const targets = buildInterviewPlaybookPlanningTargets(overviewOf([round({ id: "r1", executionGuideSlugs: ALL_NINE })]), NOW);
  check("all nine canonical planner areas are accepted", arraysEqual(targets[0].areas, ALL_NINE));
}
for (const nonArea of [
  "recruiter-screen", "online-assessment", "take-home", "technical-screen",
  "hiring-manager", "cross-functional", "technical-presentation",
]) {
  const targets = buildInterviewPlaybookPlanningTargets(
    overviewOf([round({ id: "r1", executionGuideSlugs: [nonArea, "system-design"] })]),
    NOW,
  );
  check(`non-area slug filtered: ${nonArea}`, arraysEqual(targets[0].areas, ["system-design"]));
}

// --- Non-specialist round exclusion (critical regression) ----------------
{
  const projection = buildInterviewPlaybookPlanningProjection({
    overview: overviewOf([round({ id: "r1", executionGuideSlugs: ["recruiter-screen"], needsSignalClarification: false })]),
    now: NOW,
  });
  check("recruiter-screen-only active round: projection is null", projection === null);
}
{
  const projection = buildInterviewPlaybookPlanningProjection({
    overview: overviewOf([round({ id: "r1", executionGuideSlugs: ["hiring-manager"], needsSignalClarification: false })]),
    now: NOW,
  });
  check("hiring-manager-only active round: projection is null", projection === null);
}
{
  const projection = buildInterviewPlaybookPlanningProjection({
    overview: overviewOf([round({ id: "r1", executionGuideSlugs: ["cross-functional"], needsSignalClarification: false })]),
    now: NOW,
  });
  check("cross-functional-only active round: projection is null", projection === null);
}
{
  // Positive control: the same non-specialist slug alone, but WITH clarification, must still be included.
  const targets = buildInterviewPlaybookPlanningTargets(
    overviewOf([round({ id: "r1", executionGuideSlugs: ["recruiter-screen"], needsSignalClarification: true })]),
    NOW,
  );
  check("negative-control counterpart: clarification target is not excluded", targets.length === 1);
}

// --- Clarification inclusion ----------------------------------------------
{
  const projection = buildInterviewPlaybookPlanningProjection({
    overview: overviewOf([round({ id: "r1", executionGuideSlugs: ["technical-screen"], needsSignalClarification: true, scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" })]),
    now: NOW,
  });
  const targets = buildInterviewPlaybookPlanningTargets(
    overviewOf([round({ id: "r1", executionGuideSlugs: ["technical-screen"], needsSignalClarification: true })]),
    NOW,
  );
  check("clarification target has empty areas", arraysEqual(targets[0].areas, []));
  check("clarification target carries needsSignalClarification: true", targets[0].needsSignalClarification === true);
  check("projection contains clarify-target", projection.actions.some((a) => a.kind === "clarify-target"));
  check("projection contains no mock for a clarification-only scope", !projection.actions.some((a) => a.kind === "mock"));
}

// --- Upcoming timing (explicit IANA timezone, calendar-day semantics) ----
{
  const now = new Date("2026-08-19T20:00:00Z");
  const sameDay = buildInterviewPlaybookPlanningTargets(
    overviewOf([round({ id: "r1", executionGuideSlugs: ["system-design"], scheduledAt: "2026-08-19T23:00:00Z", timezone: "UTC" })]),
    now,
  );
  check("same local calendar day -> daysUntil 0", sameDay[0].daysUntil === 0);
  const nextDay = buildInterviewPlaybookPlanningTargets(
    overviewOf([round({ id: "r1", executionGuideSlugs: ["system-design"], scheduledAt: "2026-08-20T01:00:00Z", timezone: "UTC" })]),
    now,
  );
  check("next local calendar day -> daysUntil 1", nextDay[0].daysUntil === 1);
}

// --- Unscheduled -------------------------------------------------------------
{
  const projection = buildInterviewPlaybookPlanningProjection({
    overview: overviewOf([], [round({ id: "r1", executionGuideSlugs: ["system-design"], scheduledAt: null })]),
    now: NOW,
  });
  const targets = buildInterviewPlaybookPlanningTargets(
    overviewOf([], [round({ id: "r1", executionGuideSlugs: ["system-design"], scheduledAt: null })]),
    NOW,
  );
  check("unscheduled round -> daysUntil null", targets[0].daysUntil === null);
  check("unscheduled-only target produces no mock", !projection.actions.some((a) => a.kind === "mock"));
}

// --- Overdue separation ----------------------------------------------------
{
  // Only upcoming/unscheduled reach the function; an overdue round is simply
  // never placed into either array, and its id must not surface anywhere.
  const overview = overviewOf([round({ id: "upcoming-1", executionGuideSlugs: ["system-design"], scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" })]);
  const projection = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
  const allTargetIds = projection.actions.flatMap((a) => a.targetIds);
  check("an overdue round id never appears in target metadata/action targetIds", !allTargetIds.includes("overdue-round-id"));
  check("source: planner-integration.ts does not read overdueRounds", !integrationSource.includes("overdueRounds"));
}

// --- Neutral diagnostic: no inferred evidence -----------------------------
{
  const projection = buildInterviewPlaybookPlanningProjection({
    overview: overviewOf([round({ id: "r1", executionGuideSlugs: ["system-design"], scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" })]),
    now: NOW,
  });
  const sdAction = projection.actions.find((a) => a.area === "system-design");
  check("7-day System Design with no persisted evidence -> baseline-check", sdAction.kind === "baseline-check");
  check("not review", !projection.actions.some((a) => a.area === "system-design" && a.kind === "review"));
  check("not targeted-repair", !projection.actions.some((a) => a.area === "system-design" && a.kind === "targeted-repair"));
  check("not learn", !projection.actions.some((a) => a.area === "system-design" && a.kind === "learn"));
}
{
  const projection = buildInterviewPlaybookPlanningProjection({
    overview: overviewOf([round({ id: "r1", executionGuideSlugs: ["behavioral"], scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" })]),
    now: NOW,
  });
  const behAction = projection.actions.find((a) => a.area === "behavioral");
  check("7-day Behavioral with unknown coverage -> baseline-check", behAction.kind === "baseline-check");
  check("coverage is not inferred (no complete-coverage)", !projection.actions.some((a) => a.area === "behavioral" && a.kind === "complete-coverage"));
}

// --- Multi-target sharing --------------------------------------------------
{
  const overview = overviewOf([
    round({ id: "r1", applicationId: "a1", executionGuideSlugs: ["system-design"], scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" }),
    round({ id: "r2", applicationId: "a2", executionGuideSlugs: ["system-design"], scheduledAt: "2026-09-19T00:00:00Z", timezone: "UTC" }),
  ]);
  const projection = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
  const sdActions = projection.actions.filter((a) => a.area === "system-design");
  check("one System Design action generated (not duplicated per round)", sdActions.length === 1);
  check("its targetIds contain both round ids", arraysEqual([...sdActions[0].targetIds].sort(), ["r1", "r2"]));
}

// --- Final-phase filtering --------------------------------------------------
{
  const overview = overviewOf([round({ id: "r1", executionGuideSlugs: ["system-design"], scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" })]);
  const projection = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
  check("no taper action presented", !projection.actions.some((a) => a.kind === "taper"));
  check("no rest action presented", !projection.actions.some((a) => a.kind === "rest"));
  check("hiddenFinalPhaseActionCount > 0 (taper+rest exist but are hidden)", projection.hiddenFinalPhaseActionCount > 0);
}

// --- Action cap --------------------------------------------------------------
{
  const areas = ["algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design", "system-design", "ml-system-design", "behavioral", "project-deep-dive"];
  const overview = overviewOf(areas.map((area, index) => round({
    id: `r${index}`,
    applicationId: `a${index}`,
    executionGuideSlugs: [area],
    scheduledAt: "2026-08-26T00:00:00Z",
    timezone: "UTC",
  })));
  const projection = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
  check("more than six planner actions exist before capping", projection.hiddenActionCount > 0);
  check("presented actions capped at six", projection.actions.length === 6);
  check("first six preserve planner order (not alphabetized)", arraysEqual(projection.actions.map((a) => a.area), areas.slice(0, 6)));
}

// --- Deferral cap (tested via the presentation helper directly) -----------
{
  const fakePlan = {
    horizonBand: "seven-day",
    earliestDaysUntil: 5,
    availableHoursPerWeek: null,
    constraints: [],
    actions: [],
    deferred: [
      { area: "algorithmic-coding", reason: "explicit-priority-outside-urgent-target", targetIds: [] },
      { area: "system-design", reason: "explicit-priority-outside-urgent-target", targetIds: [] },
      { area: "ml-system-design", reason: "explicit-priority-outside-urgent-target", targetIds: [] },
    ],
    warnings: [],
  };
  const presentation = presentInterviewAdaptivePlan(fakePlan, new Map());
  check("deferrals capped at two", presentation.deferred.length === 2);
  check("hiddenDeferralCount reflects the remaining one", presentation.hiddenDeferralCount === 1);
  check("presented deferrals preserve source order", arraysEqual(presentation.deferred.map((d) => d.area), ["algorithmic-coding", "system-design"]));
}
{
  // Each of the three deferral reasons produces sensible, non-numeric copy.
  const fakePlan = {
    horizonBand: "three-day",
    earliestDaysUntil: 3,
    availableHoursPerWeek: 0,
    constraints: [],
    actions: [],
    deferred: [
      { area: "system-design", reason: "supported-lower-need-under-urgent-horizon", targetIds: ["r1"] },
      { area: "behavioral", reason: "zero-capacity", targetIds: ["r1"] },
    ],
    warnings: [],
  };
  const presentation = presentInterviewAdaptivePlan(fakePlan, new Map());
  check("supported-lower-need deferral has a title and description", presentation.deferred[0].title.length > 0 && presentation.deferred[0].description.length > 0);
  check("zero-capacity deferral has a title and description", presentation.deferred[1].title.length > 0 && presentation.deferred[1].description.length > 0);
  const serialized = JSON.stringify(presentation.deferred).toLowerCase();
  check("deferral copy contains no numeric score language", !/\bscore\b|\d+%|\bprobability\b/.test(serialized));
}

// --- Href ownership ----------------------------------------------------------
{
  const HREF_CASES = [
    ["algorithmic-coding", "/dsa"],
    ["system-design", "/system-design"],
    ["ml-system-design", "/ml-design"],
    ["behavioral", "/behavioral/workspace"],
    ["practical-coding", "/interview-tips/rounds/practical-coding"],
    ["debugging", "/interview-tips/rounds/debugging"],
    ["code-review", "/interview-tips/rounds/code-review"],
    ["low-level-design", "/interview-tips/rounds/low-level-design"],
    ["project-deep-dive", "/interview-tips/rounds/project-deep-dive"],
  ];
  for (const [area, expectedHref] of HREF_CASES) {
    const overview = overviewOf([round({ id: "r1", executionGuideSlugs: [area], scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" })]);
    const projection = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
    const action = projection.actions.find((a) => a.area === area);
    check(`href ownership: ${area} -> ${expectedHref}`, action?.href === expectedHref);
  }
}
{
  const overview = overviewOf([round({ id: "r1", executionGuideSlugs: ["system-design"], scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" })]);
  const projection = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
  const mockAction = projection.actions.find((a) => a.kind === "mock");
  check("mock href -> /mock-interviews", mockAction?.href === "/mock-interviews");
}
{
  const overview = overviewOf([round({ id: "r1", applicationId: "app-42", executionGuideSlugs: ["technical-screen"], needsSignalClarification: true, scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" })]);
  const projection = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
  const clarifyAction = projection.actions.find((a) => a.kind === "clarify-target");
  check("clarify-target resolves /applications/{applicationId}/rounds/{roundId}/edit", clarifyAction?.href === "/applications/app-42/rounds/r1/edit");
}

// --- Missing target metadata fallback ---------------------------------------
{
  const fakePlan = {
    horizonBand: "seven-day",
    earliestDaysUntil: 5,
    availableHoursPerWeek: null,
    constraints: [],
    actions: [
      { kind: "clarify-target", stage: "now", area: null, targetIds: ["unresolvable-round"], reasons: ["target-needs-clarification"] },
    ],
    deferred: [],
    warnings: [],
  };
  const presentation = presentInterviewAdaptivePlan(fakePlan, new Map());
  check("unresolved target metadata -> href is null, not a fabricated application link", presentation.actions[0].href === null);
}

// --- Page integration source assertions -------------------------------------
check("page imports buildInterviewPlaybookPlanningProjection", pageSource.includes("buildInterviewPlaybookPlanningProjection"));
check("page calls the projection with overview and now", /buildInterviewPlaybookPlanningProjection\(\{\s*overview,\s*now\s*\}\)/.test(pageSource));
check("page still calls getInterviewPlaybookOverview(now)", pageSource.includes("getInterviewPlaybookOverview(now)"));
check("page still uses overview.primaryAction", pageSource.includes("overview.primaryAction"));
check("page still uses primaryAction", pageSource.includes("primaryAction"));
check("page still renders InterviewPlaybookFinalPreparationMode", pageSource.includes("<InterviewPlaybookFinalPreparationMode"));
check("page contains the required source-limitation copy", pageSource.includes("does not infer performance evidence, confidence, or available study time"));
check("page still contains the checklist-not-readiness copy", pageSource.includes("Checklist completion is planning progress, not interview readiness or a probability of passing."));
{
  const dominantIndex = pageSource.indexOf("renderDominantAction()");
  const finalPrepIndex = pageSource.indexOf("InterviewPlaybookFinalPreparationMode guidance=");
  const strategyIndex = pageSource.indexOf("Adaptive preparation strategy");
  check("strategy section appears after the dominant action render call", strategyIndex > dominantIndex);
  check("strategy section appears after the final-preparation panel", strategyIndex > finalPrepIndex);
}
check("page defines only one `new Date()` call", (pageSource.match(/new Date\(\)/g) ?? []).length === 1);
for (const forbidden of ["based on your performance", "based on your weaknesses", "based on your readiness"]) {
  check(`page does not contain forbidden phrase: "${forbidden}"`, !pageSource.toLowerCase().includes(forbidden));
}
for (const forbidden of ["readinessScore", "passProbability", "hiringPrediction", "overallReadiness"]) {
  const identifierRegex = new RegExp(`\\b${forbidden}\\b`);
  check(`page does not introduce identifier: ${forbidden}`, !identifierRegex.test(pageSource));
}

// --- Architecture / purity ---------------------------------------------------
for (const [label, ok] of [
  ["does not import React", !integrationSource.includes('from "react"')],
  ["does not import Next.js", !integrationSource.includes('from "next')],
  ["does not import Supabase", !/^import.*supabase/im.test(integrationSource) && !integrationSource.includes("createSupabase")],
  ["does not import auth", !integrationSource.includes("getAuthenticatedActor") && !integrationSource.includes("auth.uid")],
  ["does not import database types", !integrationSource.includes("database.types")],
  ["does not import queries.ts", !/from\s+"\.\/queries/.test(integrationSource)],
  ["does not contain server-only", !integrationSource.includes('"server-only"')],
  ["does not call fetch", !integrationSource.includes("fetch(")],
  ["does not use localStorage", !integrationSource.includes("localStorage")],
  ["does not use sessionStorage", !integrationSource.includes("sessionStorage")],
  ["does not read process.env", !integrationSource.includes("process.env")],
  ["does not call Math.random", !integrationSource.includes("Math.random")],
  ["does not instantiate the Date constructor", !integrationSource.includes("new Date(")],
  ["does not call Date.now()", !integrationSource.includes("Date.now(")],
]) check(`planner-integration.ts ${label}`, ok);

check("planner-integration.ts imports from ./overview.ts", /from\s+"\.\/overview\.ts"/.test(integrationSource));
check("planner-integration.ts imports from ./timing.ts", /from\s+"\.\/timing\.ts"/.test(integrationSource));
check("planner-integration.ts imports from ./evidence.ts", /from\s+"\.\/evidence\.ts"/.test(integrationSource));
check("planner-integration.ts imports from ./diagnostic.ts", /from\s+"\.\/diagnostic\.ts"/.test(integrationSource));
check("planner-integration.ts imports from ./planning.ts", /from\s+"\.\/planning\.ts"/.test(integrationSource));
check("planner-integration.ts does not import round-execution", !/from\s+"[^"]*round-execution/.test(integrationSource));
check("planner-integration.ts does not import dossiers", !/from\s+"[^"]*\/dossiers/.test(integrationSource));
check("planner-integration.ts does not import next-action", !/from\s+"[^"]*next-action/.test(integrationSource));
check("planner-integration.ts does not duplicate the nine-area constant", integrationSource.includes("INTERVIEW_PREPARATION_AREAS") && !/"algorithmic-coding",\s*\n\s*"practical-coding"/.test(integrationSource));

// --- No inference ---------------------------------------------------------------
for (const forbiddenSource of [
  "dsa_question_progress", "system_design_attempts", "system_design_item_progress",
  "behavioral_stories", "behavioral_answers", "interview_preparations",
]) {
  check(`planner-integration.ts does not reference: ${forbiddenSource}`, !integrationSource.includes(forbiddenSource));
}
check("planner-integration.ts does not read checklist completion fields", !integrationSource.includes("preparationCounts") && !integrationSource.includes(".completed") && !integrationSource.includes(".total"));

// --- Determinism / immutability -------------------------------------------------
{
  const round1 = round({ id: "r1", executionGuideSlugs: ["system-design", "behavioral"], scheduledAt: "2026-08-26T00:00:00Z", timezone: "UTC" });
  const round2 = round({ id: "r2", executionGuideSlugs: ["ml-system-design"], scheduledAt: null });
  const overview = overviewOf([round1], [round2]);
  const overviewBefore = JSON.stringify(overview);
  const slugsBefore = JSON.stringify(round1.executionGuideSlugs);

  const projection1 = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
  const projection2 = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
  check("same overview + same now -> deeply equal projection", deepEqual(projection1, projection2));
  check("overview not mutated", JSON.stringify(overview) === overviewBefore);
  check("round.executionGuideSlugs not mutated", JSON.stringify(round1.executionGuideSlugs) === slugsBefore);
}

for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview Playbook planner product integration qualification passed (${cases.length} cases).`);
