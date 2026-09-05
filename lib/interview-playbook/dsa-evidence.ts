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

export type DsaPracticeAttemptEvidenceSource = Readonly<{
  id: string;
  questionId: string;
  status: "draft" | "completed" | "review";
  mode: "learn" | "recognition" | "untimed" | "timed" | "mixed" | "review";
  priorExposure: "unseen" | "prompt_seen" | "solution_seen" | "solved_before";
  completedAt: string | null;
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

/**
 * Structured attempts remain self-report because Engineering Foundry does not
 * execute or judge code. Mode and prior exposure are preserved in the stable
 * evidence identity and summary so fresh transfer never collapses into a
 * familiar completion. Learn/draft records produce no performance signal.
 */
export function dsaPracticeAttemptsToInterviewEvidence(rows: readonly DsaPracticeAttemptEvidenceSource[]): readonly InterviewEvidenceItem[] {
  return [...rows]
    .filter((row) => row.status !== "draft" && row.mode !== "learn")
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((row) => {
      const fresh = row.priorExposure === "unseen";
      const transfer = row.mode === "mixed";
      const timed = row.mode === "timed";
      const signal = row.status === "review" ? "mixed" : "positive";
      const evidenceClass = transfer ? "mixed-set transfer" : timed ? "timed rehearsal" : `${row.mode} practice`;
      return {
        id: `dsa-practice-attempt:${row.id}:${row.mode}:${row.priorExposure}`,
        area: "algorithmic-coding",
        provenance: "self-report",
        kind: "practice",
        signal,
        observedAt: row.completedAt,
        summary: `Self-reported ${fresh ? "fresh" : "familiar"} ${evidenceClass}.`,
        repeatedError: false,
      } satisfies InterviewEvidenceItem;
    });
}
