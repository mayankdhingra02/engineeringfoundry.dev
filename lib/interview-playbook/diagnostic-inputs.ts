import "server-only";

import { getAuthenticatedActor, type AuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { Json } from "@/lib/supabase/database.types";
import type { BuildInterviewDiagnosticSnapshotInput } from "./diagnostic.ts";
import {
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION,
  parseInterviewPlaybookDiagnosticSaveResult,
  parseInterviewPlaybookDiagnosticSnapshotResult,
  type InterviewPlaybookDiagnosticInputFormPayload,
  type InterviewPlaybookDiagnosticSnapshot,
} from "./diagnostic-input-form.ts";

export type InterviewPlaybookDiagnosticInputs = InterviewPlaybookDiagnosticSnapshot & Readonly<{
  diagnosticInput: BuildInterviewDiagnosticSnapshotInput;
}>;

function neutralDiagnosticInputs(): InterviewPlaybookDiagnosticInputs {
  const coverage = {
    behavioralStories: "unknown" as const,
    projectDeepDive: "unknown" as const,
  };
  return {
    hasSavedInputs: false,
    availableHoursPerWeek: null,
    confidenceByArea: {},
    priorities: [],
    constraints: [],
    coverage,
    revision: INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION,
    diagnosticInput: {
      availableHoursPerWeek: null,
      confidenceByArea: {},
      constraints: [],
      priorities: [],
      evidence: [],
      coverage,
    },
  };
}

/**
 * Loads one revision-coherent owner-derived aggregate. Signed-out and genuine
 * no-settings-row states remain neutral; an RPC error or malformed aggregate
 * is private data that could not be read and must never become a blank form.
 */
export async function getInterviewPlaybookDiagnosticInputs(): Promise<InterviewPlaybookDiagnosticInputs> {
  const actor = await getAuthenticatedActor();
  if (!actor) return neutralDiagnosticInputs();

  const { data, error } = await actor.supabase.rpc(
    "get_interview_playbook_diagnostic_inputs_snapshot",
  );
  if (error) {
    throw new PrivateDataUnavailableError("Interview Playbook diagnostic inputs");
  }

  const snapshot = parseInterviewPlaybookDiagnosticSnapshotResult(data);
  if (snapshot.status === "invalid") {
    throw new PrivateDataUnavailableError("Interview Playbook diagnostic inputs");
  }
  const value = snapshot.value;

  return {
    ...value,
    diagnosticInput: {
      availableHoursPerWeek: value.availableHoursPerWeek,
      confidenceByArea: value.confidenceByArea,
      constraints: value.constraints,
      priorities: value.priorities,
      evidence: [],
      coverage: value.coverage,
    },
  };
}

export type SaveInterviewPlaybookDiagnosticInputsResult =
  | Readonly<{ status: "saved"; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "error" }>;

/**
 * Calls the sole revision-checked atomic write path with an already-validated
 * payload. Ownership is independently derived from `auth.uid()` in the RPC.
 */
export async function saveInterviewPlaybookDiagnosticInputsForActor(
  actor: AuthenticatedActor,
  payload: InterviewPlaybookDiagnosticInputFormPayload,
): Promise<SaveInterviewPlaybookDiagnosticInputsResult> {
  const { data, error } = await actor.supabase.rpc(
    "save_interview_playbook_diagnostic_inputs_if_revision",
    {
      target_expect_absent: payload.expectAbsent,
      target_expected_updated_at: payload.expectedUpdatedAt,
      available_hours_per_week_value: payload.availableHoursPerWeek,
      confidence_entries: payload.confidenceEntries as unknown as Json,
      priority_areas: payload.priorityAreas as string[],
      constraint_entries: payload.constraintEntries as unknown as Json,
      behavioral_stories_coverage_value: payload.behavioralStoriesCoverage,
      project_deep_dive_coverage_value: payload.projectDeepDiveCoverage,
    },
  );
  if (error) return { status: "error" };

  const outcome = parseInterviewPlaybookDiagnosticSaveResult(data);
  return outcome.status === "invalid" ? { status: "error" } : outcome;
}
