"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  attemptDocumentFromForm,
  attemptDocumentToJson,
  canonicalSystemDesignItemIds,
  canonicalSystemDesignProblemIds,
  emptySystemDesignAttemptDocument,
  systemDesignAttemptStatuses,
  systemDesignConfidences,
  systemDesignStatuses,
  type SystemDesignAttemptStatus,
  type SystemDesignConfidence,
  type SystemDesignStatus,
} from "@/lib/system-design/workspace";

export type SystemDesignActionState = { status: "idle" | "success" | "error"; message: string; conflict?: boolean; revision?: number; analytics?: { itemId: string; itemType: "concept" | "design_problem"; recordedStatus: SystemDesignStatus } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refreshSystemDesign(problemId?: string, attemptId?: string) {
  revalidatePath("/system-design/practice");
  revalidatePath("/system-design/problems");
  revalidatePath("/dashboard");
  if (problemId) revalidatePath(`/system-design/problems/${problemId}`);
  if (problemId && attemptId) revalidatePath(`/system-design/problems/${problemId}/practice/${attemptId}`);
}

export async function saveSystemDesignProgressAction(_: SystemDesignActionState, formData: FormData): Promise<SystemDesignActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Sign in to save private System Design progress." };
  const itemId = String(formData.get("item_id") ?? "");
  const itemType = String(formData.get("item_type") ?? "") as "concept" | "design_problem";
  const status = String(formData.get("status") ?? "not_started") as SystemDesignStatus;
  const confidenceValue = String(formData.get("confidence") ?? "");
  const confidence = confidenceValue ? confidenceValue as SystemDesignConfidence : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!canonicalSystemDesignItemIds.has(`${itemType}:${itemId}`) || !systemDesignStatuses.includes(status) || (confidence && !systemDesignConfidences.includes(confidence)) || (notes?.length ?? 0) > 10000) {
    return { status: "error", message: "Review the progress fields and try again." };
  }
  const { error } = await actor.supabase.rpc("save_system_design_item_progress", {
    target_item_id: itemId, target_item_type: itemType, target_status: status, target_confidence: confidence,
    target_bookmarked: formData.get("bookmarked") === "on", target_notes: notes,
  });
  if (error) return { status: "error", message: "We couldn't save this progress update." };
  refreshSystemDesign(canonicalSystemDesignProblemIds.has(itemId) ? itemId : undefined);
  return { status: "success", message: "Progress saved.", analytics: { itemId, itemType, recordedStatus: status } };
}

export async function createSystemDesignAttemptAction(problemId: string, formData: FormData) {
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
  const actor = await getAuthenticatedActor();
  if (!actor) redirect("/signin?next=/system-design/practice");
  if (!UUID.test(attemptId) || !canonicalSystemDesignProblemIds.has(problemId)) return;
  const { data, error } = await actor.supabase.rpc("delete_system_design_attempt", { target_attempt_id: attemptId });
  if (error || !data) throw new Error("We couldn't delete this attempt.");
  refreshSystemDesign(problemId, attemptId);
  redirect(`/system-design/problems/${problemId}`);
}
