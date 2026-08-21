"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/lib/admin/auth";
import { EXPERIENCE_MODERATION_STATUSES, FEEDBACK_STATUSES, type FeedbackStatus } from "@/lib/feedback/model";
import { logServerOperationalFailure } from "@/lib/observability/log";

export type AdminMutationState = { status: "idle" | "error" | "success"; message?: string };
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

export async function moderateInterviewExperienceAction(_: AdminMutationState, form: FormData): Promise<AdminMutationState> {
  const id = String(form.get("experience_id") ?? "");
  const status = String(form.get("status") ?? "");
  const note = String(form.get("moderation_note") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !EXPERIENCE_MODERATION_STATUSES.includes(status as (typeof EXPERIENCE_MODERATION_STATUSES)[number])) return { status: "error", message: "Choose an allowed moderation decision." };
  if (note.length > 1000) return { status: "error", message: "Moderation notes must be 1,000 characters or fewer." };
  const actor = await requireAdminActor("/admin/interview-experiences");
  const { error } = await actor.supabase.rpc("moderate_interview_experience", { target_id: id, next_status: status as "needs_changes" | "approved" | "rejected", moderation_note: note || null });
  if (error) {
    logServerOperationalFailure("admin_experience_moderation_failed", error, { status });
    return { status: "error", message: "The experience was not changed. Refresh and try again." };
  }
  revalidatePath("/admin"); revalidatePath("/admin/interview-experiences"); revalidatePath("/interview-experiences");
  return { status: "success", message: "Moderation decision saved without rewriting contributor content." };
}
