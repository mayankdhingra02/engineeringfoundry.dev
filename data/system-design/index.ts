import type { DesignConcept, DesignRoadmapStage, SystemDesignProblem } from "@/types";
import conceptsData from "./concepts.json";
import problemsData from "./problems.json";
import roadmapData from "./roadmap.json";

export const systemDesignDomains = ["Web", "Messaging", "Storage", "Streaming", "Search", "Infrastructure", "Real-time", "Data Platform", "Reliability"] as const;
export const systemDesignPatterns = ["Caching", "Sharding", "Replication", "Async Processing", "Fan-out", "Rate Limiting", "Pub/Sub", "Consistent Hashing", "CDN", "Event Sourcing", "Search Index", "Object Storage", "Leader Election", "Idempotency", "Backpressure"] as const;

export const systemDesignRoadmap = roadmapData as DesignRoadmapStage[];
export const systemDesignConcepts = conceptsData as DesignConcept[];
export const systemDesignProblems = problemsData as SystemDesignProblem[];
export const activeSystemDesignProblems = systemDesignProblems.filter((problem) => problem.status === "active");

export function getSystemDesignProblem(slug: string) {
  return activeSystemDesignProblems.find((problem) => problem.slug === slug);
}
