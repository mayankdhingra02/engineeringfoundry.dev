import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTERVIEW_PREPARATION_AREAS,
  INTERVIEW_EVIDENCE_PROVENANCES,
  INTERVIEW_EVIDENCE_KINDS,
  INTERVIEW_EVIDENCE_SIGNALS,
  INTERVIEW_EVIDENCE_STATES,
  summarizeInterviewEvidence,
} from "../lib/interview-playbook/evidence.ts";
import {
  INTERVIEW_SELF_REPORTED_CONFIDENCES,
  INTERVIEW_DIAGNOSTIC_CONSTRAINT_CATEGORIES,
  INTERVIEW_PREPARATION_COVERAGE_STATES,
  buildInterviewDiagnosticSnapshot,
} from "../lib/interview-playbook/diagnostic.ts";

const root = process.cwd();
const evidenceSource = readFileSync(join(root, "lib/interview-playbook/evidence.ts"), "utf8");
const diagnosticSource = readFileSync(join(root, "lib/interview-playbook/diagnostic.ts"), "utf8");
const overviewSource = readFileSync(join(root, "lib/interview-playbook/overview.ts"), "utf8");
const timingSource = readFileSync(join(root, "lib/interview-playbook/timing.ts"), "utf8");

const cases = [];
const check = (name, ok) => cases.push([name, Boolean(ok)]);
const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function evidenceItem(overrides) {
  return {
    id: "id",
    area: "algorithmic-coding",
    provenance: "direct-observation",
    kind: "practice",
    signal: "positive",
    observedAt: null,
    summary: null,
    repeatedError: false,
    ...overrides,
  };
}

// --- Canonical area taxonomy -------------------------------------------
const REQUIRED_AREA_ORDER = [
  "algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design",
  "system-design", "ml-system-design", "behavioral", "project-deep-dive",
];
check("exactly nine preparation areas", INTERVIEW_PREPARATION_AREAS.length === 9);
check("preparation areas are in the exact required order", arraysEqual(INTERVIEW_PREPARATION_AREAS, REQUIRED_AREA_ORDER));
check("preparation areas are unique", new Set(INTERVIEW_PREPARATION_AREAS).size === INTERVIEW_PREPARATION_AREAS.length);
for (const excluded of [
  "recruiter-screen", "online-assessment", "take-home", "technical-screen", "hiring-manager",
  "cross-functional", "technical-presentation", "onsite", "final", "bar-raiser",
]) check(`preparation areas do not include: ${excluded}`, !INTERVIEW_PREPARATION_AREAS.includes(excluded));

// --- Provenance / kinds / signals / states taxonomy ---------------------
check("exactly five provenance values", INTERVIEW_EVIDENCE_PROVENANCES.length === 5);
check("provenance values match exactly", arraysEqual(INTERVIEW_EVIDENCE_PROVENANCES, ["direct-observation", "human-evaluator-judgment", "ai-assisted-observation", "self-report", "unknown"]));
check("provenance values are unique", new Set(INTERVIEW_EVIDENCE_PROVENANCES).size === 5);
check("exactly five evidence kinds", INTERVIEW_EVIDENCE_KINDS.length === 5);
check("evidence kinds match exactly", arraysEqual(INTERVIEW_EVIDENCE_KINDS, ["practice", "mock", "real-interview", "work-sample", "other"]));
check("exactly four evidence signals", INTERVIEW_EVIDENCE_SIGNALS.length === 4);
check("evidence signals match exactly", arraysEqual(INTERVIEW_EVIDENCE_SIGNALS, ["positive", "mixed", "negative", "unknown"]));
check("exactly five evidence states", INTERVIEW_EVIDENCE_STATES.length === 5);
check("evidence states match exactly", arraysEqual(INTERVIEW_EVIDENCE_STATES, ["unknown", "self-reported-only", "needs-repair", "mixed-evidence", "supported-evidence"]));

// --- Evidence-state rules (cases A-M) ------------------------------------
check("A: no evidence -> unknown", summarizeInterviewEvidence("algorithmic-coding", []).state === "unknown");
check("B: unknown-signal evidence only -> unknown", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "direct-observation", signal: "unknown" }),
]).state === "unknown");
check("C: positive self-report only -> self-reported-only", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "self-report", signal: "positive" }),
]).state === "self-reported-only");
check("D: negative self-report only -> self-reported-only", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "self-report", signal: "negative" }),
]).state === "self-reported-only");
check("E: positive evidence with unknown provenance only -> unknown", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "unknown", signal: "positive" }),
]).state === "unknown");
check("F: direct-observation positive -> supported-evidence", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "direct-observation", signal: "positive" }),
]).state === "supported-evidence");
check("G: human-evaluator positive -> supported-evidence", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "human-evaluator-judgment", signal: "positive" }),
]).state === "supported-evidence");
check("H: ai-assisted positive -> supported-evidence", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "ai-assisted-observation", signal: "positive" }),
]).state === "supported-evidence");
check("I: direct observed negative -> needs-repair", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "direct-observation", signal: "negative" }),
]).state === "needs-repair");
check("J: observed positive + negative -> mixed-evidence", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ id: "1", provenance: "direct-observation", signal: "positive" }),
  evidenceItem({ id: "2", provenance: "direct-observation", signal: "negative" }),
]).state === "mixed-evidence");
check("K: observed mixed -> mixed-evidence", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ provenance: "direct-observation", signal: "mixed" }),
]).state === "mixed-evidence");
check("L: self-report positive + observed negative -> needs-repair (self-report does not overpower observed)", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ id: "1", provenance: "self-report", signal: "positive" }),
  evidenceItem({ id: "2", provenance: "human-evaluator-judgment", signal: "negative" }),
]).state === "needs-repair");
check("M: self-report negative + observed positive -> supported-evidence (self-report does not overpower observed)", summarizeInterviewEvidence("algorithmic-coding", [
  evidenceItem({ id: "1", provenance: "self-report", signal: "negative" }),
  evidenceItem({ id: "2", provenance: "ai-assisted-observation", signal: "positive" }),
]).state === "supported-evidence");

// --- Provenance counts ----------------------------------------------------
{
  const summary = summarizeInterviewEvidence("algorithmic-coding", [
    evidenceItem({ id: "1", provenance: "direct-observation", signal: "positive" }),
    evidenceItem({ id: "2", provenance: "unknown", signal: "unknown" }),
  ]);
  check("provenanceCounts contains every provenance", INTERVIEW_EVIDENCE_PROVENANCES.every((p) => typeof summary.provenanceCounts[p] === "number"));
  check("provenanceCounts retains zero counts", summary.provenanceCounts["self-report"] === 0 && summary.provenanceCounts["human-evaluator-judgment"] === 0 && summary.provenanceCounts["ai-assisted-observation"] === 0);
  check("provenanceCounts counts the observed item", summary.provenanceCounts["direct-observation"] === 1);
  check("provenanceCounts counts the unknown-signal item too", summary.provenanceCounts["unknown"] === 1);
  check("evidenceCount includes the unknown-signal item", summary.evidenceCount === 2);
  check("observedEvidenceCount excludes the unknown-signal item", summary.observedEvidenceCount === 1);
}

// --- Repeated errors -------------------------------------------------------
{
  const noError = summarizeInterviewEvidence("algorithmic-coding", [evidenceItem({ repeatedError: false })]);
  check("hasRepeatedError false when absent", noError.hasRepeatedError === false);
  const withError = summarizeInterviewEvidence("algorithmic-coding", [
    evidenceItem({ id: "1", repeatedError: false }),
    evidenceItem({ id: "2", repeatedError: true }),
  ]);
  check("hasRepeatedError true when any area item has it", withError.hasRepeatedError === true);
  const crossAreaError = summarizeInterviewEvidence("algorithmic-coding", [
    evidenceItem({ id: "1", area: "algorithmic-coding", repeatedError: false }),
    evidenceItem({ id: "2", area: "behavioral", repeatedError: true }),
  ]);
  check("repeatedError from another area does not set hasRepeatedError", crossAreaError.hasRepeatedError === false);
}

// --- Area isolation ---------------------------------------------------------
{
  const evidence = [
    evidenceItem({ id: "1", area: "system-design", provenance: "direct-observation", signal: "negative" }),
    evidenceItem({ id: "2", area: "behavioral", provenance: "direct-observation", signal: "positive" }),
  ];
  check("System Design evidence does not affect Behavioral", summarizeInterviewEvidence("behavioral", evidence).state === "supported-evidence");
  check("Behavioral evidence does not affect Project Deep Dive", summarizeInterviewEvidence("project-deep-dive", evidence).state === "unknown");
  check("System Design evidence resolves independently", summarizeInterviewEvidence("system-design", evidence).state === "needs-repair");
}

// --- Timestamp behavior ------------------------------------------------------
{
  const summary = summarizeInterviewEvidence("algorithmic-coding", [
    evidenceItem({ id: "1", observedAt: "2026-01-01T00:00:00Z" }),
    evidenceItem({ id: "2", observedAt: "2026-06-15T00:00:00Z" }),
    evidenceItem({ id: "3", observedAt: "not-a-real-timestamp" }),
    evidenceItem({ id: "4", observedAt: null }),
  ]);
  check("latest valid timestamp selected", summary.latestEvidenceAt === "2026-06-15T00:00:00Z");
  const invalidOnly = summarizeInterviewEvidence("algorithmic-coding", [
    evidenceItem({ observedAt: "not-a-real-timestamp" }),
  ]);
  check("invalid timestamp ignored (latestEvidenceAt null)", invalidOnly.latestEvidenceAt === null);
  const nullOnly = summarizeInterviewEvidence("algorithmic-coding", [evidenceItem({ observedAt: null })]);
  check("null timestamp ignored (latestEvidenceAt null)", nullOnly.latestEvidenceAt === null);
  check("evidence.ts does not call new Date()", !evidenceSource.includes("new Date("));
  check("evidence.ts does not call Date.now()", !evidenceSource.includes("Date.now("));
}

// --- Confidence taxonomy -----------------------------------------------
check("exactly four self-reported confidence values", INTERVIEW_SELF_REPORTED_CONFIDENCES.length === 4);
check("confidence values match exactly", arraysEqual(INTERVIEW_SELF_REPORTED_CONFIDENCES, ["unknown", "low", "medium", "high"]));

// --- Constraint taxonomy -------------------------------------------------
check("exactly five constraint categories", INTERVIEW_DIAGNOSTIC_CONSTRAINT_CATEGORIES.length === 5);
check("constraint categories match exactly", arraysEqual(INTERVIEW_DIAGNOSTIC_CONSTRAINT_CATEGORIES, ["work", "school", "health", "family", "other"]));

// --- Coverage taxonomy ---------------------------------------------------
check("exactly four coverage states", INTERVIEW_PREPARATION_COVERAGE_STATES.length === 4);
check("coverage states match exactly", arraysEqual(INTERVIEW_PREPARATION_COVERAGE_STATES, ["unknown", "not-started", "partial", "covered"]));

function baseSnapshotInput(overrides = {}) {
  return {
    availableHoursPerWeek: null,
    confidenceByArea: {},
    constraints: [],
    priorities: [],
    evidence: [],
    coverage: { behavioralStories: "unknown", projectDeepDive: "unknown" },
    ...overrides,
  };
}

function dimensionFor(snapshot, area) {
  return snapshot.dimensions.find((dimension) => dimension.area === area);
}

// --- Confidence independence ----------------------------------------------
{
  const highNoEvidence = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    confidenceByArea: { "system-design": "high" },
  }));
  const sd = dimensionFor(highNoEvidence, "system-design");
  check("Example 1: high confidence + no evidence -> evidenceState unknown", sd.evidenceState === "unknown");
  check("Example 1: confidence preserved as high", sd.selfReportedConfidence === "high");

  const lowPositiveEvidence = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    confidenceByArea: { debugging: "low" },
    evidence: [evidenceItem({ area: "debugging", provenance: "direct-observation", signal: "positive" })],
  }));
  const dbg = dimensionFor(lowPositiveEvidence, "debugging");
  check("low confidence + positive observed evidence -> evidenceState supported-evidence", dbg.evidenceState === "supported-evidence");
  check("confidence remains low despite positive evidence", dbg.selfReportedConfidence === "low");

  const missingConfidence = buildInterviewDiagnosticSnapshot(baseSnapshotInput());
  check("missing confidence defaults to unknown", dimensionFor(missingConfidence, "algorithmic-coding").selfReportedConfidence === "unknown");

  // Example 5
  const example5 = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    confidenceByArea: { debugging: "high" },
    evidence: [evidenceItem({ area: "debugging", provenance: "human-evaluator-judgment", signal: "negative" })],
  }));
  const example5Dim = dimensionFor(example5, "debugging");
  check("Example 5: selfReportedConfidence stays high", example5Dim.selfReportedConfidence === "high");
  check("Example 5: evidenceState is needs-repair", example5Dim.evidenceState === "needs-repair");
}

// --- Coverage independence -------------------------------------------------
{
  const behavioralCovered = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    coverage: { behavioralStories: "covered", projectDeepDive: "unknown" },
  }));
  const beh = dimensionFor(behavioralCovered, "behavioral");
  check("Example 2: behavioralStories covered + no evidence -> evidenceState unknown", beh.evidenceState === "unknown");
  check("Example 2: preparationCoverage visible as covered", beh.preparationCoverage === "covered");

  const pddCovered = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    coverage: { behavioralStories: "unknown", projectDeepDive: "covered" },
  }));
  const pdd = dimensionFor(pddCovered, "project-deep-dive");
  check("projectDeepDive covered + no evidence -> evidenceState unknown", pdd.evidenceState === "unknown");
  check("projectDeepDive coverage visible independently", pdd.preparationCoverage === "covered");

  const otherSeven = INTERVIEW_PREPARATION_AREAS.filter((area) => area !== "behavioral" && area !== "project-deep-dive");
  check("other seven areas return not-applicable coverage", otherSeven.every((area) => dimensionFor(behavioralCovered, area).preparationCoverage === "not-applicable"));

  // Example 3
  const example3 = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    coverage: { behavioralStories: "unknown", projectDeepDive: "covered" },
    evidence: [evidenceItem({ area: "project-deep-dive", provenance: "ai-assisted-observation", kind: "mock", signal: "positive" })],
  }));
  const example3Dim = dimensionFor(example3, "project-deep-dive");
  check("Example 3: preparationCoverage covered", example3Dim.preparationCoverage === "covered");
  check("Example 3: evidenceState supported-evidence", example3Dim.evidenceState === "supported-evidence");
  check("Example 3: provenance retains ai-assisted-observation", example3Dim.provenanceCounts["ai-assisted-observation"] === 1);
}

// --- Available-hours normalization -----------------------------------------
{
  const cases = [
    [null, null], [0, 0], [10, 10], [168, 168], [169, 168],
    [-1, null], [NaN, null], [Infinity, null], [-Infinity, null],
  ];
  for (const [input, expected] of cases) {
    const snapshot = buildInterviewDiagnosticSnapshot(baseSnapshotInput({ availableHoursPerWeek: input }));
    check(`availableHoursPerWeek ${input} normalizes to ${expected}`, snapshot.availableHoursPerWeek === expected || (Number.isNaN(expected) && Number.isNaN(snapshot.availableHoursPerWeek)));
  }
}

// --- Priorities --------------------------------------------------------------
{
  const snapshot = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    priorities: ["system-design", "behavioral", "system-design", "algorithmic-coding"],
  }));
  check("priorities preserve first-occurrence order", arraysEqual(snapshot.priorities, ["system-design", "behavioral", "algorithmic-coding"]));
  check("priorities remove duplicates", snapshot.priorities.length === 3);
  check("priorities are not alphabetically sorted", snapshot.priorities[0] === "system-design");
  check("explicitPriority true for prioritized areas", dimensionFor(snapshot, "system-design").explicitPriority === true && dimensionFor(snapshot, "behavioral").explicitPriority === true);
  check("explicitPriority false for non-prioritized areas", dimensionFor(snapshot, "debugging").explicitPriority === false);

  const withEvidence = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    priorities: ["debugging"],
    evidence: [evidenceItem({ area: "debugging", provenance: "direct-observation", signal: "negative" })],
  }));
  check("priority does not change evidence state", dimensionFor(withEvidence, "debugging").evidenceState === "needs-repair");
}

// --- Constraints ---------------------------------------------------------
{
  const constraints = [
    { id: "c1", category: "work", description: "Full-time job with limited weekday evening time." },
    { id: "c2", category: "school", description: "Coursework deadlines this month." },
    { id: "c3", category: "health", description: "Recovering from an injury." },
    { id: "c4", category: "family", description: "Caregiving responsibilities." },
    { id: "c5", category: "other", description: "Travel scheduled next week." },
  ];
  const snapshot = buildInterviewDiagnosticSnapshot(baseSnapshotInput({ constraints }));
  check("all five constraint categories supported", arraysEqual(snapshot.constraints.map((c) => c.category), ["work", "school", "health", "family", "other"]));
  check("constraints preserve input order", arraysEqual(snapshot.constraints.map((c) => c.id), ["c1", "c2", "c3", "c4", "c5"]));

  // Example 7
  const example7 = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    constraints: [
      { id: "w1", category: "work", description: "Work constraint." },
      { id: "f1", category: "family", description: "Family constraint." },
    ],
    evidence: [evidenceItem({ area: "low-level-design", provenance: "direct-observation", signal: "positive" })],
  }));
  check("Example 7: constraints do not change evidence state", dimensionFor(example7, "low-level-design").evidenceState === "supported-evidence");
}

// --- Canonical dimensional output -------------------------------------------
{
  const snapshot = buildInterviewDiagnosticSnapshot(baseSnapshotInput());
  check("snapshot always has exactly nine dimensions", snapshot.dimensions.length === 9);
  check("dimensions are in canonical area order", arraysEqual(snapshot.dimensions.map((d) => d.area), REQUIRED_AREA_ORDER));
  check("no area is omitted when it has no evidence", INTERVIEW_PREPARATION_AREAS.every((area) => Boolean(dimensionFor(snapshot, area))));
}

// --- No overall score --------------------------------------------------------
{
  const snapshot = buildInterviewDiagnosticSnapshot(baseSnapshotInput({
    evidence: [evidenceItem({ provenance: "direct-observation", signal: "positive" })],
  }));
  const serialized = JSON.stringify(snapshot);
  const forbiddenKeys = [
    "overallReadiness", "readinessScore", "score", "weightedScore", "percentage",
    "probability", "passProbability", "hiringPrediction", "recommendedAction",
  ];
  for (const key of forbiddenKeys) {
    check(`runtime snapshot does not contain key: ${key}`, !serialized.includes(`"${key}"`));
  }
}

// --- Source-level architecture: no forbidden identifiers introduced --------
{
  const forbiddenIdentifiers = ["readinessScore", "passProbability", "hiringPrediction", "weightedScore"];
  for (const identifier of forbiddenIdentifiers) {
    const identifierRegex = new RegExp(`\\b${identifier}\\b`);
    check(`evidence.ts does not introduce identifier: ${identifier}`, !identifierRegex.test(evidenceSource));
    check(`diagnostic.ts does not introduce identifier: ${identifier}`, !identifierRegex.test(diagnosticSource));
  }
}

// --- Purity / architecture: evidence.ts -------------------------------------
for (const [label, ok] of [
  ["does not import React", !evidenceSource.includes('from "react"')],
  ["does not import Next.js", !evidenceSource.includes('from "next')],
  ["does not import Supabase", !/^import.*supabase/im.test(evidenceSource) && !evidenceSource.includes("createSupabase")],
  ["does not import auth", !evidenceSource.includes("getAuthenticatedActor") && !evidenceSource.includes("auth.uid")],
  ["does not import database types", !evidenceSource.includes("database.types")],
  ["does not call fetch", !evidenceSource.includes("fetch(")],
  ["does not use localStorage", !evidenceSource.includes("localStorage")],
  ["does not use sessionStorage", !evidenceSource.includes("sessionStorage")],
  ["does not read process.env", !evidenceSource.includes("process.env")],
  ["does not call Math.random", !evidenceSource.includes("Math.random")],
  ["does not contain a Server Action", !evidenceSource.includes('"use server"')],
  ["does not import a query module", !/from\s+"[^"]*\/queries/.test(evidenceSource)],
  ["does not import the round resolver", !/from\s+"[^"]*round-execution/.test(evidenceSource)],
  ["does not import a dossier module", !/from\s+"[^"]*\/dossiers/.test(evidenceSource)],
]) check(`evidence.ts ${label}`, ok);

// --- Purity / architecture: diagnostic.ts -----------------------------------
for (const [label, ok] of [
  ["does not import React", !diagnosticSource.includes('from "react"')],
  ["does not import Next.js", !diagnosticSource.includes('from "next')],
  ["does not import Supabase", !/^import.*supabase/im.test(diagnosticSource) && !diagnosticSource.includes("createSupabase")],
  ["does not import auth", !diagnosticSource.includes("getAuthenticatedActor") && !diagnosticSource.includes("auth.uid")],
  ["does not import database types", !diagnosticSource.includes("database.types")],
  ["does not call fetch", !diagnosticSource.includes("fetch(")],
  ["does not use localStorage", !diagnosticSource.includes("localStorage")],
  ["does not use sessionStorage", !diagnosticSource.includes("sessionStorage")],
  ["does not read process.env", !diagnosticSource.includes("process.env")],
  ["does not call new Date()", !diagnosticSource.includes("new Date(")],
  ["does not call Date.now()", !diagnosticSource.includes("Date.now(")],
  ["does not call Math.random", !diagnosticSource.includes("Math.random")],
  ["does not contain a Server Action", !diagnosticSource.includes('"use server"')],
  ["does not import a query module", !/from\s+"[^"]*\/queries/.test(diagnosticSource)],
  ["does not import overview.ts", !/from\s+"\.\/overview/.test(diagnosticSource)],
  ["does not import timing.ts", !/from\s+"\.\/timing/.test(diagnosticSource)],
  ["does not import the round resolver", !/from\s+"[^"]*round-execution/.test(diagnosticSource)],
  ["does not import a dossier module", !/from\s+"[^"]*\/dossiers/.test(diagnosticSource)],
]) check(`diagnostic.ts ${label}`, ok);

check("diagnostic.ts imports evidence.ts", diagnosticSource.includes('from "./evidence.ts"'));
check("evidence.ts does not import diagnostic.ts", !evidenceSource.includes("diagnostic.ts"));

// --- Existing boundary preservation -----------------------------------------
check("overview.ts still states it does not compute readiness", overviewSource.includes("does not compute\nreadiness") || overviewSource.includes("does not compute\n * readiness") || /does not compute[\s\S]{0,20}readiness/.test(overviewSource));
check("overview.ts still states it excludes probability", /probability/i.test(overviewSource));
check("overview.ts still states it excludes a score", /any score/i.test(overviewSource));
check("timing.ts still states it does not read readiness or confidence", /never reads readiness,?\s*\n?\s*confidence/i.test(timingSource) || /does not read[\s\S]{0,10}readiness/i.test(timingSource) || timingSource.includes("never reads readiness"));

// --- Determinism / immutability ---------------------------------------------
{
  const evidence = [
    evidenceItem({ id: "1", provenance: "direct-observation", signal: "positive" }),
    evidenceItem({ id: "2", area: "behavioral", provenance: "self-report", signal: "negative" }),
  ];
  const priorities = ["behavioral", "system-design"];
  const constraints = [{ id: "c1", category: "work", description: "Some work constraint." }];
  const input = baseSnapshotInput({ evidence, priorities, constraints, availableHoursPerWeek: 20 });

  const evidenceSnapshotBefore = JSON.stringify(evidence);
  const prioritiesSnapshotBefore = JSON.stringify(priorities);
  const constraintsSnapshotBefore = JSON.stringify(constraints);

  const snapshot1 = buildInterviewDiagnosticSnapshot(input);
  const snapshot2 = buildInterviewDiagnosticSnapshot(input);
  check("same input twice produces deeply equal output", deepEqual(snapshot1, snapshot2));
  check("input evidence array not mutated", JSON.stringify(evidence) === evidenceSnapshotBefore);
  check("input priorities array not mutated", JSON.stringify(priorities) === prioritiesSnapshotBefore);
  check("input constraints array not mutated", JSON.stringify(constraints) === constraintsSnapshotBefore);
}

for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview Playbook diagnostic evidence model qualification passed (${cases.length} cases).`);
