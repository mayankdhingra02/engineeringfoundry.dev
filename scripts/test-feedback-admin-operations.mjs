import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { priorityCompanyGuides } from "../data/company-guides/v1.ts";
import { COMPANY_GUIDE_REVIEW_AFTER_DAYS, companyGuideFreshness } from "../lib/company-guides/freshness.ts";
import { sanitizedFeedbackPageContext } from "../lib/feedback/model.ts";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [migration, feedbackAction, feedbackForm, adminAuth, adminActions, adminLayout, adminHome, feedbackPage, feedbackDetail, experiencePage, healthPage, privacyRoutes, analyticsProperties, analytics, exporter, privacyPage, contactPage, operationsDoc, workflow, packageJson] = await Promise.all([
  read("supabase/migrations/202608230001_create_feedback_admin_operations.sql"),
  read("features/feedback/actions.ts"),
  read("features/feedback/feedback-form.tsx"),
  read("lib/admin/auth.ts"),
  read("features/admin/actions.ts"),
  read("app/admin/layout.tsx"),
  read("app/admin/page.tsx"),
  read("app/admin/feedback/page.tsx"),
  read("app/admin/feedback/[id]/page.tsx"),
  read("app/admin/interview-experiences/page.tsx"),
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
for (const marker of ["useActionState", "role=\"alert\"", "role=\"status\"", "contact_consent", "5,000", "referenceId"]) assert.ok(feedbackForm.includes(marker), `feedback form is missing ${marker}`);

for (const marker of ["getAuthenticatedActor", "is_current_admin", "notFound"]) assert.ok(adminAuth.includes(marker), `admin guard is missing server-side ${marker}`);
assert.ok(!adminAuth.includes("process.env.NEXT_PUBLIC") && !adminAuth.includes("email"), "admin authorization relies on a public/browser signal");
for (const marker of ["update_feedback_submission", "moderate_interview_experience", "requireAdminActor", "revalidatePath"]) assert.ok(adminActions.includes(marker), `admin mutation action is missing ${marker}`);
assert.ok(!adminActions.includes("createSupabaseAdminClient") && !adminActions.includes("service_role"), "admin UI uses the service role as a login");
for (const marker of ["robots", "force-dynamic", "requireAdminActor"]) assert.ok(adminLayout.includes(marker), `admin layout is missing private-route ${marker}`);
for (const marker of ["Feedback requiring triage", "Experiences requiring moderation", "Company guides requiring review", "Operational configuration"]) assert.ok(adminHome.includes(marker), `admin home is missing ${marker}`);
for (const source of [feedbackPage, feedbackDetail, experiencePage, healthPage]) assert.ok(source.includes("requireAdminActor") || source.includes("operationalHealth"), "admin surface lacks bounded operational access");
for (const marker of ["interview_experience_rounds(position,round_type,topic_labels,process_notes)", "Submitted round context", "round.topic_labels", "round.process_notes"]) assert.ok(experiencePage.includes(marker), `experience moderation must expose submitted public round context: ${marker}`);
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
console.log("PASS  P0.8 feedback, admin authorization, RLS/RPC boundaries, lifecycle semantics, company freshness, privacy, and CI parity hold.");
