import type { DesignRoadmapStage, MlDesignConcept, MlDesignProblem } from "@/types";
import conceptsData from "./concepts.json";
import problemsData from "./problems.json";
import roadmapData from "./roadmap.json";
import { mlDesignLegacyProblemSlugs } from "@/lib/ml-design-routes";

export { mlDesignLegacyProblemSlugs } from "@/lib/ml-design-routes";

export const mlDesignDomains = ["Recommendation", "Ranking", "Risk", "Trust & Safety", "Search", "NLP", "Generative AI", "Advertising", "Prediction", "Forecasting", "ML Infrastructure"] as const;
export const mlDesignRoadmap = roadmapData as DesignRoadmapStage[];
export const mlDesignConcepts = conceptsData as MlDesignConcept[];
export const mlDesignProblems = problemsData as MlDesignProblem[];

export function selectActiveMlDesignProblems<T extends { status: string }>(problems: readonly T[]): T[] {
  return problems.filter((problem) => problem.status === "active");
}

export const activeMlDesignProblems = selectActiveMlDesignProblems(mlDesignProblems);

export function getMlDesignProblem(slug: string) {
  return activeMlDesignProblems.find((problem) => problem.slug === slug);
}

export function getMlDesignProblemById(id: string) {
  return activeMlDesignProblems.find((problem) => problem.id === id);
}

export function getMlDesignConcept(slug: string) {
  return mlDesignConcepts.find((concept) => concept.slug === slug);
}

export function getMlDesignConceptById(id: string) {
  return mlDesignConcepts.find((concept) => concept.id === id);
}

export function getMlDesignLegacyProblem(slug: string) {
  const canonicalSlug = mlDesignLegacyProblemSlugs[slug as keyof typeof mlDesignLegacyProblemSlugs];
  return canonicalSlug ? getMlDesignProblem(canonicalSlug) : undefined;
}
