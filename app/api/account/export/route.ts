import { NextResponse } from "next/server";
import { buildAccountExport } from "@/lib/account/export";
import {
  ACCOUNT_EXPORT_RATE_LIMIT,
  consumeAccountActionRateLimit,
  describeRetryAfter,
} from "@/lib/account/rate-limit";
import { getAuthenticatedActorState } from "@/lib/auth/actor";
import { logServerOperationalFailure } from "@/lib/observability/log";

export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET() {
  const actorState = await getAuthenticatedActorState();
  if (actorState.state === "unavailable") return NextResponse.json({ error: "Account session unavailable. Try again." }, { status: 503, headers: privateHeaders });
  if (actorState.state === "anonymous") return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: privateHeaders });
  const actor = actorState.actor;

  // Server-authoritative throttle. The budget is owned by the authenticated
  // actor in Postgres, so it cannot be reset by clearing a cookie.
  const decision = await consumeAccountActionRateLimit(actor, ACCOUNT_EXPORT_RATE_LIMIT);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: `You have generated several exports recently. Try again ${describeRetryAfter(decision.retryAfterSeconds)}.` },
      {
        status: 429,
        headers: { ...privateHeaders, "Retry-After": String(decision.retryAfterSeconds) },
      },
    );
  }

  try {
    const payload = await buildAccountExport(actor);
    const day = new Date().toISOString().slice(0, 10);
    return new NextResponse(`${JSON.stringify(payload, null, 2)}\n`, {
      status: 200,
      headers: {
        ...privateHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="engineering-foundry-export-${day}.json"`,
      },
    });
  } catch (cause) {
    logServerOperationalFailure("account_export_failed", cause);
    return NextResponse.json({ error: "We couldn’t generate the export. Try again." }, { status: 500, headers: privateHeaders });
  }
}
