import { NextResponse } from "next/server";
import { getAccountPreparationContinuations } from "@/lib/preparation-progress/account";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getAccountPreparationContinuations();
  return NextResponse.json(state, {
    status: state.status === "unavailable" ? 503 : 200,
    headers: {
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
