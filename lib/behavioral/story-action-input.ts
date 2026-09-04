import { STORY_THEMES } from "./options.ts";

export const BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD = "expected_updated_at";
export const BEHAVIORAL_STORY_THEMES_PRESENT_FIELD = "themes_present";

export const BEHAVIORAL_STORY_INVALID_INPUT_ERROR =
  "Review the story fields and try again.";
export const BEHAVIORAL_STORY_CONFLICT_ERROR =
  "This story may have changed since you opened it. Your edits were not saved. Review the latest saved version before trying again.";
export const BEHAVIORAL_STORY_CREATE_ERROR =
  "We couldn't save this story. Review the fields and try again.";
export const BEHAVIORAL_STORY_UPDATE_ERROR =
  "We couldn't update this story. Try again.";
export const BEHAVIORAL_STORY_DUPLICATE_ERROR =
  "We couldn't duplicate this story. It may no longer be available.";

const STORY_INPUT_FIELDS = new Set([
  "title",
  "company_or_context",
  "role",
  "approximate_period",
  "project",
  "situation",
  "task",
  "action",
  "result",
  "reflection",
  "short_summary",
  "notes",
  "themes",
  BEHAVIORAL_STORY_THEMES_PRESENT_FIELD,
  BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD,
]);
const THEME_SET = new Set<string>(STORY_THEMES);
const MULTILINE_FIELDS = new Set([
  "situation",
  "task",
  "action",
  "result",
  "reflection",
  "short_summary",
  "notes",
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

const STORY_TEXT_FIELDS = [
  ["title", 200, "Story title"],
  ["company_or_context", 200, "Company or context"],
  ["role", 160, "Role"],
  ["approximate_period", 100, "Approximate period"],
  ["project", 200, "Project"],
  ["situation", 50_000, "Situation"],
  ["task", 50_000, "Task"],
  ["action", 50_000, "Action"],
  ["result", 50_000, "Result"],
  ["reflection", 50_000, "Reflection"],
  ["short_summary", 5_000, "Summary"],
  ["notes", 50_000, "Notes"],
] as const;

export type BehavioralStoryFieldErrors = Record<string, string>;

export type BehavioralStoryInput = Readonly<{
  title: string;
  company_or_context: string | null;
  role: string | null;
  approximate_period: string | null;
  project: string | null;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  reflection: string | null;
  short_summary: string | null;
  notes: string | null;
}>;

export type BehavioralStoryActionInput = Readonly<{
  storyId: string | null;
  expectedUpdatedAt: string | null;
  story: BehavioralStoryInput;
  themes: readonly (typeof STORY_THEMES)[number][];
}>;

export type BehavioralStoryActionMode =
  | Readonly<{ kind: "create" }>
  | Readonly<{ kind: "edit"; storyId: unknown }>;

export type BehavioralStoryActionInputResult =
  | Readonly<{ ok: true; value: BehavioralStoryActionInput }>
  | Readonly<{
      ok: false;
      reason: "invalid-input";
      fieldErrors?: BehavioralStoryFieldErrors;
    }>;

export type BehavioralStoryMutationResult =
  | Readonly<{ status: "saved"; storyId: string; updatedAt: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid" }>;

type SingleString =
  | Readonly<{ status: "value"; value: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid" }>;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(formData: FormData) {
  for (const key of formData.keys()) {
    if (!STORY_INPUT_FIELDS.has(key) && !key.startsWith("$ACTION_")) {
      return false;
    }
  }
  return true;
}

function singleString(
  formData: FormData,
  name: string,
  required = true,
): SingleString {
  const values = formData.getAll(name);
  if (values.length === 0 && !required) return { status: "missing" };
  if (values.length !== 1 || typeof values[0] !== "string") {
    return { status: "invalid" };
  }
  return { status: "value", value: values[0] };
}

function containsDisallowedTextControl(
  value: string,
  allowMultilineWhitespace: boolean,
) {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const allowedWhitespace =
      allowMultilineWhitespace &&
      (codePoint === 9 || codePoint === 10 || codePoint === 13);
    if (
      (!allowedWhitespace && codePoint <= 31) ||
      (codePoint >= 127 && codePoint <= 159)
    ) {
      return true;
    }
  }
  return false;
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseCanonicalBehavioralStoryId(value: unknown) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) return null;
  return value.toLowerCase();
}

export function isCanonicalBehavioralStoryRevision(
  value: unknown,
): value is string {
  if (typeof value !== "string") return false;
  const match = DATABASE_TIMESTAMP_PATTERN.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    zone,
    ,
    offsetHourText,
    offsetMinuteText,
  ] = match;
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
    if (
      offsetHour > 14 ||
      offsetMinute > 59 ||
      (offsetHour === 14 && offsetMinute !== 0)
    ) {
      return false;
    }
  }
  return true;
}

export function parseBehavioralStoryActionInput(
  input: unknown,
  mode: BehavioralStoryActionMode,
): BehavioralStoryActionInputResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input)) {
    return { ok: false, reason: "invalid-input" };
  }

  const storyId =
    mode.kind === "edit"
      ? parseCanonicalBehavioralStoryId(mode.storyId)
      : null;
  const revisionValues = input.getAll(BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD);
  const revision =
    mode.kind === "edit"
      ? singleString(input, BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD)
      : revisionValues.length === 0
        ? ({ status: "missing" } as const)
        : ({ status: "invalid" } as const);
  const themesPresent = singleString(
    input,
    BEHAVIORAL_STORY_THEMES_PRESENT_FIELD,
  );
  const rawThemes = input.getAll("themes");
  if (
    (mode.kind === "edit" &&
      (!storyId ||
        revision.status !== "value" ||
        !isCanonicalBehavioralStoryRevision(revision.value))) ||
    (mode.kind === "create" && revision.status !== "missing") ||
    themesPresent.status !== "value" ||
    themesPresent.value !== "true" ||
    rawThemes.some((theme) => typeof theme !== "string")
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const fieldErrors: BehavioralStoryFieldErrors = {};
  const storyEntries: Array<readonly [string, string | null]> = [];
  for (const [name, maximum, label] of STORY_TEXT_FIELDS) {
    const field = singleString(input, name);
    if (field.status !== "value") {
      return { ok: false, reason: "invalid-input" };
    }
    const value = field.value.trim();
    if (containsDisallowedTextControl(value, MULTILINE_FIELDS.has(name))) {
      fieldErrors[name] = `${label} contains unsupported control characters.`;
    } else if (name === "title" && Array.from(value).length < 2) {
      fieldErrors.title = "Add a title between 2 and 200 characters.";
    } else if (Array.from(value).length > maximum) {
      fieldErrors[name] =
        name === "title"
          ? "Add a title between 2 and 200 characters."
          : `${label} must be ${maximum.toLocaleString()} characters or fewer.`;
    }
    storyEntries.push([name, name === "title" ? value : value || null]);
  }

  const themes = rawThemes as string[];
  if (
    themes.length > STORY_THEMES.length ||
    new Set(themes).size !== themes.length ||
    themes.some((theme) => !THEME_SET.has(theme))
  ) {
    fieldErrors.themes = "Choose themes from the supported list without duplicates.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, reason: "invalid-input", fieldErrors };
  }

  return {
    ok: true,
    value: {
      storyId,
      expectedUpdatedAt:
        revision.status === "value" ? revision.value : null,
      story: Object.fromEntries(storyEntries) as BehavioralStoryInput,
      themes: themes as (typeof STORY_THEMES)[number][],
    },
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function parseBehavioralStoryMutationResult(
  value: unknown,
  expectedStoryId?: string,
): BehavioralStoryMutationResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "missing" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }

  const keys = Reflect.ownKeys(value[0]);
  const storyId = parseCanonicalBehavioralStoryId(value[0].story_id);
  if (
    keys.length !== 2 ||
    !keys.includes("story_id") ||
    !keys.includes("updated_at") ||
    !storyId ||
    (expectedStoryId !== undefined && storyId !== expectedStoryId) ||
    !isCanonicalBehavioralStoryRevision(value[0].updated_at)
  ) {
    return { status: "invalid" };
  }

  return {
    status: "saved",
    storyId,
    updatedAt: value[0].updated_at,
  };
}
