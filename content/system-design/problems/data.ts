import { advancedProductPracticeProblems } from "./advanced-product.ts";
import { foundationPracticeProblems } from "./foundation.ts";
import { infrastructurePracticeProblems } from "./infrastructure.ts";
import { productPracticeProblems } from "./product.ts";
import { specializedPracticeProblems } from "./specialized.ts";

const practiceContentSeeds = [
  ...foundationPracticeProblems,
  ...productPracticeProblems,
  ...advancedProductPracticeProblems,
  ...infrastructurePracticeProblems,
  ...specializedPracticeProblems,
] as const;

const prerequisiteAliases: Readonly<Record<string, string>> = {
  websockets: "realtime-communication",
  "event-time": "flink",
};

export const systemDesignPracticeContents = practiceContentSeeds.map((problem) => ({
  ...problem,
  prerequisites: problem.prerequisites.map((id) => prerequisiteAliases[id] ?? id),
  capacity: problem.id === "search-engine" && problem.capacity ? {
    ...problem.capacity,
    arithmetic: problem.capacity.arithmetic.map((line) => line.startsWith("At 20 index shards")
      ? "100K queries/s × 20 queried shards ≈ 2M shard requests/s before replica routing"
      : line),
  } : problem.capacity,
  scaledDiagram: problem.id === "ml-inference-service" ? problem.scaledDiagram.replace("O[Telemetry] <-- F", "F --> O[Telemetry]") : problem.scaledDiagram,
}));

export const systemDesignPracticeContentIds = new Set(systemDesignPracticeContents.map((problem) => problem.id));

export function getSystemDesignPracticeContent(id: string) {
  return systemDesignPracticeContents.find((problem) => problem.id === id);
}
