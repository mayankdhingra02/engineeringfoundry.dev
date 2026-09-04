import "server-only";

import { notFound, redirect } from "next/navigation";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { safeInternalPath } from "@/lib/auth/redirects";
import { resolveAdminMembershipResult } from "@/lib/admin/query-results";

/**
 * Resolves a database-authorized operator. The explicit membership check lives
 * in Postgres and is repeated by every write RPC; this guard only controls
 * private route access and never substitutes for that database boundary.
 */
export async function requireAdminActor(destination = "/admin") {
  const actor = await getAuthenticatedActor();
  if (!actor) redirect(`/signin?next=${encodeURIComponent(safeInternalPath(destination))}`);
  const { data, error } = await actor.supabase.rpc("is_current_admin");
  if (!resolveAdminMembershipResult({ data, error })) notFound();
  return actor;
}
