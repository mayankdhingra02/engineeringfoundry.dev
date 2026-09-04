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
import {
  DSA_PROGRESS_CONFLICT_ERROR,
  DSA_PROGRESS_INVALID_INPUT_ERROR,
  DSA_PROGRESS_PERSISTENCE_ERROR,
  DSA_PROGRESS_SAVED_MESSAGE,
  parseDsaQuestionProgressActionInput,
  parseDsaQuestionProgressSaveResult,
} from "@/lib/dsa/question-progress-action-input";
import type { DsaQuestionStatus } from "@/lib/dsa/progress";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";

export type DsaProgressActionState = {
  status: "idle" | "success" | "error";
  message: string;
  analytics?: { questionId: string; recordedStatus: DsaQuestionStatus };
  conflict?: boolean;
  revision?: string;
};
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

export async function updateDsaQuestionProgressAction(
  previousState: DsaProgressActionState,
  formData: unknown,
): Promise<DsaProgressActionState> {
  const parsed = parseDsaQuestionProgressActionInput(
    formData,
    canonicalQuestionIds,
  );
  if (!parsed.ok) {
    return {
      status: "error",
      message: DSA_PROGRESS_INVALID_INPUT_ERROR,
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
  if (!actor) return failed("Sign in to save practice progress.");

  const { data, error } = await actor.supabase.rpc(
    "save_dsa_question_progress_if_revision",
    {
      target_question_id: input.questionId,
      target_expect_absent: input.expectAbsent,
      target_expected_updated_at: input.expectedUpdatedAt,
      target_status: input.status,
      target_confidence: input.confidence,
      target_bookmarked: input.bookmarked,
      target_notes: input.notes,
    },
  );
  if (error) return failed(DSA_PROGRESS_PERSISTENCE_ERROR);

  const outcome = parseDsaQuestionProgressSaveResult(
    data,
    input.questionId,
    canonicalQuestionIds,
  );
  if (outcome.status === "conflict") {
    return failed(DSA_PROGRESS_CONFLICT_ERROR, true);
  }
  if (outcome.status === "invalid") {
    return failed(DSA_PROGRESS_PERSISTENCE_ERROR);
  }

  refreshDsa(input.questionId);
  return {
    status: "success",
    message: DSA_PROGRESS_SAVED_MESSAGE,
    revision: outcome.updatedAt,
    analytics: {
      questionId: input.questionId,
      recordedStatus: input.status,
    },
  };
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
