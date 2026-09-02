import type { DesignConcept, DesignRoadmapStage, MlDesignProblem } from "@/types";
import conceptsData from "./concepts.json";
import problemsData from "./problems.json";
import roadmapData from "./roadmap.json";

export const mlDesignDomains = ["Recommendation", "Ranking", "Risk", "Trust & Safety", "Search", "NLP", "Generative AI", "Advertising"] as const;
export const mlDesignRoadmap = roadmapData as DesignRoadmapStage[];
export const mlDesignConcepts = conceptsData as DesignConcept[];
export const mlDesignProblems = problemsData as MlDesignProblem[];

export function selectActiveMlDesignProblems<T extends { status: string }>(problems: readonly T[]): T[] {
  return problems.filter((problem) => problem.status === "active");
}

export const activeMlDesignProblems = selectActiveMlDesignProblems(mlDesignProblems);

export function getMlDesignProblem(slug: string) {
  return activeMlDesignProblems.find((problem) => problem.slug === slug);
}
