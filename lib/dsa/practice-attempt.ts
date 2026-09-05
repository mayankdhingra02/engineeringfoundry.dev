import { canonicalDsaQuestionById, canonicalDsaQuestions } from "@/lib/dsa/catalog";
import type { DsaPracticeAttemptRow, Json } from "@/lib/supabase/database.types";

export const DSA_PRACTICE_CATALOG_VERSION = 1;
export const dsaPracticeModes = ["learn", "recognition", "untimed", "timed", "mixed", "review"] as const;
export const dsaPracticeStatuses = ["draft", "completed", "review"] as const;
export const dsaPriorExposureLevels = ["unseen", "prompt_seen", "solution_seen", "solved_before"] as const;
export const dsaPracticeCheckpoints = ["clarified", "brute_force", "plan_before_code", "implemented", "tested", "complexity"] as const;
export const dsaErrorRecoveryStates = ["not_needed", "recovered", "unresolved"] as const;
export const dsaRubricBands = ["needs_evidence", "developing", "strong"] as const;

export const dsaRubricGroups = [
  { id: "communication", label: "Communication", dimensionIds: ["problem-framing-clarification", "communication", "complexity-analysis"] },
  { id: "problem-solving", label: "Problem solving", dimensionIds: ["problem-recognition", "brute-force-reasoning", "algorithm-data-structure-choice", "transfer-to-unseen"] },
  { id: "technical-implementation", label: "Technical implementation", dimensionIds: ["correctness", "implementation-fluency", "hint-dependence", "error-recovery"] },
  { id: "testing-validation", label: "Testing and validation", dimensionIds: ["testing-edge-cases"] },
] as const;

export const dsaRubricDimensions = [
  ["problem-recognition", "Problem recognition", "Explain the shape and invariant without relying on keywords."],
  ["problem-framing-clarification", "Problem framing and clarification", "Clarify only constraints that can change the solution."],
  ["brute-force-reasoning", "Brute-force reasoning", "Establish a correct baseline and name its limiting cost."],
  ["algorithm-data-structure-choice", "Algorithm and data-structure choice", "Connect the chosen structure to the invariant it preserves."],
  ["correctness", "Correctness", "Maintain the invariant and cover the complete input contract."],
  ["implementation-fluency", "Implementation fluency", "Translate the plan into coherent, repairable code."],
  ["complexity-analysis", "Complexity analysis", "State time and space with the assumptions that make them true."],
  ["testing-edge-cases", "Testing and edge cases", "Test normal, boundary, adversarial, and bug-prone cases."],
  ["communication", "Communication", "Narrate decisions and meaningful state changes without scripting every line."],
  ["hint-dependence", "Hint dependence", "Record what assistance changed the attempt."],
  ["error-recovery", "Error recovery", "Find, explain, and repair mistakes openly."],
  ["transfer-to-unseen", "Transfer to unseen problems", "Distinguish fresh recognition from familiar repetition."],
] as const;

export const dsaPracticeModeDefinitions = [
  { id: "learn", label: "Learn a pattern", description: "Keep the pattern, worked example, and visual trace visible.", labelsHidden: false, evidence: "Learning activity — not readiness evidence", defaultDuration: null, allowedHints: "Worked guidance and checkpoints are available." },
  { id: "recognition", label: "Recognition drill", description: "Hide topic and pattern labels; name clues, anti-clues, and an invariant first.", labelsHidden: true, evidence: "Self-reported recognition practice", defaultDuration: null, allowedHints: "Reveal the recognition prompt only after choosing an approach." },
  { id: "untimed", label: "Untimed solve", description: "Solve independently with optional checkpoints and a reflection after the attempt.", labelsHidden: false, evidence: "Self-reported independent practice", defaultDuration: null, allowedHints: "Optional checkpoints are allowed and recorded." },
  { id: "timed", label: "Timed interview", description: "Practice pacing with an adjustable, pausable timer and explicit permitted references.", labelsHidden: true, evidence: "Self-reported timed rehearsal with exposure provenance", defaultDuration: 45, allowedHints: "No solution material; every hint used is recorded." },
  { id: "mixed", label: "Mixed / unseen set", description: "Work across different pattern families with labels removed and exposure declared.", labelsHidden: true, evidence: "Self-reported transfer practice with exposure provenance", defaultDuration: null, allowedHints: "No pattern labels; checkpoints remain optional and recorded." },
  { id: "review", label: "Review queue", description: "Revisit errors and low-confidence work without a streak or punitive backlog.", labelsHidden: false, evidence: "Review activity — not fresh-transfer evidence", defaultDuration: null, allowedHints: "Prior notes and full lesson links are available." },
] as const;

export type DsaPracticeMode = (typeof dsaPracticeModes)[number];
export type DsaPracticeStatus = (typeof dsaPracticeStatuses)[number];
export type DsaPriorExposure = (typeof dsaPriorExposureLevels)[number];
export type DsaPracticeCheckpoint = (typeof dsaPracticeCheckpoints)[number];
export type DsaErrorRecoveryState = (typeof dsaErrorRecoveryStates)[number];
export type DsaRubricBand = (typeof dsaRubricBands)[number];
export type DsaRubricDimension = (typeof dsaRubricDimensions)[number][0];

export interface DsaPracticeAttemptDocument {
  clarification_notes: string;
  brute_force_notes: string;
  approach_notes: string;
  implementation_notes: string;
  test_notes: string;
  complexity_notes: string;
  reflection: string;
  completed_checkpoints: DsaPracticeCheckpoint[];
  hints_used: number;
  error_recovery: DsaErrorRecoveryState;
  self_review: Partial<Record<DsaRubricDimension, DsaRubricBand>>;
  dimension_evidence: Partial<Record<DsaRubricDimension, string>>;
  follow_up: string;
}

export type DsaPracticeAttempt = Omit<DsaPracticeAttemptRow, "document"> & { document: DsaPracticeAttemptDocument };

const documentKeys = ["clarification_notes", "brute_force_notes", "approach_notes", "implementation_notes", "test_notes", "complexity_notes", "reflection", "completed_checkpoints", "hints_used", "error_recovery", "self_review", "dimension_evidence", "follow_up"] as const;
const checkpointSet = new Set<string>(dsaPracticeCheckpoints);
const dimensionSet = new Set<string>(dsaRubricDimensions.map(([id]) => id));
const bandSet = new Set<string>(dsaRubricBands);
const plainRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const bounded = (value: unknown, maximum: number): value is string => typeof value === "string" && Array.from(value).length <= maximum && !value.includes("\0");

export function emptyDsaPracticeAttemptDocument(): DsaPracticeAttemptDocument {
  return { clarification_notes: "", brute_force_notes: "", approach_notes: "", implementation_notes: "", test_notes: "", complexity_notes: "", reflection: "", completed_checkpoints: [], hints_used: 0, error_recovery: "not_needed", self_review: {}, dimension_evidence: {}, follow_up: "" };
}

export function validateDsaPracticeAttemptDocument(value: unknown): DsaPracticeAttemptDocument | null {
  if (!plainRecord(value) || Object.keys(value).length !== documentKeys.length || documentKeys.some((key) => !Object.hasOwn(value, key))) return null;
  for (const field of ["clarification_notes", "brute_force_notes", "approach_notes", "implementation_notes", "test_notes", "complexity_notes", "reflection", "follow_up"] as const) {
    if (!bounded(value[field], field === "implementation_notes" ? 30_000 : 8_000)) return null;
  }
  if (!Array.isArray(value.completed_checkpoints) || value.completed_checkpoints.length > dsaPracticeCheckpoints.length || value.completed_checkpoints.some((item) => typeof item !== "string" || !checkpointSet.has(item)) || new Set(value.completed_checkpoints).size !== value.completed_checkpoints.length) return null;
  if (!Number.isSafeInteger(value.hints_used) || (value.hints_used as number) < 0 || (value.hints_used as number) > 20) return null;
  if (typeof value.error_recovery !== "string" || !dsaErrorRecoveryStates.includes(value.error_recovery as DsaErrorRecoveryState)) return null;
  if (!plainRecord(value.self_review) || !plainRecord(value.dimension_evidence)) return null;
  if (Object.entries(value.self_review).some(([id, band]) => !dimensionSet.has(id) || typeof band !== "string" || !bandSet.has(band))) return null;
  if (Object.entries(value.dimension_evidence).some(([id, evidence]) => !dimensionSet.has(id) || !bounded(evidence, 4_000))) return null;
  const document = { ...value, completed_checkpoints: [...value.completed_checkpoints], self_review: { ...value.self_review }, dimension_evidence: { ...value.dimension_evidence } } as DsaPracticeAttemptDocument;
  return JSON.stringify(document).length <= 120_000 ? document : null;
}

export function asDsaPracticeAttempt(row: DsaPracticeAttemptRow): DsaPracticeAttempt | null {
  const document = validateDsaPracticeAttemptDocument(row.document);
  return document ? { ...row, document } : null;
}

export function dsaPracticeAttemptDocumentToJson(document: DsaPracticeAttemptDocument): Json {
  return document as unknown as Json;
}

export function buildMixedPracticeSet(exposureByQuestionId: Readonly<Record<string, DsaPriorExposure>>, count = 3) {
  const ordered = canonicalDsaQuestions.filter((question) => question.inQuestionBrowser).sort((left, right) => {
    const leftSeen = exposureByQuestionId[left.id] === "unseen" || exposureByQuestionId[left.id] === undefined ? 0 : 1;
    const rightSeen = exposureByQuestionId[right.id] === "unseen" || exposureByQuestionId[right.id] === undefined ? 0 : 1;
    return leftSeen - rightSeen || left.id.localeCompare(right.id);
  });
  const chosen: typeof ordered = [];
  const patterns = new Set<string>();
  for (const question of ordered) {
    const primary = question.patterns[0] ?? question.topics[0] ?? question.id;
    if (patterns.has(primary)) continue;
    chosen.push(question); patterns.add(primary);
    if (chosen.length === count) break;
  }
  return chosen;
}

export function inferPriorExposure(questionId: string, practicedQuestionIds: ReadonlySet<string>): DsaPriorExposure {
  return canonicalDsaQuestionById.has(questionId) && practicedQuestionIds.has(questionId) ? "prompt_seen" : "unseen";
}
