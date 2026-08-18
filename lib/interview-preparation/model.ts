import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";

export type PreparationModule = "dsa" | "behavioral" | "system-design" | "company";
export type RoundPreparationKind = "coding" | "system-design" | "behavioral" | "hiring-manager" | "onsite" | "recruiter" | "general";

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

const mapping: Record<RoundPreparationKind, readonly PreparationModule[]> = {
  coding: ["dsa", "company"],
  "system-design": ["system-design", "company"],
  behavioral: ["behavioral", "company"],
  "hiring-manager": ["behavioral", "system-design", "company"],
  onsite: ["dsa", "behavioral", "system-design", "company"],
  recruiter: ["behavioral", "company"],
  general: ["behavioral", "company"],
};

export function preparationKind(roundType: string): RoundPreparationKind {
  const value = roundType.trim().toLowerCase();
  if (/(coding|dsa|machine coding|debug|take-home)/.test(value)) return "coding";
  if (/system design|architecture/.test(value)) return "system-design";
  if (/behavioral|bar raiser/.test(value)) return "behavioral";
  if (/hiring manager/.test(value)) return "hiring-manager";
  if (/onsite/.test(value)) return "onsite";
  if (/recruiter/.test(value)) return "recruiter";
  if (/domain|technical/.test(value)) return "coding";
  return "general";
}

export function modulesForRound(roundType: string) {
  return mapping[preparationKind(roundType)];
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
