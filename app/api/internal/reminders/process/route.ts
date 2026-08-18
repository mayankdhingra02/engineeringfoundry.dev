import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { reminderWorkerStatus } from "@/lib/config/capabilities";
import { getReminderEmailProvider } from "@/lib/interview-reminders/provider";
import { processDueInterviewReminders } from "@/lib/interview-reminders/worker";
import { logServerOperationalFailure, logServerOperationalWarning } from "@/lib/observability/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

function authorized(header: string | null, secret: string | undefined) {
  if (!header?.startsWith("Bearer ") || !secret) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request) {
  // Fail closed on authentication first. A missing worker secret makes every
  // request unauthorized, so an unconfigured deployment can never expose an
  // anonymously callable worker.
  if (!authorized(request.headers.get("authorization"), process.env.REMINDER_WORKER_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: privateHeaders });
  }

  const worker = reminderWorkerStatus();
  if (!worker.available) {
    logServerOperationalWarning("reminder_worker_unconfigured", { missing: worker.missing.join(",") });
    return NextResponse.json({ error: "Reminder delivery is not configured." }, { status: 503, headers: privateHeaders });
  }

  const admin = createSupabaseAdminClient();
  const provider = getReminderEmailProvider();
  if (!admin || !provider) {
    // No email adapter exists yet, so email delivery is unavailable by design
    // rather than by misconfiguration. In-app reminder state is unaffected.
    logServerOperationalWarning("reminder_email_provider_unavailable");
    return NextResponse.json({ error: "Reminder delivery is not configured." }, { status: 503, headers: privateHeaders });
  }

  try {
    const result = await processDueInterviewReminders({ admin, provider, siteUrl: new URL(request.url).origin });
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (cause) {
    logServerOperationalFailure("reminder_worker_failed", cause);
    return NextResponse.json({ error: "Reminder processing failed." }, { status: 500, headers: privateHeaders });
  }
}
