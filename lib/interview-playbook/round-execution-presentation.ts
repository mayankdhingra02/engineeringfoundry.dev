/**
 * Public presentation layer over the canonical round-execution taxonomy:
 * stable v1 groupings, a universal (non-prescriptive) execution sequence,
 * and small formatting helpers. This file adds no new classification logic
 * and duplicates no catalog content — it only arranges and labels what
 * `round-execution.ts` already resolved.
 *
 * Pure and dependency-light: no React, Next.js, Supabase, auth, database,
 * current time, or randomness.
 */
import {
  ROUND_EXECUTION_GUIDES,
  ROUND_EXECUTION_GUIDE_BY_SLUG,
  type RoundExecutionGuideSlug,
  type RoundExecutionGuideSummary,
  type RoundExecutionGuideTreatment,
} from "./round-execution.ts";

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export type RoundExecutionGuideGroupId = "process-assessment" | "coding-practical" | "design" | "people-collaboration";

export type RoundExecutionGuideGroup = Readonly<{
  id: RoundExecutionGuideGroupId;
  title: string;
  description: string;
  slugs: readonly RoundExecutionGuideSlug[];
}>;

export const ROUND_EXECUTION_GUIDE_GROUPS: readonly RoundExecutionGuideGroup[] = [
  {
    id: "process-assessment",
    title: "Process and assessment formats",
    description: "Understand the delivery format and confirm the evaluated signal before applying a round-specific execution plan.",
    slugs: ["recruiter-screen", "online-assessment", "take-home", "technical-screen"],
  },
  {
    id: "coding-practical",
    title: "Coding and practical engineering",
    description: "Make problem solving, implementation, diagnosis, review judgment, and validation observable under interview conditions.",
    slugs: ["algorithmic-coding", "practical-coding", "debugging", "code-review"],
  },
  {
    id: "design",
    title: "Design interviews",
    description: "Clarify scope, build a coherent design, trace important flows, deepen selected decisions, and explain trade-offs.",
    slugs: ["low-level-design", "system-design", "ml-system-design"],
  },
  {
    id: "people-collaboration",
    title: "People, projects, and collaboration",
    description: "Make ownership, judgment, technical depth, stakeholder communication, and follow-up reasoning concrete.",
    slugs: ["behavioral", "project-deep-dive", "hiring-manager", "cross-functional"],
  },
];

// ---------------------------------------------------------------------------
// Universal execution framework
// ---------------------------------------------------------------------------

export type RoundExecutionFrameworkStepId = "orient" | "clarify" | "structure" | "execute" | "validate" | "close";

export type RoundExecutionFrameworkStep = Readonly<{
  id: RoundExecutionFrameworkStepId;
  label: string;
  description: string;
}>;

/** A flexible sequence, not a mandatory script or universal timer. No step carries a minute allocation. */
export const ROUND_EXECUTION_FRAMEWORK_STEPS: readonly RoundExecutionFrameworkStep[] = [
  {
    id: "orient",
    label: "Orient",
    description: "Confirm the prompt, agenda, and any material difference between the invitation and the round that is beginning.",
  },
  {
    id: "clarify",
    label: "Clarify",
    description: "Ask only questions that can change scope, constraints, expected output, tools, or the evidence the interviewer needs.",
  },
  {
    id: "structure",
    label: "Structure",
    description: "State the intended approach or response shape at the level appropriate to the round before expanding into detail.",
  },
  {
    id: "execute",
    label: "Execute",
    description: "Work while making consequential reasoning observable without narrating every action, keystroke, or thought.",
  },
  {
    id: "validate",
    label: "Validate",
    description: "Test, trace, review assumptions, or summarize evidence using the validation method appropriate to the round.",
  },
  {
    id: "close",
    label: "Close",
    description: "State what is complete, what remains, and the next concrete step for any unfinished risk or follow-up.",
  },
];

// ---------------------------------------------------------------------------
// V1 / later partitions
// ---------------------------------------------------------------------------

export const V1_ROUND_EXECUTION_GUIDES: readonly RoundExecutionGuideSummary[] = ROUND_EXECUTION_GUIDES.filter((guide) => guide.v1);

export const LATER_ROUND_EXECUTION_GUIDES: readonly RoundExecutionGuideSummary[] = ROUND_EXECUTION_GUIDES.filter((guide) => !guide.v1);

/**
 * Possible underlying signal guides for a technical-screen shell. This is a
 * navigation list, not a claim that any given screen covers all — or any
 * specific one — of these signals.
 */
export const TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES: readonly RoundExecutionGuideSlug[] = [
  "algorithmic-coding",
  "practical-coding",
  "debugging",
  "code-review",
  "low-level-design",
  "system-design",
  "ml-system-design",
  "behavioral",
  "project-deep-dive",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getRoundExecutionGuide(slug: string): RoundExecutionGuideSummary | null {
  return ROUND_EXECUTION_GUIDE_BY_SLUG.get(slug as RoundExecutionGuideSlug) ?? null;
}

export function roundExecutionGuideHref(slug: RoundExecutionGuideSlug): string {
  return `/interview-tips/rounds/${slug}`;
}

const TREATMENT_LABELS: Readonly<Record<RoundExecutionGuideTreatment, string>> = {
  complete: "Core execution guide",
  "focused-variant": "Focused variant",
  "composition-shell": "Composition shell",
  later: "Later",
};

export function roundExecutionTreatmentLabel(treatment: RoundExecutionGuideTreatment): string {
  return TREATMENT_LABELS[treatment];
}

const RELATED_LINK_LABELS: Readonly<Record<string, string>> = {
  "/applications": "Application tracker",
  "/companies": "Company interview guides",
  "/behavioral": "Behavioral interview preparation",
  "/behavioral/workspace": "Behavioral workspace",
  "/dsa": "DSA roadmap and concepts",
  "/dsa/practice": "DSA practice",
  "/mock-interviews": "Mock interview lab",
  "/system-design/start-here/introduction": "System Design concepts",
  "/system-design/practice": "System Design practice",
  "/ml-design": "ML System Design",
};

export function roundExecutionRelatedLinkLabel(href: string): string {
  return RELATED_LINK_LABELS[href] ?? "Engineering Foundry resource";
}
