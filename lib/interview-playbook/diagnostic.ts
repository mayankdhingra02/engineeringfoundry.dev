/**
 * Pure, deterministic diagnostic snapshot for the Interview Playbook.
 *
 * This module produces a multidimensional evidence view — one dimension per
 * preparation area — never a single overall readiness verdict. Confidence,
 * preparation coverage, explicit priority, available time, and constraints
 * are carried alongside evidence state but never used to derive it: each
 * dimension's `evidenceState` comes exclusively from
 * `summarizeInterviewEvidence` in `./evidence.ts`, so this file never
 * reimplements the evidence-state algorithm.
 *
 * There is no `overallReadiness`, score, weighted score, percentage,
 * probability, pass prediction, or hiring prediction anywhere in this
 * module, and there never should be — a future planner combines these
 * dimensions with scheduled-round signals, priorities, time, and constraints
 * without inventing a pass probability here.
 *
 * Pure and dependency-light: no React, Next.js, Supabase, auth, database,
 * queries, overview/timing/round-resolver/dossier imports, network, storage,
 * current time, or randomness. May import `./evidence.ts` only.
 */
import {
  INTERVIEW_PREPARATION_AREAS,
  summarizeInterviewEvidence,
  type InterviewEvidenceItem,
  type InterviewEvidenceProvenanceCounts,
  type InterviewEvidenceState,
  type InterviewPreparationArea,
} from "./evidence.ts";

/** Candidate self-report only — independent from `InterviewEvidenceState`, and never reconciled with it. */
export const INTERVIEW_SELF_REPORTED_CONFIDENCES = ["unknown", "low", "medium", "high"] as const;

export type InterviewSelfReportedConfidence = (typeof INTERVIEW_SELF_REPORTED_CONFIDENCES)[number];

export const INTERVIEW_DIAGNOSTIC_CONSTRAINT_CATEGORIES = ["work", "school", "health", "family", "other"] as const;

export type InterviewDiagnosticConstraintCategory = (typeof INTERVIEW_DIAGNOSTIC_CONSTRAINT_CATEGORIES)[number];

/** User-provided context only. No inferred medical status, disability, productivity, or severity score. */
export type InterviewDiagnosticConstraint = Readonly<{
  id: string;
  category: InterviewDiagnosticConstraintCategory;
  description: string;
}>;

/** Preparation-material coverage, not demonstrated performance. */
export const INTERVIEW_PREPARATION_COVERAGE_STATES = ["unknown", "not-started", "partial", "covered"] as const;

export type InterviewPreparationCoverageState = (typeof INTERVIEW_PREPARATION_COVERAGE_STATES)[number];

/** The seven areas with no modeled coverage input resolve to `not-applicable` rather than being hidden. */
export type InterviewDiagnosticDimensionCoverage = InterviewPreparationCoverageState | "not-applicable";

export type InterviewDiagnosticCoverageInput = Readonly<{
  behavioralStories: InterviewPreparationCoverageState;
  projectDeepDive: InterviewPreparationCoverageState;
}>;

export type BuildInterviewDiagnosticSnapshotInput = Readonly<{
  availableHoursPerWeek: number | null;
  confidenceByArea: Partial<Record<InterviewPreparationArea, InterviewSelfReportedConfidence>>;
  constraints: readonly InterviewDiagnosticConstraint[];
  priorities: readonly InterviewPreparationArea[];
  evidence: readonly InterviewEvidenceItem[];
  coverage: InterviewDiagnosticCoverageInput;
}>;

export type InterviewDiagnosticDimension = Readonly<{
  area: InterviewPreparationArea;
  evidenceState: InterviewEvidenceState;
  selfReportedConfidence: InterviewSelfReportedConfidence;
  preparationCoverage: InterviewDiagnosticDimensionCoverage;
  hasRepeatedError: boolean;
  evidenceCount: number;
  observedEvidenceCount: number;
  selfReportedEvidenceCount: number;
  provenanceCounts: InterviewEvidenceProvenanceCounts;
  latestEvidenceAt: string | null;
  explicitPriority: boolean;
}>;

export type InterviewDiagnosticSnapshot = Readonly<{
  availableHoursPerWeek: number | null;
  constraints: readonly InterviewDiagnosticConstraint[];
  priorities: readonly InterviewPreparationArea[];
  dimensions: readonly InterviewDiagnosticDimension[];
}>;

const MAX_AVAILABLE_HOURS_PER_WEEK = 168;

/** null/negative/NaN/Infinity all normalize to null; values above the weekly ceiling clamp to it. */
function normalizeAvailableHoursPerWeek(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) return null;
  if (value < 0) return null;
  return value > MAX_AVAILABLE_HOURS_PER_WEEK ? MAX_AVAILABLE_HOURS_PER_WEEK : value;
}

/** Preserves first-occurrence order; never alphabetized. */
function normalizePriorities(
  priorities: readonly InterviewPreparationArea[],
): readonly InterviewPreparationArea[] {
  const seen = new Set<InterviewPreparationArea>();
  const normalized: InterviewPreparationArea[] = [];
  for (const area of priorities) {
    if (seen.has(area)) continue;
    seen.add(area);
    normalized.push(area);
  }
  return normalized;
}

/** Only Behavioral and Project Deep Dive have a modeled coverage input; every other area is not-applicable. */
function resolveDimensionCoverage(
  area: InterviewPreparationArea,
  coverage: InterviewDiagnosticCoverageInput,
): InterviewDiagnosticDimensionCoverage {
  if (area === "behavioral") return coverage.behavioralStories;
  if (area === "project-deep-dive") return coverage.projectDeepDive;
  return "not-applicable";
}

export function buildInterviewDiagnosticSnapshot(
  input: BuildInterviewDiagnosticSnapshotInput,
): InterviewDiagnosticSnapshot {
  const availableHoursPerWeek = normalizeAvailableHoursPerWeek(input.availableHoursPerWeek);
  const priorities = normalizePriorities(input.priorities);
  const prioritySet = new Set(priorities);
  const constraints: readonly InterviewDiagnosticConstraint[] = [...input.constraints];

  const dimensions: readonly InterviewDiagnosticDimension[] = INTERVIEW_PREPARATION_AREAS.map((area) => {
    const summary = summarizeInterviewEvidence(area, input.evidence);
    return {
      area,
      evidenceState: summary.state,
      selfReportedConfidence: input.confidenceByArea[area] ?? "unknown",
      preparationCoverage: resolveDimensionCoverage(area, input.coverage),
      hasRepeatedError: summary.hasRepeatedError,
      evidenceCount: summary.evidenceCount,
      observedEvidenceCount: summary.observedEvidenceCount,
      selfReportedEvidenceCount: summary.selfReportedEvidenceCount,
      provenanceCounts: summary.provenanceCounts,
      latestEvidenceAt: summary.latestEvidenceAt,
      explicitPriority: prioritySet.has(area),
    };
  });

  return {
    availableHoursPerWeek,
    constraints,
    priorities,
    dimensions,
  };
}
