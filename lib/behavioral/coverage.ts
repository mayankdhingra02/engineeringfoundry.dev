import type { BehavioralStory, BehavioralStoryQuestionLink } from "@/lib/supabase/database.types";
import type { WorkspaceQuestion } from "./catalog";

export type BehavioralCoverageStatus = "Covered" | "Thin" | "Uncovered";

export type BehavioralCoverageArea = {
  category: string;
  questionCount: number;
  storyCount: number;
  status: BehavioralCoverageStatus;
  questionIds: string[];
};

export type BehavioralCoverageMap = {
  areas: BehavioralCoverageArea[];
  questionsByStory: Map<string, WorkspaceQuestion[]>;
  nextArea: BehavioralCoverageArea | null;
  overusedStories: Array<{ story: BehavioralStory; questionCount: number }>;
};

function linkedQuestionIds(link: BehavioralStoryQuestionLink) {
  return [link.curated_question_id, link.custom_question_id].filter((id): id is string => Boolean(id));
}

/**
 * Content coverage only: this maps saved evidence to the existing question
 * catalog. It deliberately does not infer preparation quality or performance.
 */
export function buildBehavioralCoverageMap(input: {
  questions: WorkspaceQuestion[];
  stories: BehavioralStory[];
  links: BehavioralStoryQuestionLink[];
}): BehavioralCoverageMap {
  const questionsById = new Map(input.questions.map((question) => [question.id, question]));
  const questionsByStory = new Map<string, WorkspaceQuestion[]>();

  for (const link of input.links) {
    const linked = linkedQuestionIds(link).map((id) => questionsById.get(id)).filter((question): question is WorkspaceQuestion => Boolean(question));
    if (linked.length) questionsByStory.set(link.story_id, [...(questionsByStory.get(link.story_id) ?? []), ...linked]);
  }

  const areas: BehavioralCoverageArea[] = Array.from(new Map(input.questions.map((question) => [question.category, question])).keys()).map((category) => {
    const categoryQuestions = input.questions.filter((question) => question.category === category);
    const categoryQuestionIds = new Set(categoryQuestions.map((question) => question.id));
    const storyCount = input.stories.filter((story) => (questionsByStory.get(story.id) ?? []).some((question) => categoryQuestionIds.has(question.id))).length;
    return {
      category,
      questionCount: categoryQuestions.length,
      storyCount,
      status: storyCount === 0 ? "Uncovered" : storyCount === 1 ? "Thin" : "Covered",
      questionIds: categoryQuestions.map((question) => question.id),
    };
  });

  const nextArea = areas.find((area) => area.status === "Uncovered") ?? areas.find((area) => area.status === "Thin") ?? null;
  const overusedStories = input.stories
    .map((story) => ({ story, questionCount: questionsByStory.get(story.id)?.length ?? 0 }))
    .filter((item) => item.questionCount >= 6)
    .sort((a, b) => b.questionCount - a.questionCount || a.story.title.localeCompare(b.story.title));

  return { areas, questionsByStory, nextArea, overusedStories };
}
