"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  ML_DESIGN_ATTEMPT_CONFLICT_ERROR,
  ML_DESIGN_ATTEMPT_DELETE_ERROR,
  ML_DESIGN_ATTEMPT_INVALID_INPUT_ERROR,
  ML_DESIGN_ATTEMPT_PERSISTENCE_ERROR,
  ML_DESIGN_ATTEMPT_SAVED_MESSAGE,
  parseMlDesignAttemptCreateInput,
  parseMlDesignAttemptDeleteInput,
  parseMlDesignAttemptDeleteResult,
  parseMlDesignAttemptSaveInput,
  parseMlDesignAttemptSaveResult,
} from "@/lib/ml-design/attempt-action-input";
import { mlDesignAttemptDocumentToJson } from "@/lib/ml-design/attempt";
import { isMlDesignAttemptId } from "@/lib/ml-design/attempt-query";
import type { TrackerActionState } from "@/features/applications/actions";

export type MlDesignActionState = { status: "idle" | "success" | "error"; message: string; conflict?: boolean; revision?: number };

function refreshMlDesign(problemId: string, attemptId?: string) {
  revalidatePath(`/ml-design/problems/${problemId}`);
  revalidatePath("/ml-design/practice");
  if (attemptId) revalidatePath(`/ml-design/problems/${problemId}/practice/${attemptId}`);
}

export async function createMlDesignAttemptAction(problemId: unknown, formData: unknown) {
  const parsed = parseMlDesignAttemptCreateInput(problemId, formData);
  if (!parsed.ok || !isAccountPlatformAvailable()) return;
  const actor = await getAuthenticatedActor();
  if (!actor) redirect(`/signin?next=${encodeURIComponent(`/ml-design/problems/${parsed.value.problemId}`)}`);
  const input = parsed.value;
  const { data, error } = await actor.supabase.rpc("create_ml_design_attempt", {
    target_problem_id: input.problemId,
    target_problem_version: input.problemVersion,
    target_title: input.title,
    target_mode: input.mode,
    target_duration_minutes: input.durationMinutes,
    target_document: mlDesignAttemptDocumentToJson(input.document),
  });
  if (error || !isMlDesignAttemptId(data)) throw new Error(ML_DESIGN_ATTEMPT_PERSISTENCE_ERROR);
  refreshMlDesign(input.problemId, data);
  redirect(`/ml-design/problems/${input.problemId}/practice/${data}`);
}

export async function saveMlDesignAttemptAction(
  attemptId: unknown,
  problemId: unknown,
  previousState: MlDesignActionState,
  formData: unknown,
): Promise<MlDesignActionState> {
  const parsed = parseMlDesignAttemptSaveInput(attemptId, problemId, formData);
  if (!parsed.ok) return { status: "error", message: ML_DESIGN_ATTEMPT_INVALID_INPUT_ERROR, revision: previousState.revision };
  const input = parsed.value;
  const failed = (message: string, conflict = false): MlDesignActionState => ({ status: "error", message, conflict, revision: input.expectedRevision });
  if (!isAccountPlatformAvailable()) return failed("Account persistence is not available in this configuration.");
  const actor = await getAuthenticatedActor();
  if (!actor) return failed("Your session expired. Sign in and reopen this attempt.");
  const { data, error } = await actor.supabase.rpc("save_ml_design_attempt", {
    target_attempt_id: input.attemptId,
    target_expected_revision: input.expectedRevision,
    target_title: input.title,
    target_status: input.status,
    target_mode: input.mode,
    target_duration_minutes: input.durationMinutes,
    target_document: mlDesignAttemptDocumentToJson(input.document),
  });
  if (error) return failed(ML_DESIGN_ATTEMPT_PERSISTENCE_ERROR);
  const outcome = parseMlDesignAttemptSaveResult(data, input);
  if (outcome.status === "conflict") return failed(ML_DESIGN_ATTEMPT_CONFLICT_ERROR, true);
  if (outcome.status === "invalid") return failed(ML_DESIGN_ATTEMPT_PERSISTENCE_ERROR);
  refreshMlDesign(input.problemId, input.attemptId);
  return { status: "success", message: ML_DESIGN_ATTEMPT_SAVED_MESSAGE, revision: outcome.revision };
}

export async function deleteMlDesignAttemptAction(
  attemptId: unknown,
  problemId: unknown,
  revision: unknown,
  _: TrackerActionState,
  formData: unknown,
): Promise<TrackerActionState> {
  const parsed = parseMlDesignAttemptDeleteInput(attemptId, problemId, revision, formData);
  if (!parsed) return { status: "error", message: ML_DESIGN_ATTEMPT_DELETE_ERROR };
  if (!isAccountPlatformAvailable()) return { status: "error", message: "Account persistence is not available in this configuration." };
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  const { data, error } = await actor.supabase.rpc("delete_ml_design_attempt_if_revision", {
    target_attempt_id: parsed.attemptId,
    target_problem_id: parsed.problemId,
    target_expected_revision: parsed.expectedRevision,
  });
  if (error) return { status: "error", message: ML_DESIGN_ATTEMPT_DELETE_ERROR };
  const outcome = parseMlDesignAttemptDeleteResult(data, parsed.attemptId);
  if (outcome.status !== "deleted") return { status: "error", message: ML_DESIGN_ATTEMPT_DELETE_ERROR, conflict: outcome.status === "conflict" };
  refreshMlDesign(parsed.problemId, parsed.attemptId);
  redirect(`/ml-design/problems/${parsed.problemId}`);
}
