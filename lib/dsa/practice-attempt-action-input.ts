import {
  DSA_PRACTICE_CATALOG_VERSION,
  dsaErrorRecoveryStates,
  dsaPracticeCheckpoints,
  dsaPracticeModes,
  dsaPracticeStatuses,
  dsaPriorExposureLevels,
  dsaRubricBands,
  dsaRubricDimensions,
  emptyDsaPracticeAttemptDocument,
  validateDsaPracticeAttemptDocument,
  type DsaPracticeAttemptDocument,
  type DsaPracticeCheckpoint,
  type DsaPracticeMode,
  type DsaPracticeStatus,
  type DsaPriorExposure,
  type DsaRubricBand,
} from "./practice-attempt.ts";
import { canonicalDsaQuestionById } from "./catalog.ts";

export const DSA_ATTEMPT_INVALID_INPUT = "Review the practice fields and try again.";
export const DSA_ATTEMPT_PERSISTENCE_ERROR = "We couldn't save this practice attempt.";
export const DSA_ATTEMPT_CONFLICT_ERROR = "This attempt changed since you opened it. Your edits were not saved. Review the latest saved version before trying again.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const singletonFields = ["expected_revision", "title", "status", "mode", "duration_minutes", "prior_exposure", "elapsed_seconds", "clarification_notes", "brute_force_notes", "approach_notes", "implementation_notes", "test_notes", "complexity_notes", "reflection", "hints_used", "error_recovery", "follow_up", ...dsaRubricDimensions.flatMap(([id]) => [`review_${id}`, `evidence_${id}`])] as const;
const checkpointFields = dsaPracticeCheckpoints.map((id) => `checkpoint_${id}`);
const saveFields = new Set([...singletonFields, ...checkpointFields]);
const createFields = new Set(["title", "mode", "duration_minutes", "prior_exposure"]);

function isFormData(value: unknown): value is FormData { return typeof FormData !== "undefined" && value instanceof FormData; }
function onlyFields(form: FormData, allowed: ReadonlySet<string>) { for (const key of form.keys()) if (!allowed.has(key) && !key.startsWith("$ACTION_")) return false; return true; }
function single(form: FormData, name: string) { const values = form.getAll(name); return values.length === 1 && typeof values[0] === "string" && values[0].length <= 50_000 && !values[0].includes("\0") ? values[0] : null; }
function title(value: string | null) { const next = value?.trim() ?? ""; return Array.from(next).length >= 1 && Array.from(next).length <= 160 ? next : null; }
function timing(modeValue: string | null, durationValue: string | null) {
  if (!modeValue || !dsaPracticeModes.includes(modeValue as DsaPracticeMode) || durationValue === null) return null;
  const mode = modeValue as DsaPracticeMode;
  if (mode !== "timed") return durationValue === "" ? { mode, durationMinutes: null } : null;
  if (!/^\d+$/.test(durationValue)) return null;
  const durationMinutes = Number(durationValue);
  return Number.isSafeInteger(durationMinutes) && durationMinutes >= 10 && durationMinutes <= 120 ? { mode, durationMinutes } : null;
}
function checked(form: FormData, name: string) { const values = form.getAll(name); if (!values.length) return false; return values.length === 1 && values[0] === "yes" ? true : null; }

export function parseDsaAttemptCreateInput(questionId: unknown, value: unknown) {
  if (typeof questionId !== "string" || !canonicalDsaQuestionById.get(questionId)?.inQuestionBrowser || !isFormData(value) || !onlyFields(value, createFields)) return null;
  const parsedTitle = title(single(value, "title"));
  const parsedTiming = timing(single(value, "mode"), single(value, "duration_minutes"));
  const exposure = single(value, "prior_exposure");
  if (!parsedTitle || !parsedTiming || !exposure || !dsaPriorExposureLevels.includes(exposure as DsaPriorExposure)) return null;
  return { questionId, catalogVersion: DSA_PRACTICE_CATALOG_VERSION, title: parsedTitle, ...parsedTiming, priorExposure: exposure as DsaPriorExposure, document: emptyDsaPracticeAttemptDocument() };
}

export function parseDsaAttemptSaveInput(attemptId: unknown, questionId: unknown, value: unknown) {
  if (typeof attemptId !== "string" || !UUID.test(attemptId) || typeof questionId !== "string" || !canonicalDsaQuestionById.get(questionId)?.inQuestionBrowser || !isFormData(value) || !onlyFields(value, saveFields)) return null;
  const values = new Map<string, string>();
  for (const field of singletonFields) { const next = single(value, field); if (next === null) return null; values.set(field, next); }
  const parsedTitle = title(values.get("title") ?? null);
  const parsedTiming = timing(values.get("mode") ?? null, values.get("duration_minutes") ?? null);
  const status = values.get("status") as DsaPracticeStatus;
  const exposure = values.get("prior_exposure") as DsaPriorExposure;
  const revisionText = values.get("expected_revision") ?? "";
  const elapsedText = values.get("elapsed_seconds") ?? "";
  const hintsText = values.get("hints_used") ?? "";
  const revision = Number(revisionText); const elapsedSeconds = Number(elapsedText); const hintsUsed = Number(hintsText);
  if (!parsedTitle || !parsedTiming || !dsaPracticeStatuses.includes(status) || !dsaPriorExposureLevels.includes(exposure) || !/^\d+$/.test(revisionText) || !Number.isSafeInteger(revision) || revision < 1 || !/^\d+$/.test(elapsedText) || !Number.isSafeInteger(elapsedSeconds) || elapsedSeconds > 86400 || !/^\d+$/.test(hintsText) || !Number.isSafeInteger(hintsUsed) || hintsUsed > 20 || !dsaErrorRecoveryStates.includes(values.get("error_recovery") as (typeof dsaErrorRecoveryStates)[number])) return null;
  const completed: DsaPracticeCheckpoint[] = [];
  for (const checkpoint of dsaPracticeCheckpoints) { const present = checked(value, `checkpoint_${checkpoint}`); if (present === null) return null; if (present) completed.push(checkpoint); }
  const selfReview: DsaPracticeAttemptDocument["self_review"] = {};
  const evidence: DsaPracticeAttemptDocument["dimension_evidence"] = {};
  for (const [id] of dsaRubricDimensions) {
    const band = values.get(`review_${id}`) ?? ""; const note = values.get(`evidence_${id}`) ?? "";
    if (band && !dsaRubricBands.includes(band as DsaRubricBand)) return null;
    if (band) selfReview[id] = band as DsaRubricBand;
    if (note) evidence[id] = note;
  }
  const document = validateDsaPracticeAttemptDocument({ clarification_notes: values.get("clarification_notes"), brute_force_notes: values.get("brute_force_notes"), approach_notes: values.get("approach_notes"), implementation_notes: values.get("implementation_notes"), test_notes: values.get("test_notes"), complexity_notes: values.get("complexity_notes"), reflection: values.get("reflection"), completed_checkpoints: completed, hints_used: hintsUsed, error_recovery: values.get("error_recovery"), self_review: selfReview, dimension_evidence: evidence, follow_up: values.get("follow_up") });
  return document ? { attemptId: attemptId.toLowerCase(), questionId, catalogVersion: DSA_PRACTICE_CATALOG_VERSION, expectedRevision: revision, title: parsedTitle, status, ...parsedTiming, priorExposure: exposure, elapsedSeconds, document } : null;
}

export function parseDsaAttemptSaveResult(value: unknown, expected: NonNullable<ReturnType<typeof parseDsaAttemptSaveInput>>) {
  if (!Array.isArray(value)) return "invalid" as const;
  if (value.length === 0) return "conflict" as const;
  if (value.length !== 1 || value[0] === null || typeof value[0] !== "object" || Array.isArray(value[0])) return "invalid" as const;
  const row = value[0] as Record<string, unknown>;
  const document = validateDsaPracticeAttemptDocument(row.document);
  if (row.id !== expected.attemptId || row.question_id !== expected.questionId || row.catalog_version !== expected.catalogVersion || row.title !== expected.title || row.status !== expected.status || row.mode !== expected.mode || row.duration_minutes !== expected.durationMinutes || row.prior_exposure !== expected.priorExposure || row.elapsed_seconds !== expected.elapsedSeconds || row.revision !== expected.expectedRevision + 1 || !document) return "invalid" as const;
  return { status: "saved" as const, revision: row.revision as number };
}

export function isDsaAttemptId(value: unknown): value is string { return typeof value === "string" && UUID.test(value); }
