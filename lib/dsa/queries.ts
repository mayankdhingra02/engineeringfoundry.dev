import "server-only";

import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { getNeedsReview, getRoadmapProgress } from "@/lib/dsa/progress";
import { canonicalDsaQuestions } from "@/lib/dsa/catalog";
import { parseDsaQuestionBrowserApplicationId } from "@/lib/dsa/question-browser-url-state";
import { resolveDsaWorkspacePrivateState } from "@/lib/dsa/workspace-state";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";

export async function getDsaWorkspaceState(applicationId?: unknown) {
  const canonicalApplicationId = parseDsaQuestionBrowserApplicationId(applicationId);
  const accountPlatformAvailable = isAccountPlatformAvailable();
  if (!accountPlatformAvailable) return { accountPlatformAvailable, signedIn: false as const, progress: {}, preferredRoadmap: "sde2" as RoadmapLevel, application: null };
  const actor = await getAuthenticatedActor();
  if (!actor) return { accountPlatformAvailable, signedIn: false as const, progress: {}, preferredRoadmap: "sde2" as RoadmapLevel, application: null };
  const [progressResult, preferenceResult, applicationResult] = await Promise.all([
    actor.supabase.from("dsa_question_progress").select("user_id,question_id,status,confidence,bookmarked,notes,first_attempted_at,last_practiced_at,solved_at,created_at,updated_at").eq("user_id", actor.user.id).order("last_practiced_at", { ascending: false, nullsFirst: false }),
    actor.supabase.from("user_preparation_preferences").select("dsa_level").eq("user_id", actor.user.id).maybeSingle(),
    canonicalApplicationId
      ? actor.supabase.from("applications").select("id,company_name,company_slug,role_title").eq("id", canonicalApplicationId).eq("user_id", actor.user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const privateState = resolveDsaWorkspacePrivateState(
    { progressResult, preferenceResult, applicationResult },
    {
      ownerId: actor.user.id,
      requestedApplicationId: canonicalApplicationId,
      canonicalQuestionIds: canonicalDsaQuestions.map((question) => question.id),
    },
  );
  return {
    accountPlatformAvailable,
    signedIn: true as const,
    ...privateState,
  };
}

export async function getDsaDashboardSummary() {
  const state = await getDsaWorkspaceState();
  if (!state.signedIn) return null;
  const rows = Object.values(state.progress);
  const roadmap = getRoadmapProgress(state.preferredRoadmap, state.progress);
  return {
    attempted: rows.filter((row) => row.status === "attempted").length,
    completed: roadmap.completed,
    roadmapTotal: roadmap.total,
    review: getNeedsReview(state.progress).length,
    preferredRoadmap: state.preferredRoadmap,
  };
}
