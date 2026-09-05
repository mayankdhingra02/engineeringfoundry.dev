import type {
  BehavioralFollowUpFamily,
  BehavioralQuestion,
  BehavioralQuestionLevel,
  BehavioralScope,
} from "@/types";

type RawBehavioralQuestion = Omit<
  BehavioralQuestion,
  | "safeVariants"
  | "levelRelevance"
  | "roleRelevance"
  | "followUpFamilies"
  | "companyModifierSourceIds"
  | "privacyWarning"
  | "editorialReviewDate"
>;

export const behavioralCatalogAudit = {
  version: "2026-09-05",
  reviewedAt: "2026-09-05",
  expectedQuestionCount: 48,
  method: "Preserved every existing ID and canonical prompt; checked stable slugs, taxonomy coverage, distinct evidence targets, follow-up intent, role and level applicability, and privacy boundaries.",
  duplicateDecision: "No prompt was removed as a superficial duplicate. Similar prompts remain only where they inspect a different evidence target, such as conflict versus influence or failure versus feedback.",
} as const;

const everyEngineeringLevel: BehavioralQuestionLevel[] = ["Entry", "Mid", "Senior", "Staff+"];

const baselineFamilies: BehavioralFollowUpFamily[] = [
  "clarification-timeline",
  "personal-ownership",
  "measurement-evidence",
  "cross-answer-consistency",
  "confidentiality",
];

const categoryFamilies: Record<string, BehavioralFollowUpFamily[]> = {
  Leadership: ["stakeholders-disagreement", "scale-durability", "level-scope"],
  Ownership: ["information-at-the-time", "causality-limits", "risk-failure-mode"],
  Collaboration: ["stakeholders-disagreement", "personal-ownership", "learning-later-behavior"],
  "Conflict & Influence": ["stakeholders-disagreement", "alternatives", "counterfactual"],
  Ambiguity: ["information-at-the-time", "alternatives", "counterfactual"],
  "Failure & Growth": ["risk-failure-mode", "learning-later-behavior", "causality-limits"],
  "Execution & Prioritization": ["alternatives", "information-at-the-time", "risk-failure-mode"],
  Mentorship: ["personal-ownership", "measurement-evidence", "scale-durability"],
  "Technical Judgment": ["technical-detail", "alternatives", "risk-failure-mode"],
  "Customer Impact": ["measurement-evidence", "causality-limits", "stakeholders-disagreement"],
  "Cross-functional Work": ["stakeholders-disagreement", "alternatives", "level-scope"],
  "Incident & Quality": ["technical-detail", "risk-failure-mode", "learning-later-behavior"],
  Communication: ["clarification-timeline", "personal-ownership", "level-scope"],
  Learning: ["learning-later-behavior", "counterfactual", "scale-durability"],
};

function roleRelevance(scope: BehavioralScope[]) {
  const roles = ["Software engineering", "Individual contributor"];
  if (scope.includes("Leadership")) roles.push("Technical leadership without requiring people management");
  if (scope.includes("Cross-functional")) roles.push("Cross-functional engineering");
  return roles;
}

function uniqueFamilies(question: RawBehavioralQuestion) {
  return [...new Set([...baselineFamilies, ...(categoryFamilies[question.category] ?? [])])];
}

export function applyBehavioralCatalogAudit(questions: RawBehavioralQuestion[]): BehavioralQuestion[] {
  return questions.map((question) => ({
    ...question,
    safeVariants: [],
    levelRelevance: [...everyEngineeringLevel],
    roleRelevance: roleRelevance(question.scope),
    followUpFamilies: uniqueFamilies(question),
    companyModifierSourceIds: [],
    privacyWarning: "Use generic names and only facts, metrics, and system details you are allowed to disclose.",
    editorialReviewDate: behavioralCatalogAudit.reviewedAt,
  }));
}
