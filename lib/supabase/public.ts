import "server-only";

import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/account-platform";
import type { Database } from "./database.types";

export type PublicInterviewExperienceAvailability = "available" | "unavailable" | "unconfigured";

const publicExperienceProjection = "id,company_name,role_title,role_level,region,interview_date,summary,preparation_lessons,public_identity,interview_experience_rounds(round_type,topic_labels)";

/**
 * Sessionless client for explicitly public reads and narrowly granted RPCs.
 * It never receives request cookies or upgrades to the authenticated role.
 */
export function createSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isSupabaseConfigured() || !url || !key) return null;
  return createClient<Database, "public">(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function listPublicInterviewExperiences({ companyName, limit = 30 }: { companyName?: string; limit?: number } = {}) {
  const client = createSupabasePublicClient();
  if (!client) return { availability: "unconfigured" as const, data: [] };

  let query = client
    .from("interview_experiences")
    .select(publicExperienceProjection)
    .eq("status", "approved")
    .eq("publication_consent", true)
    .order("interview_date", { ascending: false, nullsFirst: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (companyName) query = query.eq("company_name", companyName);

  const { data, error } = await query;
  if (error) return { availability: "unavailable" as const, data: [] };
  const reports = data ?? [];
  const attributedIds = reports
    .filter((report) => report.public_identity === "username")
    .map((report) => report.id);
  if (!attributedIds.length) {
    return {
      availability: "available" as const,
      data: reports.map((report) => ({
        ...report,
        public_author_username: null,
      })),
    };
  }

  const attribution = await client.rpc(
    "list_public_interview_experience_authors",
    { target_experience_ids: attributedIds },
  );
  if (attribution.error) {
    return { availability: "unavailable" as const, data: [] };
  }
  const usernameByExperience = new Map(
    (attribution.data ?? []).map((item) => [item.experience_id, item.username]),
  );
  return {
    availability: "available" as const,
    data: reports.map((report) => ({
      ...report,
      public_author_username: usernameByExperience.get(report.id) ?? null,
    })),
  };
}
