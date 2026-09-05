import "server-only";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { InterviewEvidenceItem } from "./evidence.ts";
import { dsaPracticeAttemptsToInterviewEvidence, dsaQuestionProgressToInterviewEvidence, type DsaPracticeAttemptEvidenceSource, type DsaProgressStatus } from "./dsa-evidence.ts";

/**
 * Loads the authenticated user's minimal DSA self-report record for the
 * Playbook. Notes, bookmarks, confidence, and general practice timestamps
 * are intentionally not selected or exposed to this boundary.
 */
export async function getDsaInterviewEvidence(): Promise<readonly InterviewEvidenceItem[]> {
  const actor = await getAuthenticatedActor();
  if (!actor) return [];

  const [result, attemptResult] = await Promise.all([
    actor.supabase.from("dsa_question_progress").select("question_id,status,solved_at").eq("user_id", actor.user.id).eq("status", "solved"),
    actor.supabase.from("dsa_practice_attempts").select("id,question_id,status,mode,prior_exposure,completed_at").eq("user_id", actor.user.id).neq("status", "draft"),
  ]);

  if (result.error || attemptResult.error) throw new PrivateDataUnavailableError("DSA practice evidence");

  const progressEvidence = dsaQuestionProgressToInterviewEvidence((result.data ?? []).map((row) => ({
    questionId: row.question_id,
    status: row.status as DsaProgressStatus,
    solvedAt: row.solved_at,
  })));
  const attemptEvidence = dsaPracticeAttemptsToInterviewEvidence((attemptResult.data ?? []).map((row) => ({
    id: row.id, questionId: row.question_id, status: row.status, mode: row.mode,
    priorExposure: row.prior_exposure, completedAt: row.completed_at,
  } satisfies DsaPracticeAttemptEvidenceSource)));
  return [...progressEvidence, ...attemptEvidence];
}
