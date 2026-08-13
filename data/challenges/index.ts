import challengeData from "./challenges.json";
import rubricData from "./rubrics.json";
import type { ChallengeRubric, EngineeringChallenge } from "@/types";

export const challenges = challengeData as EngineeringChallenge[];
export const activeChallenges = challenges.filter((challenge) => challenge.status === "active");
export const challengeRubrics = rubricData as ChallengeRubric[];

export function getChallenge(slug: string) {
  return activeChallenges.find((challenge) => challenge.slug === slug);
}

export function getChallengeRubric(id: string) {
  return challengeRubrics.find((rubric) => rubric.id === id);
}
