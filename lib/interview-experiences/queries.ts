import "server-only";

import type { AuthenticatedActor } from "@/lib/auth/actor";
import {
  INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT,
  INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT,
  resolveAdminInterviewExperienceQueue,
  resolveOwnedInterviewExperienceHistory,
} from "./private-state";

export async function getOwnedInterviewExperienceHistory(
  actor: AuthenticatedActor,
  page: number,
) {
  const from = (page - 1) * INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT;
  const result = await actor.supabase
    .from("interview_experiences")
    .select(
      "id,status,company_name,role_title,role_level,region,interview_date,summary,preparation_lessons,public_identity,publication_consent,updated_at,review_note,interview_experience_rounds(position,round_type,topic_labels)",
      { count: "exact" },
    )
    .eq("author_id", actor.user.id)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT - 1);
  return resolveOwnedInterviewExperienceHistory({
    data: result.data,
    error: result.error,
    count: result.count,
  }, page);
}

export async function getAdminInterviewExperienceQueue(
  actor: AuthenticatedActor,
  page: number,
) {
  const from = (page - 1) * INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT;
  const result = await actor.supabase
    .from("interview_experiences")
    .select(
      "id,status,company_name,role_title,role_level,region,interview_date,summary,preparation_lessons,public_identity,publication_consent,submitted_at,updated_at,review_note,interview_experience_rounds(position,round_type,topic_labels,process_notes)",
      { count: "exact" },
    )
    .in("status", ["submitted", "needs_changes"])
    .order("submitted_at", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, from + INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT - 1);
  return resolveAdminInterviewExperienceQueue({
    data: result.data,
    error: result.error,
    count: result.count,
  }, page);
}
