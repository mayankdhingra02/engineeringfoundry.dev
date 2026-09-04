import { normalizeCompanySlug } from "../applications/options.ts";
import { ANSWER_STATUSES } from "./options.ts";

export const BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD = "expected_updated_at";
export const BEHAVIORAL_ANSWER_PRIMARY_PRESENT_FIELD = "is_primary_present";
export const BEHAVIORAL_ANSWER_FACT_CONFIRMATION_PRESENT_FIELD =
  "fact_integrity_confirmed_present";

export const BEHAVIORAL_ANSWER_INVALID_INPUT_ERROR =
  "Review the highlighted fields.";
export const BEHAVIORAL_ANSWER_CONFLICT_ERROR =
  "This answer may have changed since you opened it. Your edits were not saved. Review the latest saved version before trying again.";
export const BEHAVIORAL_ANSWER_CREATE_ERROR =
  "We couldn't save this preparation. Check linked records and try again.";
export const BEHAVIORAL_ANSWER_UPDATE_ERROR =
  "We couldn't update this answer.";

const ANSWER_INPUT_FIELDS = new Set([
  "title",
  "status",
  "company_slug",
  "application_id",
  "story_id",
  "is_primary",
  BEHAVIORAL_ANSWER_PRIMARY_PRESENT_FIELD,
  "opening_framing",
  "details_to_emphasize",
  "details_to_avoid",
  "notes",
  "answer_text",
  "fact_integrity_confirmed",
  BEHAVIORAL_ANSWER_FACT_CONFIRMATION_PRESENT_FIELD,
  BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD,
]);
const ANSWER_STATUS_SET = new Set<string>(ANSWER_STATUSES);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

const ANSWER_TEXT_FIELDS = [
  ["opening_framing", 10_000, "Opening framing"],
  ["details_to_emphasize", 20_000, "Details to emphasize"],
  ["details_to_avoid", 20_000, "Details to avoid"],
  ["notes", 50_000, "Notes"],
  ["answer_text", 50_000, "Full rehearsal draft"],
] as const;

export type BehavioralAnswerFieldErrors = Record<string, string>;

export type BehavioralAnswerInput = Readonly<{
  title: string;
  answer_text: string;
  opening_framing: string | null;
  details_to_emphasize: string | null;
  details_to_avoid: string | null;
  notes: string | null;
  status: (typeof ANSWER_STATUSES)[number];
  company_slug: string | null;
  story_id: string;
  application_id: string | null;
}>;

export type BehavioralAnswerActionInput = Readonly<{
  questionId: string;
  answerId: string | null;
  expectedUpdatedAt: string | null;
  answer: BehavioralAnswerInput;
  isPrimary: boolean;
  factIntegrityConfirmed: boolean;
}>;

export type BehavioralAnswerActionMode =
  | Readonly<{ kind: "create"; questionId: unknown }>
  | Readonly<{ kind: "edit"; questionId: unknown; answerId: unknown }>;

export type BehavioralAnswerActionInputResult =
  | Readonly<{ ok: true; value: BehavioralAnswerActionInput }>
  | Readonly<{
      ok: false;
      reason: "invalid-input";
      fieldErrors?: BehavioralAnswerFieldErrors;
    }>;

export type BehavioralAnswerMutationResult =
  | Readonly<{ status: "saved"; answerId: string; updatedAt: string }>
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
    if (!ANSWER_INPUT_FIELDS.has(key) && !key.startsWith("$ACTION_")) {
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

export function parseCanonicalBehavioralAnswerId(value: unknown) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) return null;
  return value.toLowerCase();
}

export function parseBehavioralAnswerQuestionId(
  value: unknown,
  canonicalCuratedQuestionIds: ReadonlySet<string>,
) {
  if (typeof value !== "string") return null;
  if (canonicalCuratedQuestionIds.has(value)) return value;
  return parseCanonicalBehavioralAnswerId(value);
}

export function isCanonicalBehavioralAnswerRevision(
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

export function parseBehavioralAnswerActionInput(
  input: unknown,
  mode: BehavioralAnswerActionMode,
  canonicalCuratedQuestionIds: ReadonlySet<string>,
): BehavioralAnswerActionInputResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input)) {
    return { ok: false, reason: "invalid-input" };
  }

  const questionId = parseBehavioralAnswerQuestionId(
    mode.questionId,
    canonicalCuratedQuestionIds,
  );
  const answerId =
    mode.kind === "edit"
      ? parseCanonicalBehavioralAnswerId(mode.answerId)
      : null;
  const revisionValues = input.getAll(BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD);
  const revision =
    mode.kind === "edit"
      ? singleString(input, BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD)
      : revisionValues.length === 0
        ? ({ status: "missing" } as const)
        : ({ status: "invalid" } as const);
  const primary = singleString(input, "is_primary", false);
  const primaryPresent = singleString(
    input,
    BEHAVIORAL_ANSWER_PRIMARY_PRESENT_FIELD,
  );
  const factConfirmation = singleString(
    input,
    "fact_integrity_confirmed",
    false,
  );
  const factConfirmationPresent = singleString(
    input,
    BEHAVIORAL_ANSWER_FACT_CONFIRMATION_PRESENT_FIELD,
  );

  if (
    !questionId ||
    (mode.kind === "edit" &&
      (!answerId ||
        revision.status !== "value" ||
        !isCanonicalBehavioralAnswerRevision(revision.value))) ||
    (mode.kind === "create" && revision.status !== "missing") ||
    primaryPresent.status !== "value" ||
    primaryPresent.value !== "true" ||
    primary.status === "invalid" ||
    (primary.status === "value" && primary.value !== "on") ||
    factConfirmationPresent.status !== "value" ||
    factConfirmationPresent.value !== "true" ||
    factConfirmation.status === "invalid" ||
    (factConfirmation.status === "value" && factConfirmation.value !== "on")
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const title = singleString(input, "title");
  const status = singleString(input, "status");
  const company = singleString(input, "company_slug");
  const storyId = singleString(input, "story_id");
  const applicationId = singleString(input, "application_id");
  if (
    title.status !== "value" ||
    status.status !== "value" ||
    company.status !== "value" ||
    storyId.status !== "value" ||
    applicationId.status !== "value"
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const fieldErrors: BehavioralAnswerFieldErrors = {};
  const normalizedTitle = title.value.trim();
  if (containsDisallowedTextControl(title.value, false)) {
    fieldErrors.title = "Preparation title contains unsupported control characters.";
  } else if (!normalizedTitle || Array.from(normalizedTitle).length > 200) {
    fieldErrors.title = "Add a title up to 200 characters.";
  }

  if (!ANSWER_STATUS_SET.has(status.value)) {
    fieldErrors.status = "Choose a valid answer status.";
  }

  const companyValue = company.value.trim();
  const normalizedCompany = normalizeCompanySlug(companyValue);
  if (
    Array.from(companyValue).length > 200 ||
    containsDisallowedTextControl(company.value, false) ||
    (companyValue.length > 0 && normalizedCompany === null)
  ) {
    fieldErrors.company_slug =
      "Company must be 200 characters or fewer and use supported text.";
  }

  const parsedStoryId = parseCanonicalBehavioralAnswerId(storyId.value);
  if (!storyId.value) {
    fieldErrors.story_id = "Choose the source story for this answer variant.";
  } else if (!parsedStoryId) {
    fieldErrors.story_id = "Choose a valid story.";
  }

  const parsedApplicationId = applicationId.value
    ? parseCanonicalBehavioralAnswerId(applicationId.value)
    : null;
  if (applicationId.value && !parsedApplicationId) {
    fieldErrors.application_id = "Choose a valid application.";
  }

  const textEntries: Array<readonly [string, string | null]> = [];
  for (const [name, maximum, label] of ANSWER_TEXT_FIELDS) {
    const field = singleString(input, name);
    if (field.status !== "value") {
      return { ok: false, reason: "invalid-input" };
    }
    const value = field.value.trim();
    if (containsDisallowedTextControl(value, true)) {
      fieldErrors[name] = `${label} contains unsupported control characters.`;
    } else if (Array.from(value).length > maximum) {
      fieldErrors[name] =
        name === "answer_text"
          ? "Keep the full rehearsal draft to 50,000 characters or fewer."
          : `${label} must be ${maximum.toLocaleString()} characters or fewer.`;
    }
    textEntries.push([name, value || null]);
  }

  if (Object.keys(fieldErrors).length > 0 || !parsedStoryId) {
    return { ok: false, reason: "invalid-input", fieldErrors };
  }

  const textValues = Object.fromEntries(textEntries) as Record<
    (typeof ANSWER_TEXT_FIELDS)[number][0],
    string | null
  >;
  return {
    ok: true,
    value: {
      questionId,
      answerId,
      expectedUpdatedAt:
        revision.status === "value" ? revision.value : null,
      answer: {
        title: normalizedTitle,
        answer_text: textValues.answer_text ?? "",
        opening_framing: textValues.opening_framing,
        details_to_emphasize: textValues.details_to_emphasize,
        details_to_avoid: textValues.details_to_avoid,
        notes: textValues.notes,
        status: status.value as (typeof ANSWER_STATUSES)[number],
        company_slug: normalizedCompany,
        story_id: parsedStoryId,
        application_id: parsedApplicationId,
      },
      isPrimary: primary.status === "value",
      factIntegrityConfirmed: factConfirmation.status === "value",
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

export function parseBehavioralAnswerMutationResult(
  value: unknown,
  expectedAnswerId?: string,
): BehavioralAnswerMutationResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "missing" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }

  const keys = Reflect.ownKeys(value[0]);
  const answerId = parseCanonicalBehavioralAnswerId(value[0].answer_id);
  if (
    keys.length !== 2 ||
    !keys.includes("answer_id") ||
    !keys.includes("updated_at") ||
    !answerId ||
    (expectedAnswerId !== undefined && answerId !== expectedAnswerId) ||
    !isCanonicalBehavioralAnswerRevision(value[0].updated_at)
  ) {
    return { status: "invalid" };
  }

  return {
    status: "saved",
    answerId,
    updatedAt: value[0].updated_at,
  };
}
