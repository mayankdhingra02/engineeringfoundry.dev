import { APPLICATION_STATUSES, normalizeCompanySlug, ROUND_RESULTS, ROUND_STATUSES } from "./options";

export type FieldErrors = Record<string, string>;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string, max: number, errors: FieldErrors) {
  const value = text(formData, key);
  if (value.length > max) errors[key] = `Use ${max} characters or fewer.`;
  return value || null;
}

function validHttpUrl(value: string | null) {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}

function validEmail(value: string | null) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validTimeZone(value: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; } catch { return false; }
}

function zonedDateTimeToUtc(localValue: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localValue);
  if (!match || !validTimeZone(timeZone)) return null;
  const desired = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]) };
  let utc = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute);
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(utc)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    utc -= represented - Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute);
  }
  const check = Object.fromEntries(formatter.formatToParts(new Date(utc)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  if (Number(check.year) !== desired.year || Number(check.month) !== desired.month || Number(check.day) !== desired.day || Number(check.hour) !== desired.hour || Number(check.minute) !== desired.minute) return null;
  return new Date(utc).toISOString();
}

export function parseApplicationForm(formData: FormData) {
  const errors: FieldErrors = {};
  const companyName = text(formData, "company_name");
  const roleTitle = text(formData, "role_title");
  if (!companyName || companyName.length > 120) errors.company_name = "Enter a company using 120 characters or fewer.";
  if (!roleTitle || roleTitle.length > 120) errors.role_title = "Enter a role title using 120 characters or fewer.";
  const roleLevel = optional(formData, "role_level", 80, errors);
  const location = optional(formData, "location", 160, errors);
  const jobUrl = optional(formData, "job_url", 1000, errors);
  const source = optional(formData, "source", 100, errors);
  const recruiterName = optional(formData, "recruiter_name", 120, errors);
  const recruiterEmail = optional(formData, "recruiter_email", 254, errors);
  const notes = optional(formData, "notes", 10000, errors);
  const status = text(formData, "status") || "Applied";
  const applicationDate = text(formData, "application_date") || null;
  if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) errors.status = "Choose a valid application status.";
  if (applicationDate && !validDateOnly(applicationDate)) errors.application_date = "Enter a valid application date.";
  if (!validHttpUrl(jobUrl)) errors.job_url = "Enter a complete http or https URL.";
  if (!validEmail(recruiterEmail)) errors.recruiter_email = "Enter a valid recruiter email address.";
  if (Object.keys(errors).length) return { errors };
  return { data: { company_name: companyName, company_slug: normalizeCompanySlug(companyName), role_title: roleTitle, role_level: roleLevel, location, job_url: jobUrl, application_date: applicationDate, source, status, recruiter_name: recruiterName, recruiter_email: recruiterEmail, notes } };
}

export function parseRoundForm(formData: FormData) {
  const errors: FieldErrors = {};
  const roundName = text(formData, "round_name");
  const roundType = text(formData, "round_type");
  if (!roundName || roundName.length > 120) errors.round_name = "Enter a round name using 120 characters or fewer.";
  if (!roundType || roundType.length > 100) errors.round_type = "Enter or choose a round type.";
  const timezone = optional(formData, "timezone", 100, errors);
  const localDateTime = text(formData, "scheduled_local");
  let scheduledAt: string | null = null;
  if (localDateTime) {
    if (!timezone || !validTimeZone(timezone)) errors.timezone = "Choose a valid IANA timezone for this interview.";
    else {
      scheduledAt = zonedDateTimeToUtc(localDateTime, timezone);
      if (!scheduledAt) errors.scheduled_local = "That local date and time does not exist in the selected timezone.";
    }
  }
  const durationRaw = text(formData, "duration_minutes");
  const durationMinutes = durationRaw ? Number(durationRaw) : null;
  if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440)) errors.duration_minutes = "Use a duration between 5 and 1,440 minutes.";
  const interviewerName = optional(formData, "interviewer_name", 120, errors);
  const interviewerRole = optional(formData, "interviewer_role", 120, errors);
  const meetingLink = optional(formData, "meeting_link", 1000, errors);
  const location = optional(formData, "location", 200, errors);
  const notes = optional(formData, "notes", 10000, errors);
  const status = text(formData, "status") || (scheduledAt ? "Scheduled" : "Planned");
  const result = text(formData, "result") || "Pending";
  if (!ROUND_STATUSES.includes(status as (typeof ROUND_STATUSES)[number])) errors.status = "Choose a valid round status.";
  if (!scheduledAt && ["Scheduled", "Rescheduled"].includes(status)) errors.scheduled_local = "Add a date and time for a scheduled interview.";
  if (!ROUND_RESULTS.includes(result as (typeof ROUND_RESULTS)[number])) errors.result = "Choose a valid result.";
  if (!validHttpUrl(meetingLink)) errors.meeting_link = "Enter a complete http or https URL.";
  if (Object.keys(errors).length) return { errors };
  return { data: { round_name: roundName, round_type: roundType, scheduled_at: scheduledAt, duration_minutes: durationMinutes, timezone: timezone || null, interviewer_name: interviewerName, interviewer_role: interviewerRole, meeting_link: meetingLink, location, status, result, notes } };
}
