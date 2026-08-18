import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";
import {
  resolveRoundExecution,
  type InterviewRoundModality,
  type InterviewRoundSignal,
  type InterviewRoundStage,
  type RoundExecutionCompositionShell,
  type RoundExecutionGuideSlug,
  type RoundExecutionResolutionConfidence,
} from "../interview-playbook/round-execution.ts";

export type PreparationModule = "dsa" | "behavioral" | "system-design" | "company";

export type ChecklistTemplate = { id: string; label: string; module: PreparationModule | "logistics" };

const moduleTemplates: Record<PreparationModule, readonly ChecklistTemplate[]> = {
  dsa: [
    { id: "dsa-review-queue", label: "Rework the highest-priority review question", module: "dsa" },
    { id: "dsa-company-set", label: "Complete one company-relevant question", module: "dsa" },
    { id: "dsa-explain", label: "Explain one solution and its trade-offs aloud", module: "dsa" },
  ],
  behavioral: [
    { id: "behavioral-story-set", label: "Choose the stories you can tell cleanly", module: "behavioral" },
    { id: "behavioral-gaps", label: "Cover one unanswered question theme", module: "behavioral" },
    { id: "behavioral-questions", label: "Prepare questions for the interviewer", module: "behavioral" },
  ],
  "system-design": [
    { id: "system-design-attempt", label: "Review one saved design attempt", module: "system-design" },
    { id: "system-design-concepts", label: "Revisit the weakest core concepts", module: "system-design" },
    { id: "system-design-narrate", label: "Rehearse the interview framework aloud", module: "system-design" },
  ],
  company: [
    { id: "company-research", label: "Review reliable company interview context", module: "company" },
  ],
};

const logistics: readonly ChecklistTemplate[] = [
  { id: "logistics-confirm", label: "Confirm time, timezone, location, and link", module: "logistics" },
  { id: "logistics-environment", label: "Prepare your interview environment", module: "logistics" },
];

/**
 * Cross-application context for a single round, resolved once from the
 * canonical taxonomy in `lib/interview-playbook/round-execution.ts`. This is
 * the sole source of truth for which specialist learning modules apply and
 * which public execution guides to link — no separate regex-based mapping.
 */
export type RoundPreparationContext = Readonly<{
  stage: InterviewRoundStage;
  modality: InterviewRoundModality;
  signals: readonly InterviewRoundSignal[];
  guideSlugs: readonly RoundExecutionGuideSlug[];
  executionGuideSlugs: readonly RoundExecutionGuideSlug[];
  shell: RoundExecutionCompositionShell;
  confidence: RoundExecutionResolutionConfidence;
  modules: readonly PreparationModule[];
  needsSignalClarification: boolean;
  clarificationPrompt: string | null;
}>;

/** Stable module order; only these three signals map to an existing specialist module. */
const MODULE_ORDER: readonly PreparationModule[] = ["dsa", "behavioral", "system-design", "company"];

export function resolveRoundPreparationContext(roundType: string): RoundPreparationContext {
  const resolution = resolveRoundExecution(roundType);

  const applicableModules = new Set<PreparationModule>(["company"]);
  if (resolution.signals.includes("algorithmic-coding")) applicableModules.add("dsa");
  if (resolution.signals.includes("behavioral")) applicableModules.add("behavioral");
  if (resolution.signals.includes("system-design")) applicableModules.add("system-design");
  const modules = MODULE_ORDER.filter((module) => applicableModules.has(module));

  const executionGuideSlugs: RoundExecutionGuideSlug[] = [];
  if (resolution.shell === "technical-screen") executionGuideSlugs.push("technical-screen");
  for (const slug of resolution.guideSlugs) {
    if (!executionGuideSlugs.includes(slug)) executionGuideSlugs.push(slug);
  }

  return {
    stage: resolution.stage,
    modality: resolution.modality,
    signals: resolution.signals,
    guideSlugs: resolution.guideSlugs,
    executionGuideSlugs,
    shell: resolution.shell,
    confidence: resolution.confidence,
    modules,
    needsSignalClarification: resolution.needsSignalClarification,
    clarificationPrompt: resolution.clarificationPrompt,
  };
}

export function modulesForRound(roundType: string) {
  return resolveRoundPreparationContext(roundType).modules;
}

export function checklistForRound(roundType: string): ChecklistTemplate[] {
  return [...logistics, ...modulesForRound(roundType).flatMap((module) => moduleTemplates[module])];
}

export const ALL_CHECKLIST_IDS = [...logistics, ...Object.values(moduleTemplates).flat()].map((item) => item.id);

export function roadmapLevelForRole(roleLevel: string | null): RoadmapLevel {
  const value = roleLevel?.toLowerCase() ?? "";
  if (/staff|principal|senior|iii|3/.test(value)) return "sde3plus";
  if (/ii|2/.test(value)) return "sde2";
  return "sde1";
}

const companyAliases: Record<string, string> = {
  "google-cloud": "google",
  "meta-platforms": "meta",
  facebook: "meta",
  microsoft: "microsoft",
};

export function resolvePreparationCompanySlug(slug: string | null) {
  if (!slug) return null;
  return companyAliases[slug] ?? slug;
}

export function calmTimeUntil(value: string | null, now = new Date()) {
  if (!value) return "Date not scheduled";
  const milliseconds = new Date(value).getTime() - now.getTime();
  const days = Math.ceil(milliseconds / 86_400_000);
  if (days < 0) return "Interview date passed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  const weeks = Math.ceil(days / 7);
  return `In ${weeks} weeks`;
}
