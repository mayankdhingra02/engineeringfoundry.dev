"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/lib/admin/auth";
import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/lib/feedback/model";
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

export async function updateFeedbackAction(_: AdminMutationState, form: FormData): Promise<AdminMutationState> {
  const id = String(form.get("feedback_id") ?? "");
  const status = String(form.get("status") ?? "") as FeedbackStatus;
  const note = String(form.get("admin_note") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !FEEDBACK_STATUSES.includes(status)) return { status: "error", message: "Choose a valid feedback status." };
  if (note.length > 2000) return { status: "error", message: "Private operator notes must be 2,000 characters or fewer." };
  const actor = await requireAdminActor(`/admin/feedback/${id}`);
  const { error } = await actor.supabase.rpc("update_feedback_submission", { target_id: id, next_status: status, next_note: note || null });
  if (error) {
    logServerOperationalFailure("admin_feedback_update_failed", error, { status });
    return { status: "error", message: "The feedback item was not changed. Refresh and try again." };
  }
  revalidatePath("/admin"); revalidatePath("/admin/feedback"); revalidatePath(`/admin/feedback/${id}`);
  return { status: "success", message: "Feedback triage saved. The original report was not modified." };
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
