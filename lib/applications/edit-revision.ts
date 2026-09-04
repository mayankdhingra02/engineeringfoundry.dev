export const TRACKER_EDIT_REVISION_FIELD = "expected_updated_at";

export const APPLICATION_EDIT_CONFLICT_MESSAGE =
  "This application may have changed since you opened this page. Your edits were not saved. Review the latest saved version before trying again.";
export const INTERVIEW_ROUND_EDIT_CONFLICT_MESSAGE =
  "This interview round may have changed since you opened this page. Your edits were not saved. Review the latest saved version before trying again.";

export type TrackerEditRevisionParseResult =
  | Readonly<{ ok: true; expectedUpdatedAt: string }>
  | Readonly<{ ok: false; reason: "invalid-input" }>;

const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isDatabaseTimestamp(value: string) {
  const match = DATABASE_TIMESTAMP_PATTERN.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }

  if (zone !== "Z") {
    const offsetHour = Number(offsetHourText);
    const offsetMinute = Number(offsetMinuteText);
    if (offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)) {
      return false;
    }
  }

  return true;
}

export function parseTrackerEditRevision(input: unknown): TrackerEditRevisionParseResult {
  if (!isFormData(input)) return { ok: false, reason: "invalid-input" };

  const revisions = input.getAll(TRACKER_EDIT_REVISION_FIELD);
  if (
    revisions.length !== 1 ||
    typeof revisions[0] !== "string" ||
    !isDatabaseTimestamp(revisions[0])
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  return { ok: true, expectedUpdatedAt: revisions[0] };
}
