import type { ExperienceGuidance, ExperienceRoundType, ExperienceTopic } from "@/types";
import guidanceData from "./guidance.json";
import roundTypeData from "./round-types.json";
import topicData from "./topics.json";

export const experienceRoundTypes = roundTypeData as ExperienceRoundType[];
export const experienceTopics = topicData as ExperienceTopic[];
export const experienceGuidance = guidanceData as ExperienceGuidance;
export const currentPublicExperiences = [] as const;
