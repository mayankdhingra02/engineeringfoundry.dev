/**
 * Pure adapter for the limited DSA progress signal the Playbook may use.
 *
 * DSA progress is manually recorded: it has no judge, test runner, submission,
 * or evaluator result. A current `solved` status is therefore preserved only
 * as a positive *self-report*, never as direct observation. Confidence,
 * bookmarks, notes, and general practice timestamps are deliberately outside
 * this input shape and cannot become evidence through this adapter.
 */
import type { InterviewEvidenceItem } from "./evidence.ts";

export const DSA_PROGRESS_STATUSES = ["not_started", "attempted", "solved", "review"] as const;

export type DsaProgressStatus = (typeof DSA_PROGRESS_STATUSES)[number];

/** The minimal, privacy-safe row shape loaded by the server-side query. */
export type DsaQuestionProgressEvidenceSource = Readonly<{
  questionId: string;
  status: DsaProgressStatus;
  /** Timestamp of the manually recorded solved status, not observed completion. */
  solvedAt: string | null;
}>;

function compareSolvedSources(left: DsaQuestionProgressEvidenceSource, right: DsaQuestionProgressEvidenceSource): number {
  return (left.solvedAt ?? "").localeCompare(right.solvedAt ?? "");
}

/**
 * Converts only currently-solved rows into self-reported DSA practice
 * evidence. The database guarantees one progress row per question, while the
 * deterministic de-duplication here keeps the adapter stable for any caller.
 */
export function dsaQuestionProgressToInterviewEvidence(
  rows: readonly DsaQuestionProgressEvidenceSource[],
): readonly InterviewEvidenceItem[] {
  const solvedByQuestionId = new Map<string, DsaQuestionProgressEvidenceSource>();

  for (const row of rows) {
    if (row.status !== "solved") continue;
    const existing = solvedByQuestionId.get(row.questionId);
    if (!existing || compareSolvedSources(existing, row) < 0) solvedByQuestionId.set(row.questionId, row);
  }

  return [...solvedByQuestionId.values()]
    .sort((left, right) => left.questionId.localeCompare(right.questionId))
    .map((row) => ({
      id: `dsa-question-progress:${row.questionId}:self-reported-solved`,
      area: "algorithmic-coding",
      provenance: "self-report",
      kind: "practice",
      signal: "positive",
      observedAt: row.solvedAt,
      summary: "Self-reported DSA practice marked solved.",
      repeatedError: false,
    }));
}
