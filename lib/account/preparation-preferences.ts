import type { UserPreparationPreferenceRow } from "../supabase/database.types.ts";
import { PrivateDataUnavailableError } from "../persistence/errors.ts";
import { isCanonicalPreparationPreferenceRevision } from "./preparation-preference-action-input.ts";

export const PREPARATION_PREFERENCES_PRIVATE_DATA_DOMAIN = "preparation preferences";

export type PreparationPreferences = Readonly<
  Pick<
    UserPreparationPreferenceRow,
    "preferred_role_level" | "primary_preparation_focus" | "dsa_level" | "updated_at"
  >
>;

const preferredRoleLevels = new Set<PreparationPreferences["preferred_role_level"]>([
  null,
  "sde1",
  "sde2",
  "senior",
  "staff",
  "unsure",
]);

const primaryPreparationFocuses = new Set<PreparationPreferences["primary_preparation_focus"]>([
  null,
  "dsa",
  "system_design",
  "behavioral",
  "applications",
  "unsure",
]);

const preferredDsaLevels = new Set<PreparationPreferences["dsa_level"]>([
  null,
  "sde1",
  "sde2",
  "sde3plus",
]);

function unavailable(): never {
  throw new PrivateDataUnavailableError(PREPARATION_PREFERENCES_PRIVATE_DATA_DOMAIN);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Resolves the three editable preparation-preference fields and their revision. A successful
 * zero-row response is the sole blank state; query failures and malformed
 * persisted rows must not become editable blank defaults.
 */
export function resolvePreparationPreferencesQuery(input: unknown): PreparationPreferences | null {
  if (
    !isRecord(input) ||
    !Object.hasOwn(input, "data") ||
    !Object.hasOwn(input, "error") ||
    input.error !== null
  ) unavailable();

  if (input.data === null) return null;
  if (!isRecord(input.data)) unavailable();

  const keys = Object.keys(input.data);
  if (
    keys.length !== 4 ||
    !Object.hasOwn(input.data, "preferred_role_level") ||
    !Object.hasOwn(input.data, "primary_preparation_focus") ||
    !Object.hasOwn(input.data, "dsa_level") ||
    !Object.hasOwn(input.data, "updated_at")
  ) unavailable();

  const preferredRoleLevel = input.data.preferred_role_level;
  const primaryPreparationFocus = input.data.primary_preparation_focus;
  const dsaLevel = input.data.dsa_level;
  const updatedAt = input.data.updated_at;
  if (
    !preferredRoleLevels.has(preferredRoleLevel as PreparationPreferences["preferred_role_level"]) ||
    !primaryPreparationFocuses.has(primaryPreparationFocus as PreparationPreferences["primary_preparation_focus"]) ||
    !preferredDsaLevels.has(dsaLevel as PreparationPreferences["dsa_level"]) ||
    !isCanonicalPreparationPreferenceRevision(updatedAt)
  ) unavailable();

  return {
    preferred_role_level: preferredRoleLevel as PreparationPreferences["preferred_role_level"],
    primary_preparation_focus: primaryPreparationFocus as PreparationPreferences["primary_preparation_focus"],
    dsa_level: dsaLevel as PreparationPreferences["dsa_level"],
    updated_at: updatedAt,
  };
}
