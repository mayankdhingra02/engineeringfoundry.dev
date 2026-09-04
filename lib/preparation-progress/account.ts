import "server-only";

import { activeBehavioralQuestions } from "@/data/behavioral";
import { activeMlDesignProblems } from "@/data/ml-design";
import { canonicalDsaQuestionById } from "@/lib/dsa/catalog";
import { getAuthenticatedActorState } from "@/lib/auth/actor";
import { UPCOMING_ROUND_STATUSES } from "@/lib/applications/options";
import { systemDesignPracticeContents } from "@/content/system-design/problems/data";
import { systemDesignLessons } from "@/data/system-design/curriculum";
import {
  resolveAccountPreparationContinuationState,
  type AccountPreparationContinuationState,
  type PreparationContinuation,
} from "./continuation";
import { preparationActivityDaysThisWeek } from "./local";

const systemDesignCatalog = new Map<string, { title: string; href: string }>([
  ...systemDesignLessons.filter((item) => item.status === "published" && item.slug && !item.id.startsWith("problem-")).map((item) => [`concept:${item.id}`, { title: item.navigationTitle ?? item.title, href: item.slug! }] as const),
  ...systemDesignPracticeContents.map((item) => [`design_problem:${item.id}`, { title: item.title, href: `/system-design/problems/${item.id}` }] as const),
]);
const mlCatalog = new Map(activeMlDesignProblems.map((item) => [item.id, { title: item.title, href: `/ml-design/${item.slug}` }]));
const behavioralCatalog = new Map(activeBehavioralQuestions.map((item) => [item.id, { title: item.prompt, href: `/behavioral?question=${encodeURIComponent(item.slug)}` }]));

const mostRecent = <T extends { updated_at?: string | null; last_interacted_at?: string | null; last_practiced_at?: string | null }>(rows: readonly T[]) =>
  [...rows].sort((left, right) => Date.parse(right.last_interacted_at ?? right.last_practiced_at ?? right.updated_at ?? "") - Date.parse(left.last_interacted_at ?? left.last_practiced_at ?? left.updated_at ?? ""))[0];
const timestamp = (value: string | null | undefined) => Number.isFinite(Date.parse(value ?? "")) ? Date.parse(value!) : 0;

/** Returns public labels and links only; private workspace text never crosses this boundary. */
export async function getAccountPreparationContinuations(): Promise<AccountPreparationContinuationState> {
  const actorState = await getAuthenticatedActorState();
  if (actorState.state === "unavailable") {
    return resolveAccountPreparationContinuationState({ authenticated: false, queryFailed: true, candidates: [], weeklyActivityDays: 0 });
  }
  if (actorState.state === "anonymous") return resolveAccountPreparationContinuationState({ authenticated: false, queryFailed: false, candidates: [], weeklyActivityDays: 0 });
  const actor = actorState.actor;
  const { supabase, user } = actor;
  const [upcomingRoundResult, preferencesResult, dsaResult, systemProgressResult, attemptsResult, trackResult, behavioralResult] = await Promise.all([
    supabase.from("interview_rounds").select("id,scheduled_at").eq("user_id", user.id).gte("scheduled_at", new Date().toISOString()).in("status", [...UPCOMING_ROUND_STATUSES]).order("scheduled_at", { ascending: true }).limit(1),
    supabase.from("user_preparation_preferences").select("dsa_level,dsa_plan_id,system_design_level,system_design_preparation_window,system_design_role,system_design_minutes_per_day,updated_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("dsa_question_progress").select("question_id,status,last_practiced_at,updated_at").eq("user_id", user.id).neq("status", "not_started").order("last_practiced_at", { ascending: false, nullsFirst: false }).limit(100),
    supabase.from("system_design_item_progress").select("item_id,item_type,status,last_practiced_at,updated_at").eq("user_id", user.id).neq("status", "not_started").order("last_practiced_at", { ascending: false, nullsFirst: false }).limit(100),
    supabase.from("system_design_attempts").select("id,problem_id,status,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(100),
    supabase.from("preparation_track_progress").select("track,item_id,status,last_interacted_at,updated_at").eq("user_id", user.id).order("last_interacted_at", { ascending: false }).limit(100),
    supabase.from("behavioral_stories").select("updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
  ]);

  if ([upcomingRoundResult, preferencesResult, dsaResult, systemProgressResult, attemptsResult, trackResult, behavioralResult].some((result) => result.error)) {
    return resolveAccountPreparationContinuationState({ authenticated: true, queryFailed: true, candidates: [], weeklyActivityDays: 0 });
  }
  const candidates: PreparationContinuation[] = [];
  const upcomingRound = upcomingRoundResult.data?.[0];
  if (upcomingRound) candidates.push({
    track: "interview", title: "Prepare for your upcoming interview", href: `/interviews/${upcomingRound.id}/prepare`, context: "Your nearest scheduled interview has a focused preparation route.", source: "account", kind: "upcoming-interview", updatedAt: timestamp(upcomingRound.scheduled_at),
  });
  const preferences = preferencesResult.data;
  if (preferences?.dsa_plan_id || preferences?.dsa_level) candidates.push({
    track: "dsa", title: "Continue DSA roadmap", href: "/dsa/roadmap", context: "Your active account roadmap.", source: "account", kind: "active-plan", updatedAt: timestamp(preferences.updated_at),
  });
  if (preferences?.system_design_level || preferences?.system_design_preparation_window || preferences?.system_design_role || preferences?.system_design_minutes_per_day) candidates.push({
    track: "system-design", title: "Continue System Design plan", href: "/system-design/plan", context: "Your active account study plan.", source: "account", kind: "active-plan", updatedAt: timestamp(preferences.updated_at),
  });

  const draft = (attemptsResult.data ?? []).find((item) => item.status === "draft");
  const draftProblem = draft ? systemDesignCatalog.get(`design_problem:${draft.problem_id}`) : null;
  if (draft && draftProblem) candidates.push({ track: "system-design", title: `Continue ${draftProblem.title}`, href: `/system-design/problems/${draft.problem_id}/practice/${draft.id}`, context: "Saved design attempt in progress.", source: "account", kind: "in-progress", updatedAt: timestamp(draft.updated_at) });

  const dsa = mostRecent((dsaResult.data ?? []).filter((item) => item.status === "attempted" || item.status === "review"));
  const dsaQuestion = dsa ? canonicalDsaQuestionById.get(dsa.question_id) : null;
  if (dsa && dsaQuestion) candidates.push({ track: "dsa", title: `${dsa.status === "review" ? "Review" : "Continue"} ${dsaQuestion.title}`, href: `/dsa/questions/${dsaQuestion.id}`, context: dsa.status === "review" ? "Marked for review in your account." : "Recorded practice in your account.", source: "account", kind: dsa.status === "attempted" ? "in-progress" : "recent", updatedAt: timestamp(dsa.last_practiced_at ?? dsa.updated_at) });

  const systemItem = mostRecent((systemProgressResult.data ?? []).filter((item) => item.status === "review" || item.status === "reviewed"));
  const systemCatalogItem = systemItem ? systemDesignCatalog.get(`${systemItem.item_type}:${systemItem.item_id}`) : null;
  if (systemItem && systemCatalogItem) candidates.push({ track: "system-design", title: `${systemItem.status === "review" ? "Review" : "Continue"} ${systemCatalogItem.title}`, href: systemCatalogItem.href, context: "Recorded preparation in your account.", source: "account", kind: systemItem.status === "review" ? "in-progress" : "recent", updatedAt: timestamp(systemItem.last_practiced_at ?? systemItem.updated_at) });

  for (const item of trackResult.data ?? []) {
    const catalog = item.track === "ml-design"
      ? mlCatalog.get(item.item_id)
      : item.track === "behavioral"
        ? behavioralCatalog.get(item.item_id)
        : null;
    if (!catalog) continue;
    candidates.push({ track: item.track, title: item.status === "completed" ? `Revisit ${catalog.title}` : `Continue ${catalog.title}`, href: catalog.href, context: "Recorded preparation in your account.", source: "account", kind: item.status === "in-progress" ? "in-progress" : "recent", updatedAt: timestamp(item.last_interacted_at ?? item.updated_at) });
  }

  const recentStory = behavioralResult.data?.[0];
  if (recentStory) candidates.push({ track: "behavioral", title: "Continue Behavioral workspace", href: "/behavioral/workspace", context: "Recent saved preparation in your account.", source: "account", kind: "recent", updatedAt: timestamp(recentStory.updated_at) });
  const activityTimestamps = [
    ...(dsaResult.data ?? []).map((item) => timestamp(item.last_practiced_at ?? item.updated_at)),
    ...(systemProgressResult.data ?? []).map((item) => timestamp(item.last_practiced_at ?? item.updated_at)),
    ...(attemptsResult.data ?? []).map((item) => timestamp(item.updated_at)),
    ...(trackResult.data ?? []).map((item) => timestamp(item.last_interacted_at ?? item.updated_at)),
    ...((behavioralResult.data ?? []).map((item) => timestamp(item.updated_at))),
  ];
  return resolveAccountPreparationContinuationState({
    authenticated: true,
    queryFailed: false,
    candidates,
    weeklyActivityDays: preparationActivityDaysThisWeek(activityTimestamps.map((updatedAt) => ({ updatedAt }))),
  });
}
