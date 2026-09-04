import "server-only";

import { isAuthSessionMissingError, type User } from "@supabase/supabase-js";
import { cache } from "react";
import {
  AuthenticatedActorUnavailableError,
  resolveAuthenticatedActorUserResult,
} from "@/lib/auth/actor-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedActor = {
  user: User;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
};

export type AuthenticatedActorState =
  | Readonly<{ state: "authenticated"; actor: AuthenticatedActor }>
  | Readonly<{ state: "anonymous" }>
  | Readonly<{ state: "unavailable" }>;

/**
 * Public account-optional surfaces use this state to keep public content
 * available without presenting an Auth outage as a signed-out session.
 */
export const getAuthenticatedActorState = cache(
  async (): Promise<AuthenticatedActorState> => {
    try {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return { state: "unavailable" };
      const result = await supabase.auth.getUser();
      const resolution = resolveAuthenticatedActorUserResult(
        { data: result.data, error: result.error },
        isAuthSessionMissingError,
      );
      if (resolution.state === "anonymous") return resolution;
      if (result.data.user?.id !== resolution.userId) {
        return { state: "unavailable" };
      }
      return {
        state: "authenticated",
        actor: { user: result.data.user, supabase },
      };
    } catch {
      return { state: "unavailable" };
    }
  },
);

/**
 * Resolves the only identity that may own private preparation data.
 * Never accept a user id from a form, URL, or client payload instead.
 * Only a verified missing session returns null; Auth or client failures throw.
 */
export const getAuthenticatedActor = cache(async (): Promise<AuthenticatedActor | null> => {
  const result = await getAuthenticatedActorState();
  if (result.state === "authenticated") return result.actor;
  if (result.state === "anonymous") return null;
  throw new AuthenticatedActorUnavailableError();
});
