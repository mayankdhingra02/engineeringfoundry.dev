import "server-only";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { InterviewEvidenceItem } from "./evidence.ts";
import {
  systemDesignProgressToInterviewEvidence,
  type SystemDesignProgressStatus,
} from "./system-design-evidence.ts";

/**
 * Loads only the actor-owned fields required to retain System Design's manual
 * progress as self-report. In particular, this boundary never selects notes,
 * confidence, bookmarks, attempt documents, or application context.
 */
export async function getSystemDesignInterviewEvidence(): Promise<readonly InterviewEvidenceItem[]> {
  const actor = await getAuthenticatedActor();
  if (!actor) return [];

  const result = await actor.supabase
    .from("system_design_item_progress")
    .select("item_id,item_type,status,updated_at")
    .eq("user_id", actor.user.id)
    .in("item_type", ["concept", "design_problem"])
    .in("status", ["comfortable", "review"]);

  if (result.error) throw new PrivateDataUnavailableError("System Design practice evidence");

  return systemDesignProgressToInterviewEvidence((result.data ?? []).map((row) => ({
    itemId: row.item_id,
    itemType: row.item_type as "concept" | "design_problem",
    status: row.status as SystemDesignProgressStatus,
    updatedAt: row.updated_at,
  })));
}
