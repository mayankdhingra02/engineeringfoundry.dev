import type { BehavioralQuestion } from "@/types";
import categoriesData from "./categories.json";
import frameworksData from "./frameworks.json";
import questionsData from "./questions.json";

export const behavioralCategories = categoriesData;
export const behavioralFrameworks = frameworksData;
export const behavioralQuestions = questionsData as BehavioralQuestion[];
export const activeBehavioralQuestions = behavioralQuestions.filter((question) => question.status === "active");
export const behavioralSearchQuestions = activeBehavioralQuestions.filter((question) => question.searchFeatured);
export const behavioralStoryTypes = behavioralFrameworks.storyTypes;
export const behavioralScopes = ["Individual", "Team", "Cross-functional", "Leadership"] as const;
