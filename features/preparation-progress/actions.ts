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
import type { LocalProgressStatus, PreparationTrack } from "@/lib/preparation-progress/local";

export type PreparationActivityActionResult = { saved: boolean; message: string };

const mlIds = new Set(activeMlDesignProblems.map((item) => item.id));
const behavioralIds = new Set(activeBehavioralQuestions.map((item) => item.id));

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
}): Promise<PreparationActivityActionResult> {
  if (!isAccountPlatformAvailable()) return { saved: false, message: "Account persistence is not available in this configuration." };
  const actor = await getAuthenticatedActor();
  if (!actor) return { saved: false, message: "Sign in to keep this activity with your account." };

  if (input.track === "dsa") {
    if (!canonicalDsaQuestionById.has(input.itemId)) return { saved: false, message: "That DSA item is not in the current catalog." };
    const { error } = await actor.supabase.rpc("save_dsa_question_progress", {
      target_question_id: input.itemId,
      target_status: input.status === "completed" ? "review" : "attempted",
      target_confidence: null,
      target_bookmarked: false,
      target_notes: null,
    });
    if (error) return { saved: false, message: "We couldn't save this DSA activity." };
  } else if (input.track === "system-design") {
    const itemType = canonicalSystemDesignConceptIds.has(input.itemId)
      ? "concept"
      : canonicalSystemDesignProblemIds.has(input.itemId)
        ? "design_problem"
        : null;
    if (!itemType) return { saved: false, message: "That System Design item is not in the published curriculum." };
    const { error } = await actor.supabase.rpc("save_system_design_item_progress", {
      target_item_id: input.itemId,
      target_item_type: itemType,
      target_status: "reviewed",
      target_confidence: null,
      target_bookmarked: false,
      target_notes: null,
    });
    if (error) return { saved: false, message: "We couldn't save this System Design activity." };
  } else {
    const valid = input.track === "ml-design" ? mlIds.has(input.itemId) : behavioralIds.has(input.itemId);
    if (!valid) return { saved: false, message: "That preparation item is not in the current catalog." };
    const { error } = await actor.supabase.rpc("save_preparation_track_progress", {
      target_track: input.track,
      target_item_id: input.itemId,
      target_status: input.status,
    });
    if (error) return { saved: false, message: "We couldn't save this preparation activity." };
  }

  refreshPreparation(input.track);
  return { saved: true, message: "Preparation activity saved to your account." };
}
