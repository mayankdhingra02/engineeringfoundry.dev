import { activeBehavioralQuestions } from "@/data/behavioral";
import type { BehavioralQuestion } from "@/types";
import type { BehavioralCustomQuestion } from "@/lib/supabase/database.types";

export type WorkspaceQuestion = {
  id: string;
  source: "curated" | "custom";
  prompt: string;
  description: string | null;
  category: string;
  companySlug: string | null;
  curated?: BehavioralQuestion;
  custom?: BehavioralCustomQuestion;
};

export const CURATED_BEHAVIORAL_QUESTIONS: WorkspaceQuestion[] = activeBehavioralQuestions.map((question) => ({
  id: question.id,
  source: "curated",
  prompt: question.prompt,
  description: question.answerGuidance.join(" "),
  category: question.category,
  companySlug: null,
  curated: question,
}));

const suggestedCategories = ["Conflict", "Failure", "Teamwork", "Communication", "Prioritization", "Decision Making", "Technical Challenge", "Customer Focus", "Influence", "Growth", "Feedback", "Initiative", "Ethics", "General", "Other"];
export const BEHAVIORAL_CATEGORIES = Array.from(new Set([...CURATED_BEHAVIORAL_QUESTIONS.map((question) => question.category), ...suggestedCategories])).sort();

export function customQuestionView(question: BehavioralCustomQuestion): WorkspaceQuestion {
  return { id: question.id, source: "custom", prompt: question.question_text, description: question.description, category: question.category, companySlug: question.company_slug, custom: question };
}

export function findCuratedQuestion(id: string) {
  return CURATED_BEHAVIORAL_QUESTIONS.find((question) => question.id === id) ?? null;
}

export function questionReference(question: WorkspaceQuestion) {
  return question.source === "curated"
    ? { curated_question_id: question.id, custom_question_id: null }
    : { curated_question_id: null, custom_question_id: question.id };
}
