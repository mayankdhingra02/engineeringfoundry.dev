"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  normalizePreparationChecklistUuid,
  parsePreparationChecklistActionInput,
  PREPARATION_CHECKLIST_INVALID_INPUT_ERROR,
} from "@/lib/interview-preparation/checklist-action-input";
import {
  PREPARATION_NOTES_CONFLICT_ERROR,
  PREPARATION_NOTES_INVALID_INPUT_ERROR,
  PREPARATION_NOTES_PERSISTENCE_ERROR,
  PREPARATION_NOTES_SAVED_MESSAGE,
  PREPARATION_REFLECTION_CONFLICT_ERROR,
  PREPARATION_REFLECTION_INVALID_INPUT_ERROR,
  PREPARATION_REFLECTION_PERSISTENCE_ERROR,
  PREPARATION_REFLECTION_SAVED_MESSAGE,
  parsePreparationNotesActionInput,
  parsePreparationReflectionActionInput,
  parsePreparationTextSaveResult,
} from "@/lib/interview-preparation/text-action-input";
import {
  PREPARATION_TASK_INVALID_INPUT_ERROR,
  PREPARATION_TASK_PERSISTENCE_ERROR,
  PREPARATION_TASK_SAVED_MESSAGE,
  parsePreparationTaskCompletionInput,
  parsePreparationTaskCompletionResult,
} from "@/lib/interview-preparation/task-action-input";

export type PreparationActionState = {
  status: "idle" | "success" | "error";
  message: string;
  conflict?: boolean;
  revision?: string;
};

function refresh(roundId: string, applicationId?: string) {
  revalidatePath(`/interviews/${roundId}/prepare`);
  revalidatePath("/dashboard");
  if (applicationId) revalidatePath(`/applications/${applicationId}`);
}

export async function savePreparationNotesAction(
  roundId: unknown,
  applicationId: unknown,
  previousState: PreparationActionState,
  formData: unknown,
): Promise<PreparationActionState> {
  const parsed = parsePreparationNotesActionInput(roundId, applicationId, formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: PREPARATION_NOTES_INVALID_INPUT_ERROR,
      revision: previousState.revision,
    };
  }
  const input = parsed.value;
  const failed = (message: string, conflict = false) => ({
    status: "error" as const,
    message,
    conflict,
    revision: input.revision,
  });
  const actor = await getAuthenticatedActor();
  if (!actor) return failed("Your session expired. Sign in and try again.");
  const { data, error } = await actor.supabase.rpc(
    "save_interview_preparation_notes_if_revision",
    {
      target_round_id: input.roundId,
      target_expect_absent: input.expectAbsent,
      target_expected_updated_at: input.expectedUpdatedAt,
      target_notes: input.notes,
    },
  );
  if (error) return failed(PREPARATION_NOTES_PERSISTENCE_ERROR);
  const outcome = parsePreparationTextSaveResult(data, input.roundId);
  if (outcome.status === "conflict") {
    return failed(PREPARATION_NOTES_CONFLICT_ERROR, true);
  }
  if (outcome.status === "invalid") {
    return failed(PREPARATION_NOTES_PERSISTENCE_ERROR);
  }
  refresh(input.roundId, input.applicationId);
  return {
    status: "success",
    message: PREPARATION_NOTES_SAVED_MESSAGE,
    revision: outcome.updatedAt,
  };
}

export async function togglePreparationChecklistAction(roundId: unknown, itemId: unknown, targetCompleted: unknown, previousState: PreparationActionState, formData: FormData): Promise<PreparationActionState> {
  const parsed = parsePreparationChecklistActionInput(roundId, itemId, targetCompleted);
  void previousState;
  void formData;
  if (!parsed.ok) return { status: "error", message: PREPARATION_CHECKLIST_INVALID_INPUT_ERROR };
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  const { data, error } = await actor.supabase.rpc("set_interview_preparation_checklist_item", {
    target_round_id: parsed.value.roundId,
    target_item_id: parsed.value.itemId,
    target_completed: parsed.value.targetCompleted,
  });
  const applicationId = normalizePreparationChecklistUuid(data);
  if (error || applicationId === null) return { status: "error", message: "Checklist change was not saved. Try again." };
  refresh(parsed.value.roundId, applicationId);
  return { status: "success", message: "Checklist saved." };
}

export async function addPreparationTaskAction(roundId: string, applicationId: string, previousState: PreparationActionState, formData: FormData): Promise<PreparationActionState> {
  void previousState;
  const actor = await getAuthenticatedActor();
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  if (!title) return { status: "error", message: "Enter a task before adding it." };
  const { error } = await actor.supabase.rpc("add_interview_preparation_task", { target_round_id: roundId, title_value: title });
  if (error) return { status: "error", message: "Task was not added. Try again." };
  refresh(roundId, applicationId);
  return { status: "success", message: "Private task added." };
}

export async function togglePreparationTaskAction(roundId: unknown, taskId: unknown, targetCompleted: unknown, previousState: PreparationActionState, formData: FormData): Promise<PreparationActionState> {
  const parsed = parsePreparationTaskCompletionInput(roundId, taskId, targetCompleted);
  void previousState;
  void formData;
  if (!parsed.ok) return { status: "error", message: PREPARATION_TASK_INVALID_INPUT_ERROR };
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  const { data, error } = await actor.supabase.rpc("set_interview_preparation_task_completed", {
    target_round_id: parsed.value.roundId,
    target_task_id: parsed.value.taskId,
    target_completed: parsed.value.targetCompleted,
  });
  if (error) return { status: "error", message: PREPARATION_TASK_PERSISTENCE_ERROR };
  const outcome = parsePreparationTaskCompletionResult(data, parsed.value);
  if (outcome.status !== "saved") return { status: "error", message: PREPARATION_TASK_PERSISTENCE_ERROR };
  refresh(parsed.value.roundId, outcome.applicationId);
  return { status: "success", message: PREPARATION_TASK_SAVED_MESSAGE };
}

export async function deletePreparationTaskAction(roundId: string, applicationId: string, taskId: string, previousState: PreparationActionState, formData: FormData): Promise<PreparationActionState> {
  void previousState;
  void formData;
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  const { error } = await actor.supabase.rpc("delete_interview_preparation_task", { target_task_id: taskId });
  if (error) return { status: "error", message: "Task was not removed. Try again." };
  refresh(roundId, applicationId);
  return { status: "success", message: "Task removed." };
}

export async function savePreparationReflectionAction(
  roundId: unknown,
  applicationId: unknown,
  previousState: PreparationActionState,
  formData: unknown,
): Promise<PreparationActionState> {
  const parsed = parsePreparationReflectionActionInput(roundId, applicationId, formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: PREPARATION_REFLECTION_INVALID_INPUT_ERROR,
      revision: previousState.revision,
    };
  }
  const input = parsed.value;
  const failed = (message: string, conflict = false) => ({
    status: "error" as const,
    message,
    conflict,
    revision: input.revision,
  });
  const actor = await getAuthenticatedActor();
  if (!actor) return failed("Your session expired. Sign in and try again.");
  const { data, error } = await actor.supabase.rpc(
    "save_interview_preparation_reflection_if_revision",
    {
      target_round_id: input.roundId,
      target_expect_absent: input.expectAbsent,
      target_expected_updated_at: input.expectedUpdatedAt,
      target_topics_asked: input.topicsAsked,
      target_went_well: input.wentWell,
      target_needs_improvement: input.needsImprovement,
      target_follow_up_notes: input.followUpNotes,
    },
  );
  if (error) return failed(PREPARATION_REFLECTION_PERSISTENCE_ERROR);
  const outcome = parsePreparationTextSaveResult(data, input.roundId);
  if (outcome.status === "conflict") {
    return failed(PREPARATION_REFLECTION_CONFLICT_ERROR, true);
  }
  if (outcome.status === "invalid") {
    return failed(PREPARATION_REFLECTION_PERSISTENCE_ERROR);
  }
  refresh(input.roundId, input.applicationId);
  return {
    status: "success",
    message: PREPARATION_REFLECTION_SAVED_MESSAGE,
    revision: outcome.updatedAt,
  };
}
