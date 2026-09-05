import type { DsaPattern, DsaQuestion, DsaTopic, RoadmapStage } from "@/types";
import patternsData from "./patterns.json";
import { foundry75Questions } from "./foundry-75";
import roadmapData from "./roadmap.json";
import topicsData from "./topics.json";

export const dsaTopics = topicsData as DsaTopic[];
export const dsaPatterns = patternsData as DsaPattern[];
export const roadmapStages = roadmapData as RoadmapStage[];
export const questions = foundry75Questions satisfies readonly DsaQuestion[];

export const activeQuestions = questions.filter((question) => question.status === "active");
export const topicBySlug = new Map(dsaTopics.map((topic) => [topic.slug, topic]));
export const patternBySlug = new Map(dsaPatterns.map((pattern) => [pattern.slug, pattern]));
export const roadmapStageBySlug = new Map(roadmapStages.map((stage) => [stage.slug, stage]));

export function questionsForTopic(topicSlug: string) {
  return activeQuestions.filter((question) => question.topics.includes(topicSlug));
}

export function questionsForCompany(companySlug: string) {
  return activeQuestions.filter((question) => question.companyAssociations.some((association) => association.companySlug === companySlug));
}

export function getRoadmapQuestionCount(stageSlug: string) {
  return activeQuestions.filter((question) => question.roadmapStage === stageSlug).length;
}
