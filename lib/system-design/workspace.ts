import { systemDesignPracticeContents } from "@/content/system-design/problems/data";
import { systemDesignTopicManifest } from "@/data/system-design/manifest";
import type { Json, SystemDesignAttemptRow, SystemDesignItemProgressRow } from "@/lib/supabase/database.types";

export const systemDesignStatuses = ["not_started", "reviewed", "review", "comfortable"] as const;
export const systemDesignConfidences = ["low", "medium", "high"] as const;
export const systemDesignAttemptStatuses = ["draft", "practiced", "review"] as const;
export type SystemDesignStatus = (typeof systemDesignStatuses)[number];
export type SystemDesignConfidence = (typeof systemDesignConfidences)[number];
export type SystemDesignAttemptStatus = (typeof systemDesignAttemptStatuses)[number];

export type CapacityAssumption = { label: string; value: string; unit: string };
export type CapacityCalculation = { label: string; formula: string; result: string };
export type AttemptApi = { method: string; path: string; purpose: string };
export type AttemptDataModel = { entity: string; fields: string; notes: string };
export type AttemptFailure = { failure: string; impact: string; mitigation: string };
export type AttemptTradeoff = { choice: string; benefit: string; cost: string };

export interface SystemDesignAttemptDocument {
  functional_requirements: string[];
  non_functional_requirements: string[];
  capacity: { assumptions: CapacityAssumption[]; calculations: CapacityCalculation[] };
  apis: AttemptApi[];
  data_models: AttemptDataModel[];
  high_level_design: string;
  deep_dives: string[];
  bottlenecks: string[];
  failure_modes: AttemptFailure[];
  tradeoffs: AttemptTradeoff[];
  follow_ups: string[];
  final_review_notes: string;
}

export type SystemDesignAttempt = Omit<SystemDesignAttemptRow, "document"> & { document: SystemDesignAttemptDocument };
export const canonicalSystemDesignConceptIds = new Set(systemDesignTopicManifest.filter((item) => item.published).map((item) => item.id));
export const canonicalSystemDesignProblemIds = new Set(systemDesignPracticeContents.map((item) => item.id));
export const canonicalSystemDesignItemIds = new Set([
  ...[...canonicalSystemDesignConceptIds].map((id) => `concept:${id}`),
  ...[...canonicalSystemDesignProblemIds].map((id) => `design_problem:${id}`),
]);

export function emptySystemDesignAttemptDocument(): SystemDesignAttemptDocument {
  return {
    functional_requirements: [], non_functional_requirements: [],
    capacity: { assumptions: [], calculations: [] }, apis: [], data_models: [],
    high_level_design: "", deep_dives: [], bottlenecks: [], failure_modes: [],
    tradeoffs: [], follow_ups: [], final_review_notes: "",
  };
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; message: string; field?: string };
const plainObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const bounded = (value: unknown, max: number) => typeof value === "string" && value.length <= max;

function stringList(value: unknown, field: string): ParseResult<string[]> {
  if (!Array.isArray(value) || value.length > 50 || value.some((item) => !bounded(item, 4000))) return { ok: false, field, message: `${field} contains unsupported content.` };
  return { ok: true, data: value.map((item) => String(item).trim()).filter(Boolean) };
}

function objectList<T extends Record<string, string>>(value: unknown, keys: readonly (keyof T)[], field: string): ParseResult<T[]> {
  if (!Array.isArray(value) || value.length > 50) return { ok: false, field, message: `${field} contains too many rows.` };
  const rows: T[] = [];
  for (const item of value) {
    if (!plainObject(item) || Object.keys(item).some((key) => !keys.includes(key as keyof T)) || keys.some((key) => !bounded(item[key as string], 4000))) {
      return { ok: false, field, message: `${field} contains an invalid row.` };
    }
    if (keys.some((key) => String(item[key as string]).trim())) rows.push(Object.fromEntries(keys.map((key) => [key, String(item[key as string]).trim()])) as T);
  }
  return { ok: true, data: rows };
}

export function validateSystemDesignAttemptDocument(value: unknown): ParseResult<SystemDesignAttemptDocument> {
  if (!plainObject(value)) return { ok: false, message: "The attempt document is not valid." };
  const allowed = new Set(["functional_requirements","non_functional_requirements","capacity","apis","data_models","high_level_design","deep_dives","bottlenecks","failure_modes","tradeoffs","follow_ups","final_review_notes"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return { ok: false, message: "The attempt document contains an unsupported section." };
  if (!plainObject(value.capacity) || Object.keys(value.capacity).some((key) => !["assumptions", "calculations"].includes(key))) return { ok: false, field: "capacity", message: "Capacity planning is not valid." };
  const functional = stringList(value.functional_requirements, "functional_requirements"); if (!functional.ok) return functional;
  const nonFunctional = stringList(value.non_functional_requirements, "non_functional_requirements"); if (!nonFunctional.ok) return nonFunctional;
  const assumptions = objectList<CapacityAssumption>(value.capacity.assumptions, ["label","value","unit"], "capacity_assumptions"); if (!assumptions.ok) return assumptions;
  const calculations = objectList<CapacityCalculation>(value.capacity.calculations, ["label","formula","result"], "capacity_calculations"); if (!calculations.ok) return calculations;
  const apis = objectList<AttemptApi>(value.apis, ["method","path","purpose"], "apis"); if (!apis.ok) return apis;
  const dataModels = objectList<AttemptDataModel>(value.data_models, ["entity","fields","notes"], "data_models"); if (!dataModels.ok) return dataModels;
  const deepDives = stringList(value.deep_dives, "deep_dives"); if (!deepDives.ok) return deepDives;
  const bottlenecks = stringList(value.bottlenecks, "bottlenecks"); if (!bottlenecks.ok) return bottlenecks;
  const failures = objectList<AttemptFailure>(value.failure_modes, ["failure","impact","mitigation"], "failure_modes"); if (!failures.ok) return failures;
  const tradeoffs = objectList<AttemptTradeoff>(value.tradeoffs, ["choice","benefit","cost"], "tradeoffs"); if (!tradeoffs.ok) return tradeoffs;
  const followUps = stringList(value.follow_ups, "follow_ups"); if (!followUps.ok) return followUps;
  if (!bounded(value.high_level_design, 30000) || !bounded(value.final_review_notes, 20000)) return { ok: false, message: "A long-form section is too large." };
  const data = {
    functional_requirements: functional.data, non_functional_requirements: nonFunctional.data,
    capacity: { assumptions: assumptions.data, calculations: calculations.data }, apis: apis.data,
    data_models: dataModels.data, high_level_design: String(value.high_level_design).trim(), deep_dives: deepDives.data,
    bottlenecks: bottlenecks.data, failure_modes: failures.data, tradeoffs: tradeoffs.data,
    follow_ups: followUps.data, final_review_notes: String(value.final_review_notes).trim(),
  };
  if (JSON.stringify(data).length > 200000) return { ok: false, message: "The attempt is too large to save." };
  return { ok: true, data };
}

const lines = (value: FormDataEntryValue | null) => String(value ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
const rows = <T extends Record<string, string>>(value: FormDataEntryValue | null, keys: readonly (keyof T)[]): T[] => lines(value).map((line) => {
  const cells = line.split("|").map((cell) => cell.trim());
  return Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? ""])) as T;
});

export function attemptDocumentFromForm(formData: FormData): ParseResult<SystemDesignAttemptDocument> {
  return validateSystemDesignAttemptDocument({
    functional_requirements: lines(formData.get("functional_requirements")),
    non_functional_requirements: lines(formData.get("non_functional_requirements")),
    capacity: {
      assumptions: rows<CapacityAssumption>(formData.get("capacity_assumptions"), ["label","value","unit"]),
      calculations: rows<CapacityCalculation>(formData.get("capacity_calculations"), ["label","formula","result"]),
    },
    apis: rows<AttemptApi>(formData.get("apis"), ["method","path","purpose"]),
    data_models: rows<AttemptDataModel>(formData.get("data_models"), ["entity","fields","notes"]),
    high_level_design: String(formData.get("high_level_design") ?? ""),
    deep_dives: lines(formData.get("deep_dives")), bottlenecks: lines(formData.get("bottlenecks")),
    failure_modes: rows<AttemptFailure>(formData.get("failure_modes"), ["failure","impact","mitigation"]),
    tradeoffs: rows<AttemptTradeoff>(formData.get("tradeoffs"), ["choice","benefit","cost"]),
    follow_ups: lines(formData.get("follow_ups")), final_review_notes: String(formData.get("final_review_notes") ?? ""),
  });
}

export function asSystemDesignAttempt(row: SystemDesignAttemptRow): SystemDesignAttempt | null {
  const parsed = validateSystemDesignAttemptDocument(row.document);
  return parsed.ok ? { ...row, document: parsed.data } : null;
}

export function progressBySystemDesignItem(rows: readonly SystemDesignItemProgressRow[]) {
  return Object.fromEntries(rows.map((row) => [`${row.item_type}:${row.item_id}`, row]));
}

export type SystemDesignContinueTarget =
  | { kind: "attempt"; title: string; detail: string; href: string; updatedAt: string }
  | { kind: "item"; itemType: "concept" | "design_problem"; title: string; detail: string; href: string; updatedAt: string | null };

type ContinueCatalogItem = { id: string; itemType: "concept" | "design_problem"; title: string; href: string };
type ContinueAttempt = Pick<SystemDesignAttemptRow, "id" | "problem_id" | "title" | "status" | "confidence" | "updated_at">;

const newestFirst = (left: string | null, right: string | null) => Date.parse(right ?? "") - Date.parse(left ?? "");

export function chooseSystemDesignContinueTarget(
  attempts: readonly ContinueAttempt[],
  progress: readonly SystemDesignItemProgressRow[],
  catalog: readonly ContinueCatalogItem[],
): SystemDesignContinueTarget | null {
  const orderedAttempts = [...attempts].sort((a, b) => newestFirst(a.updated_at, b.updated_at));
  const attempt = orderedAttempts.find((item) => item.status === "draft")
    ?? orderedAttempts.find((item) => item.status === "review");
  if (attempt) return {
    kind: "attempt",
    title: `${attempt.status === "draft" ? "Continue" : "Review"} ${attempt.title}`,
    detail: `${attempt.status === "draft" ? "Draft" : "Needs review"}${attempt.confidence ? ` · ${attempt.confidence} confidence` : ""}`,
    href: `/system-design/problems/${attempt.problem_id}/practice/${attempt.id}`,
    updatedAt: attempt.updated_at,
  };

  const catalogByKey = new Map(catalog.map((item) => [`${item.itemType}:${item.id}`, item]));
  const orderedProgress = [...progress].sort((a, b) => newestFirst(a.last_practiced_at ?? a.updated_at, b.last_practiced_at ?? b.updated_at));
  const progressTarget = orderedProgress.find((item) => item.status === "review")
    ?? orderedProgress.find((item) => item.confidence === "low");
  if (progressTarget) {
    const item = catalogByKey.get(`${progressTarget.item_type}:${progressTarget.item_id}`);
    if (item) return {
      kind: "item",
      itemType: item.itemType,
      title: `${progressTarget.status === "review" ? "Review" : "Revisit"} ${item.title}`,
      detail: progressTarget.status === "review" ? "Marked Needs review" : "Low self-reported confidence",
      href: item.href,
      updatedAt: progressTarget.last_practiced_at ?? progressTarget.updated_at,
    };
  }

  const lowConfidenceAttempt = orderedAttempts.find((item) => item.confidence === "low");
  if (lowConfidenceAttempt) return {
    kind: "attempt",
    title: `Revisit ${lowConfidenceAttempt.title}`,
    detail: "Low self-reported confidence",
    href: `/system-design/problems/${lowConfidenceAttempt.problem_id}/practice/${lowConfidenceAttempt.id}`,
    updatedAt: lowConfidenceAttempt.updated_at,
  };

  const latestAttempt = orderedAttempts[0];
  if (latestAttempt) return {
    kind: "attempt",
    title: `Revisit ${latestAttempt.title}`,
    detail: latestAttempt.status === "practiced" ? "Practiced attempt" : "Saved attempt",
    href: `/system-design/problems/${latestAttempt.problem_id}/practice/${latestAttempt.id}`,
    updatedAt: latestAttempt.updated_at,
  };

  const firstGap = catalog.find((item) => !progress.some((row) => row.item_id === item.id && row.item_type === item.itemType && row.status !== "not_started"));
  return firstGap ? { kind: "item", itemType: firstGap.itemType, title: `Start with ${firstGap.title}`, detail: "First unreviewed item in curriculum order", href: firstGap.href, updatedAt: null } : null;
}

export function attemptDocumentToJson(document: SystemDesignAttemptDocument): Json { return document as unknown as Json; }
export const formatRows = <T extends Record<string, string>>(rowsValue: readonly T[], keys: readonly (keyof T)[]) => rowsValue.map((row) => keys.map((key) => row[key]).join(" | ")).join("\n");
export const formatLines = (rowsValue: readonly string[]) => rowsValue.join("\n");
