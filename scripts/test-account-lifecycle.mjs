import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ONBOARDING_ACTION_INVALID_INPUT_ERROR,
  ONBOARDING_TIMEZONE_INVALID_ERROR,
  PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR,
  parseCompleteOnboardingActionInput,
  parseSavePreparationPreferencesActionInput,
} from "../lib/account/preparation-preference-action-input.ts";
import { onboardingDestination } from "../lib/account/preferences.ts";
import {
  PREPARATION_PREFERENCES_PRIVATE_DATA_DOMAIN,
  resolvePreparationPreferencesQuery,
} from "../lib/account/preparation-preferences.ts";
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
const [migration, actions, exportRoute, exporter, onboardingPage, onboardingForm, dashboard, dashboardPrivateState, dashboardQueries, accountControl, authForm, passwordForms, styles, packageJson, homepage, privacyPage, preparationSettingsPage, preparationPreferencesQuery, preparationPreferencesForm, preferencesSource] = await Promise.all([
  read("supabase/migrations/202608150001_create_account_lifecycle.sql"),
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
]);

for (const marker of ["onboarding_completed_at", "preferred_role_level", "primary_preparation_focus", "complete_account_onboarding", "save_account_preparation_preferences"]) {
  assert.ok(migration.includes(marker), `migration is missing ${marker}`);
}
assert.match(migration, /update public\.profiles[\s\S]*onboarding_complete = true[\s\S]*onboarding_completed_at/, "established-profile backfill is absent");
assert.match(migration, /revoke update \(onboarding_complete\).*authenticated/, "clients can still forge onboarding completion");
assert.match(migration, /current_user_id uuid := auth\.uid\(\)/, "account RPCs do not derive ownership from auth.uid()");

assert.equal(onboardingDestination({ hasUpcomingInterview: true, interviewScheduled: false, focus: "dsa", requestedPath: "/dashboard" }), "/dashboard");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: true, focus: "dsa", requestedPath: "/dashboard" }), "/applications/new");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "dsa", requestedPath: "/dashboard" }), "/dsa/roadmap");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "system_design", requestedPath: "/dashboard" }), "/system-design/practice");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "behavioral", requestedPath: "/dashboard" }), "/behavioral/workspace");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: "applications", requestedPath: "/dashboard" }), "/applications/new");
assert.equal(onboardingDestination({ hasUpcomingInterview: false, interviewScheduled: false, focus: null, requestedPath: "/applications" }), "/applications");
assert.equal(safeInternalPath("//evil.example/account"), "/dashboard");
assert.equal(safeInternalPath("https://evil.example/account"), "/dashboard");

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

assert.equal(resolvePreparationPreferencesQuery({ data: null, error: null }), null, "a successful zero-row preference response is not preserved as a genuine blank state");
let validPreferenceCases = 0;
for (const preferred_role_level of validPreferredRoleLevels) {
  for (const primary_preparation_focus of validPrimaryPreparationFocuses) {
    for (const dsa_level of validPreferredDsaLevels) {
      const row = { preferred_role_level, primary_preparation_focus, dsa_level };
      assert.deepEqual(resolvePreparationPreferencesQuery({ data: row, error: null }), row, "a valid preparation-preference enum/null combination was rejected");
      validPreferenceCases += 1;
    }
  }
}
assert.equal(validPreferenceCases, 144, "the preparation-preference regression did not exercise the complete enum/null matrix");

assert.equal(ONBOARDING_ACTION_INVALID_INPUT_ERROR, "Those setup choices are not valid. Review the form and try again.", "onboarding malformed-input copy is not stable and curated");
assert.equal(ONBOARDING_TIMEZONE_INVALID_ERROR, "Choose a valid IANA timezone, such as America/Chicago.", "onboarding timezone-error copy is not stable and curated");
assert.equal(PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR, "Those preparation preferences are not valid. Review the form and try again.", "preference malformed-input copy is not stable and curated");

const formData = (entries = []) => {
  const form = new FormData();
  for (const [name, value] of entries) form.append(name, value);
  return form;
};
const preferenceFormData = ({ preferredRoleLevel = "", primaryPreparationFocus = "", dsaLevel = "" } = {}) => formData([
  ["preferredRoleLevel", preferredRoleLevel],
  ["primaryPreparationFocus", primaryPreparationFocus],
  ["dsaLevel", dsaLevel],
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
      assert.deepEqual(parsed, { ok: true, value: { preferredRoleLevel, primaryPreparationFocus, dsaLevel } }, "a valid preference action enum/null combination was rejected or remapped");
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
for (const name of ["preferredRoleLevel", "primaryPreparationFocus", "dsaLevel"]) {
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
assert.deepEqual(parseSavePreparationPreferencesActionInput(preferenceWithActionMetadata), { ok: true, value: { preferredRoleLevel: "senior", primaryPreparationFocus: "dsa", dsaLevel: "sde2" } }, "Next Server Action metadata broke a valid preference payload");

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

const representativePreference = { preferred_role_level: "senior", primary_preparation_focus: "system_design", dsa_level: "sde3plus" };
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
  ["missing preferred role", { data: { primary_preparation_focus: null, dsa_level: null }, error: null }],
  ["missing preparation focus", { data: { preferred_role_level: null, dsa_level: null }, error: null }],
  ["missing DSA level", { data: { preferred_role_level: null, primary_preparation_focus: null }, error: null }],
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
assert.match(preparationPreferencesQuery, /\.select\("preferred_role_level,primary_preparation_focus,dsa_level"\)/, "preparation preference query no longer uses the exact editable projection");
assert.ok(preparationPreferencesForm.includes("PreparationPreferences") && preparationPreferencesForm.includes("preference?.preferred_role_level") && preparationPreferencesForm.includes("preference?.primary_preparation_focus") && preparationPreferencesForm.includes("preference?.dsa_level"), "preparation settings form does not consume the validated preference projection");
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
const preferenceActionRpc = savePreferenceActionSource.indexOf('rpc("save_account_preparation_preferences"', preferenceActionActor);
const preferenceActionRevalidation = savePreferenceActionSource.indexOf('revalidatePath("/settings/preparation")', preferenceActionRpc);
assert.match(savePreferenceActionSource, /form: unknown\): Promise<AccountActionState> \{\s*const parsed = parseSavePreparationPreferencesActionInput\(form\);/, "preference action does not treat its direct runtime payload as unknown and parse it first");
assert.ok(preferenceActionParse >= 0 && preferenceActionInvalidReturn > preferenceActionParse && preferenceActionActor > preferenceActionInvalidReturn && preferenceActionRpc > preferenceActionActor && preferenceActionRevalidation > preferenceActionRpc, "preference action does not return malformed input before actor, RPC, and revalidation work");
assert.ok(savePreferenceActionSource.slice(preferenceActionInvalidReturn, preferenceActionActor).includes("PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR"), "preference parse failures do not return the stable curated error copy");
assert.ok(!savePreferenceActionSource.includes("form.get("), "preference action bypasses its validated parsed payload");
assert.match(completeOnboardingActionSource, /preferredRoleLevel: role[\s\S]*primaryPreparationFocus: focus[\s\S]*preferredTimezone: timezone[\s\S]*requestedPath[\s\S]*interviewScheduled[\s\S]*preferred_role_level_value: role[\s\S]*primary_preparation_focus_value: focus[\s\S]*preferred_timezone_value: timezone/, "validated onboarding values no longer preserve established query/RPC/destination mapping");
assert.match(actions, /save_account_preparation_preferences[\s\S]*preferred_role_level_value: role[\s\S]*primary_preparation_focus_value: focus[\s\S]*preferred_dsa_level_value: dsaLevel/, "preparation preference saving no longer uses the established authenticated RPC contract");
for (const obsolete of ["parsePreferredRoleLevel", "parsePreparationFocus", "parseDsaLevel"]) {
  assert.ok(!actions.includes(obsolete) && !preferencesSource.includes(obsolete), `obsolete fail-open account parser remains reachable: ${obsolete}`);
}
assert.ok(dashboard.includes("preparationHasStarted") && dashboard.includes("getDashboardPrivateStartState()") && dashboard.includes("privateStartState.focus"), "dashboard lacks the validated preference-aware first-use transition");
assert.ok(dashboardPrivateState.includes("resolveDashboardPrivateStartState") && dashboardPrivateState.includes('focus === null) return "unsure"'), "dashboard private-state resolver lost the explicit persisted-focus contract");
assert.match(dashboardQueries, /getAuthenticatedActor\(\)[\s\S]*\.from\("user_preparation_preferences"\)[\s\S]*\.eq\("user_id", actor\.user\.id\)[\s\S]*resolveDashboardPrivateStartState/, "dashboard first-use preferences no longer flow through the owner-scoped resolver");
assert.ok(dashboard.indexOf('!preparationHasStarted') < dashboard.indexOf('className="pipeline-summary"'), "new users see zero-value summaries before the first-use action");

assert.match(actions, /String\(form\.get\("confirmation"\)[\s\S]*!== "DELETE"/, "deletion lacks exact confirmation");
assert.match(actions, /admin\.auth\.admin\.deleteUser\(actor\.user\.id, false\)/, "deletion is not bound to the authenticated actor");
const deletionStart = actions.indexOf("export async function deleteAccountAction");
const adminDelete = actions.indexOf("admin.auth.admin.deleteUser(actor.user.id, false)", deletionStart);
const deletionFailure = actions.indexOf("if (error)", adminDelete);
const cookieStoreRead = actions.indexOf("const cookieStore = await cookies()", deletionFailure);
const authCookieCleanup = actions.indexOf("cookieStore.delete(cookie.name)", cookieStoreRead);
const proofWrite = actions.indexOf("cookieStore.set(accountDeletionProofCookie", authCookieCleanup);
const homeRedirect = actions.indexOf('redirect("/")', proofWrite);
assert.ok(
  deletionStart >= 0
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
assert.match(actions, /verifyPasswordForSensitiveAction\(actor\.user, currentPassword\)[\s\S]*updateUser\(\{ password: newPassword \}\)/, "password change does not verify the current password first");
assert.ok(!actions.includes("actor.supabase.auth.signInWithPassword"), "credential verification must not run on the cookie-backed session client");
assert.match(actions, /supportsPasswordReauthentication\(actor\.user\)/, "deletion does not reauthenticate password-capable accounts");

assert.match(exportRoute, /getAuthenticatedActor\(\)/, "export route does not resolve an authenticated actor");
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
assert.ok(exporter.includes('EXPORT_VERSION = "1.5"'), "export version was not bumped for P0.8 account-linked feedback");
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
