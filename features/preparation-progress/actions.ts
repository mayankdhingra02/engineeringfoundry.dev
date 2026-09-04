"use server";

import { revalidatePath } from "next/cache";
import { activeBehavioralQuestions } from "@/data/behavioral";
import { activeMlDesignProblems } from "@/data/ml-design";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { canonicalDsaQuestionById } from "@/lib/dsa/catalog";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  canonicalSystemDesignConceptIds,
  canonicalSystemDesignProblemIds,
} from "@/lib/system-design/workspace";
import type { PreparationActivityAccountResult } from "@/lib/preparation-progress/activity-save";
import { preparationTracks, type LocalProgressStatus, type PreparationTrack } from "@/lib/preparation-progress/local";

const mlIds = new Set(activeMlDesignProblems.map((item) => item.id));
const behavioralIds = new Set(activeBehavioralQuestions.map((item) => item.id));
const preparationTrackSet = new Set<unknown>(preparationTracks);
const preparationStatusSet = new Set<unknown>(["in-progress", "completed"]);

function refreshPreparation(track: PreparationTrack) {
  revalidatePath("/");
  if (track === "dsa") revalidatePath("/dsa");
  if (track === "system-design") revalidatePath("/system-design");
  if (track === "ml-design") revalidatePath("/ml-design");
  if (track === "behavioral") revalidatePath("/behavioral");
}

/**
 * A completion is a self-recorded preparation activity. It never asserts
 * mastery, updates Playbook evidence, accepts notes, or accepts an owner id.
 */
export async function recordPreparationActivityAction(input: {
  track: PreparationTrack;
  itemId: string;
  status: LocalProgressStatus;
}): Promise<PreparationActivityAccountResult> {
  if (!isAccountPlatformAvailable()) return { saved: false, reason: "account-unavailable" };
  if (!input || !preparationTrackSet.has(input.track) || !preparationStatusSet.has(input.status) || typeof input.itemId !== "string") return { saved: false, reason: "invalid-input" };
  const actor = await getAuthenticatedActor();
  if (!actor) return { saved: false, reason: "unauthenticated" };

  if (input.track === "dsa") {
    if (!canonicalDsaQuestionById.has(input.itemId)) return { saved: false, reason: "invalid-input" };
    const { data, error } = await actor.supabase.rpc("set_dsa_question_quick_progress", {
      target_question_id: input.itemId,
      target_status: input.status === "completed" ? "review" : "attempted",
      target_bookmarked: null,
    });
    if (error || data !== input.itemId || !canonicalDsaQuestionById.has(data)) return { saved: false, reason: "persistence-failed" };
  } else if (input.track === "system-design") {
    const itemType = canonicalSystemDesignConceptIds.has(input.itemId)
      ? "concept"
      : canonicalSystemDesignProblemIds.has(input.itemId)
        ? "design_problem"
        : null;
    if (!itemType) return { saved: false, reason: "invalid-input" };
    const { error } = await actor.supabase.rpc("save_system_design_item_progress", {
      target_item_id: input.itemId,
      target_item_type: itemType,
      target_status: "reviewed",
      target_confidence: null,
      target_bookmarked: false,
      target_notes: null,
    });
    if (error) return { saved: false, reason: "persistence-failed" };
  } else if (input.track === "ml-design" || input.track === "behavioral") {
    const valid = input.track === "ml-design" ? mlIds.has(input.itemId) : behavioralIds.has(input.itemId);
    if (!valid) return { saved: false, reason: "invalid-input" };
    const { error } = await actor.supabase.rpc("save_preparation_track_progress", {
      target_track: input.track,
      target_item_id: input.itemId,
      target_status: input.status,
    });
    if (error) return { saved: false, reason: "persistence-failed" };
  } else {
    return { saved: false, reason: "invalid-input" };
  }

  refreshPreparation(input.track);
  return { saved: true, reason: "saved" };
}
