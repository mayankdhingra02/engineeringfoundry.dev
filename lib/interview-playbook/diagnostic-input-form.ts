/**
 * Pure runtime boundaries for the Interview Playbook diagnostic aggregate.
 *
 * This module intentionally has no React, Supabase, auth, or server-only
 * dependency so focused qualification can execute the same parsers used by
 * production Server Actions and queries.
 */
import {
  INTERVIEW_PREPARATION_AREAS,
  type InterviewPreparationArea,
} from "./evidence.ts";
import {
  INTERVIEW_DIAGNOSTIC_CONSTRAINT_CATEGORIES,
  INTERVIEW_PREPARATION_COVERAGE_STATES,
  type InterviewDiagnosticConstraint,
  type InterviewDiagnosticConstraintCategory,
  type InterviewPreparationCoverageState,
  type InterviewSelfReportedConfidence,
} from "./diagnostic.ts";

export const INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD =
  "expected_updated_at";
export const INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION = "absent";

export const INTERVIEW_PLAYBOOK_DIAGNOSTIC_INVALID_INPUT_ERROR =
  "Review the diagnostic inputs and try again.";
export const INTERVIEW_PLAYBOOK_DIAGNOSTIC_CONFLICT_ERROR =
  "These diagnostic inputs may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.";
export const INTERVIEW_PLAYBOOK_DIAGNOSTIC_PERSISTENCE_ERROR =
  "We couldn't save your diagnostic inputs. Try again.";
export const INTERVIEW_PLAYBOOK_DIAGNOSTIC_SAVED_MESSAGE =
  "Diagnostic inputs saved.";
export const INTERVIEW_PLAYBOOK_DIAGNOSTIC_PENDING_MESSAGE =
  "Saving diagnostic inputs…";
export const INTERVIEW_PLAYBOOK_DIAGNOSTIC_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "Earlier diagnostic inputs saved. Review your current changes and save again.";

export type InterviewPlaybookDiagnosticConfidenceEntry = Readonly<{
  area: InterviewPreparationArea;
  confidence: "low" | "medium" | "high";
}>;

export type InterviewPlaybookDiagnosticConstraintEntry = Readonly<{
  category: InterviewDiagnosticConstraintCategory;
  description: string;
}>;

export type InterviewPlaybookDiagnosticInputFormPayload = Readonly<{
  availableHoursPerWeek: number | null;
  confidenceEntries: readonly InterviewPlaybookDiagnosticConfidenceEntry[];
  priorityAreas: readonly InterviewPreparationArea[];
  constraintEntries: readonly InterviewPlaybookDiagnosticConstraintEntry[];
  behavioralStoriesCoverage: InterviewPreparationCoverageState;
  projectDeepDiveCoverage: InterviewPreparationCoverageState;
  expectAbsent: boolean;
  expectedUpdatedAt: string | null;
  revision: string;
}>;

export type ParseInterviewPlaybookDiagnosticInputFormResult =
  | Readonly<{ ok: true; value: InterviewPlaybookDiagnosticInputFormPayload }>
  | Readonly<{ ok: false; error: string }>;

export type InterviewPlaybookDiagnosticSaveResult =
  | Readonly<{ status: "saved"; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type InterviewPlaybookDiagnosticSnapshot = Readonly<{
  hasSavedInputs: boolean;
  availableHoursPerWeek: number | null;
  confidenceByArea: Partial<
    Record<InterviewPreparationArea, InterviewSelfReportedConfidence>
  >;
  priorities: readonly InterviewPreparationArea[];
  constraints: readonly InterviewDiagnosticConstraint[];
  coverage: Readonly<{
    behavioralStories: InterviewPreparationCoverageState;
    projectDeepDive: InterviewPreparationCoverageState;
  }>;
  revision: string;
}>;

export type InterviewPlaybookDiagnosticSnapshotResult =
  | Readonly<{
      status: "ready";
      value: InterviewPlaybookDiagnosticSnapshot;
    }>
  | Readonly<{ status: "invalid" }>;

export type InterviewPlaybookDiagnosticDisplayState = Readonly<{
  status: "idle" | "pending" | "error" | "success";
  message: string;
}>;

const MAX_CONSTRAINT_ROWS = 10;
const MAX_CONSTRAINT_DESCRIPTION_LENGTH = 500;
const MAX_PRIORITY_RANK = INTERVIEW_PREPARATION_AREAS.length;
const AREA_SET = new Set<string>(INTERVIEW_PREPARATION_AREAS);
const COVERAGE_SET = new Set<string>(INTERVIEW_PREPARATION_COVERAGE_STATES);
const CONSTRAINT_CATEGORY_SET = new Set<string>(
  INTERVIEW_DIAGNOSTIC_CONSTRAINT_CATEGORIES,
);
const CONFIDENCE_SET = new Set<string>(["low", "medium", "high"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;
const HOURS_PATTERN = /^(?:0|[1-9]\d{0,2})(?:\.\d{1,2})?$/;

const DIAGNOSTIC_FORM_FIELDS = new Set<string>([
  "availableHoursPerWeek",
  "behavioralStoriesCoverage",
  "projectDeepDiveCoverage",
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD,
  ...INTERVIEW_PREPARATION_AREAS.flatMap((area) => [
    `confidence:${area}`,
    `priority:${area}`,
  ]),
  ...Array.from({ length: MAX_CONSTRAINT_ROWS }, (_, index) => [
    `constraint:${index}:category`,
    `constraint:${index}:description`,
  ]).flat(),
]);

type SingleString =
  | Readonly<{ status: "value"; value: string }>
  | Readonly<{ status: "invalid" }>;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(formData: FormData) {
  for (const key of formData.keys()) {
    if (!DIAGNOSTIC_FORM_FIELDS.has(key) && !key.startsWith("$ACTION_")) {
      return false;
    }
  }
  return true;
}

function singleString(formData: FormData, name: string): SingleString {
  const values = formData.getAll(name);
  if (values.length !== 1 || typeof values[0] !== "string") {
    return { status: "invalid" };
  }
  return { status: "value", value: values[0] };
}

function containsDisallowedControl(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 31 || (codePoint >= 127 && codePoint <= 159)) {
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

export function isCanonicalInterviewPlaybookDiagnosticRevision(
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

function parseAvailableHoursPerWeek(
  formData: FormData,
):
  | Readonly<{ ok: true; value: number | null }>
  | Readonly<{ ok: false; error: string }> {
  const field = singleString(formData, "availableHoursPerWeek");
  if (field.status !== "value") {
    return { ok: false, error: INTERVIEW_PLAYBOOK_DIAGNOSTIC_INVALID_INPUT_ERROR };
  }
  if (field.value === "") return { ok: true, value: null };
  if (!HOURS_PATTERN.test(field.value)) {
    return {
      ok: false,
      error: "Enter a valid number of available hours per week.",
    };
  }
  const parsed = Number(field.value);
  if (parsed < 0 || parsed > 168) {
    return {
      ok: false,
      error: "Available hours per week must be between 0 and 168.",
    };
  }
  return { ok: true, value: parsed };
}

function parseCoverage(
  formData: FormData,
  name: string,
  label: string,
):
  | Readonly<{ ok: true; value: InterviewPreparationCoverageState }>
  | Readonly<{ ok: false; error: string }> {
  const field = singleString(formData, name);
  if (field.status !== "value") {
    return { ok: false, error: INTERVIEW_PLAYBOOK_DIAGNOSTIC_INVALID_INPUT_ERROR };
  }
  const value = field.value === "" ? "unknown" : field.value;
  if (!COVERAGE_SET.has(value)) {
    return { ok: false, error: `Choose a valid ${label} coverage value.` };
  }
  return { ok: true, value: value as InterviewPreparationCoverageState };
}

export function parseInterviewPlaybookDiagnosticInputForm(
  input: unknown,
): ParseInterviewPlaybookDiagnosticInputFormResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input)) {
    return { ok: false, error: INTERVIEW_PLAYBOOK_DIAGNOSTIC_INVALID_INPUT_ERROR };
  }

  const revision = singleString(
    input,
    INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD,
  );
  if (
    revision.status !== "value" ||
    (revision.value !== INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION &&
      !isCanonicalInterviewPlaybookDiagnosticRevision(revision.value))
  ) {
    return { ok: false, error: INTERVIEW_PLAYBOOK_DIAGNOSTIC_INVALID_INPUT_ERROR };
  }

  const hoursResult = parseAvailableHoursPerWeek(input);
  if (!hoursResult.ok) return hoursResult;

  const confidenceEntries: InterviewPlaybookDiagnosticConfidenceEntry[] = [];
  const priorityAreaByRank = new Map<number, InterviewPreparationArea>();

  for (const area of INTERVIEW_PREPARATION_AREAS) {
    const confidence = singleString(input, `confidence:${area}`);
    const priority = singleString(input, `priority:${area}`);
    if (confidence.status !== "value" || priority.status !== "value") {
      return { ok: false, error: INTERVIEW_PLAYBOOK_DIAGNOSTIC_INVALID_INPUT_ERROR };
    }

    if (confidence.value !== "") {
      if (!CONFIDENCE_SET.has(confidence.value)) {
        return {
          ok: false,
          error: "Choose a valid confidence value for every area.",
        };
      }
      confidenceEntries.push({
        area,
        confidence: confidence.value as "low" | "medium" | "high",
      });
    }

    if (priority.value !== "") {
      if (!/^[1-9]$/.test(priority.value)) {
        return {
          ok: false,
          error: "Choose a valid priority rank for every prioritized area.",
        };
      }
      const rank = Number(priority.value);
      if (rank > MAX_PRIORITY_RANK) {
        return {
          ok: false,
          error: "Choose a valid priority rank for every prioritized area.",
        };
      }
      if (priorityAreaByRank.has(rank)) {
        return { ok: false, error: "Each priority rank may only be used once." };
      }
      priorityAreaByRank.set(rank, area);
    }
  }

  const priorityAreas = [...priorityAreaByRank.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, area]) => area);

  const constraintEntries: InterviewPlaybookDiagnosticConstraintEntry[] = [];
  for (let index = 0; index < MAX_CONSTRAINT_ROWS; index += 1) {
    const category = singleString(input, `constraint:${index}:category`);
    const description = singleString(input, `constraint:${index}:description`);
    if (category.status !== "value" || description.status !== "value") {
      return { ok: false, error: INTERVIEW_PLAYBOOK_DIAGNOSTIC_INVALID_INPUT_ERROR };
    }

    const normalizedDescription = description.value.trim();
    if (normalizedDescription === "") {
      if (category.value !== "" && !CONSTRAINT_CATEGORY_SET.has(category.value)) {
        return {
          ok: false,
          error: "Choose a valid category for every constraint row.",
        };
      }
      continue;
    }
    if (
      containsDisallowedControl(normalizedDescription) ||
      Array.from(normalizedDescription).length >
        MAX_CONSTRAINT_DESCRIPTION_LENGTH
    ) {
      return {
        ok: false,
        error:
          Array.from(normalizedDescription).length >
          MAX_CONSTRAINT_DESCRIPTION_LENGTH
            ? "Shorten a constraint description to 500 characters or fewer."
            : "Remove unsupported control characters from the constraint description.",
      };
    }
    if (!CONSTRAINT_CATEGORY_SET.has(category.value)) {
      return {
        ok: false,
        error: "Choose a category for every constraint that has a description.",
      };
    }
    constraintEntries.push({
      category: category.value as InterviewDiagnosticConstraintCategory,
      description: normalizedDescription,
    });
  }

  const behavioralCoverageResult = parseCoverage(
    input,
    "behavioralStoriesCoverage",
    "Behavioral story",
  );
  if (!behavioralCoverageResult.ok) return behavioralCoverageResult;
  const projectDeepDiveCoverageResult = parseCoverage(
    input,
    "projectDeepDiveCoverage",
    "Project Deep Dive",
  );
  if (!projectDeepDiveCoverageResult.ok) return projectDeepDiveCoverageResult;

  const expectAbsent =
    revision.value === INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION;
  return {
    ok: true,
    value: {
      availableHoursPerWeek: hoursResult.value,
      confidenceEntries,
      priorityAreas,
      constraintEntries,
      behavioralStoriesCoverage: behavioralCoverageResult.value,
      projectDeepDiveCoverage: projectDeepDiveCoverageResult.value,
      expectAbsent,
      expectedUpdatedAt: expectAbsent ? null : revision.value,
      revision: revision.value,
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

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expected.length && expected.every((key) => keys.includes(key))
  );
}

function parseCanonicalUuid(value: unknown) {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

function parsePersistedHours(value: unknown) {
  if (value === null) return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 168 ||
    !HOURS_PATTERN.test(String(value))
  ) {
    return undefined;
  }
  return value;
}

function parseSnapshotConfidenceEntries(value: unknown) {
  if (!Array.isArray(value) || value.length > INTERVIEW_PREPARATION_AREAS.length) {
    return null;
  }
  const confidenceByArea: Partial<
    Record<InterviewPreparationArea, InterviewSelfReportedConfidence>
  > = {};
  const seen = new Set<string>();
  let previousAreaIndex = -1;
  for (const entry of value) {
    if (
      !isPlainRecord(entry) ||
      !hasExactKeys(entry, ["area", "confidence"]) ||
      typeof entry.area !== "string" ||
      !AREA_SET.has(entry.area) ||
      typeof entry.confidence !== "string" ||
      !CONFIDENCE_SET.has(entry.confidence) ||
      seen.has(entry.area)
    ) {
      return null;
    }
    const areaIndex = INTERVIEW_PREPARATION_AREAS.indexOf(
      entry.area as InterviewPreparationArea,
    );
    if (areaIndex <= previousAreaIndex) return null;
    previousAreaIndex = areaIndex;
    seen.add(entry.area);
    confidenceByArea[entry.area as InterviewPreparationArea] =
      entry.confidence as InterviewSelfReportedConfidence;
  }
  return confidenceByArea;
}

function parseSnapshotPriorities(value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length > INTERVIEW_PREPARATION_AREAS.length ||
    value.some((area) => typeof area !== "string" || !AREA_SET.has(area)) ||
    new Set(value).size !== value.length
  ) {
    return null;
  }
  return value as InterviewPreparationArea[];
}

function parseSnapshotConstraints(value: unknown) {
  if (!Array.isArray(value) || value.length > MAX_CONSTRAINT_ROWS) return null;
  const constraints: InterviewDiagnosticConstraint[] = [];
  const ids = new Set<string>();
  for (const entry of value) {
    if (
      !isPlainRecord(entry) ||
      !hasExactKeys(entry, ["id", "category", "description"]) ||
      typeof entry.category !== "string" ||
      !CONSTRAINT_CATEGORY_SET.has(entry.category) ||
      typeof entry.description !== "string" ||
      entry.description === "" ||
      entry.description !== entry.description.trim() ||
      containsDisallowedControl(entry.description) ||
      Array.from(entry.description).length > MAX_CONSTRAINT_DESCRIPTION_LENGTH
    ) {
      return null;
    }
    const id = parseCanonicalUuid(entry.id);
    if (!id || ids.has(id)) return null;
    ids.add(id);
    constraints.push({
      id,
      category: entry.category as InterviewDiagnosticConstraintCategory,
      description: entry.description,
    });
  }
  return constraints;
}

export function parseInterviewPlaybookDiagnosticSnapshotResult(
  value: unknown,
): InterviewPlaybookDiagnosticSnapshotResult {
  if (
    !Array.isArray(value) ||
    value.length !== 1 ||
    !isPlainRecord(value[0]) ||
    !hasExactKeys(value[0], [
      "has_saved_inputs",
      "available_hours_per_week",
      "confidence_entries",
      "priority_areas",
      "constraint_entries",
      "behavioral_stories_coverage",
      "project_deep_dive_coverage",
      "updated_at",
    ])
  ) {
    return { status: "invalid" };
  }

  const row = value[0];
  if (typeof row.has_saved_inputs !== "boolean") {
    return { status: "invalid" };
  }
  const hours = parsePersistedHours(row.available_hours_per_week);
  const confidenceByArea = parseSnapshotConfidenceEntries(
    row.confidence_entries,
  );
  const priorities = parseSnapshotPriorities(row.priority_areas);
  const constraints = parseSnapshotConstraints(row.constraint_entries);
  if (
    hours === undefined ||
    confidenceByArea === null ||
    priorities === null ||
    constraints === null ||
    typeof row.behavioral_stories_coverage !== "string" ||
    !COVERAGE_SET.has(row.behavioral_stories_coverage) ||
    typeof row.project_deep_dive_coverage !== "string" ||
    !COVERAGE_SET.has(row.project_deep_dive_coverage)
  ) {
    return { status: "invalid" };
  }

  if (!row.has_saved_inputs) {
    if (
      hours !== null ||
      Object.keys(confidenceByArea).length !== 0 ||
      priorities.length !== 0 ||
      constraints.length !== 0 ||
      row.behavioral_stories_coverage !== "unknown" ||
      row.project_deep_dive_coverage !== "unknown" ||
      row.updated_at !== null
    ) {
      return { status: "invalid" };
    }
    return {
      status: "ready",
      value: {
        hasSavedInputs: false,
        availableHoursPerWeek: null,
        confidenceByArea: {},
        priorities: [],
        constraints: [],
        coverage: {
          behavioralStories: "unknown",
          projectDeepDive: "unknown",
        },
        revision: INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION,
      },
    };
  }

  if (!isCanonicalInterviewPlaybookDiagnosticRevision(row.updated_at)) {
    return { status: "invalid" };
  }
  return {
    status: "ready",
    value: {
      hasSavedInputs: true,
      availableHoursPerWeek: hours,
      confidenceByArea,
      priorities,
      constraints,
      coverage: {
        behavioralStories:
          row.behavioral_stories_coverage as InterviewPreparationCoverageState,
        projectDeepDive:
          row.project_deep_dive_coverage as InterviewPreparationCoverageState,
      },
      revision: row.updated_at,
    },
  };
}

export function parseInterviewPlaybookDiagnosticSaveResult(
  value: unknown,
): InterviewPlaybookDiagnosticSaveResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (
    value.length !== 1 ||
    !isPlainRecord(value[0]) ||
    !hasExactKeys(value[0], ["updated_at"]) ||
    !isCanonicalInterviewPlaybookDiagnosticRevision(value[0].updated_at)
  ) {
    return { status: "invalid" };
  }
  return { status: "saved", updatedAt: value[0].updated_at };
}

export function resolveInterviewPlaybookDiagnosticDisplayState(
  actionState: Readonly<{
    status: "idle" | "error" | "success";
    message: string;
  }>,
  pending: boolean,
  changedSinceSubmit: boolean,
): InterviewPlaybookDiagnosticDisplayState {
  if (pending) {
    return {
      status: "pending",
      message: INTERVIEW_PLAYBOOK_DIAGNOSTIC_PENDING_MESSAGE,
    };
  }
  if (actionState.status === "success" && changedSinceSubmit) {
    return {
      status: "success",
      message:
        INTERVIEW_PLAYBOOK_DIAGNOSTIC_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return actionState;
}
