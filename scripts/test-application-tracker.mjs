import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { register } from "node:module";

register(new URL("./typescript-path-loader.mjs", import.meta.url));

const { parseApplicationForm, parseRoundForm } = await import("../lib/applications/validation.ts");
const { applicationNeedsAttention, attentionLabel, isActiveApplication, isActiveInterviewProcess, isUpcomingInterview, roundProgress } = await import("../lib/applications/insights.ts");

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
prohibit(applicationForm, /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/, "Application date defaults through UTC instead of the user's local calendar.");

const validation = read("lib/applications/validation.ts");
for (const marker of ["validHttpUrl", "validEmail", "zonedDateTimeToUtc", "duration_minutes", "FieldErrors"]) requireText(validation, marker, `Server validation lacks ${marker}.`);

const dashboard = read("app/dashboard/page.tsx");
for (const marker of ["getDashboardPipeline", "Your interview pipeline", "Upcoming interviews", "Applications needing attention", "Add an application", "formatCountdown"]) requireText(dashboard, marker, `Dashboard tracker integration lacks ${marker}.`);
requireText(dashboard, "<PreparationCountsStatus status={preparationCounts.status} />", "Dashboard does not expose the shared preparation-count recovery state.");
if (!/preparationCounts\.status === "unavailable" \? "Task count unavailable\." : count \? `\$\{count\.completed\}\/\$\{count\.total\} tasks` : "Start plan"/.test(dashboard)) failures.push("Dashboard can still present unavailable preparation counts as a fresh plan.");
requireText(detail, "<PreparationCountsStatus status={preparationCounts.status} />", "Application Detail does not expose the shared preparation-count recovery state.");
if (!/preparationCounts\.status === "unavailable" \? "Task count unavailable\." : count \? `\$\{count\.completed\} of \$\{count\.total\} tasks complete` : "Build a focused preparation plan"/.test(detail)) failures.push("Application Detail can still present unavailable preparation counts as an untouched plan.");

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
