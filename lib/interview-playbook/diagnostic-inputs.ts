import "server-only";

import { getAuthenticatedActor, type AuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { Json } from "@/lib/supabase/database.types";
import type { InterviewPreparationArea } from "./evidence.ts";
import type {
  BuildInterviewDiagnosticSnapshotInput,
  InterviewDiagnosticConstraint,
  InterviewPreparationCoverageState,
  InterviewSelfReportedConfidence,
} from "./diagnostic.ts";
import type { InterviewPlaybookDiagnosticInputFormPayload } from "./diagnostic-input-form.ts";

export type InterviewPlaybookDiagnosticInputCoverage = Readonly<{
  behavioralStories: InterviewPreparationCoverageState;
  projectDeepDive: InterviewPreparationCoverageState;
}>;

export type InterviewPlaybookDiagnosticInputs = Readonly<{
  hasSavedInputs: boolean;
  availableHoursPerWeek: number | null;
  confidenceByArea: Partial<Record<InterviewPreparationArea, InterviewSelfReportedConfidence>>;
  priorities: readonly InterviewPreparationArea[];
  constraints: readonly InterviewDiagnosticConstraint[];
  coverage: InterviewPlaybookDiagnosticInputCoverage;
  diagnosticInput: BuildInterviewDiagnosticSnapshotInput;
}>;

const NEUTRAL_COVERAGE: InterviewPlaybookDiagnosticInputCoverage = {
  behavioralStories: "unknown",
  projectDeepDive: "unknown",
};

function neutralDiagnosticInputs(): InterviewPlaybookDiagnosticInputs {
  return {
    hasSavedInputs: false,
    availableHoursPerWeek: null,
    confidenceByArea: {},
    priorities: [],
    constraints: [],
    coverage: NEUTRAL_COVERAGE,
    diagnosticInput: {
      availableHoursPerWeek: null,
      confidenceByArea: {},
      constraints: [],
      priorities: [],
      evidence: [],
      coverage: NEUTRAL_COVERAGE,
    },
  };
}

/**
 * Loads this user's saved diagnostic inputs across the four owner-scoped
 * tables in one bounded `Promise.all` (never N+1). Returns the exact neutral
 * shape from Phase 3A when the user is signed out or has never saved the
 * form — both are legitimate "no saved input" states. A query failure is a
 * different thing entirely (private data that could not be read) and must
 * never be silently reinterpreted as "no saved input," so it throws
 * `PrivateDataUnavailableError` instead of degrading to neutral.
 */
export async function getInterviewPlaybookDiagnosticInputs(): Promise<InterviewPlaybookDiagnosticInputs> {
  const actor = await getAuthenticatedActor();
  if (!actor) return neutralDiagnosticInputs();

  const [settingsResult, confidenceResult, prioritiesResult, constraintsResult] = await Promise.all([
    actor.supabase
      .from("interview_playbook_diagnostic_settings")
      .select("available_hours_per_week,behavioral_stories_coverage,project_deep_dive_coverage")
      .eq("user_id", actor.user.id)
      .maybeSingle(),
    actor.supabase
      .from("interview_playbook_confidence")
      .select("area,confidence")
      .eq("user_id", actor.user.id),
    actor.supabase
      .from("interview_playbook_priorities")
      .select("area,position")
      .eq("user_id", actor.user.id)
      .order("position", { ascending: true }),
    actor.supabase
      .from("interview_playbook_constraints")
      .select("id,category,description,position")
      .eq("user_id", actor.user.id)
      .order("position", { ascending: true }),
  ]);

  if (settingsResult.error || confidenceResult.error || prioritiesResult.error || constraintsResult.error) {
    throw new PrivateDataUnavailableError("Interview Playbook diagnostic inputs");
  }

  const settings = settingsResult.data;
  if (!settings) return neutralDiagnosticInputs();

  const confidenceByArea: Partial<Record<InterviewPreparationArea, InterviewSelfReportedConfidence>> = {};
  for (const row of confidenceResult.data ?? []) {
    confidenceByArea[row.area as InterviewPreparationArea] = row.confidence as InterviewSelfReportedConfidence;
  }

  const priorities: readonly InterviewPreparationArea[] = (prioritiesResult.data ?? []).map(
    (row) => row.area as InterviewPreparationArea,
  );

  const constraints: readonly InterviewDiagnosticConstraint[] = (constraintsResult.data ?? []).map((row) => ({
    id: row.id,
    category: row.category as InterviewDiagnosticConstraint["category"],
    description: row.description,
  }));

  const availableHoursPerWeek = settings.available_hours_per_week;
  const coverage: InterviewPlaybookDiagnosticInputCoverage = {
    behavioralStories: settings.behavioral_stories_coverage as InterviewPreparationCoverageState,
    projectDeepDive: settings.project_deep_dive_coverage as InterviewPreparationCoverageState,
  };

  return {
    hasSavedInputs: true,
    availableHoursPerWeek,
    confidenceByArea,
    priorities,
    constraints,
    coverage,
    diagnosticInput: {
      availableHoursPerWeek,
      confidenceByArea,
      constraints,
      priorities,
      evidence: [],
      coverage,
    },
  };
}

export type SaveInterviewPlaybookDiagnosticInputsResult = Readonly<{ ok: boolean }>;

/**
 * Calls the sole write path — the atomic `save_interview_playbook_diagnostic_inputs`
 * RPC — with an already-validated, already-owner-scoped payload. Ownership is
 * derived from `auth.uid()` inside the RPC itself; nothing here can pass a
 * caller-supplied user id.
 */
export async function saveInterviewPlaybookDiagnosticInputsForActor(
  actor: AuthenticatedActor,
  payload: InterviewPlaybookDiagnosticInputFormPayload,
): Promise<SaveInterviewPlaybookDiagnosticInputsResult> {
  const { error } = await actor.supabase.rpc("save_interview_playbook_diagnostic_inputs", {
    available_hours_per_week_value: payload.availableHoursPerWeek,
    confidence_entries: payload.confidenceEntries as unknown as Json,
    priority_areas: payload.priorityAreas as string[],
    constraint_entries: payload.constraintEntries as unknown as Json,
    behavioral_stories_coverage_value: payload.behavioralStoriesCoverage,
    project_deep_dive_coverage_value: payload.projectDeepDiveCoverage,
  });
  return { ok: !error };
}
