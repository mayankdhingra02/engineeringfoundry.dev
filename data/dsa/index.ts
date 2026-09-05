import type { DsaQuestion, RoadmapStage } from "@/types";
import { foundry75Questions } from "./foundry-75";
import { dsaPatternLessons } from "./pattern-lessons";
import roadmapData from "./roadmap.json";
import { dsaTopicLessons } from "./topic-lessons";

export const dsaTopics = dsaTopicLessons;
export const dsaPatterns = dsaPatternLessons;
export const roadmapStages = roadmapData as RoadmapStage[];
export const questions = foundry75Questions satisfies readonly DsaQuestion[];

export const activeQuestions = questions.filter((question) => question.status === "active");
export const topicBySlug = new Map(dsaTopics.map((topic) => [topic.slug, topic]));
export const patternBySlug = new Map(dsaPatterns.map((pattern) => [pattern.slug, pattern]));
export const roadmapStageBySlug = new Map(roadmapStages.map((stage) => [stage.slug, stage]));

export function questionsForTopic(topicSlug: string) {
  return activeQuestions.filter((question) => question.topics.includes(topicSlug));
}

export function questionsForPattern(patternSlug: string) {
  return activeQuestions.filter((question) => question.patterns.includes(patternSlug));
}

export function questionsForCompany(companySlug: string) {
  return activeQuestions.filter((question) => question.companyAssociations.some((association) => association.companySlug === companySlug));
}

export function getRoadmapQuestionCount(stageSlug: string) {
  return activeQuestions.filter((question) => question.roadmapStage === stageSlug).length;
}
