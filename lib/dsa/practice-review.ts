import { canonicalDsaQuestionById, type CanonicalDsaQuestion } from "./catalog";
import type { DsaProgressMap } from "./progress";
import type { DsaPracticeAttemptSummary } from "./practice-attempt-query";

export type DsaReviewQueueItem = Readonly<{ question: CanonicalDsaQuestion; reasons: readonly string[]; lastRetrievedAt: string | null }>;

/** Deterministic review selection. Missed days never multiply work. */
export function buildDsaReviewQueue(progress: DsaProgressMap, attempts: readonly DsaPracticeAttemptSummary[]): DsaReviewQueueItem[] {
  const rows = new Map<string, { reasons: Set<string>; lastRetrievedAt: string | null }>();
  const add = (questionId: string, reason: string, at: string | null) => {
    if (!canonicalDsaQuestionById.get(questionId)?.inQuestionBrowser) return;
    const row = rows.get(questionId) ?? { reasons: new Set<string>(), lastRetrievedAt: null };
    row.reasons.add(reason);
    if (at && (!row.lastRetrievedAt || at > row.lastRetrievedAt)) row.lastRetrievedAt = at;
    rows.set(questionId, row);
  };
  for (const row of Object.values(progress)) {
    if (row.status === "attempted") add(row.question_id, "Incomplete attempt", row.last_practiced_at);
    if (row.status === "review") add(row.question_id, "Marked for review", row.last_practiced_at);
    if (row.confidence === "low") add(row.question_id, "Low self-reported confidence", row.last_practiced_at);
  }
  for (const attempt of attempts) {
    if (attempt.review_reason === "error") add(attempt.question_id, "Unresolved error", attempt.updated_at);
    if (attempt.review_reason === "elapsed") add(attempt.question_id, "Exceeded configured time", attempt.updated_at);
    if (attempt.review_reason === "manual") add(attempt.question_id, "Attempt returned to review", attempt.updated_at);
  }
  return [...rows.entries()].map(([questionId, row]) => ({ question: canonicalDsaQuestionById.get(questionId)!, reasons: [...row.reasons], lastRetrievedAt: row.lastRetrievedAt }))
    .sort((left, right) => (left.lastRetrievedAt ?? "").localeCompare(right.lastRetrievedAt ?? "") || left.question.id.localeCompare(right.question.id));
}
