import "server-only";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  DASHBOARD_PRIVATE_DATA_DOMAIN,
  resolveDashboardPrivateStartState,
  type DashboardPrivateStartState,
} from "@/lib/dashboard/private-state";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";

export async function getDashboardPrivateStartState(): Promise<DashboardPrivateStartState> {
  const actor = await getAuthenticatedActor();
  if (!actor) throw new PrivateDataUnavailableError(DASHBOARD_PRIVATE_DATA_DOMAIN);

  const [preferenceResult, storyCountResult] = await Promise.all([
    actor.supabase
      .from("user_preparation_preferences")
      .select("primary_preparation_focus")
      .eq("user_id", actor.user.id)
      .maybeSingle(),
    actor.supabase
      .from("behavioral_stories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", actor.user.id),
  ]);

  return resolveDashboardPrivateStartState({ preferenceResult, storyCountResult });
}
