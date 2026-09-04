import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { priorityCompanyGuides } from "../data/company-guides/v1.ts";
import { COMPANY_GUIDE_REVIEW_AFTER_DAYS, companyGuideFreshness } from "../lib/company-guides/freshness.ts";
import { sanitizedFeedbackPageContext } from "../lib/feedback/model.ts";
import { isSupabaseConfigured } from "../lib/account-platform.ts";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [migration, revisionMigration, feedbackAction, feedbackForm, publicFeedbackPage, publicSupabase, adminAuth, adminActions, adminLayout, adminHome, feedbackPage, feedbackDetail, experiencePage, experienceQueries, experiencePrivateState, experienceActionInput, healthPage, privacyRoutes, analyticsProperties, analytics, exporter, privacyPage, contactPage, operationsDoc, workflow, packageJson] = await Promise.all([
  read("supabase/migrations/202608230001_create_feedback_admin_operations.sql"),
  read("supabase/migrations/202609040003_save_interview_experience_if_revision.sql"),
  read("features/feedback/actions.ts"),
  read("features/feedback/feedback-form.tsx"),
  read("app/feedback/page.tsx"),
  read("lib/supabase/public.ts"),
  read("lib/admin/auth.ts"),
  read("features/admin/actions.ts"),
  read("app/admin/layout.tsx"),
  read("app/admin/page.tsx"),
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

for (const marker of ["getAuthenticatedActor", "is_current_admin", "notFound"]) assert.ok(adminAuth.includes(marker), `admin guard is missing server-side ${marker}`);
assert.ok(!adminAuth.includes("process.env.NEXT_PUBLIC") && !adminAuth.includes("email"), "admin authorization relies on a public/browser signal");
for (const marker of ["update_feedback_submission", "moderate_interview_experience_if_revision", "parseInterviewExperienceModerationInput", "parseInterviewExperienceMutationResult", "requireAdminActor", "revalidatePath"]) assert.ok(adminActions.includes(marker), `admin mutation action is missing ${marker}`);
assert.ok(!adminActions.includes('rpc("moderate_interview_experience"'), "admin production code still calls the retired moderation RPC");
assert.ok(!adminActions.includes("createSupabaseAdminClient") && !adminActions.includes("service_role"), "admin UI uses the service role as a login");
for (const marker of ["robots", "force-dynamic", "requireAdminActor"]) assert.ok(adminLayout.includes(marker), `admin layout is missing private-route ${marker}`);
for (const marker of ["Feedback requiring triage", "Experiences requiring moderation", "Company guides requiring review", "Operational configuration"]) assert.ok(adminHome.includes(marker), `admin home is missing ${marker}`);
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
for (const marker of ["WAF", "admin_memberships", "not a CMS", "180-day review reminder", "never renders values for secrets"]) assert.ok(operationsDoc.includes(marker), `operations documentation is missing ${marker}`);

const now = new Date("2027-02-17T12:00:00Z");
const freshness = companyGuideFreshness(priorityCompanyGuides, now);
assert.equal(freshness.length, 10, "all ten priority company guides must appear in operations");
assert.ok(freshness.every((item) => item.sourceUrl.startsWith("https://")), "company freshness copies or loses an authoritative source URL");
assert.equal(freshness[0].status, "review_due", "freshness threshold is not deterministic");
assert.equal(COMPANY_GUIDE_REVIEW_AFTER_DAYS, 180, "freshness reminder threshold drifted");
assert.ok(!Object.hasOwn(priorityCompanyGuides[0], "freshness"), "freshness operation mutates public guide content");

assert.ok(STATIC_STEPS.some((step) => step.args?.includes("test:feedback-admin-operations")) && workflow.includes("npm run qualify:static"), "P0.8 static qualification is not in local and hosted CI parity");
assert.ok(JSON.parse(packageJson).scripts["test:feedback-admin-operations"], "P0.8 test command is absent");
console.log("PASS  P0.8 feedback, admin authorization, RLS/RPC boundaries, lifecycle semantics, source-level feedback focus semantics, company freshness, privacy, and CI parity hold. Actual browser focus remains future rendered coverage.");
