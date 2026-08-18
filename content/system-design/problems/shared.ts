import type { SystemDesignPracticeContent } from "./types.ts";

const timedPlans = [
  { minutes: 30 as const, allocation: ["4 min requirements", "4 min API and data", "8 min simple design", "9 min one deep dive", "3 min reliability", "2 min summary"] },
  { minutes: 45 as const, allocation: ["5 min requirements", "5 min estimates, API, and data", "10 min simple design", "15 min deep dive", "7 min reliability and scaling", "3 min summary"] },
  { minutes: 60 as const, allocation: ["7 min requirements", "8 min estimates, API, and data", "12 min architecture", "20 min deep dives", "9 min reliability and trade-offs", "4 min summary"] },
] as const;

export function definePracticeProblem(problem: Omit<SystemDesignPracticeContent, "timedPlans" | "lastReviewed">): SystemDesignPracticeContent {
  return { ...problem, timedPlans, lastReviewed: "2026-08-14" };
}

export const sharedCandidateMistakes = [
  "Drawing boxes before clarifying the product boundary and the quality target.",
  "Adding a cache, stream, or distributed database without naming the bottleneck it removes.",
  "Describing the happy path without duplicate, timeout, overload, or recovery behavior.",
] as const;
