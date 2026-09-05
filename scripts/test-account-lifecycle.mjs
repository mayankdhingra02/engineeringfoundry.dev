import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ONBOARDING_ACTION_INVALID_INPUT_ERROR,
  ONBOARDING_TIMEZONE_INVALID_ERROR,
  PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR,
  PREPARATION_PREFERENCES_ABSENT_REVISION,
  PREPARATION_PREFERENCES_CONFLICT_ERROR,
  PREPARATION_PREFERENCES_EARLIER_SNAPSHOT_SAVED_MESSAGE,
  PREPARATION_PREFERENCES_EXPECTED_REVISION_FIELD,
  PREPARATION_PREFERENCES_PENDING_MESSAGE,
  PREPARATION_PREFERENCES_PERSISTENCE_ERROR,
  PREPARATION_PREFERENCES_SAVED_MESSAGE,
  isCanonicalPreparationPreferenceRevision,
  parseCompleteOnboardingActionInput,
  parseSavePreparationPreferencesActionInput,
  parseSavePreparationPreferencesResult,
  resolvePreparationPreferenceDisplayState,
} from "../lib/account/preparation-preference-action-input.ts";
import {
  ACCOUNT_DELETION_CONFIRMATION_ERROR,
  ACCOUNT_DISPLAY_NAME_INVALID_ERROR,
  ACCOUNT_EMAIL_INVALID_ERROR,
  ACCOUNT_PASSWORD_CONFIRMATION_ERROR,
  ACCOUNT_PASSWORD_INVALID_INPUT_ERROR,
  ACCOUNT_SETTINGS_INVALID_INPUT_ERROR,
  PASSWORD_REQUIREMENT,
  parseDeleteAccountActionInput,
  parseDisplayNameActionInput,
  parseEmailChangeActionInput,
  parsePasswordChangeActionInput,
} from "../lib/account/account-action-input.ts";
import { onboardingDestination } from "../lib/account/preferences.ts";
import {
  PREPARATION_PREFERENCES_PRIVATE_DATA_DOMAIN,
  resolvePreparationPreferencesQuery,
} from "../lib/account/preparation-preferences.ts";
import {
  ONBOARDING_REMINDER_PREFERENCE_PRIVATE_DATA_DOMAIN,
  resolveOnboardingReminderPreferenceQuery,
} from "../lib/account/onboarding-reminder-preference.ts";
import {
  accountDeletionProofCookie,
  accountDeletionProofCookieName,
  createAccountDeletionProof,
  isAccountDeletionProof,
} from "../lib/auth/account-deletion.ts";
import { safeInternalPath } from "../lib/auth/redirects.ts";
import { collectAccountExportRows, EXPORT_PAGE_SIZE } from "../lib/account/export-pagination.ts";
import { PrivateDataUnavailableError } from "../lib/persistence/errors.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const functionSource = (source, name) => {
  const start = source.indexOf(`export async function ${name}`);
  const end = source.indexOf("\nexport async function ", start + 1);
  return start < 0 ? "" : source.slice(start, end < 0 ? undefined : end);
};
const [migration, preferenceRevisionMigration, actions, exportRoute, exporter, onboardingPage, onboardingForm, dashboard, dashboardPrivateState, dashboardQueries, accountControl, authForm, passwordForms, styles, packageJson, homepage, privacyPage, preparationSettingsPage, preparationPreferencesQuery, preparationPreferencesForm, preferencesSource, persistenceQualifier, securityQualifier, lifecycleQualifier] = await Promise.all([
  read("supabase/migrations/202608150001_create_account_lifecycle.sql"),
  read("supabase/migrations/202609040014_save_account_preparation_preferences_if_revision.sql"),
  read("features/account/actions.ts"),
  read("app/api/account/export/route.ts"),
  read("lib/account/export.ts"),
  read("app/onboarding/page.tsx"),
  read("features/account/onboarding-form.tsx"),
  read("app/dashboard/page.tsx"),
  read("lib/dashboard/private-state.ts"),
  read("lib/dashboard/queries.ts"),
  read("components/account-control.tsx"),
  read("features/auth/auth-form.tsx"),
  read("features/auth/password-forms.tsx"),
  read("app/globals.css"),
  read("package.json"),
  read("app/page.tsx"),
  read("app/privacy/page.tsx"),
  read("app/settings/preparation/page.tsx"),
  read("lib/account/preparation-preferences-query.ts"),
  read("features/account/account-forms.tsx"),
  read("lib/account/preferences.ts"),
  read("scripts/qualify-persistence-local.mjs"),
  read("scripts/qualify-security-local.mjs"),
  read("scripts/qualify-account-lifecycle-local.mjs"),
]);

for (const marker of ["onboarding_completed_at", "preferred_role_level", "primary_preparation_focus", "complete_account_onboarding", "save_account_preparation_preferences"]) {
  assert.ok(migration.includes(marker), `migration is missing ${marker}`);
}
assert.match(migration, /update public\.profiles[\s\S]*onboarding_complete = true[\s\S]*onboarding_completed_at/, "established-profile backfill is absent");
assert.match(migration, /revoke update \(onboarding_complete\).*authenticated/, "clients can still forge onboarding completion");
assert.match(migration, /current_user_id uuid := auth\.uid\(\)/, "account RPCs do not derive ownership from auth.uid()");
for (const marker of [
  "save_account_preparation_preferences_if_revision",
  "target_expect_absent boolean",
  "target_expected_updated_at timestamptz",
  "account-preparation-preference-owner:",
  "on conflict (user_id) do nothing",
  "preferences.updated_at = target_expected_updated_at",
  "set_user_preparation_preference_updated_at",
  "Revision-checked preparation preference saving is required",
]) {
  assert.ok(preferenceRevisionMigration.includes(marker), `preparation preference revision migration is missing ${marker}`);
}
assert.match(preferenceRevisionMigration, /security definer[\s\S]*set search_path = ''/, "revision-checked preference saving lacks the hardened function boundary");
assert.match(preferenceRevisionMigration, /revoke all on function public\.save_account_preparation_preferences_if_revision\(boolean,timestamptz,text,text,text\)[\s\S]*from public, anon, authenticated;[\s\S]*grant execute[\s\S]*to authenticated;/, "revision-checked preference grants are not authenticated-only");

assert.equal(onboardingDestination({ hasUpcomingInterview: true, interviewScheduled: false, focus: "dsa", requestedPath: "/dashboard" }), "/dashboard");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: true, focus: "dsa", requestedPath: "/dashboard" }), "/applications/new");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "dsa", requestedPath: "/dashboard" }), "/dsa/roadmap");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "system_design", requestedPath: "/dashboard" }), "/system-design/practice");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "behavioral", requestedPath: "/dashboard" }), "/behavioral/workspace");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "applications", requestedPath: "/dashboard" }), "/applications/new");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: null, requestedPath: "/applications" }), "/applications");
assert.equal(safeInternalPath("//evil.example/account"), "/dashboard");
assert.equal(safeInternalPath("https://evil.example/account"), "/dashboard");

const actionForm = (entries) => {
  const form = new FormData();
  for (const [name, value] of entries) form.append(name, value);
  return form;
};
const displayNameForm = (value = "Ada Lovelace") => actionForm([["displayName", value]]);
const emailChangeForm = (value = "Ada@Example.com") => actionForm([["email", value]]);
const passwordChangeForm = (
  currentPassword = "Current123",
  newPassword = "Replacement123",
  confirmation = newPassword,
) => actionForm([
  ["currentPassword", currentPassword],
  ["newPassword", newPassword],
  ["confirmPassword", confirmation],
]);
const deleteAccountForm = (confirmation = "DELETE", currentPassword) => {
  const entries = [["confirmation", confirmation]];
  if (currentPassword !== undefined) entries.push(["currentPassword", currentPassword]);
  return actionForm(entries);
};

assert.deepEqual(parseDisplayNameActionInput(displayNameForm("  Ada Lovelace  ")), { ok: true, value: { displayName: "Ada Lovelace" } });
assert.deepEqual(parseDisplayNameActionInput(displayNameForm("  ")), { ok: true, value: { displayName: null } });
assert.deepEqual(parseEmailChangeActionInput(emailChangeForm()), { ok: true, value: { email: "ada@example.com" } });
assert.deepEqual(parsePasswordChangeActionInput(passwordChangeForm()), { ok: true, value: { currentPassword: "Current123", newPassword: "Replacement123" } });
const maximumAccountPassword = `A1${"x".repeat(126)}`;
assert.deepEqual(parsePasswordChangeActionInput(passwordChangeForm("Current123", maximumAccountPassword)), { ok: true, value: { currentPassword: "Current123", newPassword: maximumAccountPassword } });
assert.deepEqual(parseDeleteAccountActionInput(deleteAccountForm()), { ok: true, value: { currentPassword: null } });
assert.deepEqual(parseDeleteAccountActionInput(deleteAccountForm("DELETE", "Current123")), { ok: true, value: { currentPassword: "Current123" } });

for (const [parser, label] of [
  [parseDisplayNameActionInput, "display-name"],
  [parseEmailChangeActionInput, "email-change"],
  [parsePasswordChangeActionInput, "password-change"],
  [parseDeleteAccountActionInput, "account-deletion"],
]) {
  for (const input of [null, undefined, "form", [], {}, new URLSearchParams()]) {
    assert.deepEqual(parser(input), { ok: false, reason: "invalid-input" }, `${label} accepted non-FormData input ${String(input)}`);
  }
}

for (const [form, parser, label] of [
  [displayNameForm(), parseDisplayNameActionInput, "display-name"],
  [emailChangeForm(), parseEmailChangeActionInput, "email-change"],
  [passwordChangeForm(), parsePasswordChangeActionInput, "password-change"],
  [deleteAccountForm(), parseDeleteAccountActionInput, "account-deletion"],
]) {
  form.append("unexpected", "value");
  assert.deepEqual(parser(form), { ok: false, reason: "invalid-input" }, `${label} accepted an unknown field`);
}

for (const [form, parser, name, label] of [
  [displayNameForm(), parseDisplayNameActionInput, "displayName", "display-name"],
  [emailChangeForm(), parseEmailChangeActionInput, "email", "email-change"],
  [passwordChangeForm(), parsePasswordChangeActionInput, "newPassword", "password-change"],
  [deleteAccountForm(), parseDeleteAccountActionInput, "confirmation", "account-deletion"],
]) {
  form.append(name, "duplicate");
  assert.deepEqual(parser(form), { ok: false, reason: "invalid-input" }, `${label} accepted a duplicate field`);
}

for (const [form, parser, name, label] of [
  [displayNameForm(), parseDisplayNameActionInput, "displayName", "display-name"],
  [emailChangeForm(), parseEmailChangeActionInput, "email", "email-change"],
  [passwordChangeForm(), parsePasswordChangeActionInput, "newPassword", "password-change"],
  [deleteAccountForm(), parseDeleteAccountActionInput, "confirmation", "account-deletion"],
]) {
  form.delete(name);
  form.append(name, new Blob(["not text"], { type: "text/plain" }));
  assert.deepEqual(parser(form), { ok: false, reason: "invalid-input" }, `${label} accepted a file-valued field`);
}

for (const [form, parser, expected, label] of [
  [displayNameForm(), parseDisplayNameActionInput, { ok: true, value: { displayName: "Ada Lovelace" } }, "display-name"],
  [emailChangeForm(), parseEmailChangeActionInput, { ok: true, value: { email: "ada@example.com" } }, "email-change"],
  [passwordChangeForm(), parsePasswordChangeActionInput, { ok: true, value: { currentPassword: "Current123", newPassword: "Replacement123" } }, "password-change"],
  [deleteAccountForm(), parseDeleteAccountActionInput, { ok: true, value: { currentPassword: null } }, "account-deletion"],
]) {
  form.append("$ACTION_ID_account", "framework metadata");
  assert.deepEqual(parser(form), expected, `${label} did not safely ignore framework action metadata`);
}

assert.deepEqual(parseDisplayNameActionInput(new FormData()), { ok: false, reason: "invalid-input" });
assert.deepEqual(parseEmailChangeActionInput(new FormData()), { ok: false, reason: "invalid-input" });
assert.deepEqual(parseDeleteAccountActionInput(new FormData()), { ok: false, reason: "invalid-input" });
assert.deepEqual(parseDisplayNameActionInput(displayNameForm("x".repeat(80))), { ok: true, value: { displayName: "x".repeat(80) } });
assert.deepEqual(parseDisplayNameActionInput(displayNameForm("x".repeat(81))), { ok: false, reason: "invalid-display-name" });
assert.deepEqual(parseDisplayNameActionInput(displayNameForm("Ada\u0000Lovelace")), { ok: false, reason: "invalid-display-name" });
for (const value of ["ada", "ada@example", `${"a".repeat(244)}@example.com`]) {
  assert.deepEqual(parseEmailChangeActionInput(emailChangeForm(value)), { ok: false, reason: "invalid-email" }, `invalid email ${value.length} was accepted`);
}
assert.deepEqual(parsePasswordChangeActionInput(passwordChangeForm("", "Replacement123")), { ok: false, reason: "invalid-input" });
for (const name of ["currentPassword", "newPassword", "confirmPassword"]) {
  const missing = passwordChangeForm();
  missing.delete(name);
  assert.deepEqual(parsePasswordChangeActionInput(missing), { ok: false, reason: "invalid-input" }, `password change accepted a missing ${name}`);
  const duplicate = passwordChangeForm();
  duplicate.append(name, "duplicate");
  assert.deepEqual(parsePasswordChangeActionInput(duplicate), { ok: false, reason: "invalid-input" }, `password change accepted a duplicate ${name}`);
  const file = passwordChangeForm();
  file.delete(name);
  file.append(name, new Blob(["not text"], { type: "text/plain" }));
  assert.deepEqual(parsePasswordChangeActionInput(file), { ok: false, reason: "invalid-input" }, `password change accepted a file-valued ${name}`);
}
for (const value of ["Short1", "a".repeat(8), "1".repeat(8), `A1${"x".repeat(127)}`]) {
  assert.deepEqual(parsePasswordChangeActionInput(passwordChangeForm("Current123", value)), { ok: false, reason: "weak-password" }, `weak password ${value.length} was accepted`);
}
assert.deepEqual(parsePasswordChangeActionInput(passwordChangeForm("Current123", "Replacement123", "Replacement124")), { ok: false, reason: "password-mismatch" });
assert.deepEqual(parseDeleteAccountActionInput(deleteAccountForm("delete")), { ok: false, reason: "invalid-confirmation" });
for (const mutation of ["duplicate", "file"]) {
  const form = deleteAccountForm("DELETE", "Current123");
  if (mutation === "duplicate") form.append("currentPassword", "duplicate");
  else {
    form.delete("currentPassword");
    form.append("currentPassword", new Blob(["not text"], { type: "text/plain" }));
  }
  assert.deepEqual(parseDeleteAccountActionInput(form), { ok: false, reason: "invalid-input" }, `account deletion accepted a ${mutation} currentPassword`);
}
assert.equal(ACCOUNT_SETTINGS_INVALID_INPUT_ERROR, "Review the account fields and try again.");
assert.equal(ACCOUNT_DISPLAY_NAME_INVALID_ERROR, "Display name must be 80 characters or fewer.");
assert.equal(ACCOUNT_EMAIL_INVALID_ERROR, "Enter a valid email address.");
assert.equal(ACCOUNT_PASSWORD_INVALID_INPUT_ERROR, "Review the password fields and try again.");
assert.equal(ACCOUNT_PASSWORD_CONFIRMATION_ERROR, "New passwords do not match.");
assert.equal(ACCOUNT_DELETION_CONFIRMATION_ERROR, "Type DELETE exactly to confirm permanent account deletion.");
assert.equal(PASSWORD_REQUIREMENT, "Use at least 8 characters with at least one letter and one number.");

const validPreferredRoleLevels = [null, "sde1", "sde2", "senior", "staff", "unsure"];
const validPrimaryPreparationFocuses = [null, "dsa", "system_design", "behavioral", "applications", "unsure"];
const validPreferredDsaLevels = [null, "sde1", "sde2", "sde3plus"];
const expectedPreferenceError = `Your private ${PREPARATION_PREFERENCES_PRIVATE_DATA_DOMAIN} data is temporarily unavailable. Please try again.`;
const expectPreferenceUnavailable = (input, label) => {
  assert.throws(
    () => resolvePreparationPreferencesQuery(input),
    (error) => error instanceof PrivateDataUnavailableError
      && error.name === "PrivateDataUnavailableError"
      && error.message === expectedPreferenceError
      && !error.message.includes("database detail"),
    label,
  );
};

const expectedOnboardingReminderError = `Your private ${ONBOARDING_REMINDER_PREFERENCE_PRIVATE_DATA_DOMAIN} data is temporarily unavailable. Please try again.`;
const expectOnboardingReminderUnavailable = (input, label) => {
  assert.throws(
    () => resolveOnboardingReminderPreferenceQuery(input),
    (error) => error instanceof PrivateDataUnavailableError
      && error.name === "PrivateDataUnavailableError"
      && error.message === expectedOnboardingReminderError
      && !error.message.includes("database detail"),
    label,
  );
};

assert.equal(resolveOnboardingReminderPreferenceQuery({ data: null, error: null }), null, "a successful zero-row onboarding reminder response is not preserved as a genuine blank state");
assert.equal(resolveOnboardingReminderPreferenceQuery({ data: { preferred_timezone: null }, error: null }), null, "a saved null onboarding reminder timezone is not preserved");
for (const timezone of ["UTC", "America/Chicago", "america/chicago", "Europe/Berlin", "Asia/Kolkata"]) {
  assert.equal(resolveOnboardingReminderPreferenceQuery({ data: { preferred_timezone: timezone }, error: null }), timezone, `a valid saved onboarding reminder timezone was rejected: ${timezone}`);
}
expectOnboardingReminderUnavailable({ data: { preferred_timezone: "UTC" }, error: { message: "database detail" } }, "an onboarding reminder query error was ignored when row data was also present");
for (const [label, input] of [
  ["undefined root", undefined],
  ["null root", null],
  ["array root", []],
  ["scalar root", "invalid"],
  ["missing data member", { error: null }],
  ["missing error member", { data: null }],
  ["undefined data", { data: undefined, error: null }],
  ["array data", { data: [], error: null }],
  ["missing timezone", { data: {}, error: null }],
  ["unexpected persisted field", { data: { preferred_timezone: "UTC", user_id: "private-user" }, error: null }],
  ["numeric timezone", { data: { preferred_timezone: 1 }, error: null }],
  ["empty timezone", { data: { preferred_timezone: "" }, error: null }],
  ["invalid timezone", { data: { preferred_timezone: "Mars/Olympus" }, error: null }],
]) {
  expectOnboardingReminderUnavailable(input, `onboarding reminder resolver accepted ${label}`);
}

assert.equal(resolvePreparationPreferencesQuery({ data: null, error: null }), null, "a successful zero-row preference response is not preserved as a genuine blank state");
const preferenceRevision = "2026-09-04T12:34:56.123456+00:00";
let validPreferenceCases = 0;
for (const preferred_role_level of validPreferredRoleLevels) {
  for (const primary_preparation_focus of validPrimaryPreparationFocuses) {
    for (const dsa_level of validPreferredDsaLevels) {
      const row = { preferred_role_level, primary_preparation_focus, dsa_level, updated_at: preferenceRevision };
      assert.deepEqual(resolvePreparationPreferencesQuery({ data: row, error: null }), row, "a valid preparation-preference enum/null combination was rejected");
      validPreferenceCases += 1;
    }
  }
}
assert.equal(validPreferenceCases, 144, "the preparation-preference regression did not exercise the complete enum/null matrix");
expectPreferenceUnavailable({ data: { preferred_role_level: "sde2", primary_preparation_focus: "dsa", dsa_level: "sde2", updated_at: preferenceRevision }, error: { message: "database detail" } }, "a preference query error was ignored when row data was also present");
for (const [label, input] of [
  ["missing revision", { data: { preferred_role_level: null, primary_preparation_focus: null, dsa_level: null }, error: null }],
  ["invalid revision", { data: { preferred_role_level: null, primary_preparation_focus: null, dsa_level: null, updated_at: "not-a-revision" }, error: null }],
  ["unexpected persisted field", { data: { preferred_role_level: null, primary_preparation_focus: null, dsa_level: null, updated_at: preferenceRevision, user_id: "private-user" }, error: null }],
]) expectPreferenceUnavailable(input, `preparation preference resolver accepted ${label}`);

assert.equal(ONBOARDING_ACTION_INVALID_INPUT_ERROR, "Those setup choices are not valid. Review the form and try again.", "onboarding malformed-input copy is not stable and curated");
assert.equal(ONBOARDING_TIMEZONE_INVALID_ERROR, "Choose a valid IANA timezone, such as America/Chicago.", "onboarding timezone-error copy is not stable and curated");
assert.equal(PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR, "Those preparation preferences are not valid. Review the form and try again.", "preference malformed-input copy is not stable and curated");
assert.equal(PREPARATION_PREFERENCES_CONFLICT_ERROR, "These preparation preferences may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.");
assert.equal(PREPARATION_PREFERENCES_PERSISTENCE_ERROR, "We couldn't save preparation preferences. Try again.");
assert.equal(PREPARATION_PREFERENCES_SAVED_MESSAGE, "Preparation preferences saved.");
assert.equal(PREPARATION_PREFERENCES_PENDING_MESSAGE, "Saving preparation preferences…");
assert.equal(PREPARATION_PREFERENCES_EARLIER_SNAPSHOT_SAVED_MESSAGE, "Earlier preparation preferences saved. Review your current changes and save again.");
assert.equal(PREPARATION_PREFERENCES_EXPECTED_REVISION_FIELD, "expected_updated_at");
assert.equal(PREPARATION_PREFERENCES_ABSENT_REVISION, "absent");
for (const validRevision of [
  "2026-09-04T12:34:56Z",
  "2026-09-04T12:34:56.1+00:00",
  preferenceRevision,
  "2024-02-29T23:59:59-14:00",
]) assert.equal(isCanonicalPreparationPreferenceRevision(validRevision), true, `valid preference revision rejected: ${validRevision}`);
for (const invalidRevision of [undefined, null, "", "2026-02-29T00:00:00Z", "2026-09-04T24:00:00Z", "2026-09-04T12:34:56.1234567Z", "2026-09-04T12:34:56+14:01", "2026-09-04 12:34:56+00:00"]) {
  assert.equal(isCanonicalPreparationPreferenceRevision(invalidRevision), false, `invalid preference revision accepted: ${String(invalidRevision)}`);
}

const formData = (entries = []) => {
  const form = new FormData();
  for (const [name, value] of entries) form.append(name, value);
  return form;
};
const preferenceFormData = ({ preferredRoleLevel = "", primaryPreparationFocus = "", dsaLevel = "", expectedUpdatedAt = preferenceRevision } = {}) => formData([
  ["preferredRoleLevel", preferredRoleLevel],
  ["primaryPreparationFocus", primaryPreparationFocus],
  ["dsaLevel", dsaLevel],
  [PREPARATION_PREFERENCES_EXPECTED_REVISION_FIELD, expectedUpdatedAt],
]);
const validPreferenceActionValues = [];
for (const preferredRoleLevel of validPreferredRoleLevels) {
  for (const primaryPreparationFocus of validPrimaryPreparationFocuses) {
    for (const dsaLevel of validPreferredDsaLevels) {
      const parsed = parseSavePreparationPreferencesActionInput(preferenceFormData({
        preferredRoleLevel: preferredRoleLevel ?? "",
        primaryPreparationFocus: primaryPreparationFocus ?? "",
        dsaLevel: dsaLevel ?? "",
      }));
      assert.deepEqual(parsed, { ok: true, value: { preferredRoleLevel, primaryPreparationFocus, dsaLevel, expectAbsent: false, expectedUpdatedAt: preferenceRevision, revision: preferenceRevision } }, "a valid preference action enum/null/revision combination was rejected or remapped");
      validPreferenceActionValues.push(parsed.value);
    }
  }
}
assert.equal(validPreferenceActionValues.length, 144, "the preference action parser did not execute the complete enum/null matrix");

const expectInvalidPreferenceAction = (input, label) => assert.deepEqual(
  parseSavePreparationPreferencesActionInput(input),
  { ok: false, reason: "invalid-input" },
  label,
);
for (const [label, input] of [
  ["undefined", undefined],
  ["null", null],
  ["object", {}],
  ["array", []],
  ["string", "invalid"],
]) expectInvalidPreferenceAction(input, `preference action accepted ${label} instead of FormData`);
for (const name of ["preferredRoleLevel", "primaryPreparationFocus", "dsaLevel", PREPARATION_PREFERENCES_EXPECTED_REVISION_FIELD]) {
  const missing = preferenceFormData();
  missing.delete(name);
  expectInvalidPreferenceAction(missing, `preference action accepted missing ${name}`);
  const duplicate = preferenceFormData();
  duplicate.append(name, "");
  expectInvalidPreferenceAction(duplicate, `preference action accepted duplicate ${name}`);
  const file = preferenceFormData();
  file.set(name, new File(["invalid"], "invalid.txt", { type: "text/plain" }));
  expectInvalidPreferenceAction(file, `preference action accepted a File for ${name}`);
}
for (const [field, value] of [
  ["preferredRoleLevel", "Senior"],
  ["preferredRoleLevel", " senior "],
  ["preferredRoleLevel", "principal"],
  ["primaryPreparationFocus", "DSA"],
  ["primaryPreparationFocus", " dsa "],
  ["primaryPreparationFocus", "ml"],
  ["dsaLevel", "SDE2"],
  ["dsaLevel", " sde2 "],
  ["dsaLevel", "advanced"],
  ["expectedUpdatedAt", "not-a-revision"],
]) expectInvalidPreferenceAction(preferenceFormData({ [field]: value }), `preference action accepted unknown or case-variant ${field}=${value}`);
const unknownPreferenceField = preferenceFormData();
unknownPreferenceField.set("user_id", "foreign-user");
expectInvalidPreferenceAction(unknownPreferenceField, "preference action accepted an unknown identity field");
const wrongCasePreferenceField = preferenceFormData();
wrongCasePreferenceField.delete("preferredRoleLevel");
wrongCasePreferenceField.set("preferredrolelevel", "senior");
expectInvalidPreferenceAction(wrongCasePreferenceField, "preference action accepted a wrong-case field name");
const preferenceWithActionMetadata = preferenceFormData({ preferredRoleLevel: "senior", primaryPreparationFocus: "dsa", dsaLevel: "sde2" });
preferenceWithActionMetadata.set("$ACTION_REF_0", "opaque-next-metadata");
assert.deepEqual(parseSavePreparationPreferencesActionInput(preferenceWithActionMetadata), { ok: true, value: { preferredRoleLevel: "senior", primaryPreparationFocus: "dsa", dsaLevel: "sde2", expectAbsent: false, expectedUpdatedAt: preferenceRevision, revision: preferenceRevision } }, "Next Server Action metadata broke a valid preference payload");
assert.deepEqual(parseSavePreparationPreferencesActionInput(preferenceFormData({ expectedUpdatedAt: PREPARATION_PREFERENCES_ABSENT_REVISION })), { ok: true, value: { preferredRoleLevel: null, primaryPreparationFocus: null, dsaLevel: null, expectAbsent: true, expectedUpdatedAt: null, revision: PREPARATION_PREFERENCES_ABSENT_REVISION } }, "an explicit absent preference revision was not preserved");

assert.deepEqual(parseSavePreparationPreferencesResult([]), { status: "conflict" });
assert.deepEqual(parseSavePreparationPreferencesResult([{ updated_at: preferenceRevision }]), { status: "saved", updatedAt: preferenceRevision });
for (const malformed of [undefined, null, {}, [{ updated_at: "invalid" }], [{ updated_at: preferenceRevision, user_id: "private" }], [{ updated_at: preferenceRevision }, { updated_at: preferenceRevision }]]) {
  assert.deepEqual(parseSavePreparationPreferencesResult(malformed), { status: "invalid" }, "malformed preference save result was accepted");
}
const successfulPreferenceState = { status: "success", message: PREPARATION_PREFERENCES_SAVED_MESSAGE };
assert.deepEqual(resolvePreparationPreferenceDisplayState({ status: "idle", message: "" }, true, false), { status: "pending", message: PREPARATION_PREFERENCES_PENDING_MESSAGE });
assert.deepEqual(resolvePreparationPreferenceDisplayState(successfulPreferenceState, false, true), { status: "success", message: PREPARATION_PREFERENCES_EARLIER_SNAPSHOT_SAVED_MESSAGE });
assert.deepEqual(resolvePreparationPreferenceDisplayState({ status: "error", message: PREPARATION_PREFERENCES_CONFLICT_ERROR }, false, true), { status: "error", message: PREPARATION_PREFERENCES_CONFLICT_ERROR });

const onboardingFormData = ({
  intent = "complete",
  next = "/dashboard",
  preferredRoleLevel,
  primaryPreparationFocus,
  preferredTimezone = "",
  interviewScheduled = "no",
} = {}) => {
  const entries = [["intent", intent], ["next", next]];
  if (preferredRoleLevel !== undefined) entries.push(["preferredRoleLevel", preferredRoleLevel]);
  if (primaryPreparationFocus !== undefined) entries.push(["primaryPreparationFocus", primaryPreparationFocus]);
  if (preferredTimezone !== undefined) entries.push(["preferredTimezone", preferredTimezone]);
  if (interviewScheduled !== undefined) entries.push(["interviewScheduled", interviewScheduled]);
  return formData(entries);
};
let validOnboardingCases = 0;
for (const preferredRoleLevel of validPreferredRoleLevels) {
  for (const primaryPreparationFocus of validPrimaryPreparationFocuses) {
    for (const [preferredTimezone, expectedTimezone] of [["", null], [" America/Chicago ", "America/Chicago"]]) {
      for (const interviewScheduled of ["yes", "no"]) {
        const parsed = parseCompleteOnboardingActionInput(onboardingFormData({
          preferredRoleLevel: preferredRoleLevel ?? undefined,
          primaryPreparationFocus: primaryPreparationFocus ?? undefined,
          preferredTimezone,
          interviewScheduled,
        }));
        assert.deepEqual(parsed, {
          ok: true,
          value: {
            intent: "complete",
            preferredRoleLevel,
            primaryPreparationFocus,
            preferredTimezone: expectedTimezone,
            interviewScheduled: interviewScheduled === "yes",
            requestedPath: "/dashboard",
          },
        }, "a valid onboarding choice/optional-radio/timezone combination was rejected or remapped");
        validOnboardingCases += 1;
      }
    }
  }
}
assert.equal(validOnboardingCases, 144, "the onboarding parser did not execute the full valid choice/absence matrix");
const minimalSkipOnboarding = onboardingFormData({ intent: "skip", next: "/applications" });
minimalSkipOnboarding.delete("preferredTimezone");
minimalSkipOnboarding.delete("interviewScheduled");
assert.deepEqual(parseCompleteOnboardingActionInput(minimalSkipOnboarding), {
  ok: true,
  value: { intent: "skip", preferredRoleLevel: null, primaryPreparationFocus: null, preferredTimezone: null, interviewScheduled: false, requestedPath: "/applications" },
}, "skip no longer clears setup choices while preserving the requested safe destination");
assert.deepEqual(parseCompleteOnboardingActionInput(onboardingFormData({ next: "/applications?source=onboarding#next", preferredTimezone: "UTC", interviewScheduled: "yes" })), {
  ok: true,
  value: { intent: "complete", preferredRoleLevel: null, primaryPreparationFocus: null, preferredTimezone: "UTC", interviewScheduled: true, requestedPath: "/applications?source=onboarding#next" },
}, "onboarding did not preserve a safe internal next path or legitimate absent optional radios");
assert.deepEqual(parseCompleteOnboardingActionInput(onboardingFormData({ preferredRoleLevel: "", primaryPreparationFocus: "", preferredTimezone: "america/chicago" })), {
  ok: true,
  value: { intent: "complete", preferredRoleLevel: null, primaryPreparationFocus: null, preferredTimezone: "America/Chicago", interviewScheduled: false, requestedPath: "/dashboard" },
}, "onboarding did not preserve intentional blank optional choices or canonicalize timezone casing");
assert.equal(parseCompleteOnboardingActionInput(onboardingFormData({ preferredTimezone: "Etc/UTC" })).value?.preferredTimezone, "UTC", "onboarding did not canonicalize the UTC timezone alias");
const skipWithIgnoredChoices = onboardingFormData({ intent: "skip", preferredRoleLevel: "Senior", primaryPreparationFocus: "DSA", preferredTimezone: "Mars/Olympus", interviewScheduled: "maybe" });
skipWithIgnoredChoices.append("preferredRoleLevel", "staff");
assert.deepEqual(parseCompleteOnboardingActionInput(skipWithIgnoredChoices), {
  ok: true,
  value: { intent: "skip", preferredRoleLevel: null, primaryPreparationFocus: null, preferredTimezone: null, interviewScheduled: false, requestedPath: "/dashboard" },
}, "skip no longer safely ignores optional setup choices while forcing null/false values");
for (const unsafeNext of ["", "//evil.example/account", "https://evil.example/account", "/dashboard\\evil"]) {
  const parsed = parseCompleteOnboardingActionInput(onboardingFormData({ next: unsafeNext }));
  assert.equal(parsed.ok && parsed.value.requestedPath, "/dashboard", `unsafe onboarding next value did not canonicalize to the dashboard: ${unsafeNext}`);
}
const expectInvalidOnboarding = (input, reason, label) => assert.deepEqual(
  parseCompleteOnboardingActionInput(input),
  { ok: false, reason },
  label,
);
for (const [label, input] of [["undefined", undefined], ["null", null], ["object", {}], ["array", []], ["string", "invalid"]]) {
  expectInvalidOnboarding(input, "invalid-input", `onboarding action accepted ${label} instead of FormData`);
}
for (const name of ["intent", "next"]) {
  const missing = onboardingFormData();
  missing.delete(name);
  expectInvalidOnboarding(missing, "invalid-input", `onboarding action accepted missing ${name}`);
  const duplicate = onboardingFormData();
  duplicate.append(name, name === "intent" ? "complete" : "/dashboard");
  expectInvalidOnboarding(duplicate, "invalid-input", `onboarding action accepted duplicate ${name}`);
}
for (const name of ["preferredRoleLevel", "primaryPreparationFocus", "preferredTimezone", "interviewScheduled"]) {
  const duplicate = onboardingFormData({ preferredRoleLevel: "senior", primaryPreparationFocus: "dsa" });
  duplicate.append(name, "");
  expectInvalidOnboarding(duplicate, "invalid-input", `complete onboarding accepted duplicate ${name}`);
  const file = onboardingFormData({ preferredRoleLevel: "senior", primaryPreparationFocus: "dsa" });
  file.set(name, new File(["invalid"], "invalid.txt", { type: "text/plain" }));
  expectInvalidOnboarding(file, "invalid-input", `complete onboarding accepted a File for ${name}`);
}
for (const name of ["intent", "next"]) {
  const file = onboardingFormData();
  file.set(name, new File(["invalid"], "invalid.txt", { type: "text/plain" }));
  expectInvalidOnboarding(file, "invalid-input", `onboarding accepted a File for ${name}`);
}
for (const [field, value] of [["intent", "Complete"], ["intent", "unknown"], ["preferredRoleLevel", "Senior"], ["preferredRoleLevel", " senior "], ["primaryPreparationFocus", "DSA"], ["primaryPreparationFocus", " dsa "], ["interviewScheduled", "Yes"], ["interviewScheduled", "maybe"]]) {
  expectInvalidOnboarding(onboardingFormData({ [field]: value }), "invalid-input", `onboarding accepted unknown or case-variant ${field}=${value}`);
}
const missingOnboardingTimezone = onboardingFormData();
missingOnboardingTimezone.delete("preferredTimezone");
expectInvalidOnboarding(missingOnboardingTimezone, "invalid-input", "complete onboarding accepted a missing timezone field");
const missingInterviewScheduled = onboardingFormData();
missingInterviewScheduled.delete("interviewScheduled");
expectInvalidOnboarding(missingInterviewScheduled, "invalid-input", "complete onboarding accepted a missing interview-scheduled field");
expectInvalidOnboarding(onboardingFormData({ preferredTimezone: "Mars/Olympus" }), "invalid-timezone", "onboarding accepted an invalid IANA timezone");
const unknownOnboardingField = onboardingFormData();
unknownOnboardingField.set("accountId", "foreign-user");
expectInvalidOnboarding(unknownOnboardingField, "invalid-input", "onboarding accepted an unknown identity field");
const wrongCaseOnboardingField = onboardingFormData();
wrongCaseOnboardingField.delete("next");
wrongCaseOnboardingField.set("Next", "/applications");
expectInvalidOnboarding(wrongCaseOnboardingField, "invalid-input", "onboarding accepted a wrong-case field name");
const onboardingWithActionMetadata = onboardingFormData({ preferredRoleLevel: "staff", primaryPreparationFocus: "behavioral", preferredTimezone: "UTC", interviewScheduled: "yes" });
onboardingWithActionMetadata.set("$ACTION_ID_0", "opaque-next-metadata");
assert.equal(parseCompleteOnboardingActionInput(onboardingWithActionMetadata).ok, true, "Next Server Action metadata broke a valid onboarding payload");

const representativePreference = { preferred_role_level: "senior", primary_preparation_focus: "system_design", dsa_level: "sde3plus", updated_at: preferenceRevision };
expectPreferenceUnavailable({ data: representativePreference, error: { message: "database detail" } }, "a preference query error was ignored when row data was also present");
for (const [label, input] of [
  ["undefined root", undefined],
  ["null root", null],
  ["array root", []],
  ["scalar root", "invalid"],
  ["missing data member", { error: null }],
  ["missing error member", { data: null }],
  ["undefined data", { data: undefined, error: null }],
  ["array data", { data: [], error: null }],
  ["missing preferred role", { data: { primary_preparation_focus: null, dsa_level: null, updated_at: preferenceRevision }, error: null }],
  ["missing preparation focus", { data: { preferred_role_level: null, dsa_level: null, updated_at: preferenceRevision }, error: null }],
  ["missing DSA level", { data: { preferred_role_level: null, primary_preparation_focus: null, updated_at: preferenceRevision }, error: null }],
  ["unexpected persisted field", { data: { ...representativePreference, user_id: "private-user" }, error: null }],
  ["invalid preferred role", { data: { ...representativePreference, preferred_role_level: "principal" }, error: null }],
  ["wrong-case preferred role", { data: { ...representativePreference, preferred_role_level: "Senior" }, error: null }],
  ["invalid preparation focus", { data: { ...representativePreference, primary_preparation_focus: "ml" }, error: null }],
  ["invalid DSA level", { data: { ...representativePreference, dsa_level: "advanced" }, error: null }],
  ["non-string enum", { data: { ...representativePreference, dsa_level: 2 }, error: null }],
]) {
  expectPreferenceUnavailable(input, `preference resolver accepted ${label}`);
}

const deletionProofSecret = "test-only-account-deletion-secret";
const deletionProofIssuedAt = new Date("2026-09-02T12:00:00.000Z");
const deletionProofNonce = "AAAAAAAAAAAAAAAAAAAAAA";
const signedDeletionProof = createAccountDeletionProof(deletionProofSecret, deletionProofIssuedAt, deletionProofNonce);
const localDeletionProof = accountDeletionProofCookie(signedDeletionProof, false);
assert.deepEqual(localDeletionProof, {
  name: accountDeletionProofCookieName,
  value: signedDeletionProof,
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  path: "/",
  maxAge: 60,
}, "account deletion proof must be short-lived, HttpOnly, SameSite=Lax, and root-scoped");
assert.equal(accountDeletionProofCookie(signedDeletionProof, true).secure, true, "production account deletion proof must require HTTPS");
assert.equal(isAccountDeletionProof(signedDeletionProof, deletionProofSecret, deletionProofIssuedAt), true, "a freshly emitted account deletion proof must verify exactly");
assert.equal(isAccountDeletionProof(signedDeletionProof, "wrong-secret", deletionProofIssuedAt), false, "a deletion proof signed with another secret must fail");
const tamperedDeletionProof = `${signedDeletionProof.slice(0, -1)}${signedDeletionProof.endsWith("A") ? "B" : "A"}`;
assert.equal(isAccountDeletionProof(tamperedDeletionProof, deletionProofSecret, deletionProofIssuedAt), false, "a tampered deletion proof must fail");
assert.equal(isAccountDeletionProof("account-deleted", deletionProofSecret, deletionProofIssuedAt), false, "the legacy fixed deletion value must not prove success");
assert.equal(isAccountDeletionProof(createAccountDeletionProof(deletionProofSecret, new Date("2026-09-02T12:00:01.000Z"), deletionProofNonce), deletionProofSecret, deletionProofIssuedAt), false, "a future-issued deletion proof must fail");
assert.equal(isAccountDeletionProof(signedDeletionProof, deletionProofSecret, new Date("2026-09-02T12:01:00.000Z")), true, "a deletion proof must remain valid at the exact 60-second boundary");
assert.equal(isAccountDeletionProof(signedDeletionProof, deletionProofSecret, new Date("2026-09-02T12:01:01.000Z")), false, "an expired deletion proof must fail");
for (const malformed of [undefined, null, "", "v1", "v1.bad.AAAAAAAAAAAAAAAAAAAAAA.bad", "v2.1788350400.AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", { value: signedDeletionProof }]) {
  assert.equal(isAccountDeletionProof(malformed, deletionProofSecret, deletionProofIssuedAt), false, `malformed account deletion proof must fail: ${String(malformed)}`);
}
assert.ok(!signedDeletionProof.includes(deletionProofSecret) && !signedDeletionProof.includes("user") && !signedDeletionProof.includes("@"), "account deletion proof must contain no signing secret or private account identifier");

const highCardinalityRows = Array.from({ length: (EXPORT_PAGE_SIZE * 2) + 205 }, (_, id) => ({ id }));
const requestedRanges = [];
const paginatedRows = await collectAccountExportRows("high_cardinality_regression", async (from, to) => {
  requestedRanges.push([from, to]);
  return { data: highCardinalityRows.slice(from, to + 1), error: null };
});
assert.equal(paginatedRows.length, 1_205, "account export pagination silently truncates high-cardinality sections");
assert.deepEqual(requestedRanges, [[0, 499], [500, 999], [1000, 1499]], "account export does not advance through deterministic ranges");

for (const marker of ["preferredRoleLevel", "interviewScheduled", "primaryPreparationFocus", "preferredTimezone", "Skip for now"]) {
  assert.ok(onboardingForm.includes(marker), `onboarding form is missing ${marker}`);
}
assert.ok(onboardingPage.includes("profile.onboarding_complete"), "established users are not redirected away from onboarding");
const onboardingClient = onboardingPage.indexOf("createSupabaseServerClient()");
const onboardingMissingClient = onboardingPage.indexOf("if (!supabase)", onboardingClient);
const onboardingMissingClientError = onboardingPage.indexOf("throw new PrivateDataUnavailableError(", onboardingMissingClient);
const onboardingReminderTable = onboardingPage.indexOf('.from("interview_reminder_preferences")', onboardingMissingClientError);
const onboardingReminderProjection = onboardingPage.indexOf('.select("preferred_timezone")', onboardingReminderTable);
const onboardingReminderOwner = onboardingPage.indexOf('.eq("user_id", user.id)', onboardingReminderProjection);
const onboardingReminderResolver = onboardingPage.indexOf("resolveOnboardingReminderPreferenceQuery(", onboardingMissingClientError);
const onboardingTimezoneForm = onboardingPage.indexOf("savedTimezone={reminderPreference}", onboardingReminderResolver);
assert.ok(onboardingClient >= 0 && onboardingMissingClient > onboardingClient && onboardingMissingClientError > onboardingMissingClient && onboardingReminderTable > onboardingMissingClientError && onboardingReminderProjection > onboardingReminderTable && onboardingReminderOwner > onboardingReminderProjection && onboardingReminderResolver > onboardingMissingClientError && onboardingTimezoneForm > onboardingReminderResolver, "onboarding does not fail closed before resolving its exact owner-scoped reminder preference into the form");
for (const forbidden of ["{ data: null }", "reminderPreference?.preferred_timezone", "savedTimezone={null}"]) {
  assert.ok(!onboardingPage.includes(forbidden), `onboarding retained a fail-open reminder preference fallback: ${forbidden}`);
}
const availabilityCheck = preparationSettingsPage.indexOf("isAccountPlatformAvailable()");
const memberGuard = preparationSettingsPage.indexOf('requireMemberProfile("/settings/preparation")');
const preferenceRead = preparationSettingsPage.indexOf("getPreparationPreferences()");
const preferenceForm = preparationSettingsPage.indexOf("<PreparationPreferencesForm preference={preference}");
assert.ok(availabilityCheck >= 0 && memberGuard > availabilityCheck && preferenceRead > memberGuard && preferenceForm > preferenceRead, "preparation settings do not preserve availability -> member guard -> validated preference query -> form ordering");
for (const forbidden of ["createSupabaseServerClient", '.from("user_preparation_preferences")', '.select("*")', "{ data: null }"]) {
  assert.ok(!preparationSettingsPage.includes(forbidden), `preparation settings retained fail-open raw query/fallback: ${forbidden}`);
}
const preferenceActor = preparationPreferencesQuery.indexOf("getAuthenticatedActor()");
const missingPreferenceActorGuard = preparationPreferencesQuery.indexOf("if (!actor)", preferenceActor);
const missingPreferenceActorError = preparationPreferencesQuery.indexOf("throw new PrivateDataUnavailableError(PREPARATION_PREFERENCES_PRIVATE_DATA_DOMAIN)", missingPreferenceActorGuard);
const preferenceTable = preparationPreferencesQuery.indexOf('.from("user_preparation_preferences")');
const preferenceOwnerScope = preparationPreferencesQuery.indexOf('.eq("user_id", actor.user.id)');
const preferenceResolver = preparationPreferencesQuery.indexOf("resolvePreparationPreferencesQuery(result)");
assert.ok(preferenceActor >= 0 && missingPreferenceActorGuard > preferenceActor && missingPreferenceActorError > missingPreferenceActorGuard && preferenceTable > missingPreferenceActorError && preferenceOwnerScope > preferenceTable && preferenceResolver > preferenceOwnerScope, "preparation preferences do not reject a missing post-guard actor before resolving an exact owner-scoped result");
assert.match(preparationPreferencesQuery, /\.select\("preferred_role_level,primary_preparation_focus,dsa_level,updated_at"\)/, "preparation preference query no longer uses the exact editable projection and revision");
assert.ok(preparationPreferencesForm.includes("PreparationPreferences") && preparationPreferencesForm.includes("preference?.preferred_role_level") && preparationPreferencesForm.includes("preference?.primary_preparation_focus") && preparationPreferencesForm.includes("preference?.dsa_level") && preparationPreferencesForm.includes("preference?.updated_at"), "preparation settings form does not consume the validated preference projection and revision");
const completeOnboardingActionStart = actions.indexOf("export async function completeOnboardingAction");
const completeOnboardingActionEnd = actions.indexOf("export async function updateDisplayNameAction", completeOnboardingActionStart);
const completeOnboardingActionSource = actions.slice(completeOnboardingActionStart, completeOnboardingActionEnd);
const onboardingParse = completeOnboardingActionSource.indexOf("parseCompleteOnboardingActionInput(form)");
const onboardingInvalidReturn = completeOnboardingActionSource.indexOf("if (!parsed.ok)", onboardingParse);
const onboardingActor = completeOnboardingActionSource.indexOf("getAuthenticatedActor()", onboardingInvalidReturn);
const onboardingRoundQuery = completeOnboardingActionSource.indexOf('.from("interview_rounds")', onboardingActor);
const onboardingRpc = completeOnboardingActionSource.indexOf('rpc("complete_account_onboarding"', onboardingRoundQuery);
const onboardingRevalidation = completeOnboardingActionSource.indexOf('revalidatePath("/dashboard")', onboardingRpc);
assert.match(completeOnboardingActionSource, /form: unknown\): Promise<AccountActionState> \{\s*const parsed = parseCompleteOnboardingActionInput\(form\);/, "onboarding action does not treat its direct runtime payload as unknown and parse it first");
assert.ok(onboardingParse >= 0 && onboardingInvalidReturn > onboardingParse && onboardingActor > onboardingInvalidReturn && onboardingRoundQuery > onboardingActor && onboardingRpc > onboardingRoundQuery && onboardingRevalidation > onboardingRpc, "onboarding action does not return malformed input before actor, query, RPC, and revalidation work");
assert.ok(completeOnboardingActionSource.slice(onboardingInvalidReturn, onboardingActor).includes("ONBOARDING_ACTION_INVALID_INPUT_ERROR") && completeOnboardingActionSource.slice(onboardingInvalidReturn, onboardingActor).includes("ONBOARDING_TIMEZONE_INVALID_ERROR"), "onboarding parse failures do not return the stable curated error copy");
assert.ok(!completeOnboardingActionSource.includes("form.get("), "onboarding action bypasses its validated parsed payload");

const savePreferenceActionStart = actions.indexOf("export async function savePreparationPreferencesAction");
const savePreferenceActionEnd = actions.indexOf("export async function signOutEverywhereAction", savePreferenceActionStart);
const savePreferenceActionSource = actions.slice(savePreferenceActionStart, savePreferenceActionEnd);
const preferenceActionParse = savePreferenceActionSource.indexOf("parseSavePreparationPreferencesActionInput(form)");
const preferenceActionInvalidReturn = savePreferenceActionSource.indexOf("if (!parsed.ok)", preferenceActionParse);
const preferenceActionActor = savePreferenceActionSource.indexOf("getAuthenticatedActor()", preferenceActionInvalidReturn);
const preferenceActionRpc = savePreferenceActionSource.indexOf('rpc("save_account_preparation_preferences_if_revision"', preferenceActionActor);
const preferenceActionResult = savePreferenceActionSource.indexOf("parseSavePreparationPreferencesResult(data)", preferenceActionRpc);
const preferenceActionRevalidation = savePreferenceActionSource.indexOf('revalidatePath("/settings/preparation")', preferenceActionRpc);
assert.match(savePreferenceActionSource, /form: unknown\): Promise<AccountActionState> \{\s*const parsed = parseSavePreparationPreferencesActionInput\(form\);/, "preference action does not treat its direct runtime payload as unknown and parse it first");
assert.ok(preferenceActionParse >= 0 && preferenceActionInvalidReturn > preferenceActionParse && preferenceActionActor > preferenceActionInvalidReturn && preferenceActionRpc > preferenceActionActor && preferenceActionResult > preferenceActionRpc && preferenceActionRevalidation > preferenceActionResult, "preference action does not preserve parser -> actor -> revision RPC -> exact result -> revalidation ordering");
assert.ok(savePreferenceActionSource.slice(preferenceActionInvalidReturn, preferenceActionActor).includes("PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR"), "preference parse failures do not return the stable curated error copy");
assert.ok(!savePreferenceActionSource.includes("form.get("), "preference action bypasses its validated parsed payload");
assert.match(completeOnboardingActionSource, /preferredRoleLevel: role[\s\S]*primaryPreparationFocus: focus[\s\S]*preferredTimezone: timezone[\s\S]*requestedPath[\s\S]*interviewScheduled[\s\S]*preferred_role_level_value: role[\s\S]*primary_preparation_focus_value: focus[\s\S]*preferred_timezone_value: timezone/, "validated onboarding values no longer preserve established query/RPC/destination mapping");
assert.match(savePreferenceActionSource, /save_account_preparation_preferences_if_revision[\s\S]*target_expect_absent: input\.expectAbsent[\s\S]*target_expected_updated_at: input\.expectedUpdatedAt[\s\S]*preferred_role_level_value: role[\s\S]*primary_preparation_focus_value: focus[\s\S]*preferred_dsa_level_value: dsaLevel/, "preparation preference saving no longer binds the validated revision and desired snapshot");
assert.ok(!savePreferenceActionSource.includes('rpc("save_account_preparation_preferences"'), "preparation preference action still calls the unsafe legacy snapshot RPC");

const preferenceFormStart = preparationPreferencesForm.indexOf("export function PreparationPreferencesForm");
const preferenceFormEnd = preparationPreferencesForm.indexOf("export function ExportAccountData", preferenceFormStart);
const preferenceFormSource = preparationPreferencesForm.slice(preferenceFormStart, preferenceFormEnd);
for (const marker of [
  "PREPARATION_PREFERENCES_EXPECTED_REVISION_FIELD",
  "preference?.updated_at ?? PREPARATION_PREFERENCES_ABSENT_REVISION",
  "event.preventDefault()",
  "if (submissionPending.current) return",
  "const formData = new FormData(event.currentTarget)",
  "startTransition(() => action(formData))",
  "submittedDraftSignature.current = draftSignature(formData)",
  "resolvePreparationPreferenceDisplayState(",
  'aria-busy={pending}',
  'aria-disabled={pending}',
  'aria-live="polite"',
  'aria-atomic="true"',
  'target="_blank"',
  'rel="noopener noreferrer"',
]) assert.ok(preferenceFormSource.includes(marker), `preparation preference form is missing ${marker}`);
const preventDefault = preferenceFormSource.indexOf("event.preventDefault()");
const duplicateGuard = preferenceFormSource.indexOf("if (submissionPending.current) return", preventDefault);
const setPending = preferenceFormSource.indexOf("submissionPending.current = true", duplicateGuard);
const captureForm = preferenceFormSource.indexOf("const formData = new FormData(event.currentTarget)", setPending);
const dispatch = preferenceFormSource.indexOf("startTransition(() => action(formData))", captureForm);
assert.ok(preventDefault >= 0 && duplicateGuard > preventDefault && setPending > duplicateGuard && captureForm > setPending && dispatch > captureForm, "preparation preference manual submit does not synchronously guard, snapshot, then dispatch");
assert.ok(preferenceFormSource.includes("draftSignature(new FormData(form)) !== submittedDraftSignature.current"), "preparation preference form cannot detect edits made after submission");
assert.ok(!preferenceFormSource.includes(" disabled={pending}"), "preparation preference pending state removes its focused submit button from activation semantics");
assert.match(styles, /\.preparation-preferences-form \.button\[aria-disabled="true"\][\s\S]*cursor: wait;[\s\S]*opacity: \.52;/, "preparation preference pending affordance is not scoped to the form");
for (const marker of ["concurrent preparation preference snapshots accept exactly one desired state", "preparation preference and desired DSA writes preserve the newer DSA roadmap"]) {
  assert.ok(persistenceQualifier.includes(marker), `persistence qualification lacks ${marker}`);
}
assert.ok(securityQualifier.includes("revision-checked preparation preferences derive the owner and deny anonymous callers"), "security qualification lacks preparation preference owner/anonymous coverage");
assert.ok(lifecycleQualifier.includes("legacy preparation preference snapshot saves fail safely without mutation"), "account lifecycle qualification lacks legacy preference fail-safe coverage");
for (const obsolete of ["parsePreferredRoleLevel", "parsePreparationFocus", "parseDsaLevel"]) {
  assert.ok(!actions.includes(obsolete) && !preferencesSource.includes(obsolete), `obsolete fail-open account parser remains reachable: ${obsolete}`);
}
assert.ok(dashboard.includes("preparationHasStarted") && dashboard.includes("getDashboardPrivateStartState()") && dashboard.includes("privateStartState.focus"), "dashboard lacks the validated preference-aware first-use transition");
assert.ok(dashboardPrivateState.includes("resolveDashboardPrivateStartState") && dashboardPrivateState.includes('focus === null) return "unsure"'), "dashboard private-state resolver lost the explicit persisted-focus contract");
assert.match(dashboardQueries, /getAuthenticatedActor\(\)[\s\S]*\.from\("user_preparation_preferences"\)[\s\S]*\.eq\("user_id", actor\.user\.id\)[\s\S]*resolveDashboardPrivateStartState/, "dashboard first-use preferences no longer flow through the owner-scoped resolver");
assert.ok(dashboard.indexOf('!preparationHasStarted') < dashboard.indexOf('className="pipeline-summary"'), "new users see zero-value summaries before the first-use action");

const accountActionInputSource = await read("lib/account/account-action-input.ts");
const credentialsSource = await read("lib/auth/credentials.ts");
const passwordRecoverySource = await read("lib/auth/password-recovery-claims.ts");
const accountLifecycleDoc = await read("docs/account-lifecycle.md");
const authSecurityDoc = await read("docs/auth-security.md");
for (const [name, parser] of [
  ["updateDisplayNameAction", "parseDisplayNameActionInput"],
  ["requestEmailChangeAction", "parseEmailChangeActionInput"],
  ["changePasswordAction", "parsePasswordChangeActionInput"],
  ["deleteAccountAction", "parseDeleteAccountActionInput"],
]) {
  const body = functionSource(actions, name);
  const parseIndex = body.indexOf(`const parsed = ${parser}(form)`);
  const invalidReturn = body.indexOf("if (!parsed.ok)", parseIndex);
  const actorIndex = body.indexOf("getAuthenticatedActor()", invalidReturn);
  assert.match(body, new RegExp(`form: unknown\\): Promise<AccountActionState> \\{\\s*const parsed = ${parser}\\(form\\);`), `${name} does not treat its runtime payload as unknown and parse it first`);
  assert.ok(parseIndex >= 0 && invalidReturn > parseIndex && actorIndex > invalidReturn, `${name} does not reject malformed runtime input before actor work`);
  assert.ok(!body.includes("form.get(") && !body.includes("String(form"), `${name} bypasses its parsed account input`);
}
for (const marker of ["instanceof FormData", "getAll(name)", "values.length !== 1", 'key.startsWith("$ACTION_")', "meetsPasswordRequirement", 'confirmation.value !== "DELETE"']) {
  assert.ok(accountActionInputSource.includes(marker), `strict account-action parser lacks ${marker}`);
}
assert.ok(credentialsSource.includes("export function meetsPasswordRequirement") && passwordRecoverySource.includes("meetsPasswordRequirement(password)"), "signup, recovery, and account password changes do not share one credential policy predicate");
assert.ok(preparationPreferencesForm.includes("PASSWORD_REQUIREMENT") && preparationPreferencesForm.includes('maxLength={128}') && preparationPreferencesForm.includes('aria-describedby="account-password-requirement"') && preparationPreferencesForm.includes('maxLength={254}'), "account forms do not expose the shared password policy and matching client bounds");
for (const [source, marker] of [
  [accountLifecycleDoc, "strictly parse exact singleton string fields before authentication"],
  [accountLifecycleDoc, "same 8–128-character, letter-and-number policy as signup and recovery"],
  [authSecurityDoc, "Duplicate, file-valued, missing, unknown, and non-`FormData` inputs"],
  [authSecurityDoc, "Signup, password recovery, and signed-in password change share one policy predicate"],
]) assert.ok(source.includes(marker), `account credential documentation lacks ${marker}`);
assert.match(actions, /admin\.auth\.admin\.deleteUser\(actor\.user\.id, false\)/, "deletion is not bound to the authenticated actor");
const deletionStart = actions.indexOf("export async function deleteAccountAction");
const deletionParse = actions.indexOf("parseDeleteAccountActionInput(form)", deletionStart);
const deletionActor = actions.indexOf("getAuthenticatedActor()", deletionParse);
const adminDelete = actions.indexOf("admin.auth.admin.deleteUser(actor.user.id, false)", deletionStart);
const deletionFailure = actions.indexOf("if (error)", adminDelete);
const cookieStoreRead = actions.indexOf("const cookieStore = await cookies()", deletionFailure);
const authCookieCleanup = actions.indexOf("cookieStore.delete(cookie.name)", cookieStoreRead);
const proofWrite = actions.indexOf("cookieStore.set(accountDeletionProofCookie", authCookieCleanup);
const homeRedirect = actions.indexOf('redirect("/")', proofWrite);
assert.ok(
  deletionStart >= 0
    && deletionParse > deletionStart
    && deletionActor > deletionParse
    && adminDelete > deletionStart
    && deletionFailure > adminDelete
    && cookieStoreRead > deletionFailure
    && authCookieCleanup > cookieStoreRead
    && proofWrite > authCookieCleanup
    && homeRedirect > proofWrite,
  "deletion proof must follow successful admin deletion and auth-cookie cleanup, then precede the home redirect",
);
assert.match(actions.slice(deletionFailure, cookieStoreRead), /return \{ status: "error", message: "Your account was not deleted\./, "admin deletion failure must return before any proof cookie can be written");
assert.match(actions, /createAccountDeletionProof\(deletionProofSecret\)/, "account deletion proof must be signed with the existing server-only service-role secret");
assert.ok(!actions.includes("createAccountDeletionProof(deletionProofSecret, actor") && !actions.includes("createAccountDeletionProof(deletionProofSecret, actor.user.id"), "account deletion proof must not include a private account identifier");
assert.ok(!actions.includes('redirect("/?account=deleted")') && !actions.includes("account=deleted"), "account deletion success must not be asserted through a public query parameter");
assert.ok(!actions.includes('form.get("userId")') && !actions.includes('form.get("user_id")'), "an account action trusts a client user ID");
assert.match(actions, /signOut\(\{ scope: "global" \}\)/, "global session signout is not implemented");
// Phase 9 moved credential verification to an isolated, cookie-free client so a
// verification step cannot rotate the caller's session. See
// lib/auth/reauthentication.ts.
assert.match(actions, /parsePasswordChangeActionInput\(form\)[\s\S]*verifyPasswordForSensitiveAction\(actor\.user, currentPassword\)[\s\S]*updateUser\(\{ password: newPassword \}\)/, "password change does not parse first and verify the current password before updating to the validated credential");
assert.ok(!actions.includes("actor.supabase.auth.signInWithPassword"), "credential verification must not run on the cookie-backed session client");
assert.match(actions, /supportsPasswordReauthentication\(actor\.user\)/, "deletion does not reauthenticate password-capable accounts");

assert.match(exportRoute, /getAuthenticatedActorState\(\)/, "export route does not resolve authenticated actor state");
assert.match(exportRoute, /actorState\.state === "unavailable"[\s\S]*status: 503[\s\S]*actorState\.state === "anonymous"[\s\S]*status: 401[\s\S]*const actor = actorState\.actor/, "export route does not distinguish unavailable actor verification from a verified anonymous session before using the actor");
assert.match(exportRoute, /Content-Disposition/, "export is not delivered as an attachment");
assert.match(exportRoute, /private, no-store/, "export response is not private/no-store");
assert.ok(!exportRoute.includes("searchParams") && !exportRoute.includes("userId"), "export accepts a target account parameter");
for (const forbidden of ["access_token", "refresh_token", "encrypted_password", "service_role", "claim_token", "provider_message_id", "last_error_code"]) {
  assert.ok(!exporter.includes(`"${forbidden}`), `export includes operational secret field ${forbidden}`);
}
for (const section of ["applications", "interview_rounds", "interview_preparation", "behavioral", "dsa", "system_design", "preparation_activity", "calendar", "interview_playbook", "mock_interviews", "interview_experiences", "feedback"]) {
  assert.ok(exporter.includes(section), `export lacks ${section}`);
}
for (const field of ["opening_framing", "details_to_emphasize", "details_to_avoid"]) {
  assert.ok(exporter.includes(field), `behavioral export omits ${field}`);
}
assert.match(exporter, /collectAccountExportRows[\s\S]*\.range\(from, to\)/, "export queries do not paginate past the PostgREST row cap");

// Phase 3B1: the interview_playbook section adds four owner-scoped subsections.
for (const subsection of ["diagnostic_settings", "confidence", "priorities", "constraints"]) {
  assert.ok(exporter.includes(subsection), `interview_playbook export omits ${subsection}`);
}
assert.ok(exporter.includes('EXPORT_VERSION = "1.6"'), "export version was not bumped for private DSA practice attempts");
assert.ok(exporter.includes('collectAccountExportRows("dsa_practice_attempts"'), "export omits private DSA practice attempts");
assert.ok(exporter.includes('collectAccountExportRows("feedback_submissions"'), "export omits account-linked feedback");
assert.ok(exporter.includes('collectAccountExportRows("preparation_track_progress"'), "export omits durable ML/Behavioral preparation activity");
for (const field of ["strength", "improvement", "follow_up_practice", "mock_interview_sessions!inner(user_id)"]) assert.ok(exporter.includes(field), `mock export omits ownership-safe ${field}`);

for (const destination of ["/dashboard", "/applications", "/calendar", "/settings"]) {
  assert.ok(accountControl.includes(`href="${destination}"`), `account navigation lacks ${destination}`);
}
assert.ok(!accountControl.includes('href="/behavioral/workspace"'), "account dropdown still duplicates primary preparation navigation");
assert.match(authForm, /<form[^>]*method="post"/, "auth forms can leak credentials through a pre-hydration GET submission");
assert.match(passwordForms, /<form[^>]*method="post"/, "password-recovery forms lack a safe pre-hydration method");
const deletionNotice = "Your authentication identity and account-owned records were removed. Previously submitted feedback remains private operational data with its account link removed.";
assert.ok(homepage.includes(deletionNotice), "account deletion notice must describe retained private feedback and account-link removal accurately");
assert.ok(privacyPage.includes("deleting the account removes the account link") && privacyPage.includes("does not convert an already-submitted report into a public record"), "account deletion notice must remain aligned with the documented private-feedback retention boundary");
assert.ok(!passwordForms.includes("auth-kicker"), "recovery pages reintroduce decorative pre-heading kickers");
assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.settings-workspace \{ grid-template-columns: 1fr;/, "mobile settings do not collapse to one column");
assert.ok(JSON.parse(packageJson).scripts["test:account-lifecycle"], "package script for Phase 8 is absent");

console.log("PASS  Phase 8 onboarding, settings, export, deletion, navigation, redirect, and mobile invariants");
