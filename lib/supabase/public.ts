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
  return { availability: "available" as const, data: data ?? [] };
}
