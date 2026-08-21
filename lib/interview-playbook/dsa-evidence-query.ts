import "server-only";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { InterviewEvidenceItem } from "./evidence.ts";
import { dsaQuestionProgressToInterviewEvidence, type DsaProgressStatus } from "./dsa-evidence.ts";

/**
 * Loads the authenticated user's minimal DSA self-report record for the
 * Playbook. Notes, bookmarks, confidence, and general practice timestamps
 * are intentionally not selected or exposed to this boundary.
 */
export async function getDsaInterviewEvidence(): Promise<readonly InterviewEvidenceItem[]> {
  const actor = await getAuthenticatedActor();
  if (!actor) return [];

  const result = await actor.supabase
    .from("dsa_question_progress")
    .select("question_id,status,solved_at")
    .eq("user_id", actor.user.id)
    .eq("status", "solved");

  if (result.error) throw new PrivateDataUnavailableError("DSA practice evidence");

  return dsaQuestionProgressToInterviewEvidence((result.data ?? []).map((row) => ({
    questionId: row.question_id,
    status: row.status as DsaProgressStatus,
    solvedAt: row.solved_at,
  })));
}
