import "server-only";

import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor, getAuthenticatedActorState } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import { canonicalMlDesignProblemSlugs } from "./attempt";
import { isMlDesignAttemptId, ML_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN, resolveMlDesignAttemptQuery } from "./attempt-query";

const summaryColumns = "id,problem_id,problem_version,title,status,mode,duration_minutes,revision,first_practiced_at,created_at,updated_at";

export async function getMlDesignProblemAttempts(problemId: string) {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  if (!accountPlatformAvailable || !canonicalMlDesignProblemSlugs.has(problemId)) return { accountPlatformAvailable, signedIn: false as const, attempts: [] };
  const actorState = await getAuthenticatedActorState();
  if (actorState.state !== "authenticated") return { accountPlatformAvailable: actorState.state === "anonymous", signedIn: false as const, attempts: [] };
  const { data, error } = await actorState.actor.supabase.from("ml_design_attempts").select(summaryColumns).eq("user_id", actorState.actor.user.id).eq("problem_id", problemId).order("updated_at", { ascending: false }).limit(25);
  if (error || !Array.isArray(data)) throw new PrivateDataUnavailableError(ML_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN);
  return { accountPlatformAvailable, signedIn: true as const, attempts: data };
}

export async function getMlDesignAttempt(attemptId: string) {
  if (!isAccountPlatformAvailable() || !isMlDesignAttemptId(attemptId)) throw new PrivateDataUnavailableError(ML_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN);
  const actor = await getAuthenticatedActor();
  if (!actor) throw new PrivateDataUnavailableError(ML_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN);
  const result = await actor.supabase.from("ml_design_attempts").select("*").eq("id", attemptId).eq("user_id", actor.user.id).maybeSingle();
  return resolveMlDesignAttemptQuery(result);
}
