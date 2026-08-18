/**
 * Canonical round-execution dossier schema.
 *
 * A dossier is the deeper reference behind a v1 execution guide's compact
 * quick reference. This file defines the reusable schema once; authored
 * dossier content lives in sibling files under this directory, and
 * `lib/interview-playbook/dossiers/index.ts` assembles the registry.
 *
 * Pure and dependency-light: no React, Next.js, Supabase, auth, database,
 * current time, or randomness.
 */
import type { RoundExecutionGuideSlug } from "../round-execution.ts";

/** Editorial classification of a content unit — never an evidence probability. */
export type RoundExecutionContentClassification = "widely-applicable" | "context-dependent" | "illustrative";

export type RoundExecutionDossierFlowStep = Readonly<{
  id: string;
  title: string;
  objective: string;
  actions: readonly string[];
  classification: "widely-applicable" | "context-dependent";
}>;

export type RoundExecutionTimePhase = Readonly<{
  label: string;
  range: string;
  objective: string;
  adjustment: string;
}>;

export type RoundExecutionTimeFramework = Readonly<{
  label: string;
  assumption: string;
  phases: readonly RoundExecutionTimePhase[];
  classification: "context-dependent";
}>;

export type RoundExecutionCommunicationPattern = Readonly<{
  title: string;
  productive: string;
  avoid: string;
}>;

export type RoundExecutionRecoveryScenario = Readonly<{
  situation: string;
  response: string;
  avoid: string;
}>;

export type RoundExecutionFailureMode = Readonly<{
  failure: string;
  correction: string;
}>;

export type RoundExecutionSeniorityCalibration = Readonly<{
  level: "SDE I / entry level" | "SDE II / mid level" | "Senior+";
  emphasis: string;
  strongSignals: readonly string[];
  avoid: readonly string[];
}>;

export type RoundExecutionInteractionExample = Readonly<{
  id: string;
  title: string;
  scenario: string;
  weak: string;
  strong: string;
  annotation: string;
  classification: "illustrative";
}>;

export type RoundExecutionDossier = Readonly<{
  slug: RoundExecutionGuideSlug;
  status: "published" | "draft";
  lastReviewed: string;
  title: string;
  purpose: string;
  intendedEvaluation: readonly string[];
  companyVariation: readonly string[];
  beforeRound: readonly string[];
  flow: readonly RoundExecutionDossierFlowStep[];
  timeFrameworks: readonly RoundExecutionTimeFramework[];
  communication: readonly RoundExecutionCommunicationPattern[];
  recovery: readonly RoundExecutionRecoveryScenario[];
  validation: readonly string[];
  closing: readonly string[];
  questionsToAsk: readonly string[];
  signals: Readonly<{
    strong: readonly string[];
    concern: readonly string[];
  }>;
  failureModes: readonly RoundExecutionFailureMode[];
  seniority: readonly RoundExecutionSeniorityCalibration[];
  environment: Readonly<{
    remote: readonly string[];
    onsite: readonly string[];
    accessibility: readonly string[];
  }>;
  companyModifierRules: readonly string[];
  interactions: readonly RoundExecutionInteractionExample[];
  integrity: readonly string[];
}>;
