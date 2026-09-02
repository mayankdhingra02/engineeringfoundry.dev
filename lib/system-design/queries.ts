import "server-only";

import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { asSystemDesignAttempt, progressBySystemDesignItem } from "@/lib/system-design/workspace";

const summaryColumns = "id,problem_id,application_id,title,status,confidence,first_practiced_at,last_practiced_at,created_at,updated_at";

export async function getSystemDesignWorkspaceState(applicationId?: string | null) {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  if (!accountPlatformAvailable) return { accountPlatformAvailable, signedIn: false as const, progress: {}, attempts: [], applications: [], application: null };
  const actor = await getAuthenticatedActor();
  if (!actor) return { accountPlatformAvailable, signedIn: false as const, progress: {}, attempts: [], applications: [], application: null };
  const [progressResult, attemptsResult, applicationsResult] = await Promise.all([
    actor.supabase.from("system_design_item_progress").select("*").eq("user_id", actor.user.id).order("last_practiced_at", { ascending: false, nullsFirst: false }),
    actor.supabase.from("system_design_attempts").select(summaryColumns).eq("user_id", actor.user.id).order("updated_at", { ascending: false }).limit(100),
    actor.supabase.from("applications").select("id,company_name,company_slug,role_title,status").eq("user_id", actor.user.id).order("updated_at", { ascending: false }).limit(100),
  ]);
  if (progressResult.error || attemptsResult.error || applicationsResult.error) {
    throw new Error("Could not load the System Design workspace.");
  }
  const applications = applicationsResult.data ?? [];
  return {
    accountPlatformAvailable,
    signedIn: true as const,
    progress: progressBySystemDesignItem(progressResult.data ?? []),
    attempts: attemptsResult.data ?? [],
    applications,
    application: applicationId ? applications.find((item) => item.id === applicationId) ?? null : null,
  };
}

export async function getSystemDesignItemState(itemId: string, itemType: "concept" | "design_problem") {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  if (!accountPlatformAvailable) return { accountPlatformAvailable, signedIn: false as const, progress: null };
  const actor = await getAuthenticatedActor();
  if (!actor) return { accountPlatformAvailable, signedIn: false as const, progress: null };
  const { data, error } = await actor.supabase.from("system_design_item_progress").select("*").eq("user_id", actor.user.id).eq("item_id", itemId).eq("item_type", itemType).maybeSingle();
  if (error) throw new Error("Could not load System Design progress.");
  return { accountPlatformAvailable, signedIn: true as const, progress: data };
}

export async function getSystemDesignAttempt(attemptId: string) {
  if (!isAccountPlatformAvailable()) return null;
  const actor = await getAuthenticatedActor();
  if (!actor) return null;
  const { data, error } = await actor.supabase.from("system_design_attempts").select("*").eq("id", attemptId).eq("user_id", actor.user.id).maybeSingle();
  if (error || !data) return null;
  return asSystemDesignAttempt(data);
}

export async function getSystemDesignProblemAttempts(problemId: string) {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  if (!accountPlatformAvailable) return { accountPlatformAvailable, signedIn: false as const, attempts: [], applications: [] };
  const actor = await getAuthenticatedActor();
  if (!actor) return { accountPlatformAvailable, signedIn: false as const, attempts: [], applications: [] };
  const [attempts, applications] = await Promise.all([
    actor.supabase.from("system_design_attempts").select(summaryColumns).eq("user_id", actor.user.id).eq("problem_id", problemId).order("updated_at", { ascending: false }).limit(25),
    actor.supabase.from("applications").select("id,company_name,role_title").eq("user_id", actor.user.id).order("updated_at", { ascending: false }).limit(100),
  ]);
  if (attempts.error || applications.error) throw new Error("Could not load saved design attempts.");
  return { accountPlatformAvailable, signedIn: true as const, attempts: attempts.data ?? [], applications: applications.data ?? [] };
}

export async function getSystemDesignDashboardSummary() {
  const state = await getSystemDesignWorkspaceState();
  if (!state.signedIn) return null;
  const progress = Object.values(state.progress);
  return {
    practiced: state.attempts.filter((attempt) => attempt.status !== "draft").length,
    drafts: state.attempts.filter((attempt) => attempt.status === "draft").length,
    review: progress.filter((item) => item.status === "review").length,
    comfortable: progress.filter((item) => item.status === "comfortable").length,
    recentAttempt: state.attempts[0] ?? null,
  };
}
