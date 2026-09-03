import "server-only";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  PREPARATION_PREFERENCES_PRIVATE_DATA_DOMAIN,
  resolvePreparationPreferencesQuery,
  type PreparationPreferences,
} from "@/lib/account/preparation-preferences";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";

export async function getPreparationPreferences(): Promise<PreparationPreferences | null> {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    throw new PrivateDataUnavailableError(PREPARATION_PREFERENCES_PRIVATE_DATA_DOMAIN);
  }

  const result = await actor.supabase
    .from("user_preparation_preferences")
    .select("preferred_role_level,primary_preparation_focus,dsa_level")
    .eq("user_id", actor.user.id)
    .maybeSingle();

  return resolvePreparationPreferencesQuery(result);
}
