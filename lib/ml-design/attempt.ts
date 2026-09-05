import { activeMlDesignProblems } from "@/data/ml-design";
import type { Json, MlDesignAttemptRow } from "@/lib/supabase/database.types";

export const ML_DESIGN_PROBLEM_VERSION = 1;
export const mlDesignAttemptModes = ["guided", "untimed", "timed"] as const;
export const mlDesignAttemptStatuses = ["draft", "practiced", "review"] as const;
export const mlDesignAttemptDurations = [30, 45, 60] as const;
export const mlDesignDecideSections = ["define", "establish", "construct", "integrate", "derisk", "evolve"] as const;
export const mlDesignRubricDimensions = [
  ["problem-framing", "Problem framing"],
  ["data-and-labels", "Data and labels"],
  ["metrics", "Metrics"],
  ["architecture", "Architecture"],
  ["ml-judgment", "ML judgment"],
  ["production-engineering", "Production engineering"],
  ["experimentation", "Experimentation"],
  ["reliability-and-evolution", "Reliability and evolution"],
  ["risk-and-responsibility", "Risk and responsibility"],
  ["communication", "Communication"],
] as const;
export const mlDesignRubricBands = ["Needs development", "Acceptable", "Strong", "Exceptional"] as const;

export type MlDesignAttemptMode = (typeof mlDesignAttemptModes)[number];
export type MlDesignAttemptStatus = (typeof mlDesignAttemptStatuses)[number];
export type MlDesignAttemptDuration = (typeof mlDesignAttemptDurations)[number];
export type MlDesignDecideSection = (typeof mlDesignDecideSections)[number];
export type MlDesignRubricDimension = (typeof mlDesignRubricDimensions)[number][0];
export type MlDesignRubricBand = (typeof mlDesignRubricBands)[number];

export interface MlDesignAttemptDocument {
  assumptions: string;
  design_notes: string;
  completed_decide_sections: MlDesignDecideSection[];
  hints_used: number;
  self_review: Partial<Record<MlDesignRubricDimension, MlDesignRubricBand>>;
  dimension_evidence: Partial<Record<MlDesignRubricDimension, string>>;
  follow_up_actions: string[];
  fresh_exposure: boolean;
}

export type MlDesignAttempt = Omit<MlDesignAttemptRow, "document"> & { document: MlDesignAttemptDocument };
export const canonicalMlDesignProblemSlugs = new Set(activeMlDesignProblems.map((problem) => problem.slug));

const documentKeys = [
  "assumptions",
  "design_notes",
  "completed_decide_sections",
  "hints_used",
  "self_review",
  "dimension_evidence",
  "follow_up_actions",
  "fresh_exposure",
] as const;
const decideSectionSet = new Set<string>(mlDesignDecideSections);
const rubricDimensionSet = new Set<string>(mlDesignRubricDimensions.map(([id]) => id));
const rubricBandSet = new Set<string>(mlDesignRubricBands);
const plainRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const boundedString = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;

export function emptyMlDesignAttemptDocument(freshExposure: boolean): MlDesignAttemptDocument {
  return {
    assumptions: "",
    design_notes: "",
    completed_decide_sections: [],
    hints_used: 0,
    self_review: {},
    dimension_evidence: {},
    follow_up_actions: [],
    fresh_exposure: freshExposure,
  };
}

export function validateMlDesignAttemptDocument(value: unknown): MlDesignAttemptDocument | null {
  if (!plainRecord(value) || !exactKeys(value, documentKeys)) return null;
  if (!boundedString(value.assumptions, 16_000) || !boundedString(value.design_notes, 50_000)) return null;
  if (!Array.isArray(value.completed_decide_sections) || value.completed_decide_sections.length > 6) return null;
  if (value.completed_decide_sections.some((item) => typeof item !== "string" || !decideSectionSet.has(item))) return null;
  if (new Set(value.completed_decide_sections).size !== value.completed_decide_sections.length) return null;
  if (!Number.isSafeInteger(value.hints_used) || (value.hints_used as number) < 0 || (value.hints_used as number) > 6) return null;
  if (!plainRecord(value.self_review) || !plainRecord(value.dimension_evidence)) return null;
  const selfReview = value.self_review;
  const dimensionEvidence = value.dimension_evidence;
  if (Object.keys(selfReview).some((key) => !rubricDimensionSet.has(key) || !rubricBandSet.has(selfReview[key] as string))) return null;
  if (Object.keys(dimensionEvidence).some((key) => !rubricDimensionSet.has(key) || !boundedString(dimensionEvidence[key], 5_000))) return null;
  if (!Array.isArray(value.follow_up_actions) || value.follow_up_actions.length > 20 || value.follow_up_actions.some((item) => !boundedString(item, 1_000))) return null;
  if (typeof value.fresh_exposure !== "boolean") return null;

  const document = {
    assumptions: value.assumptions,
    design_notes: value.design_notes,
    completed_decide_sections: [...value.completed_decide_sections] as MlDesignDecideSection[],
    hints_used: value.hints_used as number,
    self_review: { ...selfReview } as MlDesignAttemptDocument["self_review"],
    dimension_evidence: { ...dimensionEvidence } as MlDesignAttemptDocument["dimension_evidence"],
    follow_up_actions: value.follow_up_actions.map((item) => String(item)),
    fresh_exposure: value.fresh_exposure,
  };
  return JSON.stringify(document).length <= 200_000 ? document : null;
}

export function asMlDesignAttempt(row: MlDesignAttemptRow): MlDesignAttempt | null {
  const document = validateMlDesignAttemptDocument(row.document);
  return document ? { ...row, document } : null;
}

export function mlDesignAttemptDocumentToJson(document: MlDesignAttemptDocument): Json {
  return document as unknown as Json;
}
