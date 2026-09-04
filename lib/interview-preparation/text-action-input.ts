export const PREPARATION_TEXT_EXPECTED_REVISION_FIELD =
  "expected_updated_at";
export const PREPARATION_TEXT_ABSENT_REVISION = "absent";

export const PREPARATION_NOTES_INVALID_INPUT_ERROR =
  "Review the private notes and try again.";
export const PREPARATION_NOTES_CONFLICT_ERROR =
  "These private notes may have changed since you opened this page. Your edits were not saved. Review the latest saved version before trying again.";
export const PREPARATION_NOTES_PERSISTENCE_ERROR =
  "We couldn't save these private notes. Try again.";
export const PREPARATION_NOTES_SAVED_MESSAGE = "Private notes saved.";
export const PREPARATION_NOTES_PENDING_MESSAGE = "Saving private notes…";
export const PREPARATION_NOTES_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "Earlier private notes saved. Review your current edits and save again.";

export const PREPARATION_REFLECTION_INVALID_INPUT_ERROR =
  "Review the reflection fields and try again.";
export const PREPARATION_REFLECTION_CONFLICT_ERROR =
  "This reflection may have changed since you opened this page. Your edits were not saved. Review the latest saved version before trying again.";
export const PREPARATION_REFLECTION_PERSISTENCE_ERROR =
  "We couldn't save this reflection. Confirm the round is completed and try again.";
export const PREPARATION_REFLECTION_SAVED_MESSAGE =
  "Private reflection saved.";
export const PREPARATION_REFLECTION_PENDING_MESSAGE =
  "Saving private reflection…";
export const PREPARATION_REFLECTION_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "An earlier reflection draft saved. Review your current edits and save again.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

const NOTES_FIELDS = new Set([
  "private_notes",
  PREPARATION_TEXT_EXPECTED_REVISION_FIELD,
]);
const REFLECTION_FIELDS = new Set([
  "topics_asked",
  "went_well",
  "needs_improvement",
  "follow_up_notes",
  PREPARATION_TEXT_EXPECTED_REVISION_FIELD,
]);

type PreparationTextKind = "notes" | "reflection";
type SingleString =
  | Readonly<{ status: "value"; value: string }>
  | Readonly<{ status: "missing" | "invalid" }>;

type PreparationTextContext = Readonly<{
  roundId: string;
  applicationId: string;
  expectAbsent: boolean;
  expectedUpdatedAt: string | null;
  revision: string;
}>;

export type PreparationNotesActionInput = PreparationTextContext &
  Readonly<{ notes: string }>;

export type PreparationReflectionActionInput = PreparationTextContext &
  Readonly<{
    topicsAsked: string;
    wentWell: string;
    needsImprovement: string;
    followUpNotes: string;
  }>;

export type PreparationNotesActionInputResult =
  | Readonly<{ ok: true; value: PreparationNotesActionInput }>
  | Readonly<{ ok: false }>;

export type PreparationReflectionActionInputResult =
  | Readonly<{ ok: true; value: PreparationReflectionActionInput }>
  | Readonly<{ ok: false }>;

export type PreparationTextSaveResult =
  | Readonly<{ status: "saved"; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type PreparationTextDisplayState = Readonly<{
  status: "idle" | "pending" | "error" | "success";
  message: string;
}>;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(form: FormData, knownFields: ReadonlySet<string>) {
  for (const key of form.keys()) {
    if (!knownFields.has(key) && !key.startsWith("$ACTION_")) return false;
  }
  return true;
}

function singleString(form: FormData, name: string): SingleString {
  const values = form.getAll(name);
  if (values.length === 0) return { status: "missing" };
  if (values.length !== 1 || typeof values[0] !== "string") {
    return { status: "invalid" };
  }
  return { status: "value", value: values[0] };
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isCanonicalPreparationTextRevision(
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

function containsDisallowedTextControl(value: string) {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
      return true;
    }
  }
  return false;
}

function parseContext(
  roundId: unknown,
  applicationId: unknown,
  revision: SingleString,
): PreparationTextContext | null {
  if (
    typeof roundId !== "string" ||
    !UUID_PATTERN.test(roundId) ||
    typeof applicationId !== "string" ||
    !UUID_PATTERN.test(applicationId) ||
    revision.status !== "value" ||
    (revision.value !== PREPARATION_TEXT_ABSENT_REVISION &&
      !isCanonicalPreparationTextRevision(revision.value))
  ) {
    return null;
  }
  const expectAbsent = revision.value === PREPARATION_TEXT_ABSENT_REVISION;
  return {
    roundId: roundId.toLowerCase(),
    applicationId: applicationId.toLowerCase(),
    expectAbsent,
    expectedUpdatedAt: expectAbsent ? null : revision.value,
    revision: revision.value,
  };
}

function validText(value: SingleString, maximumCodePoints: number) {
  return (
    value.status === "value" &&
    !containsDisallowedTextControl(value.value) &&
    Array.from(value.value).length <= maximumCodePoints
  );
}

export function parsePreparationNotesActionInput(
  roundId: unknown,
  applicationId: unknown,
  input: unknown,
): PreparationNotesActionInputResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input, NOTES_FIELDS)) {
    return { ok: false };
  }
  const notes = singleString(input, "private_notes");
  const context = parseContext(
    roundId,
    applicationId,
    singleString(input, PREPARATION_TEXT_EXPECTED_REVISION_FIELD),
  );
  if (!context || !validText(notes, 12_000) || notes.status !== "value") {
    return { ok: false };
  }
  return { ok: true, value: { ...context, notes: notes.value.trim() } };
}

export function parsePreparationReflectionActionInput(
  roundId: unknown,
  applicationId: unknown,
  input: unknown,
): PreparationReflectionActionInputResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input, REFLECTION_FIELDS)) {
    return { ok: false };
  }
  const topicsAsked = singleString(input, "topics_asked");
  const wentWell = singleString(input, "went_well");
  const needsImprovement = singleString(input, "needs_improvement");
  const followUpNotes = singleString(input, "follow_up_notes");
  const context = parseContext(
    roundId,
    applicationId,
    singleString(input, PREPARATION_TEXT_EXPECTED_REVISION_FIELD),
  );
  if (
    !context ||
    !validText(topicsAsked, 8_000) ||
    !validText(wentWell, 8_000) ||
    !validText(needsImprovement, 8_000) ||
    !validText(followUpNotes, 8_000) ||
    topicsAsked.status !== "value" ||
    wentWell.status !== "value" ||
    needsImprovement.status !== "value" ||
    followUpNotes.status !== "value"
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    value: {
      ...context,
      topicsAsked: topicsAsked.value.trim(),
      wentWell: wentWell.value.trim(),
      needsImprovement: needsImprovement.value.trim(),
      followUpNotes: followUpNotes.value.trim(),
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

export function parsePreparationTextSaveResult(
  value: unknown,
  expectedRoundId: string,
): PreparationTextSaveResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }
  const keys = Reflect.ownKeys(value[0]);
  if (
    keys.length !== 2 ||
    !keys.includes("round_id") ||
    !keys.includes("updated_at") ||
    value[0].round_id !== expectedRoundId ||
    !isCanonicalPreparationTextRevision(value[0].updated_at)
  ) {
    return { status: "invalid" };
  }
  return { status: "saved", updatedAt: value[0].updated_at };
}

export function preparationTextDraftSignature(
  formData: FormData,
  kind: PreparationTextKind,
) {
  return JSON.stringify(
    kind === "notes"
      ? [formData.get("private_notes")]
      : [
          formData.get("topics_asked"),
          formData.get("went_well"),
          formData.get("needs_improvement"),
          formData.get("follow_up_notes"),
        ],
  );
}

export function resolvePreparationTextDisplayState(
  actionState: Readonly<{
    status: "idle" | "error" | "success";
    message: string;
  }>,
  pending: boolean,
  changedSinceSubmit: boolean,
  kind: PreparationTextKind,
): PreparationTextDisplayState {
  if (pending) {
    return {
      status: "pending",
      message:
        kind === "notes"
          ? PREPARATION_NOTES_PENDING_MESSAGE
          : PREPARATION_REFLECTION_PENDING_MESSAGE,
    };
  }
  if (actionState.status === "success" && changedSinceSubmit) {
    return {
      status: "success",
      message:
        kind === "notes"
          ? PREPARATION_NOTES_EARLIER_SNAPSHOT_SAVED_MESSAGE
          : PREPARATION_REFLECTION_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return actionState;
}
