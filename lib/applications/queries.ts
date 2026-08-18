import "server-only";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { Application, InterviewRound } from "@/lib/supabase/database.types";
import { UPCOMING_ROUND_STATUSES } from "./options";
import { isUpcomingInterview } from "./insights";

export type ApplicationWithRounds = Pick<Application, "id" | "company_name" | "company_slug" | "role_title" | "role_level" | "application_date" | "status" | "updated_at"> & {
  interview_rounds: Array<Pick<InterviewRound, "id" | "round_number" | "round_name" | "round_type" | "scheduled_at" | "timezone" | "status" | "result" | "created_at">>;
};
export type ApplicationDetailWithRounds = Application & { interview_rounds: InterviewRound[] };
export type DashboardApplication = Pick<Application, "id" | "company_name" | "role_title" | "status" | "updated_at">;
export type UpcomingInterview = Pick<InterviewRound, "id" | "round_name" | "round_type" | "scheduled_at" | "timezone" | "status"> & {
  application: Pick<Application, "id" | "company_name" | "company_slug" | "role_title" | "status">;
};

// The composite relationship is intentional: it lets PostgREST embed only
// rounds whose application and owner match. The explicit hint also prevents
// ambiguity with the earlier single-column application foreign key.
const applicationSummarySelection = "id,company_name,company_slug,role_title,role_level,application_date,status,updated_at,interview_rounds!interview_rounds_application_owner_fkey(id,round_number,round_name,round_type,scheduled_at,timezone,status,result,created_at)";
const applicationDetailSelection = "id,user_id,company_name,company_slug,company_logo_url,role_title,role_level,location,job_url,application_date,source,status,recruiter_name,recruiter_email,notes,created_at,updated_at,interview_rounds!interview_rounds_application_owner_fkey(id,application_id,user_id,round_number,round_name,round_type,scheduled_at,duration_minutes,timezone,interviewer_name,interviewer_role,meeting_link,location,status,result,notes,created_at,updated_at)";

export async function getApplications(): Promise<ApplicationWithRounds[]> {
  const current = await getAuthenticatedActor();
  if (!current) throw new PrivateDataUnavailableError("application");
  const { data, error } = await current.supabase.from("applications").select(applicationSummarySelection).eq("user_id", current.user.id).order("updated_at", { ascending: false });
  if (error) throw new PrivateDataUnavailableError("application");
  return (data ?? []) as unknown as ApplicationWithRounds[];
}

export async function getApplicationById(applicationId: string): Promise<ApplicationDetailWithRounds | null> {
  const current = await getAuthenticatedActor();
  if (!current) throw new PrivateDataUnavailableError("application");
  const { data, error } = await current.supabase.from("applications").select(applicationDetailSelection).eq("id", applicationId).eq("user_id", current.user.id).maybeSingle();
  if (error) throw new PrivateDataUnavailableError("application");
  if (!data) return null;
  const application = data as unknown as ApplicationDetailWithRounds;
  application.interview_rounds.sort((a, b) => a.round_number - b.round_number || a.created_at.localeCompare(b.created_at));
  return application;
}

export async function getDashboardPipeline(limit = 4, now = new Date()) {
  const current = await getAuthenticatedActor();
  if (!current) throw new PrivateDataUnavailableError("application");
  const scheduledAfter = now.toISOString();
  const activeRoundStatuses = [...UPCOMING_ROUND_STATUSES];
  const [applicationsResult, upcomingResult, scheduledCountResult] = await Promise.all([
    current.supabase
      .from("applications")
      .select("id,company_name,role_title,status,updated_at")
      .eq("user_id", current.user.id)
      .order("updated_at", { ascending: false }),
    current.supabase
      .from("interview_rounds")
      .select("id,round_name,round_type,scheduled_at,timezone,status,application:applications!interview_rounds_application_owner_fkey(id,company_name,company_slug,role_title,status)")
      .eq("user_id", current.user.id)
      .gte("scheduled_at", scheduledAfter)
      .in("status", activeRoundStatuses)
      .order("scheduled_at", { ascending: true })
      .limit(limit),
    current.supabase
      .from("interview_rounds")
      .select("id", { count: "exact", head: true })
      .eq("user_id", current.user.id)
      .gte("scheduled_at", scheduledAfter)
      .in("status", activeRoundStatuses),
  ]);
  if (applicationsResult.error || upcomingResult.error || scheduledCountResult.error) {
    throw new PrivateDataUnavailableError("application");
  }
  return {
    applications: (applicationsResult.data ?? []) as DashboardApplication[],
    upcoming: (upcomingResult.data ?? []) as unknown as UpcomingInterview[],
    scheduledCount: scheduledCountResult.count ?? 0,
  };
}

export function upcomingRounds(applications: ApplicationWithRounds[], limit = 5, now = new Date()) {
  return applications.flatMap((application) => application.interview_rounds.map((round) => ({ application, round })))
    .filter(({ round }) => isUpcomingInterview(round, now))
    .sort((a, b) => new Date(a.round.scheduled_at as string).getTime() - new Date(b.round.scheduled_at as string).getTime())
    .slice(0, limit);
}
