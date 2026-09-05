import "server-only";

import { getAuthenticatedActor, getAuthenticatedActorState } from "@/lib/auth/actor";
import { resolveDsaAttempt, resolveDsaAttemptSummaries } from "./practice-attempt-query";

const summaryColumns = "id,question_id,catalog_version,title,status,mode,duration_minutes,prior_exposure,elapsed_seconds,review_reason,revision,completed_at,created_at,updated_at";

export async function getDsaPracticeAttemptSummaries() {
  const actorState = await getAuthenticatedActorState();
  if (actorState.state !== "authenticated") return [];
  const result = await actorState.actor.supabase.from("dsa_practice_attempts").select(summaryColumns).eq("user_id", actorState.actor.user.id).order("updated_at", { ascending: false }).limit(50);
  return resolveDsaAttemptSummaries(result);
}

export async function getDsaPracticeAttempt(attemptId: string) {
  const actor = await getAuthenticatedActor();
  if (!actor) return null;
  const result = await actor.supabase.from("dsa_practice_attempts").select("*").eq("id", attemptId).eq("user_id", actor.user.id).maybeSingle();
  return resolveDsaAttempt(result);
}
