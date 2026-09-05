"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { dsaPracticeAttemptDocumentToJson } from "@/lib/dsa/practice-attempt";
import { DSA_ATTEMPT_CONFLICT_ERROR, DSA_ATTEMPT_INVALID_INPUT, DSA_ATTEMPT_PERSISTENCE_ERROR, isDsaAttemptId, parseDsaAttemptCreateInput, parseDsaAttemptSaveInput, parseDsaAttemptSaveResult } from "@/lib/dsa/practice-attempt-action-input";

export type DsaAttemptActionState = { status: "idle" | "success" | "error"; message: string; conflict?: boolean; revision?: number };

function refresh(questionId: string, attemptId?: string) {
  revalidatePath("/dsa/practice"); revalidatePath(`/dsa/questions/${questionId}`); revalidatePath("/interview-playbook");
  if (attemptId) revalidatePath(`/dsa/questions/${questionId}/practice/${attemptId}`);
}

export async function createDsaPracticeAttemptAction(questionId: unknown, formData: unknown) {
  const input = parseDsaAttemptCreateInput(questionId, formData);
  if (!input || !isAccountPlatformAvailable()) return;
  const actor = await getAuthenticatedActor();
  if (!actor) redirect(`/signin?next=${encodeURIComponent(`/dsa/questions/${input.questionId}`)}`);
  const { data, error } = await actor.supabase.rpc("create_dsa_practice_attempt", { target_question_id: input.questionId, target_catalog_version: input.catalogVersion, target_title: input.title, target_mode: input.mode, target_duration_minutes: input.durationMinutes, target_prior_exposure: input.priorExposure, target_document: dsaPracticeAttemptDocumentToJson(input.document) });
  if (error || !isDsaAttemptId(data)) throw new Error(DSA_ATTEMPT_PERSISTENCE_ERROR);
  refresh(input.questionId, data);
  redirect(`/dsa/questions/${input.questionId}/practice/${data}`);
}

export async function saveDsaPracticeAttemptAction(attemptId: unknown, questionId: unknown, previous: DsaAttemptActionState, formData: unknown): Promise<DsaAttemptActionState> {
  const input = parseDsaAttemptSaveInput(attemptId, questionId, formData);
  if (!input) return { status: "error", message: DSA_ATTEMPT_INVALID_INPUT, revision: previous.revision };
  const fail = (message: string, conflict = false): DsaAttemptActionState => ({ status: "error", message, conflict, revision: input.expectedRevision });
  if (!isAccountPlatformAvailable()) return fail("Account persistence is not available in this configuration.");
  const actor = await getAuthenticatedActor(); if (!actor) return fail("Your session expired. Sign in and reopen this attempt.");
  const { data, error } = await actor.supabase.rpc("save_dsa_practice_attempt", { target_attempt_id: input.attemptId, target_expected_revision: input.expectedRevision, target_title: input.title, target_status: input.status, target_mode: input.mode, target_duration_minutes: input.durationMinutes, target_prior_exposure: input.priorExposure, target_elapsed_seconds: input.elapsedSeconds, target_document: dsaPracticeAttemptDocumentToJson(input.document) });
  if (error) return fail(DSA_ATTEMPT_PERSISTENCE_ERROR);
  const result = parseDsaAttemptSaveResult(data, input);
  if (result === "conflict") return fail(DSA_ATTEMPT_CONFLICT_ERROR, true);
  if (result === "invalid") return fail(DSA_ATTEMPT_PERSISTENCE_ERROR);
  refresh(input.questionId, input.attemptId);
  return { status: "success", message: "Practice attempt saved.", revision: result.revision };
}
