import "server-only";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { InterviewCalendarExport, InterviewReminder, InterviewReminderPreference } from "@/lib/supabase/database.types";
import { ACTIVE_INTERVIEW_STATUSES, monthQueryRange, parseMonth } from "./model";

export type CalendarInterview = {
  id: string;
  application_id: string;
  round_name: string;
  round_type: string;
  scheduled_at: string;
  duration_minutes: number | null;
  timezone: string | null;
  meeting_link: string | null;
  location: string | null;
  status: string;
  calendar_revision: number;
  reminder_schedule_revision: number;
  application: { id: string; company_name: string; role_title: string; status: string };
};

export type RoundReminderState = {
  reminders: InterviewReminder[];
  exports: InterviewCalendarExport[];
};

const selection = "id,application_id,round_name,round_type,scheduled_at,duration_minutes,timezone,meeting_link,location,status,calendar_revision,reminder_schedule_revision,application:applications!interview_rounds_application_owner_fkey(id,company_name,role_title,status)";

function defaults(userId: string): InterviewReminderPreference {
  const now = new Date(0).toISOString();
  return { user_id: userId, preferred_timezone: null, in_app_enabled: true, prep_3_days_enabled: true, interview_1_day_enabled: true, interview_1_hour_enabled: true, email_enabled: false, created_at: now, updated_at: now };
}

export async function getInterviewCalendarData(input: { view?: string; month?: string; now?: Date } = {}) {
  const current = await getAuthenticatedActor();
  if (!current) throw new PrivateDataUnavailableError("calendar");
  const now = input.now ?? new Date();
  const view: "month" | "upcoming" = input.view === "month" ? "month" : "upcoming";
  const parsed = parseMonth(input.month, now);
  const range = view === "month"
    ? monthQueryRange(parsed.year, parsed.month)
    : { from: now.toISOString(), to: new Date(now.getTime() + 180 * 86_400_000).toISOString() };
  let query = current.supabase.from("interview_rounds").select(selection)
    .eq("user_id", current.user.id)
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", range.from)
    .lt("scheduled_at", range.to)
    .neq("status", "Cancelled")
    .order("scheduled_at", { ascending: true })
    .limit(view === "month" ? 200 : 100);
  if (view === "upcoming") query = query.in("status", [...ACTIVE_INTERVIEW_STATUSES]);
  const [roundResult, preferenceResult] = await Promise.all([
    query,
    current.supabase.from("interview_reminder_preferences").select("*").eq("user_id", current.user.id).maybeSingle(),
  ]);
  if (roundResult.error || preferenceResult.error) throw new PrivateDataUnavailableError("calendar");
  const rounds = (roundResult.data ?? []) as unknown as CalendarInterview[];
  const ids = rounds.map((round) => round.id);
  const [reminderResult, exportResult] = ids.length ? await Promise.all([
    current.supabase.from("interview_reminders").select("*").eq("user_id", current.user.id).in("round_id", ids).order("scheduled_for", { ascending: true }),
    current.supabase.from("interview_calendar_exports").select("*").eq("user_id", current.user.id).in("round_id", ids),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (reminderResult.error || exportResult.error) throw new PrivateDataUnavailableError("calendar");
  const state = new Map<string, RoundReminderState>();
  for (const round of rounds) state.set(round.id, { reminders: [], exports: [] });
  for (const reminder of (reminderResult.data ?? []) as InterviewReminder[]) {
    const round = rounds.find((item) => item.id === reminder.round_id);
    if (round && reminder.schedule_revision === round.reminder_schedule_revision) state.get(reminder.round_id)?.reminders.push(reminder);
  }
  for (const item of (exportResult.data ?? []) as InterviewCalendarExport[]) state.get(item.round_id)?.exports.push(item);
  return { view, year: parsed.year, month: parsed.month, rounds, preference: (preferenceResult.data as InterviewReminderPreference | null) ?? defaults(current.user.id), state };
}

export async function getOwnedCalendarInterview(roundId: string): Promise<CalendarInterview | null> {
  const current = await getAuthenticatedActor();
  if (!current) return null;
  const { data, error } = await current.supabase.from("interview_rounds").select(selection).eq("id", roundId).eq("user_id", current.user.id).maybeSingle();
  if (error) throw new PrivateDataUnavailableError("calendar");
  return data as unknown as CalendarInterview | null;
}

export async function getRoundReminderStates(roundIds: string[]) {
  const current = await getAuthenticatedActor();
  if (!current || !roundIds.length) return new Map<string, InterviewReminder[]>();
  const { data, error } = await current.supabase.from("interview_reminders").select("*").eq("user_id", current.user.id).in("round_id", roundIds).in("status", ["pending", "delivered"]).order("scheduled_for", { ascending: true });
  if (error) throw new PrivateDataUnavailableError("calendar");
  const result = new Map<string, InterviewReminder[]>();
  for (const reminder of (data ?? []) as InterviewReminder[]) result.set(reminder.round_id, [...(result.get(reminder.round_id) ?? []), reminder]);
  return result;
}
