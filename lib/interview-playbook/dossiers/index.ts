/**
 * Round-execution dossier registry.
 *
 * Assembles every authored dossier (one file per guide, under this
 * directory) into the catalog, lookup map, and published filter consumed by
 * the rest of the app. Adding a dossier means adding one file plus one entry
 * here — never editing an unrelated guide's content.
 *
 * Pure and dependency-light: no React, Next.js, Supabase, auth, database,
 * current time, or randomness.
 */
import type { RoundExecutionGuideSlug } from "../round-execution.ts";
import type { RoundExecutionDossier } from "./schema.ts";
import { algorithmicCodingDossier } from "./algorithmic-coding.ts";
import { practicalCodingDossier } from "./practical-coding.ts";
import { debuggingDossier } from "./debugging.ts";
import { codeReviewDossier } from "./code-review.ts";
import { lowLevelDesignDossier } from "./low-level-design.ts";
import { systemDesignDossier } from "./system-design.ts";
import { mlSystemDesignDossier } from "./ml-system-design.ts";
import { behavioralDossier } from "./behavioral.ts";
import { projectDeepDiveDossier } from "./project-deep-dive.ts";

export type {
  RoundExecutionContentClassification,
  RoundExecutionDossierFlowStep,
  RoundExecutionTimePhase,
  RoundExecutionTimeFramework,
  RoundExecutionCommunicationPattern,
  RoundExecutionRecoveryScenario,
  RoundExecutionFailureMode,
  RoundExecutionSeniorityCalibration,
  RoundExecutionInteractionExample,
  RoundExecutionDossier,
} from "./schema.ts";

export {
  algorithmicCodingDossier,
  practicalCodingDossier,
  debuggingDossier,
  codeReviewDossier,
  lowLevelDesignDossier,
  systemDesignDossier,
  mlSystemDesignDossier,
  behavioralDossier,
  projectDeepDiveDossier,
};

export const ROUND_EXECUTION_DOSSIERS: readonly RoundExecutionDossier[] = [
  algorithmicCodingDossier,
  practicalCodingDossier,
  debuggingDossier,
  codeReviewDossier,
  lowLevelDesignDossier,
  systemDesignDossier,
  mlSystemDesignDossier,
  behavioralDossier,
  projectDeepDiveDossier,
];

export const ROUND_EXECUTION_DOSSIER_BY_SLUG: ReadonlyMap<RoundExecutionGuideSlug, RoundExecutionDossier> = new Map(
  ROUND_EXECUTION_DOSSIERS.map((dossier) => [dossier.slug, dossier]),
);

export const PUBLISHED_ROUND_EXECUTION_DOSSIERS: readonly RoundExecutionDossier[] = ROUND_EXECUTION_DOSSIERS.filter(
  (dossier) => dossier.status === "published",
);

export function getRoundExecutionDossier(slug: string): RoundExecutionDossier | null {
  return ROUND_EXECUTION_DOSSIER_BY_SLUG.get(slug as RoundExecutionGuideSlug) ?? null;
}
