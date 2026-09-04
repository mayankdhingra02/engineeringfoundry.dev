import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { priorityCompanyGuides } from "../data/company-guides/v1.ts";
import { COMPANY_GUIDE_REVIEW_AFTER_DAYS, companyGuideFreshness } from "../lib/company-guides/freshness.ts";
import { sanitizedFeedbackPageContext } from "../lib/feedback/model.ts";
import { isSupabaseConfigured } from "../lib/account-platform.ts";
import {
  ADMIN_FEEDBACK_QUEUE_LIMIT,
  AdminPrivateDataUnavailableError,
  isCanonicalAdminFeedbackId,
  resolveAdminCountResult,
  resolveAdminFeedbackDetailResult,
  resolveAdminFeedbackPage,
  resolveAdminFeedbackQueueResult,
  resolveAdminMembershipResult,
} from "../lib/admin/query-results.ts";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [migration, revisionMigration, feedbackAction, feedbackForm, publicFeedbackPage, publicSupabase, adminAuth, adminQueryResults, adminActions, adminLayout, adminHome, errorPage, styles, feedbackPage, feedbackDetail, experiencePage, experienceQueries, experiencePrivateState, experienceActionInput, healthPage, privacyRoutes, analyticsProperties, analytics, exporter, privacyPage, contactPage, operationsDoc, requirementsSource, workflow, packageJson] = await Promise.all([
  read("supabase/migrations/202608230001_create_feedback_admin_operations.sql"),
  read("supabase/migrations/202609040003_save_interview_experience_if_revision.sql"),
  read("features/feedback/actions.ts"),
  read("features/feedback/feedback-form.tsx"),
  read("app/feedback/page.tsx"),
  read("lib/supabase/public.ts"),
  read("lib/admin/auth.ts"),
  read("lib/admin/query-results.ts"),
  read("features/admin/actions.ts"),
  read("app/admin/layout.tsx"),
  read("app/admin/page.tsx"),
  read("app/error.tsx"),
  read("app/globals.css"),
  read("app/admin/feedback/page.tsx"),
  read("app/admin/feedback/[id]/page.tsx"),
  read("app/admin/interview-experiences/page.tsx"),
  read("lib/interview-experiences/queries.ts"),
  read("lib/interview-experiences/private-state.ts"),
  read("lib/interview-experiences/action-input.ts"),
  read("app/admin/operational-health/page.tsx"),
  read("lib/privacy/routes.ts"),
  read("lib/privacy/analytics-properties.ts"),
  read("lib/analytics.ts"),
  read("lib/account/export.ts"),
  read("app/privacy/page.tsx"),
  read("app/contact/page.tsx"),
  read("docs/feedback-admin-operations.md"),
  read("docs/product-blueprint/registry/requirements.json"),
  read(".github/workflows/ci.yml"),
  read("package.json"),
]);

for (const marker of ["admin_memberships", "feedback_submissions", "feedback_submission_rate_limits", "admin_audit_events", "enable row level security", "is_current_admin", "submit_feedback_submission", "update_feedback_submission", "moderate_interview_experience", "admins read feedback submissions", "admins read all interview experiences", "revoke all on table", "contact_consent", "reference_id", "auth.uid()", "No raw IP addresses are stored"]) {
  assert.ok(migration.includes(marker), `P0.8 migration is missing ${marker}`);
}
assert.match(migration, /grant execute on function public\.submit_feedback_submission\(jsonb,text\) to anon, authenticated/, "anonymous feedback is not limited to the controlled submission RPC");
assert.match(migration, /grant select on table public\.feedback_submissions, public\.admin_audit_events to authenticated/, "feedback/admin reads are not least-privilege grants");
assert.ok(!/grant (insert|update|delete) on table public\.feedback_submissions to authenticated/.test(migration), "users received a direct feedback mutation grant");
assert.match(migration, /actor_id uuid references auth\.users\(id\) on delete set null/, "account deletion does not remove feedback account linkage");
assert.match(migration, /admin_actor_id uuid references auth\.users\(id\) on delete set null/, "minimal audit retention is not preserved safely");
assert.match(migration, /case when old_status is distinct from next_status then 'feedback_status_changed' else 'feedback_note_updated' end/, "feedback mutations do not create an audit event");
assert.match(migration, /'experience_moderated'/, "experience moderation does not create an audit event");
assert.ok(exporter.includes("export_own_feedback_submissions"), "account export bypasses the narrow actor-derived feedback export boundary");

const queryFailure = { message: "private query failed" };
const feedbackQueueItemAt = (index) => {
  const hex = index.toString(16);
  return {
    id: `aaaaaaaa-aaaa-4aaa-8aaa-${hex.padStart(12, "0")}`,
    reference_id: `EF-FB-${hex.padStart(32, "0").toUpperCase()}`,
    category: "privacy_safety",
    status: "new",
    page_context: "/feedback",
    message: "Please review this private report.",
    created_at: "2026-09-04T12:00:00.000Z",
  };
};
const validFeedbackQueueItem = feedbackQueueItemAt(1);
const validFeedbackDetail = {
  ...validFeedbackQueueItem,
  contact_email: "reporter@example.com",
  contact_consent: true,
  submitted_as_authenticated: false,
  admin_note: null,
};

assert.equal(resolveAdminMembershipResult({ data: true, error: null }), true);
assert.equal(resolveAdminMembershipResult({ data: false, error: null }), false);
assert.equal(isCanonicalAdminFeedbackId(validFeedbackQueueItem.id), true);
for (const value of [null, "", "not-a-uuid", validFeedbackQueueItem.id.toUpperCase()]) {
  assert.equal(isCanonicalAdminFeedbackId(value), false, `accepted noncanonical feedback id ${String(value)}`);
}
assert.equal(resolveAdminCountResult({ count: 0, error: null }), 0);
assert.equal(resolveAdminCountResult({ count: 42, error: null }), 42);
assert.equal(resolveAdminFeedbackPage(undefined), 1);
assert.equal(resolveAdminFeedbackPage("1"), 1);
assert.equal(resolveAdminFeedbackPage("100000"), 100_000);
for (const value of [null, 2, "", "0", "01", "1.5", "100001", "not-a-page"]) {
  assert.equal(resolveAdminFeedbackPage(value), 1, `invalid feedback page ${String(value)} did not fall back to page one`);
}
assert.deepEqual(resolveAdminFeedbackQueueResult({ data: [], error: null, count: 0 }, 1), {
  items: [],
  limit: ADMIN_FEEDBACK_QUEUE_LIMIT,
  page: 1,
  totalCount: 0,
  totalPages: 1,
});
assert.deepEqual(
  resolveAdminFeedbackQueueResult({ data: [validFeedbackQueueItem], error: null, count: 1 }, 1),
  { items: [validFeedbackQueueItem], limit: ADMIN_FEEDBACK_QUEUE_LIMIT, page: 1, totalCount: 1, totalPages: 1 },
);
assert.deepEqual(
  resolveAdminFeedbackDetailResult({ data: validFeedbackDetail, error: null }),
  validFeedbackDetail,
);
assert.equal(resolveAdminFeedbackDetailResult({ data: null, error: null }), null);

const firstHundred = Array.from(
  { length: ADMIN_FEEDBACK_QUEUE_LIMIT },
  (_, index) => feedbackQueueItemAt(index + 1),
);
const firstFeedbackPage = resolveAdminFeedbackQueueResult({
  data: firstHundred,
  error: null,
  count: ADMIN_FEEDBACK_QUEUE_LIMIT + 1,
}, 1);
assert.equal(firstFeedbackPage.items.length, ADMIN_FEEDBACK_QUEUE_LIMIT);
assert.equal(firstFeedbackPage.totalPages, 2);
const secondFeedbackPage = resolveAdminFeedbackQueueResult({
  data: [feedbackQueueItemAt(101)],
  error: null,
  count: ADMIN_FEEDBACK_QUEUE_LIMIT + 1,
}, 2);
assert.equal(secondFeedbackPage.items.length, 1);
assert.equal(secondFeedbackPage.page, 2);
assert.equal(secondFeedbackPage.totalPages, 2);
assert.deepEqual(resolveAdminFeedbackQueueResult({ data: [], error: null, count: 1 }, 2), {
  items: [],
  limit: ADMIN_FEEDBACK_QUEUE_LIMIT,
  page: 2,
  totalCount: 1,
  totalPages: 1,
});

for (const input of [
  null,
  {},
  { data: true },
  { data: true, error: null, extra: true },
  { data: null, error: null },
  { data: false, error: queryFailure },
]) {
  assert.throws(
    () => resolveAdminMembershipResult(input),
    AdminPrivateDataUnavailableError,
    "malformed or failed admin membership lookup became a denial",
  );
}

for (const input of [
  null,
  {},
  { count: 0 },
  { count: 0, error: null, extra: true },
  { count: null, error: null },
  { count: -1, error: null },
  { count: 1.5, error: null },
  { count: 0, error: queryFailure },
]) {
  assert.throws(
    () => resolveAdminCountResult(input),
    AdminPrivateDataUnavailableError,
    "malformed or failed admin count became an authoritative zero",
  );
}

for (const input of [
  null,
  {},
  { data: [] },
  { data: [], error: null, count: 0, extra: true },
  { data: null, error: null, count: 0 },
  { data: [], error: queryFailure, count: 0 },
  { data: [{ ...validFeedbackQueueItem }], error: null, count: 0 },
  { data: [], error: null, count: 1 },
  { data: [...firstHundred, validFeedbackQueueItem], error: null, count: 101 },
  { data: [validFeedbackQueueItem, validFeedbackQueueItem], error: null, count: 2 },
  { data: [{ ...validFeedbackQueueItem, id: validFeedbackQueueItem.id.toUpperCase() }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, reference_id: validFeedbackQueueItem.reference_id.toLowerCase() }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, category: "unknown" }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, status: "unknown" }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, page_context: {} }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, page_context: "not-a-path" }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, message: null }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, message: "" }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, message: "x".repeat(5_001) }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, created_at: "September 4, 2026" }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, created_at: "not-a-timestamp" }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, created_at: "2026-09-04T12:00:00.1234567Z" }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, page_context: "x\u0000y" }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, created_at: undefined }], error: null, count: 1 },
  { data: [{ ...validFeedbackQueueItem, unexpected: true }], error: null, count: 1 },
]) {
  assert.throws(
    () => resolveAdminFeedbackQueueResult(input, 1),
    AdminPrivateDataUnavailableError,
    "malformed or failed admin feedback queue became an honest empty/list",
  );
}
for (const page of [0, -1, 1.5, 100_001]) {
  assert.throws(
    () => resolveAdminFeedbackQueueResult({ data: [], error: null, count: 0 }, page),
    AdminPrivateDataUnavailableError,
    `accepted invalid resolved feedback page ${page}`,
  );
}

for (const input of [
  null,
  {},
  { data: null },
  { data: null, error: null, extra: true },
  { data: null, error: queryFailure },
  { data: { ...validFeedbackDetail, contact_email: "x".repeat(255) }, error: null },
  { data: { ...validFeedbackDetail, contact_email: "not-an-email" }, error: null },
  { data: { ...validFeedbackDetail, contact_consent: "yes" }, error: null },
  { data: { ...validFeedbackDetail, submitted_as_authenticated: "yes" }, error: null },
  { data: { ...validFeedbackDetail, admin_note: "x".repeat(2_001) }, error: null },
  { data: { ...validFeedbackDetail, admin_note: "x\u0000y" }, error: null },
  { data: { ...validFeedbackDetail, admin_note: undefined }, error: null },
  { data: { ...validFeedbackDetail, unexpected: true }, error: null },
]) {
  assert.throws(
    () => resolveAdminFeedbackDetailResult(input),
    AdminPrivateDataUnavailableError,
    "malformed or failed admin detail became a genuine not-found result",
  );
}
assert.equal(
  new AdminPrivateDataUnavailableError().message,
  "Private admin data is temporarily unavailable. Please try again.",
);

assert.equal(sanitizedFeedbackPageContext("/behavioral/stories/secret-id?token=nope#x"), "/behavioral/stories/...", "private Behavioral IDs are retained in feedback context");
assert.equal(sanitizedFeedbackPageContext("/applications/abc-123?email=private@example.test"), "/applications/...", "private application context is not collapsed");
assert.equal(sanitizedFeedbackPageContext("/companies/openai?utm_source=test"), "/companies/openai", "public feedback context should strip query strings");
assert.equal(sanitizedFeedbackPageContext("https://evil.example/steal"), "/feedback", "external feedback context is accepted");
for (const marker of ["randomUUID", "createHash", "httpOnly: true", "contact_consent", "submit_feedback_submission", "5000", "sanitizedFeedbackPageContext"]) assert.ok(feedbackAction.includes(marker), `feedback action is missing ${marker}`);
assert.ok(!feedbackAction.includes("SUPABASE_SERVICE_ROLE_KEY") && !feedbackAction.includes("createSupabaseAdminClient"), "feedback action exposes an admin credential boundary");
assert.ok(!feedbackAction.includes("createSupabaseServerClient"), "actorless feedback still depends on the account-gated session client");
assert.match(feedbackAction, /const supabase = actor\?\.supabase \?\? createSupabasePublicClient\(\);/, "feedback must preserve the actor-bound client and use the sessionless public client only as the actorless fallback");
const actorResolutionIndex = feedbackAction.indexOf("const actor = await getAuthenticatedActor();");
const clientResolutionIndex = feedbackAction.indexOf("const supabase = actor?.supabase ?? createSupabasePublicClient();");
const unavailableReturnIndex = feedbackAction.indexOf('if (!supabase) return { status: "error", message: "Feedback is unavailable in this environment. Please try again later." };');
const anonymousSubjectIndex = feedbackAction.indexOf("const anonymousSubjectHash = actor ? null : await anonymousSubject();");
const rpcIndex = feedbackAction.indexOf('supabase.rpc("submit_feedback_submission"');
assert.ok(actorResolutionIndex >= 0 && actorResolutionIndex < clientResolutionIndex, "feedback must resolve the authenticated actor before choosing its client");
assert.ok(clientResolutionIndex < unavailableReturnIndex && unavailableReturnIndex < anonymousSubjectIndex, "unconfigured feedback must return before creating or reading the anonymous subject cookie");
assert.ok(anonymousSubjectIndex < rpcIndex, "anonymous rate-limit identity must be ready before the controlled feedback RPC");
for (const marker of ['import "server-only"', "isSupabaseConfigured()", "persistSession: false", "autoRefreshToken: false", "detectSessionInUrl: false"]) assert.ok(publicSupabase.includes(marker), `public feedback fallback is missing its sessionless boundary: ${marker}`);
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalAccountsEnabled = process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED;
try {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://feedback-public.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
  process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED = "false";
  assert.equal(isSupabaseConfigured(), true, "configured anonymous feedback must remain available while accounts are disabled");
  process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED = "true";
  assert.equal(isSupabaseConfigured(), true, "configured anonymous feedback must remain available to signed-out visitors while accounts are enabled");
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(isSupabaseConfigured(), false, "anonymous feedback must fail closed when public Supabase configuration is incomplete");
} finally {
  if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  if (originalSupabaseKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseKey;
  if (originalAccountsEnabled === undefined) delete process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED;
  else process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED = originalAccountsEnabled;
}
for (const marker of ["useActionState", "role=\"alert\"", "role=\"status\"", "contact_consent", "5,000", "referenceId"]) assert.ok(feedbackForm.includes(marker), `feedback form is missing ${marker}`);
for (const marker of [
  'aria-describedby={state.fieldErrors?.category ? "feedback-category-error" : undefined}',
  'aria-describedby={state.fieldErrors?.message ? "feedback-message-help feedback-message-error" : "feedback-message-help"}',
  'aria-describedby={state.fieldErrors?.contact_email ? "feedback-contact-error" : undefined}',
]) assert.ok(feedbackForm.includes(marker), `feedback form does not conditionally reference an existing description: ${marker}`);
for (const marker of [
  'id="feedback-category-error"',
  'id="feedback-message-help"',
  'id="feedback-message-error"',
  'id="feedback-contact-error"',
  'id="feedback-contact-consent"',
  'aria-invalid={Boolean(state.fieldErrors?.contact_consent)}',
  'aria-describedby={state.fieldErrors?.contact_consent ? "feedback-contact-consent-error" : undefined}',
  'id="feedback-contact-consent-error"',
]) assert.ok(feedbackForm.includes(marker), `feedback field/error linkage is missing ${marker}`);
assert.ok(!feedbackForm.includes('aria-describedby="feedback-message-help feedback-message-error"'), "feedback message must not reference an absent error node before validation fails");

for (const marker of [
  "useEffect(() => {",
  "if (handledStateRef.current === state) return;",
  "if (state.status !== \"error\" || !state.fieldErrors || userResumedEditing) return;",
  "{ error: state.fieldErrors.category, control: categoryRef.current }",
  "{ error: state.fieldErrors.message, control: messageRef.current }",
  "{ error: state.fieldErrors.contact_email, control: contactEmailRef.current }",
  "{ error: state.fieldErrors.contact_consent, control: contactConsentRef.current }",
  "].find(({ error, control }) => Boolean(error && control))?.control",
  "firstInvalidControl?.focus()",
  "}, [state]);",
]) assert.ok(feedbackForm.includes(marker), `returned feedback validation state lacks its ordered first-invalid focus contract: ${marker}`);
for (const marker of [
  "const submissionInFlightRef = useRef(false);",
  "const editedSinceSubmitRef = useRef(false);",
  "onSubmitCapture={() => {\n      submissionInFlightRef.current = true;\n      editedSinceSubmitRef.current = false;\n    }}",
  "onInputCapture={() => {\n      if (submissionInFlightRef.current) editedSinceSubmitRef.current = true;\n    }}",
  "const userResumedEditing = editedSinceSubmitRef.current;\n    submissionInFlightRef.current = false;\n    editedSinceSubmitRef.current = false;",
]) assert.ok(feedbackForm.includes(marker), `feedback submission/edit tracking is missing ${marker}`);
const successFocusIndex = feedbackForm.indexOf('if (state.status === "success") {\n      receiptTitleRef.current?.focus();');
const resumedEditingGuardIndex = feedbackForm.indexOf('if (state.status !== "error" || !state.fieldErrors || userResumedEditing) return;');
assert.ok(successFocusIndex >= 0 && resumedEditingGuardIndex > successFocusIndex, "success receipt focus must remain unconditional while resumed editing suppresses only returned-error focus recovery");
const categoryFocusIndex = feedbackForm.indexOf("{ error: state.fieldErrors.category, control: categoryRef.current }");
const messageFocusIndex = feedbackForm.indexOf("{ error: state.fieldErrors.message, control: messageRef.current }");
const emailFocusIndex = feedbackForm.indexOf("{ error: state.fieldErrors.contact_email, control: contactEmailRef.current }");
const consentFocusIndex = feedbackForm.indexOf("{ error: state.fieldErrors.contact_consent, control: contactConsentRef.current }");
assert.ok(categoryFocusIndex >= 0 && categoryFocusIndex < messageFocusIndex && messageFocusIndex < emailFocusIndex && emailFocusIndex < consentFocusIndex, "first-invalid focus order must follow the rendered category, message, email, and consent controls");
for (const marker of ["ref={categoryRef}", "ref={messageRef}", "ref={contactEmailRef}", "ref={contactConsentRef}"]) assert.ok(feedbackForm.includes(marker), `feedback focus target is not attached: ${marker}`);

assert.ok(successFocusIndex >= 0, "successful feedback state must focus its receipt heading after render");
assert.ok(feedbackForm.includes('<h2 ref={receiptTitleRef} id="feedback-receipt-title" tabIndex={-1}>'), "feedback receipt heading must be programmatically focusable without entering the tab order");
assert.ok(feedbackForm.includes('role="status" aria-live="polite" aria-atomic="true"'), "feedback receipt must announce as one polite atomic status update");
assert.ok(publicFeedbackPage.includes("const feedbackAvailable = isSupabaseConfigured();"), "feedback route does not derive intake availability at the server boundary");
assert.match(publicFeedbackPage, /feedbackAvailable \? <FeedbackForm \/> : <section/, "feedback route does not keep the live form behind the configured-intake branch");
assert.ok(contactPage.includes("const feedbackAvailable = isSupabaseConfigured();"), "contact route does not derive private-feedback availability at the server boundary");
assert.match(contactPage, /feedbackAvailable \? <>\s*<h2>Private website feedback<\/h2>/, "contact route does not keep its private-feedback handoff behind the configured-intake branch");

for (const marker of ["getAuthenticatedActor", "is_current_admin", "resolveAdminMembershipResult", "notFound"]) assert.ok(adminAuth.includes(marker), `admin guard is missing server-side ${marker}`);
assert.ok(!adminAuth.includes("process.env.NEXT_PUBLIC") && !adminAuth.includes("email"), "admin authorization relies on a public/browser signal");
assert.ok(adminAuth.indexOf("resolveAdminMembershipResult({ data, error })") < adminAuth.indexOf("notFound()"), "admin membership query failures are still collapsed into ordinary denial");
for (const marker of ["AdminPrivateDataUnavailableError", "isCanonicalAdminFeedbackId", "resolveAdminFeedbackPage", "resolveAdminMembershipResult", "resolveAdminCountResult", "resolveAdminFeedbackQueueResult", "resolveAdminFeedbackDetailResult", "ADMIN_FEEDBACK_QUEUE_LIMIT"]) assert.ok(adminQueryResults.includes(marker), `admin private-read result boundary lacks ${marker}`);
for (const marker of ["update_feedback_submission", "moderate_interview_experience_if_revision", "parseInterviewExperienceModerationInput", "parseInterviewExperienceMutationResult", "requireAdminActor", "revalidatePath"]) assert.ok(adminActions.includes(marker), `admin mutation action is missing ${marker}`);
assert.ok(!adminActions.includes('rpc("moderate_interview_experience"'), "admin production code still calls the retired moderation RPC");
assert.ok(!adminActions.includes("createSupabaseAdminClient") && !adminActions.includes("service_role"), "admin UI uses the service role as a login");
for (const marker of ["robots", "force-dynamic", "requireAdminActor"]) assert.ok(adminLayout.includes(marker), `admin layout is missing private-route ${marker}`);
for (const marker of ["Feedback requiring triage", "Experiences requiring moderation", "Company guides requiring review", "Operational configuration"]) assert.ok(adminHome.includes(marker), `admin home is missing ${marker}`);
assert.equal((adminHome.match(/resolveAdminCountResult/g) ?? []).length, 3, "admin dashboard does not resolve both private counts through the strict boundary");
assert.ok(!adminHome.includes(".count ?? 0"), "admin dashboard still converts failed private counts to zero");
assert.ok(errorPage.includes('role="alert"') && errorPage.includes("onClick={retry}"), "admin private-read failures lack the inherited accessible retry boundary");
for (const marker of ['{ count: "exact" }', 'order("created_at", { ascending: false })', 'order("id", { ascending: true })', ".range(from, from + ADMIN_FEEDBACK_QUEUE_LIMIT - 1)", "resolveAdminFeedbackPage(search.page)", "resolveAdminFeedbackQueueResult", "queue.items", "queue.totalCount", "queue.totalPages", "redirect(feedbackQueueHref(queue.totalPages, status, category))", 'aria-label="Feedback queue pages"', "feedbackQueueHref(page - 1, status, category)", "feedbackQueueHref(page + 1, status, category)"]) assert.ok(feedbackPage.includes(marker), `admin feedback queue lacks truthful result or pagination handling: ${marker}`);
for (const marker of [".admin-pagination {", ".admin-pagination .button", ".admin-pagination > div { width: 100%; justify-content: space-between; }"]) assert.ok(styles.includes(marker), `admin feedback pagination lacks responsive readable styling: ${marker}`);
assert.ok(!feedbackPage.includes("const { data } = await query"), "admin feedback queue still discards its query error");
const feedbackDetailResolve = feedbackDetail.indexOf("resolveAdminFeedbackDetailResult({ data: result.data, error: result.error })");
const feedbackDetailNotFound = feedbackDetail.indexOf("if (!data) notFound()", feedbackDetailResolve);
assert.ok(feedbackDetailResolve >= 0 && feedbackDetailNotFound > feedbackDetailResolve, "feedback detail does not distinguish query failure from a genuine missing row before notFound");
assert.ok(feedbackDetail.indexOf("if (!isCanonicalAdminFeedbackId(id)) notFound()") < feedbackDetail.indexOf('.from("feedback_submissions")'), "malformed feedback routes do not fail as not found before the private item query");
assert.ok(!feedbackDetail.includes("const { data } = await actor.supabase"), "feedback detail still discards its query error");
for (const source of [feedbackPage, feedbackDetail, experiencePage, healthPage]) assert.ok(source.includes("requireAdminActor") || source.includes("operationalHealth"), "admin surface lacks bounded operational access");
for (const marker of ["preparation_lessons", "public_identity", "publication_consent", "interview_experience_rounds(position,round_type,topic_labels,process_notes)", 'in("status", ["submitted", "needs_changes"])', "resolveAdminInterviewExperienceQueue"]) assert.ok(experienceQueries.includes(marker), `experience moderation query must strictly project submitted public context: ${marker}`);
for (const marker of ["Preparation lessons", "experience.preparation_lessons", "Public attribution:", "experience.public_identity", "experience.publication_consent", "Submitted round context", "round.topic_labels", "round.process_notes", "revision={experience.updated_at}"]) assert.ok(experiencePage.includes(marker), `experience moderation must expose the exact revision and every submitted public field: ${marker}`);
for (const marker of ["INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT", 'return { status: "unavailable" }', "preparation_lessons", "public_identity"]) assert.ok(experiencePrivateState.includes(marker), `experience moderation result boundary is missing ${marker}`);
for (const marker of ["parseInterviewExperienceModerationInput", "INTERVIEW_EXPERIENCE_MODERATION_CONFLICT_ERROR", "INTERVIEW_EXPERIENCE_MODERATION_SAVED_MESSAGE"]) assert.ok(experienceActionInput.includes(marker), `experience moderation input/result contract is missing ${marker}`);
for (const marker of ["moderate_interview_experience_if_revision(uuid,timestamptz,text,text)", "Revision-checked interview experience moderation is required", "using errcode = '0A000'"]) assert.ok(revisionMigration.includes(marker), `revision-checked moderation migration is missing ${marker}`);
assert.ok(privacyRoutes.includes('"/admin"'), "admin route is absent from canonical private-route protection");

for (const name of ["message", "contact_email", "reference_id", "admin_note", "moderation_note"]) assert.ok(analyticsProperties.includes(`"${name}"`), `feedback/admin private field ${name} is not analytics-denied`);
assert.ok(!analytics.includes("feedback_submitted") && !analytics.includes("admin_"), "P0.8 adds unreviewed feedback or admin analytics");
assert.ok(exporter.includes('EXPORT_VERSION = "1.5"') && exporter.includes('collectAccountExportRows("feedback_submissions"') && exporter.includes('feedback: { submissions: feedbackSubmissions }'), "account export does not include only owned feedback under the bumped schema");
assert.ok(privacyPage.includes("Private feedback") && privacyPage.includes("deleting the account removes the account link"), "privacy documentation lacks feedback lifecycle semantics");
assert.ok(contactPage.includes('href="/feedback"'), "contact page lacks a private feedback entry point");
for (const marker of ["WAF", "admin_memberships", "not a CMS", "180-day review reminder", "never renders values for secrets", "failed or malformed counts cannot render as zero", "failed item lookup cannot become a 404", "pages through at most 100 reports at a time", "No queue result is silently truncated"]) assert.ok(operationsDoc.includes(marker), `operations documentation is missing ${marker}`);
const supportingRequirement = JSON.parse(requirementsSource).requirements.find((requirement) => requirement.id === "EF-SUP");
assert.ok(supportingRequirement, "EF-SUP governance requirement is missing");
for (const path of ["app/admin/feedback", "app/admin/page.tsx", "app/error.tsx", "lib/admin/auth.ts", "lib/admin/query-results.ts", "scripts/test-feedback-admin-operations.mjs"]) {
  assert.ok(supportingRequirement.code_paths.includes(path), `EF-SUP lacks admin read-truth path ${path}`);
}
assert.ok(supportingRequirement.content_paths.includes("docs/feedback-admin-operations.md"), "EF-SUP lacks admin operations documentation attribution");
assert.ok(supportingRequirement.test_commands.includes("npm run test:feedback-admin-operations"), "EF-SUP lacks its enrolled admin regression command");
assert.ok(supportingRequirement.acceptance_criteria.some((criterion) => criterion.includes("feedback queue uses an exact filtered count") && criterion.includes("shared actor authentication-service-versus-anonymous ambiguity remains outside this boundary")), "EF-SUP overclaims or omits the strict admin read-truth boundary");

const now = new Date("2027-02-17T12:00:00Z");
const freshness = companyGuideFreshness(priorityCompanyGuides, now);
assert.equal(freshness.length, 10, "all ten priority company guides must appear in operations");
assert.ok(freshness.every((item) => item.sourceUrl.startsWith("https://")), "company freshness copies or loses an authoritative source URL");
assert.equal(freshness[0].status, "review_due", "freshness threshold is not deterministic");
assert.equal(COMPANY_GUIDE_REVIEW_AFTER_DAYS, 180, "freshness reminder threshold drifted");
assert.ok(!Object.hasOwn(priorityCompanyGuides[0], "freshness"), "freshness operation mutates public guide content");

assert.ok(STATIC_STEPS.some((step) => step.args?.includes("test:feedback-admin-operations")) && workflow.includes("npm run qualify:static"), "P0.8 static qualification is not in local and hosted CI parity");
assert.ok(JSON.parse(packageJson).scripts["test:feedback-admin-operations"], "P0.8 test command is absent");
console.log("PASS  P0.8 feedback, strict admin read truth, authorization, RLS/RPC boundaries, lifecycle semantics, source-level feedback focus semantics, company freshness, privacy, and CI parity hold. Actual browser focus remains future rendered coverage.");
