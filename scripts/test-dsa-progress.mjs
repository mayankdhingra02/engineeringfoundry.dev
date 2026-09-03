import { readFileSync } from "node:fs";
import { canonicalDsaQuestionById, canonicalDsaQuestions } from "../lib/dsa/catalog.ts";
import { dsaInterviewQuestionDatabase } from "../data/dsa/question-database.ts";
import { roadmapProblems } from "../data/dsa/roadmap-problem-registry.ts";
import { chooseContinueQuestion, getNeedsReview, getRoadmapProgress, getTopicProgress, progressByQuestionId } from "../lib/dsa/progress.ts";
import {
  QUICK_DSA_PROGRESS_INVALID_INPUT_ERROR,
  parseQuickDsaBookmarkActionInput,
  parseQuickDsaStatusActionInput,
} from "../lib/dsa/quick-progress-action-input.ts";
import {
  DSA_WORKSPACE_PRIVATE_DATA_DOMAIN,
  resolveDsaWorkspacePrivateState,
} from "../lib/dsa/workspace-state.ts";
import { PrivateDataUnavailableError } from "../lib/persistence/errors.ts";

const checks = [];
const check = (name, value) => checks.push({ name, ok: Boolean(value) });
const read = (path) => readFileSync(path, "utf8");
const row = (question_id, status, confidence = null, offset = 0) => ({ user_id: "fixture", question_id, status, confidence, bookmarked: false, notes: null, first_attempted_at: status === "not_started" ? null : `2026-08-${String(10 + offset).padStart(2, "0")}T12:00:00Z`, last_practiced_at: status === "not_started" ? null : `2026-08-${String(10 + offset).padStart(2, "0")}T12:00:00Z`, solved_at: ["solved", "review"].includes(status) ? `2026-08-${String(10 + offset).padStart(2, "0")}T12:00:00Z` : null, created_at: "2026-08-10T12:00:00Z", updated_at: "2026-08-10T12:00:00Z" });
const form = (entries) => {
  const value = new FormData();
  for (const [name, entry] of entries) value.append(name, entry);
  return value;
};

const ids = canonicalDsaQuestions.map((question) => question.id);
const browserIds = dsaInterviewQuestionDatabase.map((question) => question.id);
const roadmapIds = roadmapProblems.map((question) => question.id);
check("canonical IDs are globally unique", new Set(ids).size === ids.length);
check("Two Sum uses the stable canonical slug", canonicalDsaQuestionById.has("two-sum") && !canonicalDsaQuestionById.has("demo-two-sum"));
check("Longest Substring uses one cross-surface ID", browserIds.includes("longest-substring-without-repeating-characters") && roadmapIds.includes("longest-substring-without-repeating-characters"));
check("every browser question belongs to the catalog", browserIds.every((id) => canonicalDsaQuestionById.has(id)));
check("every roadmap question belongs to the catalog", roadmapIds.every((id) => canonicalDsaQuestionById.has(id)));
check("catalog identity does not depend on array position", canonicalDsaQuestions[0].id !== "0" && canonicalDsaQuestions.at(-1).id !== String(canonicalDsaQuestions.length - 1));

const progress = progressByQuestionId([
  row("two-sum", "attempted", "medium", 1),
  row("longest-substring-without-repeating-characters", "solved", "low", 2),
  row("course-schedule", "review", "high", 3),
]);
check("progress rows are keyed by canonical question ID", progress["two-sum"]?.status === "attempted");
check("Continue prioritizes explicit review", chooseContinueQuestion("sde2", progress)?.id === "course-schedule");
check("Continue prioritizes attempted when review is absent", chooseContinueQuestion("sde2", progressByQuestionId([row("two-sum", "attempted", "medium", 1), row("longest-substring-without-repeating-characters", "solved", "low", 2)]))?.id === "two-sum");
check("roadmap progress treats solved as complete", getRoadmapProgress("sde2", progress).completed >= 1);
check("roadmap progress treats review as complete", getRoadmapProgress("sde2", progress).completed >= 2);
check("Needs review includes attempted", getNeedsReview(progress).some((entry) => entry.question.id === "two-sum"));
check("Needs review includes low-confidence solved", getNeedsReview(progress).some((entry) => entry.question.id === "longest-substring-without-repeating-characters"));
check("Needs review includes explicit review", getNeedsReview(progress).some((entry) => entry.question.id === "course-schedule"));
check("topic summaries derive from question activity", getTopicProgress(progress).some((topic) => topic.practiced > 0));

const canonicalQuestionIds = new Set(ids);
for (const status of ["not_started", "attempted", "solved", "review"]) {
  check(`quick status parser accepts exact ${status}`, JSON.stringify(parseQuickDsaStatusActionInput(
    form([["question_id", "two-sum"], ["status", status]]),
    canonicalQuestionIds,
  )) === JSON.stringify({ ok: true, value: { questionId: "two-sum", status } }));
}
for (const bookmarked of [true, false]) {
  check(`quick bookmark parser accepts explicit desired ${bookmarked} state`, JSON.stringify(parseQuickDsaBookmarkActionInput(
    form([["question_id", "two-sum"], ["bookmarked", String(bookmarked)]]),
    canonicalQuestionIds,
  )) === JSON.stringify({ ok: true, value: { questionId: "two-sum", bookmarked } }));
}
check("quick parsers expose one stable curated invalid-input error", QUICK_DSA_PROGRESS_INVALID_INPUT_ERROR === "That practice update is not valid.");

const invalidQuickInputs = [null, undefined, {}, [], "two-sum", 1, true];
for (const [index, input] of invalidQuickInputs.entries()) {
  check(`quick status parser rejects non-FormData input ${index + 1}`, parseQuickDsaStatusActionInput(input, canonicalQuestionIds).ok === false);
  check(`quick bookmark parser rejects non-FormData input ${index + 1}`, parseQuickDsaBookmarkActionInput(input, canonicalQuestionIds).ok === false);
}
const invalidStatusForms = [
  form([["status", "solved"]]),
  form([["question_id", "two-sum"]]),
  form([["question_id", "two-sum"], ["question_id", "course-schedule"], ["status", "solved"]]),
  form([["question_id", "two-sum"], ["status", "solved"], ["status", "review"]]),
  form([["question_id", "fabricated-question"], ["status", "solved"]]),
  form([["question_id", "Two-Sum"], ["status", "solved"]]),
  form([["question_id", "two-sum "], ["status", "solved"]]),
  form([["question_id", "two-sum"], ["status", "Solved"]]),
  form([["question_id", "two-sum"], ["status", "comfortable"]]),
  form([["question_id", "two-sum"], ["status", "solved"], ["unexpected", "value"]]),
  form([["question_id", new Blob(["two-sum"])], ["status", "solved"]]),
  form([["question_id", "two-sum"], ["status", new Blob(["solved"])]]),
];
for (const [index, input] of invalidStatusForms.entries()) {
  check(`quick status parser rejects adversarial form ${index + 1}`, parseQuickDsaStatusActionInput(input, canonicalQuestionIds).ok === false);
}
const invalidBookmarkForms = [
  form([["bookmarked", "true"]]),
  form([["question_id", "two-sum"]]),
  form([["question_id", "two-sum"], ["question_id", "course-schedule"], ["bookmarked", "true"]]),
  form([["question_id", "two-sum"], ["bookmarked", "true"], ["bookmarked", "false"]]),
  form([["question_id", "fabricated-question"], ["bookmarked", "true"]]),
  form([["question_id", "two-sum"], ["bookmarked", "True"]]),
  form([["question_id", "two-sum"], ["bookmarked", "on"]]),
  form([["question_id", "two-sum"], ["bookmarked", "1"]]),
  form([["question_id", "two-sum"], ["bookmarked", "true"], ["unexpected", "value"]]),
  form([["question_id", new Blob(["two-sum"])], ["bookmarked", "true"]]),
  form([["question_id", "two-sum"], ["bookmarked", new Blob(["true"])]]),
];
for (const [index, input] of invalidBookmarkForms.entries()) {
  check(`quick bookmark parser rejects adversarial form ${index + 1}`, parseQuickDsaBookmarkActionInput(input, canonicalQuestionIds).ok === false);
}
check("quick parsers allow only inert Next action metadata beyond their exact fields",
  parseQuickDsaStatusActionInput(form([["question_id", "two-sum"], ["status", "solved"], ["$ACTION_ID", "fixture"]]), canonicalQuestionIds).ok
  && parseQuickDsaBookmarkActionInput(form([["question_id", "two-sum"], ["bookmarked", "true"], ["$ACTION_ID", "fixture"]]), canonicalQuestionIds).ok);

const workspaceOwnerId = "11111111-1111-4111-8111-111111111111";
const workspaceApplicationId = "22222222-2222-4222-8222-222222222222";
const workspaceContext = {
  ownerId: workspaceOwnerId,
  requestedApplicationId: workspaceApplicationId,
  canonicalQuestionIds: ids,
};
const workspaceProgressRow = {
  ...row("two-sum", "solved", "high", 1),
  user_id: workspaceOwnerId,
  notes: "Revisit the invariant.",
};
const workspaceApplication = {
  id: workspaceApplicationId,
  company_name: "Example Company",
  company_slug: "example-company",
  role_title: "Software Engineer",
};
const workspaceInput = ({
  progressData = [workspaceProgressRow],
  preferenceData = { dsa_level: "sde2" },
  applicationData = workspaceApplication,
} = {}) => ({
  progressResult: { data: progressData, error: null },
  preferenceResult: { data: preferenceData, error: null },
  applicationResult: { data: applicationData, error: null },
});
const expectedWorkspaceError = `Your private ${DSA_WORKSPACE_PRIVATE_DATA_DOMAIN} data is temporarily unavailable. Please try again.`;
const expectWorkspaceUnavailable = (input, context, label) => {
  let error;
  try {
    resolveDsaWorkspacePrivateState(input, context);
  } catch (caught) {
    error = caught;
  }
  check(label, error instanceof PrivateDataUnavailableError
    && error.name === "PrivateDataUnavailableError"
    && error.message === expectedWorkspaceError
    && !error.message.includes("database detail")
    && !error.message.includes(workspaceOwnerId));
};

for (const [preferenceData, expectedLevel] of [
  [null, "sde2"],
  [{ dsa_level: null }, "sde2"],
  [{ dsa_level: "sde1" }, "sde1"],
  [{ dsa_level: "sde2" }, "sde2"],
  [{ dsa_level: "sde3plus" }, "sde3plus"],
]) {
  check(`workspace resolves ${JSON.stringify(preferenceData)} to ${expectedLevel}`, resolveDsaWorkspacePrivateState(
    workspaceInput({ preferenceData }),
    workspaceContext,
  ).preferredRoadmap === expectedLevel);
}
const resolvedWorkspace = resolveDsaWorkspacePrivateState(workspaceInput(), workspaceContext);
check("workspace resolves a complete owner progress row", resolvedWorkspace.progress[workspaceProgressRow.question_id]?.user_id === workspaceOwnerId
  && resolvedWorkspace.progress[workspaceProgressRow.question_id]?.status === "solved"
  && resolvedWorkspace.progress[workspaceProgressRow.question_id]?.confidence === "high"
  && resolvedWorkspace.progress[workspaceProgressRow.question_id]?.notes === "Revisit the invariant.");
check("workspace resolves the requested owner application projection", JSON.stringify(resolvedWorkspace.application) === JSON.stringify(workspaceApplication));
const emptyWorkspace = resolveDsaWorkspacePrivateState(
  workspaceInput({ progressData: [], preferenceData: null, applicationData: null }),
  { ...workspaceContext, requestedApplicationId: null },
);
check("genuine empty workspace results preserve explicit defaults", Object.keys(emptyWorkspace.progress).length === 0
  && emptyWorkspace.preferredRoadmap === "sde2"
  && emptyWorkspace.application === null);
const maximumQuestionId = "q".repeat(200);
const maximumQuestionState = resolveDsaWorkspacePrivateState(
  workspaceInput({ progressData: [{ ...workspaceProgressRow, question_id: maximumQuestionId }] }),
  { ...workspaceContext, canonicalQuestionIds: [...ids, maximumQuestionId] },
);
check("workspace accepts the database's 200-character canonical question ID boundary", maximumQuestionState.progress[maximumQuestionId]?.question_id === maximumQuestionId);
const oversizedQuestionId = "q".repeat(201);
expectWorkspaceUnavailable(
  workspaceInput({ progressData: [{ ...workspaceProgressRow, question_id: oversizedQuestionId }] }),
  { ...workspaceContext, canonicalQuestionIds: [...ids, oversizedQuestionId] },
  "workspace rejects a canonical question ID beyond the database boundary",
);

for (const resultName of ["progressResult", "preferenceResult", "applicationResult"]) {
  const failed = workspaceInput();
  failed[resultName] = { data: null, error: new Error(`database detail from ${resultName} for ${workspaceOwnerId}`) };
  expectWorkspaceUnavailable(failed, workspaceContext, `${resultName} query failure is unavailable`);

  const failedWithData = workspaceInput();
  failedWithData[resultName] = {
    ...failedWithData[resultName],
    error: new Error(`database detail with data from ${resultName} for ${workspaceOwnerId}`),
  };
  expectWorkspaceUnavailable(failedWithData, workspaceContext, `${resultName} error takes precedence over returned data`);
}

for (const [input, context, label] of [
  [null, workspaceContext, "null workspace result"],
  [[], workspaceContext, "array workspace result"],
  [{}, workspaceContext, "missing workspace result members"],
  [{ ...workspaceInput(), unexpected: true }, workspaceContext, "unknown workspace result member"],
  [{ ...workspaceInput(), progressResult: null }, workspaceContext, "non-object progress wrapper"],
  [{ ...workspaceInput(), preferenceResult: { data: null } }, workspaceContext, "missing preference error member"],
  [{ ...workspaceInput(), applicationResult: { error: null } }, workspaceContext, "missing application data member"],
  [{ ...workspaceInput(), progressResult: { data: [], error: undefined } }, workspaceContext, "undefined progress error member"],
  [workspaceInput({ progressData: null }), workspaceContext, "non-array progress data"],
  [workspaceInput({ progressData: [{ ...workspaceProgressRow, user_id: "33333333-3333-4333-8333-333333333333" }] }), workspaceContext, "foreign progress owner"],
  [workspaceInput({ progressData: [{ ...workspaceProgressRow, question_id: "unknown-but-valid-slug" }] }), workspaceContext, "unknown canonical question"],
  [workspaceInput({ progressData: [{ ...workspaceProgressRow, status: "complete" }] }), workspaceContext, "invalid persisted progress status"],
  [workspaceInput({ progressData: [{ ...workspaceProgressRow, first_attempted_at: "August 11, 2026" }] }), workspaceContext, "non-ISO progress timestamp"],
  [workspaceInput({ progressData: [{ ...workspaceProgressRow, updated_at: "2026-02-30T12:00:00Z" }] }), workspaceContext, "impossible progress timestamp"],
  [workspaceInput({ progressData: [{ ...workspaceProgressRow, created_at: "0000-01-01T00:00:00Z" }] }), workspaceContext, "year-zero progress timestamp"],
  [workspaceInput({ preferenceData: { dsa_level: "senior" } }), workspaceContext, "invalid persisted roadmap level"],
  [workspaceInput({ applicationData: { ...workspaceApplication, id: "33333333-3333-4333-8333-333333333333" } }), workspaceContext, "mismatched application ID"],
  [workspaceInput({ applicationData: { id: workspaceApplicationId } }), workspaceContext, "incomplete application projection"],
  [workspaceInput({ applicationData: workspaceApplication }), { ...workspaceContext, requestedApplicationId: null }, "application without requested context"],
  [workspaceInput(), { ...workspaceContext, ownerId: "not-a-user" }, "malformed owner context"],
  [workspaceInput(), { ...workspaceContext, requestedApplicationId: "not-an-application" }, "malformed application context"],
]) {
  expectWorkspaceUnavailable(input, context, `${label} is unavailable`);
}

const migration = read("supabase/migrations/202608140007_create_dsa_question_progress.sql");
const quickMigration = read("supabase/migrations/202609030002_set_dsa_question_quick_progress.sql");
const dsaDatabaseTest = read("supabase/tests/database/dsa_question_progress.test.sql");
const persistenceQualifier = read("scripts/qualify-persistence-local.mjs");
const securityQualifier = read("scripts/qualify-security-local.mjs");
const seedBlock = migration.match(/select unnest\(array\[([\s\S]*?)\]\);/)?.[1] ?? "";
const seeded = new Set([...seedBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]));
check("database catalog seed matches the application catalog", ids.every((id) => seeded.has(id)) && seeded.size === ids.length);
check("database rejects unknown canonical IDs", migration.includes("Unknown canonical DSA question") && migration.includes("dsa_question_progress_question_id_fkey") === false && migration.includes("references public.dsa_question_catalog"));
check("database status vocabulary is exact", migration.includes("'not_started','attempted','solved','review'"));
check("private notes have a bounded constraint", migration.includes("char_length(notes) <= 5000"));
check("views do not update last practiced", migration.includes("last_practiced_at = case") && migration.includes("status is distinct from excluded.status"));
check("RLS and server-authoritative RPC are present", migration.includes("enable row level security") && migration.includes("security definer") && migration.includes("auth.uid()"));
const quickStatusBranch = quickMigration.match(/if target_status is not null then([\s\S]*?)elsif target_bookmarked then/)?.[1] ?? "";
const quickBookmarkBranch = quickMigration.match(/elsif target_bookmarked then([\s\S]*?)else/)?.[1] ?? "";
const quickAbsentBookmarkBranch = quickMigration.match(/else\s+-- Removing a bookmark([\s\S]*?)end if;/)?.[1] ?? "";
check("atomic quick-progress RPC accepts exactly one desired field for an authenticated canonical question", quickMigration.includes("create or replace function public.set_dsa_question_quick_progress(")
  && /target_question_id text,\s*target_status text,\s*target_bookmarked boolean\s*\)\s*returns text/.test(quickMigration)
  && quickMigration.includes("if current_user_id is null then")
  && quickMigration.includes("public.dsa_question_catalog")
  && quickMigration.includes("if (target_status is null) = (target_bookmarked is null) then")
  && quickMigration.includes("Exactly one quick progress value is required"));
check("atomic quick-progress RPC serializes first-use owner/question writes", quickMigration.includes("pg_catalog.pg_advisory_xact_lock(")
  && quickMigration.includes("pg_catalog.hashtext(current_user_id::text)")
  && quickMigration.includes("pg_catalog.hashtext(target_question_id)"));
check("atomic status changes preserve unrelated bookmark, confidence, and note fields", quickStatusBranch.includes("status = excluded.status")
  && quickStatusBranch.includes("first_attempted_at = coalesce(")
  && quickStatusBranch.includes("last_practiced_at = practice_time")
  && quickStatusBranch.includes("solved_at = coalesce(")
  && !quickStatusBranch.includes("bookmarked =")
  && !quickStatusBranch.includes("confidence")
  && !quickStatusBranch.includes("notes"));
check("atomic bookmark changes touch only the explicit desired bookmark state", quickBookmarkBranch.includes("bookmarked = true")
  && !quickBookmarkBranch.includes("status =")
  && !quickBookmarkBranch.includes("confidence")
  && !quickBookmarkBranch.includes("notes")
  && !quickBookmarkBranch.includes("last_practiced_at"));
check("removing an absent bookmark is an idempotent no-row update", quickAbsentBookmarkBranch.includes("update public.dsa_question_progress")
  && quickAbsentBookmarkBranch.includes("set bookmarked = false")
  && !quickAbsentBookmarkBranch.includes("insert into"));
check("atomic quick-progress RPC has an explicit restricted grant boundary", quickMigration.includes("security definer")
  && quickMigration.includes("set search_path = ''")
  && quickMigration.includes("revoke all on function public.set_dsa_question_quick_progress(text,text,boolean) from public, anon, authenticated")
  && quickMigration.includes("grant execute on function public.set_dsa_question_quick_progress(text,text,boolean) to authenticated"));
check("pgTAP covers the atomic RPC's grants, preservation, idempotence, no-row clear, input rejection, and owner isolation", dsaDatabaseTest.includes("select plan(71)")
  && dsaDatabaseTest.includes("anonymous users cannot invoke the atomic quick-progress RPC")
  && dsaDatabaseTest.includes("the atomic bookmark update preserves private notes")
  && dsaDatabaseTest.includes("repeating an atomic bookmark state does not churn updated_at")
  && dsaDatabaseTest.includes("removing an absent bookmark does not create an empty progress row")
  && dsaDatabaseTest.includes("an empty quick update is rejected")
  && dsaDatabaseTest.includes("User A bookmark survives User B atomic quick progress"));
check("persistence qualification exercises concurrent absent and existing atomic writes plus idempotence and privacy", persistenceQualifier.includes('check("concurrent atomic DSA status and bookmark updates commute on an absent row"')
  && persistenceQualifier.includes('check("concurrent atomic DSA updates preserve an existing full-editor snapshot"')
  && persistenceQualifier.includes("const [statusResult, bookmarkResult] = await Promise.all([")
  && persistenceQualifier.includes('row.confidence === "high" && row.notes === "Fresh private note from the full editor."')
  && persistenceQualifier.includes('check("atomic DSA desired states are idempotent and bookmark false avoids an empty row"')
  && persistenceQualifier.includes('check("atomic DSA quick progress remains owner-scoped"'));
check("security qualification uses the exact atomic signature and rejects anonymous, ambiguous, fabricated, and foreign access", securityQualifier.includes('check("atomic DSA quick progress rejects fabricated and ambiguous mutations"')
  && securityQualifier.includes('check("anonymous callers cannot invoke atomic DSA quick progress"')
  && securityQualifier.includes('attempted.error?.code, "42501"')
  && securityQualifier.includes('check("atomic DSA quick progress derives the owner without exposing a foreign row"'));

const routes = read("app/dsa/[...segments]/page.tsx");
const browser = read("features/dsa/questions/question-browser.tsx");
const practice = read("features/dsa/progress/practice-workspace.tsx");
const querySource = read("lib/dsa/queries.ts");
const browserUrlState = read("lib/dsa/question-browser-url-state.ts");
const questionTable = read("features/dsa/questions/question-table.tsx");
const questionDetail = read("features/dsa/progress/question-detail.tsx");
const roadmapExperience = read("features/dsa/roadmap/level-roadmap-experience.tsx");
const roadmapModule = read("features/dsa/roadmap/level-roadmap-module.tsx");
const activityControl = read("components/preparation-activity-control.tsx");
const progressActions = read("features/dsa/progress/actions.ts");
const preparationActions = read("features/preparation-progress/actions.ts");
const quickActionInput = read("lib/dsa/quick-progress-action-input.ts");
const quickProgressControls = read("features/dsa/progress/quick-progress-actions.tsx");
check("public questions and private My Practice share the existing route", routes.includes("libraryOnly={segments[0] === \"questions\"}") && routes.includes("PracticeWorkspace"));
check("application context survives library filters and review navigation", browser.includes("createDsaQuestionBrowserUrlContext({ questions, companies, fixedCompanySlug, signedIn, applicationId })") && browserUrlState.includes('params.set("application", applicationId)') && practice.includes('params.set("application", application.id)') && practice.includes('params.set("company", application.company_slug)'));
check("question detail preserves application and company context", read("features/dsa/progress/question-detail.tsx").includes('params.set("application", applicationId)') && read("features/dsa/progress/question-detail.tsx").includes('params.set("company", companySlug)'));
check("dashboard and application cues open DSA practice", read("app/dashboard/page.tsx").includes("dashboard-dsa-cue") && read("app/applications/[id]/page.tsx").includes("tracker-dsa-cta"));
check("My Practice exposes deterministic Continue, recent, review, topics, and roadmap switching", ["Continue", "Recent practice", "Needs review", "Topic progress", "Preferred roadmap"].every((marker) => practice.includes(marker)));
check("dashboard completion and review counts use canonical derivations", read("lib/dsa/queries.ts").includes("getRoadmapProgress(state.preferredRoadmap") && read("lib/dsa/queries.ts").includes("getNeedsReview(state.progress).length"));
check("dashboard coding context preserves the company slug", read("app/dashboard/page.tsx").includes('params.set("company", application.company_slug)'));
check("company question routes receive private progress when signed in", routes.includes("progress={state.progress} signedIn={state.signedIn}"));
check("roadmap status uses status and confidence without legacy comfortable state", !read("data/dsa/roadmap-planning.ts").includes('"comfortable"') && read("data/dsa/roadmap-planning.ts").includes("confidenceByProblemId"));
check("quick mutations expose pending and accessible error feedback", read("features/dsa/progress/quick-progress-actions.tsx").includes("Saving…") && read("features/dsa/progress/quick-progress-actions.tsx").includes('role="alert"') && read("features/dsa/progress/roadmap-preference-controls.tsx").includes("Saving preferred roadmap…"));
const canonicalApplicationIndex = querySource.indexOf("parseDsaQuestionBrowserApplicationId(applicationId)");
const availabilityIndex = querySource.indexOf("isAccountPlatformAvailable()", canonicalApplicationIndex);
const disabledReturnIndex = querySource.indexOf("if (!accountPlatformAvailable) return", availabilityIndex);
const actorIndex = querySource.indexOf("await getAuthenticatedActor()", disabledReturnIndex);
const signedOutReturnIndex = querySource.indexOf("if (!actor) return", actorIndex);
const progressQueryIndex = querySource.indexOf('.from("dsa_question_progress")', signedOutReturnIndex);
const preferenceQueryIndex = querySource.indexOf('.from("user_preparation_preferences")', progressQueryIndex);
const applicationQueryIndex = querySource.indexOf('.from("applications")', preferenceQueryIndex);
const resolverIndex = querySource.indexOf("resolveDsaWorkspacePrivateState(", applicationQueryIndex);
check("workspace state validates application context then distinguishes disabled and signed-out states before private queries", canonicalApplicationIndex >= 0
  && availabilityIndex > canonicalApplicationIndex
  && disabledReturnIndex > availabilityIndex
  && actorIndex > disabledReturnIndex
  && signedOutReturnIndex > actorIndex
  && progressQueryIndex > signedOutReturnIndex);
const progressQuerySource = querySource.slice(progressQueryIndex, preferenceQueryIndex);
const preferenceQuerySource = querySource.slice(preferenceQueryIndex, applicationQueryIndex);
const applicationQuerySource = querySource.slice(applicationQueryIndex, resolverIndex);
check("every DSA workspace private query is owner scoped", progressQuerySource.includes('.eq("user_id", actor.user.id)')
  && preferenceQuerySource.includes('.eq("user_id", actor.user.id)')
  && applicationQuerySource.includes('.eq("id", canonicalApplicationId)')
  && applicationQuerySource.includes('.eq("user_id", actor.user.id)'));
check("DSA workspace query results delegate together to the strict owner-context resolver", resolverIndex > applicationQueryIndex
  && querySource.indexOf("{ progressResult, preferenceResult, applicationResult }", resolverIndex) > resolverIndex
  && querySource.indexOf("ownerId: actor.user.id", resolverIndex) > resolverIndex
  && querySource.indexOf("requestedApplicationId: canonicalApplicationId", resolverIndex) > resolverIndex
  && querySource.indexOf("canonicalQuestionIds: canonicalDsaQuestions.map((question) => question.id)", resolverIndex) > resolverIndex
  && !querySource.includes("progressResult.data ?? []")
  && !querySource.includes("preferenceResult.data?.dsa_level"));
check("DSA routes propagate account availability through every public progress surface", routes.includes("accountPlatformAvailable={state.accountPlatformAvailable}") && read("app/dsa/page.tsx").includes("accountPlatformAvailable={accountPlatformAvailable}") && read("features/dsa/question-browser-preview.tsx").includes("accountPlatformAvailable={accountPlatformAvailable}"));
check("enabled signed-out DSA surfaces retain intentional sign-in handoffs without account-state contradictions", practice.includes("accountPlatformAvailable ? <aside") && practice.includes('href={`/signin?next=') && questionTable.includes("accountPlatformAvailable ? <Link") && questionDetail.includes("accountPlatformAvailable ? <aside") && questionDetail.includes("Browser-local completion is recorded separately.") && questionDetail.includes("{signedIn ? <><h2>Current state</h2>") && roadmapModule.includes('accountPlatformAvailable ? "Sign in to persist'));
check("disabled DSA surfaces render honest public and local states", practice.includes("Public practice remains available") && routes.includes("Account progress unavailable · demo associations") && routes.includes("Account progress unavailable · public roadmap") && questionTable.includes("Account progress unavailable") && !questionTable.includes('<span className="dsa-signin-progress">Account progress unavailable</span>') && questionDetail.includes("Browser-local practice") && questionDetail.includes("Private notes are unavailable in this configuration") && roadmapExperience.includes("accountPlatformAvailable={accountPlatformAvailable}") && roadmapModule.includes("Account-backed problem progress is unavailable in this configuration"));
check("disabled DSA local activity skips its Server Action and reports persistence honestly", activityControl.includes("accountPlatformAvailable: boolean;") && !activityControl.includes("accountPlatformAvailable = true") && activityControl.indexOf("if (accountPlatformAvailable)") > -1 && activityControl.indexOf("if (accountPlatformAvailable)") < activityControl.indexOf("recordPreparationActivityAction({ track, itemId, status: next })") && activityControl.includes("resolvePreparationActivitySaveOutcome") && activityControl.includes("next === \"completed\" && outcome.persisted") && activityControl.includes("Account saving is unavailable"));
check("direct progress actions report disabled account persistence before actor resolution", progressActions.includes("if (!isAccountPlatformAvailable()) return accountUnavailable()") && progressActions.indexOf("if (!isAccountPlatformAvailable()) return accountUnavailable()") < progressActions.indexOf("await getAuthenticatedActor()") && preparationActions.indexOf("if (!isAccountPlatformAvailable()) return") < preparationActions.indexOf("await getAuthenticatedActor()"));
const quickStatusActionSource = progressActions.slice(
  progressActions.indexOf("export async function quickDsaStatusAction"),
  progressActions.indexOf("export async function toggleDsaBookmarkAction"),
);
const quickBookmarkActionSource = progressActions.slice(
  progressActions.indexOf("export async function toggleDsaBookmarkAction"),
  progressActions.indexOf("export async function savePreferredDsaRoadmapAction"),
);
check("quick status action parses before availability, actor, or RPC work", quickStatusActionSource.slice(quickStatusActionSource.indexOf("{") + 1).trimStart().startsWith("const parsed = parseQuickDsaStatusActionInput(formData, canonicalQuestionIds);")
  && quickStatusActionSource.indexOf("const parsed = parseQuickDsaStatusActionInput(formData, canonicalQuestionIds)") < quickStatusActionSource.indexOf("isAccountPlatformAvailable()")
  && quickStatusActionSource.indexOf("if (!parsed.ok) return") < quickStatusActionSource.indexOf("await getAuthenticatedActor()")
  && quickStatusActionSource.indexOf("await getAuthenticatedActor()") < quickStatusActionSource.indexOf('.rpc("set_dsa_question_quick_progress"'));
check("quick bookmark action parses before availability, actor, or RPC work", quickBookmarkActionSource.slice(quickBookmarkActionSource.indexOf("{") + 1).trimStart().startsWith("const parsed = parseQuickDsaBookmarkActionInput(formData, canonicalQuestionIds);")
  && quickBookmarkActionSource.indexOf("const parsed = parseQuickDsaBookmarkActionInput(formData, canonicalQuestionIds)") < quickBookmarkActionSource.indexOf("isAccountPlatformAvailable()")
  && quickBookmarkActionSource.indexOf("if (!parsed.ok) return") < quickBookmarkActionSource.indexOf("await getAuthenticatedActor()")
  && quickBookmarkActionSource.indexOf("await getAuthenticatedActor()") < quickBookmarkActionSource.indexOf('.rpc("set_dsa_question_quick_progress"'));
check("quick status action sends only desired status and validates the returned canonical ID", /\.rpc\("set_dsa_question_quick_progress", \{\s*target_question_id: questionId,\s*target_status: status,\s*target_bookmarked: null,\s*\}\)/.test(quickStatusActionSource)
  && quickStatusActionSource.includes("data !== questionId")
  && quickStatusActionSource.includes("!canonicalQuestionIds.has(data)"));
check("quick bookmark action sends explicit desired state and validates the returned canonical ID", /\.rpc\("set_dsa_question_quick_progress", \{\s*target_question_id: questionId,\s*target_status: null,\s*target_bookmarked: bookmarked,\s*\}\)/.test(quickBookmarkActionSource)
  && quickBookmarkActionSource.includes("data !== questionId")
  && quickBookmarkActionSource.includes("!canonicalQuestionIds.has(data)"));
check("quick actions avoid stale reads and whole-row save dispatch", !quickStatusActionSource.includes('.from("dsa_question_progress")')
  && !quickBookmarkActionSource.includes('.from("dsa_question_progress")')
  && !quickStatusActionSource.includes('rpc("save_dsa_question_progress"')
  && !quickBookmarkActionSource.includes('rpc("save_dsa_question_progress"'));
check("bookmark control submits the next explicit desired state and exposes current pressed state", quickProgressControls.includes('name="bookmarked" value={bookmarked ? "false" : "true"}')
  && quickProgressControls.includes("aria-pressed={bookmarked}"));
check("parser source is catalog-bound and rejects duplicate, file-valued, unknown, and inexact fields", quickActionInput.includes("form.getAll(name)")
  && quickActionInput.includes('typeof values[0] !== "string"')
  && quickActionInput.includes("!knownFields.has(key)")
  && quickActionInput.includes("canonicalQuestionIds.has(field.value)"));

const failed = checks.filter((entry) => !entry.ok);
if (checks.length !== 137) throw new Error(`Expected 137 regression checks, found ${checks.length}.`);
if (failed.length) {
  console.error(`DSA progress regression failed:\n- ${failed.map((entry) => entry.name).join("\n- ")}`);
  process.exit(1);
}
console.log(`DSA progress regression passed: ${checks.length}/${checks.length} canonical identity, derivation, privacy, routing, and context checks.`);
