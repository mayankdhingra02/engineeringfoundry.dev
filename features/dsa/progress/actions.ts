"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { canonicalDsaQuestionById } from "@/lib/dsa/catalog";
import type { DsaConfidence, DsaQuestionStatus } from "@/lib/dsa/progress";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";

export type DsaProgressActionState = { status: "idle" | "success" | "error"; message: string };
const statuses = new Set<DsaQuestionStatus>(["not_started", "attempted", "solved", "review"]);
const confidences = new Set<DsaConfidence>(["low", "medium", "high"]);

function refreshDsa(questionId?: string) {
  revalidatePath("/dsa");
  revalidatePath("/dsa/questions");
  revalidatePath("/dsa/practice");
  revalidatePath("/dsa/roadmap");
  revalidatePath("/dashboard");
  if (questionId) revalidatePath(`/dsa/questions/${questionId}`);
}

async function save(questionId: string, values: { status: DsaQuestionStatus; confidence: DsaConfidence | null; bookmarked: boolean; notes: string | null }) {
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Sign in to save practice progress." } satisfies DsaProgressActionState;
  if (!canonicalDsaQuestionById.has(questionId)) return { status: "error", message: "That question is not in the canonical catalog." } satisfies DsaProgressActionState;
  if (!statuses.has(values.status) || (values.confidence && !confidences.has(values.confidence)) || (values.notes?.length ?? 0) > 5000) {
    return { status: "error", message: "Review the practice values and try again." } satisfies DsaProgressActionState;
  }
  const { error } = await actor.supabase.rpc("save_dsa_question_progress", {
    target_question_id: questionId,
    target_status: values.status,
    target_confidence: values.confidence,
    target_bookmarked: values.bookmarked,
    target_notes: values.notes,
  });
  if (error) return { status: "error", message: "We couldn't save this practice update." } satisfies DsaProgressActionState;
  refreshDsa(questionId);
  return { status: "success", message: "Practice progress saved." } satisfies DsaProgressActionState;
}

export async function updateDsaQuestionProgressAction(_: DsaProgressActionState, formData: FormData): Promise<DsaProgressActionState> {
  const questionId = String(formData.get("question_id") ?? "");
  const status = String(formData.get("status") ?? "not_started") as DsaQuestionStatus;
  const confidenceValue = String(formData.get("confidence") ?? "");
  return save(questionId, {
    status,
    confidence: confidenceValue ? confidenceValue as DsaConfidence : null,
    bookmarked: formData.get("bookmarked") === "on",
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
}

export async function quickDsaStatusAction(formData: FormData): Promise<DsaProgressActionState> {
  const questionId = String(formData.get("question_id") ?? "");
  const status = String(formData.get("status") ?? "attempted") as DsaQuestionStatus;
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Sign in to update practice progress." };
  if (!canonicalDsaQuestionById.has(questionId) || !statuses.has(status)) return { status: "error", message: "That practice update is not valid." };
  const { data, error } = await actor.supabase.from("dsa_question_progress").select("confidence,bookmarked,notes").eq("user_id", actor.user.id).eq("question_id", questionId).maybeSingle();
  if (error) return { status: "error", message: "We couldn't load the current practice record." };
  return save(questionId, { status, confidence: data?.confidence ?? null, bookmarked: data?.bookmarked ?? false, notes: data?.notes ?? null });
}

export async function toggleDsaBookmarkAction(formData: FormData): Promise<DsaProgressActionState> {
  const questionId = String(formData.get("question_id") ?? "");
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Sign in to update bookmarks." };
  if (!canonicalDsaQuestionById.has(questionId)) return { status: "error", message: "That question is not in the practice catalog." };
  const { data, error } = await actor.supabase.from("dsa_question_progress").select("status,confidence,bookmarked,notes").eq("user_id", actor.user.id).eq("question_id", questionId).maybeSingle();
  if (error) return { status: "error", message: "We couldn't load the current bookmark state." };
  return save(questionId, { status: data?.status ?? "not_started", confidence: data?.confidence ?? null, bookmarked: !(data?.bookmarked ?? false), notes: data?.notes ?? null });
}

export async function savePreferredDsaRoadmapAction(level: RoadmapLevel): Promise<DsaProgressActionState> {
  if (!["sde1", "sde2", "sde3plus"].includes(level)) return { status: "error", message: "Choose a valid roadmap level." };
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Sign in to save a preferred roadmap." };
  const update = await actor.supabase.from("user_preparation_preferences").update({ dsa_level: level }).eq("user_id", actor.user.id).select("user_id");
  if (update.error) return { status: "error", message: "We couldn't update the preferred roadmap." };
  if (!update.data?.length) {
    const insert = await actor.supabase.from("user_preparation_preferences").insert({ user_id: actor.user.id, dsa_level: level });
    if (insert.error) return { status: "error", message: "We couldn't save the preferred roadmap." };
  }
  refreshDsa();
  return { status: "success", message: "Preferred roadmap saved." };
}
