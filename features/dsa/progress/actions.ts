"use server";

import { revalidatePath } from "next/cache";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { canonicalDsaQuestionById } from "@/lib/dsa/catalog";
import {
  QUICK_DSA_PROGRESS_INVALID_INPUT_ERROR,
  parseQuickDsaBookmarkActionInput,
  parseQuickDsaStatusActionInput,
} from "@/lib/dsa/quick-progress-action-input";
import type { DsaConfidence, DsaQuestionStatus } from "@/lib/dsa/progress";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";

export type DsaProgressActionState = { status: "idle" | "success" | "error"; message: string; analytics?: { questionId: string; recordedStatus: DsaQuestionStatus } };
const statuses = new Set<DsaQuestionStatus>(["not_started", "attempted", "solved", "review"]);
const confidences = new Set<DsaConfidence>(["low", "medium", "high"]);
const canonicalQuestionIds = new Set(canonicalDsaQuestionById.keys());

const accountUnavailable = () => ({ status: "error", message: "Account persistence is not available in this configuration." } satisfies DsaProgressActionState);

function refreshDsa(questionId?: string) {
  revalidatePath("/dsa");
  revalidatePath("/dsa/questions");
  revalidatePath("/dsa/practice");
  revalidatePath("/dsa/roadmap");
  revalidatePath("/dashboard");
  if (questionId) revalidatePath(`/dsa/questions/${questionId}`);
}

async function save(questionId: string, values: { status: DsaQuestionStatus; confidence: DsaConfidence | null; bookmarked: boolean; notes: string | null }) {
  if (!isAccountPlatformAvailable()) return accountUnavailable();
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
  return { status: "success", message: "Practice progress saved.", analytics: { questionId, recordedStatus: values.status } } satisfies DsaProgressActionState;
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

export async function quickDsaStatusAction(formData: unknown): Promise<DsaProgressActionState> {
  const parsed = parseQuickDsaStatusActionInput(formData, canonicalQuestionIds);
  if (!parsed.ok) return { status: "error", message: QUICK_DSA_PROGRESS_INVALID_INPUT_ERROR };
  const { questionId, status } = parsed.value;
  if (!isAccountPlatformAvailable()) return accountUnavailable();
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Sign in to update practice progress." };
  const { data, error } = await actor.supabase.rpc("set_dsa_question_quick_progress", {
    target_question_id: questionId,
    target_status: status,
    target_bookmarked: null,
  });
  if (error || data !== questionId || !canonicalQuestionIds.has(data)) {
    return { status: "error", message: "We couldn't save this practice update." };
  }
  refreshDsa(questionId);
  return {
    status: "success",
    message: "Practice progress saved.",
    analytics: { questionId, recordedStatus: status },
  };
}

export async function toggleDsaBookmarkAction(formData: unknown): Promise<DsaProgressActionState> {
  const parsed = parseQuickDsaBookmarkActionInput(formData, canonicalQuestionIds);
  if (!parsed.ok) return { status: "error", message: QUICK_DSA_PROGRESS_INVALID_INPUT_ERROR };
  const { questionId, bookmarked } = parsed.value;
  if (!isAccountPlatformAvailable()) return accountUnavailable();
  const actor = await getAuthenticatedActor();
  if (!actor) return { status: "error", message: "Sign in to update bookmarks." };
  const { data, error } = await actor.supabase.rpc("set_dsa_question_quick_progress", {
    target_question_id: questionId,
    target_status: null,
    target_bookmarked: bookmarked,
  });
  if (error || data !== questionId || !canonicalQuestionIds.has(data)) {
    return { status: "error", message: "We couldn't save this practice update." };
  }
  refreshDsa(questionId);
  return { status: "success", message: "Practice progress saved." };
}

export async function savePreferredDsaRoadmapAction(level: RoadmapLevel): Promise<DsaProgressActionState> {
  if (!["sde1", "sde2", "sde3plus"].includes(level)) return { status: "error", message: "Choose a valid roadmap level." };
  if (!isAccountPlatformAvailable()) return accountUnavailable();
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
