/*
THESIS: The calendar is a quiet relay from date awareness to the exact preparation action.
OWN-WORLD: Warm paper, rust actions, workshop green, ink typography, and restrained flat work surfaces.
STORY: Scan the time ribbon, read one active interview dossier, then continue through the chronological agenda.
FIRST VIEWPORT: Compact month controls and date ribbon hand directly to the nearest interview dossier.
FORM: Calendar Relay · surface seed a2c0c71f.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BellRing, CalendarDays, Check, Clock3, ExternalLink, MapPin, Settings2 } from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { dayKey, formatTimezonePair, monthCells, REMINDER_LABELS, type ReminderType } from "@/lib/interview-calendar/model";
import { getInterviewCalendarData, type CalendarInterview, type RoundReminderState } from "@/lib/interview-calendar/queries";

export const metadata: Metadata = { title: "Interview calendar", description: "Your private interview schedule and reminder state.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function query(view: "upcoming" | "month", month: string, focus?: string) {
  const params = new URLSearchParams({ view });
  if (view === "month") params.set("month", month);
  if (focus) params.set("focus", focus);
  return `/calendar?${params}`;
}

function monthShift(year: number, month: number, delta: number) {
  const value = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function reminderSummary(round: CalendarInterview, state: RoundReminderState | undefined, now: Date) {
  const active = (state?.reminders ?? []).filter((item) => item.status === "pending");
  const due = active.filter((item) => new Date(item.scheduled_for) <= now && item.channel === "in_app");
  if (due.length) return `${REMINDER_LABELS[due[0].reminder_type as ReminderType]} is due`;
  if (active.length) return `${active.length} reminder${active.length === 1 ? "" : "s"} scheduled`;
  return round.status === "Completed" ? "Reminder schedule complete" : "No reminders scheduled";
}

function EventActions({ round, state }: { round: CalendarInterview; state?: RoundReminderState }) {
  const exported = new Map((state?.exports ?? []).map((item) => [item.provider, item]));
  return <nav className="calendar-event-actions" aria-label={`Actions for ${round.application.company_name} ${round.round_name}`}>
    <Link className="button" href={`/interviews/${round.id}/prepare`}>Prepare<ArrowRight size={14} /></Link>
    <Link href={`/applications/${round.application_id}`}>View application</Link>
    <a href={`/api/calendar/interviews/${round.id}/ics`}>Download .ics{exported.has("ics") && <Check size={13} aria-label="Previously exported" />}</a>
    <a href={`/api/calendar/interviews/${round.id}/google`} target="_blank" rel="noopener noreferrer">Add to Google Calendar{exported.has("google") && <Check size={13} aria-label="Previously exported" />}</a>
    {round.meeting_link && <a href={round.meeting_link} target="_blank" rel="noopener noreferrer">Open meeting<ExternalLink size={13} /></a>}
  </nav>;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; month?: string; focus?: string }> }) {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  await requireMemberProfile("/calendar");
  const params = await searchParams;
  const now = new Date();
  const data = await getInterviewCalendarData({ view: params.view, month: params.month, now });
  const monthValue = `${data.year}-${String(data.month).padStart(2, "0")}`;
  const preferredZone = data.preference.preferred_timezone;
  const active = data.rounds.find((round) => round.id === params.focus) ?? data.rounds.find((round) => round.status !== "Completed") ?? data.rounds[0];
  const title = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(data.year, data.month - 1, 1)));
  const dateRibbon = [...new Set(data.rounds.map((round) => dayKey(round.scheduled_at, preferredZone || round.timezone || "UTC")))].slice(0, 10);
  const cells = monthCells(data.year, data.month);
  return <main className="calendar-workspace" data-direction-seed="a2c0c71f"><div className="page-width calendar-shell">
    <header className="calendar-header"><div><h1>Interview calendar</h1><p>Keep the next interview, its timezone, and the useful preparation cue in one quiet view.</p></div><Link className="button button-secondary" href="/settings/interviews"><Settings2 size={15} />Reminder settings</Link></header>
    <nav className="calendar-view-switch" aria-label="Calendar view"><Link className={data.view === "upcoming" ? "active" : ""} aria-current={data.view === "upcoming" ? "page" : undefined} href={query("upcoming", monthValue)}>Upcoming</Link><Link className={data.view === "month" ? "active" : ""} aria-current={data.view === "month" ? "page" : undefined} href={query("month", monthValue)}>Month</Link></nav>
    {data.view === "month" && <div className="calendar-month-control"><Link aria-label="Previous month" href={query("month", monthShift(data.year, data.month, -1))}><ArrowLeft size={16} /></Link><strong>{title}</strong><Link aria-label="Next month" href={query("month", monthShift(data.year, data.month, 1))}><ArrowRight size={16} /></Link></div>}
    {dateRibbon.length > 0 && <nav className="calendar-date-ribbon" aria-label="Interview dates">{dateRibbon.map((date) => { const item = data.rounds.find((round) => dayKey(round.scheduled_at, preferredZone || round.timezone || "UTC") === date)!; const selected = active?.id === item.id; const display = new Date(`${date}T12:00:00Z`); return <Link key={date} className={selected ? "active" : ""} href={query(data.view, monthValue, item.id)} aria-current={selected ? "date" : undefined}><span>{new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(display)}</span><strong>{display.getUTCDate()}</strong><small>{new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(display)}</small></Link>; })}</nav>}
    {active ? <section className="calendar-dossier" aria-labelledby="active-interview"><div className="calendar-dossier-main"><div className="calendar-dossier-date"><CalendarDays size={20} aria-hidden="true" /><span>{active.status}</span></div><h2 id="active-interview">{active.application.company_name} — {active.application.role_title}</h2><p>{active.round_type} · {active.round_name}</p>{(() => { const pair = formatTimezonePair(active.scheduled_at, active.timezone, preferredZone); return <div className="calendar-time-pair"><strong>{pair.interview}</strong>{pair.preferred && <span>{pair.preferred}</span>}</div>; })()}<div className="calendar-dossier-meta">{active.duration_minutes && <span><Clock3 size={14} />{active.duration_minutes} minutes</span>}{active.location && <span><MapPin size={14} />{active.location}</span>}</div><EventActions round={active} state={data.state.get(active.id)} /></div><aside><BellRing size={19} /><div><strong>{reminderSummary(active, data.state.get(active.id), now)}</strong><p>{data.preference.in_app_enabled ? "In-app reminders are active for your selected windows." : "In-app reminders are turned off."}</p><Link href="/settings/interviews">Adjust reminders</Link></div></aside></section> : <section className="calendar-empty"><CalendarDays size={24} /><h2>No interviews in this view</h2><p>{data.view === "upcoming" ? "Add a scheduled round when a company confirms the next step." : `No interview rounds fall in ${title}.`}</p><Link className="button" href="/applications">Open applications</Link></section>}
    {data.view === "month" && <section className="calendar-month-grid" aria-label={title}><div className="calendar-weekdays" aria-hidden="true">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-month-cells">{cells.map((cell) => { const events = data.rounds.filter((round) => dayKey(round.scheduled_at, preferredZone || round.timezone || "UTC") === cell.key); return <div key={cell.key} className={`${cell.inMonth ? "" : "outside"} ${events.length ? "has-events" : ""}`}><time dateTime={cell.key}>{cell.day}</time>{events.slice(0, 3).map((round) => <Link key={round.id} className={round.status === "Completed" ? "completed" : ""} href={query("month", monthValue, round.id)}><strong>{round.application.company_name}</strong><span>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: preferredZone || round.timezone || "UTC" }).format(new Date(round.scheduled_at))}</span></Link>)}</div>; })}</div></section>}
    <section className="calendar-agenda"><header><div><h2>{data.view === "upcoming" ? "Upcoming agenda" : `${title} agenda`}</h2><p>Chronological, owner-private, and tied to the original application.</p></div><span>{data.rounds.length} interview{data.rounds.length === 1 ? "" : "s"}</span></header>{data.rounds.length ? <ol>{data.rounds.map((round) => { const pair = formatTimezonePair(round.scheduled_at, round.timezone, preferredZone); return <li key={round.id} className={round.status === "Completed" ? "completed" : ""}><time dateTime={round.scheduled_at}><strong>{new Intl.DateTimeFormat("en", { day: "numeric", timeZone: preferredZone || round.timezone || "UTC" }).format(new Date(round.scheduled_at))}</strong><span>{new Intl.DateTimeFormat("en", { month: "short", timeZone: preferredZone || round.timezone || "UTC" }).format(new Date(round.scheduled_at))}</span></time><div className="calendar-agenda-copy"><div><h3>{round.application.company_name} — {round.application.role_title}</h3><span className="tracker-badge">{round.status}</span></div><p>{round.round_type} · {round.round_name}</p><strong>{pair.interview}</strong>{pair.preferred && <small>{pair.preferred}</small>}<span className="calendar-reminder-line"><BellRing size={13} />{reminderSummary(round, data.state.get(round.id), now)}</span></div><EventActions round={round} state={data.state.get(round.id)} /></li>; })}</ol> : <p className="calendar-agenda-empty">Nothing scheduled here yet.</p>}</section>
    <footer className="calendar-privacy">Calendar exports are manual snapshots, not synchronized connections. Re-export after a reschedule. Private notes are never included.</footer>
  </div></main>;
}
