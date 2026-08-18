import "server-only";

import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor, type AuthenticatedActor } from "@/lib/auth/actor";
import type {
  Database,
  DsaProgressRow,
  SystemDesignProgressRow,
  UserPreparationPreferenceRow,
} from "@/lib/supabase/database.types";
import type { RoadmapProblemStatus, RoadmapProgressSnapshot } from "@/data/dsa/roadmap-planning";
import type {
  CurrentPreparationState,
  DsaProgressItem,
  DsaProgressMutation,
  DsaProgressSelector,
  DsaProgressStatus,
  PreparationDeleteResult,
  PreparationImportCandidates,
  PreparationStateAdapters,
  PreparationStateErrorCode,
  PreparationStateResult,
  SystemDesignProgressItem,
  SystemDesignProgressMap,
  SystemDesignProgressMutation,
  SystemDesignProgressSelector,
  SystemDesignProgressStatus,
  UserPreparationPreferences,
  UserPreparationPreferencesPatch,
} from "./types";
import {
  validateDsaProgressMutation,
  validateDsaProgressSelector,
  validateLocalSystemDesignImportVersion,
  validatePreparationPreferencesPatch,
  validateSystemDesignProgressMutation,
  validateSystemDesignProgressSelector,
} from "./validation";

type PreferenceInsert = Database["public"]["Tables"]["user_preparation_preferences"]["Insert"];
type PreferenceUpdate = Database["public"]["Tables"]["user_preparation_preferences"]["Update"];
type DsaProgressInsert = Database["public"]["Tables"]["dsa_progress"]["Insert"];
type SystemDesignProgressInsert = Database["public"]["Tables"]["system_design_progress"]["Insert"];
type PersistedDsaProgressMutation = Omit<DsaProgressMutation, "status"> & { status: DsaProgressStatus };
type PersistedSystemDesignProgressMutation = Omit<SystemDesignProgressMutation, "status"> & { status: SystemDesignProgressStatus };

const messages: Readonly<Record<PreparationStateErrorCode, string>> = {
  "account-unavailable": "Account persistence is not available.",
  unauthenticated: "Sign in to save preparation progress.",
  "invalid-input": "Review the preparation state values.",
  "persistence-failed": "We couldn't access preparation state. Try again.",
};

function failure<T>(code: PreparationStateErrorCode, fieldErrors?: Readonly<Record<string, string>>): PreparationStateResult<T> {
  return { ok: false, error: { code, message: messages[code], ...(fieldErrors ? { fieldErrors } : {}) } };
}

async function getCurrentActor(): Promise<PreparationStateResult<AuthenticatedActor>> {
  if (!isAccountPlatformAvailable()) return failure("account-unavailable");
  const actor = await getAuthenticatedActor();
  if (!actor) return failure("unauthenticated");
  return { ok: true, data: actor };
}

function mapPreferences(row: UserPreparationPreferenceRow): UserPreparationPreferences {
  return {
    dsaLevel: row.dsa_level,
    dsaPlanId: row.dsa_plan_id,
    dsaCompanySlug: row.dsa_company_slug as UserPreparationPreferences["dsaCompanySlug"],
    dsaPreferredLanguageSlug: row.dsa_preferred_language_slug as UserPreparationPreferences["dsaPreferredLanguageSlug"],
    dsaInterviewDate: row.dsa_interview_date,
    systemDesignLevel: row.system_design_level,
    systemDesignPreparationWindow: row.system_design_preparation_window,
    systemDesignRole: row.system_design_role,
    systemDesignMinutesPerDay: row.system_design_minutes_per_day,
    localSystemDesignImportVersion: row.local_system_design_import_version,
    localSystemDesignImportedAt: row.local_system_design_imported_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDsaProgress(row: DsaProgressRow): DsaProgressItem {
  return {
    itemKind: row.item_kind,
    itemId: row.item_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSystemDesignProgress(row: SystemDesignProgressRow): SystemDesignProgressItem {
  return {
    itemKind: row.item_kind,
    itemId: row.item_id,
    status: row.status,
    completedAt: row.completed_at,
    lastInteractedAt: row.last_interacted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function preferenceFields(patch: UserPreparationPreferencesPatch): PreferenceUpdate {
  const fields: PreferenceUpdate = {};
  if (Object.hasOwn(patch, "dsaLevel")) fields.dsa_level = patch.dsaLevel ?? null;
  if (Object.hasOwn(patch, "dsaPlanId")) fields.dsa_plan_id = patch.dsaPlanId ?? null;
  if (Object.hasOwn(patch, "dsaCompanySlug")) fields.dsa_company_slug = patch.dsaCompanySlug ?? null;
  if (Object.hasOwn(patch, "dsaPreferredLanguageSlug")) fields.dsa_preferred_language_slug = patch.dsaPreferredLanguageSlug ?? null;
  if (Object.hasOwn(patch, "dsaInterviewDate")) fields.dsa_interview_date = patch.dsaInterviewDate ?? null;
  if (Object.hasOwn(patch, "systemDesignLevel")) fields.system_design_level = patch.systemDesignLevel ?? null;
  if (Object.hasOwn(patch, "systemDesignPreparationWindow")) fields.system_design_preparation_window = patch.systemDesignPreparationWindow ?? null;
  if (Object.hasOwn(patch, "systemDesignRole")) fields.system_design_role = patch.systemDesignRole ?? null;
  if (Object.hasOwn(patch, "systemDesignMinutesPerDay")) fields.system_design_minutes_per_day = patch.systemDesignMinutesPerDay ?? null;
  return fields;
}

async function readPreferences(actor: AuthenticatedActor): Promise<PreparationStateResult<UserPreparationPreferences | null>> {
  const { data, error } = await actor.supabase
    .from("user_preparation_preferences")
    .select("*")
    .eq("user_id", actor.user.id)
    .maybeSingle();
  if (error) return failure("persistence-failed");
  return { ok: true, data: data ? mapPreferences(data) : null };
}

async function readDsaProgress(actor: AuthenticatedActor): Promise<PreparationStateResult<DsaProgressItem[]>> {
  const { data, error } = await actor.supabase
    .from("dsa_progress")
    .select("*")
    .eq("user_id", actor.user.id)
    .order("updated_at", { ascending: false });
  if (error) return failure("persistence-failed");
  return { ok: true, data: (data ?? []).map(mapDsaProgress) };
}

async function readSystemDesignProgress(actor: AuthenticatedActor): Promise<PreparationStateResult<SystemDesignProgressItem[]>> {
  const { data, error } = await actor.supabase
    .from("system_design_progress")
    .select("*")
    .eq("user_id", actor.user.id)
    .order("last_interacted_at", { ascending: false });
  if (error) return failure("persistence-failed");
  return { ok: true, data: (data ?? []).map(mapSystemDesignProgress) };
}

async function writePreferences(
  actor: AuthenticatedActor,
  fields: PreferenceUpdate,
): Promise<PreparationStateResult<UserPreparationPreferences>> {
  const update = await actor.supabase
    .from("user_preparation_preferences")
    .update(fields)
    .eq("user_id", actor.user.id)
    .select("*")
    .maybeSingle();
  if (update.error) return failure("persistence-failed");
  if (update.data) return { ok: true, data: mapPreferences(update.data) };

  const insertValues: PreferenceInsert = { user_id: actor.user.id, ...fields };
  const insert = await actor.supabase
    .from("user_preparation_preferences")
    .insert(insertValues)
    .select("*")
    .single();
  if (!insert.error) return { ok: true, data: mapPreferences(insert.data) };
  if (insert.error.code !== "23505") return failure("persistence-failed");

  const retry = await actor.supabase
    .from("user_preparation_preferences")
    .update(fields)
    .eq("user_id", actor.user.id)
    .select("*")
    .maybeSingle();
  if (retry.error || !retry.data) return failure("persistence-failed");
  return { ok: true, data: mapPreferences(retry.data) };
}

async function deleteDsaProgress(
  actor: AuthenticatedActor,
  selector: DsaProgressSelector,
): Promise<PreparationStateResult<PreparationDeleteResult>> {
  const { data, error } = await actor.supabase
    .from("dsa_progress")
    .delete()
    .eq("user_id", actor.user.id)
    .eq("item_kind", selector.itemKind)
    .eq("item_id", selector.itemId)
    .select("item_id");
  if (error) return failure("persistence-failed");
  return { ok: true, data: { deleted: (data?.length ?? 0) > 0 } };
}

async function writeDsaProgress(
  actor: AuthenticatedActor,
  mutation: PersistedDsaProgressMutation,
): Promise<PreparationStateResult<DsaProgressItem>> {
  const selector = actor.supabase
    .from("dsa_progress")
    .update({ status: mutation.status })
    .eq("user_id", actor.user.id)
    .eq("item_kind", mutation.itemKind)
    .eq("item_id", mutation.itemId)
    .select("*");
  const update = await selector.maybeSingle();
  if (update.error) return failure("persistence-failed");
  if (update.data) return { ok: true, data: mapDsaProgress(update.data) };

  const insertValues: DsaProgressInsert = {
    user_id: actor.user.id,
    item_kind: mutation.itemKind,
    item_id: mutation.itemId,
    status: mutation.status,
  };
  const insert = await actor.supabase.from("dsa_progress").insert(insertValues).select("*").single();
  if (!insert.error) return { ok: true, data: mapDsaProgress(insert.data) };
  if (insert.error.code !== "23505") return failure("persistence-failed");

  const retry = await actor.supabase
    .from("dsa_progress")
    .update({ status: mutation.status })
    .eq("user_id", actor.user.id)
    .eq("item_kind", mutation.itemKind)
    .eq("item_id", mutation.itemId)
    .select("*")
    .maybeSingle();
  if (retry.error || !retry.data) return failure("persistence-failed");
  return { ok: true, data: mapDsaProgress(retry.data) };
}

async function deleteSystemDesignProgress(
  actor: AuthenticatedActor,
  selector: SystemDesignProgressSelector,
): Promise<PreparationStateResult<PreparationDeleteResult>> {
  const { data, error } = await actor.supabase
    .from("system_design_progress")
    .delete()
    .eq("user_id", actor.user.id)
    .eq("item_kind", selector.itemKind)
    .eq("item_id", selector.itemId)
    .select("item_id");
  if (error) return failure("persistence-failed");
  return { ok: true, data: { deleted: (data?.length ?? 0) > 0 } };
}

async function writeSystemDesignProgress(
  actor: AuthenticatedActor,
  mutation: PersistedSystemDesignProgressMutation,
): Promise<PreparationStateResult<SystemDesignProgressItem>> {
  const now = new Date().toISOString();
  const values = {
    status: mutation.status,
    completed_at: mutation.status === "completed" ? now : null,
    last_interacted_at: now,
  } as const;
  const update = await actor.supabase
    .from("system_design_progress")
    .update(values)
    .eq("user_id", actor.user.id)
    .eq("item_kind", mutation.itemKind)
    .eq("item_id", mutation.itemId)
    .select("*")
    .maybeSingle();
  if (update.error) return failure("persistence-failed");
  if (update.data) return { ok: true, data: mapSystemDesignProgress(update.data) };

  const insertValues: SystemDesignProgressInsert = {
    user_id: actor.user.id,
    item_kind: mutation.itemKind,
    item_id: mutation.itemId,
    ...values,
  };
  const insert = await actor.supabase.from("system_design_progress").insert(insertValues).select("*").single();
  if (!insert.error) return { ok: true, data: mapSystemDesignProgress(insert.data) };
  if (insert.error.code !== "23505") return failure("persistence-failed");

  const retry = await actor.supabase
    .from("system_design_progress")
    .update(values)
    .eq("user_id", actor.user.id)
    .eq("item_kind", mutation.itemKind)
    .eq("item_id", mutation.itemId)
    .select("*")
    .maybeSingle();
  if (retry.error || !retry.data) return failure("persistence-failed");
  return { ok: true, data: mapSystemDesignProgress(retry.data) };
}

export async function getCurrentPreparationPreferences(): Promise<PreparationStateResult<UserPreparationPreferences | null>> {
  const current = await getCurrentActor();
  if (!current.ok) return current;
  return readPreferences(current.data);
}

export async function updateCurrentPreparationPreferences(input: unknown): Promise<PreparationStateResult<UserPreparationPreferences>> {
  const parsed = validatePreparationPreferencesPatch(input);
  if (!parsed.ok) return failure("invalid-input", parsed.fieldErrors);
  const current = await getCurrentActor();
  if (!current.ok) return current;
  return writePreferences(current.data, preferenceFields(parsed.data));
}

/**
 * Records a completed one-time local import. Call this only after every accepted
 * progress candidate has been persisted; versions never move backward.
 */
export async function markCurrentLocalSystemDesignImported(input: unknown): Promise<PreparationStateResult<UserPreparationPreferences>> {
  const parsed = validateLocalSystemDesignImportVersion(input);
  if (!parsed.ok) return failure("invalid-input", parsed.fieldErrors);
  const current = await getCurrentActor();
  if (!current.ok) return current;
  const recorded = await current.data.supabase.rpc("record_local_system_design_import", { import_version: parsed.data });
  if (recorded.error) return failure("persistence-failed");

  // The database serializes the marker and rejects version regressions. Read
  // the authoritative row even when another request already recorded a newer
  // version, so idempotent/reordered calls still return trustworthy state.
  const preferences = await readPreferences(current.data);
  if (!preferences.ok) return preferences;
  const storedVersion = preferences.data?.localSystemDesignImportVersion;
  if (!preferences.data || storedVersion === null || storedVersion === undefined || storedVersion < parsed.data) return failure("persistence-failed");
  return { ok: true, data: preferences.data };
}

export async function deleteCurrentPreparationPreferences(): Promise<PreparationStateResult<PreparationDeleteResult>> {
  const current = await getCurrentActor();
  if (!current.ok) return current;
  const { data, error } = await current.data.supabase
    .from("user_preparation_preferences")
    .delete()
    .eq("user_id", current.data.user.id)
    .select("user_id");
  if (error) return failure("persistence-failed");
  return { ok: true, data: { deleted: (data?.length ?? 0) > 0 } };
}

export async function getCurrentDsaProgress(): Promise<PreparationStateResult<DsaProgressItem[]>> {
  const current = await getCurrentActor();
  if (!current.ok) return current;
  return readDsaProgress(current.data);
}

export async function setCurrentDsaProgress(input: unknown): Promise<PreparationStateResult<DsaProgressItem | null>> {
  const parsed = validateDsaProgressMutation(input);
  if (!parsed.ok) return failure("invalid-input", parsed.fieldErrors);
  const current = await getCurrentActor();
  if (!current.ok) return current;
  if (parsed.data.status === "not-started") {
    const deleted = await deleteDsaProgress(current.data, parsed.data);
    return deleted.ok ? { ok: true, data: null } : deleted;
  }
  return writeDsaProgress(current.data, { ...parsed.data, status: parsed.data.status });
}

export async function deleteCurrentDsaProgressItem(input: unknown): Promise<PreparationStateResult<PreparationDeleteResult>> {
  const parsed = validateDsaProgressSelector(input);
  if (!parsed.ok) return failure("invalid-input", parsed.fieldErrors);
  const current = await getCurrentActor();
  if (!current.ok) return current;
  return deleteDsaProgress(current.data, parsed.data);
}

export async function getCurrentSystemDesignProgress(): Promise<PreparationStateResult<SystemDesignProgressItem[]>> {
  const current = await getCurrentActor();
  if (!current.ok) return current;
  return readSystemDesignProgress(current.data);
}

export async function setCurrentSystemDesignProgress(input: unknown): Promise<PreparationStateResult<SystemDesignProgressItem | null>> {
  const parsed = validateSystemDesignProgressMutation(input);
  if (!parsed.ok) return failure("invalid-input", parsed.fieldErrors);
  const current = await getCurrentActor();
  if (!current.ok) return current;
  if (parsed.data.status === "not-started") {
    const deleted = await deleteSystemDesignProgress(current.data, parsed.data);
    return deleted.ok ? { ok: true, data: null } : deleted;
  }
  return writeSystemDesignProgress(current.data, { ...parsed.data, status: parsed.data.status });
}

export async function deleteCurrentSystemDesignProgressItem(input: unknown): Promise<PreparationStateResult<PreparationDeleteResult>> {
  const parsed = validateSystemDesignProgressSelector(input);
  if (!parsed.ok) return failure("invalid-input", parsed.fieldErrors);
  const current = await getCurrentActor();
  if (!current.ok) return current;
  return deleteSystemDesignProgress(current.data, parsed.data);
}

export async function getCurrentPreparationState(): Promise<PreparationStateResult<CurrentPreparationState>> {
  const current = await getCurrentActor();
  if (!current.ok) return current;
  const [preferences, dsaProgress, systemDesignProgress] = await Promise.all([
    readPreferences(current.data),
    readDsaProgress(current.data),
    readSystemDesignProgress(current.data),
  ]);
  if (!preferences.ok) return preferences;
  if (!dsaProgress.ok) return dsaProgress;
  if (!systemDesignProgress.ok) return systemDesignProgress;
  return {
    ok: true,
    data: {
      preferences: preferences.data,
      dsaProgress: dsaProgress.data,
      systemDesignProgress: systemDesignProgress.data,
    },
  };
}

export function toRoadmapProgressSnapshot(items: readonly DsaProgressItem[]): RoadmapProgressSnapshot {
  const statusByProblemId: Partial<Record<string, RoadmapProblemStatus>> = {};
  const diagnosticReviewProblemIds: string[] = [];
  const mixedSetStatusById: Partial<Record<string, "attempted" | "completed">> = {};
  const timedPracticeCompletedIds: string[] = [];
  let lastProblem: DsaProgressItem | undefined;

  for (const item of items) {
    if (item.itemKind === "problem" && ["attempted", "solved", "review", "comfortable"].includes(item.status)) {
      statusByProblemId[item.itemId] = item.status as RoadmapProblemStatus;
      if (item.status === "review") diagnosticReviewProblemIds.push(item.itemId);
      if (!lastProblem || item.updatedAt > lastProblem.updatedAt) lastProblem = item;
    } else if (item.itemKind === "mixed-set" && (item.status === "attempted" || item.status === "completed")) {
      mixedSetStatusById[item.itemId] = item.status;
    } else if (item.itemKind === "timed-practice" && item.status === "completed") {
      timedPracticeCompletedIds.push(item.itemId);
    }
  }

  return {
    statusByProblemId,
    diagnosticReviewProblemIds,
    mixedSetStatusById,
    timedPracticeCompletedIds,
    ...(lastProblem ? { lastProblemId: lastProblem.itemId } : {}),
    source: "account",
  };
}

export function fromRoadmapProgressSnapshot(snapshot: RoadmapProgressSnapshot): PreparationImportCandidates<DsaProgressMutation> {
  const candidates = new Map<string, DsaProgressMutation>();
  const rejectedKeys: string[] = [];
  const add = (key: string, candidate: DsaProgressMutation) => {
    const parsed = validateDsaProgressMutation(candidate);
    if (!parsed.ok) rejectedKeys.push(key);
    else if (parsed.data.status !== "not-started") candidates.set(`${parsed.data.itemKind}:${parsed.data.itemId}`, parsed.data);
  };

  for (const [itemId, status] of Object.entries(snapshot.statusByProblemId)) {
    if (status) add(`problem:${itemId}`, { itemKind: "problem", itemId, status });
  }
  for (const itemId of snapshot.diagnosticReviewProblemIds ?? []) {
    add(`problem:${itemId}`, { itemKind: "problem", itemId, status: "review" });
  }
  for (const [itemId, status] of Object.entries(snapshot.mixedSetStatusById ?? {})) {
    if (status) add(`mixed-set:${itemId}`, { itemKind: "mixed-set", itemId, status });
  }
  for (const itemId of snapshot.timedPracticeCompletedIds ?? []) {
    add(`timed-practice:${itemId}`, { itemKind: "timed-practice", itemId, status: "completed" });
  }
  return { items: [...candidates.values()], rejectedKeys: [...new Set(rejectedKeys)] };
}

export function toSystemDesignProgressMap(items: readonly SystemDesignProgressItem[]): SystemDesignProgressMap {
  return Object.fromEntries(items.map((item) => [`${item.itemKind}:${item.itemId}`, item.status]));
}

export function fromSystemDesignProgressMap(input: unknown): PreparationImportCandidates<SystemDesignProgressMutation> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { items: [], rejectedKeys: ["*"] };
  const items: SystemDesignProgressMutation[] = [];
  const rejectedKeys: string[] = [];
  for (const [key, status] of Object.entries(input)) {
    const separator = key.indexOf(":");
    if (separator <= 0) {
      rejectedKeys.push(key);
      continue;
    }
    const parsed = validateSystemDesignProgressMutation({
      itemKind: key.slice(0, separator),
      itemId: key.slice(separator + 1),
      status,
    });
    if (!parsed.ok) rejectedKeys.push(key);
    else if (parsed.data.status !== "not-started") items.push(parsed.data);
  }
  return { items, rejectedKeys };
}

export function adaptPreparationState(state: CurrentPreparationState): PreparationStateAdapters {
  return {
    dsaRoadmap: toRoadmapProgressSnapshot(state.dsaProgress),
    systemDesign: toSystemDesignProgressMap(state.systemDesignProgress),
  };
}
