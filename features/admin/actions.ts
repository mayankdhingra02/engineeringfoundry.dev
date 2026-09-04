"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/lib/admin/auth";
import {
  ADMIN_FEEDBACK_TRIAGE_CONFLICT_ERROR,
  ADMIN_FEEDBACK_TRIAGE_INVALID_INPUT_ERROR,
  ADMIN_FEEDBACK_TRIAGE_PERSISTENCE_ERROR,
  ADMIN_FEEDBACK_TRIAGE_SAVED_MESSAGE,
  parseAdminFeedbackTriageInput,
  parseAdminFeedbackTriageMutationResult,
} from "@/lib/admin/feedback-triage-action-input";
import {
  INTERVIEW_EXPERIENCE_INVALID_MODERATION_ERROR,
  INTERVIEW_EXPERIENCE_MODERATION_CONFLICT_ERROR,
  INTERVIEW_EXPERIENCE_MODERATION_SAVED_MESSAGE,
  parseInterviewExperienceModerationInput,
  parseInterviewExperienceMutationResult,
} from "@/lib/interview-experiences/action-input";
import { logServerOperationalFailure } from "@/lib/observability/log";

export type AdminMutationState = { status: "idle" | "error" | "success"; message?: string; conflict?: boolean; revision?: string };
export const initialAdminMutationState: AdminMutationState = { status: "idle" };

export async function updateFeedbackAction(_: AdminMutationState, form: unknown): Promise<AdminMutationState> {
  const parsed = parseAdminFeedbackTriageInput(form);
  if (!parsed.ok) return { status: "error", message: ADMIN_FEEDBACK_TRIAGE_INVALID_INPUT_ERROR };
  const actor = await requireAdminActor(`/admin/feedback/${parsed.value.feedbackId}`);
  const { data, error } = await actor.supabase.rpc("update_feedback_submission_if_revision", {
    target_feedback_id: parsed.value.feedbackId,
    target_expected_updated_at: parsed.value.expectedUpdatedAt,
    target_status: parsed.value.status,
    target_admin_note: parsed.value.adminNote,
  });
  if (error) {
    logServerOperationalFailure("admin_feedback_update_failed", error, { status: parsed.value.status });
    return { status: "error", message: ADMIN_FEEDBACK_TRIAGE_PERSISTENCE_ERROR };
  }
  const result = parseAdminFeedbackTriageMutationResult(data, parsed.value);
  if (result.status === "conflict") return { status: "error", message: ADMIN_FEEDBACK_TRIAGE_CONFLICT_ERROR, conflict: true };
  if (result.status !== "saved") return { status: "error", message: ADMIN_FEEDBACK_TRIAGE_PERSISTENCE_ERROR };
  revalidatePath("/admin"); revalidatePath("/admin/feedback"); revalidatePath(`/admin/feedback/${parsed.value.feedbackId}`);
  return { status: "success", message: ADMIN_FEEDBACK_TRIAGE_SAVED_MESSAGE, revision: result.updatedAt };
}

export async function moderateInterviewExperienceAction(_: AdminMutationState, form: unknown): Promise<AdminMutationState> {
  const parsed = parseInterviewExperienceModerationInput(form);
  if (!parsed.ok) return { status: "error", message: INTERVIEW_EXPERIENCE_INVALID_MODERATION_ERROR };
  const actor = await requireAdminActor("/admin/interview-experiences");
  const { data, error } = await actor.supabase.rpc("moderate_interview_experience_if_revision", {
    target_experience_id: parsed.value.id,
    target_expected_updated_at: parsed.value.expectedUpdatedAt,
    target_status: parsed.value.status,
    target_moderation_note: parsed.value.note,
  });
  if (error) {
    logServerOperationalFailure("admin_experience_moderation_failed", error, { status: parsed.value.status });
    return { status: "error", message: "The experience was not changed. Please try again." };
  }
  const result = parseInterviewExperienceMutationResult(data, parsed.value.id, [parsed.value.status]);
  if (result.status === "conflict") return { status: "error", message: INTERVIEW_EXPERIENCE_MODERATION_CONFLICT_ERROR, conflict: true };
  if (result.status !== "saved") return { status: "error", message: "The experience was not changed. Please try again." };
  revalidatePath("/admin");
  revalidatePath("/admin/interview-experiences");
  revalidatePath("/interview-experiences");
  return { status: "success", message: INTERVIEW_EXPERIENCE_MODERATION_SAVED_MESSAGE, revision: result.updatedAt };
}
