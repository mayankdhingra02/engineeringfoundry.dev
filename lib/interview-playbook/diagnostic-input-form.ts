/**
 * Pure, deterministic form parsing for the Phase 3B1 Interview Playbook
 * diagnostic input form.
 *
 * This is a separate file from `./diagnostic-inputs.ts` specifically because
 * that module is `server-only`, and the `server-only` package cannot be
 * resolved outside Next.js's own bundler (it only exists compiled inside
 * `next/dist/compiled/server-only`, not as an installed npm dependency) —
 * so nothing that needs to run under a plain Node qualification script can
 * share a file with a `server-only` import. This module has no such import
 * and no React, Supabase, or database dependency.
 *
 * Parsing here only produces a structured, RPC-ready payload — it never
 * calls the database and never decides ownership.
 */
import { INTERVIEW_PREPARATION_AREAS, type InterviewPreparationArea } from "./evidence.ts";
import type { InterviewDiagnosticConstraintCategory, InterviewPreparationCoverageState } from "./diagnostic.ts";

export type InterviewPlaybookDiagnosticConfidenceEntry = Readonly<{
  area: InterviewPreparationArea;
  confidence: "low" | "medium" | "high";
}>;

export type InterviewPlaybookDiagnosticConstraintEntry = Readonly<{
  category: InterviewDiagnosticConstraintCategory;
  description: string;
}>;

export type InterviewPlaybookDiagnosticInputFormPayload = Readonly<{
  availableHoursPerWeek: number | null;
  confidenceEntries: readonly InterviewPlaybookDiagnosticConfidenceEntry[];
  priorityAreas: readonly InterviewPreparationArea[];
  constraintEntries: readonly InterviewPlaybookDiagnosticConstraintEntry[];
  behavioralStoriesCoverage: InterviewPreparationCoverageState;
  projectDeepDiveCoverage: InterviewPreparationCoverageState;
}>;

export type ParseInterviewPlaybookDiagnosticInputFormResult =
  | Readonly<{ ok: true; value: InterviewPlaybookDiagnosticInputFormPayload }>
  | Readonly<{ ok: false; error: string }>;

const MAX_CONSTRAINT_ROWS = 10;
const MAX_CONSTRAINT_DESCRIPTION_LENGTH = 500;
const MAX_PRIORITY_RANK = INTERVIEW_PREPARATION_AREAS.length;

function fieldText(formData: FormData, name: string): string {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim() : "";
}

/** Blank means "not saved" -> `null`. Server range validation is authoritative; this only rejects non-numeric input. */
function parseAvailableHoursPerWeek(formData: FormData): Readonly<{ ok: true; value: number | null }> | Readonly<{ ok: false; error: string }> {
  const text = fieldText(formData, "availableHoursPerWeek");
  if (text === "") return { ok: true, value: null };
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return { ok: false, error: "Enter a valid number of available hours per week." };
  if (parsed < 0 || parsed > 168) return { ok: false, error: "Available hours per week must be between 0 and 168." };
  return { ok: true, value: parsed };
}

function parseCoverage(
  formData: FormData,
  name: string,
  label: string,
): Readonly<{ ok: true; value: InterviewPreparationCoverageState }> | Readonly<{ ok: false; error: string }> {
  const text = fieldText(formData, name);
  const value = text === "" ? "unknown" : text;
  if (value !== "unknown" && value !== "not-started" && value !== "partial" && value !== "covered") {
    return { ok: false, error: `Choose a valid ${label} coverage value.` };
  }
  return { ok: true, value };
}

/**
 * `formData` field names are always constructed from the canonical area
 * list below (never taken verbatim from user input), so every parsed
 * `area` is already a genuine `InterviewPreparationArea` by construction.
 */
export function parseInterviewPlaybookDiagnosticInputForm(formData: FormData): ParseInterviewPlaybookDiagnosticInputFormResult {
  const hoursResult = parseAvailableHoursPerWeek(formData);
  if (!hoursResult.ok) return hoursResult;

  const confidenceEntries: InterviewPlaybookDiagnosticConfidenceEntry[] = [];
  const priorityAreaByRank = new Map<number, InterviewPreparationArea>();

  for (const area of INTERVIEW_PREPARATION_AREAS) {
    const confidenceText = fieldText(formData, `confidence:${area}`);
    if (confidenceText !== "") {
      if (confidenceText !== "low" && confidenceText !== "medium" && confidenceText !== "high") {
        return { ok: false, error: "Choose a valid confidence value for every area." };
      }
      confidenceEntries.push({ area, confidence: confidenceText });
    }

    const rankText = fieldText(formData, `priority:${area}`);
    if (rankText !== "") {
      const rank = Number(rankText);
      if (!Number.isInteger(rank) || rank < 1 || rank > MAX_PRIORITY_RANK) {
        return { ok: false, error: "Choose a valid priority rank for every prioritized area." };
      }
      if (priorityAreaByRank.has(rank)) {
        return { ok: false, error: "Each priority rank may only be used once." };
      }
      priorityAreaByRank.set(rank, area);
    }
  }

  // Sorted by numeric rank, never alphabetized — this ordered array becomes position 1, 2, 3... downstream.
  const priorityAreas = [...priorityAreaByRank.entries()].sort(([a], [b]) => a - b).map(([, area]) => area);

  const constraintEntries: InterviewPlaybookDiagnosticConstraintEntry[] = [];
  for (let index = 0; index < MAX_CONSTRAINT_ROWS; index += 1) {
    const description = fieldText(formData, `constraint:${index}:description`);
    if (description === "") continue; // An empty description means the row is ignored, not an error.
    if (description.length > MAX_CONSTRAINT_DESCRIPTION_LENGTH) {
      return { ok: false, error: "Shorten a constraint description to 500 characters or fewer." };
    }
    const category = fieldText(formData, `constraint:${index}:category`);
    if (category !== "work" && category !== "school" && category !== "health" && category !== "family" && category !== "other") {
      return { ok: false, error: "Choose a category for every constraint that has a description." };
    }
    constraintEntries.push({ category, description });
  }

  const behavioralCoverageResult = parseCoverage(formData, "behavioralStoriesCoverage", "Behavioral story");
  if (!behavioralCoverageResult.ok) return behavioralCoverageResult;
  const projectDeepDiveCoverageResult = parseCoverage(formData, "projectDeepDiveCoverage", "Project Deep Dive");
  if (!projectDeepDiveCoverageResult.ok) return projectDeepDiveCoverageResult;

  return {
    ok: true,
    value: {
      availableHoursPerWeek: hoursResult.value,
      confidenceEntries,
      priorityAreas,
      constraintEntries,
      behavioralStoriesCoverage: behavioralCoverageResult.value,
      projectDeepDiveCoverage: projectDeepDiveCoverageResult.value,
    },
  };
}
