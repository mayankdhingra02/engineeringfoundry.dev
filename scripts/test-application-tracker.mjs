import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { register } from "node:module";

register(new URL("./typescript-path-loader.mjs", import.meta.url));

const { parseApplicationForm, parseRoundForm } = await import("../lib/applications/validation.ts");
const {
  APPLICATION_EDIT_CONFLICT_MESSAGE,
  INTERVIEW_ROUND_EDIT_CONFLICT_MESSAGE,
  TRACKER_EDIT_REVISION_FIELD,
  parseTrackerEditRevision,
} = await import("../lib/applications/edit-revision.ts");
const { applicationNeedsAttention, attentionLabel, isActiveApplication, isActiveInterviewProcess, isUpcomingInterview, roundProgress } = await import("../lib/applications/insights.ts");
const {
  DASHBOARD_PRIVATE_DATA_DOMAIN,
  resolveDashboardPrivateStartState,
} = await import("../lib/dashboard/private-state.ts");
const { PrivateDataUnavailableError } = await import("../lib/persistence/errors.ts");

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, marker, message) => { if (!source.includes(marker)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

for (const route of ["app/applications/page.tsx", "app/applications/new/page.tsx", "app/applications/[id]/page.tsx", "app/applications/[id]/edit/page.tsx", "app/applications/[id]/rounds/new/page.tsx", "app/applications/[id]/rounds/[roundId]/edit/page.tsx"]) if (!existsSync(route)) failures.push(`Missing tracker route: ${route}`);

const migration = read("supabase/migrations/202608130003_create_application_tracker.sql");
for (const marker of ["create table public.applications", "create table public.interview_rounds", "on delete cascade", "enable row level security", "auth.uid()) = user_id", "exists (", "applications_user_status_idx", "interview_rounds_user_scheduled_idx"]) requireText(migration, marker, `Tracker migration lacks ${marker}.`);
for (const operation of ["read", "create", "update", "delete"]) { requireText(migration, `Owners can ${operation} applications`, `Application ${operation} RLS policy is missing.`); requireText(migration, `Owners can ${operation} interview rounds`, `Round ${operation} RLS policy is missing.`); }
const phase2Migration = read("supabase/migrations/202608140004_align_application_tracker_phase2.sql");
for (const marker of ["'Wishlist'", "'Accepted'", "'Ghosted'", "interview_rounds_user_upcoming_idx", "create_interview_round", "current_user_id uuid := auth.uid()", "for update", "security invoker"]) requireText(phase2Migration, marker, `Phase 2 tracker migration lacks ${marker}.`);

const actions = read("features/applications/actions.ts");
const actor = read("lib/auth/actor.ts");
for (const marker of ["getAuthenticatedActor", 'eq("user_id", current.user.id)', "parseApplicationForm", "parseRoundForm", "createApplicationAction", "updateApplicationAction", "deleteApplicationAction", "createRoundAction", 'rpc("create_interview_round"', "updateRoundAction", "deleteRoundAction", "moveRoundAction", "completeRoundAction"]) requireText(actions, marker, `Tracker actions lack ${marker}.`);
for (const marker of ["auth.getUser", "getAuthenticatedActor", "createSupabaseServerClient"]) requireText(actor, marker, `Canonical tracker actor lacks ${marker}.`);
requireText(read("lib/applications/queries.ts"), "getAuthenticatedActor", "Tracker reads do not resolve the current server actor.");
requireText(read("lib/applications/queries.ts"), "interview_rounds!interview_rounds_application_owner_fkey", "Application reads do not use the composite owner-checked round relationship.");
for (const marker of ["getDashboardPipeline", 'count: "exact"', ".limit(limit)", "UPCOMING_ROUND_STATUSES"]) requireText(read("lib/applications/queries.ts"), marker, `Dashboard tracker query lacks ${marker}.`);
if (/function getApplications\s*\(\s*userId|function getApplicationById\s*\([^)]*userId/.test(read("lib/applications/queries.ts"))) failures.push("Tracker reads accept an arbitrary user identifier.");

const list = read("app/applications/page.tsx");
for (const marker of ["Track companies, interview stages, upcoming rounds, and outcomes.", "Add application", 'name="q"', 'name="status"', 'name="company"', 'name="level"', 'name="sort"', "tracker-mobile-list", "roundProgress", "tracker-results", "Track your first interview process"]) requireText(list, marker, `Applications workspace lacks ${marker}.`);

const detail = read("app/applications/[id]/page.tsx");
for (const marker of ["getApplicationById", "notFound()", "Interview process", "Add interview round", "Move up", "Move down", "Mark completed", "Delete round", "No interview rounds yet", "Prepare for this company"]) requireText(detail, marker, `Application detail lacks ${marker}.`);
prohibit(detail, /getBehavioralWorkspaceData|STAR story bank|Private behavioral prep/, "Application detail reintroduced the out-of-scope behavioral story bank.");

const applicationForm = read("features/applications/application-form.tsx");
const roundForm = read("features/applications/round-form.tsx");
prohibit(applicationForm, /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/, "Application date defaults through UTC instead of the user's local calendar.");

const validation = read("lib/applications/validation.ts");
for (const marker of ["validHttpUrl", "validEmail", "zonedDateTimeToUtc", "duration_minutes", "FieldErrors"]) requireText(validation, marker, `Server validation lacks ${marker}.`);

const dashboard = read("app/dashboard/page.tsx");
const dashboardPrivateState = read("lib/dashboard/private-state.ts");
const dashboardQueries = read("lib/dashboard/queries.ts");
for (const marker of ["getDashboardPipeline", "Your interview pipeline", "Upcoming interviews", "Applications needing attention", "Add an application", "formatCountdown"]) requireText(dashboard, marker, `Dashboard tracker integration lacks ${marker}.`);
requireText(dashboard, "getDashboardPrivateStartState()", "Dashboard does not load its first-use facts through the owner-derived private query.");
requireText(dashboard, "privateStartState.storyCount", "Dashboard does not use the validated story count for first-use truth.");
requireText(dashboard, "privateStartState.focus", "Dashboard does not use the validated preparation focus.");
if (dashboard.indexOf("getDashboardPrivateStartState()") > dashboard.indexOf("const preparationHasStarted")) failures.push("Dashboard decides first-use state before its private facts are checked.");
prohibit(dashboard, /createSupabaseServerClient|\.from\(["'](?:user_preparation_preferences|behavioral_stories)["']\)|preferenceResult|storyCountResult/, "Dashboard bypasses the owner-derived private-state query with a direct raw read.");
prohibit(dashboard, /\bas PrimaryPreparationFocus\b|primary_preparation_focus\s*\?\?|storyCountResult\.count\s*\?\?/, "Dashboard casts or defaults an unchecked private focus/count result.");
requireText(dashboardQueries, "getAuthenticatedActor()", "Dashboard private-state query does not derive its owner from the authenticated actor.");
if ((dashboardQueries.match(/\.eq\("user_id", actor\.user\.id\)/g) ?? []).length !== 2) failures.push("Dashboard preference and story-count reads are not both owner-scoped.");
requireText(dashboardQueries, "return resolveDashboardPrivateStartState({ preferenceResult, storyCountResult })", "Dashboard query does not delegate complete results to the strict resolver.");
requireText(dashboardPrivateState, "preferenceResult.error !== null || storyCountResult.error !== null", "Dashboard resolver does not fail closed before interpreting returned private data.");
requireText(dashboard, "<PreparationCountsStatus status={preparationCounts.status} />", "Dashboard does not expose the shared preparation-count recovery state.");
if (!/preparationCounts\.status === "unavailable" \? "Task count unavailable\." : count \? `\$\{count\.completed\}\/\$\{count\.total\} tasks` : "Start plan"/.test(dashboard)) failures.push("Dashboard can still present unavailable preparation counts as a fresh plan.");
requireText(detail, "<PreparationCountsStatus status={preparationCounts.status} />", "Application Detail does not expose the shared preparation-count recovery state.");
if (!/preparationCounts\.status === "unavailable" \? "Task count unavailable\." : count \? `\$\{count\.completed\} of \$\{count\.total\} tasks complete` : "Build a focused preparation plan"/.test(detail)) failures.push("Application Detail can still present unavailable preparation counts as an untouched plan.");

const dashboardResults = (data, count) => ({
  preferenceResult: { data, error: null },
  storyCountResult: { count, error: null },
});
for (const focus of ["dsa", "system_design", "behavioral", "applications", "unsure"]) {
  assert.deepEqual(
    resolveDashboardPrivateStartState(dashboardResults({ primary_preparation_focus: focus }, 0)),
    { focus, storyCount: 0 },
    `${focus} remains an allowed persisted dashboard focus`,
  );
}
assert.deepEqual(resolveDashboardPrivateStartState(dashboardResults(null, 7)), { focus: "unsure", storyCount: 7 }, "a genuine absent preference resolves to unsure without erasing a positive story count");
assert.deepEqual(resolveDashboardPrivateStartState(dashboardResults({ primary_preparation_focus: null }, 0)), { focus: "unsure", storyCount: 0 }, "a persisted null focus resolves to unsure with a genuine zero story count");

const dashboardUnavailableMessage = "Your private dashboard data is temporarily unavailable. Please try again.";
const privateOwnerToken = "33333333-3333-4333-8333-333333333333";
function expectDashboardUnavailable(input, label) {
  let caught = null;
  try {
    resolveDashboardPrivateStartState(input);
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof PrivateDataUnavailableError, `${label} must raise PrivateDataUnavailableError`);
  assert.equal(caught.name, "PrivateDataUnavailableError", `${label} must retain the stable private-data error name`);
  assert.equal(caught.message, dashboardUnavailableMessage, `${label} must use the exact sanitized dashboard message`);
  assert.ok(!caught.message.includes("user_preparation_preferences") && !caught.message.includes(privateOwnerToken), `${label} must not expose database or owner detail`);
}

expectDashboardUnavailable({
  preferenceResult: { data: { primary_preparation_focus: "dsa" }, error: { message: `user_preparation_preferences unavailable for ${privateOwnerToken}` } },
  storyCountResult: { count: 8, error: null },
}, "preference query error with otherwise valid data");
expectDashboardUnavailable({
  preferenceResult: { data: { primary_preparation_focus: "behavioral" }, error: null },
  storyCountResult: { count: 8, error: { message: `behavioral_stories unavailable for ${privateOwnerToken}` } },
}, "story-count query error with otherwise valid data");

for (const [label, input] of [
  ["null root result", null],
  ["array root result", []],
  ["missing nested results", {}],
  ["null preference result", { preferenceResult: null, storyCountResult: { count: 0, error: null } }],
  ["null story-count result", { preferenceResult: { data: null, error: null }, storyCountResult: null }],
  ["missing preference error member", { preferenceResult: { data: null }, storyCountResult: { count: 0, error: null } }],
  ["missing story-count error member", { preferenceResult: { data: null, error: null }, storyCountResult: { count: 0 } }],
]) expectDashboardUnavailable(input, label);

for (const invalidFocus of ["DSA", "company_research", "", 1, [], {}, { primary_preparation_focus: "dsa", user_id: privateOwnerToken }]) {
  const data = typeof invalidFocus === "object" && invalidFocus !== null && !Array.isArray(invalidFocus)
    ? invalidFocus
    : { primary_preparation_focus: invalidFocus };
  expectDashboardUnavailable(dashboardResults(data, 0), `invalid persisted focus ${JSON.stringify(invalidFocus)}`);
}
for (const invalidCount of [null, 1.5, -1, Number.MAX_SAFE_INTEGER + 1, "1", NaN, Infinity]) {
  expectDashboardUnavailable(dashboardResults({ primary_preparation_focus: "dsa" }, invalidCount), `invalid story count ${String(invalidCount)}`);
}
assert.equal(DASHBOARD_PRIVATE_DATA_DOMAIN, "dashboard", "dashboard failures use the fixed sanitized private-data domain");

const css = read("app/globals.css");
for (const marker of [".tracker-workspace", ".tracker-table-wrap", ".tracker-mobile-list", ".tracker-timeline", "@media (max-width: 800px)"]) requireText(css, marker, `Tracker responsive styling lacks ${marker}.`);

const validApplication = new FormData();
validApplication.set("company_name", "Amazon");
validApplication.set("role_title", "Software Development Engineer II");
validApplication.set("status", "Interviewing");
validApplication.set("job_url", "https://amazon.jobs/example");
assert.equal(parseApplicationForm(validApplication).data?.company_name, "Amazon", "valid application input should parse");

const invalidApplication = new FormData();
invalidApplication.set("company_name", "");
invalidApplication.set("role_title", "");
invalidApplication.set("job_url", "javascript:alert(1)");
const invalidApplicationResult = parseApplicationForm(invalidApplication);
assert.ok(invalidApplicationResult.errors.company_name && invalidApplicationResult.errors.role_title && invalidApplicationResult.errors.job_url, "required fields and unsafe URLs must fail together");

const validRound = new FormData();
validRound.set("round_name", "System Design");
validRound.set("round_type", "System Design");
validRound.set("scheduled_local", "2026-09-18T14:00");
validRound.set("timezone", "America/Chicago");
validRound.set("duration_minutes", "60");
validRound.set("status", "Scheduled");
validRound.set("result", "Pending");
assert.match(parseRoundForm(validRound).data?.scheduled_at ?? "", /Z$/, "valid zoned interview input should become UTC");

const invalidRound = new FormData();
invalidRound.set("round_name", "Coding");
invalidRound.set("round_type", "Coding / DSA");
invalidRound.set("scheduled_local", "2026-09-18T14:00");
invalidRound.set("timezone", "Not/A_Timezone");
invalidRound.set("duration_minutes", "2");
invalidRound.set("status", "Scheduled");
const invalidRoundResult = parseRoundForm(invalidRound);
assert.ok(invalidRoundResult.errors.timezone && invalidRoundResult.errors.duration_minutes, "invalid timezone and duration must be rejected");

assert.equal(TRACKER_EDIT_REVISION_FIELD, "expected_updated_at", "tracker edit revision field name changed unexpectedly");
assert.equal(
  APPLICATION_EDIT_CONFLICT_MESSAGE,
  "This application may have changed since you opened this page. Your edits were not saved. Review the latest saved version before trying again.",
  "application conflict copy no longer states that edits were not saved",
);
assert.equal(
  INTERVIEW_ROUND_EDIT_CONFLICT_MESSAGE,
  "This interview round may have changed since you opened this page. Your edits were not saved. Review the latest saved version before trying again.",
  "round conflict copy no longer states that edits were not saved",
);

const revisionForm = (value = "2026-09-03T18:24:31.123456+00:00") => {
  const form = new FormData();
  form.set(TRACKER_EDIT_REVISION_FIELD, value);
  return form;
};
for (const value of [
  "2024-02-29T00:00:00Z",
  "2026-09-03T18:24:31.1Z",
  "2026-09-03T18:24:31.123456+00:00",
  "2026-09-03T13:24:31.123456-05:00",
  "2026-01-01T00:00:00+14:00",
]) {
  assert.deepEqual(parseTrackerEditRevision(revisionForm(value)), { ok: true, expectedUpdatedAt: value }, `valid database edit revision was rejected: ${value}`);
}
for (const input of [null, undefined, {}, [], "2026-09-03T18:24:31Z", 1]) {
  assert.deepEqual(parseTrackerEditRevision(input), { ok: false, reason: "invalid-input" }, `non-FormData edit revision was accepted: ${String(input)}`);
}
const missingRevision = revisionForm();
missingRevision.delete(TRACKER_EDIT_REVISION_FIELD);
assert.deepEqual(parseTrackerEditRevision(missingRevision), { ok: false, reason: "invalid-input" }, "missing edit revision was accepted");
const duplicateRevision = revisionForm();
duplicateRevision.append(TRACKER_EDIT_REVISION_FIELD, "2026-09-03T18:24:32Z");
assert.deepEqual(parseTrackerEditRevision(duplicateRevision), { ok: false, reason: "invalid-input" }, "duplicate edit revisions were accepted");
const fileRevision = revisionForm();
fileRevision.set(TRACKER_EDIT_REVISION_FIELD, new File(["2026-09-03T18:24:31Z"], "revision.txt"));
assert.deepEqual(parseTrackerEditRevision(fileRevision), { ok: false, reason: "invalid-input" }, "file-valued edit revision was accepted");
for (const value of [
  "",
  "2026-09-03",
  "2026-09-03 18:24:31Z",
  "2026-09-03T18:24:31",
  "2026-09-03T18:24:31z",
  "0000-01-01T00:00:00Z",
  "1900-02-29T00:00:00Z",
  "2026-02-29T00:00:00Z",
  "2026-04-31T00:00:00Z",
  "2026-00-01T00:00:00Z",
  "2026-13-01T00:00:00Z",
  "2026-01-00T00:00:00Z",
  "2026-01-01T24:00:00Z",
  "2026-01-01T00:60:00Z",
  "2026-01-01T00:00:60Z",
  "2026-01-01T00:00:00.1234567Z",
  "2026-01-01T00:00:00+14:01",
  "2026-01-01T00:00:00+15:00",
  "2026-01-01T00:00:00Z\nforged",
]) {
  assert.deepEqual(parseTrackerEditRevision(revisionForm(value)), { ok: false, reason: "invalid-input" }, `invalid edit revision was accepted: ${JSON.stringify(value)}`);
}

const actionSource = (name, nextName) => {
  const start = actions.indexOf(`export async function ${name}`);
  const end = nextName ? actions.indexOf(`export async function ${nextName}`, start) : actions.length;
  assert.ok(start >= 0 && end > start, `could not isolate ${name} source`);
  return actions.slice(start, end);
};
const applicationUpdateAction = actionSource("updateApplicationAction", "updateApplicationStatusAction");
const applicationStatusAction = actionSource("updateApplicationStatusAction", "deleteApplicationAction");
const roundUpdateAction = actionSource("updateRoundAction", "deleteRoundAction");
const roundCompletionAction = actionSource("completeRoundAction", "moveRoundAction");
for (const [label, source, conflictMessage, ownerPredicates] of [
  ["application", applicationUpdateAction, "APPLICATION_EDIT_CONFLICT_MESSAGE", ['.eq("id", applicationId)', '.eq("user_id", current.user.id)']],
  ["round", roundUpdateAction, "INTERVIEW_ROUND_EDIT_CONFLICT_MESSAGE", ['.eq("id", roundId)', '.eq("application_id", applicationId)', '.eq("user_id", current.user.id)']],
]) {
  const revisionParse = source.indexOf("parseTrackerEditRevision(formData)");
  const invalidRevision = source.indexOf("if (!revision.ok)", revisionParse);
  const actorLookup = source.indexOf("getAuthenticatedActor()", invalidRevision);
  const contentParse = source.indexOf(label === "application" ? "parseApplicationForm(formData)" : "parseRoundForm(formData)", actorLookup);
  const update = source.indexOf(".update(parsed.data)", contentParse);
  const revisionCas = source.indexOf('.eq("updated_at", revision.expectedUpdatedAt)', update);
  const queryError = source.indexOf("if (error)", revisionCas);
  const missingRow = source.indexOf("if (!data)", queryError);
  const revalidation = source.indexOf("revalidatePath", missingRow);
  assert.match(source, /\): Promise<TrackerActionState> \{\s*const revision = parseTrackerEditRevision\(formData\);/, `${label} full edit does not parse its revision as the first action-body step`);
  assert.ok(revisionParse >= 0 && invalidRevision > revisionParse && actorLookup > invalidRevision && contentParse > actorLookup && update > contentParse && revisionCas > update && queryError > revisionCas && missingRow > queryError && revalidation > missingRow, `${label} full edit does not preserve revision parse -> actor -> content parse -> owner CAS -> error/conflict -> revalidation ordering`);
  for (const predicate of ownerPredicates) assert.ok(source.indexOf(predicate, update) > update && source.indexOf(predicate, update) < revisionCas, `${label} CAS is missing owner predicate ${predicate}`);
  assert.ok(source.slice(invalidRevision, actorLookup).includes(conflictMessage), `${label} invalid revision does not fail before actor work with stable conflict copy`);
  assert.ok(source.slice(missingRow, revalidation).includes(conflictMessage) && source.slice(missingRow, revalidation).includes("conflict: true"), `${label} zero-row CAS is not distinguished from a query failure as a stable conflict`);
}

for (const [label, source, entity, editHref] of [
  ["application", applicationForm, "application", "/applications/${application.id}/edit"],
  ["round", roundForm, "round", "/applications/${applicationId}/rounds/${round.id}/edit"],
]) {
  const submitEditStart = source.indexOf("const submitEdit");
  const submitEditEnd = source.indexOf("return <form", submitEditStart);
  const submitEditSource = source.slice(submitEditStart, submitEditEnd);
  const preventDefault = submitEditSource.indexOf("event.preventDefault()");
  const duplicateGuard = submitEditSource.indexOf("if (editSubmissionPending.current) return", preventDefault);
  const markPending = submitEditSource.indexOf("editSubmissionPending.current = true", duplicateGuard);
  const captureForm = submitEditSource.indexOf("new FormData(event.currentTarget)", markPending);
  const dispatch = submitEditSource.indexOf("startTransition(() => formAction(formData))", captureForm);
  assert.ok(source.includes("TRACKER_EDIT_REVISION_FIELD") && source.includes(`value={${entity}.updated_at}`), `${label} edit form does not submit the exact loaded revision`);
  assert.ok(submitEditStart >= 0 && preventDefault >= 0 && duplicateGuard > preventDefault && markPending > duplicateGuard && captureForm > markPending && dispatch > captureForm, `${label} edit form does not synchronously guard, capture, and manually dispatch the submitted draft`);
  assert.ok(source.includes("<form action={formAction}") && source.includes(`onSubmit={${entity} ? submitEdit : undefined}`), `${label} create and edit submissions are not separated while retaining the host action`);
  assert.ok(source.includes("if (!pending) editSubmissionPending.current = false") && source.includes("editSubmissionPending.current = false;\n  }, []);"), `${label} edit submission guard is not released after settlement and cleanup`);
  assert.ok(source.includes('role="alert" aria-atomic="true"') && source.includes("state.conflict") && source.includes("Review latest in a new tab") && source.includes(`href={\`${editHref}\`}`) && source.includes('target="_blank"') && source.includes('rel="noopener noreferrer"'), `${label} conflict does not preserve an atomic error plus safe latest-version review path`);
  assert.ok(!/key=\{[^}]*updated_at/.test(source), `${label} edit form remounts from a newer revision and can discard the submitted draft`);
  assert.ok(!source.includes(".focus("), `${label} conflict moves focus away from the retained submitted draft`);
}
assert.match(applicationStatusAction, /\.update\(\{ status \}\)/, "application quick status no longer updates only the requested status before a stale full-edit CAS");
assert.match(roundCompletionAction, /\.update\(\{ status: "Completed" \}\)/, "round completion no longer updates only completion status before a stale full-edit CAS");

const insightNow = new Date("2026-08-14T12:00:00Z");
const waitingApplication = { status: "Recruiter Screen", updated_at: "2026-08-05T12:00:00Z" };
assert.equal(applicationNeedsAttention(waitingApplication, insightNow), true, "stale recruiter feedback should need attention");
assert.equal(attentionLabel(waitingApplication, insightNow), "Waiting 9 days for recruiter feedback");
assert.equal(isActiveApplication("Ghosted"), false, "ghosted applications are terminal");
assert.deepEqual(roundProgress([{ status: "Completed" }, { status: "Scheduled" }]), { completed: 1, total: 2, label: "1 of 2 rounds completed" });
assert.equal(isUpcomingInterview({ scheduled_at: "2026-08-18T19:00:00Z", status: "Scheduled" }, insightNow), true, "future scheduled interviews should be upcoming");
assert.equal(isUpcomingInterview({ scheduled_at: "2026-08-18T19:00:00Z", status: "Completed" }, insightNow), false, "completed interviews must not remain upcoming");
assert.equal(isUpcomingInterview({ scheduled_at: "2026-08-18T19:00:00Z", status: "Cancelled" }, insightNow), false, "cancelled interviews must not remain upcoming");

// isActiveInterviewProcess: an open application is not necessarily an active interview
// process — that requires either a process-implying status (Recruiter Screen,
// Interviewing) or at least one live round (Planned, Scheduled, Rescheduled).
// isActiveApplication continues to own the open-pipeline (not terminal) definition.
assert.equal(isActiveInterviewProcess({ status: "Wishlist", interview_rounds: [] }), false, "Wishlist with no rounds is not an active interview process");
assert.equal(isActiveInterviewProcess({ status: "Interested", interview_rounds: [] }), false, "Interested with no rounds is not an active interview process");
assert.equal(isActiveInterviewProcess({ status: "Applied", interview_rounds: [] }), false, "Applied with no rounds is not an active interview process");
assert.equal(isActiveInterviewProcess({ status: "On Hold", interview_rounds: [] }), false, "On Hold with no rounds is not an active interview process");
assert.equal(isActiveInterviewProcess({ status: "Recruiter Screen", interview_rounds: [] }), true, "Recruiter Screen with no rounds is an active interview process");
assert.equal(isActiveInterviewProcess({ status: "Interviewing", interview_rounds: [] }), true, "Interviewing with no rounds is an active interview process");
assert.equal(isActiveInterviewProcess({ status: "Applied", interview_rounds: [{ status: "Scheduled" }] }), true, "Applied with a Scheduled round is an active interview process");
assert.equal(isActiveInterviewProcess({ status: "On Hold", interview_rounds: [{ status: "Planned" }] }), true, "On Hold with a Planned round is an active interview process");
assert.equal(isActiveInterviewProcess({ status: "Rejected", interview_rounds: [{ status: "Scheduled" }] }), false, "a terminal Rejected application is never an active interview process, regardless of round status");
assert.equal(isActiveInterviewProcess({ status: "Offer", interview_rounds: [{ status: "Scheduled" }] }), false, "a terminal Offer application is never an active interview process, regardless of round status");
assert.equal(isActiveInterviewProcess({ status: "Accepted", interview_rounds: [{ status: "Scheduled" }] }), false, "a terminal Accepted application is never an active interview process, regardless of round status");
assert.equal(isActiveInterviewProcess({ status: "Applied", interview_rounds: [{ status: "Rescheduled" }] }), true, "a Rescheduled round also counts as a live round");
assert.equal(isActiveInterviewProcess({ status: "Interviewing", interview_rounds: [{ status: "Completed" }, { status: "Cancelled" }] }), true, "Interviewing status alone is sufficient regardless of round statuses");
assert.equal(isActiveApplication("Rejected"), false, "isActiveApplication itself remains unchanged: Rejected is still terminal");
assert.equal(isActiveApplication("Wishlist"), true, "isActiveApplication itself remains unchanged: Wishlist is still open");

if (failures.length) { console.error(`Application tracker regression failed:\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log("Application tracker regression passed: protected CRUD routes, ownership-scoped actions, RLS, timeline ordering, timezone validation, dashboard integration, filters, empty states, and responsive layouts hold.");
