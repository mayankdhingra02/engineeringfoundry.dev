import { NextResponse } from "next/server";
import { buildGoogleCalendarUrl } from "@/lib/interview-calendar/model";
import { getOwnedCalendarInterview } from "@/lib/interview-calendar/queries";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { calendarExportOrigin } from "@/lib/interview-calendar/origin";
import { logServerOperationalFailure } from "@/lib/observability/log";

export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(request: Request, { params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  const [current, round] = await Promise.all([getAuthenticatedActor(), getOwnedCalendarInterview(roundId)]);
  if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401, headers: privateHeaders });
  if (!round) return NextResponse.json({ error: "Interview not found" }, { status: 404, headers: privateHeaders });
  const recorded = await current.supabase.rpc("record_interview_calendar_export", { target_round_id: round.id, provider_value: "google" });
  if (recorded.error || !recorded.data) {
    logServerOperationalFailure("calendar_export_record_failed", recorded.error, { provider: "google" });
    return NextResponse.json({ error: "Calendar export unavailable" }, { status: 500, headers: privateHeaders });
  }
  const event = { id: round.id, companyName: round.application.company_name, roleTitle: round.application.role_title, roundName: round.round_name, roundType: round.round_type, scheduledAt: round.scheduled_at, durationMinutes: round.duration_minutes, timezone: round.timezone, meetingLink: round.meeting_link, location: round.location, calendarRevision: round.calendar_revision };
  // Fixed Google host with encoded parameters; the destination is never derived
  // from request input, so this cannot become an open redirect.
  return NextResponse.redirect(buildGoogleCalendarUrl(event, calendarExportOrigin(request)), { status: 302, headers: privateHeaders });
}
