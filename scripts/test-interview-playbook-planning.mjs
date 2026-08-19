import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildInterviewDiagnosticSnapshot } from "../lib/interview-playbook/diagnostic.ts";
import {
  INTERVIEW_PLAN_HORIZON_BANDS,
  INTERVIEW_PLAN_ACTION_KINDS,
  INTERVIEW_PLAN_ACTION_STAGES,
  INTERVIEW_PLAN_ACTION_REASONS,
  INTERVIEW_PLAN_DEFERRAL_REASONS,
  INTERVIEW_PLAN_WARNINGS,
  resolveInterviewPlanHorizonBand,
  buildAdaptiveInterviewPlan,
} from "../lib/interview-playbook/planning.ts";

const root = process.cwd();
const planningSource = readFileSync(join(root, "lib/interview-playbook/planning.ts"), "utf8");
const diagnosticSource = readFileSync(join(root, "lib/interview-playbook/diagnostic.ts"), "utf8");
const evidenceSource = readFileSync(join(root, "lib/interview-playbook/evidence.ts"), "utf8");

const cases = [];
const check = (name, ok) => cases.push([name, Boolean(ok)]);
const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const evidenceItem = (overrides) => ({
  id: "id",
  area: "algorithmic-coding",
  provenance: "direct-observation",
  kind: "practice",
  signal: "positive",
  observedAt: null,
  summary: null,
  repeatedError: false,
  ...overrides,
});

function baseDiagnostic(overrides = {}) {
  return buildInterviewDiagnosticSnapshot({
    availableHoursPerWeek: null,
    confidenceByArea: {},
    constraints: [],
    priorities: [],
    evidence: [],
    coverage: { behavioralStories: "unknown", projectDeepDive: "unknown" },
    ...overrides,
  });
}

function target(overrides) {
  return { id: "t", daysUntil: null, areas: [], needsSignalClarification: false, ...overrides };
}

function kinds(plan) {
  return plan.actions.map((a) => a.kind);
}
function actionsFor(plan, area) {
  return plan.actions.filter((a) => a.area === area);
}
function kindsFor(plan, area) {
  return actionsFor(plan, area).map((a) => a.kind);
}
// --- Horizon taxonomy -----------------------------------------------------
check("exactly 8 horizon bands", INTERVIEW_PLAN_HORIZON_BANDS.length === 8);
check("horizon bands in exact order", arraysEqual(INTERVIEW_PLAN_HORIZON_BANDS, [
  "one-day", "three-day", "seven-day", "thirty-day", "sixty-day", "ninety-day", "long-range", "unscheduled",
]));
check("horizon bands unique", new Set(INTERVIEW_PLAN_HORIZON_BANDS).size === 8);

const HORIZON_CASES = [
  [null, "unscheduled"], [0, "one-day"], [1, "one-day"], [2, "three-day"], [3, "three-day"],
  [4, "seven-day"], [7, "seven-day"], [8, "thirty-day"], [17, "thirty-day"], [30, "thirty-day"],
  [31, "sixty-day"], [60, "sixty-day"], [61, "ninety-day"], [90, "ninety-day"], [91, "long-range"],
  [NaN, "unscheduled"], [Infinity, "unscheduled"], [-Infinity, "unscheduled"],
];
for (const [input, expected] of HORIZON_CASES) {
  check(`resolveInterviewPlanHorizonBand(${input}) -> ${expected}`, resolveInterviewPlanHorizonBand(input) === expected);
}
check("fractional positive value rounds upward: 6.2 -> seven-day", resolveInterviewPlanHorizonBand(6.2) === "seven-day");
check("fractional positive value rounds upward: 7.1 -> thirty-day (crosses boundary)", resolveInterviewPlanHorizonBand(7.1) === "thirty-day");
check("fractional positive value rounds upward: 1.1 -> three-day (crosses boundary)", resolveInterviewPlanHorizonBand(1.1) === "three-day");

// --- Expired targets --------------------------------------------------------
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "expired", daysUntil: -5, areas: ["debugging"], needsSignalClarification: false })],
  });
  check("negative target ignored for planning (no debugging action)", actionsFor(plan, "debugging").length === 0);
  check("warning expired-target-ignored present", plan.warnings.includes("expired-target-ignored"));
  check("expired target creates no mock", !plan.actions.some((a) => a.kind === "mock"));
  check("expired target creates no taper/rest", !plan.actions.some((a) => a.kind === "taper" || a.kind === "rest"));
}

// --- Clarification -----------------------------------------------------------
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "c1", daysUntil: 10, areas: ["system-design"], needsSignalClarification: true })],
  });
  check("needsSignalClarification target emits clarify-target", plan.actions.some((a) => a.kind === "clarify-target" && a.targetIds.includes("c1")));
  check("clarification target's areas ignored (no system-design action)", actionsFor(plan, "system-design").length === 0);
  check("no mock for clarification target", !plan.actions.some((a) => a.kind === "mock"));
  check("scheduled clarification target still gets final-phase taper", plan.actions.some((a) => a.kind === "taper" && a.stage === "final-phase" && a.targetIds.includes("c1")));
  check("scheduled clarification target still gets final-phase rest", plan.actions.some((a) => a.kind === "rest" && a.stage === "final-phase" && a.targetIds.includes("c1")));
}
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "c2", daysUntil: 5, areas: [], needsSignalClarification: false })],
  });
  check("empty-area target emits clarify-target", plan.actions.some((a) => a.kind === "clarify-target" && a.targetIds.includes("c2")));
  check("empty-area target treated as needing clarification (warning present)", plan.warnings.includes("target-needs-clarification"));
}

// --- No-scope behavior --------------------------------------------------------
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [] });
  check("no targets/no priorities -> warning no-explicit-scope", plan.warnings.includes("no-explicit-scope"));
  check("no targets/no priorities -> choose-scope now", plan.actions.some((a) => a.kind === "choose-scope" && a.stage === "now"));
  check("no targets/no priorities -> not nine automatic tracks", plan.actions.filter((a) => a.area !== null).length === 0);
}
{
  const diag = baseDiagnostic({ priorities: ["behavioral", "code-review"] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [] });
  check("no target areas + explicit priorities -> those priorities planned", actionsFor(plan, "behavioral").length > 0 && actionsFor(plan, "code-review").length > 0);
  check("no target areas + explicit priorities -> unrelated areas absent", actionsFor(plan, "system-design").length === 0 && actionsFor(plan, "ml-system-design").length === 0);
  check("no target areas + explicit priorities -> no no-explicit-scope warning", !plan.warnings.includes("no-explicit-scope"));
}

// --- Area scope / priority widening ------------------------------------------
{
  const diag = baseDiagnostic({ priorities: ["system-design", "ml-system-design"] });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "urgent", daysUntil: 3, areas: ["system-design"], needsSignalClarification: false })],
  });
  check("urgent (<=7d) outside-scope priority deferred", plan.deferred.some((d) => d.area === "ml-system-design" && d.reason === "explicit-priority-outside-urgent-target"));
  check("urgent outside-scope priority not planned", actionsFor(plan, "ml-system-design").length === 0);
  check("urgent in-scope area planned", actionsFor(plan, "system-design").length > 0);
}
{
  const diag = baseDiagnostic({ priorities: ["system-design", "ml-system-design"] });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "long", daysUntil: 30, areas: ["system-design"], needsSignalClarification: false })],
  });
  check("30-day: outside priority may enter scope", actionsFor(plan, "ml-system-design").length > 0);
  check("30-day: outside priority not deferred", !plan.deferred.some((d) => d.area === "ml-system-design"));
}
{
  const diag = baseDiagnostic({ priorities: ["system-design"] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [] });
  check("unscheduled: explicit priorities may form scope", actionsFor(plan, "system-design").length > 0);
}

// --- Planning-need precedence -------------------------------------------------
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "low-level-design", signal: "positive", repeatedError: true })] });
  const dim = diag.dimensions.find((d) => d.area === "low-level-design");
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["low-level-design"], needsSignalClarification: false })] });
  check("repeated error + supported evidence -> targeted-repair planning action", kindsFor(plan, "low-level-design").includes("targeted-repair"));
  check("repeated error + supported evidence -> diagnostic evidenceState remains supported-evidence", dim.evidenceState === "supported-evidence");
  check("repeated-error reason present, negative-observed-evidence absent", plan.actions.find((a) => a.area === "low-level-design" && a.kind === "targeted-repair").reasons.includes("repeated-error") && !plan.actions.find((a) => a.area === "low-level-design" && a.kind === "targeted-repair").reasons.includes("negative-observed-evidence"));
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["debugging"], needsSignalClarification: false })] });
  check("needs-repair -> targeted-repair", kindsFor(plan, "debugging").includes("targeted-repair"));
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "code-review", signal: "mixed" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["code-review"], needsSignalClarification: false })] });
  check("mixed-evidence -> targeted-repair", kindsFor(plan, "code-review").includes("targeted-repair"));
}
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["debugging"], needsSignalClarification: false })] });
  check("unknown -> establish-evidence behavior (baseline-check present)", kindsFor(plan, "debugging").includes("baseline-check"));
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", provenance: "self-report", signal: "positive" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["debugging"], needsSignalClarification: false })] });
  check("self-reported-only -> establish-evidence behavior (baseline-check present)", kindsFor(plan, "debugging").includes("baseline-check"));
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "positive" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["debugging"], needsSignalClarification: false })] });
  check("supported-evidence -> review/maintenance behavior", kindsFor(plan, "debugging").includes("review"));
}

// --- Learn versus baseline ----------------------------------------------------
{
  const diag = baseDiagnostic({ confidenceByArea: { "system-design": "low" } });
  const plan7 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["system-design"], needsSignalClarification: false })] });
  check("technical unknown + low confidence + 7-day -> learn now", plan7.actions.some((a) => a.area === "system-design" && a.kind === "learn" && a.stage === "now"));
  check("technical unknown + low confidence + 7-day -> worked-example next", plan7.actions.some((a) => a.area === "system-design" && a.kind === "worked-example" && a.stage === "next"));
  check("technical unknown + low confidence + 7-day -> practice later", plan7.actions.some((a) => a.area === "system-design" && a.kind === "practice" && a.stage === "later"));

  const plan3 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 3, areas: ["system-design"], needsSignalClarification: false })] });
  check("same diagnostic at 3 days -> no learn", !kindsFor(plan3, "system-design").includes("learn"));
  check("same diagnostic at 3 days -> no worked-example", !kindsFor(plan3, "system-design").includes("worked-example"));
  check("same diagnostic at 3 days -> baseline-check now", plan3.actions.some((a) => a.area === "system-design" && a.kind === "baseline-check" && a.stage === "now"));
}
{
  const diagHigh = baseDiagnostic({ confidenceByArea: { "system-design": "high" } });
  const dim = diagHigh.dimensions.find((d) => d.area === "system-design");
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diagHigh, targets: [target({ id: "t", daysUntil: 30, areas: ["system-design"], needsSignalClarification: false })] });
  check("high confidence + unknown evidence -> baseline-check", kindsFor(plan, "system-design").includes("baseline-check"));
  check("high confidence + unknown evidence -> NOT review-only", !kindsFor(plan, "system-design").includes("review"));
  check("high confidence + unknown evidence -> evidence remains unknown", dim.evidenceState === "unknown");
}
{
  const diag = baseDiagnostic({ confidenceByArea: { "system-design": "medium" } });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["system-design"], needsSignalClarification: false })] });
  check("medium confidence + unknown evidence -> baseline-check", kindsFor(plan, "system-design").includes("baseline-check"));
}
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["system-design"], needsSignalClarification: false })] });
  check("unknown confidence + unknown evidence -> baseline-check", kindsFor(plan, "system-design").includes("baseline-check"));
}

// --- Behavioral / Project Deep Dive coverage ----------------------------------
{
  const diag = baseDiagnostic({ coverage: { behavioralStories: "not-started", projectDeepDive: "unknown" } });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["behavioral"], needsSignalClarification: false })] });
  check("Behavioral not-started + unknown evidence -> complete-coverage now", plan.actions.some((a) => a.area === "behavioral" && a.kind === "complete-coverage" && a.stage === "now"));
  check("Behavioral not-started + unknown evidence -> baseline-check next", plan.actions.some((a) => a.area === "behavioral" && a.kind === "baseline-check" && a.stage === "next"));
  check("no generic learn for Behavioral", !kindsFor(plan, "behavioral").includes("learn"));
}
{
  const diag = baseDiagnostic({
    coverage: { behavioralStories: "partial", projectDeepDive: "unknown" },
    evidence: [evidenceItem({ area: "behavioral", provenance: "human-evaluator-judgment", signal: "negative" })],
  });
  const dim = diag.dimensions.find((d) => d.area === "behavioral");
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["behavioral"], needsSignalClarification: false })] });
  check("Behavioral partial + needs-repair -> targeted-repair now", plan.actions.some((a) => a.area === "behavioral" && a.kind === "targeted-repair" && a.stage === "now"));
  check("Behavioral partial + needs-repair -> complete-coverage next", plan.actions.some((a) => a.area === "behavioral" && a.kind === "complete-coverage" && a.stage === "next"));
  check("coverage never mutates evidenceState (Behavioral)", dim.evidenceState === "needs-repair" && dim.preparationCoverage === "partial");
}
{
  const diag = baseDiagnostic({ coverage: { behavioralStories: "covered", projectDeepDive: "unknown" } });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["behavioral"], needsSignalClarification: false })] });
  check("Behavioral covered + unknown evidence -> baseline-check now", plan.actions.some((a) => a.area === "behavioral" && a.kind === "baseline-check" && a.stage === "now"));
  check("Behavioral covered -> no complete-coverage action", !kindsFor(plan, "behavioral").includes("complete-coverage"));
}
{
  const diag = baseDiagnostic({ coverage: { behavioralStories: "unknown", projectDeepDive: "partial" } });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["project-deep-dive"], needsSignalClarification: false })] });
  check("PDD partial + unknown -> complete-coverage now", plan.actions.some((a) => a.area === "project-deep-dive" && a.kind === "complete-coverage" && a.stage === "now"));
  check("PDD partial + unknown -> baseline-check next", plan.actions.some((a) => a.area === "project-deep-dive" && a.kind === "baseline-check" && a.stage === "next"));
  check("no generic learn for Project Deep Dive", !kindsFor(plan, "project-deep-dive").includes("learn"));
}

// --- Repair horizon behavior ---------------------------------------------------
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan1 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 1, areas: ["debugging"], needsSignalClarification: false })] });
  check("needs-repair 1-day: targeted-repair now", plan1.actions.some((a) => a.area === "debugging" && a.kind === "targeted-repair" && a.stage === "now"));
  check("needs-repair 1-day: review next", plan1.actions.some((a) => a.area === "debugging" && a.kind === "review" && a.stage === "next"));
  check("needs-repair 1-day: no learn", !kindsFor(plan1, "debugging").includes("learn"));
  check("needs-repair 1-day: no worked-example", !kindsFor(plan1, "debugging").includes("worked-example"));

  const plan3 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 3, areas: ["debugging"], needsSignalClarification: false })] });
  check("needs-repair 3-day: targeted-repair now", plan3.actions.some((a) => a.area === "debugging" && a.kind === "targeted-repair" && a.stage === "now"));
  check("needs-repair 3-day: practice next", plan3.actions.some((a) => a.area === "debugging" && a.kind === "practice" && a.stage === "next"));

  const plan7 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["debugging"], needsSignalClarification: false })] });
  check("needs-repair 7-day: targeted-repair now", plan7.actions.some((a) => a.area === "debugging" && a.kind === "targeted-repair" && a.stage === "now"));
  check("needs-repair 7-day: worked-example next", plan7.actions.some((a) => a.area === "debugging" && a.kind === "worked-example" && a.stage === "next"));
  check("needs-repair 7-day: practice later", plan7.actions.some((a) => a.area === "debugging" && a.kind === "practice" && a.stage === "later"));
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative", repeatedError: true })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["debugging"], needsSignalClarification: false })] });
  const repairAction = plan.actions.find((a) => a.area === "debugging" && a.kind === "targeted-repair");
  check("repeatedError reason present when applicable", repairAction.reasons.includes("repeated-error"));
  check("negative-observed-evidence reason present when applicable", repairAction.reasons.includes("negative-observed-evidence"));
}

// --- Mixed evidence -------------------------------------------------------------
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "code-review", signal: "mixed" })] });
  const plan1 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 1, areas: ["code-review"], needsSignalClarification: false })] });
  check("mixed 1-day: targeted-repair now", plan1.actions.some((a) => a.area === "code-review" && a.kind === "targeted-repair" && a.stage === "now"));
  check("mixed 1-day: review next", plan1.actions.some((a) => a.area === "code-review" && a.kind === "review" && a.stage === "next"));

  const plan3 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 3, areas: ["code-review"], needsSignalClarification: false })] });
  check("mixed 3-day: targeted-repair now", plan3.actions.some((a) => a.area === "code-review" && a.kind === "targeted-repair" && a.stage === "now"));
  check("mixed 3-day: practice next", plan3.actions.some((a) => a.area === "code-review" && a.kind === "practice" && a.stage === "next"));

  const plan7 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["code-review"], needsSignalClarification: false })] });
  check("mixed 7+-day: practice next also present", plan7.actions.some((a) => a.area === "code-review" && a.kind === "practice" && a.stage === "next"));
  check("mixed 7+-day: review later also present", plan7.actions.some((a) => a.area === "code-review" && a.kind === "review" && a.stage === "later"));
}

// --- Supported maintenance and deliberate skipping ------------------------------
{
  const diag = baseDiagnostic({
    evidence: [
      evidenceItem({ area: "debugging", signal: "negative" }),
      evidenceItem({ area: "code-review", provenance: "direct-observation", signal: "positive" }),
    ],
  });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 3, areas: ["debugging", "code-review"], needsSignalClarification: false })],
  });
  check("urgent 3-day: supported area deferred", plan.deferred.some((d) => d.area === "code-review" && d.reason === "supported-lower-need-under-urgent-horizon"));
  check("urgent 3-day: supported area has no review action", !kindsFor(plan, "code-review").includes("review"));
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "code-review", provenance: "direct-observation", signal: "positive" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 3, areas: ["code-review"], needsSignalClarification: false })] });
  check("all-relevant-areas-supported at 3 days: review rather than deferred", kindsFor(plan, "code-review").includes("review"));
  check("all-relevant-areas-supported at 3 days: not deferred", !plan.deferred.some((d) => d.area === "code-review"));
  const reviewAction = plan.actions.find((a) => a.area === "code-review" && a.kind === "review");
  check("review stage next at 3-day", reviewAction.stage === "next");
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "code-review", provenance: "direct-observation", signal: "positive" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["code-review"], needsSignalClarification: false })] });
  const reviewAction = plan.actions.find((a) => a.area === "code-review" && a.kind === "review");
  check("7+ day plan: supported area gets review later", reviewAction.stage === "later");
  check("supported-maintenance reason present on maintain review", reviewAction.reasons.includes("supported-maintenance"));
}

// --- Maintain + coverage independence ------------------------------------------------
{
  // Behavioral: supported-evidence + partial coverage + 30-day target, no higher-need area
  const diag = baseDiagnostic({
    coverage: { behavioralStories: "partial", projectDeepDive: "unknown" },
    evidence: [evidenceItem({ area: "behavioral", provenance: "direct-observation", signal: "positive" })],
  });
  const dim = diag.dimensions.find((d) => d.area === "behavioral");
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 30, areas: ["behavioral"], needsSignalClarification: false })] });
  check("maintain+partial coverage: diagnostic evidenceState remains supported-evidence", dim.evidenceState === "supported-evidence");
  check("maintain+partial coverage: complete-coverage exists", kindsFor(plan, "behavioral").includes("complete-coverage"));
  const coverageAction = plan.actions.find((a) => a.area === "behavioral" && a.kind === "complete-coverage");
  check("maintain+partial coverage: complete-coverage stage next", coverageAction.stage === "next");
  check("maintain+partial coverage: reason coverage-partial", coverageAction.reasons.includes("coverage-partial"));
  const reviewAction = plan.actions.find((a) => a.area === "behavioral" && a.kind === "review");
  check("maintain+partial coverage: review exists stage later (30-day)", reviewAction.stage === "later");
  check("maintain+partial coverage: no learn", !kindsFor(plan, "behavioral").includes("learn"));
}
{
  // Project Deep Dive: supported-evidence + not-started coverage + 3-day target, no higher-need area
  const diag = baseDiagnostic({
    coverage: { behavioralStories: "unknown", projectDeepDive: "not-started" },
    evidence: [evidenceItem({ area: "project-deep-dive", provenance: "direct-observation", signal: "positive" })],
  });
  const dim = diag.dimensions.find((d) => d.area === "project-deep-dive");
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 3, areas: ["project-deep-dive"], needsSignalClarification: false })] });
  check("PDD maintain+not-started: evidenceState remains supported-evidence", dim.evidenceState === "supported-evidence");
  const coverageAction = plan.actions.find((a) => a.area === "project-deep-dive" && a.kind === "complete-coverage");
  check("PDD maintain+not-started: complete-coverage exists stage next", coverageAction?.stage === "next");
  check("PDD maintain+not-started: reason coverage-not-started", coverageAction?.reasons.includes("coverage-not-started"));
  const reviewAction = plan.actions.find((a) => a.area === "project-deep-dive" && a.kind === "review");
  check("PDD maintain+not-started: review exists stage next (3-day)", reviewAction?.stage === "next");
  const coverageIndex = plan.actions.findIndex((a) => a.area === "project-deep-dive" && a.kind === "complete-coverage");
  const reviewIndex = plan.actions.findIndex((a) => a.area === "project-deep-dive" && a.kind === "review");
  check("PDD maintain+not-started: complete-coverage appears before review in final action order", coverageIndex < reviewIndex);
}
{
  // Urgent deliberate deferral: Behavioral (supported+partial coverage) deferred; Debugging repair remains
  const diag = baseDiagnostic({
    coverage: { behavioralStories: "partial", projectDeepDive: "unknown" },
    evidence: [
      evidenceItem({ area: "behavioral", provenance: "direct-observation", signal: "positive" }),
      evidenceItem({ area: "debugging", provenance: "direct-observation", signal: "negative" }),
    ],
  });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 3, areas: ["behavioral", "debugging"], needsSignalClarification: false })],
  });
  check("urgent deferral: Behavioral deferred with supported-lower-need-under-urgent-horizon", plan.deferred.some((d) => d.area === "behavioral" && d.reason === "supported-lower-need-under-urgent-horizon"));
  check("urgent deferral: NO Behavioral complete-coverage action", !kindsFor(plan, "behavioral").includes("complete-coverage"));
  check("urgent deferral: NO Behavioral review action", !kindsFor(plan, "behavioral").includes("review"));
  check("urgent deferral: Debugging repair remains selected", kindsFor(plan, "debugging").includes("targeted-repair"));
}

// --- Mock versus repair -----------------------------------------------------------
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 3, areas: ["debugging"], needsSignalClarification: false })] });
  check("3-day target with repair area: NO mock", !kinds(plan).includes("mock"));
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "positive" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 3, areas: ["debugging"], needsSignalClarification: false })] });
  check("3-day target with only supported/establish areas: one target-specific mock stage next", plan.actions.filter((a) => a.kind === "mock").length === 1 && plan.actions.find((a) => a.kind === "mock").stage === "next");
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["debugging"], needsSignalClarification: false })] });
  check("7-day target with repair: mock exists stage later", plan.actions.some((a) => a.kind === "mock" && a.stage === "later"));
  check("7-day target with repair: repair exists stage now", plan.actions.some((a) => a.kind === "targeted-repair" && a.stage === "now"));
  const repairIndex = plan.actions.findIndex((a) => a.kind === "targeted-repair");
  const mockIndex = plan.actions.findIndex((a) => a.kind === "mock");
  check("repair appears before mock in action array", repairIndex < mockIndex);
}
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 1, areas: ["debugging"], needsSignalClarification: false })] });
  check("1-day target: no mock", !kinds(plan).includes("mock"));
}
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: null, areas: ["debugging"], needsSignalClarification: false })] });
  check("unscheduled target: no target mock", !kinds(plan).includes("mock"));
}
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 10, areas: [], needsSignalClarification: false })] });
  check("clarification target: no mock", !kinds(plan).includes("mock"));
}

// --- Taper / rest -----------------------------------------------------------------
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 60, areas: ["system-design"], needsSignalClarification: false })] });
  check("scheduled non-expired target: taper final-phase", plan.actions.some((a) => a.kind === "taper" && a.stage === "final-phase" && a.targetIds.includes("t")));
  check("scheduled non-expired target: rest final-phase", plan.actions.some((a) => a.kind === "rest" && a.stage === "final-phase" && a.targetIds.includes("t")));
}
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: null, areas: ["system-design"], needsSignalClarification: false })] });
  check("unscheduled target: no taper", !kinds(plan).includes("taper"));
  check("unscheduled target: no rest", !kinds(plan).includes("rest"));
}
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: -3, areas: ["system-design"], needsSignalClarification: false })] });
  check("expired target: no taper", !kinds(plan).includes("taper"));
  check("expired target: no rest", !kinds(plan).includes("rest"));
}

// --- Zero capacity -----------------------------------------------------------------
{
  const diag = baseDiagnostic({ availableHoursPerWeek: 0, evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["debugging"], needsSignalClarification: false })] });
  const dim = diag.dimensions.find((d) => d.area === "debugging");
  check("availableHoursPerWeek=0: warning no-available-capacity", plan.warnings.includes("no-available-capacity"));
  for (const suppressedKind of ["complete-coverage", "baseline-check", "learn", "worked-example", "targeted-repair", "practice", "review", "mock"]) {
    check(`availableHoursPerWeek=0: ${suppressedKind} suppressed`, !kinds(plan).includes(suppressedKind));
  }
  check("availableHoursPerWeek=0: area deferral reason zero-capacity", plan.deferred.some((d) => d.area === "debugging" && d.reason === "zero-capacity"));
  check("availableHoursPerWeek=0: taper for scheduled target remains", plan.actions.some((a) => a.kind === "taper"));
  check("availableHoursPerWeek=0: rest for scheduled target remains", plan.actions.some((a) => a.kind === "rest"));
  check("availableHoursPerWeek=0: evidence state unchanged", dim.evidenceState === "needs-repair");
}
{
  const diag = baseDiagnostic({ availableHoursPerWeek: 0 });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 5, areas: [], needsSignalClarification: false })],
  });
  check("availableHoursPerWeek=0 + clarification target: warning no-available-capacity", plan.warnings.includes("no-available-capacity"));
  check("availableHoursPerWeek=0 does not remove clarify-target", plan.actions.some((a) => a.kind === "clarify-target"));
  check("availableHoursPerWeek=0 does not remove choose-scope", plan.actions.some((a) => a.kind === "choose-scope"));
  for (const suppressedKind of ["complete-coverage", "baseline-check", "learn", "worked-example", "targeted-repair", "practice", "review", "mock"]) {
    check(`availableHoursPerWeek=0 + clarification target: ${suppressedKind} suppressed`, !kinds(plan).includes(suppressedKind));
  }
  check("availableHoursPerWeek=0 + clarification target: taper may remain (target is scheduled)", plan.actions.some((a) => a.kind === "taper"));
  check("availableHoursPerWeek=0 + clarification target: rest may remain (target is scheduled)", plan.actions.some((a) => a.kind === "rest"));
}
{
  const diagFreeText = baseDiagnostic({
    availableHoursPerWeek: 10,
    constraints: [{ id: "c1", category: "health", description: "Zero hours available due to illness." }],
    evidence: [evidenceItem({ area: "debugging", signal: "negative" })],
  });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diagFreeText, targets: [target({ id: "t", daysUntil: 7, areas: ["debugging"], needsSignalClarification: false })] });
  check("zero capacity not inferred from free-text constraint", !plan.warnings.includes("no-available-capacity") && kinds(plan).includes("targeted-repair"));
}

// --- Constraints ---------------------------------------------------------------------
{
  const constraints = [
    { id: "c1", category: "work", description: "Work constraint." },
    { id: "c2", category: "school", description: "School constraint." },
    { id: "c3", category: "health", description: "Health constraint." },
    { id: "c4", category: "family", description: "Family constraint." },
    { id: "c5", category: "other", description: "Other constraint." },
  ];
  const diag = baseDiagnostic({ constraints });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [] });
  check("constraints preserved in input order", arraysEqual(plan.constraints.map((c) => c.id), ["c1", "c2", "c3", "c4", "c5"]));
}
{
  const diagA = baseDiagnostic({
    constraints: [{ id: "h1", category: "health", description: "Serious health constraint." }],
    availableHoursPerWeek: 10,
    evidence: [evidenceItem({ area: "low-level-design", provenance: "direct-observation", signal: "positive" })],
  });
  const diagB = baseDiagnostic({
    constraints: [{ id: "h1", category: "health", description: "Minor health note." }],
    availableHoursPerWeek: 10,
    evidence: [evidenceItem({ area: "low-level-design", provenance: "direct-observation", signal: "positive" })],
  });
  const planA = buildAdaptiveInterviewPlan({ diagnostic: diagA, targets: [target({ id: "t", daysUntil: 30, areas: ["low-level-design"], needsSignalClarification: false })] });
  const planB = buildAdaptiveInterviewPlan({ diagnostic: diagB, targets: [target({ id: "t", daysUntil: 30, areas: ["low-level-design"], needsSignalClarification: false })] });
  const stripConstraints = (plan) => ({ ...plan, constraints: [] });
  check("same hours + same evidence -> same area strategy regardless of constraint wording", deepEqual(stripConstraints(planA), stripConstraints(planB)));
  const dimA = diagA.dimensions.find((d) => d.area === "low-level-design");
  check("health constraint does not alter evidenceState", dimA.evidenceState === "supported-evidence");
}

// --- Multi-target / multi-company behavior -------------------------------------------
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [
      target({ id: "A", daysUntil: 3, areas: ["system-design", "behavioral"], needsSignalClarification: false }),
      target({ id: "B", daysUntil: 30, areas: ["system-design", "ml-system-design"], needsSignalClarification: false }),
    ],
  });
  const sdActions = actionsFor(plan, "system-design");
  check("System Design area sequence generated once (single baseline-check)", sdActions.filter((a) => a.kind === "baseline-check").length === 1);
  check("System Design action targetIds include both A and B", arraysEqual([...sdActions[0].targetIds].sort(), ["A", "B"]));
  check("shared-across-targets reason present on System Design action", sdActions.some((a) => a.reasons.includes("shared-across-targets")));
  const mlActions = actionsFor(plan, "ml-system-design");
  check("ML System Design tied only to B", arraysEqual([...mlActions[0].targetIds], ["B"]));
  check("ML System Design does not carry shared-across-targets", !mlActions[0].reasons.includes("shared-across-targets"));
  const sdIndex = plan.actions.findIndex((a) => a.area === "system-design");
  const mlIndex = plan.actions.findIndex((a) => a.area === "ml-system-design");
  check("nearer target relevance outranks later-only area when otherwise comparable", sdIndex < mlIndex);
  const targetMocks = plan.actions.filter((a) => a.kind === "mock");
  check("target-specific mock actions remain separate per target", targetMocks.length === 2 && new Set(targetMocks.flatMap((m) => m.targetIds)).size === 2);
  check("no duplicated System Design preparation sequence", sdActions.length === plan.actions.filter((a) => a.area === "system-design").length);
}

// --- targetIds deduplication -----------------------------------------------------------
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "system-design", provenance: "direct-observation", signal: "positive" })] });
  const targets = [
    target({ id: "shared", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
    target({ id: "other", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
    target({ id: "shared", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
  ];
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets });
  const sdActions = actionsFor(plan, "system-design");
  check("duplicated target id: at least one System Design action generated", sdActions.length > 0);
  check("duplicated target id: every System Design action targetIds is deduplicated in first-occurrence order", sdActions.every((a) => arraysEqual([...a.targetIds], ["shared", "other"])));
  check("duplicated target id: targetIds is not [shared, other, shared]", sdActions.every((a) => a.targetIds.length === 2));
}
{
  const diag = baseDiagnostic({ availableHoursPerWeek: 0, evidence: [evidenceItem({ area: "system-design", signal: "negative" })] });
  const targets = [
    target({ id: "shared", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
    target({ id: "other", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
    target({ id: "shared", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
  ];
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets });
  const deferral = plan.deferred.find((d) => d.area === "system-design");
  check("zero-capacity deferral targetIds deduplicated in first-occurrence order", arraysEqual([...deferral.targetIds], ["shared", "other"]));
}
{
  // Negative/control case: naturally unique target IDs remain unchanged, not sorted.
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "system-design", provenance: "direct-observation", signal: "positive" })] });
  const targets = [
    target({ id: "B", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
    target({ id: "A", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
  ];
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets });
  const sdAction = actionsFor(plan, "system-design")[0];
  check("unique target IDs: existing input order remains unchanged (not alphabetized)", arraysEqual([...sdAction.targetIds], ["B", "A"]));
}

// --- Missed-day regeneration ------------------------------------------------------
{
  const diag = baseDiagnostic({ confidenceByArea: { "system-design": "low" } });
  const plan7 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["system-design"], needsSignalClarification: false })] });
  const plan3 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 3, areas: ["system-design"], needsSignalClarification: false })] });
  check("7-day plan contains learn/worked-example/practice", ["learn", "worked-example", "practice"].every((k) => kindsFor(plan7, "system-design").includes(k)));
  check("3-day regeneration: output is recomputed (different)", !deepEqual(plan7, plan3));
  check("3-day regeneration: broad learn disappears", !kindsFor(plan3, "system-design").includes("learn"));
  check("3-day regeneration: worked-example disappears", !kindsFor(plan3, "system-design").includes("worked-example"));
  check("3-day regeneration: uses baseline-check", kindsFor(plan3, "system-design").includes("baseline-check"));
  const serializedPlan3 = JSON.stringify(plan3).toLowerCase();
  for (const forbidden of ["backlog", "debt", "carryover", "penalty"]) {
    check(`3-day regeneration contains no ${forbidden} field`, !serializedPlan3.includes(forbidden));
  }
  check("7-day plan not mutated by generating the 3-day plan", kindsFor(plan7, "system-design").includes("learn"));
}

// --- Far-below scenario ------------------------------------------------------------
{
  const diag = baseDiagnostic({
    evidence: [
      evidenceItem({ area: "algorithmic-coding", provenance: "direct-observation", signal: "negative", repeatedError: true }),
      evidenceItem({ area: "system-design", provenance: "human-evaluator-judgment", signal: "negative" }),
      evidenceItem({ area: "debugging", provenance: "human-evaluator-judgment", signal: "mixed" }),
      evidenceItem({ area: "code-review", provenance: "direct-observation", signal: "positive" }),
    ],
  });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 3, areas: ["algorithmic-coding", "system-design", "debugging", "code-review"], needsSignalClarification: false })],
  });
  check("far-below: repair work selected for algorithmic-coding", kindsFor(plan, "algorithmic-coding").includes("targeted-repair"));
  check("far-below: repair work selected for system-design", kindsFor(plan, "system-design").includes("targeted-repair"));
  check("far-below: mixed work selected for debugging", kindsFor(plan, "debugging").includes("targeted-repair"));
  check("far-below: Code Review deferred", plan.deferred.some((d) => d.area === "code-review"));
  check("far-below: no mock", !kinds(plan).includes("mock"));
  check("far-below: taper remains", kinds(plan).includes("taper"));
  check("far-below: rest remains", kinds(plan).includes("rest"));
  check("far-below: no learn action anywhere", !kinds(plan).includes("learn"));
  const serialized = JSON.stringify(plan).toLowerCase();
  for (const forbidden of ["score", "probability"]) {
    check(`far-below: no ${forbidden} in output`, !serialized.includes(forbidden));
  }
}

// --- Multi-area ordering controls --------------------------------------------------
{
  // Rule 1: earlier target relevance
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [
      target({ id: "near", daysUntil: 3, areas: ["system-design"], needsSignalClarification: false }),
      target({ id: "far", daysUntil: 30, areas: ["ml-system-design"], needsSignalClarification: false }),
    ],
  });
  const sdIndex = plan.actions.findIndex((a) => a.area === "system-design");
  const mlIndex = plan.actions.findIndex((a) => a.area === "ml-system-design");
  check("rule 1 positive control: nearer target sorts first", sdIndex < mlIndex);
}
{
  // Rule 1 negative control: equal relevance falls through to rule 2 (planning need)
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 10, areas: ["debugging", "code-review"], needsSignalClarification: false })],
  });
  // both areas share the same target relevance (10 days); debugging=repair, code-review=establish-evidence
  const debugIndex = plan.actions.findIndex((a) => a.area === "debugging");
  const codeReviewIndex = plan.actions.findIndex((a) => a.area === "code-review");
  check("rule 1 negative control: equal relevance -> rule 2 (repair before establish-evidence)", debugIndex < codeReviewIndex);
}
{
  // Rule 2: planning need order (repair < resolve-mixed < establish-evidence < maintain), isolated from rule 1
  const diag = baseDiagnostic({
    evidence: [
      evidenceItem({ area: "code-review", signal: "mixed" }),
      evidenceItem({ area: "low-level-design", signal: "positive" }),
    ],
  });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 10, areas: ["code-review", "debugging", "low-level-design"], needsSignalClarification: false })],
  });
  const order = plan.actions.filter((a) => a.area !== null).map((a) => a.area);
  const firstIndex = (area) => order.indexOf(area);
  check("rule 2 positive control: mixed-evidence (code-review) before establish-evidence (debugging)", firstIndex("code-review") < firstIndex("debugging"));
  check("rule 2 positive control: establish-evidence (debugging) before maintain (low-level-design)", firstIndex("debugging") < firstIndex("low-level-design"));
}
{
  // Rule 3: explicit priority order, isolated (same relevance, same need)
  const diag = baseDiagnostic({ priorities: ["low-level-design", "system-design"] });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 10, areas: ["system-design", "low-level-design", "debugging"], needsSignalClarification: false })],
  });
  const order = plan.actions.filter((a) => a.area !== null).map((a) => a.area);
  const firstIndex = (area) => order.indexOf(area);
  check("rule 3 positive control: prioritized area (low-level-design) sorts before same-need non-priority (debugging)", firstIndex("low-level-design") < firstIndex("debugging"));
  check("rule 3 positive control: priority order preserved (low-level-design before system-design)", firstIndex("low-level-design") < firstIndex("system-design"));
}
{
  // Rule 3 negative control: without explicit priority, canonical order (rule 5) applies instead
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 10, areas: ["system-design", "debugging"], needsSignalClarification: false })],
  });
  const order = plan.actions.filter((a) => a.area !== null).map((a) => a.area);
  check("rule 3 negative control: no priorities -> canonical order decides (debugging before system-design)", order.indexOf("debugging") < order.indexOf("system-design"));
}
{
  // Rule 4: shared target coverage, isolated (same relevance/need/priority)
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [
      target({ id: "A", daysUntil: 10, areas: ["system-design", "ml-system-design"], needsSignalClarification: false }),
      target({ id: "B", daysUntil: 10, areas: ["system-design"], needsSignalClarification: false }),
    ],
  });
  const order = plan.actions.filter((a) => a.area !== null).map((a) => a.area);
  check("rule 4 positive control: area shared across more targets sorts first", order.indexOf("system-design") < order.indexOf("ml-system-design"));
}
{
  // Rule 5: canonical order as final tiebreak (all else equal)
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 10, areas: ["ml-system-design", "algorithmic-coding"], needsSignalClarification: false })],
  });
  const order = plan.actions.filter((a) => a.area !== null).map((a) => a.area);
  check("rule 5 positive control: canonical order applied when fully tied", order.indexOf("algorithmic-coding") < order.indexOf("ml-system-design"));
}

// --- Output safety --------------------------------------------------------------------
{
  const diag = baseDiagnostic({ evidence: [evidenceItem({ area: "debugging", signal: "negative" })] });
  const plan = buildAdaptiveInterviewPlan({ diagnostic: diag, targets: [target({ id: "t", daysUntil: 7, areas: ["debugging"], needsSignalClarification: false })] });
  const serialized = JSON.stringify(plan);
  const forbiddenKeys = [
    "overallReadiness", "readinessScore", "score", "weightedScore", "percentage",
    "probability", "passProbability", "hiringPrediction", "recommendedHire", "priorityScore", "riskScore",
  ];
  for (const key of forbiddenKeys) check(`runtime plan does not contain key: ${key}`, !serialized.includes(`"${key}"`));
}
{
  const forbiddenIdentifiers = [
    "priorityScore", "readinessScore", "riskScore", "passProbability", "hiringPrediction",
    "companyWeight", "roundWeight", "evidenceWeight", "confidenceWeight",
  ];
  for (const identifier of forbiddenIdentifiers) {
    const identifierRegex = new RegExp(`\\b${identifier}\\b`);
    check(`planning.ts does not introduce identifier: ${identifier}`, !identifierRegex.test(planningSource));
  }
}

// --- Purity / architecture --------------------------------------------------------------
for (const [label, ok] of [
  ["does not import React", !planningSource.includes('from "react"')],
  ["does not import Next.js", !planningSource.includes('from "next')],
  ["does not import Supabase", !/^import.*supabase/im.test(planningSource) && !planningSource.includes("createSupabase")],
  ["does not import auth", !planningSource.includes("getAuthenticatedActor") && !planningSource.includes("auth.uid")],
  ["does not import database types", !planningSource.includes("database.types")],
  ["does not import a query module", !/from\s+"[^"]*\/queries/.test(planningSource)],
  ["does not import overview.ts", !/from\s+"\.\/overview/.test(planningSource)],
  ["does not import timing.ts", !/from\s+"\.\/timing/.test(planningSource)],
  ["does not import the round resolver", !/from\s+"[^"]*round-execution/.test(planningSource)],
  ["does not import a dossier module", !/from\s+"[^"]*\/dossiers/.test(planningSource)],
  ["does not import next-action", !/from\s+"[^"]*next-action/.test(planningSource)],
  ["does not call fetch", !planningSource.includes("fetch(")],
  ["does not use localStorage", !planningSource.includes("localStorage")],
  ["does not use sessionStorage", !planningSource.includes("sessionStorage")],
  ["does not read process.env", !planningSource.includes("process.env")],
  ["does not call Date.now()", !planningSource.includes("Date.now(")],
  ["does not call new Date()", !planningSource.includes("new Date(")],
  ["does not call Math.random", !planningSource.includes("Math.random")],
  ["does not contain a Server Action", !planningSource.includes('"use server"')],
]) check(`planning.ts ${label}`, ok);

check("planning.ts imports from ./diagnostic.ts", /from\s+"\.\/diagnostic\.ts"/.test(planningSource));
check("planning.ts imports from ./evidence.ts", /from\s+"\.\/evidence\.ts"/.test(planningSource));
check("planning.ts does not duplicate the nine-area constant", !planningSource.includes('"algorithmic-coding",\n  "practical-coding"'));
check("planning.ts imports INTERVIEW_PREPARATION_AREAS rather than redefining it", planningSource.includes("INTERVIEW_PREPARATION_AREAS"));

// --- Existing boundaries -----------------------------------------------------------------
check("diagnostic.ts still exposes buildInterviewDiagnosticSnapshot", diagnosticSource.includes("export function buildInterviewDiagnosticSnapshot"));
check("evidence.ts still owns INTERVIEW_PREPARATION_AREAS", evidenceSource.includes("export const INTERVIEW_PREPARATION_AREAS"));

// --- Determinism / immutability -----------------------------------------------------------
{
  const evidence = [
    evidenceItem({ id: "1", area: "debugging", signal: "negative" }),
    evidenceItem({ id: "2", area: "behavioral", provenance: "self-report", signal: "positive" }),
  ];
  const priorities = ["behavioral", "system-design"];
  const constraints = [{ id: "c1", category: "work", description: "Some work constraint." }];
  const diag = buildInterviewDiagnosticSnapshot({
    availableHoursPerWeek: 20, confidenceByArea: {}, constraints, priorities, evidence,
    coverage: { behavioralStories: "unknown", projectDeepDive: "unknown" },
  });
  const diagBefore = JSON.stringify(diag);
  const targets = [
    target({ id: "A", daysUntil: 7, areas: ["debugging", "behavioral"], needsSignalClarification: false }),
    target({ id: "B", daysUntil: 30, areas: ["system-design"], needsSignalClarification: false }),
  ];
  const targetsBefore = JSON.stringify(targets);
  const prioritiesBefore = JSON.stringify(diag.priorities);
  const constraintsBefore = JSON.stringify(diag.constraints);
  const dimensionsBefore = JSON.stringify(diag.dimensions);

  const plan1 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets });
  const plan2 = buildAdaptiveInterviewPlan({ diagnostic: diag, targets });
  check("identical input twice -> deeply equal plan", deepEqual(plan1, plan2));
  check("diagnostic snapshot not mutated", JSON.stringify(diag) === diagBefore);
  check("targets not mutated", JSON.stringify(targets) === targetsBefore);
  check("target areas not mutated", arraysEqual(targets[0].areas, ["debugging", "behavioral"]));
  check("diagnostic.priorities not mutated", JSON.stringify(diag.priorities) === prioritiesBefore);
  check("diagnostic.constraints not mutated", JSON.stringify(diag.constraints) === constraintsBefore);
  check("dimension objects not mutated", JSON.stringify(diag.dimensions) === dimensionsBefore);
}

// --- Action / reason / warning / deferral taxonomy ------------------------------------
check("exactly 12 action kinds", INTERVIEW_PLAN_ACTION_KINDS.length === 12);
check("action kinds match exactly", arraysEqual(INTERVIEW_PLAN_ACTION_KINDS, [
  "choose-scope", "clarify-target", "complete-coverage", "baseline-check", "learn",
  "worked-example", "targeted-repair", "practice", "review", "mock", "taper", "rest",
]));
check("exactly 4 action stages", INTERVIEW_PLAN_ACTION_STAGES.length === 4);
check("action stages match exactly", arraysEqual(INTERVIEW_PLAN_ACTION_STAGES, ["now", "next", "later", "final-phase"]));
check("exactly 15 action reasons", INTERVIEW_PLAN_ACTION_REASONS.length === 15);
check("exactly 3 deferral reasons", INTERVIEW_PLAN_DEFERRAL_REASONS.length === 3);
check("deferral reasons match exactly", arraysEqual(INTERVIEW_PLAN_DEFERRAL_REASONS, [
  "zero-capacity", "supported-lower-need-under-urgent-horizon", "explicit-priority-outside-urgent-target",
]));
check("exactly 4 warnings", INTERVIEW_PLAN_WARNINGS.length === 4);
check("warnings match exactly", arraysEqual(INTERVIEW_PLAN_WARNINGS, [
  "target-needs-clarification", "expired-target-ignored", "no-explicit-scope", "no-available-capacity",
]));

// --- Warning deduplication --------------------------------------------------------------
{
  const diag = baseDiagnostic();
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [
      target({ id: "c1", daysUntil: 5, areas: [], needsSignalClarification: false }),
      target({ id: "c2", daysUntil: 6, areas: [], needsSignalClarification: false }),
    ],
  });
  check("warnings deduplicated (single target-needs-clarification entry for two clarification targets)", plan.warnings.filter((w) => w === "target-needs-clarification").length === 1);
}

// --- Deferral deduplication --------------------------------------------------------------
{
  const diag = baseDiagnostic({
    priorities: ["ml-system-design"],
    availableHoursPerWeek: 0,
    evidence: [evidenceItem({ area: "ml-system-design", signal: "positive" })],
  });
  const plan = buildAdaptiveInterviewPlan({
    diagnostic: diag,
    targets: [target({ id: "t", daysUntil: 3, areas: ["system-design"], needsSignalClarification: false })],
  });
  const mlDeferrals = plan.deferred.filter((d) => d.area === "ml-system-design");
  check("the intended ml-system-design deferral exists exactly once under overlapping conditions", mlDeferrals.length === 1);
  check("the surviving deferral reason is explicit-priority-outside-urgent-target, not zero-capacity", mlDeferrals[0]?.reason === "explicit-priority-outside-urgent-target");
  const deferredAreaSet = new Set(plan.deferred.map((d) => d.area));
  check("deferred array itself contains no area twice", deferredAreaSet.size === plan.deferred.length);
}

for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview Playbook adaptive planning engine qualification passed (${cases.length} cases).`);
