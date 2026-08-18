export function formatApplicationDate(value: string | null) {
  if (!value) return "Not added";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function formatInterviewDate(value: string | null, timeZone?: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: timeZone || undefined, timeZoneName: "short" }).format(new Date(value));
}

export function formatCountdown(value: string, timeZone?: string | null, now = new Date()) {
  const target = new Date(value);
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || undefined, year: "numeric", month: "2-digit", day: "2-digit" });
  const calendarValue = (date: Date) => { const parts = Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])); return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)); };
  const startToday = calendarValue(now);
  const startTarget = calendarValue(target);
  const days = Math.round((startTarget - startToday) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days <= 14) return `In ${days} days`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: timeZone || undefined }).format(target);
}

export function toLocalDateTimeValue(value: string | null, timeZone?: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || undefined, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}
