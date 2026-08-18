"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { ALL_CHECKLIST_IDS } from "@/lib/interview-preparation/model";

export type PreparationActionState = { status: "idle" | "success" | "error"; message: string };

function refresh(roundId: string, applicationId?: string) {
  revalidatePath(`/interviews/${roundId}/prepare`);
  revalidatePath("/dashboard");
  if (applicationId) revalidatePath(`/applications/${applicationId}`);
}

export async function savePreparationNotesAction(roundId: string, applicationId: string, _: PreparationActionState, formData: FormData): Promise<PreparationActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  const notes = String(formData.get("private_notes") ?? "").trim().slice(0, 12000);
  const { error } = await actor.supabase.rpc("save_interview_preparation", { target_round_id: roundId, notes_value: notes });
  if (error) return { status: "error", message: "Your notes could not be saved. Try again." };
  refresh(roundId, applicationId);
  return { status: "success", message: "Private notes saved." };
}

export async function togglePreparationChecklistAction(roundId: string, applicationId: string, completedIds: string[], itemId: string, previousState: PreparationActionState, formData: FormData): Promise<PreparationActionState> {
  void previousState;
  void formData;
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  if (!ALL_CHECKLIST_IDS.includes(itemId)) return { status: "error", message: "This checklist item is no longer available. Refresh and try again." };
  const next = completedIds.includes(itemId) ? completedIds.filter((id) => id !== itemId) : [...completedIds, itemId];
  const { error } = await actor.supabase.rpc("save_interview_preparation", { target_round_id: roundId, completed_ids_value: next.filter((id) => ALL_CHECKLIST_IDS.includes(id)) });
  if (error) return { status: "error", message: "Checklist change was not saved. Try again." };
  refresh(roundId, applicationId);
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

export async function togglePreparationTaskAction(roundId: string, applicationId: string, taskId: string, previousState: PreparationActionState, formData: FormData): Promise<PreparationActionState> {
  void previousState;
  void formData;
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  const { error } = await actor.supabase.rpc("toggle_interview_preparation_task", { target_task_id: taskId });
  if (error) return { status: "error", message: "Task change was not saved. Try again." };
  refresh(roundId, applicationId);
  return { status: "success", message: "Task saved." };
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

export async function savePreparationReflectionAction(roundId: string, applicationId: string, _: PreparationActionState, formData: FormData): Promise<PreparationActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and try again." };
  const value = (name: string) => String(formData.get(name) ?? "").trim().slice(0, 8000);
  const { error } = await actor.supabase.rpc("save_interview_preparation", { target_round_id: roundId, topics_asked_value: value("topics_asked"), went_well_value: value("went_well"), needs_improvement_value: value("needs_improvement"), follow_up_notes_value: value("follow_up_notes") });
  if (error) return { status: "error", message: "Reflection could not be saved. Confirm the round is completed and try again." };
  refresh(roundId, applicationId);
  return { status: "success", message: "Private reflection saved." };
}
