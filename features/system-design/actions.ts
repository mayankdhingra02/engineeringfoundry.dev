"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  attemptDocumentFromForm,
  attemptDocumentToJson,
  canonicalSystemDesignItemIds,
  canonicalSystemDesignProblemIds,
  emptySystemDesignAttemptDocument,
  systemDesignAttemptStatuses,
  systemDesignConfidences,
  type SystemDesignAttemptStatus,
  type SystemDesignConfidence,
  type SystemDesignStatus,
} from "@/lib/system-design/workspace";
import {
  SYSTEM_DESIGN_PROGRESS_CONFLICT_ERROR,
  SYSTEM_DESIGN_PROGRESS_INVALID_INPUT_ERROR,
  SYSTEM_DESIGN_PROGRESS_PERSISTENCE_ERROR,
  SYSTEM_DESIGN_PROGRESS_SAVED_MESSAGE,
  parseSystemDesignItemProgressActionInput,
  parseSystemDesignItemProgressSaveResult,
} from "@/lib/system-design/item-progress-action-input";

export type SystemDesignActionState = { status: "idle" | "success" | "error"; message: string; conflict?: boolean; revision?: number };
export type SystemDesignProgressActionState = {
  status: "idle" | "success" | "error";
  message: string;
  conflict?: boolean;
  revision?: string;
  analytics?: {
    itemId: string;
    itemType: "concept" | "design_problem";
    recordedStatus: SystemDesignStatus;
  };
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const accountUnavailable = () => ({ status: "error", message: "Account persistence is not available in this configuration." } satisfies SystemDesignActionState);

function refreshSystemDesign(problemId?: string, attemptId?: string) {
  revalidatePath("/system-design/practice");
  revalidatePath("/system-design/problems");
  revalidatePath("/dashboard");
  if (problemId) revalidatePath(`/system-design/problems/${problemId}`);
  if (problemId && attemptId) revalidatePath(`/system-design/problems/${problemId}/practice/${attemptId}`);
}

export async function saveSystemDesignProgressAction(
  previousState: SystemDesignProgressActionState,
  formData: unknown,
): Promise<SystemDesignProgressActionState> {
  const parsed = parseSystemDesignItemProgressActionInput(
    formData,
    canonicalSystemDesignItemIds,
  );
  if (!parsed.ok) {
    return {
      status: "error",
      message: SYSTEM_DESIGN_PROGRESS_INVALID_INPUT_ERROR,
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
  if (!isAccountPlatformAvailable()) {
    return failed("Account persistence is not available in this configuration.");
  }
  const actor = await getAuthenticatedActor();
  if (!actor) return failed("Sign in to save private System Design progress.");

  const { data, error } = await actor.supabase.rpc(
    "save_system_design_item_progress_if_revision",
    {
      target_item_id: input.itemId,
      target_item_type: input.itemType,
      target_expect_absent: input.expectAbsent,
      target_expected_updated_at: input.expectedUpdatedAt,
      target_status: input.status,
      target_confidence: input.confidence,
      target_bookmarked: input.bookmarked,
      target_notes: input.notes,
    },
  );
  if (error) return failed(SYSTEM_DESIGN_PROGRESS_PERSISTENCE_ERROR);

  const outcome = parseSystemDesignItemProgressSaveResult(
    data,
    input.itemId,
    input.itemType,
    canonicalSystemDesignItemIds,
  );
  if (outcome.status === "conflict") {
    return failed(SYSTEM_DESIGN_PROGRESS_CONFLICT_ERROR, true);
  }
  if (outcome.status === "invalid") {
    return failed(SYSTEM_DESIGN_PROGRESS_PERSISTENCE_ERROR);
  }

  refreshSystemDesign(
    canonicalSystemDesignProblemIds.has(input.itemId)
      ? input.itemId
      : undefined,
  );
  return {
    status: "success",
    message: SYSTEM_DESIGN_PROGRESS_SAVED_MESSAGE,
    revision: outcome.updatedAt,
    analytics: {
      itemId: input.itemId,
      itemType: input.itemType,
      recordedStatus: input.status,
    },
  };
}

export async function createSystemDesignAttemptAction(problemId: string, formData: FormData) {
  if (!isAccountPlatformAvailable()) return;
  const actor = await getAuthenticatedActor();
  const applicationId = String(formData.get("application_id") ?? "") || null;
  if (!actor) redirect(`/signin?next=${encodeURIComponent(`/system-design/problems/${problemId}`)}`);
  if (!canonicalSystemDesignProblemIds.has(problemId) || (applicationId && !UUID.test(applicationId))) return;
  const title = String(formData.get("title") ?? "").trim() || `${problemId.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ")} design attempt`;
  if (title.length > 160) return;
  const { data, error } = await actor.supabase.rpc("create_system_design_attempt", {
    target_problem_id: problemId, target_application_id: applicationId,
    target_title: title, target_document: attemptDocumentToJson(emptySystemDesignAttemptDocument()),
  });
  if (error || !data) throw new Error("We couldn't start this design attempt.");
  refreshSystemDesign(problemId, data);
  redirect(`/system-design/problems/${problemId}/practice/${data}`);
}

export async function saveSystemDesignAttemptAction(attemptId: string, problemId: string, _: SystemDesignActionState, formData: FormData): Promise<SystemDesignActionState> {
  if (!isAccountPlatformAvailable()) return accountUnavailable();
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Your session expired. Sign in and reopen this attempt." };
  if (!UUID.test(attemptId) || !canonicalSystemDesignProblemIds.has(problemId)) return { status: "error", message: "This attempt could not be found." };
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") as SystemDesignAttemptStatus;
  const confidenceValue = String(formData.get("confidence") ?? "");
  const confidence = confidenceValue ? confidenceValue as SystemDesignConfidence : null;
  const applicationId = String(formData.get("application_id") ?? "") || null;
  const expectedRevision = Number(formData.get("expected_revision"));
  if (!title || title.length > 160 || !systemDesignAttemptStatuses.includes(status) || (confidence && !systemDesignConfidences.includes(confidence)) || (applicationId && !UUID.test(applicationId)) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
    return { status: "error", message: "Review the attempt details and try again." };
  }
  const document = attemptDocumentFromForm(formData);
  if (!document.ok) return { status: "error", message: document.message };
  const { data, error } = await actor.supabase.rpc("save_system_design_attempt", {
    target_attempt_id: attemptId, target_expected_revision: expectedRevision, target_title: title,
    target_status: status, target_confidence: confidence, target_application_id: applicationId,
    target_document: attemptDocumentToJson(document.data),
  });
  if (error) return { status: "error", message: "We couldn't save this attempt." };
  if (!data?.length) return { status: "error", conflict: true, message: "This attempt changed in another tab. Reload before saving so you do not overwrite newer work." };
  refreshSystemDesign(problemId, attemptId);
  return { status: "success", message: "Attempt saved.", revision: data[0].revision };
}

export async function deleteSystemDesignAttemptAction(attemptId: string, problemId: string) {
  if (!isAccountPlatformAvailable()) return;
  const actor = await getAuthenticatedActor();
  if (!actor) redirect("/signin?next=/system-design/practice");
  if (!UUID.test(attemptId) || !canonicalSystemDesignProblemIds.has(problemId)) return;
  const { data, error } = await actor.supabase.rpc("delete_system_design_attempt", { target_attempt_id: attemptId });
  if (error || !data) throw new Error("We couldn't delete this attempt.");
  refreshSystemDesign(problemId, attemptId);
  redirect(`/system-design/problems/${problemId}`);
}
