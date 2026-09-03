import "server-only";

import { dsaInterviewQuestionDatabase, questionsForInterviewCompany } from "@/data/dsa/question-database";
import { systemDesignTopics } from "@/data/system-design/recommendations";
import { hasCompanyGuide } from "@/lib/applications/options";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { Application, InterviewPreparation, InterviewPreparationCustomTask, InterviewRound } from "@/lib/supabase/database.types";
import { checklistForRound, resolveRoundPreparationContext, resolvePreparationCompanySlug, roadmapLevelForRole } from "./model";
import { resolvePreparationCounts, type PreparationCountsResult } from "./preparation-counts";

type OwnedRound = InterviewRound & { application: Pick<Application, "id" | "company_name" | "company_slug" | "role_title" | "role_level" | "status"> };

export async function getInterviewPreparationHub(roundId: string) {
  const actor = await getAuthenticatedActor();
  if (!actor) throw new PrivateDataUnavailableError("interview preparation");

  // Resolve the owned parent before any module query. This prevents guessed IDs
  // from becoming a side channel into application-linked preparation data.
  const { data: roundData, error: roundError } = await actor.supabase
    .from("interview_rounds")
    .select("*,application:applications!interview_rounds_application_owner_fkey(id,company_name,company_slug,role_title,role_level,status)")
    .eq("id", roundId)
    .eq("user_id", actor.user.id)
    .maybeSingle();
  if (roundError) throw new PrivateDataUnavailableError("interview preparation");
  if (!roundData) return null;

  const round = roundData as unknown as OwnedRound;
  const roundContext = resolveRoundPreparationContext(round.round_type);
  const modules = roundContext.modules;
  const companySlug = resolvePreparationCompanySlug(round.application.company_slug);
  const includeDsa = modules.includes("dsa");
  const includeBehavioral = modules.includes("behavioral");
  const includeSystemDesign = modules.includes("system-design");

  const answersResult = includeBehavioral
    ? await actor.supabase
      .from("behavioral_answers")
      .select("id,status,application_id,story_id,updated_at", { count: "exact" })
      .eq("user_id", actor.user.id)
      .eq("application_id", round.application.id)
      .order("updated_at", { ascending: false })
      .limit(24)
    : { data: [], error: null, count: 0 };
  if (answersResult.error) throw new PrivateDataUnavailableError("interview preparation");
  const applicationStoryIds = [...new Set((answersResult.data ?? []).map((answer) => answer.story_id).filter((id): id is string => Boolean(id)))].slice(0, 6);

  const [preparationResult, tasksResult, dsaResult, storiesResult, applicationStoriesResult, readyStoryCountResult, attemptsResult, conceptsResult] = await Promise.all([
    actor.supabase.from("interview_preparations").select("*").eq("round_id", round.id).eq("user_id", actor.user.id).maybeSingle(),
    actor.supabase.from("interview_preparation_custom_tasks").select("*").eq("round_id", round.id).eq("user_id", actor.user.id).order("position").order("created_at").limit(12),
    includeDsa ? actor.supabase.from("dsa_question_progress").select("question_id,status,confidence,bookmarked,last_practiced_at").eq("user_id", actor.user.id).order("last_practiced_at", { ascending: false, nullsFirst: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    includeBehavioral ? actor.supabase.from("behavioral_stories").select("id,title,short_summary,status,updated_at").eq("user_id", actor.user.id).order("updated_at", { ascending: false }).limit(6) : Promise.resolve({ data: [], error: null }),
    includeBehavioral && applicationStoryIds.length ? actor.supabase.from("behavioral_stories").select("id,title,short_summary,status,updated_at").eq("user_id", actor.user.id).in("id", applicationStoryIds).limit(6) : Promise.resolve({ data: [], error: null }),
    includeBehavioral ? actor.supabase.from("behavioral_stories").select("id", { count: "exact", head: true }).eq("user_id", actor.user.id).eq("status", "Ready") : Promise.resolve({ data: null, error: null, count: 0 }),
    includeSystemDesign ? actor.supabase.from("system_design_attempts").select("id,problem_id,title,status,confidence,application_id,updated_at").eq("user_id", actor.user.id).or(`application_id.eq.${round.application.id},application_id.is.null`).order("updated_at", { ascending: false }).limit(4) : Promise.resolve({ data: [], error: null }),
    includeSystemDesign ? actor.supabase.from("system_design_item_progress").select("item_id,status,confidence,bookmarked,last_practiced_at").eq("user_id", actor.user.id).in("status", ["review", "reviewed"]).order("last_practiced_at", { ascending: false, nullsFirst: false }).limit(8) : Promise.resolve({ data: [], error: null }),
  ]);
  if ([preparationResult, tasksResult, dsaResult, storiesResult, applicationStoriesResult, readyStoryCountResult, attemptsResult, conceptsResult].some((result) => result.error)) {
    throw new PrivateDataUnavailableError("interview preparation");
  }

  const stories = [...(applicationStoriesResult.data ?? []), ...(storiesResult.data ?? [])]
    .filter((story, index, all) => all.findIndex((candidate) => candidate.id === story.id) === index)
    .slice(0, 6);

  const progress = new Map((dsaResult.data ?? []).map((item) => [item.question_id, item]));
  const companyQuestions = companySlug ? questionsForInterviewCompany(companySlug) : [];
  const dsaPool = [...companyQuestions, ...dsaInterviewQuestionDatabase.filter((question) => progress.has(question.id))]
    .filter((question, index, all) => all.findIndex((candidate) => candidate.id === question.id) === index)
    .sort((a, b) => {
      const aProgress = progress.get(a.id); const bProgress = progress.get(b.id);
      const score = (item: typeof aProgress, company: boolean) => (item?.status === "review" ? 7 : 0) + (item?.status === "attempted" ? 5 : 0) + (item?.bookmarked ? 4 : 0) + (item?.confidence === "low" ? 3 : 0) + (company ? 2 : 0) - (item?.status === "solved" && item?.confidence === "high" ? 6 : 0);
      return score(bProgress, companyQuestions.some((item) => item.id === b.id)) - score(aProgress, companyQuestions.some((item) => item.id === a.id));
    }).slice(0, 5);

  const conceptRows = conceptsResult.data ?? [];
  const conceptRecommendations = conceptRows.map((row) => systemDesignTopics.find((topic) => topic.id === row.item_id)).filter(Boolean).slice(0, 4);
  if (conceptRecommendations.length < 3) {
    for (const topic of systemDesignTopics.filter((item) => item.published && item.defaultPriority === "must-know")) {
      if (!conceptRecommendations.some((item) => item?.id === topic.id)) conceptRecommendations.push(topic);
      if (conceptRecommendations.length === 4) break;
    }
  }

  const preparation = preparationResult.data as InterviewPreparation | null;
  const tasks = (tasksResult.data ?? []) as InterviewPreparationCustomTask[];
  const checklist = checklistForRound(round.round_type);
  const completedIds = new Set(preparation?.completed_template_item_ids ?? []);
  const completedCount = checklist.filter((item) => completedIds.has(item.id)).length + tasks.filter((task) => task.completed).length;

  return {
    round,
    roundContext,
    modules,
    preparation,
    tasks,
    checklist,
    completedCount,
    totalCount: checklist.length + tasks.length,
    company: { slug: companySlug, hasGuide: hasCompanyGuide(companySlug) },
    dsa: includeDsa ? { roadmapLevel: roadmapLevelForRole(round.application.role_level), recommendations: dsaPool.map((question) => ({ question, progress: progress.get(question.id) ?? null })) } : null,
    behavioral: includeBehavioral ? { stories, applicationAnswers: answersResult.count ?? (answersResult.data ?? []).length, readyStoryCount: readyStoryCountResult.count ?? 0 } : null,
    systemDesign: includeSystemDesign ? { attempts: attemptsResult.data ?? [], concepts: conceptRecommendations.filter(Boolean) } : null,
  };
}

export async function getPreparationCounts(roundIds: readonly string[]): Promise<PreparationCountsResult> {
  if (!roundIds.length) {
    return resolvePreparationCounts({ queryFailed: false, rounds: [], preparations: [], tasks: [] });
  }
  const actor = await getAuthenticatedActor();
  if (!actor) {
    return resolvePreparationCounts({ queryFailed: true, rounds: [], preparations: [], tasks: [] });
  }
  const [rounds, preparations, tasks] = await Promise.all([
    actor.supabase.from("interview_rounds").select("id,round_type").eq("user_id", actor.user.id).in("id", roundIds),
    actor.supabase.from("interview_preparations").select("round_id,completed_template_item_ids").eq("user_id", actor.user.id).in("round_id", roundIds),
    actor.supabase.from("interview_preparation_custom_tasks").select("round_id,completed").eq("user_id", actor.user.id).in("round_id", roundIds),
  ]);
  return resolvePreparationCounts({
    queryFailed: Boolean(rounds.error || preparations.error || tasks.error),
    rounds: rounds.data ?? [],
    preparations: preparations.data ?? [],
    tasks: tasks.data ?? [],
  });
}
