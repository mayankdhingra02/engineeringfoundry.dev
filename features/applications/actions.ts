"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseApplicationForm, parseRoundForm, type FieldErrors } from "@/lib/applications/validation";
import { APPLICATION_STATUSES } from "@/lib/applications/options";
import {
  APPLICATION_EDIT_CONFLICT_MESSAGE,
  INTERVIEW_ROUND_EDIT_CONFLICT_MESSAGE,
} from "@/lib/applications/edit-revision";
import {
  APPLICATION_DELETE_ERROR,
  INTERVIEW_ROUND_DELETE_ERROR,
  parseApplicationDeleteInput,
  parseRoundDeleteInput,
  parseTrackerDeleteResult,
} from "@/lib/applications/delete-revision";
import { getAuthenticatedActor } from "@/lib/auth/actor";

export interface TrackerActionState { status: "idle" | "error"; message: string; fieldErrors?: FieldErrors; conflict?: boolean }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sessionError(): TrackerActionState {
  return { status: "error", message: "Your session has expired. Sign in and try again." };
}

function mutationFailure(message: string): never {
  throw new Error(message);
}

function signInAgain(next: string): never {
  redirect(`/signin?next=${encodeURIComponent(next)}`);
}

export async function createApplicationAction(_: TrackerActionState, formData: unknown): Promise<TrackerActionState> {
  const parsed = parseApplicationForm(formData, "create");
  if (!parsed.ok) return { status: "error", message: "Review the highlighted fields.", fieldErrors: parsed.errors };
  const current = await getAuthenticatedActor();
  if (!current) return sessionError();
  const { data, error } = await current.supabase.from("applications").insert({ ...parsed.data, user_id: current.user.id }).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "We couldn't add this application. Review the fields and try again." };
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  redirect(`/applications/${data.id}`);
}

export async function updateApplicationAction(applicationId: string, _: TrackerActionState, formData: unknown): Promise<TrackerActionState> {
  const parsed = parseApplicationForm(formData, "edit");
  if (!parsed.ok) return parsed.reason === "invalid-revision"
    ? { status: "error", conflict: true, message: APPLICATION_EDIT_CONFLICT_MESSAGE }
    : { status: "error", message: "Review the highlighted fields.", fieldErrors: parsed.errors };
  if (!parsed.expectedUpdatedAt) return { status: "error", conflict: true, message: APPLICATION_EDIT_CONFLICT_MESSAGE };
  if (!UUID_PATTERN.test(applicationId)) return { status: "error", message: "This application could not be found." };
  const current = await getAuthenticatedActor();
  if (!current) return sessionError();
  const { data, error } = await current.supabase.from("applications").update(parsed.data).eq("id", applicationId).eq("user_id", current.user.id).eq("updated_at", parsed.expectedUpdatedAt).select("id").maybeSingle();
  if (error) return { status: "error", message: "We couldn't update this application. It may no longer be available." };
  if (!data) return { status: "error", conflict: true, message: APPLICATION_EDIT_CONFLICT_MESSAGE };
  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/dashboard");
  redirect(`/applications/${applicationId}`);
}

export async function updateApplicationStatusAction(applicationId: string, formData: FormData) {
  const current = await getAuthenticatedActor();
  if (!current) signInAgain("/applications");
  if (!UUID_PATTERN.test(applicationId)) return;
  const status = String(formData.get("status") ?? "");
  if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) return;
  const { data, error } = await current.supabase.from("applications").update({ status }).eq("id", applicationId).eq("user_id", current.user.id).select("id").maybeSingle();
  if (error || !data) mutationFailure("We couldn't update this application. It may no longer be available.");
  revalidatePath("/applications"); revalidatePath(`/applications/${applicationId}`); revalidatePath("/dashboard");
}

export async function deleteApplicationAction(
  applicationIdInput: unknown,
  revisionInput: unknown,
  _: TrackerActionState,
  formData: unknown,
): Promise<TrackerActionState> {
  const parsed = parseApplicationDeleteInput(
    applicationIdInput,
    revisionInput,
    formData,
  );
  if (!parsed) return { status: "error", message: APPLICATION_DELETE_ERROR };
  const current = await getAuthenticatedActor();
  if (!current) return sessionError();
  const { data, error } = await current.supabase.rpc(
    "delete_application_if_revision",
    {
      target_application_id: parsed.applicationId,
      target_expected_updated_at: parsed.expectedUpdatedAt,
    },
  );
  if (error) return { status: "error", message: APPLICATION_DELETE_ERROR };
  const outcome = parseTrackerDeleteResult(
    data,
    "application_id",
    parsed.applicationId,
  );
  if (outcome.status !== "deleted") {
    return {
      status: "error",
      message: APPLICATION_DELETE_ERROR,
      conflict: outcome.status === "conflict",
    };
  }
  revalidatePath("/applications"); revalidatePath("/dashboard");
  redirect("/applications");
}

export async function createRoundAction(applicationId: string, _: TrackerActionState, formData: unknown): Promise<TrackerActionState> {
  const parsed = parseRoundForm(formData, "create");
  if (!parsed.ok) return { status: "error", message: "Review the highlighted fields.", fieldErrors: parsed.errors };
  if (!UUID_PATTERN.test(applicationId)) return { status: "error", message: "This application could not be found." };
  const current = await getAuthenticatedActor();
  if (!current) return sessionError();
  const { data: roundId, error } = await current.supabase.rpc("create_interview_round", {
    target_application_id: applicationId,
    round_name_value: parsed.data.round_name,
    round_type_value: parsed.data.round_type,
    scheduled_at_value: parsed.data.scheduled_at,
    duration_minutes_value: parsed.data.duration_minutes,
    timezone_value: parsed.data.timezone,
    interviewer_name_value: parsed.data.interviewer_name,
    interviewer_role_value: parsed.data.interviewer_role,
    meeting_link_value: parsed.data.meeting_link,
    location_value: parsed.data.location,
    status_value: parsed.data.status,
    result_value: parsed.data.result,
    notes_value: parsed.data.notes,
  });
  if (error || !roundId) return { status: "error", message: "We couldn't add this interview round. Review the fields and try again." };
  revalidatePath(`/applications/${applicationId}`); revalidatePath("/applications"); revalidatePath("/dashboard");
  redirect(`/applications/${applicationId}`);
}

export async function updateRoundAction(applicationId: string, roundId: string, _: TrackerActionState, formData: unknown): Promise<TrackerActionState> {
  const parsed = parseRoundForm(formData, "edit");
  if (!parsed.ok) return parsed.reason === "invalid-revision"
    ? { status: "error", conflict: true, message: INTERVIEW_ROUND_EDIT_CONFLICT_MESSAGE }
    : { status: "error", message: "Review the highlighted fields.", fieldErrors: parsed.errors };
  if (!parsed.expectedUpdatedAt) return { status: "error", conflict: true, message: INTERVIEW_ROUND_EDIT_CONFLICT_MESSAGE };
  if (!UUID_PATTERN.test(applicationId) || !UUID_PATTERN.test(roundId)) return { status: "error", message: "This interview round could not be found." };
  const current = await getAuthenticatedActor();
  if (!current) return sessionError();
  const { data, error } = await current.supabase.from("interview_rounds").update(parsed.data).eq("id", roundId).eq("application_id", applicationId).eq("user_id", current.user.id).eq("updated_at", parsed.expectedUpdatedAt).select("id").maybeSingle();
  if (error) return { status: "error", message: "We couldn't update this interview round. It may no longer be available." };
  if (!data) return { status: "error", conflict: true, message: INTERVIEW_ROUND_EDIT_CONFLICT_MESSAGE };
  revalidatePath(`/applications/${applicationId}`); revalidatePath("/applications"); revalidatePath("/dashboard");
  redirect(`/applications/${applicationId}`);
}

export async function deleteRoundAction(
  applicationIdInput: unknown,
  roundIdInput: unknown,
  revisionInput: unknown,
  _: TrackerActionState,
  formData: unknown,
): Promise<TrackerActionState> {
  const parsed = parseRoundDeleteInput(
    applicationIdInput,
    roundIdInput,
    revisionInput,
    formData,
  );
  if (!parsed) return { status: "error", message: INTERVIEW_ROUND_DELETE_ERROR };
  const current = await getAuthenticatedActor();
  if (!current) return sessionError();
  const { data, error } = await current.supabase.rpc(
    "delete_interview_round_if_revision",
    {
      target_application_id: parsed.applicationId,
      target_round_id: parsed.roundId,
      target_expected_updated_at: parsed.expectedUpdatedAt,
    },
  );
  if (error) return { status: "error", message: INTERVIEW_ROUND_DELETE_ERROR };
  const outcome = parseTrackerDeleteResult(
    data,
    "round_id",
    parsed.roundId,
  );
  if (outcome.status !== "deleted") {
    return {
      status: "error",
      message: INTERVIEW_ROUND_DELETE_ERROR,
      conflict: outcome.status === "conflict",
    };
  }
  revalidatePath(`/applications/${parsed.applicationId}`); revalidatePath("/applications"); revalidatePath("/dashboard");
  redirect(`/applications/${parsed.applicationId}`);
}

export async function completeRoundAction(applicationId: string, roundId: string) {
  const current = await getAuthenticatedActor();
  if (!current) signInAgain(`/applications/${applicationId}`);
  if (!UUID_PATTERN.test(applicationId) || !UUID_PATTERN.test(roundId)) return;
  const { data, error } = await current.supabase.from("interview_rounds").update({ status: "Completed" }).eq("id", roundId).eq("application_id", applicationId).eq("user_id", current.user.id).select("id").maybeSingle();
  if (error || !data) mutationFailure("We couldn't complete this interview round. It may no longer be available.");
  revalidatePath(`/applications/${applicationId}`); revalidatePath("/applications"); revalidatePath("/dashboard");
}

export async function moveRoundAction(applicationId: string, roundId: string, direction: "up" | "down") {
  const current = await getAuthenticatedActor();
  if (!current) signInAgain(`/applications/${applicationId}`);
  if (!UUID_PATTERN.test(applicationId) || !UUID_PATTERN.test(roundId) || !["up", "down"].includes(direction)) return;
  const { data: moved, error } = await current.supabase.rpc("move_interview_round", {
    target_application_id: applicationId,
    target_round_id: roundId,
    move_direction: direction,
  });
  if (error) mutationFailure("We couldn't reorder this interview round. Try again.");
  // A boundary move is an intentional no-op; false is also returned when RLS
  // prevents access, so no private record details are disclosed to the client.
  if (!moved) return;
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  revalidatePath("/dashboard");
}
