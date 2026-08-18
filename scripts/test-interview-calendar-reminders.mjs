import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildGoogleCalendarUrl, buildInterviewIcs, dayKey, monthCells, monthQueryRange, parseMonth, validIanaTimeZone } from "../lib/interview-calendar/model.ts";

const read = (file) => readFileSync(join(process.cwd(), file), "utf8");
const migration = read("supabase/migrations/202608140012_create_interview_calendar_reminders.sql");
const calendar = read("app/calendar/page.tsx");
const settings = read("app/settings/interviews/page.tsx");
const actions = read("features/interview-calendar/actions.ts");
const queries = read("lib/interview-calendar/queries.ts");
const icsRoute = read("app/api/calendar/interviews/[roundId]/ics/route.ts");
const googleRoute = read("app/api/calendar/interviews/[roundId]/google/route.ts");
const workerRoute = read("app/api/internal/reminders/process/route.ts");
const provider = read("lib/interview-reminders/provider.ts");
const worker = read("lib/interview-reminders/worker.ts");
const email = read("lib/interview-reminders/email.ts");
const globals = read("app/globals.css");
const dashboard = read("app/dashboard/page.tsx");
const application = read("app/applications/[id]/page.tsx");
const prep = read("app/interviews/[roundId]/prepare/page.tsx");
const event = { id: "11111111-1111-4111-8111-111111111111", companyName: "A, B; Co", roleTitle: "Senior Engineer", roundName: "Architecture\nPanel", roundType: "System Design", scheduledAt: "2026-08-19T19:00:00.000Z", durationMinutes: 75, timezone: "America/Chicago", meetingLink: "https://meet.example.test/room", location: "Remote", calendarRevision: 4 };
const ics = buildInterviewIcs(event, "https://engineeringfoundry.dev", new Date("2026-08-14T12:00:00Z"));
const unfoldedIcs = ics.replaceAll("\r\n ", "");
const google = new URL(buildGoogleCalendarUrl(event, "https://engineeringfoundry.dev"));
const cases = [
  ["UTC timezone valid", validIanaTimeZone("UTC")], ["IANA timezone valid", validIanaTimeZone("America/Chicago")], ["bogus timezone rejected", !validIanaTimeZone("Central")], ["empty timezone rejected", !validIanaTimeZone("")],
  ["month parser accepts valid", parseMonth("2026-08").month === 8], ["month parser rejects 13", parseMonth("2026-13", new Date("2025-02-01Z")).month === 2], ["month query has padding", Date.parse(monthQueryRange(2026, 8).from) < Date.parse("2026-08-01T00:00:00Z")], ["month grid is six weeks", monthCells(2026, 8).length === 42], ["day key respects zone", dayKey("2026-08-01T01:00:00Z", "America/Chicago") === "2026-07-31"],
  ["ICS envelope", ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n")], ["ICS stable UID", unfoldedIcs.includes(`UID:interview-round-${event.id}@engineeringfoundry.dev`)], ["ICS revision", ics.includes("SEQUENCE:4")], ["ICS UTC start", ics.includes("DTSTART:20260819T190000Z")], ["ICS accurate end", ics.includes("DTEND:20260819T201500Z")], ["ICS escaping", ics.includes("A\\, B\\; Co")], ["ICS folding", !ics.split("\r\n").some((line) => new TextEncoder().encode(line).length > 75)], ["ICS timezone", ics.includes("X-EF-ORIGINAL-TIMEZONE:America/Chicago")], ["ICS prepare URL", unfoldedIcs.includes(`/interviews/${event.id}/prepare`)], ["ICS no private notes", !ics.toLowerCase().includes("private notes")],
  ["Google template", google.searchParams.get("action") === "TEMPLATE"], ["Google UTC dates", google.searchParams.get("dates") === "20260819T190000Z/20260819T201500Z"], ["Google timezone", google.searchParams.get("ctz") === "America/Chicago"], ["Google location", google.searchParams.get("location") === "Remote"],
  ["private dynamic calendar", calendar.includes('dynamic = "force-dynamic"')], ["calendar guard", calendar.includes("requireMemberProfile")], ["calendar views", calendar.includes('>Upcoming<') && calendar.includes('>Month<')], ["calendar omits notes", !calendar.includes("round.notes")], ["dual timezone", calendar.includes("formatTimezonePair")], ["prepare primary", calendar.includes('className="button" href={`/interviews/${round.id}/prepare`}')], ["manual snapshot copy", calendar.includes("manual snapshots")], ["mobile list fallback", globals.includes(".calendar-month-grid { display: none; }")],
  ["settings guard", settings.includes("requireMemberProfile")], ["settings opt-out", settings.includes("All timing options can be turned off")], ["server timezone validation", actions.includes("validIanaTimeZone")], ["server actor derived", actions.includes("getAuthenticatedActor") && !actions.includes("user_id:" )],
  ["query owner scoped", queries.includes('.eq("user_id", current.user.id)')], ["query bounded", queries.includes(".limit(view === \"month\" ? 200 : 100)")], ["query batches", queries.includes('.in("round_id", ids)')], ["ICS ownership", icsRoute.includes("getOwnedCalendarInterview")], ["ICS audit", icsRoute.includes("record_interview_calendar_export")], ["ICS no-store", icsRoute.includes("private, no-store")], ["Google ownership", googleRoute.includes("getOwnedCalendarInterview")], ["Google audit", googleRoute.includes("record_interview_calendar_export")],
  ["worker POST", workerRoute.includes("export async function POST") && !workerRoute.includes("export async function GET")], ["constant-time secret", workerRoute.includes("timingSafeEqual")], ["worker 401", workerRoute.includes("status: 401")], ["worker 503", workerRoute.includes("status: 503")], ["no fake provider", provider.includes("return null")], ["claim revalidated", worker.indexOf("validate_interview_reminder_claim") < worker.indexOf("provider.send")], ["stable idempotency", worker.includes("idempotencyKey: claim.reminder_id")], ["settings link in email", email.includes("/settings/interviews")], ["email no private content", !email.includes("private_notes") && !email.includes("answer_text")],
  ["preference schema", migration.includes("create table public.interview_reminder_preferences")], ["reminder schema", migration.includes("create table public.interview_reminders")], ["export schema", migration.includes("create table public.interview_calendar_exports")], ["logical uniqueness", migration.includes("interview_reminders_unique_logical")], ["reschedule revision", migration.includes("new.reminder_schedule_revision := old.reminder_schedule_revision + 1")], ["cancel suppresses", migration.includes("rounds.status in ('Planned', 'Scheduled', 'Rescheduled')")], ["concurrent claim lock", migration.includes("for update of reminders skip locked")], ["lease recovery", migration.includes("claim_expired") && migration.includes("interval '10 minutes'")], ["bounded retry", migration.includes("attempt_count between 0 and 3") && migration.includes("interval '30 minutes'")], ["service worker", migration.includes("to service_role")], ["RLS all tables", ["interview_reminder_preferences", "interview_reminders", "interview_calendar_exports"].every((table) => migration.includes(`alter table public.${table} enable row level security`))],
  ["dashboard integrated", dashboard.includes("reminderStates") && dashboard.includes('href="/calendar"')], ["application integrated", application.includes("reminders scheduled") && application.includes("Add to Google Calendar")], ["preparation integrated", prep.includes("prep-calendar-cue") && prep.includes("Reminder settings")],
];
for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview calendar and reminders qualification passed (${cases.length} cases).`);
