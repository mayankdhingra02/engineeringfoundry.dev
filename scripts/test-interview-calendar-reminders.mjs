import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildGoogleCalendarUrl, buildInterviewIcs, dayKey, monthCells, monthQueryRange, parseMonth, validIanaTimeZone } from "../lib/interview-calendar/model.ts";
import {
  REMINDER_PREFERENCE_ABSENT_REVISION,
  REMINDER_PREFERENCE_CONFLICT_ERROR,
  REMINDER_PREFERENCE_EARLIER_SNAPSHOT_SAVED_MESSAGE,
  REMINDER_PREFERENCE_EXPECTED_REVISION_FIELD,
  REMINDER_PREFERENCE_INVALID_INPUT_ERROR,
  REMINDER_PREFERENCE_PERSISTENCE_ERROR,
  REMINDER_PREFERENCE_PENDING_MESSAGE,
  REMINDER_PREFERENCE_PRESENCE_FIELDS,
  REMINDER_PREFERENCE_SAVED_MESSAGE,
  REMINDER_PREFERENCE_TIMEZONE_ERROR,
  isCanonicalReminderPreferenceRevision,
  parseReminderPreferenceActionInput,
  parseReminderPreferenceSaveResult,
  resolveReminderPreferenceDisplayState,
} from "../lib/interview-calendar/reminder-preference-action-input.ts";

const read = (file) => readFileSync(join(process.cwd(), file), "utf8");
const migration = read("supabase/migrations/202608140012_create_interview_calendar_reminders.sql");
const revisionMigration = read("supabase/migrations/202609040001_save_interview_reminder_preferences_if_revision.sql");
const calendarDatabaseTest = read("supabase/tests/database/interview_calendar_reminders.test.sql");
const calendar = read("app/calendar/page.tsx");
const settings = read("app/settings/interviews/page.tsx");
const actions = read("features/interview-calendar/actions.ts");
const preferencesForm = read("features/interview-calendar/preferences-form.tsx");
const preferenceActionInput = read("lib/interview-calendar/reminder-preference-action-input.ts");
const queries = read("lib/interview-calendar/queries.ts");
const icsRoute = read("app/api/calendar/interviews/[roundId]/ics/route.ts");
const googleRoute = read("app/api/calendar/interviews/[roundId]/google/route.ts");
const workerRoute = read("app/api/internal/reminders/process/route.ts");
const provider = read("lib/interview-reminders/provider.ts");
const worker = read("lib/interview-reminders/worker.ts");
const email = read("lib/interview-reminders/email.ts");
const globals = read("app/globals.css");
const dashboard = read("app/dashboard/page.tsx");
const application = read("app/applications/[id]/page.tsx");
const prep = read("app/interviews/[roundId]/prepare/page.tsx");
const persistenceQualifier = read("scripts/qualify-persistence-local.mjs");
const securityQualifier = read("scripts/qualify-security-local.mjs");
const accountLifecycleQualifier = read("scripts/qualify-account-lifecycle-local.mjs");

const savedRevision = "2026-09-04T12:34:56.123456Z";
const preferenceForm = ({
  timezone = "America/Chicago",
  revision = REMINDER_PREFERENCE_ABSENT_REVISION,
  inAppEnabled = true,
  prep3DaysEnabled = true,
  interview1DayEnabled = true,
  interview1HourEnabled = true,
  emailEnabled = false,
} = {}) => {
  const form = new FormData();
  form.set("preferredTimezone", timezone);
  form.set(REMINDER_PREFERENCE_EXPECTED_REVISION_FIELD, revision);
  const values = { inAppEnabled, prep3DaysEnabled, interview1DayEnabled, interview1HourEnabled, emailEnabled };
  for (const [key, presence] of Object.entries(REMINDER_PREFERENCE_PRESENCE_FIELDS)) {
    form.set(presence, "true");
    if (values[key]) form.set(key, "true");
  }
  return form;
};

let validPreferenceCases = 0;
for (let mask = 0; mask < 32; mask += 1) {
  const booleans = {
    inAppEnabled: Boolean(mask & 1),
    prep3DaysEnabled: Boolean(mask & 2),
    interview1DayEnabled: Boolean(mask & 4),
    interview1HourEnabled: Boolean(mask & 8),
    emailEnabled: Boolean(mask & 16),
  };
  for (const [revision, expectAbsent, expectedUpdatedAt] of [
    [REMINDER_PREFERENCE_ABSENT_REVISION, true, null],
    [savedRevision, false, savedRevision],
  ]) {
    const parsed = parseReminderPreferenceActionInput(preferenceForm({ ...booleans, revision }));
    assert.deepEqual(parsed, {
      ok: true,
      value: {
        preferredTimezone: "America/Chicago",
        ...booleans,
        expectAbsent,
        expectedUpdatedAt,
        revision,
      },
    }, `valid reminder preference mask ${mask} and revision ${revision} did not round-trip`);
    validPreferenceCases += 1;
  }
}
assert.equal(validPreferenceCases, 64, "the complete reminder checkbox/revision matrix did not execute");
assert.equal(parseReminderPreferenceActionInput(preferenceForm({ timezone: "  america/chicago  " })).value?.preferredTimezone, "America/Chicago", "IANA timezone casing and whitespace were not canonicalized");
assert.equal(parseReminderPreferenceActionInput(preferenceForm({ timezone: "Etc/UTC" })).value?.preferredTimezone, "UTC", "UTC alias was not canonicalized");
assert.equal(parseReminderPreferenceActionInput(preferenceForm({ timezone: "   " })).value?.preferredTimezone, null, "blank timezone did not retain intentional null semantics");

for (const input of [undefined, null, "form", 1, true, {}, []]) {
  assert.deepEqual(parseReminderPreferenceActionInput(input), { ok: false, reason: "invalid-input" }, "a non-FormData reminder preference payload was accepted");
}
for (const name of ["preferredTimezone", REMINDER_PREFERENCE_EXPECTED_REVISION_FIELD, ...Object.values(REMINDER_PREFERENCE_PRESENCE_FIELDS)]) {
  const missing = preferenceForm(); missing.delete(name);
  assert.deepEqual(parseReminderPreferenceActionInput(missing), { ok: false, reason: "invalid-input" }, `missing ${name} was accepted`);
  const duplicate = preferenceForm(); duplicate.append(name, "true");
  assert.deepEqual(parseReminderPreferenceActionInput(duplicate), { ok: false, reason: "invalid-input" }, `duplicate ${name} was accepted`);
  const file = preferenceForm(); file.set(name, new Blob(["true"]), "value.txt");
  assert.deepEqual(parseReminderPreferenceActionInput(file), { ok: false, reason: "invalid-input" }, `file-valued ${name} was accepted`);
}
for (const name of Object.keys(REMINDER_PREFERENCE_PRESENCE_FIELDS)) {
  const duplicate = preferenceForm({ [name]: true }); duplicate.append(name, "true");
  assert.deepEqual(parseReminderPreferenceActionInput(duplicate), { ok: false, reason: "invalid-input" }, `duplicate checkbox ${name} was accepted`);
  const wrongValue = preferenceForm({ [name]: true }); wrongValue.set(name, "on");
  assert.deepEqual(parseReminderPreferenceActionInput(wrongValue), { ok: false, reason: "invalid-input" }, `noncanonical checkbox ${name} was accepted`);
  const file = preferenceForm({ [name]: true }); file.set(name, new Blob(["true"]), "value.txt");
  assert.deepEqual(parseReminderPreferenceActionInput(file), { ok: false, reason: "invalid-input" }, `file-valued checkbox ${name} was accepted`);
}
for (const [name, value] of [["unexpected", "true"], ["PreferredTimezone", "UTC"], ["user_id", "foreign"]]) {
  const form = preferenceForm(); form.set(name, value);
  assert.deepEqual(parseReminderPreferenceActionInput(form), { ok: false, reason: "invalid-input" }, `unknown or case-variant field ${name} was accepted`);
}
const actionMetadata = preferenceForm(); actionMetadata.set("$ACTION_REF_0", "opaque");
assert.equal(parseReminderPreferenceActionInput(actionMetadata).ok, true, "Next action metadata broke a valid reminder preference request");
for (const timezone of ["Central", "Mars/Olympus", "America/Chicago\u0000", "A".repeat(101)]) {
  assert.deepEqual(parseReminderPreferenceActionInput(preferenceForm({ timezone })), { ok: false, reason: "invalid-timezone" }, `invalid timezone ${JSON.stringify(timezone)} was accepted`);
}
for (const revision of ["", "ABSENT", "2026-09-04", "0000-01-01T00:00:00Z", "2026-02-30T00:00:00Z", "2026-09-04T24:00:00Z", "2026-09-04T12:00:00.1234567Z", "2026-09-04T12:00:00+14:01", "2026-09-04 12:00:00Z"]) {
  assert.equal(isCanonicalReminderPreferenceRevision(revision), false, `invalid revision ${revision} passed the timestamp guard`);
  assert.deepEqual(parseReminderPreferenceActionInput(preferenceForm({ revision })), { ok: false, reason: "invalid-input" }, `invalid revision ${revision} was accepted by the action parser`);
}
for (const revision of [savedRevision, "2026-09-04T12:34:56Z", "2026-09-04T07:34:56-05:00", "2026-09-04T14:34:56+02:00"]) {
  assert.equal(isCanonicalReminderPreferenceRevision(revision), true, `canonical database revision ${revision} was rejected`);
}

assert.deepEqual(parseReminderPreferenceSaveResult([]), { status: "conflict" }, "zero rows did not produce the stale-write conflict outcome");
assert.deepEqual(parseReminderPreferenceSaveResult([{ updated_at: savedRevision }]), { status: "saved", updatedAt: savedRevision }, "one canonical result row did not advance the revision");
for (const value of [null, undefined, {}, "row", [{ updated_at: savedRevision }, { updated_at: savedRevision }], [{}], [{ updated_at: "invalid" }], [{ updated_at: savedRevision, user_id: "private" }]]) {
  assert.deepEqual(parseReminderPreferenceSaveResult(value), { status: "invalid" }, "a malformed reminder save result was accepted");
}

assert.equal(REMINDER_PREFERENCE_INVALID_INPUT_ERROR, "Review the reminder settings and try again.");
assert.equal(REMINDER_PREFERENCE_TIMEZONE_ERROR, "Enter a valid IANA timezone, such as America/Chicago.");
assert.equal(REMINDER_PREFERENCE_CONFLICT_ERROR, "These reminder settings may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.");
assert.equal(REMINDER_PREFERENCE_PERSISTENCE_ERROR, "We couldn't save reminder settings. Try again.");
assert.equal(REMINDER_PREFERENCE_SAVED_MESSAGE, "Interview reminder settings saved.");
assert.equal(REMINDER_PREFERENCE_PENDING_MESSAGE, "Saving reminder settings…");
assert.equal(REMINDER_PREFERENCE_EARLIER_SNAPSHOT_SAVED_MESSAGE, "Earlier reminder settings saved. Review your current changes and save again.");

const idleDisplayState = { status: "idle", message: "" };
const errorDisplayState = { status: "error", message: REMINDER_PREFERENCE_PERSISTENCE_ERROR };
const savedDisplayState = { status: "success", message: REMINDER_PREFERENCE_SAVED_MESSAGE };
assert.deepEqual(
  resolveReminderPreferenceDisplayState(idleDisplayState, true, false),
  { status: "pending", message: REMINDER_PREFERENCE_PENDING_MESSAGE },
  "pending did not take display precedence before any edit",
);
assert.deepEqual(
  resolveReminderPreferenceDisplayState(errorDisplayState, true, true),
  { status: "pending", message: REMINDER_PREFERENCE_PENDING_MESSAGE },
  "pending did not take display precedence after an in-flight edit",
);
assert.deepEqual(resolveReminderPreferenceDisplayState(errorDisplayState, false, true), errorDisplayState, "an in-flight edit hid the settled error");
assert.deepEqual(resolveReminderPreferenceDisplayState(savedDisplayState, false, false), savedDisplayState, "an unchanged confirmed save lost its success result");
assert.deepEqual(
  resolveReminderPreferenceDisplayState(savedDisplayState, false, true),
  { status: "success", message: REMINDER_PREFERENCE_EARLIER_SNAPSHOT_SAVED_MESSAGE },
  "a confirmed earlier snapshot was presented as saving later edits",
);
assert.deepEqual(resolveReminderPreferenceDisplayState(idleDisplayState, false, true), idleDisplayState, "an edit invented a settlement before a save");

const actionStart = actions.indexOf("export async function saveReminderPreferencesAction");
assert.notEqual(actionStart, -1, "reminder preference action is missing");
const actionSource = actions.slice(actionStart);
const actionParser = actionSource.indexOf("const parsed = parseReminderPreferenceActionInput(form);");
const actionInvalid = actionSource.indexOf("if (!parsed.ok)");
const actionAvailability = actionSource.indexOf("isAccountPlatformAvailable()");
const actionActor = actionSource.indexOf("getAuthenticatedActor()");
const actionRpc = actionSource.indexOf('"save_interview_reminder_preferences_if_revision"');
assert.ok(
  actionParser >= 0 && actionParser < actionInvalid && actionInvalid < actionAvailability
    && actionAvailability < actionActor && actionActor < actionRpc,
  "reminder preferences must parse and reject malformed input before availability, actor, or RPC work",
);

const submitStart = preferencesForm.indexOf("const submit = (");
const submitEnd = preferencesForm.indexOf("const displayState", submitStart);
assert.ok(submitStart >= 0 && submitEnd > submitStart, "reminder preference submit handler is missing");
const submitSource = preferencesForm.slice(submitStart, submitEnd);
const preventDefault = submitSource.indexOf("event.preventDefault()");
const duplicateGuard = submitSource.indexOf("if (submissionPending.current) return");
const pendingClaim = submitSource.indexOf("submissionPending.current = true");
const formSnapshot = submitSource.indexOf("new FormData(event.currentTarget)");
const signatureCapture = submitSource.indexOf("submittedDraftSignature.current = reminderPreferenceDraftSignature(formData)");
const unchangedReset = submitSource.indexOf("setChangedSinceSubmit(false)");
const transition = submitSource.indexOf("startTransition(() => action(formData))");
assert.ok(
  preventDefault >= 0 && preventDefault < duplicateGuard && duplicateGuard < pendingClaim
    && pendingClaim < formSnapshot && formSnapshot < signatureCapture
    && signatureCapture < unchangedReset && unchangedReset < transition,
  "manual reminder submission must guard duplicates before snapshotting and starting the action transition",
);

const roundChangeFunctionStart = revisionMigration.indexOf("create or replace function public.sync_interview_reminders_after_round_change");
const saveFunctionStart = revisionMigration.indexOf("create or replace function public.save_interview_reminder_preferences_if_revision");
const legacyFunctionStart = revisionMigration.indexOf("create or replace function public.save_interview_reminder_preferences(", saveFunctionStart);
const onboardingFunctionStart = revisionMigration.indexOf("create or replace function public.complete_account_onboarding", legacyFunctionStart);
assert.ok(roundChangeFunctionStart >= 0 && saveFunctionStart > roundChangeFunctionStart && legacyFunctionStart > saveFunctionStart && onboardingFunctionStart > legacyFunctionStart, "reminder preference migration functions are missing or out of order");
const roundChangeFunction = revisionMigration.slice(roundChangeFunctionStart, saveFunctionStart);
const saveFunction = revisionMigration.slice(saveFunctionStart, legacyFunctionStart);
const legacyFunction = revisionMigration.slice(legacyFunctionStart, onboardingFunctionStart);
const onboardingFunction = revisionMigration.slice(onboardingFunctionStart);
const event = { id: "11111111-1111-4111-8111-111111111111", companyName: "A, B; Co", roleTitle: "Senior Engineer", roundName: "Architecture\nPanel", roundType: "System Design", scheduledAt: "2026-08-19T19:00:00.000Z", durationMinutes: 75, timezone: "America/Chicago", meetingLink: "https://meet.example.test/room", location: "Remote", calendarRevision: 4 };
const ics = buildInterviewIcs(event, "https://engineeringfoundry.dev", new Date("2026-08-14T12:00:00Z"));
const unfoldedIcs = ics.replaceAll("\r\n ", "");
const google = new URL(buildGoogleCalendarUrl(event, "https://engineeringfoundry.dev"));
const cases = [
  ["UTC timezone valid", validIanaTimeZone("UTC")], ["IANA timezone valid", validIanaTimeZone("America/Chicago")], ["bogus timezone rejected", !validIanaTimeZone("Central")], ["empty timezone rejected", !validIanaTimeZone("")],
  ["month parser accepts valid", parseMonth("2026-08").month === 8], ["month parser rejects 13", parseMonth("2026-13", new Date("2025-02-01Z")).month === 2], ["month query has padding", Date.parse(monthQueryRange(2026, 8).from) < Date.parse("2026-08-01T00:00:00Z")], ["month grid is six weeks", monthCells(2026, 8).length === 42], ["day key respects zone", dayKey("2026-08-01T01:00:00Z", "America/Chicago") === "2026-07-31"],
  ["ICS envelope", ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n")], ["ICS stable UID", unfoldedIcs.includes(`UID:interview-round-${event.id}@engineeringfoundry.dev`)], ["ICS revision", ics.includes("SEQUENCE:4")], ["ICS UTC start", ics.includes("DTSTART:20260819T190000Z")], ["ICS accurate end", ics.includes("DTEND:20260819T201500Z")], ["ICS escaping", ics.includes("A\\, B\\; Co")], ["ICS folding", !ics.split("\r\n").some((line) => new TextEncoder().encode(line).length > 75)], ["ICS timezone", ics.includes("X-EF-ORIGINAL-TIMEZONE:America/Chicago")], ["ICS prepare URL", unfoldedIcs.includes(`/interviews/${event.id}/prepare`)], ["ICS no private notes", !ics.toLowerCase().includes("private notes")],
  ["Google template", google.searchParams.get("action") === "TEMPLATE"], ["Google UTC dates", google.searchParams.get("dates") === "20260819T190000Z/20260819T201500Z"], ["Google timezone", google.searchParams.get("ctz") === "America/Chicago"], ["Google location", google.searchParams.get("location") === "Remote"],
  ["private dynamic calendar", calendar.includes('dynamic = "force-dynamic"')], ["calendar guard", calendar.includes("requireMemberProfile")], ["calendar views", calendar.includes('>Upcoming<') && calendar.includes('>Month<')], ["calendar omits notes", !calendar.includes("round.notes")], ["dual timezone", calendar.includes("formatTimezonePair")], ["prepare primary", calendar.includes('className="button" href={`/interviews/${round.id}/prepare`}')], ["manual snapshot copy", calendar.includes("manual snapshots")], ["mobile list fallback", globals.includes(".calendar-month-grid { display: none; }")],
  ["settings guard", settings.includes("requireMemberProfile")], ["settings opt-out", settings.includes("All timing options can be turned off")], ["strict helper owns timezone validation", preferenceActionInput.includes("canonicalIanaTimeZone") && preferenceActionInput.includes("validIanaTimeZone")], ["server actor derived", actions.includes("getAuthenticatedActor") && !actions.includes("user_id:" )],
  ["settings supplies loaded revision", settings.includes("preferenceRevision={preferenceRevision}")], ["query supplies exact revision or absence sentinel", queries.includes("savedPreference?.updated_at ?? REMINDER_PREFERENCE_ABSENT_REVISION")], ["query errors cannot become default preferences", queries.indexOf("roundResult.error || preferenceResult.error") < queries.indexOf("const savedPreference =")],
  ["action uses only revision-checked preference RPC", actionSource.includes('"save_interview_reminder_preferences_if_revision"') && !/\.rpc\(\s*["']save_interview_reminder_preferences["']\s*,/.test(actionSource)],
  ["action supplies exact CAS state", ["target_expect_absent: input.expectAbsent", "target_expected_updated_at: input.expectedUpdatedAt"].every((marker) => actionSource.includes(marker))],
  ["action supplies complete desired snapshot", ["preferred_timezone_value: input.preferredTimezone", "in_app_enabled_value: input.inAppEnabled", "prep_3_days_enabled_value: input.prep3DaysEnabled", "interview_1_day_enabled_value: input.interview1DayEnabled", "interview_1_hour_enabled_value: input.interview1HourEnabled", "email_enabled_value: input.emailEnabled"].every((marker) => actionSource.includes(marker))],
  ["action parses exact mutation result", actionSource.indexOf("parseReminderPreferenceSaveResult(data)") > actionRpc],
  ["zero rows map to curated conflict", actionSource.includes('outcome.status === "conflict"') && actionSource.includes("failed(REMINDER_PREFERENCE_CONFLICT_ERROR, true)")],
  ["malformed and database failures stay persistence failures", actionSource.includes("if (error) return failed(REMINDER_PREFERENCE_PERSISTENCE_ERROR)") && actionSource.includes('outcome.status === "invalid"')],
  ["only saved results revalidate", actionSource.indexOf('outcome.status === "invalid"') < actionSource.indexOf('revalidatePath("/calendar")')],
  ["saved revision advances the next submission", actionSource.includes("revision: outcome.updatedAt") && preferencesForm.includes("value={state.revision ?? preferenceRevision}")],
  ["manual form keeps server action fallback", preferencesForm.includes("action={action}") && preferencesForm.includes("onSubmit={submit}")],
  ["all checkbox presence sentinels are rendered", preferencesForm.includes("Object.values(REMINDER_PREFERENCE_PRESENCE_FIELDS)") && preferencesForm.includes('value="true"')],
  ["pending state is busy and guarded", preferencesForm.includes("aria-busy={pending}") && preferencesForm.includes("aria-disabled={pending}") && !submitSource.includes("disabled={pending}")],
  ["display resolver receives settlement and edit state", preferencesForm.includes("const displayState = resolveReminderPreferenceDisplayState(") && preferencesForm.includes("state,\n    pending,\n    changedSinceSubmit")],
  ["draft signature covers only six desired values", ["preferredTimezone", "inAppEnabled", "prep3DaysEnabled", "interview1DayEnabled", "interview1HourEnabled", "emailEnabled"].every((field) => preferencesForm.includes(`formData.get("${field}")`)) && !preferencesForm.slice(preferencesForm.indexOf("function reminderPreferenceDraftSignature"), preferencesForm.indexOf("export function ReminderPreferencesForm")).includes("expected_updated_at")],
  ["bubbled edits update snapshot comparison", preferencesForm.includes("onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}") && preferencesForm.includes("reminderPreferenceDraftSignature(new FormData(form)) !==")],
  ["programmatic timezone edits update snapshot comparison", preferencesForm.indexOf("input.value = suggestion") < preferencesForm.indexOf("updateChangedSinceSubmit(event.currentTarget.form)")],
  ["draft tracking cleans up on unmount", preferencesForm.includes("submittedDraftSignature.current = null")],
  ["one atomic live status reports resolved settlement", preferencesForm.includes("className={`form-status ${displayState.status}`}") && preferencesForm.includes("{displayState.message}") && preferencesForm.includes('role="status"') && preferencesForm.includes('aria-live="polite"') && preferencesForm.includes('aria-atomic="true"')],
  ["conflict recovery is safe and canonical", preferencesForm.includes("!pending && state.conflict") && preferencesForm.includes('href="/settings/interviews"') && preferencesForm.includes('target="_blank"') && preferencesForm.includes('rel="noopener noreferrer"') && preferencesForm.includes("Review latest in a new tab")],
  ["duplicate guard resets after settlement and unmount", preferencesForm.includes("if (!pending) submissionPending.current = false") && preferencesForm.includes("() => () => {")],
  ["pending button CSS is scoped and hover-neutral", globals.includes('.reminder-preferences-form .button[aria-disabled="true"]') && globals.includes('.reminder-preferences-form .button[aria-disabled="true"]:hover')],
  ["query owner scoped", queries.includes('.eq("user_id", current.user.id)')], ["query bounded", queries.includes(".limit(view === \"month\" ? 200 : 100)")], ["query batches", queries.includes('.in("round_id", ids)')], ["ICS ownership", icsRoute.includes("getOwnedCalendarInterview")], ["ICS audit", icsRoute.includes("record_interview_calendar_export")], ["ICS no-store", icsRoute.includes("private, no-store")], ["Google ownership", googleRoute.includes("getOwnedCalendarInterview")], ["Google audit", googleRoute.includes("record_interview_calendar_export")],
  ["worker POST", workerRoute.includes("export async function POST") && !workerRoute.includes("export async function GET")], ["constant-time secret", workerRoute.includes("timingSafeEqual")], ["worker 401", workerRoute.includes("status: 401")], ["worker 503", workerRoute.includes("status: 503")], ["no fake provider", provider.includes("return null")], ["claim revalidated", worker.indexOf("validate_interview_reminder_claim") < worker.indexOf("provider.send")], ["stable idempotency", worker.includes("idempotencyKey: claim.reminder_id")], ["settings link in email", email.includes("/settings/interviews")], ["email no private content", !email.includes("private_notes") && !email.includes("answer_text")],
  ["preference schema", migration.includes("create table public.interview_reminder_preferences")], ["reminder schema", migration.includes("create table public.interview_reminders")], ["export schema", migration.includes("create table public.interview_calendar_exports")], ["logical uniqueness", migration.includes("interview_reminders_unique_logical")], ["reschedule revision", migration.includes("new.reminder_schedule_revision := old.reminder_schedule_revision + 1")], ["cancel suppresses", migration.includes("rounds.status in ('Planned', 'Scheduled', 'Rescheduled')")], ["concurrent claim lock", migration.includes("for update of reminders skip locked")], ["lease recovery", migration.includes("claim_expired") && migration.includes("interval '10 minutes'")], ["bounded retry", migration.includes("attempt_count between 0 and 3") && migration.includes("interval '30 minutes'")], ["service worker", migration.includes("to service_role")], ["RLS all tables", ["interview_reminder_preferences", "interview_reminders", "interview_calendar_exports"].every((table) => migration.includes(`alter table public.${table} enable row level security`))],
  ["new CAS function has exact correlated revision contract", saveFunction.includes("target_expect_absent boolean") && saveFunction.includes("target_expected_updated_at timestamptz") && saveFunction.includes("returns table(updated_at timestamptz)")],
  ["CAS requires authenticated owner before locking", saveFunction.indexOf("current_user_id is null") < saveFunction.indexOf("pg_advisory_xact_lock")],
  ["CAS absence insert is no-overwrite", saveFunction.includes("on conflict (user_id) do nothing")],
  ["CAS update is owner and revision scoped", saveFunction.includes("where preferences.user_id = current_user_id") && saveFunction.includes("preferences.updated_at = target_expected_updated_at")],
  ["failed CAS returns before reminder resync", saveFunction.indexOf("if saved_updated_at is null") < saveFunction.indexOf("for future_round in")],
  ["saved CAS atomically resynchronizes future active rounds", saveFunction.includes("sync_interview_reminders_for_round") && saveFunction.includes("rounds.user_id = current_user_id") && saveFunction.includes("rounds.status in ('Planned', 'Scheduled', 'Rescheduled')")],
  ["preference and round mutations share owner lock", [roundChangeFunction, saveFunction, onboardingFunction].every((source) => source.includes("interview-reminder-owner:"))],
  ["new CAS grants only authenticated execution", revisionMigration.includes("grant execute on function public.save_interview_reminder_preferences_if_revision(boolean,timestamptz,text,boolean,boolean,boolean,boolean,boolean)\n  to authenticated")],
  ["legacy preference snapshot fails safely", legacyFunction.includes("Revision-checked reminder preference saving is required") && legacyFunction.includes("errcode = '0A000'")],
  ["repeated onboarding exits before preference writes", onboardingFunction.indexOf("if completed_profile.onboarding_complete") < onboardingFunction.indexOf("insert into public.user_preparation_preferences") && onboardingFunction.indexOf("if completed_profile.onboarding_complete") < onboardingFunction.indexOf("insert into public.interview_reminder_preferences")],
  ["onboarding shares reminder owner lock", onboardingFunction.includes("interview-reminder-owner:")],
  ["pgTAP covers stale snapshots and reminder resync", calendarDatabaseTest.includes("a stale preference save leaves the complete stored snapshot and revision unchanged") && calendarDatabaseTest.includes("a stale preference save does not resynchronize or cancel reminder rows")],
  ["pgTAP plan covers revision boundary", calendarDatabaseTest.includes("select plan(64);")],
  ["pgTAP covers atomic resync rollback", calendarDatabaseTest.includes("a reminder resync failure rolls the preference snapshot back")],
  ["pgTAP covers absence and onboarding bypass", calendarDatabaseTest.includes("a stale absent retry cannot overwrite the inserted preference snapshot") && calendarDatabaseTest.includes("a stale repeated onboarding call cannot overwrite reminder timezone") && calendarDatabaseTest.includes("a stale repeated onboarding call cannot overwrite preparation preferences")],
  ["persistence qualifier executes full/full CAS", persistenceQualifier.includes("concurrent reminder snapshots accept exactly one desired state without torn reminders")],
  ["persistence qualifier checks legacy failure-safe", persistenceQualifier.includes("legacy reminder snapshot saves fail safely without mutation")],
  ["security qualifier checks owner derivation and anonymous denial", securityQualifier.includes("revision-checked reminder preferences derive the owner and deny anonymous callers")],
  ["account lifecycle protects completed preferences", accountLifecycleQualifier.includes("repeated onboarding cannot overwrite completed private preferences")],
  ["dashboard integrated", dashboard.includes("reminderStates") && dashboard.includes('href="/calendar"')], ["application integrated", application.includes("reminders scheduled") && application.includes("Add to Google Calendar")], ["preparation integrated", prep.includes("prep-calendar-cue") && prep.includes("Reminder settings")],
];
for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview calendar and reminders qualification passed (${cases.length} cases).`);
