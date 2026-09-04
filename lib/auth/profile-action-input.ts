import { parseOptionalProfileLink } from "./profile-links.ts";
import { RESERVED_USERNAMES, USERNAME_PATTERN } from "./validation.ts";

export const PROFILE_EXPECTED_REVISION_FIELD = "expected_updated_at";
export const PROFILE_INVALID_INPUT_ERROR =
  "Review the profile fields and try again.";
export const PROFILE_CONFLICT_ERROR =
  "This profile may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.";
export const PROFILE_PERSISTENCE_ERROR =
  "We couldn't save your profile. Check the fields and try again.";
export const PROFILE_SAVED_MESSAGE = "Profile changes saved.";
export const PROFILE_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "Earlier profile changes saved. Review your current changes and save again.";

const PROFILE_FIELDS = new Set([
  "username",
  "display_name",
  "bio",
  "current_company",
  "current_role",
  "years_experience",
  "linkedin_url",
  "github_url",
  "is_public",
  PROFILE_EXPECTED_REVISION_FIELD,
]);
const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES);
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SingleString =
  | Readonly<{ status: "value"; value: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid" }>;

type ProfileLinkCandidate = Readonly<{
  raw: string;
  parsed: ReturnType<typeof parseOptionalProfileLink>;
}>;

export type ProfileActionEnvelope = Readonly<{
  expectedUpdatedAt: string;
  username: string;
  displayName: string;
  bio: string | null;
  currentCompany: string | null;
  currentRole: string | null;
  yearsExperience: number | null;
  linkedin: ProfileLinkCandidate;
  github: ProfileLinkCandidate;
  isPublic: boolean;
}>;

export type ProfileActionInput = Readonly<{
  expectedUpdatedAt: string;
  username: string;
  displayName: string;
  bio: string | null;
  currentCompany: string | null;
  currentRole: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null | undefined;
  githubUrl: string | null | undefined;
  isPublic: boolean;
}>;

export type ProfileActionEnvelopeResult =
  | Readonly<{ ok: true; value: ProfileActionEnvelope }>
  | Readonly<{ ok: false; reason: "invalid-input" }>;

export type ProfileActionInputResult =
  | Readonly<{ ok: true; value: ProfileActionInput }>
  | Readonly<{
      ok: false;
      reason: "invalid-github" | "invalid-linkedin";
    }>;

export type ProfileMutationResult =
  | Readonly<{ status: "saved"; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(form: FormData) {
  for (const key of form.keys()) {
    if (!PROFILE_FIELDS.has(key) && !key.startsWith("$ACTION_")) return false;
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

function containsDisallowedTextControl(
  value: string,
  allowFormattingWhitespace = false,
) {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const allowedWhitespace =
      allowFormattingWhitespace &&
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

function normalizeOptional(
  value: string,
  maximum: number,
  allowFormattingWhitespace = false,
) {
  if (containsDisallowedTextControl(value, allowFormattingWhitespace)) {
    return undefined;
  }
  const normalized = value.trim();
  if (Array.from(normalized).length > maximum) return undefined;
  return normalized || null;
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isCanonicalProfileRevision(value: unknown): value is string {
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

export function parseProfileActionEnvelope(
  input: unknown,
): ProfileActionEnvelopeResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input)) {
    return { ok: false, reason: "invalid-input" };
  }
  const username = singleString(input, "username");
  const displayName = singleString(input, "display_name");
  const bio = singleString(input, "bio");
  const currentCompany = singleString(input, "current_company");
  const currentRole = singleString(input, "current_role");
  const yearsExperience = singleString(input, "years_experience");
  const linkedin = singleString(input, "linkedin_url");
  const github = singleString(input, "github_url");
  const visibility = singleString(input, "is_public");
  const revision = singleString(input, PROFILE_EXPECTED_REVISION_FIELD);
  if (
    username.status !== "value" ||
    displayName.status !== "value" ||
    bio.status !== "value" ||
    currentCompany.status !== "value" ||
    currentRole.status !== "value" ||
    yearsExperience.status !== "value" ||
    linkedin.status !== "value" ||
    github.status !== "value" ||
    visibility.status !== "value" ||
    revision.status !== "value"
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const normalizedUsername = username.value.trim().toLowerCase();
  const normalizedDisplayName = displayName.value.trim();
  const normalizedBio = normalizeOptional(bio.value, 280, true);
  const normalizedCompany = normalizeOptional(currentCompany.value, 100);
  const normalizedRole = normalizeOptional(currentRole.value, 100);
  const normalizedYears = yearsExperience.value.trim();
  const parsedYears = normalizedYears === "" ? null : Number(normalizedYears);
  if (
    !USERNAME_PATTERN.test(normalizedUsername) ||
    RESERVED_USERNAME_SET.has(normalizedUsername) ||
    !normalizedDisplayName ||
    Array.from(normalizedDisplayName).length > 80 ||
    containsDisallowedTextControl(normalizedDisplayName) ||
    normalizedBio === undefined ||
    normalizedCompany === undefined ||
    normalizedRole === undefined ||
    (normalizedYears !== "" && !/^(?:0|[1-9]\d?)$/.test(normalizedYears)) ||
    (parsedYears !== null && parsedYears > 80) ||
    !["public", "private"].includes(visibility.value) ||
    containsDisallowedTextControl(linkedin.value) ||
    containsDisallowedTextControl(github.value) ||
    Array.from(linkedin.value).length > 500 ||
    Array.from(github.value).length > 500 ||
    !isCanonicalProfileRevision(revision.value)
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  return {
    ok: true,
    value: {
      expectedUpdatedAt: revision.value,
      username: normalizedUsername,
      displayName: normalizedDisplayName,
      bio: normalizedBio,
      currentCompany: normalizedCompany,
      currentRole: normalizedRole,
      yearsExperience: parsedYears,
      linkedin: {
        raw: linkedin.value,
        parsed: parseOptionalProfileLink("linkedin", linkedin.value),
      },
      github: {
        raw: github.value,
        parsed: parseOptionalProfileLink("github", github.value),
      },
      isPublic: visibility.value === "public",
    },
  };
}

function resolveLink(
  platform: "github" | "linkedin",
  candidate: ProfileLinkCandidate,
  storedValue: string | null,
) {
  if (!candidate.parsed.error) return { ok: true as const, value: candidate.parsed.value };
  const stored = parseOptionalProfileLink(platform, storedValue);
  if (stored.error && candidate.raw === storedValue) {
    return { ok: true as const, value: undefined };
  }
  return { ok: false as const };
}

export function resolveProfileActionInput(
  envelope: ProfileActionEnvelope,
  storedLinks: Readonly<{
    linkedinUrl: string | null;
    githubUrl: string | null;
  }>,
): ProfileActionInputResult {
  const linkedin = resolveLink("linkedin", envelope.linkedin, storedLinks.linkedinUrl);
  if (!linkedin.ok) return { ok: false, reason: "invalid-linkedin" };
  const github = resolveLink("github", envelope.github, storedLinks.githubUrl);
  if (!github.ok) return { ok: false, reason: "invalid-github" };
  return {
    ok: true,
    value: {
      expectedUpdatedAt: envelope.expectedUpdatedAt,
      username: envelope.username,
      displayName: envelope.displayName,
      bio: envelope.bio,
      currentCompany: envelope.currentCompany,
      currentRole: envelope.currentRole,
      yearsExperience: envelope.yearsExperience,
      linkedinUrl: linkedin.value,
      githubUrl: github.value,
      isPublic: envelope.isPublic,
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

export function parseProfileMutationResult(
  value: unknown,
  expectedProfileId: string,
): ProfileMutationResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) return { status: "invalid" };
  const row = value[0];
  if (
    Object.keys(row).sort().join(",") !== "profile_id,updated_at" ||
    typeof row.profile_id !== "string" ||
    !UUID_PATTERN.test(row.profile_id) ||
    row.profile_id.toLowerCase() !== expectedProfileId.toLowerCase() ||
    !isCanonicalProfileRevision(row.updated_at)
  ) {
    return { status: "invalid" };
  }
  return { status: "saved", updatedAt: row.updated_at };
}

export function resolveProfileDisplayState(
  state: Readonly<{ status: "idle" | "error" | "success"; message: string }>,
  pending: boolean,
  changedSinceSubmit: boolean,
) {
  if (pending) return { status: "pending" as const, message: "Saving profile…" };
  if (state.status === "success" && changedSinceSubmit) {
    return {
      status: "success" as const,
      message: PROFILE_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return state;
}
