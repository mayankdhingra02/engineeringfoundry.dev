import { NextResponse, type NextRequest } from "next/server";
import { activeBehavioralQuestions } from "@/data/behavioral";
import { activeMlDesignProblems } from "@/data/ml-design";
import { canonicalDsaQuestionById } from "@/lib/dsa/catalog";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { canonicalSystemDesignConceptIds, canonicalSystemDesignProblemIds } from "@/lib/system-design/workspace";
import { parseLocalPreparationProgress } from "@/lib/preparation-progress/local";

export const dynamic = "force-dynamic";

const mlIds = new Set(activeMlDesignProblems.map((item) => item.id));
const behavioralIds = new Set(activeBehavioralQuestions.map((item) => item.id));

export async function POST(request: NextRequest) {
  const actor = await getAuthenticatedActor();
  if (!actor) return NextResponse.json({ error: "Sign in to import browser activity." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  let parsed;
  try { parsed = parseLocalPreparationProgress(await request.json()); }
  catch { return NextResponse.json({ error: "Browser activity could not be read." }, { status: 400, headers: { "Cache-Control": "private, no-store" } }); }

  const { supabase, user } = actor;
  const [dsaExisting, systemExisting, trackExisting] = await Promise.all([
    supabase.from("dsa_question_progress").select("question_id").eq("user_id", user.id),
    supabase.from("system_design_item_progress").select("item_id,item_type").eq("user_id", user.id),
    supabase.from("preparation_track_progress").select("track,item_id").eq("user_id", user.id),
  ]);
  if ([dsaExisting, systemExisting, trackExisting].some((result) => result.error)) return NextResponse.json({ error: "Account progress could not be loaded. Browser activity is unchanged." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });

  const dsaKeys = new Set((dsaExisting.data ?? []).map((item) => item.question_id));
  const systemKeys = new Set((systemExisting.data ?? []).map((item) => `${item.item_type}:${item.item_id}`));
  const trackKeys = new Set((trackExisting.data ?? []).map((item) => `${item.track}:${item.item_id}`));
  const imported: string[] = [];
  const skipped: string[] = [];

  for (const item of parsed.items) {
    const key = `${item.track}:${item.itemId}`;
    if (item.track === "dsa") {
      if (!canonicalDsaQuestionById.has(item.itemId) || dsaKeys.has(item.itemId)) { skipped.push(key); continue; }
      const { error } = await supabase.rpc("save_dsa_question_progress", { target_question_id: item.itemId, target_status: item.status === "completed" ? "review" : "attempted", target_confidence: null, target_bookmarked: false, target_notes: null });
      if (error) { skipped.push(key); continue; }
    } else if (item.track === "system-design") {
      const itemType = canonicalSystemDesignConceptIds.has(item.itemId) ? "concept" : canonicalSystemDesignProblemIds.has(item.itemId) ? "design_problem" : null;
      if (!itemType || systemKeys.has(`${itemType}:${item.itemId}`)) { skipped.push(key); continue; }
      const { error } = await supabase.rpc("save_system_design_item_progress", { target_item_id: item.itemId, target_item_type: itemType, target_status: "reviewed", target_confidence: null, target_bookmarked: false, target_notes: null });
      if (error) { skipped.push(key); continue; }
    } else {
      const valid = item.track === "ml-design" ? mlIds.has(item.itemId) : behavioralIds.has(item.itemId);
      if (!valid || trackKeys.has(key)) { skipped.push(key); continue; }
      const { error } = await supabase.rpc("save_preparation_track_progress", { target_track: item.track, target_item_id: item.itemId, target_status: item.status });
      if (error) { skipped.push(key); continue; }
    }
    imported.push(key);
  }

  return NextResponse.json({ imported, skipped, plansRequireChoice: parsed.plans.length > 0 }, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
