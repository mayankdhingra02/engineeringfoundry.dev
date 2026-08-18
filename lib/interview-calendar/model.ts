export const REMINDER_TYPES = ["prep_3_days", "interview_1_day", "interview_1_hour"] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];
export type CalendarProvider = "ics" | "google";

export const REMINDER_LABELS: Record<ReminderType, string> = {
  prep_3_days: "Preparation · 3 days before",
  interview_1_day: "Interview · 1 day before",
  interview_1_hour: "Interview · 1 hour before",
};

export const ACTIVE_INTERVIEW_STATUSES = ["Planned", "Scheduled", "Rescheduled"] as const;

export type CalendarEventSource = {
  id: string;
  companyName: string;
  roleTitle: string;
  roundName: string;
  roundType: string;
  scheduledAt: string;
  durationMinutes: number | null;
  timezone: string | null;
  meetingLink: string | null;
  location: string | null;
  calendarRevision: number;
};

export function validIanaTimeZone(value: string) {
  if (!value || value.length > 100 || !value.includes("/") && value !== "UTC") return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function calendarEventTitle(event: CalendarEventSource) {
  return `${event.companyName} — ${event.roundType} Interview`;
}

export function formatInTimeZone(value: string, timeZone: string, includeYear = true) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(value));
}

export function formatTimezonePair(value: string, interviewTimezone: string | null, preferredTimezone: string | null) {
  const interviewZone = interviewTimezone || "UTC";
  const interview = formatInTimeZone(value, interviewZone);
  if (!preferredTimezone || preferredTimezone === interviewZone) return { interview, preferred: null };
  const preferred = formatInTimeZone(value, preferredTimezone);
  return preferred === interview ? { interview, preferred: null } : { interview, preferred: `${preferred} your time` };
}

export function monthKey(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone })
    .formatToParts(new Date(value));
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}`;
}

export function dayKey(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone })
    .formatToParts(new Date(value));
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function parseMonth(value: string | undefined, now = new Date()) {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return { year, month };
  }
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export function monthQueryRange(year: number, month: number) {
  return {
    from: new Date(Date.UTC(year, month - 1, 1) - 86_400_000).toISOString(),
    to: new Date(Date.UTC(year, month, 1) + 86_400_000).toISOString(),
  };
}

export function monthCells(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const gridStart = new Date(first.getTime() - first.getUTCDay() * 86_400_000);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getTime() + index * 86_400_000);
    return {
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
    };
  });
}

function icsUtc(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

function foldIcsLine(line: string) {
  const encoder = new TextEncoder();
  const segments: string[] = [];
  let segment = "";
  for (const character of line) {
    if (encoder.encode(segment + character).length > 73) {
      segments.push(segment);
      segment = ` ${character}`;
    } else segment += character;
  }
  segments.push(segment);
  return segments.join("\r\n");
}

export function buildInterviewIcs(event: CalendarEventSource, siteUrl: string, generatedAt = new Date()) {
  const start = new Date(event.scheduledAt);
  const prepareUrl = `${siteUrl.replace(/\/$/, "")}/interviews/${event.id}/prepare`;
  const description = [
    `${event.companyName} · ${event.roleTitle}`,
    `${event.roundType} · ${event.roundName}`,
    `Interview timezone: ${event.timezone || "UTC"}`,
    event.meetingLink ? `Meeting: ${event.meetingLink}` : null,
    `Prepare: ${prepareUrl}`,
  ].filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//Engineering Foundry//Interview Calendar//EN",
    "X-WR-CALNAME:Engineering Foundry Interviews",
    `X-WR-TIMEZONE:${escapeIcs(event.timezone || "UTC")}`,
    "BEGIN:VEVENT",
    `UID:interview-round-${event.id}@engineeringfoundry.dev`,
    `SEQUENCE:${event.calendarRevision}`,
    `DTSTAMP:${icsUtc(generatedAt)}`,
    `DTSTART:${icsUtc(start)}`,
    ...(event.durationMinutes ? [`DTEND:${icsUtc(new Date(start.getTime() + event.durationMinutes * 60_000))}`] : []),
    `SUMMARY:${escapeIcs(calendarEventTitle(event))}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `URL:${escapeIcs(prepareUrl)}`,
    ...(event.location || event.meetingLink ? [`LOCATION:${escapeIcs(event.location || event.meetingLink || "")}`] : []),
    `X-EF-ORIGINAL-TIMEZONE:${escapeIcs(event.timezone || "UTC")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function buildGoogleCalendarUrl(event: CalendarEventSource, siteUrl: string) {
  const start = new Date(event.scheduledAt);
  const duration = event.durationMinutes ?? 60;
  const end = new Date(start.getTime() + duration * 60_000);
  const prepareUrl = `${siteUrl.replace(/\/$/, "")}/interviews/${event.id}/prepare`;
  const details = [
    `${event.companyName} · ${event.roleTitle}`,
    `${event.roundType} · ${event.roundName}`,
    event.durationMinutes ? null : "Duration was not recorded in Engineering Foundry; this calendar event defaults to 60 minutes.",
    event.meetingLink ? `Meeting: ${event.meetingLink}` : null,
    `Continue preparation: ${prepareUrl}`,
  ].filter(Boolean).join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: calendarEventTitle(event),
    dates: `${icsUtc(start)}/${icsUtc(end)}`,
    details,
    ctz: event.timezone || "UTC",
  });
  if (event.location || event.meetingLink) params.set("location", event.location || event.meetingLink || "");
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
