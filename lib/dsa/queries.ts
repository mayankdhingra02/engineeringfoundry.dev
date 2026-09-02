import "server-only";

import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { getNeedsReview, getRoadmapProgress, progressByQuestionId } from "@/lib/dsa/progress";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";

export async function getDsaWorkspaceState(applicationId?: string | null) {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  if (!accountPlatformAvailable) return { accountPlatformAvailable, signedIn: false as const, progress: {}, preferredRoadmap: "sde2" as RoadmapLevel, application: null };
  const actor = await getAuthenticatedActor();
  if (!actor) return { accountPlatformAvailable, signedIn: false as const, progress: {}, preferredRoadmap: "sde2" as RoadmapLevel, application: null };
  const [progressResult, preferenceResult, applicationResult] = await Promise.all([
    actor.supabase.from("dsa_question_progress").select("*").eq("user_id", actor.user.id).order("last_practiced_at", { ascending: false, nullsFirst: false }),
    actor.supabase.from("user_preparation_preferences").select("dsa_level").eq("user_id", actor.user.id).maybeSingle(),
    applicationId
      ? actor.supabase.from("applications").select("id,company_name,company_slug,role_title").eq("id", applicationId).eq("user_id", actor.user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (progressResult.error) throw new Error("Could not load DSA question progress.");
  const preferred = preferenceResult.data?.dsa_level;
  return {
    accountPlatformAvailable,
    signedIn: true as const,
    progress: progressByQuestionId(progressResult.data ?? []),
    preferredRoadmap: (preferred === "sde1" || preferred === "sde2" || preferred === "sde3plus" ? preferred : "sde2") as RoadmapLevel,
    application: applicationResult.data,
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
