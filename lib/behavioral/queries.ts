import "server-only";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { Application, BehavioralAnswer, BehavioralCustomQuestion, BehavioralStory, BehavioralStoryQuestionLink, BehavioralStoryTheme } from "@/lib/supabase/database.types";
import { CURATED_BEHAVIORAL_QUESTIONS, customQuestionView, type WorkspaceQuestion } from "./catalog";
import type { PreparationStatus } from "./options";
import { isBehavioralRoundType, storyReadiness } from "./readiness";

export type BehavioralUpcomingInterview = {
  id: string;
  round_name: string;
  round_type: string;
  scheduled_at: string;
  timezone: string | null;
  application: Pick<Application, "id" | "company_name" | "company_slug" | "role_title">;
};

export type BehavioralWorkspaceData = {
  questions: WorkspaceQuestion[];
  customQuestions: BehavioralCustomQuestion[];
  stories: BehavioralStory[];
  themes: BehavioralStoryTheme[];
  links: BehavioralStoryQuestionLink[];
  answers: BehavioralAnswer[];
  applications: Array<Pick<Application, "id" | "company_name" | "company_slug" | "role_title">>;
  upcomingInterviews: BehavioralUpcomingInterview[];
};

export async function getBehavioralWorkspaceData(): Promise<BehavioralWorkspaceData> {
  const current = await getAuthenticatedActor();
  if (!current) throw new PrivateDataUnavailableError("behavioral preparation");
  const { supabase, user } = current;
  const [customResult, storiesResult, themesResult, linksResult, answersResult, applicationsResult, upcomingResult] = await Promise.all([
    supabase.from("behavioral_custom_questions").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("behavioral_stories").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("behavioral_story_themes").select("*").eq("user_id", user.id).order("theme"),
    supabase.from("behavioral_story_question_links").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("behavioral_answers").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("applications").select("id,company_name,company_slug,role_title").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("interview_rounds").select("id,round_name,round_type,scheduled_at,timezone,application:applications!interview_rounds_application_owner_fkey(id,company_name,company_slug,role_title)").eq("user_id", user.id).neq("status", "Completed").not("scheduled_at", "is", null).gte("scheduled_at", new Date().toISOString()).order("scheduled_at", { ascending: true }).limit(12),
  ]);
  if ([customResult, storiesResult, themesResult, linksResult, answersResult, applicationsResult, upcomingResult].some((result) => result.error)) {
    throw new PrivateDataUnavailableError("behavioral preparation");
  }
  const customQuestions = (customResult.data ?? []) as BehavioralCustomQuestion[];
  return {
    questions: [...CURATED_BEHAVIORAL_QUESTIONS, ...customQuestions.map(customQuestionView)],
    customQuestions,
    stories: (storiesResult.data ?? []) as BehavioralStory[],
    themes: (themesResult.data ?? []) as BehavioralStoryTheme[],
    links: (linksResult.data ?? []) as BehavioralStoryQuestionLink[],
    answers: (answersResult.data ?? []) as BehavioralAnswer[],
    applications: (applicationsResult.data ?? []) as Array<Pick<Application, "id" | "company_name" | "company_slug" | "role_title">>,
    upcomingInterviews: ((upcomingResult.data ?? []) as unknown as BehavioralUpcomingInterview[]).filter((round) => isBehavioralRoundType(round.round_type)),
  };
}

export function linkMatchesQuestion(link: BehavioralStoryQuestionLink, question: WorkspaceQuestion) {
  return question.source === "curated" ? link.curated_question_id === question.id : link.custom_question_id === question.id;
}

export function answerMatchesQuestion(answer: BehavioralAnswer, question: WorkspaceQuestion) {
  return question.source === "curated" ? answer.curated_question_id === question.id : answer.custom_question_id === question.id;
}

export function preparationStatus(question: WorkspaceQuestion, data: Pick<BehavioralWorkspaceData, "links" | "answers" | "stories">): PreparationStatus {
  const answers = data.answers.filter((answer) => answerMatchesQuestion(answer, question));
  const links = data.links.filter((link) => linkMatchesQuestion(link, question));
  if (answers.some((answer) => answer.status === "Ready") || links.some((link) => data.stories.some((story) => story.id === link.story_id && storyReadiness(story) === "Ready"))) return "Ready";
  if (answers.length) return "Drafted";
  if (links.length) return "Story linked";
  return "Not started";
}

export function behavioralSummary(data: BehavioralWorkspaceData) {
  const prepared = data.questions.filter((question) => preparationStatus(question, data) !== "Not started").length;
  return { totalQuestions: data.questions.length, prepared, readyStories: data.stories.filter((story) => storyReadiness(story) === "Ready").length, stories: data.stories.length, answers: data.answers.length, upcomingInterviews: data.upcomingInterviews.length };
}

export async function getReadyBehavioralStoryCount() {
  const current = await getAuthenticatedActor();
  if (!current) throw new PrivateDataUnavailableError("behavioral preparation");
  const { count, error } = await current.supabase.from("behavioral_stories").select("id", { count: "exact", head: true }).eq("user_id", current.user.id).eq("status", "Ready");
  if (error) throw new PrivateDataUnavailableError("behavioral preparation");
  return count ?? 0;
}
