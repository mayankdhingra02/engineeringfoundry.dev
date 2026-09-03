const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTERVIEW_MONTH_PATTERN = /^[1-9][0-9]{3}-(?:0[1-9]|1[0-2])$/;

const roleLevels = new Set<unknown>([
  "",
  "Entry",
  "Mid",
  "Senior",
  "Staff+",
  "Management",
  "Prefer not to say",
]);
const publicIdentities = new Set<unknown>(["anonymous", "username"]);
const managementActions = new Set<unknown>(["withdraw", "delete"]);

export const INTERVIEW_EXPERIENCE_INVALID_INPUT_ERROR = "The interview experience details are not valid.";
export const INTERVIEW_EXPERIENCE_INVALID_MANAGEMENT_ERROR = "That submission action is not valid.";
export const INTERVIEW_EXPERIENCE_SAVE_UNAVAILABLE_ERROR = "Interview experience saving is unavailable in this configuration.";
export const INTERVIEW_EXPERIENCE_MANAGEMENT_UNAVAILABLE_ERROR = "Interview experience management is unavailable in this configuration.";

export type ExperienceSubmissionInput = {
  id?: string;
  companyName: string;
  roleTitle: string;
  roleLevel: string;
  region: string;
  interviewDate: string;
  summary: string;
  preparationLessons: string;
  publicIdentity: "anonymous" | "username";
  publicationConsent: boolean;
  roundType: string;
  topics: string[];
};

export type ExperienceManagementAction = "withdraw" | "delete";

type ParseResult<T> = { ok: true; value: T } | { ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clean(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function parseInterviewExperienceSaveInput(
  input: unknown,
  submit: unknown,
): ParseResult<{ input: ExperienceSubmissionInput; submit: boolean }> {
  if (!isRecord(input) || typeof submit !== "boolean") return { ok: false };

  const {
    id,
    companyName,
    roleTitle,
    roleLevel,
    region,
    interviewDate,
    summary,
    preparationLessons,
    publicIdentity,
    publicationConsent,
    roundType,
    topics,
  } = input;

  if (
    (id !== undefined && (typeof id !== "string" || !UUID_PATTERN.test(id)))
    || typeof companyName !== "string"
    || typeof roleTitle !== "string"
    || typeof roleLevel !== "string"
    || typeof region !== "string"
    || typeof interviewDate !== "string"
    || typeof summary !== "string"
    || typeof preparationLessons !== "string"
    || typeof roundType !== "string"
    || !roleLevels.has(roleLevel)
    || !publicIdentities.has(publicIdentity)
    || typeof publicationConsent !== "boolean"
    || !Array.isArray(topics)
    || topics.some((topic) => typeof topic !== "string")
    || (interviewDate !== "" && !INTERVIEW_MONTH_PATTERN.test(interviewDate))
  ) return { ok: false };

  return {
    ok: true,
    value: {
      input: {
        id,
        companyName: clean(companyName, 120),
        roleTitle: clean(roleTitle, 160),
        roleLevel,
        region: clean(region, 120),
        interviewDate,
        summary: clean(summary, 4000),
        preparationLessons: clean(preparationLessons, 3000),
        publicIdentity: publicIdentity as ExperienceSubmissionInput["publicIdentity"],
        publicationConsent,
        roundType: clean(roundType, 80),
        topics: topics.slice(0, 12).map((topic) => clean(topic, 80)).filter(Boolean),
      },
      submit,
    },
  };
}

export function parseInterviewExperienceManagementInput(
  id: unknown,
  action: unknown,
): ParseResult<{ id: string; action: ExperienceManagementAction }> {
  if (typeof id !== "string" || !UUID_PATTERN.test(id) || !managementActions.has(action)) return { ok: false };
  return { ok: true, value: { id, action: action as ExperienceManagementAction } };
}
