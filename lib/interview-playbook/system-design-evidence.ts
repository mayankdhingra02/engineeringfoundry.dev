/**
 * Pure, provenance-safe projection of System Design's manual progress
 * tracker. The workspace deliberately stores a private notebook, not an
 * evaluator: there is no judge, rubric, test runner, human review, or AI
 * assessment behind these rows. Consequently this adapter emits only
 * self-report and never reads attempt documents, notes, bookmarks, or
 * confidence.
 *
 * A `comfortable` status is an explicit positive self-assessment; `review`
 * is an explicit self-assessment that the item needs attention. `reviewed`
 * is curriculum activity, not a competence claim, and `not_started` says
 * nothing about interview performance, so neither becomes evidence.
 */
import type { InterviewEvidenceItem } from "./evidence.ts";

export const SYSTEM_DESIGN_PROGRESS_STATUSES = ["not_started", "reviewed", "review", "comfortable"] as const;
export type SystemDesignProgressStatus = (typeof SYSTEM_DESIGN_PROGRESS_STATUSES)[number];

/**
 * These are canonical System Design workspace problems whose subject is ML
 * system design. They are intentionally excluded rather than being promoted
 * to the normal System Design preparation area. This phase does not project
 * any System Design source into `ml-system-design`.
 */
export const SYSTEM_DESIGN_ML_PROBLEM_IDS = new Set(["ml-inference-service", "feature-store", "vector-search"]);

/** The minimal, privacy-safe shape loaded by the server-side boundary. */
export type SystemDesignProgressEvidenceSource = Readonly<{
  itemId: string;
  itemType: "concept" | "design_problem";
  status: SystemDesignProgressStatus;
  /** Timestamp of the manual status update, never an observed evaluation. */
  updatedAt: string;
}>;

function compareProgressSources(left: SystemDesignProgressEvidenceSource, right: SystemDesignProgressEvidenceSource): number {
  return left.updatedAt.localeCompare(right.updatedAt);
}

function evidenceForProgress(row: SystemDesignProgressEvidenceSource): InterviewEvidenceItem | null {
  // Concepts are curriculum items. Even an explicit status is too easily
  // confused with lesson completion, so this adapter keeps them outside of
  // performance evidence altogether.
  if (row.itemType !== "design_problem") return null;
  if (SYSTEM_DESIGN_ML_PROBLEM_IDS.has(row.itemId)) return null;
  if (row.status !== "comfortable" && row.status !== "review") return null;

  const positive = row.status === "comfortable";
  return {
    id: `system-design-item-progress:${row.itemType}:${row.itemId}:self-reported-${row.status}`,
    area: "system-design",
    provenance: "self-report",
    kind: "practice",
    signal: positive ? "positive" : "negative",
    observedAt: row.updatedAt,
    summary: positive
      ? "Self-reported System Design problem progress marked comfortable."
      : "Self-reported System Design problem progress marked needs review.",
    repeatedError: false,
  };
}

/**
 * Converts only explicit manual design-problem self-assessments. The source
 * table is unique per item; deterministic deduplication still protects this
 * boundary for arbitrary callers and makes output independent of input order.
 */
export function systemDesignProgressToInterviewEvidence(
  rows: readonly SystemDesignProgressEvidenceSource[],
): readonly InterviewEvidenceItem[] {
  const latestByItem = new Map<string, SystemDesignProgressEvidenceSource>();
  for (const row of rows) {
    const key = `${row.itemType}:${row.itemId}`;
    const existing = latestByItem.get(key);
    if (!existing || compareProgressSources(existing, row) < 0) latestByItem.set(key, row);
  }

  return [...latestByItem.values()]
    .sort((left, right) => `${left.itemType}:${left.itemId}`.localeCompare(`${right.itemType}:${right.itemId}`))
    .map(evidenceForProgress)
    .filter((item): item is InterviewEvidenceItem => item !== null);
}
