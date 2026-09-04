import { NextResponse, type NextRequest } from "next/server";
import { activeBehavioralQuestions } from "@/data/behavioral";
import { activeMlDesignProblems } from "@/data/ml-design";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { canonicalDsaQuestionById } from "@/lib/dsa/catalog";
import {
  parsePreparationImportRequest,
  PREPARATION_IMPORT_INVALID_MESSAGE,
  PREPARATION_IMPORT_UNAUTHENTICATED_MESSAGE,
  type PreparationImportItemResult,
  type PreparationImportOutcome,
} from "@/lib/preparation-progress/import";
import { canonicalSystemDesignConceptIds, canonicalSystemDesignProblemIds } from "@/lib/system-design/workspace";

export const dynamic = "force-dynamic";

const mlIds = new Set(activeMlDesignProblems.map((item) => item.id));
const behavioralIds = new Set(activeBehavioralQuestions.map((item) => item.id));
const privateResponseHeaders = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow",
};

function importOutcome(data: unknown, error: unknown): PreparationImportOutcome {
  if (error || typeof data !== "boolean") return "failed";
  return data ? "imported" : "existing";
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: PREPARATION_IMPORT_INVALID_MESSAGE },
      { status: 400, headers: privateResponseHeaders },
    );
  }
  const parsed = parsePreparationImportRequest(payload);
  if (!parsed) {
    return NextResponse.json(
      { error: PREPARATION_IMPORT_INVALID_MESSAGE },
      { status: 400, headers: privateResponseHeaders },
    );
  }

  const actor = await getAuthenticatedActor();
  if (!actor) {
    return NextResponse.json(
      { error: PREPARATION_IMPORT_UNAUTHENTICATED_MESSAGE },
      { status: 401, headers: privateResponseHeaders },
    );
  }

  const results: PreparationImportItemResult[] = [];
  for (const item of parsed.items) {
    let outcome: PreparationImportOutcome = "failed";
    try {
      if (item.track === "dsa") {
        if (canonicalDsaQuestionById.has(item.itemId)) {
          const { data, error } = await actor.supabase.rpc("import_dsa_question_progress_if_absent", {
            target_question_id: item.itemId,
            target_status: item.status === "completed" ? "review" : "attempted",
          });
          outcome = importOutcome(data, error);
        }
      } else if (item.track === "system-design") {
        const itemType = canonicalSystemDesignConceptIds.has(item.itemId)
          ? "concept"
          : canonicalSystemDesignProblemIds.has(item.itemId)
            ? "design_problem"
            : null;
        if (itemType) {
          const { data, error } = await actor.supabase.rpc("import_system_design_item_progress_if_absent", {
            target_item_id: item.itemId,
            target_item_type: itemType,
          });
          outcome = importOutcome(data, error);
        }
      } else {
        const catalogIncludesItem = item.track === "ml-design"
          ? mlIds.has(item.itemId)
          : behavioralIds.has(item.itemId);
        if (catalogIncludesItem) {
          const { data, error } = await actor.supabase.rpc("import_preparation_track_progress_if_absent", {
            target_track: item.track,
            target_item_id: item.itemId,
            target_status: item.status,
          });
          outcome = importOutcome(data, error);
        }
      }
    } catch {
      outcome = "failed";
    }
    results.push({ track: item.track, itemId: item.itemId, outcome });
  }

  return NextResponse.json(
    { results, plansRequireChoice: parsed.plans.length > 0 },
    { headers: privateResponseHeaders },
  );
}
