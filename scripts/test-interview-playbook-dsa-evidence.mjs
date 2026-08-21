import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dsaQuestionProgressToInterviewEvidence } from "../lib/interview-playbook/dsa-evidence.ts";
import { buildInterviewDiagnosticSnapshot } from "../lib/interview-playbook/diagnostic.ts";
import { summarizeInterviewEvidence } from "../lib/interview-playbook/evidence.ts";
import { buildInterviewPlaybookPlanningProjection } from "../lib/interview-playbook/planner-integration.ts";

const root = process.cwd();
const adapterSource = readFileSync(join(root, "lib/interview-playbook/dsa-evidence.ts"), "utf8");
const querySource = readFileSync(join(root, "lib/interview-playbook/dsa-evidence-query.ts"), "utf8");
const plannerSource = readFileSync(join(root, "lib/interview-playbook/planner-integration.ts"), "utf8");
const cases = [];
const check = (name, ok) => cases.push([name, Boolean(ok)]);
const deepEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const neutralDiagnosticInput = (evidence = [], confidenceByArea = {}) => ({
  availableHoursPerWeek: null,
  confidenceByArea,
  constraints: [],
  priorities: [],
  evidence,
  coverage: { behavioralStories: "unknown", projectDeepDive: "unknown" },
});

function round(overrides = {}) {
  return {
    id: "round-1",
    applicationId: "application-1",
    companyName: "Acme",
    roleTitle: "Software Engineer",
    roundName: "Technical round",
    roundType: "Technical Screen",
    scheduledAt: "2026-08-26T12:00:00Z",
    timezone: "UTC",
    executionGuideSlugs: ["algorithmic-coding"],
    needsSignalClarification: false,
    preparationHref: "/applications/application-1/rounds/round-1",
    ...overrides,
  };
}

const NOW = new Date("2026-08-19T12:00:00Z");
const overview = { upcomingRounds: [round()], unscheduledRounds: [] };

// --- Source semantics -------------------------------------------------------
const unsolvedRows = [
  { questionId: "two-sum", status: "attempted", solvedAt: null },
  { questionId: "merge-intervals", status: "review", solvedAt: "2026-08-18T10:00:00Z" },
  { questionId: "binary-search", status: "not_started", solvedAt: null },
];
check("no DSA rows produce no evidence", dsaQuestionProgressToInterviewEvidence([]).length === 0);
check("attempted, review, and not-started status do not manufacture performance evidence", dsaQuestionProgressToInterviewEvidence(unsolvedRows).length === 0);

const solvedRows = [
  { questionId: "two-sum", status: "solved", solvedAt: "2026-08-17T10:00:00Z" },
  { questionId: "binary-search", status: "solved", solvedAt: null },
];
const solvedEvidence = dsaQuestionProgressToInterviewEvidence(solvedRows);
check("currently solved DSA rows become one evidence item each", solvedEvidence.length === 2);
check("DSA evidence is scoped to algorithmic coding", solvedEvidence.every((item) => item.area === "algorithmic-coding"));
check("DSA evidence is explicitly self-report, never direct observation", solvedEvidence.every((item) => item.provenance === "self-report"));
check("DSA solved status is a positive practice self-report", solvedEvidence.every((item) => item.kind === "practice" && item.signal === "positive"));
check("DSA evidence never claims repeated errors", solvedEvidence.every((item) => item.repeatedError === false));
check("DSA evidence ids are stable and source-scoped", deepEqual(solvedEvidence.map((item) => item.id), [
  "dsa-question-progress:binary-search:self-reported-solved",
  "dsa-question-progress:two-sum:self-reported-solved",
]));
check("a solved-status timestamp is preserved only as self-report metadata", solvedEvidence.find((item) => item.id.includes("two-sum"))?.observedAt === "2026-08-17T10:00:00Z");

const algorithmicSummary = summarizeInterviewEvidence("algorithmic-coding", solvedEvidence);
check("self-reported DSA activity never increments observed evidence", algorithmicSummary.observedEvidenceCount === 0);
check("self-reported solved rows result in self-reported-only evidence state", algorithmicSummary.state === "self-reported-only" && algorithmicSummary.selfReportedEvidenceCount === 2);
check("self-reported DSA activity never implies a repeated error", algorithmicSummary.hasRepeatedError === false);

const reversedEvidence = dsaQuestionProgressToInterviewEvidence([...solvedRows].reverse());
check("adapter output is independent of input ordering", deepEqual(solvedEvidence, reversedEvidence));
const duplicateRows = [
  { questionId: "two-sum", status: "solved", solvedAt: "2026-08-16T10:00:00Z" },
  { questionId: "two-sum", status: "solved", solvedAt: "2026-08-18T10:00:00Z" },
];
check("duplicate source records resolve deterministically to one latest self-report", dsaQuestionProgressToInterviewEvidence(duplicateRows).length === 1 && dsaQuestionProgressToInterviewEvidence(duplicateRows)[0].observedAt === "2026-08-18T10:00:00Z");

// Confidence is a separate candidate self-report. It must not silently become
// either evidence or the Playbook's explicit per-area confidence input.
const lowConfidenceRows = [{ questionId: "two-sum", status: "solved", solvedAt: "2026-08-17T10:00:00Z", confidence: "low" }];
const highConfidenceRows = [{ questionId: "two-sum", status: "solved", solvedAt: "2026-08-17T10:00:00Z", confidence: "high" }];
check("DSA confidence cannot alter evidence adapter output", deepEqual(
  dsaQuestionProgressToInterviewEvidence(lowConfidenceRows),
  dsaQuestionProgressToInterviewEvidence(highConfidenceRows),
));
const explicitConfidence = buildInterviewDiagnosticSnapshot(neutralDiagnosticInput(solvedEvidence, { "algorithmic-coding": "low" }));
const algorithmicDimension = explicitConfidence.dimensions.find((dimension) => dimension.area === "algorithmic-coding");
check("explicit Playbook confidence remains separate from DSA evidence", algorithmicDimension?.selfReportedConfidence === "low" && algorithmicDimension.evidenceState === "self-reported-only");
for (const dimension of explicitConfidence.dimensions.filter((dimension) => dimension.area !== "algorithmic-coding")) {
  check(`DSA evidence does not affect ${dimension.area}`, dimension.evidenceCount === 0 && dimension.evidenceState === "unknown");
}

// --- Planner integration ----------------------------------------------------
const baseline = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
const emptyDsa = buildInterviewPlaybookPlanningProjection({ overview, now: NOW, evidence: [] });
check("no DSA data preserves the existing neutral projection exactly", deepEqual(baseline, emptyDsa) && baseline?.sourceDescription.selfReportedEvidenceAreas.length === 0);
const withDsa = buildInterviewPlaybookPlanningProjection({ overview, now: NOW, evidence: solvedEvidence });
check("DSA self-report has a transparent source description", deepEqual(withDsa?.sourceDescription, {
  hasSavedDiagnosticInputs: false,
  selfReportedEvidenceAreas: ["algorithmic-coding"],
}));
check("self-reported DSA still produces an algorithmic baseline check", withDsa?.actions.some((action) => action.area === "algorithmic-coding" && action.kind === "baseline-check"));
const nonAlgorithmicInjection = [{ ...solvedEvidence[0], area: "system-design" }];
check("generic composition preserves explicitly scoped evidence", buildInterviewPlaybookPlanningProjection({ overview: { upcomingRounds: [round({ executionGuideSlugs: ["system-design"] })], unscheduledRounds: [] }, now: NOW, evidence: nonAlgorithmicInjection })?.sourceDescription.selfReportedEvidenceAreas.includes("system-design"));
const observedDiagnostic = neutralDiagnosticInput([{
  id: "observed-algorithmic-practice",
  area: "algorithmic-coding",
  provenance: "direct-observation",
  kind: "practice",
  signal: "positive",
  observedAt: "2026-08-18T10:00:00Z",
  summary: null,
  repeatedError: false,
}]);
const withObservedEvidence = buildInterviewPlaybookPlanningProjection({ overview, now: NOW, diagnosticInput: observedDiagnostic });
check("genuine observed evidence retains supported-maintenance behavior through the existing planner", withObservedEvidence?.actions.some((action) => action.area === "algorithmic-coding" && action.kind === "review"));

// --- Privacy and architecture boundaries ----------------------------------
check("adapter has no Supabase, auth, React, or current-time dependency", !adapterSource.includes("supabase") && !adapterSource.includes("getAuthenticatedActor") && !adapterSource.includes('from "react"') && !adapterSource.includes("new Date(") && !adapterSource.includes("Date.now("));
for (const forbidden of ["notes", "bookmarked", "confidence", "firstAttemptedAt", "lastPracticedAt"]) {
  check(`adapter input excludes ${forbidden}`, !new RegExp(`\\n\\s*${forbidden}\\s*:`).test(adapterSource));
}
check("server query is owner-derived", querySource.includes("getAuthenticatedActor") && querySource.includes('.eq("user_id", actor.user.id)'));
check("server query selects only minimal solved-status fields", querySource.includes('.select("question_id,status,solved_at")') && querySource.includes('.eq("status", "solved")'));
for (const forbidden of ["notes", "bookmarked", "confidence", "first_attempted_at", "last_practiced_at"]) {
  check(`server query never selects ${forbidden}`, !new RegExp(`select\\([^)]*${forbidden}`).test(querySource));
}
check("planner composition remains pure and does not query DSA storage", !plannerSource.includes("dsa_question_progress") && !plannerSource.includes("getAuthenticatedActor") && !plannerSource.includes("server-only"));

for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview Playbook DSA evidence qualification passed (${cases.length} cases).`);
