import { systemDesignPracticeContentIds } from "@/content/system-design/problems/data";
import { dsaLanguages } from "@/data/dsa/languages";
import { dsaLevelRoadmaps } from "@/data/dsa/level-roadmaps";
import { dsaInterviewQuestionDatabase } from "@/data/dsa/question-database";
import { roadmapCompanies } from "@/data/dsa/roadmap-companies";
import { roadmapPreparationPlans } from "@/data/dsa/roadmap-planning";
import { roadmapProblems } from "@/data/dsa/roadmap-problem-registry";
import { dsaRoadmaps } from "@/data/dsa/roadmaps";
import {
  systemDesignLevelOptions,
  systemDesignPreparationWindowOptions,
  systemDesignRoleOptions,
  systemDesignTopics,
} from "@/data/system-design/recommendations";
import { systemDesignStudyTimeOptions } from "@/data/system-design/study-plan";
import {
  dsaProgressItemKinds,
  dsaProgressStatuses,
  systemDesignProgressItemKinds,
  type DsaProgressItemKind,
  type DsaProgressMutation,
  type DsaProgressSelector,
  type DsaProgressStatus,
  type SystemDesignProgressItemKind,
  type SystemDesignProgressMutation,
  type SystemDesignProgressSelector,
  type UserPreparationPreferencesPatch,
} from "./types";

type ValidationFailure = {
  ok: false;
  fieldErrors: Readonly<Record<string, string>>;
};

export type PreparationValidationResult<T> = { ok: true; data: T } | ValidationFailure;

const preferenceKeys = [
  "dsaLevel",
  "dsaPlanId",
  "dsaCompanySlug",
  "dsaPreferredLanguageSlug",
  "dsaInterviewDate",
  "systemDesignLevel",
  "systemDesignPreparationWindow",
  "systemDesignRole",
  "systemDesignMinutesPerDay",
] as const;

const preferenceKeySet = new Set<string>(preferenceKeys);
const dsaLevelIds = new Set(dsaLevelRoadmaps.map((roadmap) => roadmap.level));
const dsaPlanIds = new Set(roadmapPreparationPlans.map((plan) => plan.id));
const dsaCompanyIds = new Set(roadmapCompanies.map((company) => company.id));
const dsaLanguageIds = new Set(dsaLanguages.map((language) => language.slug));
const systemDesignLevels = new Set(systemDesignLevelOptions.map((option) => option.value));
const systemDesignWindows = new Set(systemDesignPreparationWindowOptions.map((option) => option.value));
const systemDesignRoles = new Set(systemDesignRoleOptions.flatMap((option) => option.value === "general" ? [] : [option.value]));
const systemDesignMinutes = new Set(systemDesignStudyTimeOptions.map((option) => option.value));

const dsaProblemIds = new Set([
  ...roadmapProblems.map((problem) => problem.id),
  ...dsaInterviewQuestionDatabase.map((question) => question.id),
]);
const dsaRoadmapTaskIds = new Set(dsaLevelRoadmaps.flatMap((roadmap) => [
  ...roadmap.modules.flatMap((module) => module.topics.map((topic) => topic.id)),
  ...(roadmap.optionalTopics ?? []).map((topic) => topic.id),
]).concat(dsaRoadmaps.flatMap((roadmap) => roadmap.phases.flatMap((phase) => phase.tasks.map((task) => task.id)))));
const dsaMixedSetIds = new Set(dsaLevelRoadmaps.flatMap((roadmap) => roadmap.mixedPracticeSets?.map((set) => set.id) ?? []));
const dsaTimedPracticeIds = new Set(dsaLevelRoadmaps.flatMap((roadmap) => roadmap.timedPracticeModes?.map((mode) => mode.id) ?? []));

const systemDesignTopicIds = new Set(systemDesignTopics.filter((topic) => topic.published).map((topic) => topic.id));

const dsaStatusesByKind: Readonly<Record<DsaProgressItemKind, ReadonlySet<DsaProgressStatus>>> = {
  problem: new Set(["attempted", "solved", "review", "comfortable"]),
  "roadmap-task": new Set(["in-progress", "completed"]),
  "mixed-set": new Set(["attempted", "completed"]),
  "timed-practice": new Set(["attempted", "completed"]),
};

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input) && Object.getPrototypeOf(input) === Object.prototype;
}

function hasOnlyKeys(input: Record<string, unknown>, allowed: ReadonlySet<string>, errors: Record<string, string>) {
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) errors[key] = "This field is not supported.";
  }
}

function isCanonicalString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value === value.trim();
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function validateNullableMembership(
  input: Record<string, unknown>,
  key: string,
  allowed: ReadonlySet<unknown>,
  errors: Record<string, string>,
) {
  if (!(key in input) || input[key] === null) return;
  if (!allowed.has(input[key])) errors[key] = "Choose a supported value.";
}

export function validatePreparationPreferencesPatch(input: unknown): PreparationValidationResult<UserPreparationPreferencesPatch> {
  if (!isPlainObject(input)) return { ok: false, fieldErrors: { form: "Preparation preferences must be an object." } };
  const errors: Record<string, string> = {};
  hasOnlyKeys(input, preferenceKeySet, errors);
  if (!preferenceKeys.some((key) => key in input)) errors.form = "Provide at least one preparation preference.";

  validateNullableMembership(input, "dsaLevel", dsaLevelIds, errors);
  validateNullableMembership(input, "dsaPlanId", dsaPlanIds, errors);
  validateNullableMembership(input, "dsaCompanySlug", dsaCompanyIds, errors);
  validateNullableMembership(input, "dsaPreferredLanguageSlug", dsaLanguageIds, errors);
  validateNullableMembership(input, "systemDesignLevel", systemDesignLevels, errors);
  validateNullableMembership(input, "systemDesignPreparationWindow", systemDesignWindows, errors);
  validateNullableMembership(input, "systemDesignRole", systemDesignRoles, errors);
  validateNullableMembership(input, "systemDesignMinutesPerDay", systemDesignMinutes, errors);
  if ("dsaInterviewDate" in input && input.dsaInterviewDate !== null && !isCalendarDate(input.dsaInterviewDate)) {
    errors.dsaInterviewDate = "Use a valid date in YYYY-MM-DD format.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, data: Object.fromEntries(preferenceKeys.filter((key) => key in input).map((key) => [key, input[key]])) as UserPreparationPreferencesPatch };
}

function validateDsaItemId(itemKind: DsaProgressItemKind, itemId: unknown) {
  if (!isCanonicalString(itemId)) return false;
  if (itemKind === "problem") return dsaProblemIds.has(itemId);
  if (itemKind === "roadmap-task") return dsaRoadmapTaskIds.has(itemId);
  if (itemKind === "mixed-set") return dsaMixedSetIds.has(itemId);
  return dsaTimedPracticeIds.has(itemId);
}

function validateDsaSelector(input: unknown): PreparationValidationResult<DsaProgressSelector> {
  if (!isPlainObject(input)) return { ok: false, fieldErrors: { form: "DSA progress must be an object." } };
  const errors: Record<string, string> = {};
  hasOnlyKeys(input, new Set(["itemKind", "itemId"]), errors);
  if (!dsaProgressItemKinds.includes(input.itemKind as DsaProgressItemKind)) errors.itemKind = "Choose a supported DSA item type.";
  if (!("itemId" in input)) errors.itemId = "Choose a DSA item.";
  if (!errors.itemKind && !validateDsaItemId(input.itemKind as DsaProgressItemKind, input.itemId)) errors.itemId = "Choose an item from the DSA curriculum.";
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, data: { itemKind: input.itemKind as DsaProgressItemKind, itemId: input.itemId as string } };
}

export function validateDsaProgressSelector(input: unknown): PreparationValidationResult<DsaProgressSelector> {
  return validateDsaSelector(input);
}

export function validateDsaProgressMutation(input: unknown): PreparationValidationResult<DsaProgressMutation> {
  if (!isPlainObject(input)) return { ok: false, fieldErrors: { form: "DSA progress must be an object." } };
  const errors: Record<string, string> = {};
  hasOnlyKeys(input, new Set(["itemKind", "itemId", "status"]), errors);
  if (!dsaProgressItemKinds.includes(input.itemKind as DsaProgressItemKind)) errors.itemKind = "Choose a supported DSA item type.";
  if (!("itemId" in input)) errors.itemId = "Choose a DSA item.";
  if (!errors.itemKind && !validateDsaItemId(input.itemKind as DsaProgressItemKind, input.itemId)) errors.itemId = "Choose an item from the DSA curriculum.";
  if (input.status !== "not-started" && !dsaProgressStatuses.includes(input.status as DsaProgressStatus)) {
    errors.status = "Choose a supported DSA progress status.";
  } else if (!errors.itemKind && input.status !== "not-started" && !dsaStatusesByKind[input.itemKind as DsaProgressItemKind].has(input.status as DsaProgressStatus)) {
    errors.status = "Choose a progress status supported by this DSA item type.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, data: input as unknown as DsaProgressMutation };
}

function validateSystemDesignItemId(itemKind: SystemDesignProgressItemKind, itemId: unknown) {
  if (!isCanonicalString(itemId)) return false;
  if (itemKind === "topic") return systemDesignTopicIds.has(itemId);
  if (itemKind === "practice") return systemDesignPracticeContentIds.has(itemId);
  if (itemKind === "simulation") return itemId === "final";
  const [topicId, dayLabel, extra] = itemId.split(":");
  if (!systemDesignTopicIds.has(topicId) || extra !== undefined) return false;
  if (dayLabel === undefined) return true;
  if (!/^day-(?:[1-9]|[12]\d|30)$/.test(dayLabel)) return false;
  return true;
}

function validateSystemDesignSelector(input: unknown): PreparationValidationResult<SystemDesignProgressSelector> {
  if (!isPlainObject(input)) return { ok: false, fieldErrors: { form: "System Design progress must be an object." } };
  const errors: Record<string, string> = {};
  hasOnlyKeys(input, new Set(["itemKind", "itemId"]), errors);
  if (!systemDesignProgressItemKinds.includes(input.itemKind as SystemDesignProgressItemKind)) errors.itemKind = "Choose a supported System Design item type.";
  if (!("itemId" in input)) errors.itemId = "Choose a System Design item.";
  if (!errors.itemKind && !validateSystemDesignItemId(input.itemKind as SystemDesignProgressItemKind, input.itemId)) {
    errors.itemId = "Choose an item from the published System Design curriculum.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, data: { itemKind: input.itemKind as SystemDesignProgressItemKind, itemId: input.itemId as string } };
}

export function validateSystemDesignProgressSelector(input: unknown): PreparationValidationResult<SystemDesignProgressSelector> {
  return validateSystemDesignSelector(input);
}

export function validateSystemDesignProgressMutation(input: unknown): PreparationValidationResult<SystemDesignProgressMutation> {
  if (!isPlainObject(input)) return { ok: false, fieldErrors: { form: "System Design progress must be an object." } };
  const errors: Record<string, string> = {};
  hasOnlyKeys(input, new Set(["itemKind", "itemId", "status"]), errors);
  if (!systemDesignProgressItemKinds.includes(input.itemKind as SystemDesignProgressItemKind)) errors.itemKind = "Choose a supported System Design item type.";
  if (!("itemId" in input)) errors.itemId = "Choose a System Design item.";
  if (!errors.itemKind && !validateSystemDesignItemId(input.itemKind as SystemDesignProgressItemKind, input.itemId)) {
    errors.itemId = "Choose an item from the published System Design curriculum.";
  }
  if (!(["not-started", "in-progress", "completed"] as const).includes(input.status as "not-started" | "in-progress" | "completed")) {
    errors.status = "Choose a supported System Design progress status.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, data: input as unknown as SystemDesignProgressMutation };
}

export function validateLocalSystemDesignImportVersion(input: unknown): PreparationValidationResult<number> {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 1 || input > 2_147_483_647) {
    return { ok: false, fieldErrors: { version: "Use a positive System Design import version." } };
  }
  return { ok: true, data: input };
}
