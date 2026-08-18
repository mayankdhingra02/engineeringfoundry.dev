import { NextResponse } from "next/server";
import { buildInterviewIcs } from "@/lib/interview-calendar/model";
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
  // Ownership resolves through the authenticated actor and RLS. An unowned or
  // unknown round is indistinguishable from a missing one.
  if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401, headers: privateHeaders });
  if (!round) return NextResponse.json({ error: "Interview not found" }, { status: 404, headers: privateHeaders });
  const recorded = await current.supabase.rpc("record_interview_calendar_export", { target_round_id: round.id, provider_value: "ics" });
  if (recorded.error || !recorded.data) {
    logServerOperationalFailure("calendar_export_record_failed", recorded.error, { provider: "ics" });
    return NextResponse.json({ error: "Calendar export unavailable" }, { status: 500, headers: privateHeaders });
  }
  const event = { id: round.id, companyName: round.application.company_name, roleTitle: round.application.role_title, roundName: round.round_name, roundType: round.round_type, scheduledAt: round.scheduled_at, durationMinutes: round.duration_minutes, timezone: round.timezone, meetingLink: round.meeting_link, location: round.location, calendarRevision: round.calendar_revision };
  const ics = buildInterviewIcs(event, calendarExportOrigin(request));
  const filename = `${round.application.company_name}-${round.round_name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "interview";
  return new NextResponse(ics, {
    headers: {
      ...privateHeaders,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
    },
  });
}
